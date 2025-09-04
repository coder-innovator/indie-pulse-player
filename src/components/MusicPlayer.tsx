import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Heart, 
  List, 
  Shuffle, 
  Repeat 
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
}

interface MusicPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onToggleLike: () => void;
  onShowQueue: () => void;
}

export const MusicPlayer = ({
  currentTrack,
  isPlaying,
  currentTime,
  volume,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleLike,
  onShowQueue
}: MusicPlayerProps) => {
  const [showVolume, setShowVolume] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = (currentTime / currentTrack.duration) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={currentTrack.coverUrl} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm truncate">{currentTrack.title}</h4>
            <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <Button variant="ghost" size="sm" onClick={onPrevious}>
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onPlayPause}
            className="w-10 h-10 rounded-full"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          
          <Button variant="ghost" size="sm" onClick={onNext}>
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              onValueChange={([value]) => onSeek(value)}
              max={currentTrack.duration}
              min={0}
              step={1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-12">
              {formatTime(currentTrack.duration)}
            </span>
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <Button variant="ghost" size="sm" onClick={onToggleLike}>
            <Heart className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" onClick={onShowQueue}>
            <List className="w-4 h-4" />
          </Button>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowVolume(!showVolume)}
            >
              <Volume2 className="w-4 h-4" />
            </Button>
            
            {showVolume && (
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-background border border-border rounded-lg">
                <Slider
                  value={[volume]}
                  onValueChange={([value]) => onVolumeChange(value)}
                  max={100}
                  min={0}
                  step={1}
                  orientation="vertical"
                  className="h-24"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};