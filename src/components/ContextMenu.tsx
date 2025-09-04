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
    <ContextMenuContent className=\"w-56\">
      <ContextMenuItem onClick={handlePlay} className=\"gap-2\">\n        {isCurrentTrack && isPlaying ? (\n          <Pause className=\"h-4 w-4\" />\n        ) : (\n          <Play className=\"h-4 w-4\" />\n        )}\n        {isCurrentTrack && isPlaying ? 'Pause' : 'Play'}\n      </ContextMenuItem>\n      \n      <ContextMenuItem onClick={handlePlayNext} className=\"gap-2\">\n        <Plus className=\"h-4 w-4\" />\n        Play next\n      </ContextMenuItem>\n      \n      <ContextMenuItem onClick={handleAddToQueue} className=\"gap-2\">\n        <ListMusic className=\"h-4 w-4\" />\n        Add to queue\n      </ContextMenuItem>\n      \n      <ContextMenuSeparator />\n      \n      <ContextMenuItem onClick={handleLike} className=\"gap-2\">\n        <Heart className=\"h-4 w-4\" />\n        Add to Liked Songs\n      </ContextMenuItem>\n      \n      <ContextMenuSub>\n        <ContextMenuSubTrigger className=\"gap-2\">\n          <Folder className=\"h-4 w-4\" />\n          Add to playlist\n        </ContextMenuSubTrigger>\n        <ContextMenuSubContent className=\"w-48\">\n          <ContextMenuItem>\n            <Plus className=\"h-4 w-4 mr-2\" />\n            Create new playlist\n          </ContextMenuItem>\n          <ContextMenuSeparator />\n          {/* TODO: List user's playlists */}\n          <ContextMenuItem>My Playlist #1</ContextMenuItem>\n          <ContextMenuItem>My Playlist #2</ContextMenuItem>\n        </ContextMenuSubContent>\n      </ContextMenuSub>\n      \n      <ContextMenuSeparator />\n      \n      <ContextMenuItem onClick={handleGoToArtist} className=\"gap-2\">\n        <User className=\"h-4 w-4\" />\n        Go to artist\n      </ContextMenuItem>\n      \n      <ContextMenuSub>\n        <ContextMenuSubTrigger className=\"gap-2\">\n          <Radio className=\"h-4 w-4\" />\n          Go to radio\n        </ContextMenuSubTrigger>\n        <ContextMenuSubContent className=\"w-48\">\n          <ContextMenuItem>\n            <Radio className=\"h-4 w-4 mr-2\" />\n            Song radio\n          </ContextMenuItem>\n          <ContextMenuItem>\n            <User className=\"h-4 w-4 mr-2\" />\n            Artist radio\n          </ContextMenuItem>\n        </ContextMenuSubContent>\n      </ContextMenuSub>\n      \n      <ContextMenuSeparator />\n      \n      <ContextMenuItem onClick={handleShare} className=\"gap-2\">\n        <Share className=\"h-4 w-4\" />\n        Share\n      </ContextMenuItem>\n      \n      <ContextMenuItem onClick={handleCopyLink} className=\"gap-2\">\n        <Copy className=\"h-4 w-4\" />\n        Copy song link\n      </ContextMenuItem>\n      \n      <ContextMenuItem onClick={handleDownload} className=\"gap-2\">\n        <Download className=\"h-4 w-4\" />\n        Download\n      </ContextMenuItem>\n      \n      <ContextMenuSeparator />\n      \n      <ContextMenuItem onClick={handleShowInfo} className=\"gap-2\">\n        <Info className=\"h-4 w-4\" />\n        Show credits\n      </ContextMenuItem>\n    </ContextMenuContent>\n  );\n};\n\nconst ArtistContextMenu: React.FC<ArtistContextMenuProps> = ({ artist, onClose }) => {\n  const navigate = useNavigate();\n  const { toast } = useToast();\n  \n  const handlePlay = useCallback(() => {\n    // TODO: Play artist's top tracks\n    toast({\n      title: 'Playing artist',\n      description: `Playing ${artist.name}'s top tracks`,\n    });\n    onClose?.();\n  }, [artist, toast, onClose]);\n  \n  const handleShuffle = useCallback(() => {\n    // TODO: Shuffle artist's tracks\n    toast({\n      title: 'Shuffling artist',\n      description: `Shuffling ${artist.name}'s tracks`,\n    });\n    onClose?.();\n  }, [artist, toast, onClose]);\n  \n  const handleFollow = useCallback(() => {\n    // TODO: Implement follow functionality\n    toast({\n      title: 'Following artist',\n      description: `Now following ${artist.name}`,\n    });\n    onClose?.();\n  }, [artist, toast, onClose]);\n  \n  const handleGoToArtist = useCallback(() => {\n    navigate(`/artist/${artist.id}`);\n    onClose?.();\n  }, [navigate, artist, onClose]);\n  \n  const handleShare = useCallback(async () => {\n    const shareData = {\n      title: artist.name,\n      text: `Check out ${artist.name} on SoundScape`,\n      url: `${window.location.origin}/artist/${artist.id}`,\n    };\n    \n    try {\n      if (navigator.share) {\n        await navigator.share(shareData);\n      } else {\n        await navigator.clipboard.writeText(shareData.url);\n        toast({\n          title: 'Link copied',\n          description: 'Artist link copied to clipboard',\n        });\n      }\n    } catch (error) {\n      console.error('Share failed:', error);\n    }\n    onClose?.();\n  }, [artist, toast, onClose]);\n  \n  return (\n    <ContextMenuContent className=\"w-56\">\n      <ContextMenuItem onClick={handlePlay} className=\"gap-2\">\n        <Play className=\"h-4 w-4\" />\n        Play\n      </ContextMenuItem>\n      \n      <ContextMenuItem onClick={handleShuffle} className=\"gap-2\">\n        <Radio className=\"h-4 w-4\" />\n        Shuffle\n      </ContextMenuItem>\n      \n      <ContextMenuSeparator />\n      \n      <ContextMenuItem onClick={handleFollow} className=\"gap-2\">\n        <Plus className=\"h-4 w-4\" />\n        Follow\n      </ContextMenuItem>\n      \n      <ContextMenuItem onClick={handleGoToArtist} className=\"gap-2\">\n        <ExternalLink className=\"h-4 w-4\" />\n        Go to artist page\n      </ContextMenuItem>\n      \n      <ContextMenuSub>\n        <ContextMenuSubTrigger className=\"gap-2\">\n          <Radio className=\"h-4 w-4\" />\n          Go to radio\n        </ContextMenuSubTrigger>\n        <ContextMenuSubContent className=\"w-48\">\n          <ContextMenuItem>\n            <Radio className=\"h-4 w-4 mr-2\" />\n            Artist radio\n          </ContextMenuItem>\n        </ContextMenuSubContent>\n      </ContextMenuSub>\n      \n      <ContextMenuSeparator />\n      \n      <ContextMenuItem onClick={handleShare} className=\"gap-2\">\n        <Share className=\"h-4 w-4\" />\n        Share\n      </ContextMenuItem>\n      \n      <ContextMenuItem className=\"gap-2\">\n        <Copy className=\"h-4 w-4\" />\n        Copy artist link\n      </ContextMenuItem>\n    </ContextMenuContent>\n  );\n};\n\nconst PlaylistContextMenu: React.FC<PlaylistContextMenuProps> = ({ playlist, onClose }) => {\n  const navigate = useNavigate();\n  const { toast } = useToast();\n  \n  const handlePlay = useCallback(() => {\n    // TODO: Play playlist\n    toast({\n      title: 'Playing playlist',\n      description: playlist.name,\n    });\n    onClose?.();\n  }, [playlist, toast, onClose]);\n  \n  const handleEdit = useCallback(() => {\n    // TODO: Open playlist editor\n    toast({\n      title: 'Edit playlist',\n      description: `Editing ${playlist.name}`,\n    });\n    onClose?.();\n  }, [playlist, toast, onClose]);\n  \n  const handleDelete = useCallback(() => {\n    // TODO: Delete playlist with confirmation\n    toast({\n      title: 'Delete playlist',\n      description: `${playlist.name} deleted`,\n      variant: 'destructive',\n    });\n    onClose?.();\n  }, [playlist, toast, onClose]);\n  \n  const handleShare = useCallback(async () => {\n    const shareData = {\n      title: playlist.name,\n      text: `Check out this playlist: ${playlist.name}`,\n      url: `${window.location.origin}/playlist/${playlist.id}`,\n    };\n    \n    try {\n      if (navigator.share) {\n        await navigator.share(shareData);\n      } else {\n        await navigator.clipboard.writeText(shareData.url);\n        toast({\n          title: 'Link copied',\n          description: 'Playlist link copied to clipboard',\n        });\n      }\n    } catch (error) {\n      console.error('Share failed:', error);\n    }\n    onClose?.();\n  }, [playlist, toast, onClose]);\n  \n  return (\n    <ContextMenuContent className=\"w-56\">\n      <ContextMenuItem onClick={handlePlay} className=\"gap-2\">\n        <Play className=\"h-4 w-4\" />\n        Play\n      </ContextMenuItem>\n      \n      <ContextMenuItem onClick={handleEdit} className=\"gap-2\">\n        <Edit className=\"h-4 w-4\" />\n        Edit details\n      </ContextMenuItem>\n      \n      <ContextMenuSeparator />\n      \n      <ContextMenuItem onClick={handleShare} className=\"gap-2\">\n        <Share className=\"h-4 w-4\" />\n        Share\n      </ContextMenuItem>\n      \n      <ContextMenuItem className=\"gap-2\">\n        <Copy className=\"h-4 w-4\" />\n        Copy playlist link\n      </ContextMenuItem>\n      \n      <ContextMenuItem className=\"gap-2\">\n        <Download className=\"h-4 w-4\" />\n        Download\n      </ContextMenuItem>\n      \n      <ContextMenuSeparator />\n      \n      <ContextMenuItem onClick={handleDelete} className=\"gap-2 text-destructive\">\n        <Trash2 className=\"h-4 w-4\" />\n        Delete playlist\n      </ContextMenuItem>\n    </ContextMenuContent>\n  );\n};\n\nexport const SoundScapeContextMenu: React.FC<ContextMenuProps> = ({\n  children,\n  type,\n  item,\n  className,\n}) => {\n  const [isOpen, setIsOpen] = useState(false);\n  \n  const handleClose = useCallback(() => {\n    setIsOpen(false);\n  }, []);\n  \n  const renderContextMenu = () => {\n    switch (type) {\n      case 'track':\n        return <TrackContextMenu track={item} onClose={handleClose} />;\n      case 'artist':\n        return <ArtistContextMenu artist={item} onClose={handleClose} />;\n      case 'playlist':\n        return <PlaylistContextMenu playlist={item} onClose={handleClose} />;\n      default:\n        return null;\n    }\n  };\n  \n  return (\n    <ContextMenu onOpenChange={setIsOpen}>\n      <ContextMenuTrigger className={className}>\n        {children}\n      </ContextMenuTrigger>\n      {renderContextMenu()}\n    </ContextMenu>\n  );\n};\n\nexport default SoundScapeContextMenu;
