-- Phase 1: Fix RLS policies and set up storage

-- Fix users table RLS - allow user creation and proper viewing
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile" 
ON public.users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" 
ON public.users 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.users 
FOR UPDATE 
USING (auth.uid() = id);

-- Fix plays table RLS - allow viewing own plays and create plays
DROP POLICY IF EXISTS "Anyone can create plays" ON public.plays;

CREATE POLICY "Anyone can create plays" 
ON public.plays 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own plays" 
ON public.plays 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create storage buckets for audio files and cover art
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('audio-files', 'audio-files', false),
  ('cover-art', 'cover-art', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for audio files (private)
CREATE POLICY "Authenticated users can upload audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own audio files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for cover art (public)
CREATE POLICY "Anyone can view cover art" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cover-art');

CREATE POLICY "Authenticated users can upload cover art" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'cover-art' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add missing RLS policies for content creation
CREATE POLICY "Users can create their own artist profile" 
ON public.artists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artist profile" 
ON public.artists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Artists can create their own tracks" 
ON public.tracks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.artists 
    WHERE id = artist_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Artists can update their own tracks" 
ON public.tracks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.artists 
    WHERE id = artist_id AND user_id = auth.uid()
  )
);