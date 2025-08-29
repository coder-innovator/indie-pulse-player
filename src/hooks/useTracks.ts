import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  coverUrl: string;
  tags?: string[];
  isLiked?: boolean;
  uniqueListeners?: number;
  popularityTier?: 'emerging' | 'rising' | 'established' | 'popular';
}

interface SearchFilters {
  moods: string[];
  genres: string[];
  scenes: string[];
  bpmRange: [number, number];
  duration: string;
  popularityTier: string[];
}

export const useTracks = (filters?: SearchFilters) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
            popularity_tier,
            artists (
              name
            ),
            track_tags (
              tags (
                name,
                type
              )
            )
          `);

        // Apply popularity tier filter
        if (filters?.popularityTier && filters.popularityTier.length > 0) {
          query = query.in('popularity_tier', filters.popularityTier);
        }

        // Apply BPM filter
        if (filters?.bpmRange) {
          query = query
            .gte('bpm', filters.bpmRange[0])
            .lte('bpm', filters.bpmRange[1]);
        }

        const { data, error: fetchError } = await query;

        if (fetchError) {
          throw fetchError;
        }

        const formattedTracks: Track[] = data?.map((track: any) => ({
          id: track.id,
          title: track.title,
          artist: track.artists?.name || 'Unknown Artist',
          duration: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : undefined,
          coverUrl: track.cover_url || '/src/assets/sample-cover-1.jpg',
          uniqueListeners: track.unique_listeners,
          popularityTier: track.popularity_tier,
          tags: track.track_tags?.map((tt: any) => tt.tags?.name).filter(Boolean) || [],
        })) || [];

        // Apply tag-based filters (mood, genre, scene)
        let filteredTracks = formattedTracks;
        
        if (filters?.moods && filters.moods.length > 0) {
          filteredTracks = filteredTracks.filter(track => 
            track.tags?.some(tag => filters.moods.includes(tag))
          );
        }

        if (filters?.genres && filters.genres.length > 0) {
          filteredTracks = filteredTracks.filter(track => 
            track.tags?.some(tag => filters.genres.includes(tag))
          );
        }

        if (filters?.scenes && filters.scenes.length > 0) {
          filteredTracks = filteredTracks.filter(track => 
            track.tags?.some(tag => filters.scenes.includes(tag))
          );
        }

        setTracks(filteredTracks);
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tracks');
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [filters]);

  return { tracks, loading, error };
};

// Hook for tracks by popularity tier
export const useTracksByTier = (tier: 'emerging' | 'rising' | 'established' | 'popular') => {
  return useTracks({ 
    moods: [], 
    genres: [], 
    scenes: [], 
    bpmRange: [60, 180], 
    duration: '', 
    popularityTier: [tier] 
  });
};