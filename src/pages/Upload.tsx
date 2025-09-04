import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload as UploadIcon, 
  Music, 
  Image, 
  FileAudio,
  Tag,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  X,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MagicalCard, GlassCard, GlowCard } from "@/components/MagicalCard";
import { MagicButton, GlowButton } from "@/components/MagicalButton";
import { validateTrackTitle, validateBPM, validateDuration } from "@/lib/validation";
import { formatFileSize, formatDuration } from "@/lib/utils";
import { useErrorHandler } from "@/components/ErrorBoundary";

interface UploadForm {
  title: string;
  description: string;
  bpm: number;
  duration: number;
  mood: string;
  genre: string;
  scene: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  bpm?: string;
  mood?: string;
  genre?: string;
  scene?: string;
  audioFile?: string;
  coverFile?: string;
}

const Upload = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // File states
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UploadForm>({
    title: '',
    description: '',
    bpm: 120,
    duration: 0,
    mood: '',
    genre: '',
    scene: ''
  });

  // Available tags
  const moods = ['Chill', 'Energetic', 'Dreamy', 'Dark', 'Uplifting', 'Melancholic', 'Euphoric', 'Aggressive'];
  const genres = ['Electronic', 'Indie Rock', 'Ambient', 'Hip Hop', 'Folk', 'Pop', 'R&B', 'Jazz', 'Classical', 'Country'];
  const scenes = ['Underground', 'Local', 'Experimental', 'Bedroom Pop', 'College', 'Club', 'Festival', 'Studio'];

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      // Validate basic info
      const titleValidation = validateTrackTitle(formData.title);
      if (!titleValidation.isValid) {
        newErrors.title = titleValidation.error;
      }

      if (!formData.mood) newErrors.mood = 'Mood is required';
      if (!formData.genre) newErrors.genre = 'Genre is required';
      if (!formData.scene) newErrors.scene = 'Scene is required';
    }

    if (step === 2) {
      // Validate audio file
      if (!audioFile) {
        newErrors.audioFile = 'Audio file is required';
      }
    }

    if (step === 3) {
      // Final validation
      if (!audioFile) newErrors.audioFile = 'Audio file is required';
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.mood) newErrors.mood = 'Mood is required';
      if (!formData.genre) newErrors.genre = 'Genre is required';
      if (!formData.scene) newErrors.scene = 'Scene is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAudioFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('audio/')) {
        setAudioFile(file);
        
        // Get audio duration
        const audio = new Audio();
        audio.src = URL.createObjectURL(file);
        audio.addEventListener('loadedmetadata', () => {
          const duration = Math.round(audio.duration);
          setFormData(prev => ({ ...prev, duration }));
          
          // Validate duration
          const durationValidation = validateDuration(duration);
          if (!durationValidation.isValid) {
            setErrors(prev => ({ ...prev, audioFile: durationValidation.error }));
          } else {
            setErrors(prev => ({ ...prev, audioFile: undefined }));
          }
        });
        
        // Clear previous errors
        setErrors(prev => ({ ...prev, audioFile: undefined }));
      } else {
        setErrors(prev => ({ ...prev, audioFile: 'Please select an audio file' }));
        toast({
          title: "Invalid file type",
          description: "Please select an audio file",
          variant: "destructive"
        });
      }
    }
  };

  const handleCoverFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setCoverFile(file);
        setErrors(prev => ({ ...prev, coverFile: undefined }));
      } else {
        setErrors(prev => ({ ...prev, coverFile: 'Please select an image file' }));
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive"
        });
      }
    }
  };

  const handleInputChange = (field: keyof UploadForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation errors when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Validate BPM if changed
    if (field === 'bpm') {
      const bpmValidation = validateBPM(value as number);
      if (!bpmValidation.isValid) {
        setErrors(prev => ({ ...prev, bpm: bpmValidation.error }));
      }
    }
  };

  const handleUpload = async () => {
    if (!validateStep(3) || !user) return;

    try {
      setLoading(true);
      setUploadProgress(0);

      // Step 1: Upload audio file
      setUploadProgress(20);
      const audioFileName = `${user.id}/${Date.now()}_${audioFile!.name}`;
      const { error: audioError } = await supabase.storage
        .from('audio-files')
        .upload(audioFileName, audioFile!);

      if (audioError) throw audioError;

      // Get public URL for audio file
      const { data: audioUrlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(audioFileName);

      // Step 2: Upload cover art if provided
      setUploadProgress(40);
      let coverUrl = '';
      if (coverFile) {
        const coverFileName = `${user.id}/${Date.now()}_${coverFile.name}`;
        const { error: coverError } = await supabase.storage
          .from('cover-art')
          .upload(coverFileName, coverFile);

        if (coverError) throw coverError;
        
        const { data: coverData } = supabase.storage
          .from('cover-art')
          .getPublicUrl(coverFileName);
        coverUrl = coverData.publicUrl;
      }

      // Step 3: Get or create artist profile
      setUploadProgress(60);
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

      // Step 4: Create track record
      setUploadProgress(80);
      const { data: newTrack, error: trackError } = await supabase
        .from('tracks')
        .insert({
          artist_id: artist.id,
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          bpm: formData.bpm,
          cover_url: coverUrl || '/src/assets/sample-cover-1.jpg',
          stream_url: audioUrlData.publicUrl
        })
        .select('id')
        .single();

      if (trackError) throw trackError;

      // Step 5: Create tags for mood, genre, and scene
      setUploadProgress(90);
      const tagTypes = [
        { name: formData.mood, type: 'mood' },
        { name: formData.genre, type: 'genre' },
        { name: formData.scene, type: 'scene' }
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

      setUploadProgress(100);
      
      toast({
        title: "Upload Successful!",
        description: "Your track has been uploaded and is now available for discovery.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        bpm: 120,
        duration: 0,
        mood: '',
        genre: '',
        scene: ''
      });
      setAudioFile(null);
      setCoverFile(null);
      setCurrentStep(1);
      setErrors({});

    } catch (error) {
      console.error('Upload error:', error);
      handleError(error as Error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your track. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center">
        <GlowCard className="p-12 max-w-md mx-auto card-elevated">
          <div className="text-center space-y-6">
            <div className="p-4 bg-primary/20 rounded-full w-fit mx-auto border border-primary/30">
              <User className="w-12 h-12 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Please Sign In</h1>
              <p className="text-muted-foreground">You need to be signed in to upload tracks.</p>
            </div>
            <MagicButton onClick={() => window.location.href = '/auth'}>
              Sign In
            </MagicButton>
          </div>
        </GlowCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-background">
      <div className="responsive-container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
                <UploadIcon className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-gradient">Upload Your Track</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Share your music with the world and get discovered by new listeners
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    currentStep >= step 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'bg-surface-secondary text-muted-foreground border border-border-medium'
                  }`}>
                    {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                  </div>
                  {step < 3 && (
                    <div className={`w-20 h-1 mx-2 transition-all duration-300 ${
                      currentStep > step ? 'bg-primary' : 'bg-border-medium'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            {/* Progress Bar */}
            {loading && (
              <div className="w-full bg-surface-secondary rounded-full h-2 mb-4">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <GlowCard className="p-6 mb-8 card-secondary">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Track Information</h2>
                <p className="text-muted-foreground">Tell us about your track</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="title" className="form-label">Track Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter track title..."
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={`form-input ${errors.title ? 'border-destructive' : ''}`}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="bpm" className="form-label">BPM *</Label>
                  <Input
                    id="bpm"
                    type="number"
                    min="60"
                    max="200"
                    value={formData.bpm}
                    onChange={(e) => handleInputChange('bpm', parseInt(e.target.value))}
                    className={`form-input ${errors.bpm ? 'border-destructive' : ''}`}
                  />
                  {errors.bpm && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.bpm}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="mood" className="form-label">Mood *</Label>
                  <select
                    id="mood"
                    value={formData.mood}
                    onChange={(e) => handleInputChange('mood', e.target.value)}
                    className={`enhanced-select ${errors.mood ? 'border-destructive' : ''}`}
                  >
                    <option value="">Select mood...</option>
                    {moods.map((mood) => (
                      <option key={mood} value={mood}>{mood}</option>
                    ))}
                  </select>
                  {errors.mood && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.mood}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="genre" className="form-label">Genre *</Label>
                  <select
                    id="genre"
                    value={formData.genre}
                    onChange={(e) => handleInputChange('genre', e.target.value)}
                    className={`enhanced-select ${errors.genre ? 'border-destructive' : ''}`}
                  >
                    <option value="">Select genre...</option>
                    {genres.map((genre) => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                  {errors.genre && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.genre}
                    </p>
                  )}
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="scene" className="form-label">Scene *</Label>
                  <select
                    id="scene"
                    value={formData.scene}
                    onChange={(e) => handleInputChange('scene', e.target.value)}
                    className={`enhanced-select ${errors.scene ? 'border-destructive' : ''}`}
                  >
                    <option value="">Select scene...</option>
                    {scenes.map((scene) => (
                      <option key={scene} value={scene}>{scene}</option>
                    ))}
                  </select>
                  {errors.scene && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.scene}
                    </p>
                  )}
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="description" className="form-label">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your track..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="form-input"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <MagicButton onClick={nextStep} disabled={!audioFile} className="px-8 py-3">
                  Next: Audio File
                  <ArrowRight className="w-5 h-5 ml-2" />
                </MagicButton>
              </div>
            </GlowCard>
          )}

          {/* Step 2: Audio File */}
          {currentStep === 2 && (
            <GlassCard className="p-8 card-elevated">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">Upload Audio File</h2>
                <p className="text-muted-foreground">Select the audio file for your track</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="audio-file" className="form-label">Audio File *</Label>
                  <div className="border-2 border-dashed border-border-medium rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="audio-file"
                      accept="audio/*"
                      onChange={handleAudioFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="audio-file" className="cursor-pointer">
                      {audioFile ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-primary/20 rounded-full w-fit mx-auto border border-primary/30">
                            <FileAudio className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground mb-2">{audioFile.name}</h3>
                            <p className="text-muted-foreground mb-2">
                              {formatFileSize(audioFile.size)} • {formData.duration > 0 ? formatDuration(formData.duration) : 'Processing...'}
                            </p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setAudioFile(null)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove File
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-primary/20 rounded-full w-fit mx-auto border border-primary/30">
                            <FileAudio className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Choose Audio File</h3>
                            <p className="text-muted-foreground mb-4">
                              Supported formats: MP3, WAV, FLAC, OGG, M4A (Max 100MB)
                            </p>
                            <Button variant="outline" size="lg">
                              Select Audio File
                            </Button>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.audioFile && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.audioFile}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="cover-file" className="form-label">Cover Art (Optional)</Label>
                  <div className="border-2 border-dashed border-border-medium rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="cover-file"
                      accept="image/*"
                      onChange={handleCoverFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="cover-file" className="cursor-pointer">
                      {coverFile ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-primary/20 rounded-full w-fit mx-auto border border-primary/30">
                            <Image className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground mb-2">{coverFile.name}</h3>
                            <p className="text-muted-foreground mb-2">{formatFileSize(coverFile.size)}</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setCoverFile(null)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove Image
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-primary/20 rounded-full w-fit mx-auto border border-primary/30">
                            <Image className="w-8 h-8 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Choose Cover Art</h3>
                            <p className="text-muted-foreground mb-4">
                              Supported formats: JPEG, PNG, WebP, GIF (Max 10MB)
                            </p>
                            <Button variant="outline" size="lg">
                              Select Image
                            </Button>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                  {errors.coverFile && (
                    <p className="text-sm text-destructive flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.coverFile}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep} className="px-6 py-3 border-border-medium text-foreground hover:bg-surface-secondary">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <MagicButton onClick={nextStep} disabled={!formData.title || !formData.mood || !formData.genre || !formData.scene} className="px-8 py-3">
                  Next: Review
                  <ArrowRight className="w-5 h-5 ml-2" />
                </MagicButton>
              </div>
            </GlassCard>
          )}

          {/* Step 3: Review & Upload */}
          {currentStep === 3 && (
            <GlassCard className="p-8 card-elevated">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Review & Upload</h2>
              </div>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center gap-4 p-6 bg-surface-secondary/50 rounded-xl border border-border-medium">
                  {coverFile ? (
                    <img
                      src={URL.createObjectURL(coverFile)}
                      alt="Cover preview"
                      className="w-20 h-20 rounded-lg object-cover border border-border-medium"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-surface-secondary rounded-lg flex items-center justify-center border border-border-medium">
                      <Music className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{formData.title}</h3>
                    <p className="text-muted-foreground">
                      {audioFile?.name} • {formData.duration > 0 ? formatDuration(formData.duration) : 'Processing...'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 text-sm">
                  <div className="p-4 bg-surface-secondary/30 rounded-lg border border-border-medium">
                    <span className="text-muted-foreground">BPM:</span>
                    <span className="ml-2 font-semibold text-foreground">{formData.bpm}</span>
                  </div>
                  <div className="p-4 bg-surface-secondary/30 rounded-lg border border-border-medium">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 font-semibold text-foreground">
                      {formData.duration > 0 ? formatDuration(formData.duration) : 'Processing...'}
                    </span>
                  </div>
                  <div className="p-4 bg-surface-secondary/30 rounded-lg border border-border-medium">
                    <span className="text-muted-foreground">Mood:</span>
                    <Badge variant="secondary" className="ml-2 badge-primary">{formData.mood}</Badge>
                  </div>
                  <div className="p-4 bg-surface-secondary/30 rounded-lg border border-border-medium">
                    <span className="text-muted-foreground">Genre:</span>
                    <Badge variant="secondary" className="ml-2 badge-primary">{formData.genre}</Badge>
                  </div>
                  <div className="col-span-2 p-4 bg-surface-secondary/30 rounded-lg border border-border-medium">
                    <span className="text-muted-foreground">Scene:</span>
                    <Badge variant="secondary" className="ml-2 badge-primary">{formData.scene}</Badge>
                  </div>
                </div>

                {formData.description && (
                  <div className="p-4 bg-surface-secondary/30 rounded-lg border border-border-medium">
                    <span className="text-muted-foreground block mb-2">Description:</span>
                    <p className="text-foreground">{formData.description}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep} className="px-6 py-3 border-border-medium text-foreground hover:bg-surface-secondary">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back
                </Button>
                <MagicButton onClick={handleUpload} disabled={loading} className="px-8 py-3">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadIcon className="w-5 h-5 mr-2" />
                      Upload Track
                    </>
                  )}
                </MagicButton>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default Upload;
