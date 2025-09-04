import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { Track } from '@/components/TrackCard';
import { supabase } from '@/integrations/supabase/client';

interface AudioPlayerProps {
  track: Track | null;
  onPlay?: (track: Track) => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  track, 
  onPlay, 
  onNext, 
  onPrevious 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load audio URL when track changes
  useEffect(() => {
    if (track?.streamUrl) {
      // For actual audio files from storage
      if (track.streamUrl.startsWith('http')) {
        setAudioUrl(track.streamUrl);
      } else {
        // Get signed URL from Supabase storage
        const { data } = supabase.storage
          .from('audio-files')
          .getPublicUrl(track.streamUrl);
        setAudioUrl(data.publicUrl);
      }
    } else {
      setAudioUrl(null);
    }
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      setIsPlaying(false);
      if (onNext) {
        onNext();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
        
        // Record play event
        recordPlay();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const recordPlay = async () => {
    if (!track) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Generate a session ID for anonymous users
      let sessionId = localStorage.getItem('soundscape_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('soundscape_session_id', sessionId);
      }

      await supabase.from('plays').insert({
        track_id: track.id,
        user_id: user?.id || null,
        session_id: sessionId,
        play_duration: 0,
        completed: false,
      });
    } catch (error) {
      console.error('Error recording play:', error);
    }
  };

  const handleSeek = (values: number[]) => {
    const audio = audioRef.current;
    if (audio && duration > 0) {
      const newTime = (values[0] / 100) * duration;
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0] / 100);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      )}
      
      <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          {/* Track Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {track.coverUrl && (
              <img
                src={track.coverUrl}
                alt={track.title}
                className="h-12 w-12 rounded object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{track.title}</p>
              <p className="text-sm text-muted-foreground truncate">
                {track.artist}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={!onPrevious}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              disabled={!audioUrl}
              className="h-10 w-10"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={!onNext}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className="text-xs text-muted-foreground">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground">
              {formatTime(duration)}
            </span>
          </div>

          {/* Volume */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-24"
            />
          </div>
        </div>
      </Card>
    </>
  );
};

export default AudioPlayer;