import { Track } from './TrackCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Heart, Plus, Music } from 'lucide-react';
import { MagicalCard, GlassCard, GlowCard } from './MagicalCard';

interface DiscoveryShelfProps {
  tracks: Track[];
  loading?: boolean;
  onTrackClick?: (track: Track) => void;
  onPlay?: (track: Track) => void;
  onLike?: (trackId: string) => void;
  onAddToQueue?: (trackId: string) => void;
}

export const DiscoveryShelf = ({
  tracks,
  loading = false,
  onTrackClick,
  onPlay,
  onLike,
  onAddToQueue
}: DiscoveryShelfProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-square bg-surface-secondary rounded-lg mb-3"></div>
            <div className="h-4 bg-surface-secondary rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-surface-secondary rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 bg-surface-secondary/50 rounded-full w-fit mx-auto mb-4 border border-border-medium">
          <Music className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No tracks available</h3>
        <p className="text-muted-foreground">Check back later for new music</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {tracks.map((track) => (
        <GlowCard 
          key={track.id} 
          className="group hover-lift card-primary cursor-pointer overflow-hidden"
          onClick={() => onTrackClick?.(track)}
        >
          {/* Cover Art */}
          <div className="relative aspect-square overflow-hidden">
            <img
              src={track.coverUrl || '/src/assets/sample-cover-1.jpg'}
              alt={track.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button
                size="icon"
                className="w-12 h-12 rounded-full bg-white/90 hover:bg-white text-black shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay?.(track);
                }}
              >
                <Play className="w-5 h-5 ml-1" />
              </Button>
            </div>
            
            {/* Popularity Badge */}
            {track.popularityTier && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary" className={`text-xs ${
                  track.popularityTier === 'emerging' ? 'badge-success' :
                  track.popularityTier === 'rising' ? 'badge-primary' :
                  track.popularityTier === 'established' ? 'badge-warning' : 'badge-error'
                }`}>
                  {track.popularityTier === 'emerging' ? '🌱' :
                   track.popularityTier === 'rising' ? '📈' :
                   track.popularityTier === 'established' ? '🎯' : '🔥'}
                  {track.popularityTier}
                </Badge>
              </div>
            )}
          </div>
          
          {/* Track Info */}
          <div className="p-4 space-y-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {track.title}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                {track.artist}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-surface-secondary text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onLike?.(track.id);
                }}
              >
                <Heart className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-surface-secondary text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToQueue?.(track.id);
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Track Stats */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : '0:00'}</span>
              {track.uniqueListeners && (
                <span>{track.uniqueListeners.toLocaleString()} listeners</span>
              )}
            </div>
          </div>
        </GlowCard>
      ))}
    </div>
  );
};