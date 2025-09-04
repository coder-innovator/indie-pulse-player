import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  SearchFilters,
  SearchResults,
  TrackSearchResult,
  ArtistSearchResult,
  GenreSearchResult,
  MoodSearchResult,
  SortOption,
  DurationFilter
} from '@/types/search';
import { useAuth } from './useAuth';

export interface UseSearchResult {
  results: SearchResults;
  loading: boolean;
  error: string | null;
  search: (query: string) => Promise<void>;
  searchWithFilters: (query: string, filters: SearchFilters) => Promise<void>;
  clearResults: () => void;
}

export const useSearch = (): UseSearchResult => {
  const [results, setResults] = useState<SearchResults>({
    tracks: [],
    artists: [],
    genres: [],
    moods: [],
    total: 0,
    hasMore: false,
    query: '',
    executionTime: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults({
        tracks: [],
        artists: [],
        genres: [],
        moods: [],
        total: 0,
        hasMore: false,
        query: '',
        executionTime: 0,
      });
      return;
    }

    setLoading(true);
    setError(null);
    const startTime = Date.now();

    try {
      // Simple search implementation for now
      const { data: tracks, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .ilike('title', `%${query}%`)
        .limit(10);

      if (tracksError) throw tracksError;

      const searchResult: SearchResults = {
        tracks: [],
        artists: [],
        genres: [],
        moods: [],
        total: tracks?.length || 0,
        hasMore: false,
        query,
        executionTime: Date.now() - startTime,
      };

      setResults(searchResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchWithFilters = useCallback(async (query: string, filters: SearchFilters) => {
    // Simplified implementation
    await search(query);
  }, [search]);

  const clearResults = useCallback(() => {
    setResults({
      tracks: [],
      artists: [],
      genres: [],
      moods: [],
      total: 0,
      hasMore: false,
      query: '',
      executionTime: 0,
    });
  }, []);

  return {
    results,
    loading,
    error,
    search,
    searchWithFilters,
    clearResults,
  };
};