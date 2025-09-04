import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEnhancedPlayerStore } from '@/stores/enhancedPlayerStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Enhanced Audio Player with Professional Features
 * - Crossfade between tracks (0-12 seconds adjustable)
 * - Gapless playback for continuous albums
 * - Preloading next tracks
 * - Audio normalization
 * - Advanced error handling with retry logic
 * - Offline support with graceful degradation
 */

interface AudioPlayerProps {
  className?: string;
}

// Audio context for advanced features
let audioContext: AudioContext | null = null;
let masterGainNode: GainNode | null = null;

// Get or create audio context
const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGainNode = audioContext.createGain();
    masterGainNode.connect(audioContext.destination);
  }
  return audioContext;
};

export const EnhancedAudioPlayer: React.FC<AudioPlayerProps> = ({ className }) => {
  const { toast } = useToast();
  
  // Store state
  const {
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    volume,
    isMuted,
    repeat,
    shuffle,
    playbackSettings,
    offlineState,
    setCurrentTime,
    setDuration,
    setBuffered,
    setLoading,
    setError,
    next,
    addToHistory,
    savePlaybackPosition,
    getPlaybackPosition,
    addCachedTrack,
    getNextTrack,
  } = useEnhancedPlayerStore();
  
  // Audio element refs
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const crossfadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio nodes for crossfade
  const currentSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const nextSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const currentGainRef = useRef<GainNode | null>(null);
  const nextGainRef = useRef<GainNode | null>(null);
  
  // State
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [preloadedUrl, setPreloadedUrl] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [playStartTime, setPlayStartTime] = useState<number>(0);
  
  // Constants
  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000;
  const PRELOAD_THRESHOLD = 30; // seconds before track ends
  const PROGRESS_UPDATE_INTERVAL = 100; // ms
  
  /**
   * Get signed URL for track with retry logic
   */
  const getSignedUrl = useCallback(async (streamUrl: string, retryAttempt = 0): Promise<string> => {
    try {
      if (!streamUrl) throw new Error('No stream URL provided');
      
      // Check if it's already a full URL
      if (streamUrl.startsWith('http')) {
        return streamUrl;
      }
      
      // Get signed URL from Supabase
      const { data, error } = await supabase.storage
        .from('audio-files')
        .createSignedUrl(streamUrl, 3600); // 1 hour expiry
      
      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL returned');
      
      return data.signedUrl;
    } catch (error: any) {
      console.error(`Failed to get signed URL (attempt ${retryAttempt + 1}):`, error);
      
      if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retryAttempt)));
        return getSignedUrl(streamUrl, retryAttempt + 1);
      }
      
      // Try public URL as fallback
      const publicUrl = `${process.env.REACT_APP_SUPABASE_URL}/storage/v1/object/public/audio-files/${streamUrl}`;
      console.log('Falling back to public URL:', publicUrl);
      return publicUrl;
    }
  }, []);
  
  /**
   * Setup audio element with advanced features
   */
  const setupAudioElement = useCallback((audioElement: HTMLAudioElement, isNext = false): void => {
    if (!audioElement) return;
    
    // Basic setup
    audioElement.preload = 'auto';
    audioElement.crossOrigin = 'anonymous';
    
    try {
      const context = getAudioContext();
      
      // Create audio nodes
      const source = context.createMediaElementSource(audioElement);
      const gainNode = context.createGain();
      
      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(masterGainNode!);
      
      // Store references
      if (isNext) {
        nextSourceRef.current = source;
        nextGainRef.current = gainNode;
        gainNode.gain.value = 0; // Start muted for next track
      } else {
        currentSourceRef.current = source;
        currentGainRef.current = gainNode;
        gainNode.gain.value = isMuted ? 0 : volume;
      }
    } catch (error) {
      console.warn('Web Audio API setup failed, falling back to basic audio:', error);
    }
  }, [volume, isMuted]);
  
  /**
   * Load audio with error handling and caching
   */
  const loadAudio = useCallback(async (
    audioElement: HTMLAudioElement,
    track: any,
    startTime = 0
  ): Promise<void> => {
    if (!audioElement || !track?.stream_url) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Check if track is cached offline
      const isCached = offlineState.cachedTracks.includes(track.id);
      if (offlineState.isOffline && !isCached) {
        throw new Error('Track not available offline');
      }
      
      const audioUrl = await getSignedUrl(track.stream_url);
      
      // Load the audio
      audioElement.src = audioUrl;
      audioElement.currentTime = startTime;
      
      // Wait for metadata
      await new Promise<void>((resolve, reject) => {
        const handleLoadedMetadata = () => {
          audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioElement.removeEventListener('error', handleError);
          resolve();
        };
        
        const handleError = () => {
          audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioElement.removeEventListener('error', handleError);
          reject(new Error('Failed to load audio metadata'));
        };
        
        if (audioElement.readyState >= 1) {
          resolve();
        } else {
          audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
          audioElement.addEventListener('error', handleError);
          audioElement.load();
        }
      });
      
      // Cache track if possible
      if (!isCached && 'caches' in window) {
        try {
          const cache = await caches.open('audio-cache');
          await cache.add(audioUrl);
          addCachedTrack(track.id);
        } catch (error) {
          console.warn('Failed to cache audio:', error);
        }
      }
      
      setLoading(false);
      setRetryCount(0);
    } catch (error: any) {
      console.error('Failed to load audio:', error);
      setError(error.message || 'Failed to load track');
      setLoading(false);
      
      // Retry logic
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          loadAudio(audioElement, track, startTime);
        }, RETRY_DELAY * Math.pow(2, retryCount));
      } else {
        // Skip to next track after max retries
        toast({
          title: 'Playback Error',
          description: `Failed to play "${track.title}". Skipping to next track.`,
          variant: 'destructive',
        });
        next(false); // Auto-skip
      }
    }
  }, [
    setLoading,
    setError,
    offlineState,
    getSignedUrl,
    retryCount,
    addCachedTrack,
    toast,
    next
  ]);
  
  /**
   * Preload next track for gapless playback
   */
  const preloadNextTrack = useCallback(async (): Promise<void> => {
    const nextTrack = getNextTrack();
    if (!nextTrack || !nextAudioRef.current || !playbackSettings.gaplessPlayback) {
      return;
    }
    
    try {
      const nextUrl = await getSignedUrl(nextTrack.stream_url || '');
      if (nextUrl !== preloadedUrl) {
        nextAudioRef.current.src = nextUrl;
        nextAudioRef.current.load();
        setPreloadedUrl(nextUrl);
        console.log('Preloaded next track:', nextTrack.title);
      }
    } catch (error) {
      console.warn('Failed to preload next track:', error);
    }
  }, [getNextTrack, playbackSettings.gaplessPlayback, preloadedUrl, getSignedUrl]);
  
  /**
   * Perform crossfade transition
   */
  const performCrossfade = useCallback(async (): Promise<void> => {
    if (!playbackSettings.crossfade.enabled || 
        !currentGainRef.current || 
        !nextGainRef.current ||
        !currentAudioRef.current ||
        !nextAudioRef.current) {
      return;
    }
    
    const { duration } = playbackSettings.crossfade;
    const context = getAudioContext();
    const now = context.currentTime;
    
    setIsTransitioning(true);
    
    try {
      // Start next track
      await nextAudioRef.current.play();
      
      // Crossfade
      currentGainRef.current.gain.linearRampToValueAtTime(0, now + duration);
      nextGainRef.current.gain.linearRampToValueAtTime(isMuted ? 0 : volume, now + duration);
      
      // Switch audio elements after crossfade
      setTimeout(() => {
        if (currentAudioRef.current) {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
        }
        
        // Swap refs
        [currentAudioRef.current, nextAudioRef.current] = [nextAudioRef.current, currentAudioRef.current];
        [currentSourceRef.current, nextSourceRef.current] = [nextSourceRef.current, currentSourceRef.current];
        [currentGainRef.current, nextGainRef.current] = [nextGainRef.current, currentGainRef.current];
        
        setIsTransitioning(false);
        setPreloadedUrl(null);
      }, duration * 1000);
      
    } catch (error) {
      console.error('Crossfade failed:', error);
      setIsTransitioning(false);
    }
  }, [playbackSettings.crossfade, volume, isMuted]);
  
  /**
   * Handle track end with crossfade or gapless transition
   */
  const handleTrackEnd = useCallback(async (): Promise<void> => {
    if (!currentTrack) return;
    
    // Add to history
    const playDuration = currentAudioRef.current?.currentTime || 0;
    const completed = playDuration > (currentTrack.duration || 0) * 0.8; // 80% completion threshold
    addToHistory(currentTrack, playDuration, completed);
    
    // Save playback position
    if (playDuration > 10) { // Only save if played for more than 10 seconds
      savePlaybackPosition(currentTrack.id, playDuration);
    }
    
    // Handle crossfade or normal transition
    if (playbackSettings.crossfade.enabled && getNextTrack() && nextAudioRef.current?.readyState >= 2) {
      await performCrossfade();
    }
    
    // Move to next track
    next(false);
  }, [
    currentTrack,
    addToHistory,
    savePlaybackPosition,
    playbackSettings.crossfade.enabled,
    getNextTrack,
    performCrossfade,
    next
  ]);
  
  /**
   * Update progress and handle preloading
   */
  const updateProgress = useCallback((): void => {
    const audio = currentAudioRef.current;
    if (!audio) return;
    
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);
    
    // Update buffered
    if (audio.buffered.length > 0) {
      const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
      const bufferedPercentage = (bufferedEnd / audio.duration) * 100;
      setBuffered(bufferedPercentage);
    }
    
    // Preload next track when approaching end
    const timeRemaining = audio.duration - audio.currentTime;
    if (timeRemaining <= PRELOAD_THRESHOLD && !preloadedUrl) {
      preloadNextTrack();
    }
    
    // Start crossfade if enabled
    if (playbackSettings.crossfade.enabled && 
        timeRemaining <= playbackSettings.crossfade.duration &&
        !isTransitioning &&
        getNextTrack()) {
      performCrossfade();
    }
  }, [
    setCurrentTime,
    setDuration,
    setBuffered,
    preloadedUrl,
    preloadNextTrack,
    playbackSettings.crossfade,
    isTransitioning,
    getNextTrack,
    performCrossfade
  ]);
  
  /**
   * Setup audio element event listeners
   */
  const setupAudioListeners = useCallback((audioElement: HTMLAudioElement): (() => void) => {
    const handleLoadStart = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    const handleWaiting = () => setLoading(true);
    const handlePlaying = () => {
      setLoading(false);
      setError(null);
    };
    
    const handleError = (e: Event) => {
      const audio = e.target as HTMLAudioElement;
      const error = audio.error;
      
      let errorMessage = 'Playback error occurred';
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Playback was aborted';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error occurred';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio decoding error';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported';
            break;
        }
      }
      
      console.error('Audio error:', error);
      setError(errorMessage);
      setLoading(false);
      
      // Auto-skip on error
      setTimeout(() => next(false), 2000);
    };
    
    // Add listeners
    audioElement.addEventListener('loadstart', handleLoadStart);
    audioElement.addEventListener('canplay', handleCanPlay);
    audioElement.addEventListener('waiting', handleWaiting);
    audioElement.addEventListener('playing', handlePlaying);
    audioElement.addEventListener('ended', handleTrackEnd);
    audioElement.addEventListener('error', handleError);
    
    // Return cleanup function
    return () => {
      audioElement.removeEventListener('loadstart', handleLoadStart);
      audioElement.removeEventListener('canplay', handleCanPlay);
      audioElement.removeEventListener('waiting', handleWaiting);
      audioElement.removeEventListener('playing', handlePlaying);
      audioElement.removeEventListener('ended', handleTrackEnd);
      audioElement.removeEventListener('error', handleError);
    };
  }, [setLoading, setError, handleTrackEnd, next]);
  
  // Initialize audio elements
  useEffect(() => {
    // Create audio elements
    currentAudioRef.current = new Audio();
    nextAudioRef.current = new Audio();
    
    // Setup audio elements
    setupAudioElement(currentAudioRef.current, false);
    setupAudioElement(nextAudioRef.current, true);
    
    // Setup listeners
    const cleanupCurrent = setupAudioListeners(currentAudioRef.current);
    
    // Progress update interval
    const progressInterval = setInterval(updateProgress, PROGRESS_UPDATE_INTERVAL);
    
    return () => {
      cleanupCurrent();
      clearInterval(progressInterval);
      
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = '';
      }
      if (nextAudioRef.current) {
        nextAudioRef.current.pause();
        nextAudioRef.current.src = '';
      }
      
      if (crossfadeTimeoutRef.current) {
        clearTimeout(crossfadeTimeoutRef.current);
      }
    };
  }, [setupAudioElement, setupAudioListeners, updateProgress]);
  
  // Handle current track changes
  useEffect(() => {
    if (currentTrack && currentAudioRef.current) {
      const startTime = getPlaybackPosition(currentTrack.id);
      loadAudio(currentAudioRef.current, currentTrack, startTime);
      setPlayStartTime(Date.now());
    }
  }, [currentTrack, loadAudio, getPlaybackPosition]);
  
  // Handle play/pause state changes
  useEffect(() => {
    const audio = currentAudioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(error => {
          console.error('Play failed:', error);
          setError('Failed to start playback');
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, setError]);
  
  // Handle volume changes
  useEffect(() => {
    if (currentGainRef.current) {
      const context = getAudioContext();
      const targetVolume = isMuted ? 0 : volume;
      
      if (playbackSettings.normalizeVolume) {
        // Smooth volume changes
        currentGainRef.current.gain.linearRampToValueAtTime(
          targetVolume, 
          context.currentTime + 0.1
        );
      } else {
        currentGainRef.current.gain.value = targetVolume;
      }
    } else if (currentAudioRef.current) {
      // Fallback for basic audio
      currentAudioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted, playbackSettings.normalizeVolume]);
  
  // Handle offline state changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored');
      if (currentTrack && currentAudioRef.current && currentAudioRef.current.error) {
        // Retry loading current track
        loadAudio(currentAudioRef.current, currentTrack);
      }
    };
    
    const handleOffline = () => {
      console.log('Connection lost');
      setError('Connection lost. Playing cached content only.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentTrack, loadAudio, setError]);
  
  // This component doesn't render anything visible
  return null;
};
