import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UploadEvent {
  id: string;
  track_id: string;
  artist_id: string;
  title: string;
  artist_name: string;
  created_at: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
}

interface RealTimeUploads {
  recentUploads: UploadEvent[];
  loading: boolean;
  error: string | null;
  refreshUploads: () => Promise<void>;
}

export const useRealTimeUploads = (): RealTimeUploads => {
  const [recentUploads, setRecentUploads] = useState<UploadEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to prevent infinite loops
  const isInitialized = useRef(false);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  // Memoize fetchRecentUploads to prevent recreation on every render
  const fetchRecentUploads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch recent tracks (last 24 hours) to show new uploads
      const { data, error: fetchError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          created_at,
          artists (
            id,
            name
          )
        `)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      const uploads: UploadEvent[] = data?.map((track: { id: string; title: string; created_at: string; artists?: { id: string; name: string } | null }) => ({
        id: track.id,
        track_id: track.id,
        artist_id: track.artists?.id || '',
        title: track.title,
        artist_name: track.artists?.name || 'Unknown Artist',
        created_at: track.created_at,
        status: 'completed'
      })) || [];

      setRecentUploads(uploads);
    } catch (err) {
      console.error('Error fetching recent uploads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch uploads');
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoize refreshUploads to prevent recreation on every render
  const refreshUploads = useCallback(async () => {
    await fetchRecentUploads();
  }, [fetchRecentUploads]);

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    
    isInitialized.current = true;

    // Subscribe to changes in tracks table for new uploads
    const uploadsSubscription = supabase
      .channel('uploads_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tracks'
        },
        (payload) => {
          console.log('New track uploaded:', payload);
          // Only refresh if it's not our own change to prevent loops
          if (payload.eventType === 'INSERT' && payload.new?.id) {
            refreshUploads();
          }
        }
      )
      .subscribe();

    // Store subscription for cleanup
    subscriptionRef.current = uploadsSubscription;

    // Initial fetch
    fetchRecentUploads();

    // Cleanup subscription
    return () => {
      subscriptionRef.current?.unsubscribe();
      isInitialized.current = false;
    };
  }, [fetchRecentUploads, refreshUploads]);

  return {
    recentUploads,
    loading,
    error,
    refreshUploads
  };
};
