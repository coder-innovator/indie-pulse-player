import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Heart, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  coverUrl: string;
  tags: string[];
  isLiked?: boolean;
}

interface TrackCardProps {
  track: Track;
  isPlaying?: boolean;
  onPlay?: (trackId: string) => void;
  onLike?: (trackId: string) => void;
  onAddToQueue?: (trackId: string) => void;
  className?: string;
}

export function TrackCard({ 
  track, 
  isPlaying = false, 
  onPlay, 
  onLike, 
  onAddToQueue,
  className 
}: TrackCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Card 
      className={cn(
        "group relative music-card p-4 cursor-pointer transition-all duration-300",
        "hover:scale-[1.02] hover:bg-card/80",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay?.(track.id)}
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
                onPlay?.(track.id);
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
              
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 focus-ring"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToQueue?.(track.id);
                }}
                aria-label={`Add ${track.title} to queue`}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{track.duration}</span>
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
  );
}