import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Music, Image, X, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UploadTrackProps {
  onUploadComplete: () => void;
}

interface TrackData {
  title: string;
  description: string;
  bpm: number;
  mood: string;
  genre: string;
  scene: string;
  audioFile?: File | string | null;
  coverArt?: File | string | null;
}

const MOOD_OPTIONS = [
  'Energetic', 'Chill', 'Happy', 'Sad', 'Dark', 'Uplifting', 'Melancholic',
  'Aggressive', 'Peaceful', 'Nostalgic', 'Euphoric', 'Mysterious', 'Romantic',
  'Adventurous', 'Relaxed', 'Intense', 'Dreamy', 'Confident', 'Vulnerable'
];

const GENRE_OPTIONS = [
  'Electronic', 'Indie Rock', 'Hip Hop', 'Pop', 'R&B', 'Jazz', 'Classical',
  'Country', 'Folk', 'Reggae', 'Metal', 'Punk', 'Blues', 'Soul', 'Funk',
  'Disco', 'House', 'Techno', 'Ambient', 'Experimental', 'Lo-Fi', 'Trap'
];

const SCENE_OPTIONS = [
  'Underground', 'Mainstream', 'Local', 'International', 'College', 'Club',
  'Festival', 'Bedroom', 'Studio', 'Live', 'DIY', 'Independent', 'Major Label',
  'Alternative', 'Avant-garde', 'Traditional', 'Fusion', 'Crossover'
];

