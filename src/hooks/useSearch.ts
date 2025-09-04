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
  // Additional properties expected by EnhancedSearchBar
  query: string;
  recentSearches: string[];
  isLoading: boolean;
  filters: SearchFilters;
  sortBy: SortOption;
  updateFilters: (filters: SearchFilters) => void;
  updateSortBy: (sortBy: SortOption) => void;
  clearSearch: () => void;
  clearRecentSearches: () => void;
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
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    moods: [],
    genres: [],
    scenes: [],
    bpmRange: [60, 180],
    duration: '',
    popularityTier: [],
  });
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const { user } = useAuth();

  const search = useCallback(async (query: string) => {
    setQuery(query);
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
    setFilters(filters);
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
    setQuery('');
  }, []);

  const updateFilters = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  const updateSortBy = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    clearResults();
  }, [clearResults]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    searchWithFilters,
    clearResults,
    query,
    recentSearches,
    isLoading: loading,
    filters,
    sortBy,
    updateFilters,
    updateSortBy,
    clearSearch,
    clearRecentSearches,
  };
};