import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Heart,
  MoreHorizontal,
  ChevronUp,
  List,
  Music,
  Minimize2,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useEnhancedPlayerStore, usePlaybackStatus, useAudioControls, usePlaybackControls } from '@/stores/enhancedPlayerStore';
import { useToast } from '@/hooks/use-toast';

/**
 * Persistent Mini Player Component
 * - Always visible at bottom when track is playing
 * - Survives navigation between pages
 * - Expandable to full player
 * - Mobile-responsive with swipe gestures
 * - Keyboard shortcuts support
 */

interface MiniPlayerProps {
  className?: string;
}

// Format time in MM:SS format
const formatTime = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ className }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Store hooks
  const {
    currentTrack,
    miniPlayerVisible,
    fullPlayerVisible,
    queueVisible,
    repeat,
    shuffle,
    isLoading,
    error,
    setFullPlayerVisible,
    setQueueVisible,
    setRepeat,
    toggleShuffle,
    addToHistory,
  } = useEnhancedPlayerStore();
  
  const { isPlaying, currentTime, duration, buffered } = usePlaybackStatus();
  const { volume, isMuted, setVolume, toggleMute } = useAudioControls();
  const { play, pause, togglePlay, next, previous, seek, canPlayNext, canPlayPrevious } = usePlaybackControls();
  
  // Local state
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState(0);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Refs
  const progressRef = useRef<HTMLDivElement>(null);
  const startTouchRef = useRef({ x: 0, y: 0 });
  const currentTouchRef = useRef({ x: 0, y: 0 });
  const swipeThreshold = 50;
  
  // Don't render if no track or not visible
  if (!currentTrack || !miniPlayerVisible) {
    return null;
  }
  
  // Handle progress bar interaction
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    seek(newTime);
  }, [duration, seek]);
  
  const handleProgressDrag = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const dragX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, dragX / rect.width));
    
    setDragPosition(percentage * duration);
  }, [isDragging, duration]);
  
  const handleProgressDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressDrag(e);
  }, [handleProgressDrag]);
  
  const handleProgressDragEnd = useCallback(() => {
    if (isDragging) {
      seek(dragPosition);
      setIsDragging(false);
    }
  }, [isDragging, dragPosition, seek]);
  
  // Touch/swipe handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startTouchRef.current = { x: touch.clientX, y: touch.clientY };
    currentTouchRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    currentTouchRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);
  
  const handleTouchEnd = useCallback(() => {
    const deltaX = currentTouchRef.current.x - startTouchRef.current.x;
    const deltaY = currentTouchRef.current.y - startTouchRef.current.y;
    
    // Horizontal swipes for track control
    if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaY) < swipeThreshold) {
      if (deltaX > 0 && canPlayNext) {
        next(true); // Manual next
      } else if (deltaX < 0 && canPlayPrevious) {
        previous(true); // Manual previous
      }
    }
    
    // Vertical swipe down to minimize
    if (deltaY > swipeThreshold && Math.abs(deltaX) < swipeThreshold) {
      setIsMinimized(true);
    }
    
    // Vertical swipe up to expand
    if (deltaY < -swipeThreshold && Math.abs(deltaX) < swipeThreshold) {
      setFullPlayerVisible(true);
    }
  }, [canPlayNext, canPlayPrevious, next, previous, setFullPlayerVisible]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.metaKey || e.ctrlKey) {
            previous(true);
          } else {
            seek(Math.max(0, currentTime - 10));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.metaKey || e.ctrlKey) {
            next(true);
          } else {
            seek(Math.min(duration, currentTime + 10));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyR':
          e.preventDefault();
          const nextRepeat = repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none';
          setRepeat(nextRepeat);
          break;
        case 'KeyS':
          e.preventDefault();
          toggleShuffle();
          break;
        case 'KeyQ':
          e.preventDefault();
          setQueueVisible(!queueVisible);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [
    togglePlay, 
    currentTime, 
    duration, 
    volume, 
    repeat, 
    queueVisible,
    seek, 
    next, 
    previous, 
    setVolume, 
    toggleMute, 
    setRepeat, 
    toggleShuffle, 
    setQueueVisible
  ]);
  
  // Mouse event handlers for progress bar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleProgressDrag(e as any);
    const handleMouseUp = () => handleProgressDragEnd();
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleProgressDrag, handleProgressDragEnd]);
  
  // Handle like/unlike
  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs',
      description: `${currentTrack.title} by ${currentTrack.artist}`,
    });
  }, [isLiked, currentTrack, toast]);
  
  // Handle artist click
  const handleArtistClick = useCallback(() => {
    navigate(`/artist/${currentTrack.artist}`);
  }, [navigate, currentTrack]);
  
  // Calculate progress
  const displayTime = isDragging ? dragPosition : currentTime;
  const progressPercentage = duration > 0 ? (displayTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;
  
  // Minimized state
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        >
          <Music className="h-5 w-5" />
        </Button>
      </div>
    );
  }
  
  return (
    <Card 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "transition-transform duration-300 ease-in-out",
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div 
        ref={progressRef}
        className="relative h-1 bg-secondary cursor-pointer group"
        onClick={handleProgressClick}
        onMouseDown={handleProgressDragStart}
      >
        {/* Buffered progress */}
        <div 
          className="absolute top-0 left-0 h-full bg-secondary-foreground/20 transition-all duration-200"
          style={{ width: `${bufferedPercentage}%` }}
        />
        
        {/* Played progress */}
        <div 
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-200"
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* Scrubber */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 -translate-x-1/2"
          style={{ left: `${progressPercentage}%` }}
        />
      </div>
      
      {/* Main player content */}
      <div className="flex items-center gap-3 p-3">
        {/* Track info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Cover art */}
          <div className="relative w-12 h-12 rounded-md overflow-hidden bg-secondary flex-shrink-0">
            {currentTrack.coverUrl ? (
              <img 
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          {/* Track details */}
          <div className="flex-1 min-w-0">
            <button
              onClick={() => setFullPlayerVisible(true)}
              className="block text-left hover:underline"
            >
              <h3 className="font-medium text-sm truncate">{currentTrack.title}</h3>
            </button>
            <button
              onClick={handleArtistClick}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate block"
            >
              {currentTrack.artist}
            </button>
          </div>
          
          {/* Like button - hidden on mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Heart 
              className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")} 
            />
          </Button>
        </div>
        
        {/* Playback controls */}
        <div className="flex items-center gap-1">
          {/* Previous */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => previous(true)}
            disabled={!canPlayPrevious}
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="h-10 w-10 text-foreground hover:bg-primary/10"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          {/* Next */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => next(true)}
            disabled={!canPlayNext}
            className="h-8 w-8 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Right controls - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1">
          {/* Time display */}
          <div className="text-xs text-muted-foreground font-mono min-w-0">
            {formatTime(displayTime)} / {formatTime(duration)}
          </div>
          
          {/* Queue button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQueueVisible(!queueVisible)}
            className={cn(
              "h-8 w-8",
              queueVisible ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          
          {/* Volume control */}
          <Popover open={showVolumeSlider} onOpenChange={setShowVolumeSlider}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end" side="top">
              <div className="flex items-center gap-2">
                <VolumeX className="h-3 w-3 text-muted-foreground" />
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={([value]) => setVolume(value / 100)}
                  max={100}
                  step={1}
                  className="w-20"
                />
                <Volume2 className="h-3 w-3 text-muted-foreground" />
              </div>
            </PopoverContent>
          </Popover>
          
          {/* More options */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end" side="top">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleShuffle}
                  className={cn(
                    "w-full justify-start gap-2",
                    shuffle && "text-primary"
                  )}
                >
                  <Shuffle className="h-4 w-4" />
                  Shuffle
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const nextRepeat = repeat === 'none' ? 'all' : repeat === 'all' ? 'one' : 'none';
                    setRepeat(nextRepeat);
                  }}
                  className={cn(
                    "w-full justify-start gap-2",
                    repeat !== 'none' && "text-primary"
                  )}
                >
                  <Repeat className="h-4 w-4" />
                  Repeat {repeat !== 'none' && `(${repeat})`}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(true)}
                  className="w-full justify-start gap-2"
                >
                  <Minimize2 className="h-4 w-4" />
                  Minimize
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Expand button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFullPlayerVisible(true)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Error display */}
      {error && (
        <div className="px-3 pb-2">
          <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
            {error}
          </div>
        </div>
      )}
    </Card>
  );
};
