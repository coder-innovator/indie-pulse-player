import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Heart, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/playerStore";
import { SoundScapeContextMenu } from "@/components/ContextMenu";
import { useOfflineAware } from "@/hooks/useOfflineDetection";

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  coverUrl: string;
  streamUrl?: string;
  tags?: string[];
  isLiked?: boolean;
  uniqueListeners?: number;
  popularityTier?: 'emerging' | 'rising' | 'established' | 'popular';
  totalPlays?: number;
  bpm?: number;
  genre?: string;
  mood?: string;
  scene?: string;
  releaseDate?: string;
  engagementRate?: number;
  weeklyGrowth?: number;
}

interface TrackCardProps {
  track: Track;
  isPlaying?: boolean; // Optional override - will use global state if not provided
  onPlay?: (track: Track) => void; // Optional override - will use global player if not provided
  onLike?: (trackId: string) => void;
  onAddToQueue?: (trackId: string) => void;
  className?: string;
  showAddToQueue?: boolean; // Whether to show add to queue button
}

export function TrackCard({ 
  track, 
  isPlaying: propIsPlaying, 
  onPlay: propOnPlay, 
  onLike, 
  onAddToQueue,
  className,
  showAddToQueue = true
}: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Offline awareness
  const { shouldShowContent, isOffline } = useOfflineAware();
  const isContentAvailable = shouldShowContent(track.id);
  
  // Global player state
  const { 
    currentTrack, 
    isPlaying: globalIsPlaying, 
    setCurrentTrack, 
    togglePlay,
    addToQueue 
  } = usePlayerStore();
  
  // Determine if this track is currently playing
  const isCurrentTrack = currentTrack?.id === track.id;
  const isPlaying = propIsPlaying !== undefined ? propIsPlaying : (isCurrentTrack && globalIsPlaying);
  
  // Handle play action
  const handlePlay = () => {
    if (propOnPlay) {
      // Use provided onPlay handler
      propOnPlay(track);
    } else {
      // Use global player
      if (isCurrentTrack) {
        // Toggle play/pause for current track
        togglePlay();
      } else {
        // Set new track and play
        setCurrentTrack(track);
        // The player will auto-play when a new track is set
      }
    }
  };
  
  // Handle add to queue
  const handleAddToQueue = () => {
    if (onAddToQueue) {
      onAddToQueue(track.id);
    } else {
      // Use global queue
      addToQueue(track);
    }
  };

  const getPopularityBadge = (tier?: string, listeners?: number) => {
    if (!tier) return null;
    
    const badges = {
      emerging: { emoji: "🌱", label: "Emerging", color: "bg-green-500/20 text-green-400" },
      rising: { emoji: "📈", label: "Rising", color: "bg-blue-500/20 text-blue-400" },
      established: { emoji: "🎯", label: "Established", color: "bg-orange-500/20 text-orange-400" },
      popular: { emoji: "🔥", label: "Popular", color: "bg-red-500/20 text-red-400" }
    };
    
    const badge = badges[tier as keyof typeof badges];
    if (!badge) return null;
    
    return (
      <div className={cn("absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm", badge.color)}>
        {badge.emoji} {badge.label}
        {listeners && (
          <span className="ml-1 opacity-75">
            {listeners < 1000 ? listeners : `${(listeners / 1000).toFixed(1)}K`}
          </span>
        )}
      </div>
    );
  };

  return (
    <SoundScapeContextMenu type="track" item={track}>
      <Card 
        className={cn(
          "group relative music-card p-4 cursor-pointer transition-all duration-300",
          "hover:scale-[1.02] hover:bg-card/80",
          isOffline && !isContentAvailable && "opacity-50 grayscale",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={isContentAvailable ? handlePlay : undefined}
      >
      <div className="relative">
        {/* Album Cover */}
        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg">
          <img
            src={track.coverUrl}
            alt={`${track.title} by ${track.artist}`}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              imageLoaded ? "scale-100 opacity-100" : "scale-110 opacity-0",
              "group-hover:scale-105"
            )}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Popularity badge */}
          {getPopularityBadge(track.popularityTier, track.uniqueListeners)}
          
          {/* Play Button Overlay */}
          <div 
            className={cn(
              "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300",
              isHovered || isPlaying ? "opacity-100" : "opacity-0"
            )}
          >
            <Button
              size="icon"
              className={cn(
                "w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg",
                "hover:scale-110 transition-all duration-200 focus-ring"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </div>
        </div>

        {/* Track Info */}
        <div className="space-y-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {track.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {track.artist}
            </p>
          </div>

          {/* Tags */}
          {track.tags && track.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {track.tags.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-secondary/50 hover:bg-secondary/80 transition-colors"
                >
                  {tag}
                </Badge>
              ))}
              {track.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-secondary/50">
                  +{track.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div 
            className={cn(
              "flex items-center justify-between pt-2 transition-opacity duration-200",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          >
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "w-8 h-8 focus-ring",
                  track.isLiked && "text-accent hover:text-accent"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.(track.id);
                }}
                aria-label={track.isLiked ? `Unlike ${track.title}` : `Like ${track.title}`}
              >
                <Heart className={cn("w-4 h-4", track.isLiked && "fill-current")} />
              </Button>
              
              {showAddToQueue && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 focus-ring"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToQueue();
                  }}
                  aria-label={`Add ${track.title} to queue`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {track.duration && (
                <span className="text-xs text-muted-foreground">{track.duration}</span>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 focus-ring"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      </Card>
    </SoundScapeContextMenu>
  );
}