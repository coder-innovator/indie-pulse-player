import { TrackCard } from "./TrackCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";
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

interface DiscoveryShelfProps {
  title: string;
  description?: string;
  tracks: Track[];
  currentPlayingId?: string;
  onTrackPlay?: (trackId: string) => void;
  onTrackLike?: (trackId: string) => void;
  onTrackQueue?: (trackId: string) => void;
  className?: string;
}

export function DiscoveryShelf({
  title,
  description,
  tracks,
  currentPlayingId,
  onTrackPlay,
  onTrackLike,
  onTrackQueue,
  className
}: DiscoveryShelfProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="text-muted-foreground text-sm mt-1">{description}</p>
          )}
        </div>
        
        {tracks.length > 4 && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full focus-ring"
              onClick={scrollLeft}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full focus-ring"
              onClick={scrollRight}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Tracks Grid */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tracks.map((track) => (
          <div key={track.id} className="flex-shrink-0 w-[280px]">
            <TrackCard
              track={track}
              isPlaying={currentPlayingId === track.id}
              onPlay={onTrackPlay}
              onLike={onTrackLike}
              onAddToQueue={onTrackQueue}
            />
          </div>
        ))}
      </div>

    </section>
  );
}