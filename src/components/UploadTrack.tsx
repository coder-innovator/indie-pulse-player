import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Music, Image as ImageIcon } from 'lucide-react';

interface UploadTrackProps {
  onUploadComplete?: () => void;
}

const UploadTrack: React.FC<UploadTrackProps> = ({ onUploadComplete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleDrop = useCallback((e: React.DragEvent, type: 'audio' | 'cover') => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (type === 'audio') {
      if (file && file.type.startsWith('audio/')) {
        setAudioFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an audio file (MP3, WAV, etc.)",
          variant: "destructive",
        });
      }
    } else {
      if (file && file.type.startsWith('image/')) {
        setCoverFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
      }
    }
  }, [toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim()) && tags.length < 5) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!title.trim() || !audioFile) {
      toast({
        title: "Missing information",
        description: "Please provide a title and audio file",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to upload tracks");
      }

      setUploadProgress(20);

      // Create or get artist profile
      let { data: artist } = await supabase
        .from('artists')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!artist) {
        const { data: newArtist, error: artistError } = await supabase
          .from('artists')
          .insert({
            user_id: user.id,
            name: user.email?.split('@')[0] || 'Unknown Artist',
            bio: 'New artist on SoundScape'
          })
          .select('id')
          .single();

        if (artistError) throw artistError;
        artist = newArtist;
      }

      setUploadProgress(40);

      // Upload audio file
      const audioFileName = `${user.id}/${Date.now()}-${audioFile.name}`;
      const { error: audioUploadError } = await supabase.storage
        .from('audio-files')
        .upload(audioFileName, audioFile);

      if (audioUploadError) throw audioUploadError;

      setUploadProgress(60);

      // Upload cover image if provided
      let coverUrl = null;
      if (coverFile) {
        const coverFileName = `${user.id}/${Date.now()}-${coverFile.name}`;
        const { error: coverUploadError } = await supabase.storage
          .from('cover-art')
          .upload(coverFileName, coverFile);

        if (coverUploadError) throw coverUploadError;

        const { data: coverUrlData } = supabase.storage
          .from('cover-art')
          .getPublicUrl(coverFileName);
        
        coverUrl = coverUrlData.publicUrl;
      }

      setUploadProgress(80);

      // Create track record
      const { data: track, error: trackError } = await supabase
        .from('tracks')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          artist_id: artist.id,
          stream_url: audioFileName,
          cover_url: coverUrl,
          duration: 0, // Will be updated by audio processing
        })
        .select('id')
        .single();

      if (trackError) throw trackError;

      setUploadProgress(90);

      // Add tags if any
      if (tags.length > 0) {
        // For now, we'll just store tags as metadata
        // In a full implementation, you'd create tag records and associations
        console.log('Tags to add:', tags);
      }

      setUploadProgress(100);

      toast({
        title: "Upload successful!",
        description: "Your track has been uploaded and is being processed.",
      });

      // Reset form
      setTitle('');
      setDescription('');
      setTags([]);
      setAudioFile(null);
      setCoverFile(null);
      
      onUploadComplete?.();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>Upload Your Track</span>
        </CardTitle>
        <CardDescription>
          Share your music with the SoundScape community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Track Info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Track Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter track title"
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your track..."
              disabled={uploading}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (max 5)</Label>
            <div className="flex space-x-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder="Add a tag"
                disabled={uploading || tags.length >= 5}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button 
                type="button" 
                onClick={addTag}
                disabled={uploading || tags.length >= 5 || !currentTag.trim()}
                variant="outline"
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                    <span>{tag}</span>
                    <button
                      onClick={() => removeTag(tag)}
                      disabled={uploading}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Audio File Upload */}
        <div className="space-y-2">
          <Label>Audio File *</Label>
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
            onDrop={(e) => handleDrop(e, 'audio')}
            onDragOver={handleDragOver}
          >
            {audioFile ? (
              <div className="flex items-center justify-center space-x-2 text-primary">
                <Music className="h-5 w-5" />
                <span>{audioFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAudioFile(null)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Music className="h-8 w-8 mx-auto text-muted-foreground" />
                <p>Drag & drop your audio file here</p>
                <p className="text-sm text-muted-foreground">or</p>
                <Button type="button" variant="outline" disabled={uploading}>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setAudioFile(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  Choose Audio File
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Cover Image Upload */}
        <div className="space-y-2">
          <Label>Cover Image (optional)</Label>
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors"
            onDrop={(e) => handleDrop(e, 'cover')}
            onDragOver={handleDragOver}
          >
            {coverFile ? (
              <div className="flex items-center justify-center space-x-2 text-primary">
                <ImageIcon className="h-5 w-5" />
                <span>{coverFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCoverFile(null)}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
                <p>Drag & drop your cover image here</p>
                <p className="text-sm text-muted-foreground">or</p>
                <Button type="button" variant="outline" disabled={uploading}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setCoverFile(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={uploading}
                  />
                  Choose Cover Image
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {/* Upload Button */}
        <Button 
          onClick={handleUpload} 
          className="w-full" 
          disabled={uploading || !title.trim() || !audioFile}
          size="lg"
        >
          {uploading ? "Uploading..." : "Upload Track"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UploadTrack;