import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedPlayerStore } from '@/stores/enhancedPlayerStore';
import { useToast } from '@/hooks/use-toast';

/**
 * Global Keyboard Shortcuts Hook
 * Provides Spotify-like keyboard shortcuts throughout the app
 * 
 * Shortcuts:
 * - Space: Play/Pause
 * - Left/Right: Seek ±10s (or prev/next with Cmd/Ctrl)
 * - Up/Down: Volume ±10%
 * - M: Mute/Unmute
 * - R: Cycle repeat modes
 * - S: Toggle shuffle
 * - L: Like current track
 * - Q: Toggle queue
 * - F: Toggle full player
 * - Cmd/Ctrl + F: Focus search
 * - Cmd/Ctrl + 1-9: Navigate to different sections
 * - Escape: Close modals/overlays
 */

interface KeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardShortcuts = (options: KeyboardShortcutsOptions = {}) => {
  const { enabled = true, preventDefault = true } = options;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    repeat,
    shuffle,
    queueVisible,
    fullPlayerVisible,
    togglePlay,
    setVolume,
    toggleMute,
    seek,
    next,
    previous,
    setRepeat,
    toggleShuffle,
    setQueueVisible,
    setFullPlayerVisible,
  } = useEnhancedPlayerStore();
  
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't handle shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isInputFocused = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';
    
    // Allow certain shortcuts even in inputs
    const allowInInputs = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5'];
    
    if (isInputFocused && !allowInInputs.includes(event.code)) {
      return;
    }
    
    const { code, key, metaKey, ctrlKey, shiftKey, altKey } = event;
    const isModified = metaKey || ctrlKey || shiftKey || altKey;
    
    // Helper to prevent default and stop propagation
    const preventAndStop = () => {
      if (preventDefault) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    
    // Basic playback controls
    switch (code) {
      case 'Space':
        if (!isInputFocused) {
          togglePlay();
          preventAndStop();
          toast({
            title: isPlaying ? 'Paused' : 'Playing',
            description: currentTrack ? `${currentTrack.title} by ${currentTrack.artist}` : 'No track selected',
          });
        }
        break;
        
      case 'ArrowLeft':
        preventAndStop();
        if (metaKey || ctrlKey) {
          // Previous track
          previous(true);
          toast({
            title: 'Previous track',
            description: 'Skipped to previous track',
          });
        } else {
          // Seek backward 10 seconds
          const newTime = Math.max(0, currentTime - 10);
          seek(newTime);
        }
        break;
        
      case 'ArrowRight':
        preventAndStop();
        if (metaKey || ctrlKey) {
          // Next track
          next(true);
          toast({
            title: 'Next track',
            description: 'Skipped to next track',
          });
        } else {
          // Seek forward 10 seconds
          const newTime = Math.min(duration, currentTime + 10);
          seek(newTime);
        }
        break;
        
      case 'ArrowUp':
        preventAndStop();
        if (shiftKey) {
          // Increase volume by 20%
          const newVolume = Math.min(1, volume + 0.2);
          setVolume(newVolume);
          toast({
            title: 'Volume',
            description: `${Math.round(newVolume * 100)}%`,
          });
        } else {
          // Increase volume by 10%
          const newVolume = Math.min(1, volume + 0.1);
          setVolume(newVolume);
        }
        break;
        
      case 'ArrowDown':
        preventAndStop();
        if (shiftKey) {
          // Decrease volume by 20%
          const newVolume = Math.max(0, volume - 0.2);
          setVolume(newVolume);
          toast({
            title: 'Volume',
            description: `${Math.round(newVolume * 100)}%`,
          });
        } else {
          // Decrease volume by 10%
          const newVolume = Math.max(0, volume - 0.1);
          setVolume(newVolume);
        }
        break;
        
      case 'KeyM':
        if (!isModified) {
          toggleMute();
          preventAndStop();
          toast({
            title: isMuted ? 'Unmuted' : 'Muted',
            description: 'Audio mute toggled',
          });
        }
        break;
        
      case 'KeyR':
        if (!isModified) {
          const nextRepeat = repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none';
          setRepeat(nextRepeat);
          preventAndStop();
          toast({
            title: 'Repeat',
            description: `Repeat ${nextRepeat === 'none' ? 'off' : nextRepeat}`,
          });
        }
        break;
        
      case 'KeyS':
        if (!isModified) {
          toggleShuffle();
          preventAndStop();
          toast({
            title: shuffle ? 'Shuffle off' : 'Shuffle on',
            description: 'Shuffle mode toggled',
          });
        }
        break;
        
      case 'KeyL':
        if (!isModified && currentTrack) {
          // TODO: Implement like functionality
          preventAndStop();
          toast({
            title: 'Liked',
            description: `${currentTrack.title} added to Liked Songs`,
          });
        }
        break;
        
      case 'KeyQ':
        if (!isModified) {
          setQueueVisible(!queueVisible);
          preventAndStop();
          toast({
            title: queueVisible ? 'Queue hidden' : 'Queue shown',
            description: 'Queue visibility toggled',
          });
        }
        break;
        
      case 'KeyF':
        if (metaKey || ctrlKey) {
          // Focus search - handled by search component
          break;
        } else if (!isModified) {
          setFullPlayerVisible(!fullPlayerVisible);
          preventAndStop();
          toast({
            title: fullPlayerVisible ? 'Mini player' : 'Full player',
            description: 'Player view toggled',
          });
        }
        break;
        
      case 'Escape':
        preventAndStop();
        // Close any open overlays
        if (fullPlayerVisible) {
          setFullPlayerVisible(false);
        } else if (queueVisible) {
          setQueueVisible(false);
        }
        break;
    }
    
    // Navigation shortcuts with Cmd/Ctrl + number
    if ((metaKey || ctrlKey) && !shiftKey && !altKey) {
      switch (code) {
        case 'Digit1':
          navigate('/');
          preventAndStop();
          break;
        case 'Digit2':
          navigate('/trending');
          preventAndStop();
          break;
        case 'Digit3':
          navigate('/scenes');
          preventAndStop();
          break;
        case 'Digit4':
          navigate('/search');
          preventAndStop();
          break;
        case 'Digit5':
          navigate('/library');
          preventAndStop();
          break;
        case 'Digit6':
          navigate('/dashboard');
          preventAndStop();
          break;
        case 'Digit7':
          navigate('/profile');
          preventAndStop();
          break;
        case 'Digit8':
          navigate('/upload');
          preventAndStop();
          break;
        case 'Digit9':
          // Toggle queue
          setQueueVisible(!queueVisible);
          preventAndStop();
          break;
        case 'KeyF':
          // Focus search - let the search component handle this
          break;
      }
    }
    
    // Function keys
    switch (code) {
      case 'F1':
        preventAndStop();
        // Show help/shortcuts
        toast({
          title: 'Keyboard Shortcuts',
          description: 'Space: Play/Pause, ←/→: Seek, ↑/↓: Volume, M: Mute, Q: Queue',
        });
        break;
        
      case 'F2':
        preventAndStop();
        // Rename current playlist (if applicable)
        break;
        
      case 'F5':
        if (!isModified) {
          preventAndStop();
          // Refresh/reload current view
          window.location.reload();
        }
        break;
    }
    
    // Media keys (if available)
    switch (key) {
      case 'MediaPlayPause':
        togglePlay();
        preventAndStop();
        break;
        
      case 'MediaTrackNext':
        next(true);
        preventAndStop();
        break;
        
      case 'MediaTrackPrevious':
        previous(true);
        preventAndStop();
        break;
        
      case 'MediaStop':
        if (isPlaying) {
          togglePlay();
        }
        seek(0);
        preventAndStop();
        break;
    }
  }, [
    enabled,
    preventDefault,
    navigate,
    toast,
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    repeat,
    shuffle,
    queueVisible,
    fullPlayerVisible,
    togglePlay,
    setVolume,
    toggleMute,
    seek,
    next,
    previous,
    setRepeat,
    toggleShuffle,
    setQueueVisible,
    setFullPlayerVisible,
  ]);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Add event listener
    document.addEventListener('keydown', handleKeyPress, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyPress, true);
    };
  }, [enabled, handleKeyPress]);
  
  // Return current shortcuts for reference
  return {
    shortcuts: {
      playback: {
        'Space': 'Play/Pause',
        '←/→': 'Seek ±10s',
        'Cmd/Ctrl + ←/→': 'Previous/Next track',
        '↑/↓': 'Volume ±10%',
        'Shift + ↑/↓': 'Volume ±20%',
        'M': 'Mute/Unmute',
        'R': 'Cycle repeat modes',
        'S': 'Toggle shuffle',
        'L': 'Like current track',
      },
      interface: {
        'Q': 'Toggle queue',
        'F': 'Toggle full player',
        'Escape': 'Close overlays',
        'F1': 'Show help',
        'F5': 'Refresh',
      },
      navigation: {
        'Cmd/Ctrl + 1': 'Home',
        'Cmd/Ctrl + 2': 'Trending',
        'Cmd/Ctrl + 3': 'Scenes',
        'Cmd/Ctrl + 4': 'Search',
        'Cmd/Ctrl + 5': 'Library',
        'Cmd/Ctrl + 6': 'Dashboard',
        'Cmd/Ctrl + 7': 'Profile',
        'Cmd/Ctrl + 8': 'Upload',
        'Cmd/Ctrl + 9': 'Queue',
        'Cmd/Ctrl + F': 'Focus search',
      },
      media: {
        'MediaPlayPause': 'Play/Pause',
        'MediaTrackNext': 'Next track',
        'MediaTrackPrevious': 'Previous track',
        'MediaStop': 'Stop',
      },
    },
  };
};

/**
 * Hook for components that need to disable global shortcuts
 */
export const useDisableShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Stop propagation to prevent global shortcuts
      e.stopPropagation();
    };
    
    document.addEventListener('keydown', handleKeyDown, true);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);
};

/**
 * Component to display keyboard shortcuts help
 */
export const KeyboardShortcutsHelp: React.FC = () => {
  const { shortcuts } = useKeyboardShortcuts({ enabled: false });
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Playback Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {Object.entries(shortcuts.playback).map(([key, description]) => (
            <div key={key} className="flex justify-between">
              <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                {key}
              </kbd>
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Interface</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {Object.entries(shortcuts.interface).map(([key, description]) => (
            <div key={key} className="flex justify-between">
              <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                {key}
              </kbd>
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Navigation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {Object.entries(shortcuts.navigation).map(([key, description]) => (
            <div key={key} className="flex justify-between">
              <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                {key}
              </kbd>
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Media Keys</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {Object.entries(shortcuts.media).map(([key, description]) => (
            <div key={key} className="flex justify-between">
              <kbd className="px-2 py-1 bg-secondary rounded text-xs font-mono">
                {key}
              </kbd>
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
