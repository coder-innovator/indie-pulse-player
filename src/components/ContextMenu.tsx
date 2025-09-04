import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Play,
  Pause,
  Plus,
  Heart,
  Share,
  Download,
  Info,
  User,
  ListMusic,
  Radio,
  Copy,
  ExternalLink,
  Trash2,
  Edit,
  Folder,
} from 'lucide-react';
import { useEnhancedPlayerStore } from '@/stores/enhancedPlayerStore';
import { useToast } from '@/hooks/use-toast';
import { Track } from '@/components/TrackCard';

/**
 * Context Menu Component for Tracks, Artists, and Playlists
 * Provides Spotify-like right-click functionality
 */

interface ContextMenuProps {
  children: React.ReactNode;
  type: 'track' | 'artist' | 'playlist' | 'album';
  item: any; // Track, Artist, Playlist, or Album object
  className?: string;
}

interface TrackContextMenuProps {
  track: Track;
  onClose?: () => void;
}

interface ArtistContextMenuProps {
  artist: any;
  onClose?: () => void;
}

interface PlaylistContextMenuProps {
  playlist: any;
  onClose?: () => void;
}

const TrackContextMenu: React.FC<TrackContextMenuProps> = ({ track, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentTrack,
    isPlaying,
    setCurrentTrack,
    addToQueue,
    addToUpNext,
  } = useEnhancedPlayerStore();
  
  const isCurrentTrack = currentTrack?.id === track.id;
  
  const handlePlay = useCallback(() => {
    if (isCurrentTrack) {
      // Toggle play/pause for current track
      const { togglePlay } = useEnhancedPlayerStore.getState();
      togglePlay();
    } else {
      setCurrentTrack(track, true);
    }
    onClose?.();
  }, [isCurrentTrack, setCurrentTrack, track, onClose]);
  
  const handleAddToQueue = useCallback(() => {
    addToQueue(track, 'end');
    toast({
      title: 'Added to queue',
      description: `${track.title} by ${track.artist}`,
    });
    onClose?.();
  }, [addToQueue, track, toast, onClose]);
  
  const handlePlayNext = useCallback(() => {
    addToUpNext(track);
    toast({
      title: 'Playing next',
      description: `${track.title} by ${track.artist}`,
    });
    onClose?.();
  }, [addToUpNext, track, toast, onClose]);
  
  const handleLike = useCallback(() => {
    // TODO: Implement like functionality
    toast({
      title: 'Added to Liked Songs',
      description: `${track.title} by ${track.artist}`,
    });
    onClose?.();
  }, [track, toast, onClose]);
  
  const handleGoToArtist = useCallback(() => {
    navigate(`/artist/${track.artist}`);
    onClose?.();
  }, [navigate, track, onClose]);
  
  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${track.title} by ${track.artist}`,
      text: `Check out this track: ${track.title} by ${track.artist}`,
      url: `${window.location.origin}/track/${track.id}`,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: 'Link copied',
          description: 'Track link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
    onClose?.();
  }, [track, toast, onClose]);
  
  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/track/${track.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'Track link copied to clipboard',
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
    onClose?.();
  }, [track, toast, onClose]);
  
  const handleDownload = useCallback(() => {
    // TODO: Implement download functionality
    toast({
      title: 'Download started',
      description: `Downloading ${track.title}`,
    });
    onClose?.();
  }, [track, toast, onClose]);
  
  const handleShowInfo = useCallback(() => {
    // TODO: Open track info modal
    toast({
      title: 'Track info',
      description: `${track.title} by ${track.artist}`,
    });
    onClose?.();
  }, [track, toast, onClose]);
  
  return (
    <ContextMenuContent className="w-56">
      <ContextMenuItem onClick={handlePlay} className="gap-2">
        {isCurrentTrack && isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {isCurrentTrack && isPlaying ? 'Pause' : 'Play'}
      </ContextMenuItem>
      
      <ContextMenuItem onClick={handlePlayNext} className="gap-2">
        <Plus className="h-4 w-4" />
        Play next
      </ContextMenuItem>
      
      <ContextMenuItem onClick={handleAddToQueue} className="gap-2">
        <ListMusic className="h-4 w-4" />
        Add to queue
      </ContextMenuItem>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem onClick={handleLike} className="gap-2">
        <Heart className="h-4 w-4" />
        Add to Liked Songs
      </ContextMenuItem>
      
      <ContextMenuSub>
        <ContextMenuSubTrigger className="gap-2">
          <Folder className="h-4 w-4" />
          Add to playlist
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem>
            <Plus className="h-4 w-4 mr-2" />
            Create new playlist
          </ContextMenuItem>
          <ContextMenuSeparator />
          {/* TODO: List user's playlists */}
          <ContextMenuItem>My Playlist #1</ContextMenuItem>
          <ContextMenuItem>My Playlist #2</ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem onClick={handleGoToArtist} className="gap-2">
        <User className="h-4 w-4" />
        Go to artist
      </ContextMenuItem>
      
      <ContextMenuSub>
        <ContextMenuSubTrigger className="gap-2">
          <Radio className="h-4 w-4" />
          Go to radio
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem>
            <Radio className="h-4 w-4 mr-2" />
            Song radio
          </ContextMenuItem>
          <ContextMenuItem>
            <User className="h-4 w-4 mr-2" />
            Artist radio
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem onClick={handleShare} className="gap-2">
        <Share className="h-4 w-4" />
        Share
      </ContextMenuItem>
      
      <ContextMenuItem onClick={handleCopyLink} className="gap-2">
        <Copy className="h-4 w-4" />
        Copy song link
      </ContextMenuItem>
      
      <ContextMenuItem onClick={handleDownload} className="gap-2">
        <Download className="h-4 w-4" />
        Download
      </ContextMenuItem>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem onClick={handleShowInfo} className="gap-2">
        <Info className="h-4 w-4" />
        Show credits
      </ContextMenuItem>
    </ContextMenuContent>
  );
};

const ArtistContextMenu: React.FC<ArtistContextMenuProps> = ({ artist, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handlePlay = useCallback(() => {
    // TODO: Play artist's top tracks
    toast({
      title: 'Playing artist',
      description: `Playing ${artist.name}'s top tracks`,
    });
    onClose?.();
  }, [artist, toast, onClose]);
  
  const handleShuffle = useCallback(() => {
    // TODO: Shuffle artist's tracks
    toast({
      title: 'Shuffling artist',
      description: `Shuffling ${artist.name}'s tracks`,
    });
    onClose?.();
  }, [artist, toast, onClose]);
  
  const handleFollow = useCallback(() => {
    // TODO: Implement follow functionality
    toast({
      title: 'Following artist',
      description: `Now following ${artist.name}`,
    });
    onClose?.();
  }, [artist, toast, onClose]);
  
  const handleGoToArtist = useCallback(() => {
    navigate(`/artist/${artist.id}`);
    onClose?.();
  }, [navigate, artist, onClose]);
  
  const handleShare = useCallback(async () => {
    const shareData = {
      title: artist.name,
      text: `Check out ${artist.name} on SoundScape`,
      url: `${window.location.origin}/artist/${artist.id}`,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: 'Link copied',
          description: 'Artist link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
    onClose?.();
  }, [artist, toast, onClose]);
  
  return (
    <ContextMenuContent className="w-56">
      <ContextMenuItem onClick={handlePlay} className="gap-2">
        <Play className="h-4 w-4" />
        Play
      </ContextMenuItem>
      
      <ContextMenuItem onClick={handleShuffle} className="gap-2">
        <Radio className="h-4 w-4" />
        Shuffle
      </ContextMenuItem>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem onClick={handleFollow} className="gap-2">
        <Plus className="h-4 w-4" />
        Follow
      </ContextMenuItem>
      
      <ContextMenuItem onClick={handleGoToArtist} className="gap-2">
        <ExternalLink className="h-4 w-4" />
        Go to artist page
      </ContextMenuItem>
      
      <ContextMenuSub>
        <ContextMenuSubTrigger className="gap-2">
          <Radio className="h-4 w-4" />
          Go to radio
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="w-48">
          <ContextMenuItem>
            <Radio className="h-4 w-4 mr-2" />
            Artist radio
          </ContextMenuItem>
        </ContextMenuSubContent>
      </ContextMenuSub>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem onClick={handleShare} className="gap-2">
        <Share className="h-4 w-4" />
        Share
      </ContextMenuItem>
      
      <ContextMenuItem className="gap-2">
        <Copy className="h-4 w-4" />
        Copy artist link
      </ContextMenuItem>
    </ContextMenuContent>
  );
};

