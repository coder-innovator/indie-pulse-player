import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Music, Image, X, Check, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  validateAudioFile,
  uploadFileToStorage,
  createTrackRecord,
  cleanupFailedUpload,
  extractAudioMetadata,
  checkForDuplicateFile,
  getOrCreateArtist,
  UPLOAD_CONFIG,
  type UploadProgress,
  type AudioMetadata,
} from '@/utils/uploadHelpers';

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
  audioFile: File | null;
  coverArt: File | null;
}

interface UploadState {
  stage: 'idle' | 'validating' | 'uploading' | 'processing' | 'completing' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
  canRetry: boolean;
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
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
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
  const [uploadState, setUploadState] = useState<UploadState>({
    stage: 'idle',
    progress: 0,
    message: '',
    canRetry: false,
  });
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata>({});
  const [isDuplicateFile, setIsDuplicateFile] = useState(false);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [createdTrackId, setCreatedTrackId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Enhanced step validation with detailed error messages
   */
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<TrackData> = {};

    if (step === 1) {
      if (!trackData.title.trim()) {
        newErrors.title = 'Title is required';
      } else if (trackData.title.length > 100) {
        newErrors.title = 'Title must be 100 characters or less';
      }
      
      if (!trackData.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (trackData.description.length > 500) {
        newErrors.description = 'Description must be 500 characters or less';
      }
      
      if (!trackData.genre) newErrors.genre = 'Genre is required';
      if (!trackData.mood) newErrors.mood = 'Mood is required';
      if (!trackData.scene) newErrors.scene = 'Scene is required';
      
      if (trackData.bpm < 60 || trackData.bpm > 200) {
        newErrors.bpm = 'BPM must be between 60 and 200';
      }
    }

    if (step === 2) {
      if (!trackData.audioFile) {
        newErrors.audioFile = 'Audio file is required';
      }
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

  /**
   * Enhanced file change handler with validation
   */
  const handleFileChange = useCallback(async (field: 'audioFile' | 'coverArt', file: File | null) => {
    setTrackData(prev => ({ ...prev, [field]: file }));
    
    // Clear existing errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Reset duplicate flag and metadata when file changes
    if (field === 'audioFile') {
      setIsDuplicateFile(false);
      setAudioMetadata({});
      
      if (file) {
        // Validate file immediately
        setUploadState({
          stage: 'validating',
          progress: 0,
          message: 'Validating file...',
          canRetry: false,
        });
        
        try {
          const validation = await validateAudioFile(file);
          
          if (!validation.isValid) {
            setErrors(prev => ({ ...prev, audioFile: validation.error }));
            setUploadState({
              stage: 'error',
              progress: 0,
              message: validation.error || 'File validation failed',
              error: validation.error,
              canRetry: false,
            });
            return;
          }
          
          // Check for duplicates
          if (user && validation.fileInfo) {
            const isDuplicate = await checkForDuplicateFile(validation.fileInfo.hash, user.id);
            setIsDuplicateFile(isDuplicate);
            
            if (isDuplicate) {
              toast({
                title: "Duplicate File",
                description: "This file has already been uploaded. You can continue if you want to upload it again.",
                variant: "destructive",
              });
            }
          }
          
          // Extract metadata
          const metadata = await extractAudioMetadata(file);
          setAudioMetadata(metadata);
          
          setUploadState({
            stage: 'idle',
            progress: 0,
            message: `File validated successfully (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
            canRetry: false,
          });
          
          toast({
            title: "File Validated",
            description: `${file.name} is ready for upload`,
          });
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Validation failed';
          setErrors(prev => ({ ...prev, audioFile: errorMessage }));
          setUploadState({
            stage: 'error',
            progress: 0,
            message: errorMessage,
            error: errorMessage,
            canRetry: false,
          });
        }
      } else {
        setUploadState({
          stage: 'idle',
          progress: 0,
          message: '',
          canRetry: false,
        });
      }
    }
  }, [errors, user, toast]);

  /**
   * Comprehensive upload handler with progress tracking and error recovery
   */
  const handleUpload = useCallback(async () => {
    if (!user || !trackData.audioFile) return;

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    // Reset state
    setUploadedFilePath(null);
    setCreatedTrackId(null);
    
    const onProgress = (progress: UploadProgress) => {
      setUploadState({
        stage: progress.stage,
        progress: progress.progress,
        message: progress.message,
        canRetry: false,
      });
    };

    try {
      // Step 1: Final validation
      onProgress({
        stage: 'validating',
        progress: 5,
        message: 'Performing final validation...',
      });
      
      const validation = await validateAudioFile(trackData.audioFile);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
      
      // Step 2: Get or create artist
      onProgress({
        stage: 'processing',
        progress: 10,
        message: 'Setting up artist profile...',
      });
      
      const artist = await getOrCreateArtist(user.id, user.email);
      if (!artist) {
        throw new Error('Failed to create artist profile');
      }
      
      // Step 3: Upload audio file
      onProgress({
        stage: 'uploading',
        progress: 15,
        message: 'Starting audio file upload...',
      });
      
      const audioFileName = `${user.id}/${Date.now()}_${trackData.audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const audioUploadResult = await uploadFileToStorage(
        trackData.audioFile,
        'audio-files',
        audioFileName,
        (progress) => {
          // Adjust progress to 15-70% range for audio upload
          const adjustedProgress = 15 + (progress.progress * 0.55);
          onProgress({
            ...progress,
            progress: adjustedProgress,
          });
        }
      );
      
      if (!audioUploadResult.success) {
        throw new Error(audioUploadResult.error || 'Audio upload failed');
      }
      
      setUploadedFilePath(audioUploadResult.filePath || null);
      
      // Step 4: Upload cover art if provided
      let coverUrl = '';
      if (trackData.coverArt) {
        onProgress({
          stage: 'uploading',
          progress: 70,
          message: 'Uploading cover art...',
        });
        
        const coverFileName = `${user.id}/${Date.now()}_${trackData.coverArt.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const coverUploadResult = await uploadFileToStorage(
          trackData.coverArt,
          'cover-art',
          coverFileName,
          () => {} // No progress callback for cover art
        );
        
        if (coverUploadResult.success) {
          coverUrl = coverUploadResult.fileUrl || '';
        } else {
          console.warn('Cover art upload failed:', coverUploadResult.error);
          // Continue without cover art
        }
      }
      
      // Step 5: Create database record
      onProgress({
        stage: 'processing',
        progress: 85,
        message: 'Creating track record...',
      });
      
      const trackRecord = await createTrackRecord(
        {
          title: trackData.title,
          description: trackData.description,
          bpm: trackData.bpm,
          mood: trackData.mood,
          genre: trackData.genre,
          scene: trackData.scene,
          audioUrl: audioUploadResult.fileUrl!,
          coverUrl,
          fileHash: validation.fileInfo!.hash,
          metadata: audioMetadata,
        },
        artist.id
      );
      
      if (!trackRecord.success) {
        throw new Error(trackRecord.error || 'Failed to create track record');
      }
      
      setCreatedTrackId(trackRecord.trackId || null);
      
      // Step 6: Complete
      onProgress({
        stage: 'completed',
        progress: 100,
        message: 'Upload completed successfully!',
      });
      
      toast({
        title: "Upload Successful!",
        description: `"${trackData.title}" has been uploaded successfully.`,
      });
      
      // Wait a moment to show success, then callback
      setTimeout(() => {
        onUploadComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      // Cleanup on error
      await cleanupFailedUpload(
        'audio-files',
        uploadedFilePath || undefined,
        createdTrackId || undefined
      );
      
      setUploadState({
        stage: 'error',
        progress: 0,
        message: errorMessage,
        error: errorMessage,
        canRetry: true,
      });
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      abortControllerRef.current = null;
    }
  }, [user, trackData, audioMetadata, onUploadComplete, toast]);
  
  /**
   * Cancel upload
   */
  const handleCancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setUploadState({
      stage: 'idle',
      progress: 0,
      message: 'Upload cancelled',
      canRetry: false,
    });
    
    // Cleanup any partial uploads
    cleanupFailedUpload(
      'audio-files',
      uploadedFilePath || undefined,
      createdTrackId || undefined
    );
  }, [uploadedFilePath, createdTrackId]);
  
  /**
   * Retry upload
   */
  const handleRetryUpload = useCallback(() => {
    setUploadState({
      stage: 'idle',
      progress: 0,
      message: '',
      canRetry: false,
    });
    handleUpload();
  }, [handleUpload]);

  /**
   * Enhanced step progression logic
   */
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return trackData.title && trackData.description && trackData.genre && trackData.mood && trackData.scene;
      case 2:
        return trackData.audioFile && uploadState.stage !== 'error' && uploadState.stage !== 'validating';
      default:
        return false;
    }
  };
  
  /**
   * Get upload stage icon
   */
  const getStageIcon = (stage: UploadState['stage']) => {
    switch (stage) {
      case 'validating':
        return <Clock className="w-4 h-4 animate-spin" />;
      case 'uploading':
        return <Upload className="w-4 h-4 animate-pulse" />;
      case 'processing':
        return <Zap className="w-4 h-4 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
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
                maxLength={100}
                className={errors.title ? 'border-red-500' : ''}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{errors.title && <span className="text-red-500">{errors.title}</span>}</span>
                <span>{trackData.title.length}/100</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={trackData.description}
                onChange={(e) => setTrackData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your track..."
                rows={3}
                maxLength={500}
                className={errors.description ? 'border-red-500' : ''}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{errors.description && <span className="text-red-500">{errors.description}</span>}</span>
                <span>{trackData.description.length}/500</span>
              </div>
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
                  <div className="space-y-3">
                    <Music className="w-8 h-8 mx-auto text-primary" />
                    <div>
                      <p className="font-medium">{trackData.audioFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(trackData.audioFile.size / 1024 / 1024).toFixed(2)} MB
                        {audioMetadata.duration && (
                          <span> • {Math.round(audioMetadata.duration)}s</span>
                        )}
                      </p>
                    </div>
                    
                    {/* File validation status */}
                    {uploadState.stage !== 'idle' && (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        {getStageIcon(uploadState.stage)}
                        <span className={uploadState.stage === 'error' ? 'text-red-500' : 'text-blue-500'}>
                          {uploadState.message}
                        </span>
                      </div>
                    )}
                    
                    {/* Duplicate file warning */}
                    {isDuplicateFile && (
                      <Alert className="text-left">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          This file appears to be a duplicate. You can still proceed with the upload.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFileChange('audioFile', null)}
                      disabled={uploadState.stage === 'validating'}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your audio file here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported: {UPLOAD_CONFIG.ALLOWED_AUDIO_TYPES.join(', ')} • Max {UPLOAD_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept={UPLOAD_CONFIG.ALLOWED_AUDIO_MIMES.join(',')}
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
              {errors.audioFile && <p className="text-sm text-red-500">{errors.audioFile}</p>}
            </div>

            <div className="space-y-2">
              <Label>Cover Art (Optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {trackData.coverArt ? (
                  <div className="space-y-2">
                    <Image className="w-8 h-8 mx-auto text-primary" />
                    <p className="font-medium">{trackData.coverArt.name}</p>
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
          <CardContent className="space-y-6">
            {/* Track Details Review */}
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
                  <p className="text-muted-foreground">
                    {trackData.audioFile?.name}
                    {audioMetadata.duration && (
                      <span className="block text-xs">{Math.round(audioMetadata.duration)}s duration</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground">{trackData.description}</p>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadState.stage !== 'idle' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {getStageIcon(uploadState.stage)}
                  <span className="text-sm font-medium">{uploadState.message}</span>
                </div>
                
                {uploadState.progress > 0 && (
                  <div className="space-y-1">
                    <Progress value={uploadState.progress} className="w-full" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{uploadState.stage}</span>
                      <span>{Math.round(uploadState.progress)}%</span>
                    </div>
                  </div>
                )}
                
                {uploadState.stage === 'error' && uploadState.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{uploadState.error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Upload Controls */}
            <div className="flex gap-2">
              {uploadState.stage === 'idle' || uploadState.stage === 'error' ? (
                <Button
                  onClick={uploadState.canRetry ? handleRetryUpload : handleUpload}
                  className="flex-1"
                  size="lg"
                  disabled={!trackData.audioFile}
                >
                  {uploadState.canRetry ? (
                    <>Retry Upload</>
                  ) : (
                    <>Upload Track</>
                  )}
                </Button>
              ) : uploadState.stage === 'completed' ? (
                <Button className="flex-1" size="lg" disabled>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Upload Complete!
                </Button>
              ) : (
                <Button
                  onClick={handleCancelUpload}
                  variant="destructive"
                  className="flex-1"
                  size="lg"
                >
                  Cancel Upload
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        {currentStep > 1 && (
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={uploadState.stage === 'uploading' || uploadState.stage === 'processing'}
          >
            Previous
          </Button>
        )}
        
        {currentStep < 3 && (
          <Button 
            onClick={handleNext} 
            disabled={!canProceed()}
            className="ml-auto"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};