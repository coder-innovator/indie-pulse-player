import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from '@/components/TrackCard';

/**
 * Player State Interface
 * Manages global audio player state across the application
 */
interface PlayerState {
  // Current track and queue management
  currentTrack: Track | null;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  
  // Audio properties
  volume: number; // 0-1
  isMuted: boolean;
  currentTime: number;
  duration: number;
  
  // Playback settings
  repeat: 'none' | 'one' | 'all';
  shuffle: boolean;
  
  // Loading and error states
  isLoading: boolean;
  error: string | null;
  
  // Player actions
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (tracks: Track[], startIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  seek: (time: number) => void;
  
  // Audio controls
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Settings
  setRepeat: (repeat: 'none' | 'one' | 'all') => void;
  toggleShuffle: () => void;
  
  // Time and duration updates
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * Global Player Store
 * Persists volume, repeat, and shuffle settings to localStorage
 * Manages playback state across navigation and component unmounting
 */
export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentTrack: null,
      queue: [],
      currentIndex: -1,
      isPlaying: false,
      
      volume: 0.8, // Default to 80% volume
      isMuted: false,
      currentTime: 0,
      duration: 0,
      
      repeat: 'none',
      shuffle: false,
      
      isLoading: false,
      error: null,
      
      // Track and queue management
      setCurrentTrack: (track) => {
        set({ 
          currentTrack: track,
          error: null, // Clear any previous errors when setting new track
          isPlaying: !!track // Auto-play when setting a new track
        });
      },
      
      setQueue: (tracks, startIndex = 0) => {
        const validIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
        set({ 
          queue: tracks,
          currentIndex: tracks.length > 0 ? validIndex : -1,
          currentTrack: tracks[validIndex] || null,
          error: null
        });
      },
      
      addToQueue: (track) => {
        const { queue } = get();
        // Check if track already exists in queue
        if (!queue.find(t => t.id === track.id)) {
          set({ queue: [...queue, track] });
        }
      },
      
      removeFromQueue: (trackId) => {
        const { queue, currentIndex, currentTrack } = get();
        const newQueue = queue.filter(track => track.id !== trackId);
        let newIndex = currentIndex;
        let newCurrentTrack = currentTrack;
        
        // Adjust current index if needed
        if (currentTrack?.id === trackId) {
          // Current track was removed
          if (newQueue.length === 0) {
            newIndex = -1;
            newCurrentTrack = null;
          } else if (currentIndex >= newQueue.length) {
            newIndex = 0;
            newCurrentTrack = newQueue[0];
          } else {
            newCurrentTrack = newQueue[currentIndex];
          }
        } else if (currentIndex > queue.findIndex(t => t.id === trackId)) {
          // Removed track was before current track
          newIndex = currentIndex - 1;
        }
        
        set({ 
          queue: newQueue, 
          currentIndex: newIndex,
          currentTrack: newCurrentTrack
        });
      },
      
      clearQueue: () => {
        set({ 
          queue: [], 
          currentIndex: -1, 
          currentTrack: null,
          isPlaying: false
        });
      },
      
      // Playback controls
      play: () => set({ isPlaying: true, error: null }),
      pause: () => set({ isPlaying: false }),
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      next: () => {
        const { queue, currentIndex, repeat, shuffle } = get();
        if (queue.length === 0) return;
        
        let nextIndex: number;
        
        if (repeat === 'one') {
          // Stay on current track
          nextIndex = currentIndex;
        } else if (shuffle) {
          // Random next track (excluding current)
          const availableIndices = queue.map((_, i) => i).filter(i => i !== currentIndex);
          if (availableIndices.length === 0) {
            nextIndex = currentIndex;
          } else {
            nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          }
        } else {
          // Sequential next
          nextIndex = currentIndex + 1;
          if (nextIndex >= queue.length) {
            nextIndex = repeat === 'all' ? 0 : currentIndex; // Stay on last track if no repeat
          }
        }
        
        if (nextIndex !== currentIndex || repeat === 'one') {
          set({ 
            currentIndex: nextIndex,
            currentTrack: queue[nextIndex],
            currentTime: 0,
            error: null
          });
        }
      },
      
      previous: () => {
        const { queue, currentIndex, shuffle } = get();
        if (queue.length === 0) return;
        
        let prevIndex: number;
        
        if (shuffle) {
          // Random previous track (excluding current)
          const availableIndices = queue.map((_, i) => i).filter(i => i !== currentIndex);
          if (availableIndices.length === 0) {
            prevIndex = currentIndex;
          } else {
            prevIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
          }
        } else {
          // Sequential previous
          prevIndex = currentIndex - 1;
          if (prevIndex < 0) {
            prevIndex = queue.length - 1; // Go to last track
          }
        }
        
        set({ 
          currentIndex: prevIndex,
          currentTrack: queue[prevIndex],
          currentTime: 0,
          error: null
        });
      },
      
      seek: (time) => {
        set({ currentTime: Math.max(0, time) });
      },
      
      // Audio controls
      setVolume: (volume) => {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ 
          volume: clampedVolume,
          isMuted: clampedVolume === 0 ? true : get().isMuted
        });
      },
      
      toggleMute: () => {
        set((state) => ({ isMuted: !state.isMuted }));
      },
      
      // Settings
      setRepeat: (repeat) => set({ repeat }),
      toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),
      
      // Time and duration updates
      setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),
      setDuration: (duration) => set({ duration: Math.max(0, duration) }),
      
      // Loading and error states
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error, isLoading: false }),
    }),
    {
      name: 'music-player-storage',
      partialize: (state) => ({
        // Only persist user preferences, not playback state
        volume: state.volume,
        isMuted: state.isMuted,
        repeat: state.repeat,
        shuffle: state.shuffle,
      }),
    }
  )
);

/**
 * Utility hooks for common player operations
 */

// Hook for current playback status
export const usePlaybackStatus = () => {
  return usePlayerStore((state) => ({
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    isLoading: state.isLoading,
    error: state.error,
  }));
};

// Hook for queue management
export const useQueue = () => {
  return usePlayerStore((state) => ({
    queue: state.queue,
    currentIndex: state.currentIndex,
    setQueue: state.setQueue,
    addToQueue: state.addToQueue,
    removeFromQueue: state.removeFromQueue,
    clearQueue: state.clearQueue,
  }));
};

// Hook for audio controls
export const useAudioControls = () => {
  return usePlayerStore((state) => ({
    volume: state.volume,
    isMuted: state.isMuted,
    setVolume: state.setVolume,
    toggleMute: state.toggleMute,
  }));
};

// Hook for playback controls
export const usePlaybackControls = () => {
  return usePlayerStore((state) => ({
    play: state.play,
    pause: state.pause,
    togglePlay: state.togglePlay,
    next: state.next,
    previous: state.previous,
    seek: state.seek,
  }));
};
