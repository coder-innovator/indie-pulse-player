-- Fix RLS policies for users table
CREATE POLICY "Users can view their own profile" ON public.users 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

-- Fix function search paths
CREATE OR REPLACE FUNCTION update_popularity_tier(track_uuid uuid)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION update_track_stats()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update total plays count
  UPDATE public.tracks 
  SET total_plays = total_plays + 1
  WHERE id = NEW.track_id;
  
  -- Update popularity tier
  PERFORM update_popularity_tier(NEW.track_id);
  
  RETURN NEW;
END;
$$;