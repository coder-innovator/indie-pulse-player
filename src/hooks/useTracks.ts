import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  coverUrl: string;
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

interface SearchFilters {
  moods: string[];
  genres: string[];
  scenes: string[];
  bpmRange: [number, number];
  duration: string;
  popularityTier: string[];
}

interface UseTracksResult {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseTracksByTierResult {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTracks = (filters?: SearchFilters): UseTracksResult => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracks = async () => {
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
          unique_listeners,
          total_plays,
          popularity_tier,
          bpm,
          created_at,
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
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters if provided
      if (filters) {
        if (filters.popularityTier.length > 0) {
          query = query.in('popularity_tier', filters.popularityTier);
        }

        if (filters.genres.length > 0) {
          // This would need to be implemented with proper tag filtering
          // For now, we'll filter after fetching
        }

        if (filters.bpmRange && (filters.bpmRange[0] > 60 || filters.bpmRange[1] < 180)) {
          query = query.gte('bpm', filters.bpmRange[0]).lte('bpm', filters.bpmRange[1]);
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const formattedTracks: Track[] = data?.map((track: any) => {
        const tags = track.track_tags?.map((tt: any) => tt.tags?.name).filter(Boolean) || [];
        const genre = tags.find(tag => ['Electronic', 'Indie Rock', 'Hip Hop', 'Pop', 'R&B', 'Jazz', 'Classical', 'Country', 'Folk', 'Reggae', 'Metal', 'Punk', 'Blues', 'Soul', 'Funk', 'Disco', 'House', 'Techno', 'Ambient', 'Experimental', 'Lo-Fi', 'Trap'].includes(tag)) || 'Unknown';
        const mood = tags.find(tag => ['Energetic', 'Chill', 'Happy', 'Sad', 'Dark', 'Uplifting', 'Melancholic', 'Aggressive', 'Peaceful', 'Nostalgic', 'Euphoric', 'Mysterious', 'Romantic', 'Adventurous', 'Relaxed', 'Intense', 'Dreamy', 'Confident', 'Vulnerable'].includes(tag)) || 'Unknown';
        const scene = tags.find(tag => ['Underground', 'Mainstream', 'Local', 'International', 'College', 'Club', 'Festival', 'Bedroom', 'Studio', 'Live', 'DIY', 'Independent', 'Major Label', 'Alternative', 'Avant-garde', 'Traditional', 'Fusion', 'Crossover'].includes(tag)) || 'Unknown';
        
        // Calculate engagement rate
        const engagementRate = track.unique_listeners > 0 
          ? Math.round((track.total_plays / track.unique_listeners) * 100) 
          : 0;
        
        // Mock weekly growth
        const weeklyGrowth = Math.floor(Math.random() * 100) + 10;
        
        return {
          id: track.id,
          title: track.title,
          artist: track.artists?.name || 'Unknown Artist',
          duration: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : undefined,
          coverUrl: track.cover_url || '/src/assets/sample-cover-1.jpg',
          uniqueListeners: track.unique_listeners || 0,
          popularityTier: track.popularity_tier || 'emerging',
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

      // Apply additional filters after fetching
      let filteredTracks = formattedTracks;
      
      if (filters) {
        if (filters.genres.length > 0) {
          filteredTracks = filteredTracks.filter(track => 
            filters.genres.includes(track.genre)
          );
        }

        if (filters.moods.length > 0) {
          filteredTracks = filteredTracks.filter(track => 
            filters.moods.includes(track.mood)
          );
        }

        if (filters.scenes.length > 0) {
          filteredTracks = filteredTracks.filter(track => 
            filters.scenes.includes(track.scene)
          );
        }
      }

      setTracks(filteredTracks);
    } catch (err) {
      console.error('Error fetching tracks:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchTracks();
  };

  useEffect(() => {
    fetchTracks();
  }, [filters?.popularityTier, filters?.bpmRange]);

  return {
    tracks,
    loading,
    error,
    refetch
  };
};

export const useTracksByTier = (tier: string): UseTracksByTierResult => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracksByTier = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          duration,
          cover_url,
          unique_listeners,
          total_plays,
          popularity_tier,
          bpm,
          created_at,
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
        .eq('popularity_tier', tier)
        .order('unique_listeners', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      const formattedTracks: Track[] = data?.map((track: any) => {
        const tags = track.track_tags?.map((tt: any) => tt.tags?.name).filter(Boolean) || [];
        const genre = tags.find(tag => ['Electronic', 'Indie Rock', 'Hip Hop', 'Pop', 'R&B', 'Jazz', 'Classical', 'Country', 'Folk', 'Reggae', 'Metal', 'Punk', 'Blues', 'Soul', 'Funk', 'Disco', 'House', 'Techno', 'Ambient', 'Experimental', 'Lo-Fi', 'Trap'].includes(tag)) || 'Unknown';
        const mood = tags.find(tag => ['Energetic', 'Chill', 'Happy', 'Sad', 'Dark', 'Uplifting', 'Melancholic', 'Aggressive', 'Peaceful', 'Nostalgic', 'Euphoric', 'Mysterious', 'Romantic', 'Adventurous', 'Relaxed', 'Intense', 'Dreamy', 'Confident', 'Vulnerable'].includes(tag)) || 'Unknown';
        const scene = tags.find(tag => ['Underground', 'Mainstream', 'Local', 'International', 'College', 'Club', 'Festival', 'Bedroom', 'Studio', 'Live', 'DIY', 'Independent', 'Major Label', 'Alternative', 'Avant-garde', 'Traditional', 'Fusion', 'Crossover'].includes(tag)) || 'Unknown';
        
        const engagementRate = track.unique_listeners > 0 
          ? Math.round((track.total_plays / track.unique_listeners) * 100) 
          : 0;
        
        const weeklyGrowth = Math.floor(Math.random() * 100) + 10;
        
        return {
          id: track.id,
          title: track.title,
          artist: track.artists?.name || 'Unknown Artist',
          duration: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : undefined,
          coverUrl: track.cover_url || '/src/assets/sample-cover-1.jpg',
          uniqueListeners: track.unique_listeners || 0,
          popularityTier: track.popularity_tier || 'emerging',
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
      console.error('Error fetching tracks by tier:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchTracksByTier();
  };

  useEffect(() => {
    fetchTracksByTier();
  }, [tier]);

  return {
    tracks,
    loading,
    error,
    refetch
  };
};