export const UploadTrack = ({ onUploadComplete }: UploadTrackProps) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [trackData, setTrackData] = useState<TrackData>({
    title: '',
    description: '',
    bpm: 120,
    mood: '',
    genre: '',
    scene: '',
    audioFile: null,
    coverArt: null
  });

  const [errors, setErrors] = useState<Partial<TrackData>>({});

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<TrackData> = {};

    if (step === 1) {
      if (!trackData.title.trim()) newErrors.title = 'Title is required';
      if (!trackData.description.trim()) newErrors.description = 'Description is required';
      if (!trackData.genre) newErrors.genre = 'Genre is required';
      if (!trackData.mood) newErrors.mood = 'Mood is required';
      if (!trackData.scene) newErrors.scene = 'Scene is required';
    }

    if (step === 2) {
      if (!trackData.audioFile) newErrors.audioFile = 'Audio file is required' as string;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleFileChange = (field: 'audioFile' | 'coverArt', file: File | null) => {
    setTrackData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleUpload = async () => {
    if (!user || !trackData.audioFile) return;

    setUploading(true);
    try {
      // Step 1: Get or create artist profile
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

      // Step 2: Upload audio file
      const audioFile = trackData.audioFile as File;
      const audioFileName = `${user.id}/${Date.now()}_${audioFile.name}`;
      const { data: audioData, error: audioError } = await supabase.storage
        .from('audio-files')
        .upload(audioFileName, audioFile);

      if (audioError) throw audioError;

      // Get public URL for audio file
      const { data: audioUrlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(audioFileName);

      // Step 3: Upload cover art if provided
      let coverUrl = '';
      if (trackData.coverArt) {
        const coverFile = trackData.coverArt as File;
        const coverFileName = `${user.id}/${Date.now()}_${coverFile.name}`;
        const { data: coverData, error: coverError } = await supabase.storage
          .from('cover-art')
          .upload(coverFileName, coverFile);

        if (coverError) throw coverError;
        
        const { data: coverUrlData } = supabase.storage
          .from('cover-art')
          .getPublicUrl(coverFileName);
        coverUrl = coverUrlData.publicUrl;
      }

      // Step 4: Create track record with correct schema
      const { data: newTrack, error: trackError } = await supabase
        .from('tracks')
        .insert({
          artist_id: artist.id,
          title: trackData.title,
          description: trackData.description,
          bpm: trackData.bpm,
          stream_url: audioUrlData.publicUrl, // Use stream_url as per schema
          cover_url: coverUrl || '/src/assets/sample-cover-1.jpg',
          popularity_tier: 'emerging',
          unique_listeners: 0,
          total_plays: 0
        })
        .select('id')
        .single();

      if (trackError) throw trackError;

      // Step 5: Create tags for mood, genre, and scene
      const tagTypes = [
        { name: trackData.mood, type: 'mood' },
        { name: trackData.genre, type: 'genre' },
        { name: trackData.scene, type: 'scene' }
      ];

      for (const tagInfo of tagTypes) {
        // Insert tag if it doesn't exist
        const { data: existingTag } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagInfo.name)
          .eq('type', tagInfo.type)
          .single();

        let tagId;
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: newTag, error: tagError } = await supabase
            .from('tags')
            .insert({
              name: tagInfo.name,
              type: tagInfo.type
            })
            .select('id')
            .single();

          if (tagError) throw tagError;
          tagId = newTag.id;
        }

        // Create track_tag relationship
        const { error: trackTagError } = await supabase
          .from('track_tags')
          .insert({
            track_id: newTrack.id,
            tag_id: tagId
          });

        if (trackTagError) throw trackTagError;
      }

      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      // Handle error display
    } finally {
      setUploading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return trackData.title && trackData.description && trackData.genre && trackData.mood && trackData.scene;
      case 2:
        return trackData.audioFile;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step < currentStep ? 'bg-green-500 text-white' :
              step === currentStep ? 'bg-primary text-white' :
              'bg-muted text-muted-foreground'
            }`}>
              {step < currentStep ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 3 && (
              <div className={`w-16 h-0.5 mx-2 ${
                step < currentStep ? 'bg-green-500' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Track Details */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Track Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Track Title *</Label>
              <Input
                id="title"
                value={trackData.title}
                onChange={(e) => setTrackData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter track title"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={trackData.description}
                onChange={(e) => setTrackData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your track..."
                rows={3}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre *</Label>
                <Select value={trackData.genre} onValueChange={(value) => setTrackData(prev => ({ ...prev, genre: value }))}>
                  <SelectTrigger className={errors.genre ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENRE_OPTIONS.map((genre) => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.genre && <p className="text-sm text-red-500">{errors.genre}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">Mood *</Label>
                <Select value={trackData.mood} onValueChange={(value) => setTrackData(prev => ({ ...prev, mood: value }))}>
                  <SelectTrigger className={errors.mood ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOOD_OPTIONS.map((mood) => (
                      <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.mood && <p className="text-sm text-red-500">{errors.mood}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scene">Scene *</Label>
              <Select value={trackData.scene} onValueChange={(value) => setTrackData(prev => ({ ...prev, scene: value }))}>
                <SelectTrigger className={errors.scene ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select scene" />
                </SelectTrigger>
                <SelectContent>
                  {SCENE_OPTIONS.map((scene) => (
                    <SelectItem key={scene} value={scene}>{scene}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.scene && <p className="text-sm text-red-500">{errors.scene}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                value={trackData.bpm}
                onChange={(e) => setTrackData(prev => ({ ...prev, bpm: parseInt(e.target.value) || 120 }))}
                min="60"
                max="200"
                step="1"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: File Upload */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Audio File *</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {trackData.audioFile ? (
                  <div className="space-y-2">
                    <Music className="w-8 h-8 mx-auto text-primary" />
                    <p className="font-medium">{(trackData.audioFile as File).name}</p>
                    <p className="text-sm text-muted-foreground">
                      {((trackData.audioFile as File).size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileChange('audioFile', null)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop your audio file here, or click to browse
                    </p>
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileChange('audioFile', file);
                      }}
                      className="hidden"
                      id="audio-upload"
                    />
                    <Label htmlFor="audio-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm">
                        Choose File
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
              {errors.audioFile && <p className="text-sm text-red-500">{String(errors.audioFile)}</p>}
            </div>

            <div className="space-y-2">
              <Label>Cover Art (Optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {trackData.coverArt ? (
                  <div className="space-y-2">
                    <Image className="w-8 h-8 mx-auto text-primary" />
                    <p className="font-medium">{(trackData.coverArt as File).name}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileChange('coverArt', null)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Image className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Upload cover art for your track
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleFileChange('coverArt', file);
                      }}
                      className="hidden"
                      id="cover-upload"
                    />
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm">
                        Choose Image
                      </Button>
                    </Label>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Review & Upload */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Upload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Title:</span>
                  <p className="text-muted-foreground">{trackData.title}</p>
                </div>
                <div>
                  <span className="font-medium">Genre:</span>
                  <p className="text-muted-foreground">{trackData.genre}</p>
                </div>
                <div>
                  <span className="font-medium">Mood:</span>
                  <p className="text-muted-foreground">{trackData.mood}</p>
                </div>
                <div>
                  <span className="font-medium">Scene:</span>
                  <p className="text-muted-foreground">{trackData.scene}</p>
                </div>
                <div>
                  <span className="font-medium">BPM:</span>
                  <p className="text-muted-foreground">{trackData.bpm}</p>
                </div>
                <div>
                  <span className="font-medium">Audio File:</span>
                  <p className="text-muted-foreground">{(trackData.audioFile as File)?.name}</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground">{trackData.description}</p>
              </div>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
              size="lg"
            >
              {uploading ? 'Uploading...' : 'Upload Track'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handlePrevious}>
            Previous
          </Button>
        )}
        
        {currentStep < 3 && (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
};