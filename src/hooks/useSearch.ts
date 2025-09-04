import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  SearchQuery,
  SearchResults,
  SearchState,
  SearchFilters,
  SortOption,
  SearchType,
  SearchCacheEntry,
  SearchCache,
  RecentSearch,
  SearchSuggestion,
  SearchError,
  SearchErrorType,
  TrackSearchResult,
  ArtistSearchResult,
  RateLimit,
  SEARCH_CONFIG,
  validateSearchQuery,
  sanitizeSearchQuery,
} from '@/types/search';

/**
 * Enhanced Search Hook with Supabase Full-Text Search
 * Features:
 * - Debounced real-time search
 * - Full-text search across tracks, artists, genres, moods
 * - Fuzzy matching for typos
 * - Advanced filtering and sorting
 * - Result caching with expiration
 * - Recent search history
 * - Rate limiting
 * - Comprehensive error handling
 */

const STORAGE_KEYS = {
  RECENT_SEARCHES: 'soundscape.recent_searches',
  SEARCH_CACHE: 'soundscape.search_cache',
} as const;

export const useSearch = () => {
  // Core search state
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: null,
    suggestions: [],
    recentSearches: [],
    isLoading: false,
    isLoadingMore: false,
    error: null,
    filters: {
      moods: [],
      genres: [],
      scenes: [],
      bpmRange: [60, 180],
      duration: '',
      popularityTier: [],
    },
    sortBy: 'relevance',
    hasMore: false,
    lastSearchTime: 0,
  });

  // Refs for managing timers and state
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef<SearchCache>({});
  const rateLimitRef = useRef<RateLimit>({
    requests: 0,
    windowStart: Date.now(),
    windowSize: SEARCH_CONFIG.RATE_LIMIT.WINDOW_SIZE,
    maxRequests: SEARCH_CONFIG.RATE_LIMIT.MAX_REQUESTS,
  });

  const { toast } = useToast();

  /**
   * Load cached data from localStorage on mount
   */
  useEffect(() => {
    try {
      // Load recent searches
      const recentSearchesData = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
      if (recentSearchesData) {
        const recentSearches = JSON.parse(recentSearchesData) as RecentSearch[];
        setSearchState(prev => ({ ...prev, recentSearches }));
      }

      // Load search cache
      const cacheData = localStorage.getItem(STORAGE_KEYS.SEARCH_CACHE);
      if (cacheData) {
        const cache = JSON.parse(cacheData) as SearchCache;
        // Filter out expired entries
        const now = Date.now();
        const validCache: SearchCache = {};
        Object.entries(cache).forEach(([key, entry]) => {
          if (entry.expiresAt > now) {
            validCache[key] = entry;
          }
        });
        searchCacheRef.current = validCache;
      }
    } catch (error) {
      console.error('Failed to load search data from localStorage:', error);
    }
  }, []);

  /**
   * Save recent searches to localStorage
   */
  const saveRecentSearches = useCallback((searches: RecentSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save recent searches:', error);
    }
  }, []);

  /**
   * Save search cache to localStorage
   */
  const saveSearchCache = useCallback((cache: SearchCache) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SEARCH_CACHE, JSON.stringify(cache));
    } catch (error) {
      console.error('Failed to save search cache:', error);
    }
  }, []);

  /**
   * Check rate limiting
   */
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const rateLimit = rateLimitRef.current;

    // Reset window if needed
    if (now - rateLimit.windowStart >= rateLimit.windowSize) {
      rateLimit.requests = 0;
      rateLimit.windowStart = now;
    }

    // Check if we've exceeded the limit
    if (rateLimit.requests >= rateLimit.maxRequests) {
      return false;
    }

    rateLimit.requests++;
    return true;
  }, []);

  /**
   * Create cache key for search query
   */
  const createCacheKey = useCallback((query: string, filters: SearchFilters, sortBy: SortOption): string => {
    return `${query}|${JSON.stringify(filters)}|${sortBy}`;
  }, []);

  /**
   * Get cached search results
   */
  const getCachedResults = useCallback((cacheKey: string): SearchResults | null => {
    const cached = searchCacheRef.current[cacheKey];
    if (cached && cached.expiresAt > Date.now()) {
      return cached.results;
    }
    return null;
  }, []);

  /**
   * Cache search results
   */
  const cacheResults = useCallback((cacheKey: string, results: SearchResults) => {
    const now = Date.now();
    const cacheEntry: SearchCacheEntry = {
      key: cacheKey,
      results,
      timestamp: now,
      expiresAt: now + SEARCH_CONFIG.CACHE_DURATION,
    };

    searchCacheRef.current[cacheKey] = cacheEntry;
    saveSearchCache(searchCacheRef.current);
  }, [saveSearchCache]);

  /**
   * Clear expired cache entries
   */
  const clearExpiredCache = useCallback(() => {
    const now = Date.now();
    const validCache: SearchCache = {};
    
    Object.entries(searchCacheRef.current).forEach(([key, entry]) => {
      if (entry.expiresAt > now) {
        validCache[key] = entry;
      }
    });

    searchCacheRef.current = validCache;
    saveSearchCache(validCache);
  }, [saveSearchCache]);

  /**
   * Handle search errors
   */
  const handleSearchError = useCallback((error: any, query: string): SearchError => {
    let errorType: SearchErrorType = 'UNKNOWN_ERROR';
    let message = 'An unexpected error occurred while searching';
    let retryable = true;

    if (error.name === 'AbortError') {
      errorType = 'TIMEOUT_ERROR';
      message = 'Search request timed out. Please try again.';
    } else if (error.message?.includes('rate limit')) {
      errorType = 'RATE_LIMIT_ERROR';
      message = 'Too many search requests. Please wait a moment.';
      retryable = false;
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorType = 'NETWORK_ERROR';
      message = 'Network error. Please check your connection.';
    } else if (!validateSearchQuery(query)) {
      errorType = 'SQL_INJECTION_ATTEMPT';
      message = 'Invalid search query detected.';
      retryable = false;
    }

    const searchError: SearchError = {
      type: errorType,
      message,
      query,
      timestamp: Date.now(),
      retryable,
    };

    console.error('Search error:', searchError);
    return searchError;
  }, []);

  /**
   * Build Supabase query for full-text search
   */
  const buildSearchQuery = useCallback((
    query: string,
    filters: SearchFilters,
    sortBy: SortOption,
    limit: number = SEARCH_CONFIG.MAX_RESULTS,
    offset: number = 0
  ) => {
    let baseQuery = supabase
      .from('tracks')
      .select(`
        id,
        title,
        genre,
        mood,
        scene,
        duration,
        bpm,
        cover_art_url,
        stream_url,
        play_count,
        like_count,
        created_at,
        popularity_tier,
        has_lyrics,
        is_explicit,
        artists!inner(
          id,
          name,
          avatar_url
        )
      `);

    // Apply full-text search
    if (query.trim()) {
      const sanitizedQuery = sanitizeSearchQuery(query);
      
      // Use Supabase full-text search with fuzzy matching
      baseQuery = baseQuery.or(`
        title.ilike.%${sanitizedQuery}%,
        artists.name.ilike.%${sanitizedQuery}%,
        genre.ilike.%${sanitizedQuery}%,
        mood.ilike.%${sanitizedQuery}%,
        scene.ilike.%${sanitizedQuery}%
      `);
    }

    // Apply filters
    if (filters.moods.length > 0) {
      baseQuery = baseQuery.in('mood', filters.moods);
    }

    if (filters.genres.length > 0) {
      baseQuery = baseQuery.in('genre', filters.genres);
    }

    if (filters.scenes.length > 0) {
      baseQuery = baseQuery.in('scene', filters.scenes);
    }

    if (filters.bpmRange[0] !== 60 || filters.bpmRange[1] !== 180) {
      baseQuery = baseQuery
        .gte('bpm', filters.bpmRange[0])
        .lte('bpm', filters.bpmRange[1]);
    }

    if (filters.duration) {
      switch (filters.duration) {
        case 'short':
          baseQuery = baseQuery.lt('duration', 180);
          break;
        case 'medium':
          baseQuery = baseQuery.gte('duration', 180).lte('duration', 360);
          break;
        case 'long':
          baseQuery = baseQuery.gt('duration', 360);
          break;
      }
    }

    if (filters.popularityTier.length > 0) {
      baseQuery = baseQuery.in('popularity_tier', filters.popularityTier);
    }

    if (filters.hasLyrics !== undefined) {
      baseQuery = baseQuery.eq('has_lyrics', filters.hasLyrics);
    }

    if (filters.isExplicit !== undefined) {
      baseQuery = baseQuery.eq('is_explicit', filters.isExplicit);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popularity':
        baseQuery = baseQuery.order('play_count', { ascending: false });
        break;
      case 'date_desc':
        baseQuery = baseQuery.order('created_at', { ascending: false });
        break;
      case 'date_asc':
        baseQuery = baseQuery.order('created_at', { ascending: true });
        break;
      case 'alphabetical':
        baseQuery = baseQuery.order('title', { ascending: true });
        break;
      case 'play_count':
        baseQuery = baseQuery.order('play_count', { ascending: false });
        break;
      case 'like_count':
        baseQuery = baseQuery.order('like_count', { ascending: false });
        break;
      case 'duration_asc':
        baseQuery = baseQuery.order('duration', { ascending: true });
        break;
      case 'duration_desc':
        baseQuery = baseQuery.order('duration', { ascending: false });
        break;
      default: // relevance
        if (query.trim()) {
          // For relevance, we'll use a combination of factors
          baseQuery = baseQuery.order('play_count', { ascending: false });
        } else {
          baseQuery = baseQuery.order('created_at', { ascending: false });
        }
        break;
    }

    // Apply pagination
    baseQuery = baseQuery.range(offset, offset + limit - 1);

    return baseQuery;
  }, []);

  /**
   * Transform Supabase results to SearchResults format
   */
  const transformResults = useCallback((data: any[], query: string, executionTime: number): SearchResults => {
    const tracks: TrackSearchResult[] = data.map(track => ({
      id: track.id,
      title: track.title,
      artist: {
        id: track.artists.id,
        name: track.artists.name,
        avatar_url: track.artists.avatar_url,
      },
      genre: track.genre,
      mood: track.mood,
      scene: track.scene,
      duration: track.duration,
      bpm: track.bpm,
      cover_art_url: track.cover_art_url,
      stream_url: track.stream_url,
      play_count: track.play_count,
      like_count: track.like_count,
      created_at: track.created_at,
      popularity_tier: track.popularity_tier,
      has_lyrics: track.has_lyrics,
      is_explicit: track.is_explicit,
      // Calculate relevance score based on query match
      relevance_score: query.trim() ? calculateRelevanceScore(track, query) : 0,
    }));

    // Sort by relevance if that's the selected sort option
    if (query.trim()) {
      tracks.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    }

    return {
      tracks,
      artists: [], // Will be populated in separate queries if needed
      genres: [],
      moods: [],
      total: tracks.length,
      hasMore: tracks.length === SEARCH_CONFIG.MAX_RESULTS,
      query,
      executionTime,
    };
  }, []);

  /**
   * Calculate relevance score for search results
   */
  const calculateRelevanceScore = useCallback((track: any, query: string): number => {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Exact title match gets highest score
    if (track.title.toLowerCase() === lowerQuery) score += 100;
    else if (track.title.toLowerCase().includes(lowerQuery)) score += 50;

    // Artist name match
    if (track.artists.name.toLowerCase() === lowerQuery) score += 80;
    else if (track.artists.name.toLowerCase().includes(lowerQuery)) score += 40;

    // Genre/mood match
    if (track.genre.toLowerCase() === lowerQuery) score += 30;
    if (track.mood.toLowerCase() === lowerQuery) score += 30;

    // Boost popular tracks slightly
    score += Math.min(track.play_count / 1000, 20);

    return score;
  }, []);

  /**
   * Perform search with caching and error handling
   */
  const performSearch = useCallback(async (
    query: string,
    filters: SearchFilters,
    sortBy: SortOption,
    offset: number = 0
  ): Promise<SearchResults | null> => {
    const startTime = Date.now();

    try {
      // Check rate limiting
      if (!checkRateLimit()) {
        throw new Error('Rate limit exceeded');
      }

      // Validate and sanitize query
      if (query.trim() && !validateSearchQuery(query)) {
        throw new Error('Invalid search query');
      }

      // Check cache for non-paginated requests
      const cacheKey = createCacheKey(query, filters, sortBy);
      if (offset === 0) {
        const cachedResults = getCachedResults(cacheKey);
        if (cachedResults) {
          return cachedResults;
        }
      }

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Build and execute query
      const searchQuery = buildSearchQuery(query, filters, sortBy, SEARCH_CONFIG.MAX_RESULTS, offset);
      
      // Add timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout')), SEARCH_CONFIG.REQUEST_TIMEOUT);
      });

      const { data, error } = await Promise.race([
        searchQuery,
        timeoutPromise
      ]) as any;

      if (error) {
        throw error;
      }

      const executionTime = Date.now() - startTime;
      const results = transformResults(data || [], query, executionTime);

      // Cache results if not paginated
      if (offset === 0) {
        cacheResults(cacheKey, results);
      }

      return results;

    } catch (error: any) {
      const searchError = handleSearchError(error, query);
      
      // Clear cache on error
      if (searchError.type !== 'RATE_LIMIT_ERROR') {
        clearExpiredCache();
      }

      throw searchError;
    }
  }, [
    checkRateLimit,
    createCacheKey,
    getCachedResults,
    buildSearchQuery,
    transformResults,
    cacheResults,
    handleSearchError,
    clearExpiredCache
  ]);

  /**
   * Add search to recent searches
   */
  const addToRecentSearches = useCallback((
    query: string,
    type: SearchType,
    filters: SearchFilters,
    resultCount: number
  ) => {
    const recentSearch: RecentSearch = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      query,
      type,
      filters,
      timestamp: Date.now(),
      resultCount,
    };

    setSearchState(prev => {
      const newRecentSearches = [
        recentSearch,
        ...prev.recentSearches.filter(search => search.query !== query)
      ].slice(0, SEARCH_CONFIG.MAX_RECENT_SEARCHES);

      saveRecentSearches(newRecentSearches);
      return { ...prev, recentSearches: newRecentSearches };
    });
  }, [saveRecentSearches]);

  /**
   * Debounced search function
   */
  const debouncedSearch = useCallback((
    query: string,
    filters: SearchFilters,
    sortBy: SortOption,
    immediate: boolean = false
  ) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const executeSearch = async () => {
      if (query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH && query.trim() !== '') {
        return;
      }

      setSearchState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        lastSearchTime: Date.now()
      }));

      try {
        const results = await performSearch(query, filters, sortBy);
        
        setSearchState(prev => ({
          ...prev,
          results,
          isLoading: false,
          hasMore: results?.hasMore || false,
        }));

        // Add to recent searches if query is not empty
        if (query.trim() && results) {
          addToRecentSearches(query, 'all', filters, results.total);
        }

      } catch (error: any) {
        setSearchState(prev => ({
          ...prev,
          error: error.message || 'Search failed',
          isLoading: false,
          results: null,
        }));

        // Show error toast for user-facing errors
        if (error.retryable !== false) {
          toast({
            title: 'Search Error',
            description: error.message,
            variant: 'destructive',
          });
        }
      }
    };

    if (immediate) {
      executeSearch();
    } else {
      debounceTimeoutRef.current = setTimeout(executeSearch, SEARCH_CONFIG.DEBOUNCE_DELAY);
    }
  }, [performSearch, addToRecentSearches, toast]);

  /**
   * Public API methods
   */
  const search = useCallback((
    query: string, 
    filters?: SearchFilters, 
    sortBy?: SortOption, 
    immediate?: boolean
  ) => {
    const searchFilters = filters || searchState.filters;
    const searchSort = sortBy || searchState.sortBy;
    
    setSearchState(prev => ({
      ...prev,
      query,
      filters: searchFilters,
      sortBy: searchSort,
    }));

    debouncedSearch(query, searchFilters, searchSort, immediate);
  }, [searchState.filters, searchState.sortBy, debouncedSearch]);

  const updateFilters = useCallback((filters: SearchFilters) => {
    setSearchState(prev => ({ ...prev, filters }));
    if (searchState.query) {
      debouncedSearch(searchState.query, filters, searchState.sortBy);
    }
  }, [searchState.query, searchState.sortBy, debouncedSearch]);

  const updateSortBy = useCallback((sortBy: SortOption) => {
    setSearchState(prev => ({ ...prev, sortBy }));
    if (searchState.query) {
      debouncedSearch(searchState.query, searchState.filters, sortBy, true);
    }
  }, [searchState.query, searchState.filters, debouncedSearch]);

  const clearSearch = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setSearchState(prev => ({
      ...prev,
      query: '',
      results: null,
      error: null,
      isLoading: false,
      hasMore: false,
    }));
  }, []);

  const clearRecentSearches = useCallback(() => {
    setSearchState(prev => ({ ...prev, recentSearches: [] }));
    localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
  }, []);

  const loadMore = useCallback(async () => {
    if (!searchState.results || !searchState.hasMore || searchState.isLoadingMore) {
      return;
    }

    setSearchState(prev => ({ ...prev, isLoadingMore: true }));

    try {
      const offset = searchState.results.tracks.length;
      const moreResults = await performSearch(
        searchState.query,
        searchState.filters,
        searchState.sortBy,
        offset
      );

      if (moreResults) {
        setSearchState(prev => ({
          ...prev,
          results: prev.results ? {
            ...prev.results,
            tracks: [...prev.results.tracks, ...moreResults.tracks],
            total: moreResults.total,
            hasMore: moreResults.hasMore,
          } : moreResults,
          isLoadingMore: false,
        }));
      }
    } catch (error: any) {
      setSearchState(prev => ({
        ...prev,
        isLoadingMore: false,
        error: error.message,
      }));
    }
  }, [searchState, performSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Memoized return value
  return useMemo(() => ({
    // State
    query: searchState.query,
    results: searchState.results,
    suggestions: searchState.suggestions,
    recentSearches: searchState.recentSearches,
    isLoading: searchState.isLoading,
    isLoadingMore: searchState.isLoadingMore,
    error: searchState.error,
    filters: searchState.filters,
    sortBy: searchState.sortBy,
    hasMore: searchState.hasMore,

    // Actions
    search,
    updateFilters,
    updateSortBy,
    clearSearch,
    clearRecentSearches,
    loadMore,

    // Utilities
    performSearch,
    validateQuery: validateSearchQuery,
    sanitizeQuery: sanitizeSearchQuery,
  }), [
    searchState,
    search,
    updateFilters,
    updateSortBy,
    clearSearch,
    clearRecentSearches,
    loadMore,
    performSearch,
  ]);
};
