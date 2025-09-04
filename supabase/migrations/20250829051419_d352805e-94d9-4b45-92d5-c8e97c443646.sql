-- Create users table for listener accounts
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'listener' CHECK (role IN ('listener', 'artist')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create artists table
CREATE TABLE public.artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  bio text,
  links jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create tracks table
CREATE TABLE public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES public.artists(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  duration integer, -- in seconds
  bpm integer,
  cover_url text,
  stream_url text,
  unique_listeners integer DEFAULT 0,
  total_plays integer DEFAULT 0,
  popularity_tier text DEFAULT 'emerging' CHECK (popularity_tier IN ('emerging', 'rising', 'established', 'popular')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create plays table to track listening sessions
CREATE TABLE public.plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  session_id text NOT NULL, -- for anonymous users
  completed boolean DEFAULT false,
  play_duration integer DEFAULT 0, -- seconds played
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create tags table for moods, genres, scenes
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('mood', 'genre', 'scene')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create track_tags junction table
CREATE TABLE public.track_tags (
  track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE,
  tag_id uuid REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (track_id, tag_id)
);

-- Create likes table
CREATE TABLE public.likes (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  track_id uuid REFERENCES public.tracks(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, track_id)
);

-- Create follows table
CREATE TABLE public.follows (
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  artist_id uuid REFERENCES public.artists(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, artist_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access to tracks, artists, tags
CREATE POLICY "Anyone can view tracks" ON public.tracks FOR SELECT USING (true);
CREATE POLICY "Anyone can view artists" ON public.artists FOR SELECT USING (true);
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Anyone can view track_tags" ON public.track_tags FOR SELECT USING (true);

-- Authenticated users can create plays
CREATE POLICY "Anyone can create plays" ON public.plays FOR INSERT WITH CHECK (true);

-- Users can manage their own likes and follows
CREATE POLICY "Users can manage their likes" ON public.likes 
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their follows" ON public.follows 
  FOR ALL USING (auth.uid() = user_id);

-- Function to update popularity tiers based on unique listeners
CREATE OR REPLACE FUNCTION update_popularity_tier(track_uuid uuid)
RETURNS void AS $$
DECLARE
  listener_count integer;
  new_tier text;
BEGIN
  -- Count unique listeners for this track
  SELECT COUNT(DISTINCT COALESCE(user_id::text, session_id))
  INTO listener_count
  FROM public.plays
  WHERE track_id = track_uuid;

  -- Determine tier based on listener count
  IF listener_count < 100 THEN
    new_tier := 'emerging';
  ELSIF listener_count < 1000 THEN
    new_tier := 'rising';
  ELSIF listener_count < 10000 THEN
    new_tier := 'established';
  ELSE
    new_tier := 'popular';
  END IF;

  -- Update the track
  UPDATE public.tracks 
  SET 
    unique_listeners = listener_count,
    popularity_tier = new_tier,
    updated_at = now()
  WHERE id = track_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to update track stats after new play
CREATE OR REPLACE FUNCTION update_track_stats()
RETURNS trigger AS $$
BEGIN
  -- Update total plays count
  UPDATE public.tracks 
  SET total_plays = total_plays + 1
  WHERE id = NEW.track_id;
  
  -- Update popularity tier
  PERFORM update_popularity_tier(NEW.track_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when new play is recorded
CREATE TRIGGER update_track_stats_trigger
  AFTER INSERT ON public.plays
  FOR EACH ROW
  EXECUTE FUNCTION update_track_stats();

-- Insert sample tags
INSERT INTO public.tags (name, type) VALUES
  ('Chill', 'mood'),
  ('Energetic', 'mood'),
  ('Dreamy', 'mood'),
  ('Dark', 'mood'),
  ('Uplifting', 'mood'),
  ('Electronic', 'genre'),
  ('Indie Rock', 'genre'),
  ('Ambient', 'genre'),
  ('Hip Hop', 'genre'),
  ('Folk', 'genre'),
  ('Underground', 'scene'),
  ('Local', 'scene'),
  ('Experimental', 'scene'),
  ('Bedroom Pop', 'scene');

-- Insert sample artists
INSERT INTO public.artists (name, bio) VALUES
  ('Luna Waves', 'Dreamy electronic soundscapes from Portland'),
  ('Echo Chamber', 'Indie rock trio exploring sonic boundaries'),
  ('Midnight Frequency', 'Late-night ambient compositions'),
  ('Solar Flare', 'High-energy electronic beats'),
  ('Velvet Moss', 'Folk-inspired indie with experimental touches'),
  ('Neon Drift', 'Retro-futuristic synthwave');

-- Insert sample tracks with varied popularity
INSERT INTO public.tracks (artist_id, title, description, duration, bpm, cover_url, unique_listeners, total_plays, popularity_tier) 
SELECT 
  a.id,
  t.title,
  t.description,
  t.duration,
  t.bpm,
  t.cover_url,
  t.unique_listeners,
  t.total_plays,
  CASE 
    WHEN t.unique_listeners < 100 THEN 'emerging'
    WHEN t.unique_listeners < 1000 THEN 'rising'
    WHEN t.unique_listeners < 10000 THEN 'established'
    ELSE 'popular'
  END as popularity_tier
FROM public.artists a
CROSS JOIN (VALUES
  ('Midnight Rain', 'Atmospheric downtempo with field recordings', 240, 85, '/src/assets/sample-cover-1.jpg', 45, 150),
  ('Digital Dreams', 'Glitchy ambient exploration', 300, 120, '/src/assets/sample-cover-2.jpg', 1200, 4500),
  ('Neon Nights', 'Synthwave journey through cyberpunk landscapes', 195, 128, '/src/assets/sample-cover-3.jpg', 15000, 50000),
  ('Forest Echoes', 'Organic folk with electronic textures', 280, 95, '/src/assets/sample-cover-1.jpg', 850, 2100),
  ('Sunrise', 'Uplifting indie rock anthem', 220, 140, '/src/assets/sample-cover-2.jpg', 25000, 80000),
  ('Void Walker', 'Dark ambient horror soundscape', 360, 60, '/src/assets/sample-cover-3.jpg', 25, 80)
) t(title, description, duration, bpm, cover_url, unique_listeners, total_plays)
WHERE a.name IN ('Luna Waves', 'Echo Chamber', 'Midnight Frequency', 'Solar Flare', 'Velvet Moss', 'Neon Drift')
LIMIT 6;