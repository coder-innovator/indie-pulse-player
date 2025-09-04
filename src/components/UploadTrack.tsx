import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Music, Play, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrackData {
  title?: string;
  description?: string;
  bpm?: number;
  mood?: string;
  genre?: string;
  scene?: string;
  audioFile?: File;
  coverArt?: File;
}

interface UploadTrackProps {
  onUploadComplete?: () => void;
}

export function UploadTrack({ onUploadComplete }: UploadTrackProps = {}) {
  const [step, setStep] = useState(1);
  const [trackData, setTrackData] = useState<Partial<TrackData>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!trackData.title) newErrors.title = 'Title is required';
      if (!trackData.genre) newErrors.genre = 'Genre is required';
      if (!trackData.mood) newErrors.mood = 'Mood is required';
      if (!trackData.scene) newErrors.scene = 'Scene is required';
      
      if ((trackData.bpm as any) && ((trackData.bpm as number) < 60 || (trackData.bpm as number) > 200)) {
        newErrors.bpm = 'BPM must be between 60 and 200';
      }
    }

    if (step === 2) {
      if (!(trackData.audioFile as any)) {
        newErrors.audioFile = 'Audio file is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;

    setUploading(true);
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Track uploaded successfully!',
        description: `${trackData.title} has been added to your library.`,
      });
      
      // Reset form
      setTrackData({});
      setStep(1);
      
      // Notify parent component
      onUploadComplete?.();
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'There was an error uploading your track. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'audioFile' | 'coverArt') => {
    const file = e.target.files?.[0];
    if (file) {
      setTrackData(prev => ({ ...prev, [field]: file } as any));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-glass border-glass backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Upload New Track
          </CardTitle>
          <CardDescription>
            Step {step} of 3: {step === 1 ? 'Track Details' : step === 2 ? 'Audio File' : 'Review & Upload'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Track Title *</Label>
                <Input
                  id="title"
                  value={trackData.title || ''}
                  onChange={(e) => setTrackData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter track title"
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={trackData.description || ''}
                  onChange={(e) => setTrackData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your track"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bpm">BPM</Label>
                  <Input
                    id="bpm"
                    type="number"
                    min="60"
                    max="200"
                    value={trackData.bpm || ''}
                    onChange={(e) => setTrackData(prev => ({ ...prev, bpm: parseInt(e.target.value) }))}
                    placeholder="120"
                  />
                  {errors.bpm && <p className="text-sm text-red-500">{errors.bpm}</p>}
                </div>

                <div>
                  <Label htmlFor="genre">Genre *</Label>
                  <Select value={trackData.genre} onValueChange={(value) => setTrackData(prev => ({ ...prev, genre: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="cinematic">Cinematic</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.genre && <p className="text-sm text-red-500">{errors.genre}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mood">Mood *</Label>
                  <Select value={trackData.mood} onValueChange={(value) => setTrackData(prev => ({ ...prev, mood: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uplifting">Uplifting</SelectItem>
                      <SelectItem value="melancholic">Melancholic</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="calm">Calm</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.mood && <p className="text-sm text-red-500">{errors.mood}</p>}
                </div>

                <div>
                  <Label htmlFor="scene">Scene *</Label>
                  <Select value={trackData.scene} onValueChange={(value) => setTrackData(prev => ({ ...prev, scene: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select scene" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workout">Workout</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="party">Party</SelectItem>
                      <SelectItem value="relaxation">Relaxation</SelectItem>
                      <SelectItem value="gaming">Gaming</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.scene && <p className="text-sm text-red-500">{errors.scene}</p>}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Audio File *</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {trackData.audioFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <Music className="h-5 w-5 text-primary" />
                      <span>{(trackData.audioFile as any)?.name}</span>
                    </div>
                  ) : (
                    <Label htmlFor="audio-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span>Click to upload audio file</span>
                        <span className="text-sm text-muted-foreground">MP3, WAV, M4A (max 50MB)</span>
                      </div>
                      <Input
                        id="audio-upload"
                        type="file"
                        accept=".mp3,.wav,.m4a"
                        onChange={(e) => handleFileChange(e, 'audioFile')}
                        className="hidden"
                      />
                    </Label>
                  )}
                </div>
                {errors.audioFile && <p className="text-sm text-red-500">{errors.audioFile}</p>}
              </div>

              <div>
                <Label>Cover Art (Optional)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {trackData.coverArt ? (
                    <div className="flex items-center justify-center gap-2">
                      <span>{(trackData.coverArt as any)?.name || 'No file selected'}</span>
                    </div>
                  ) : (
                    <Label htmlFor="cover-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-muted-foreground" />
                        <span>Click to upload cover art</span>
                        <span className="text-sm text-muted-foreground">JPG, PNG (max 5MB)</span>
                      </div>
                      <Input
                        id="cover-upload"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'coverArt')}
                        className="hidden"
                      />
                    </Label>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Review Your Track</h3>
              <div className="bg-secondary/20 rounded-lg p-4 space-y-2">
                <p><strong>Title:</strong> {trackData.title}</p>
                <p><strong>Description:</strong> {trackData.description || 'None'}</p>
                <p><strong>Genre:</strong> {trackData.genre}</p>
                <p><strong>Mood:</strong> {trackData.mood}</p>
                <p><strong>Scene:</strong> {trackData.scene}</p>
                <p><strong>BPM:</strong> {trackData.bpm || 'Not specified'}</p>
                <p><strong>Audio File:</strong> {(trackData.audioFile as any)?.name}</p>
                <p><strong>Cover Art:</strong> {(trackData.coverArt as any)?.name || 'None'}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Track'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}