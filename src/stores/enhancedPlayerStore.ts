import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { Track } from '@/components/TrackCard';

/**
 * Enhanced Player Store with Spotify-level features
 * - Queue management with drag-to-reorder
 * - Crossfade and gapless playback
 * - Recently played history
 * - Smart queue continuation
 * - Offline support
 * - Keyboard shortcuts
 * - Mobile gestures
 */

export interface QueueItem extends Track {
  queueId: string; // Unique ID for queue management
  addedAt: number; // Timestamp when added to queue
  source: 'user' | 'autoplay' | 'radio' | 'playlist'; // How it was added
}

export interface PlaybackHistory {
  track: Track;
  playedAt: number;
  playDuration: number; // How long it was played
  completed: boolean; // Whether it played to the end
}

export interface CrossfadeSettings {
  enabled: boolean;
  duration: number; // 0-12 seconds
}

export interface PlaybackSettings {
  crossfade: CrossfadeSettings;
  gaplessPlayback: boolean;
  autoplay: boolean; // Continue with similar songs when queue ends
  normalizeVolume: boolean;
  replayGain: boolean;
}

export interface OfflineState {
  isOffline: boolean;
  cachedTracks: string[]; // Track IDs that are cached
  lastOnlineAt: number;
}

export interface EnhancedPlayerState {
  // Core playback state
  currentTrack: Track | null;
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  
  // Audio properties
  volume: number; // 0-1
  isMuted: boolean;
  currentTime: number;
  duration: number;
  buffered: number; // Buffered percentage
  
  // Playback settings
  repeat: 'none' | 'one' | 'all';
  shuffle: boolean;
  shuffleHistory: number[]; // Track original indices for unshuffle
  
  // Advanced features
  playbackSettings: PlaybackSettings;
  playbackHistory: PlaybackHistory[];
  upNext: QueueItem[]; // Separate from main queue for "play next"
  
  // UI state
  isLoading: boolean;
  error: string | null;
  miniPlayerVisible: boolean;
  fullPlayerVisible: boolean;
  queueVisible: boolean;
  
  // Offline support
  offlineState: OfflineState;
  
  // Smart features
  lastPlaybackPosition: { [trackId: string]: number }; // Resume positions
  similarTracksCache: { [trackId: string]: Track[] };
  
  // Actions - Basic playback
  setCurrentTrack: (track: Track | null, startPlaying?: boolean) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: (manual?: boolean) => void;
  previous: (manual?: boolean) => void;
  seek: (time: number) => void;
  
  // Actions - Queue management
  setQueue: (tracks: Track[], startIndex?: number, source?: QueueItem['source']) => void;
  addToQueue: (track: Track, position?: 'end' | 'next', source?: QueueItem['source']) => void;
  addToUpNext: (track: Track) => void;
  removeFromQueue: (queueId: string) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  clearQueue: () => void;
  clearUpNext: () => void;
  
  // Actions - Audio controls
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  
  // Actions - Playback settings
  setRepeat: (repeat: 'none' | 'one' | 'all') => void;
  toggleShuffle: () => void;
  updatePlaybackSettings: (settings: Partial<PlaybackSettings>) => void;
  
  // Actions - UI state
  setMiniPlayerVisible: (visible: boolean) => void;
  setFullPlayerVisible: (visible: boolean) => void;
  setQueueVisible: (visible: boolean) => void;
  
