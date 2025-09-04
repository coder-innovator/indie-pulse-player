import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, RotateCcw } from 'lucide-react';
import { Track } from '@/components/TrackCard';
import { supabase } from '@/integrations/supabase/client';
import { usePlayerStore } from '@/stores/playerStore';
import { useToast } from '@/hooks/use-toast';

/**
 * Enhanced Audio Player Component
 * Features:
 * - Streaming from Supabase Storage with signed URLs
 * - Global state management with Zustand
 * - Keyboard shortcuts (spacebar for play/pause)
 * - Volume control with memory persistence
 * - Comprehensive error handling with retry logic
 * - Auto-play next track functionality
 * - Mobile-responsive design
 */

interface AudioPlayerProps {
  track?: Track | null; // Made optional since we use global state
  className?: string;
}

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Progress update interval
const PROGRESS_UPDATE_INTERVAL = 100; // ms

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  track: propTrack,
  className
}) => {
  // Global player state
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    repeat,
    shuffle,
    isLoading,
    error,
    setCurrentTrack,
    play,
    pause,
    togglePlay,
    next,
    previous,
    setVolume,
    toggleMute,
    setCurrentTime,
    setDuration,
    setLoading,
    setError,
    setRepeat,
    toggleShuffle
  } = usePlayerStore();

  // Local state for audio management
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Use prop track or global current track
  const activeTrack = propTrack || currentTrack;

  /**
   * Load and validate audio URL from Supabase Storage
   * Handles both public URLs and storage paths
   * Implements retry logic for failed loads
   */
  const loadAudioUrl = useCallback(async (track: Track, attempt = 1): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);

      if (!track.streamUrl) {
        throw new Error('No audio URL provided');
      }

      // Handle direct HTTP URLs
      if (track.streamUrl.startsWith('http')) {
        return track.streamUrl;
      }

      // Handle Supabase storage paths - get signed URL for better CORS handling
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('audio-files')
        .createSignedUrl(track.streamUrl, 3600); // 1 hour expiry

      if (signedUrlError) {
        // Fallback to public URL if signed URL fails
        console.warn('Signed URL failed, falling back to public URL:', signedUrlError);
        const { data: publicUrlData } = supabase.storage
          .from('audio-files')
          .getPublicUrl(track.streamUrl);
        
        return publicUrlData.publicUrl;
      }

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error(`Audio URL load attempt ${attempt} failed:`, error);
      
      // Retry logic
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying audio load in ${RETRY_DELAY}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return loadAudioUrl(track, attempt + 1);
      }
      
      // Max retries reached
      const errorMessage = error instanceof Error ? error.message : 'Failed to load audio';
      setError(`Failed to load audio after ${MAX_RETRIES} attempts: ${errorMessage}`);
      toast({
        title: "Audio Load Error",
        description: `Could not load "${track.title}". Trying next track...`,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, toast]);

  // Load audio URL when track changes
  useEffect(() => {
    if (activeTrack) {
      setRetryCount(0);
      loadAudioUrl(activeTrack).then(url => {
        setAudioUrl(url);
        if (propTrack && !currentTrack) {
          // If using prop track and no global track, set it globally
          setCurrentTrack(activeTrack);
        }
      });
    } else {
      setAudioUrl(null);
    }
  }, [activeTrack, loadAudioUrl, propTrack, currentTrack, setCurrentTrack]);

  /**
   * Enhanced audio event handling with comprehensive error management
   * Updates progress every 100ms for smooth UI updates
   * Handles network errors and implements auto-retry
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Progress update handler - called every 100ms for smooth updates
    const updateProgress = () => {
      if (audio.currentTime !== currentTime) {
        setCurrentTime(audio.currentTime);
      }
    };

    // Metadata loaded handler
    const handleLoadedMetadata = () => {
      const audioDuration = audio.duration || 0;
      setDuration(audioDuration);
      setError(null); // Clear any previous errors
      console.log(`Audio loaded: ${activeTrack?.title}, Duration: ${audioDuration}s`);
    };

    // Track ended handler - auto-play next track
    const handleEnded = () => {
      console.log('Track ended, playing next...');
      pause(); // Update global state
      
      // Auto-play next track if in queue mode
      if (repeat === 'one') {
        // Repeat current track
        audio.currentTime = 0;
        play();
      } else {
        // Play next track
        next();
      }
    };

    // Error handler with retry logic
    const handleError = async (event: Event) => {
      const error = (event.target as HTMLAudioElement).error;
      console.error('Audio playback error:', error);
      
      let errorMessage = 'Unknown playback error';
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error while loading audio';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio format not supported';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio source not supported';
            break;
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio loading was aborted';
            break;
        }
      }

      setError(errorMessage);
      pause();
      
      // Retry logic for network errors
      if (error?.code === MediaError.MEDIA_ERR_NETWORK && retryCount < MAX_RETRIES) {
        console.log(`Network error, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        setRetryCount(prev => prev + 1);
        
        setTimeout(() => {
          if (activeTrack) {
            loadAudioUrl(activeTrack).then(url => {
              if (url) {
                setAudioUrl(url);
              } else {
                // Failed to reload, try next track
                next();
              }
            });
          }
        }, RETRY_DELAY);
      } else if (retryCount >= MAX_RETRIES) {
        // Max retries reached, try next track
        toast({
          title: "Playback Error",
          description: `Cannot play "${activeTrack?.title}". Skipping to next track.`,
          variant: "destructive",
        });
        next();
      }
    };

    // Can play handler - audio is ready to play
    const handleCanPlay = () => {
      setRetryCount(0); // Reset retry count on successful load
      setError(null);
      console.log('Audio ready to play:', activeTrack?.title);
    };

    // Waiting handler - buffering
    const handleWaiting = () => {
      setLoading(true);
    };

    // Can play through handler - enough data loaded
    const handleCanPlayThrough = () => {
      setLoading(false);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    // Start progress update interval
    const interval = setInterval(updateProgress, PROGRESS_UPDATE_INTERVAL);
    setProgressInterval(interval);

    return () => {
      // Clean up event listeners
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      
      // Clear progress interval
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTrack, currentTime, setCurrentTime, setDuration, setError, setLoading, 
      pause, play, next, repeat, retryCount, loadAudioUrl, toast]);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressInterval) {
        clearInterval(progressInterval);
      }
    };
  }, [progressInterval]);

  /**
   * Volume control with smooth transitions
   * Syncs HTML5 audio element with global state
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const targetVolume = isMuted ? 0 : volume;
    
    // Smooth volume transition to prevent audio pops
    const currentVolume = audio.volume;
    const volumeDiff = targetVolume - currentVolume;
    const steps = 10;
    const stepSize = volumeDiff / steps;
    
    if (Math.abs(volumeDiff) > 0.01) {
      let step = 0;
      const volumeTransition = setInterval(() => {
        step++;
        const newVolume = currentVolume + (stepSize * step);
        audio.volume = Math.max(0, Math.min(1, newVolume));
        
        if (step >= steps) {
          clearInterval(volumeTransition);
          audio.volume = targetVolume; // Ensure exact final value
        }
      }, 10);
      
      return () => clearInterval(volumeTransition);
    } else {
      audio.volume = targetVolume;
    }
  }, [volume, isMuted]);

  /**
   * Keyboard shortcuts support
   * Spacebar: Play/Pause
   * Arrow Left/Right: Seek ±10s
   * Arrow Up/Down: Volume ±10%
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          if (activeTrack) {
            togglePlay();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          handleSeek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          event.preventDefault();
          handleSeek(Math.min(duration, currentTime + 10));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTrack, togglePlay, currentTime, duration, volume, setVolume]);

  /**
   * Enhanced play/pause toggle with global state sync
   * Handles browser autoplay restrictions gracefully
   */
  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    try {
      if (isPlaying) {
        audio.pause();
        pause(); // Update global state
        console.log('Paused:', activeTrack.title);
      } else {
        // Handle browser autoplay restrictions
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          play(); // Update global state
          recordPlay(); // Record analytics
          console.log('Playing:', activeTrack.title);
        }
      }
    } catch (error) {
      console.error('Play/pause error:', error);
      setError('Playback failed. This may be due to browser autoplay restrictions.');
      pause();
      
      // Show user-friendly error
      toast({
        title: "Playback Error",
        description: "Unable to play audio. Please try clicking the play button.",
        variant: "destructive",
      });
    }
  };

  /**
   * Sync HTML5 audio playback state with global state
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !activeTrack) return;

    if (isPlaying && audio.paused) {
      audio.play().catch(error => {
        console.error('Auto-play failed:', error);
        pause();
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, activeTrack, pause]);

  /**
   * Enhanced analytics recording with error handling
   * Records play events for both authenticated and anonymous users
   */
  const recordPlay = async () => {
    if (!activeTrack) return;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError && authError.message !== 'Auth session missing!') {
        console.warn('Auth error when recording play:', authError);
      }
      
      // Generate a session ID for anonymous users
      let sessionId = localStorage.getItem('soundscape_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('soundscape_session_id', sessionId);
      }

      const { error: insertError } = await supabase.from('plays').insert({
        track_id: activeTrack.id,
        user_id: user?.id || null,
        session_id: sessionId,
        play_duration: 0,
        completed: false,
      });

      if (insertError) {
        console.warn('Failed to record play event:', insertError);
      } else {
        console.log('Play event recorded for:', activeTrack.title);
      }
    } catch (error) {
      console.warn('Error recording play event:', error);
      // Don't throw - analytics failure shouldn't break playback
    }
  };

  /**
   * Enhanced seek functionality with validation and smooth updates
   * Supports both slider input and direct time values
   */
  const handleSeek = (timeOrValues: number | number[]) => {
    const audio = audioRef.current;
    if (!audio || duration <= 0) return;

    let newTime: number;
    
    if (Array.isArray(timeOrValues)) {
      // From slider (percentage)
      newTime = (timeOrValues[0] / 100) * duration;
    } else {
      // Direct time value
      newTime = timeOrValues;
    }

    // Validate and clamp the time
    newTime = Math.max(0, Math.min(duration, newTime));
    
    try {
      audio.currentTime = newTime;
      setCurrentTime(newTime); // Update global state immediately for responsive UI
      console.log(`Seeked to: ${newTime.toFixed(1)}s / ${duration.toFixed(1)}s`);
    } catch (error) {
      console.error('Seek error:', error);
      setError('Failed to seek in track');
    }
  };

  /**
   * Volume control handlers with validation and persistence
   */
  const handleVolumeChange = (values: number[]) => {
    const newVolume = Math.max(0, Math.min(100, values[0])) / 100;
    setVolume(newVolume);
    
    // Auto-unmute if volume is increased from 0
    if (newVolume > 0 && isMuted) {
      toggleMute();
    }
    
    console.log(`Volume changed to: ${(newVolume * 100).toFixed(0)}%`);
  };

  /**
   * Mute toggle with volume memory
   */
  const handleToggleMute = () => {
    toggleMute();
    console.log(`Audio ${isMuted ? 'unmuted' : 'muted'}`);
  };

  /**
   * Repeat mode cycling
   */
  const handleRepeatToggle = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeat(nextMode);
    
    toast({
      title: "Repeat Mode",
      description: `Repeat ${nextMode === 'none' ? 'off' : nextMode === 'one' ? 'track' : 'all'}`,
    });
  };

  /**
   * Shuffle toggle
   */
  const handleShuffleToggle = () => {
    toggleShuffle();
    toast({
      title: "Shuffle",
      description: shuffle ? "Shuffle off" : "Shuffle on",
    });
  };

  /**
   * Enhanced time formatting with hours support
   */
  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Get repeat icon based on current mode
   */
  const getRepeatIcon = () => {
    switch (repeat) {
      case 'one':
        return <span className="relative"><Repeat className="h-4 w-4" /><span className="absolute -top-1 -right-1 text-xs">1</span></span>;
      case 'all':
        return <Repeat className="h-4 w-4" />;
      default:
        return <Repeat className="h-4 w-4 opacity-50" />;
    }
  };

  // Don't render if no active track
  if (!activeTrack) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Hidden HTML5 Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          crossOrigin="anonymous" // Handle CORS for Supabase
        />
      )}
      
      {/* Enhanced Audio Player UI */}
      <Card className={`fixed bottom-0 left-0 right-0 z-50 rounded-none border-0 border-t 
                      bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 
                      glass-effect ${className || ''}`}>
        
        {/* Error Display */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
            <div className="flex items-center justify-between">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                ×
              </Button>
            </div>
          </div>
        )}
        
        {/* Main Player Interface */}
        <div className="flex items-center justify-between p-4 gap-4">
          
          {/* Track Info Section */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 max-w-xs">
            {activeTrack.coverUrl && (
              <div className="relative">
                <img
                  src={activeTrack.coverUrl}
                  alt={activeTrack.title}
                  className="h-12 w-12 rounded-lg object-cover shadow-md"
                  loading="lazy"
                />
                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate text-foreground" title={activeTrack.title}>
                {activeTrack.title}
              </p>
              <p className="text-sm text-muted-foreground truncate" title={activeTrack.artist}>
                {activeTrack.artist}
              </p>
            </div>
          </div>

          {/* Primary Controls Section */}
          <div className="flex items-center space-x-1">
            {/* Shuffle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShuffleToggle}
              className={`h-8 w-8 p-0 ${shuffle ? 'text-primary' : 'text-muted-foreground'}`}
              title={`Shuffle ${shuffle ? 'on' : 'off'}`}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            {/* Previous */}
            <Button
              variant="ghost"
              size="sm"
              onClick={previous}
              className="h-8 w-8 p-0"
              title="Previous track"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleTogglePlay}
              disabled={!audioUrl || isLoading}
              className="h-10 w-10 p-0 hover:bg-primary/10"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            
            {/* Next */}
            <Button
              variant="ghost"
              size="sm"
              onClick={next}
              className="h-8 w-8 p-0"
              title="Next track"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            {/* Repeat */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRepeatToggle}
              className={`h-8 w-8 p-0 ${repeat !== 'none' ? 'text-primary' : 'text-muted-foreground'}`}
              title={`Repeat ${repeat}`}
            >
              {getRepeatIcon()}
            </Button>
          </div>

          {/* Progress Section */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 max-w-md">
            <span className="text-xs text-muted-foreground font-mono min-w-[3rem] text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 group">
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="cursor-pointer"
                disabled={!audioUrl || duration <= 0}
                title={`Seek: ${formatTime(currentTime)} / ${formatTime(duration)}`}
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono min-w-[3rem]">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume Section */}
          <div className="flex items-center space-x-2 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleMute}
              className="h-8 w-8 p-0"
              title={`${isMuted ? 'Unmute' : 'Mute'} (${Math.round(volume * 100)}%)`}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : volume < 0.5 ? (
                <Volume2 className="h-4 w-4 opacity-60" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <div className="w-20 sm:w-24 group">
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="cursor-pointer"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};

export default AudioPlayer;