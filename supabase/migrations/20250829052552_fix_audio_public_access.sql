-- Fix audio files bucket to be publicly accessible for streaming
-- This allows anyone to stream audio files while maintaining upload security

-- Update audio-files bucket to be public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audio-files';

-- Drop the restrictive SELECT policy for audio files
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;

-- Create new policy that allows anyone to view audio files (for streaming)
CREATE POLICY "Anyone can view audio files for streaming" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'audio-files');

-- Keep the restrictive INSERT policy for security
-- Users can only upload to their own folder
CREATE POLICY "Authenticated users can upload audio files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add policy to allow users to update their own audio files
CREATE POLICY "Users can update their own audio files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add policy to allow users to delete their own audio files
CREATE POLICY "Users can delete their own audio files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'audio-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