  // Actions - Time and state updates
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setBuffered: (buffered: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - History and smart features
  addToHistory: (track: Track, playDuration: number, completed: boolean) => void;
  savePlaybackPosition: (trackId: string, position: number) => void;
  getPlaybackPosition: (trackId: string) => number;
  loadSimilarTracks: (trackId: string) => Promise<void>;
  
  // Actions - Offline support
  setOfflineState: (state: Partial<OfflineState>) => void;
  addCachedTrack: (trackId: string) => void;
  removeCachedTrack: (trackId: string) => void;
  
  // Utility methods
  getCurrentQueueItem: () => QueueItem | null;
  getNextTrack: () => QueueItem | null;
  getPreviousTrack: () => QueueItem | null;
  canPlayNext: () => boolean;
  canPlayPrevious: () => boolean;
  getQueueLength: () => number;
  getTimeRemaining: () => number;
}

// Generate unique queue ID
const generateQueueId = () => `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Convert Track to QueueItem
const trackToQueueItem = (track: Track, source: QueueItem['source'] = 'user'): QueueItem => ({
  ...track,
  queueId: generateQueueId(),
  addedAt: Date.now(),
  source,
});

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Create enhanced player store
export const useEnhancedPlayerStore = create<EnhancedPlayerState>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        currentTrack: null,
        queue: [],
        currentIndex: -1,
        isPlaying: false,
        
        volume: 0.8,
        isMuted: false,
        currentTime: 0,
        duration: 0,
        buffered: 0,
        
        repeat: 'none',
        shuffle: false,
        shuffleHistory: [],
        
        playbackSettings: {
          crossfade: {
            enabled: false,
            duration: 3, // 3 seconds default
          },
          gaplessPlayback: true,
          autoplay: true,
          normalizeVolume: false,
          replayGain: false,
        },
        
        playbackHistory: [],
        upNext: [],
        
        isLoading: false,
        error: null,
        miniPlayerVisible: false,
        fullPlayerVisible: false,
        queueVisible: false,
        
        offlineState: {
          isOffline: false,
          cachedTracks: [],
          lastOnlineAt: Date.now(),
        },
        
        lastPlaybackPosition: {},
        similarTracksCache: {},
        
        // Basic playback actions
        setCurrentTrack: (track, startPlaying = true) => {
          const state = get();
          
          // Save current position if there was a previous track
          if (state.currentTrack && state.currentTime > 0) {
            state.savePlaybackPosition(state.currentTrack.id, state.currentTime);
          }
          
          set({ 
            currentTrack: track,
            error: null,
            isPlaying: startPlaying && !!track,
            currentTime: track ? (state.getPlaybackPosition(track.id) || 0) : 0,
            miniPlayerVisible: !!track,
          });
          
          // Load similar tracks for autoplay
          if (track && state.playbackSettings.autoplay) {
            state.loadSimilarTracks(track.id);
          }
        },
        
        play: () => set({ isPlaying: true, error: null }),
        pause: () => set({ isPlaying: false }),
        togglePlay: () => {
          const state = get();
          set({ isPlaying: !state.isPlaying, error: null });
        },
        
        next: (manual = false) => {
          const state = get();
          let nextIndex = -1;
          
          // Check upNext queue first
          if (state.upNext.length > 0) {
            const nextTrack = state.upNext[0];
            set({
              currentTrack: nextTrack,
              upNext: state.upNext.slice(1),
              currentTime: 0,
              isPlaying: state.isPlaying,
            });
            return;
          }
          
          // Handle repeat one
          if (state.repeat === 'one' && !manual) {
            state.seek(0);
            return;
          }
          
          // Find next track in queue
          if (state.shuffle) {
            // In shuffle mode, pick a random unplayed track
            const unplayedIndices = state.queue
              .map((_, index) => index)
              .filter(index => !state.shuffleHistory.includes(index) && index !== state.currentIndex);
            
            if (unplayedIndices.length > 0) {
              nextIndex = unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)];
            } else if (state.repeat === 'all') {
              // Reset shuffle history and pick random track
              set({ shuffleHistory: [] });
              nextIndex = Math.floor(Math.random() * state.queue.length);
            }
          } else {
            // Normal sequential playback
            if (state.currentIndex < state.queue.length - 1) {
              nextIndex = state.currentIndex + 1;
            } else if (state.repeat === 'all') {
              nextIndex = 0;
            }
          }
          
          if (nextIndex >= 0 && nextIndex < state.queue.length) {
            const nextTrack = state.queue[nextIndex];
            set({
              currentTrack: nextTrack,
              currentIndex: nextIndex,
              currentTime: 0,
              shuffleHistory: state.shuffle ? [...state.shuffleHistory, state.currentIndex] : [],
            });
          } else if (state.playbackSettings.autoplay && state.currentTrack) {
            // Try to play similar tracks
            const similarTracks = state.similarTracksCache[state.currentTrack.id] || [];
            if (similarTracks.length > 0) {
              const randomSimilar = similarTracks[Math.floor(Math.random() * similarTracks.length)];
              state.addToQueue(randomSimilar, 'end', 'autoplay');
              state.next();
            } else {
              // Stop playback if no similar tracks
              set({ isPlaying: false });
            }
          } else {
            // Stop playback
            set({ isPlaying: false });
          }
        },
        
        previous: (manual = false) => {
          const state = get();
          
          // If more than 3 seconds played, restart current track
          if (state.currentTime > 3 && !manual) {
            state.seek(0);
            return;
          }
          
          let prevIndex = -1;
          
          if (state.shuffle) {
            // In shuffle mode, go back in shuffle history
            if (state.shuffleHistory.length > 0) {
              prevIndex = state.shuffleHistory[state.shuffleHistory.length - 1];
              set({
                shuffleHistory: state.shuffleHistory.slice(0, -1)
              });
            }
          } else {
            // Normal sequential playback
            if (state.currentIndex > 0) {
              prevIndex = state.currentIndex - 1;
            } else if (state.repeat === 'all') {
              prevIndex = state.queue.length - 1;
            }
          }
          
          if (prevIndex >= 0 && prevIndex < state.queue.length) {
            const prevTrack = state.queue[prevIndex];
            set({
              currentTrack: prevTrack,
              currentIndex: prevIndex,
              currentTime: 0,
            });
          }
        },
        
        seek: (time) => {
          const state = get();
          const clampedTime = Math.max(0, Math.min(time, state.duration));
          set({ currentTime: clampedTime });
        },
        
        // Queue management actions
        setQueue: (tracks, startIndex = 0, source = 'user') => {
          const queueItems = tracks.map(track => trackToQueueItem(track, source));
          const validIndex = Math.max(0, Math.min(startIndex, queueItems.length - 1));
          
          set({ 
            queue: queueItems,
            currentIndex: queueItems.length > 0 ? validIndex : -1,
            currentTrack: queueItems.length > 0 ? queueItems[validIndex] : null,
            shuffleHistory: [],
            currentTime: 0,
          });
        },
        
        addToQueue: (track, position = 'end', source = 'user') => {
          const state = get();
          const queueItem = trackToQueueItem(track, source);
          
          // Check for duplicates
          const existingIndex = state.queue.findIndex(item => item.id === track.id);
          if (existingIndex !== -1 && position === 'end') {
            return; // Don't add duplicate to end
          }
          
          let newQueue = [...state.queue];
          let newIndex = state.currentIndex;
          
          if (position === 'next') {
            // Add after current track
            const insertIndex = state.currentIndex + 1;
            newQueue.splice(insertIndex, 0, queueItem);
            
            // Adjust current index if needed
            if (insertIndex <= state.currentIndex) {
              newIndex = state.currentIndex + 1;
            }
          } else {
            // Add to end
            newQueue.push(queueItem);
          }
          
          set({ 
            queue: newQueue,
            currentIndex: newIndex,
          });
          
          // If queue was empty, start playing
          if (state.queue.length === 0) {
            set({
              currentTrack: queueItem,
              currentIndex: 0,
              miniPlayerVisible: true,
            });
          }
        },
        
        addToUpNext: (track) => {
          const state = get();
          const queueItem = trackToQueueItem(track, 'user');
          set({
            upNext: [...state.upNext, queueItem]
          });
        },
        
        removeFromQueue: (queueId) => {
          const state = get();
          const removeIndex = state.queue.findIndex(item => item.queueId === queueId);
          
          if (removeIndex === -1) return;
          
          const newQueue = state.queue.filter(item => item.queueId !== queueId);
          let newIndex = state.currentIndex;
          let newCurrentTrack = state.currentTrack;
          
          if (removeIndex < state.currentIndex) {
            newIndex = state.currentIndex - 1;
          } else if (removeIndex === state.currentIndex) {
            // Removing current track
            if (newQueue.length === 0) {
              newCurrentTrack = null;
              newIndex = -1;
            } else if (newIndex >= newQueue.length) {
              newIndex = newQueue.length - 1;
              newCurrentTrack = newQueue[newIndex];
            } else {
              newCurrentTrack = newQueue[newIndex];
            }
          }
          
          set({
            queue: newQueue,
            currentIndex: newIndex,
            currentTrack: newCurrentTrack,
            miniPlayerVisible: !!newCurrentTrack,
          });
        },
        
        reorderQueue: (fromIndex, toIndex) => {
          const state = get();
          const newQueue = [...state.queue];
          const [movedItem] = newQueue.splice(fromIndex, 1);
          newQueue.splice(toIndex, 0, movedItem);
          
          // Update current index
          let newCurrentIndex = state.currentIndex;
          if (fromIndex === state.currentIndex) {
            newCurrentIndex = toIndex;
          } else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) {
            newCurrentIndex = state.currentIndex - 1;
          } else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) {
            newCurrentIndex = state.currentIndex + 1;
          }
          
          set({
            queue: newQueue,
            currentIndex: newCurrentIndex,
          });
        },
        
        clearQueue: () => {
          set({
            queue: [],
            currentIndex: -1,
            currentTrack: null,
            shuffleHistory: [],
            miniPlayerVisible: false,
          });
        },
        
        clearUpNext: () => set({ upNext: [] }),
        
        // Audio controls
        setVolume: (volume) => {
          const clampedVolume = Math.max(0, Math.min(1, volume));
          set({ volume: clampedVolume, isMuted: false });
        },
        
        toggleMute: () => {
          const state = get();
          set({ isMuted: !state.isMuted });
        },
        
        // Playback settings
        setRepeat: (repeat) => set({ repeat }),
        
        toggleShuffle: () => {
          const state = get();
          set({ 
            shuffle: !state.shuffle,
            shuffleHistory: [], // Reset shuffle history
          });
        },
        
        updatePlaybackSettings: (settings) => {
          const state = get();
          set({
            playbackSettings: { ...state.playbackSettings, ...settings }
          });
        },
        
        // UI state
        setMiniPlayerVisible: (visible) => set({ miniPlayerVisible: visible }),
        setFullPlayerVisible: (visible) => set({ fullPlayerVisible: visible }),
        setQueueVisible: (visible) => set({ queueVisible: visible }),
        
        // Time and state updates
        setCurrentTime: (time) => set({ currentTime: time }),
        setDuration: (duration) => set({ duration }),
        setBuffered: (buffered) => set({ buffered }),
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        
        // History and smart features
        addToHistory: (track, playDuration, completed) => {
          const state = get();
          const historyEntry: PlaybackHistory = {
            track,
            playedAt: Date.now(),
            playDuration,
            completed,
          };
          
          const newHistory = [historyEntry, ...state.playbackHistory.slice(0, 49)]; // Keep last 50
          set({ playbackHistory: newHistory });
        },
        
        savePlaybackPosition: (trackId, position) => {
          const state = get();
          set({
            lastPlaybackPosition: {
              ...state.lastPlaybackPosition,
              [trackId]: position
            }
          });
        },
        
        getPlaybackPosition: (trackId) => {
          const state = get();
          return state.lastPlaybackPosition[trackId] || 0;
        },
        
        loadSimilarTracks: async (trackId) => {
          const state = get();
          
          // Check cache first
          if (state.similarTracksCache[trackId]) {
            return;
          }
          
          try {
            // TODO: Implement API call to get similar tracks
            // For now, use empty array
            set({
              similarTracksCache: {
                ...state.similarTracksCache,
                [trackId]: []
              }
            });
          } catch (error) {
            console.error('Failed to load similar tracks:', error);
          }
        },
        
        // Offline support
        setOfflineState: (state) => {
          const currentState = get();
          set({
            offlineState: { ...currentState.offlineState, ...state }
          });
        },
        
        addCachedTrack: (trackId) => {
          const state = get();
          if (!state.offlineState.cachedTracks.includes(trackId)) {
            set({
              offlineState: {
                ...state.offlineState,
                cachedTracks: [...state.offlineState.cachedTracks, trackId]
              }
            });
          }
        },
        
        removeCachedTrack: (trackId) => {
          const state = get();
          set({
            offlineState: {
              ...state.offlineState,
              cachedTracks: state.offlineState.cachedTracks.filter(id => id !== trackId)
            }
          });
        },
        
        // Utility methods
        getCurrentQueueItem: () => {
          const state = get();
          return state.currentIndex >= 0 && state.currentIndex < state.queue.length 
            ? state.queue[state.currentIndex] 
            : null;
        },
        
        getNextTrack: () => {
          const state = get();
          
          // Check upNext first
          if (state.upNext.length > 0) {
            return state.upNext[0];
          }
          
          // Handle repeat one
          if (state.repeat === 'one') {
            return state.getCurrentQueueItem();
          }
          
          let nextIndex = -1;
          
          if (state.shuffle) {
            const unplayedIndices = state.queue
              .map((_, index) => index)
              .filter(index => !state.shuffleHistory.includes(index) && index !== state.currentIndex);
            
            if (unplayedIndices.length > 0) {
              nextIndex = unplayedIndices[0]; // Just return first for preview
            } else if (state.repeat === 'all') {
              nextIndex = 0;
            }
          } else {
            if (state.currentIndex < state.queue.length - 1) {
              nextIndex = state.currentIndex + 1;
            } else if (state.repeat === 'all') {
              nextIndex = 0;
            }
          }
          
          return nextIndex >= 0 && nextIndex < state.queue.length 
            ? state.queue[nextIndex] 
            : null;
        },
        
        getPreviousTrack: () => {
          const state = get();
          let prevIndex = -1;
          
          if (state.shuffle && state.shuffleHistory.length > 0) {
            prevIndex = state.shuffleHistory[state.shuffleHistory.length - 1];
          } else if (state.currentIndex > 0) {
            prevIndex = state.currentIndex - 1;
          } else if (state.repeat === 'all') {
            prevIndex = state.queue.length - 1;
          }
          
          return prevIndex >= 0 && prevIndex < state.queue.length 
            ? state.queue[prevIndex] 
            : null;
        },
        
        canPlayNext: () => {
          const state = get();
          return state.upNext.length > 0 || 
                 state.getNextTrack() !== null || 
                 (state.playbackSettings.autoplay && state.currentTrack !== null);
        },
        
        canPlayPrevious: () => {
          const state = get();
          return state.currentTime > 3 || state.getPreviousTrack() !== null;
        },
        
        getQueueLength: () => {
          const state = get();
          return state.queue.length + state.upNext.length;
        },
        
        getTimeRemaining: () => {
          const state = get();
          return Math.max(0, state.duration - state.currentTime);
        },
      }),
      {
        name: 'enhanced-music-player-storage',
        partialize: (state) => ({
          // Persist only essential settings and state
          volume: state.volume,
          isMuted: state.isMuted,
          repeat: state.repeat,
          shuffle: state.shuffle,
          playbackSettings: state.playbackSettings,
          lastPlaybackPosition: state.lastPlaybackPosition,
          playbackHistory: state.playbackHistory.slice(0, 20), // Limit persisted history
          offlineState: state.offlineState,
        }),
      }
    )
  )
);

// Utility hooks for specific use cases
export const usePlaybackStatus = () => useEnhancedPlayerStore(state => ({
  isPlaying: state.isPlaying,
  currentTrack: state.currentTrack,
  currentTime: state.currentTime,
  duration: state.duration,
  buffered: state.buffered,
}));

export const useQueue = () => useEnhancedPlayerStore(state => ({
  queue: state.queue,
  upNext: state.upNext,
  currentIndex: state.currentIndex,
  queueLength: state.getQueueLength(),
}));

export const useAudioControls = () => useEnhancedPlayerStore(state => ({
  volume: state.volume,
  isMuted: state.isMuted,
  setVolume: state.setVolume,
  toggleMute: state.toggleMute,
}));

export const usePlaybackControls = () => useEnhancedPlayerStore(state => ({
  play: state.play,
  pause: state.pause,
  togglePlay: state.togglePlay,
  next: state.next,
  previous: state.previous,
  seek: state.seek,
  canPlayNext: state.canPlayNext(),
  canPlayPrevious: state.canPlayPrevious(),
}));
