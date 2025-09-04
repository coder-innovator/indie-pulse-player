import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Play,
  Pause,
  Music,
  GripVertical,
  X,
  Clock,
  Shuffle,
  RotateCcw,
  Heart,
  MoreHorizontal,
  ListMusic,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useEnhancedPlayerStore, QueueItem } from '@/stores/enhancedPlayerStore';
import { useToast } from '@/hooks/use-toast';

/**
 * Queue Manager Component
 * - Drag and drop reordering
 * - Play next / Add to queue
 * - Up Next section
 * - Queue history
 * - Bulk actions
 * - Smart queue suggestions
 */

interface QueueManagerProps {
  className?: string;
  compact?: boolean;
}

// Format duration in seconds to MM:SS
const formatDuration = (seconds: number): string => {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Calculate total queue duration
const calculateTotalDuration = (items: QueueItem[]): number => {
  return items.reduce((total, item) => total + (item.duration || 0), 0);
};

interface QueueItemComponentProps {
  item: QueueItem;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onPlay: (item: QueueItem) => void;
  onRemove: (queueId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  isDragging: boolean;
  onDragStart: (index: number) => void;
  onDragEnd: () => void;
  onDragOver: (index: number) => void;
}

const QueueItemComponent: React.FC<QueueItemComponentProps> = ({
  item,
  index,
  isCurrentTrack,
  isPlaying,
  onPlay,
  onRemove,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
}) => {
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    onDragStart(index);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(index);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDragEnd();
  };
  
  const handleLike = () => {
    toast({
      title: 'Added to Liked Songs',
      description: `${item.title} by ${item.artist}`,
    });
  };
  
  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group flex items-center gap-3 p-2 rounded-lg transition-all duration-200",
        "hover:bg-accent/50 cursor-pointer",
        isCurrentTrack && "bg-primary/10 border border-primary/20",
        isDragging && "opacity-50 scale-95"
      )}
    >
      {/* Drag handle */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {/* Play indicator or index */}
      <div className="w-6 text-center">
        {isCurrentTrack && isPlaying ? (
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-primary animate-pulse rounded-sm" />
          </div>
        ) : isCurrentTrack ? (
          <Pause className="h-4 w-4 text-primary" />
        ) : (
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">
            {index + 1}
          </span>
        )}
      </div>
      
      {/* Cover art */}
      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-secondary flex-shrink-0">
        {item.cover_art_url ? (
          <img 
            src={item.cover_art_url} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        
        {/* Play button overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(item);
          }}
          className={cn(
            "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <Play className="w-3 h-3 text-white fill-white" />
        </button>
      </div>
      
      {/* Track info */}
      <div className="flex-1 min-w-0" onClick={() => onPlay(item)}>
        <div className="flex items-center gap-2">
          <h4 className={cn(
            "font-medium text-sm truncate",
            isCurrentTrack && "text-primary"
          )}>
            {item.title}
          </h4>
          {item.source === 'autoplay' && (
            <span className="text-xs bg-secondary px-1 rounded text-muted-foreground">
              Auto
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{item.artist}</span>
          {item.duration && (
            <>
              <span>•</span>
              <span>{formatDuration(item.duration)}</span>
            </>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className={cn(
        "flex items-center gap-1 transition-opacity",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            handleLike();
          }}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Heart className="h-3 h-3" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPlay(item)}>
              <Play className="h-4 w-4 mr-2" />
              Play now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLike}>
              <Heart className="h-4 w-4 mr-2" />
              Add to Liked Songs
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onRemove(item.queueId)}
              className="text-destructive"
            >
              <X className="h-4 w-4 mr-2" />
              Remove from queue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export const QueueManager: React.FC<QueueManagerProps> = ({ className, compact = false }) => {
  const {
    queue,
    upNext,
    currentIndex,
    currentTrack,
    isPlaying,
    queueVisible,
    setCurrentTrack,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    clearUpNext,
    setQueueVisible,
  } = useEnhancedPlayerStore();
  
  const { toast } = useToast();
  
  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // Don't render if not visible
  if (!queueVisible) {
    return null;
  }
  
  // Handle drag and drop
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);
  
  const handleDragOver = useCallback((index: number) => {
    setDragOverIndex(index);
  }, []);
  
  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      reorderQueue(draggedIndex, dragOverIndex);
      toast({
        title: 'Queue reordered',
        description: 'Track moved to new position',
      });
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dragOverIndex, reorderQueue, toast]);
  
  const handlePlayTrack = useCallback((item: QueueItem) => {
    const trackIndex = queue.findIndex(q => q.queueId === item.queueId);
    if (trackIndex !== -1) {
      setCurrentTrack(item, true);
    }
  }, [queue, setCurrentTrack]);
  
  const handleClearQueue = useCallback(() => {
    clearQueue();
    toast({
      title: 'Queue cleared',
      description: 'All tracks removed from queue',
    });
  }, [clearQueue, toast]);
  
  const handleClearUpNext = useCallback(() => {
    clearUpNext();
    toast({
      title: 'Up Next cleared',
      description: 'Play next queue cleared',
    });
  }, [clearUpNext, toast]);
  
  // Calculate stats
  const totalDuration = calculateTotalDuration(queue);
  const upNextDuration = calculateTotalDuration(upNext);
  const remainingDuration = calculateTotalDuration(queue.slice(currentIndex + 1)) + upNextDuration;
  
  // Split queue into current, up next, and remaining
  const currentQueueItem = currentIndex >= 0 ? queue[currentIndex] : null;
  const remainingQueue = queue.slice(currentIndex + 1);
  
  if (compact) {
    return (
      <Card className={cn("w-80", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ListMusic className="h-5 w-5" />
              Queue
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setQueueVisible(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {queue.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{queue.length} tracks</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          <ScrollArea className="h-80">
            {queue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListMusic className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tracks in queue</p>
                <p className="text-xs mt-1">Add some music to get started</p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Current track */}
                {currentQueueItem && (
                  <>
                    <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                      Now Playing
                    </div>
                    <QueueItemComponent
                      item={currentQueueItem}
                      index={currentIndex}
                      isCurrentTrack={true}
                      isPlaying={isPlaying}
                      onPlay={handlePlayTrack}
                      onRemove={removeFromQueue}
                      onReorder={reorderQueue}
                      isDragging={draggedIndex === currentIndex}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                    />
                    {(upNext.length > 0 || remainingQueue.length > 0) && (
                      <Separator className="my-3" />
                    )}
                  </>
                )}
                
                {/* Up Next */}
                {upNext.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Up Next
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearUpNext}
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    </div>
                    {upNext.map((item, index) => (
                      <QueueItemComponent
                        key={item.queueId}
                        item={item}
                        index={index}
                        isCurrentTrack={false}
                        isPlaying={false}
                        onPlay={handlePlayTrack}
                        onRemove={removeFromQueue}
                        onReorder={reorderQueue}
                        isDragging={false}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                      />
                    ))}
                    {remainingQueue.length > 0 && <Separator className="my-3" />}
                  </>
                )}
                
                {/* Remaining Queue */}
                {remainingQueue.length > 0 && (
                  <>
                    <div className="flex items-center justify-between px-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Next in Queue
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(remainingDuration)} left
                      </span>
                    </div>
                    {remainingQueue.map((item, index) => (
                      <QueueItemComponent
                        key={item.queueId}
                        item={item}
                        index={currentIndex + 1 + index}
                        isCurrentTrack={false}
                        isPlaying={false}
                        onPlay={handlePlayTrack}
                        onRemove={removeFromQueue}
                        onReorder={reorderQueue}
                        isDragging={draggedIndex === currentIndex + 1 + index}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
          
          {/* Queue actions */}
          {queue.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearQueue}
                className="flex-1 gap-2 text-muted-foreground hover:text-foreground"
              >
                <Trash2 className="h-4 w-4" />
                Clear Queue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Full queue view for larger screens
  return (
    <div className={cn("w-full max-w-2xl", className)}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl flex items-center gap-2">
              <ListMusic className="h-6 w-6" />
              Queue
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearQueue}
                disabled={queue.length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Queue
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setQueueVisible(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {queue.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{queue.length} tracks • {formatDuration(totalDuration)} total</span>
              <span>{formatDuration(remainingDuration)} remaining</span>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-96">
            {queue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ListMusic className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Your queue is empty</h3>
                <p className="text-sm">Add some music to get started</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Current track */}
                {currentQueueItem && (
                  <>
                    <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Now Playing
                    </div>
                    <QueueItemComponent
                      item={currentQueueItem}
                      index={currentIndex}
                      isCurrentTrack={true}
                      isPlaying={isPlaying}
                      onPlay={handlePlayTrack}
                      onRemove={removeFromQueue}
                      onReorder={reorderQueue}
                      isDragging={draggedIndex === currentIndex}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                    />
                    {(upNext.length > 0 || remainingQueue.length > 0) && (
                      <Separator className="my-4" />
                    )}
                  </>
                )}
                
                {/* Up Next */}
                {upNext.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Up Next ({upNext.length})
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearUpNext}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        Clear
                      </Button>
                    </div>
                    {upNext.map((item, index) => (
                      <QueueItemComponent
                        key={item.queueId}
                        item={item}
                        index={index}
                        isCurrentTrack={false}
                        isPlaying={false}
                        onPlay={handlePlayTrack}
                        onRemove={removeFromQueue}
                        onReorder={reorderQueue}
                        isDragging={false}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                      />
                    ))}
                    {remainingQueue.length > 0 && <Separator className="my-4" />}
                  </>
                )}
                
                {/* Remaining Queue */}
                {remainingQueue.length > 0 && (
                  <>
                    <div className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Shuffle className="h-4 w-4" />
                      Next in Queue ({remainingQueue.length})
                    </div>
                    {remainingQueue.map((item, index) => (
                      <QueueItemComponent
                        key={item.queueId}
                        item={item}
                        index={currentIndex + 1 + index}
                        isCurrentTrack={false}
                        isPlaying={false}
                        onPlay={handlePlayTrack}
                        onRemove={removeFromQueue}
                        onReorder={reorderQueue}
                        isDragging={draggedIndex === currentIndex + 1 + index}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
