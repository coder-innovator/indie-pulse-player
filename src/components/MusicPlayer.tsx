import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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
  List
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrentTrack {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  isLiked?: boolean;
}

interface MusicPlayerProps {
  currentTrack?: CurrentTrack;
  isPlaying?: boolean;
  currentTime?: number;
  volume?: number;
  isShuffled?: boolean;
  isRepeating?: boolean;
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSeek?: (time: number) => void;
  onVolumeChange?: (volume: number) => void;
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  onToggleLike?: () => void;
  onShowQueue?: () => void;
}

export function MusicPlayer({
  currentTrack,
  isPlaying = false,
  currentTime = 0,
  volume = 80,
  isShuffled = false,
  isRepeating = false,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onShowQueue,
}: MusicPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeToggle = () => {
    if (isMuted) {
      setIsMuted(false);
      onVolumeChange?.(volume);
    } else {
      setIsMuted(true);
      onVolumeChange?.(0);
    }
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass-effect border-t border-border">
      <div className="px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={currentTrack.coverUrl}
                alt={`${currentTrack.title} cover`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h4 className="font-medium text-foreground truncate text-sm">
                {currentTrack.title}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                "w-8 h-8 flex-shrink-0 focus-ring",
                currentTrack.isLiked && "text-accent hover:text-accent"
              )}
              onClick={onToggleLike}
              aria-label={currentTrack.isLiked ? "Unlike track" : "Like track"}
            >
              <Heart className={cn("w-4 h-4", currentTrack.isLiked && "fill-current")} />
            </Button>
          </div>

          {/* Main Controls */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl">
            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "w-8 h-8 focus-ring",
                  isShuffled && "text-primary hover:text-primary"
                )}
                onClick={onToggleShuffle}
                aria-label="Toggle shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 focus-ring"
                onClick={onPrevious}
                aria-label="Previous track"
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                className="w-10 h-10 rounded-full bg-primary hover:bg-primary/90 focus-ring"
                onClick={onPlayPause}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 focus-ring"
                onClick={onNext}
                aria-label="Next track"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "w-8 h-8 focus-ring",
                  isRepeating && "text-primary hover:text-primary"
                )}
                onClick={onToggleRepeat}
                aria-label="Toggle repeat"
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  max={currentTrack.duration}
                  step={1}
                  className="w-full"
                  onValueChange={(value) => onSeek?.(value[0])}
                  aria-label="Track progress"
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatTime(currentTrack.duration)}
              </span>
            </div>
          </div>

          {/* Volume & Queue */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 focus-ring"
              onClick={onShowQueue}
              aria-label="Show queue"
              >
                <List className="w-4 h-4" />
              </Button>

            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 focus-ring"
                onClick={handleVolumeToggle}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
              <div className="w-24">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  step={1}
                  className="w-full"
                  onValueChange={(value) => {
                    const newVolume = value[0];
                    setIsMuted(newVolume === 0);
                    onVolumeChange?.(newVolume);
                  }}
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}