const PlaylistContextMenu: React.FC<PlaylistContextMenuProps> = ({ playlist, onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handlePlay = useCallback(() => {
    // TODO: Play playlist
    toast({
      title: 'Playing playlist',
      description: playlist.name,
    });
    onClose?.();
  }, [playlist, toast, onClose]);
  
  const handleEdit = useCallback(() => {
    // TODO: Open playlist editor
    toast({
      title: 'Edit playlist',
      description: `Editing ${playlist.name}`,
    });
    onClose?.();
  }, [playlist, toast, onClose]);
  
  const handleDelete = useCallback(() => {
    // TODO: Delete playlist with confirmation
    toast({
      title: 'Delete playlist',
      description: `${playlist.name} deleted`,
      variant: 'destructive',
    });
    onClose?.();
  }, [playlist, toast, onClose]);
  
  const handleShare = useCallback(async () => {
    const shareData = {
      title: playlist.name,
      text: `Check out this playlist: ${playlist.name}`,
      url: `${window.location.origin}/playlist/${playlist.id}`,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: 'Link copied',
          description: 'Playlist link copied to clipboard',
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
    onClose?.();
  }, [playlist, toast, onClose]);
  
  return (
    <ContextMenuContent className="w-56">
      <ContextMenuItem onClick={handlePlay} className="gap-2">
        <Play className="h-4 w-4" />
        Play
      </ContextMenuItem>
      
      <ContextMenuItem onClick={handleEdit} className="gap-2">
        <Edit className="h-4 w-4" />
        Edit details
      </ContextMenuItem>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem onClick={handleShare} className="gap-2">
        <Share className="h-4 w-4" />
        Share
      </ContextMenuItem>
      
      <ContextMenuItem className="gap-2">
        <Copy className="h-4 w-4" />
        Copy playlist link
      </ContextMenuItem>
      
      <ContextMenuItem className="gap-2">
        <Download className="h-4 w-4" />
        Download
      </ContextMenuItem>
      
      <ContextMenuSeparator />
      
      <ContextMenuItem onClick={handleDelete} className="gap-2 text-destructive">
        <Trash2 className="h-4 w-4" />
        Delete playlist
      </ContextMenuItem>
    </ContextMenuContent>
  );
};

export const SoundScapeContextMenu: React.FC<ContextMenuProps> = ({
  children,
  type,
  item,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);
  
  const renderContextMenu = () => {
    switch (type) {
      case 'track':
        return <TrackContextMenu track={item} onClose={handleClose} />;
      case 'artist':
        return <ArtistContextMenu artist={item} onClose={handleClose} />;
      case 'playlist':
        return <PlaylistContextMenu playlist={item} onClose={handleClose} />;
      default:
        return null;
    }
  };
  
  return (
    <ContextMenu onOpenChange={setIsOpen}>
      <ContextMenuTrigger className={className}>
        {children}
      </ContextMenuTrigger>
      {renderContextMenu()}
    </ContextMenu>
  );
};

export default SoundScapeContextMenu;