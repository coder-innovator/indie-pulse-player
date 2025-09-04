import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Track {
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

interface RealTimeTrackStats {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  recordPlay: (trackId: string, playDuration?: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useRealTimeTracks = (filters?: any): RealTimeTrackStats => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Use refs to prevent infinite loops
  const isInitialized = useRef(false);
  const subscriptionsRef = useRef<RealtimeChannel[]>([]);

  // Memoize fetchTracks to prevent recreation on every render
  const fetchTracks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('tracks')
        .select(`
          id,
          title,
          duration,
          cover_url,
          stream_url,
          unique_listeners,
          total_plays,
          popularity_tier,
          bpm,
          created_at,
          updated_at,
          artists (
            id,
            name
          ),
          track_tags (
            tags (
              name,
              type
            )
          )
        `)
        .order('unique_listeners', { ascending: false })
        .limit(100);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedTracks: Track[] = data?.map((track: { id: string; title: string; duration?: number; cover_url?: string; stream_url?: string; unique_listeners?: number; total_plays?: number; popularity_tier?: string; bpm?: number; created_at: string; updated_at: string; artists?: { id: string; name: string } | null; track_tags?: Array<{ tags?: { name: string; type: string } | null }> }) => {
        const tags = track.track_tags?.map((tt: { tags?: { name: string; type: string } | null }) => tt.tags?.name).filter(Boolean) || [];
        const genre = tags.find(tag => ['Electronic', 'Indie Rock', 'Hip Hop', 'Pop', 'R&B', 'Jazz', 'Classical', 'Country', 'Folk', 'Reggae', 'Metal', 'Punk', 'Blues', 'Soul', 'Funk', 'Disco', 'House', 'Techno', 'Ambient', 'Experimental', 'Lo-Fi', 'Trap'].includes(tag)) || 'Unknown';
        const mood = tags.find(tag => ['Energetic', 'Chill', 'Happy', 'Sad', 'Dark', 'Uplifting', 'Melancholic', 'Aggressive', 'Peaceful', 'Nostalgic', 'Euphoric', 'Mysterious', 'Romantic', 'Adventurous', 'Relaxed', 'Intense', 'Dreamy', 'Confident', 'Vulnerable'].includes(tag)) || 'Unknown';
        const scene = tags.find(tag => ['Underground', 'Mainstream', 'Local', 'International', 'College', 'Club', 'Festival', 'Bedroom', 'Studio', 'Live', 'DIY', 'Independent', 'Major Label', 'Alternative', 'Avant-garde', 'Traditional', 'Fusion', 'Crossover'].includes(tag)) || 'Unknown';
        
        // Calculate engagement rate (plays per listener)
        const engagementRate = track.unique_listeners > 0 
          ? Math.round((track.total_plays / track.unique_listeners) * 100) 
          : 0;
        
        // Calculate weekly growth based on recent activity
        const weeklyGrowth = calculateWeeklyGrowth(track.updated_at);
        
        return {
          id: track.id,
          title: track.title,
          artist: track.artists?.name || 'Unknown Artist',
          duration: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : undefined,
          coverUrl: track.cover_url || '/src/assets/sample-cover-1.jpg',
          streamUrl: track.stream_url,
          uniqueListeners: track.unique_listeners || 0,
          popularityTier: (track.popularity_tier as 'emerging' | 'rising' | 'established' | 'popular') || 'emerging',
          totalPlays: track.total_plays || 0,
          weeklyGrowth,
          bpm: track.bpm,
          genre,
          mood,
          scene,
          releaseDate: track.created_at,
          engagementRate,
          tags,
        };
      }) || [];

      setTracks(formattedTracks);
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate weekly growth based on recent activity
  const calculateWeeklyGrowth = (updatedAt: string): number => {
    const updated = new Date(updatedAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    
    // Mock growth calculation - in real implementation, this would be based on actual listener growth
    if (daysDiff <= 1) return Math.floor(Math.random() * 50) + 20; // High growth for recent updates
    if (daysDiff <= 7) return Math.floor(Math.random() * 100) + 10; // Medium growth for this week
    if (daysDiff <= 30) return Math.floor(Math.random() * 80) + 5;  // Lower growth for older tracks
    return Math.floor(Math.random() * 40) + 2; // Minimal growth for very old tracks
  };

  // Memoize recordPlay to prevent recreation on every render
  const recordPlay = useCallback(async (trackId: string, playDuration: number = 0) => {
    try {
      if (!user) {
        // For anonymous users, use session ID
        const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const { error } = await supabase
          .from('plays')
          .insert({
            track_id: trackId,
            session_id: sessionId,
            play_duration: playDuration,
            completed: playDuration > 30 // Mark as completed if played for more than 30 seconds
          });

        if (error) throw error;
      } else {
        // For authenticated users, check if they've already listened to this track
        const { data: existingPlay } = await supabase
          .from('plays')
          .select('id')
          .eq('track_id', trackId)
          .eq('user_id', user.id)
          .single();

        if (!existingPlay) {
          // First time listening - record as new unique listener
          const { error } = await supabase
            .from('plays')
            .insert({
              track_id: trackId,
              user_id: user.id,
              session_id: `user_${user.id}`,
              play_duration: playDuration,
              completed: playDuration > 30
            });

          if (error) throw error;
        } else {
          // User has listened before - just update play duration
          const { error } = await supabase
            .from('plays')
            .update({
              play_duration: playDuration,
              completed: playDuration > 30,
              created_at: new Date().toISOString()
            })
            .eq('id', existingPlay.id);

          if (error) throw error;
        }
      }

      // Only refresh data if not in a subscription callback to prevent loops
      if (!isInitialized.current) {
        await refreshData();
      }
    } catch (err) {
      console.error('Error recording play:', err);
      throw err;
    }
  }, [user]);

  // Memoize refreshData to prevent recreation on every render
  const refreshData = useCallback(async () => {
    await fetchTracks();
  }, [fetchTracks]);

  // Set up real-time subscriptions only once
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    
    isInitialized.current = true;

    // Subscribe to changes in tracks table
    const tracksSubscription = supabase
      .channel('tracks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tracks'
        },
        (payload) => {
          console.log('Track change detected:', payload);
          // Only refresh if it's not our own change to prevent loops
          if (payload.eventType !== 'UPDATE' || !payload.new?.id) {
            refreshData();
          }
        }
      )
      .subscribe();

    // Subscribe to changes in plays table
    const playsSubscription = supabase
      .channel('plays_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'plays'
        },
        (payload) => {
          console.log('Play change detected:', payload);
          // Only refresh if it's not our own change to prevent loops
          if (payload.eventType !== 'INSERT' || !payload.new?.id) {
            refreshData();
          }
        }
      )
      .subscribe();

    // Store subscriptions for cleanup
    subscriptionsRef.current = [tracksSubscription, playsSubscription];

    // Initial data fetch
    fetchTracks();

    // Cleanup subscriptions
    return () => {
      subscriptionsRef.current.forEach(sub => sub?.unsubscribe());
      isInitialized.current = false;
    };
  }, [fetchTracks, refreshData]);

  // Filter tracks based on provided filters
  const filteredTracks = tracks.filter(track => {
    if (!filters) return true;

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (!track.title.toLowerCase().includes(query) && 
          !track.artist.toLowerCase().includes(query) &&
          !track.genre.toLowerCase().includes(query)) {
        return false;
      }
    }

    if (filters.popularityTier && filters.popularityTier.length > 0) {
      if (!filters.popularityTier.includes(track.popularityTier)) {
        return false;
      }
    }

    if (filters.genre && filters.genre.length > 0) {
      if (!filters.genre.includes(track.genre)) {
        return false;
      }
    }

    if (filters.mood && filters.mood.length > 0) {
      if (!filters.mood.includes(track.mood)) {
        return false;
      }
    }

    if (filters.scene && filters.scene.length > 0) {
      if (!filters.scene.includes(track.scene)) {
        return false;
      }
    }

    if (filters.bpmRange) {
      if (track.bpm && (track.bpm < filters.bpmRange[0] || track.bpm > filters.bpmRange[1])) {
        return false;
      }
    }

    if (filters.listenerRange) {
      if (track.uniqueListeners < filters.listenerRange[0] || track.uniqueListeners > filters.listenerRange[1]) {
        return false;
      }
    }

    if (filters.engagementRange) {
      if (track.engagementRate < filters.engagementRange[0] || track.engagementRate > filters.engagementRange[1]) {
        return false;
      }
    }

    return true;
  });

  // Apply sorting
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (!filters?.sortBy) return 0;

    switch (filters.sortBy) {
      case 'listeners':
        return (b.uniqueListeners || 0) - (a.uniqueListeners || 0);
      case 'plays':
        return (b.totalPlays || 0) - (a.totalPlays || 0);
      case 'growth':
        return (b.weeklyGrowth || 0) - (a.weeklyGrowth || 0);
      case 'engagement':
        return (b.engagementRate || 0) - (a.engagementRate || 0);
      case 'recent':
        return new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime();
      default:
        return 0;
    }
  });

  return {
    tracks: sortedTracks,
    loading,
    error,
    recordPlay,
    refreshData
  };
};
