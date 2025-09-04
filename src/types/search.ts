/**
 * Search Types and Interfaces
 * Defines all types for the comprehensive search functionality
 */

// Base search interfaces
export interface SearchQuery {
  query: string;
  type: SearchType;
  filters: SearchFilters;
  sortBy: SortOption;
  limit: number;
  offset: number;
}

export type SearchType = 'all' | 'tracks' | 'artists' | 'genres' | 'moods';

export interface SearchFilters {
  moods: string[];
  genres: string[];
  scenes: string[];
  bpmRange: [number, number];
  duration: DurationFilter;
  popularityTier: string[];
  uploadDateRange?: DateRange;
  hasLyrics?: boolean;
  isExplicit?: boolean;
}

export type DurationFilter = 
  | '' 
  | 'short' 
  | 'medium' 
  | 'long' 
  | 'custom';

export interface DateRange {
  from: Date;
  to: Date;
}

export type SortOption = 
  | 'relevance' 
  | 'popularity' 
  | 'date_desc' 
  | 'date_asc' 
  | 'alphabetical' 
  | 'duration_asc' 
  | 'duration_desc'
  | 'play_count'
  | 'like_count';

// Search result interfaces
export interface SearchResults {
  tracks: TrackSearchResult[];
  artists: ArtistSearchResult[];
  genres: GenreSearchResult[];
  moods: MoodSearchResult[];
  total: number;
  hasMore: boolean;
  query: string;
  executionTime: number;
}

export interface TrackSearchResult {
  id: string;
  title: string;
  artist: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  genre: string;
  mood: string;
  scene?: string;
  duration: number;
  bpm?: number;
  cover_art_url?: string;
  stream_url?: string;
  play_count: number;
  like_count: number;
  created_at: string;
  popularity_tier: string;
  has_lyrics: boolean;
  is_explicit: boolean;
  relevance_score?: number;
}

export interface ArtistSearchResult {
  id: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  follower_count: number;
  track_count: number;
  genres: string[];
  created_at: string;
  relevance_score?: number;
}

export interface GenreSearchResult {
  name: string;
  track_count: number;
  description?: string;
  relevance_score?: number;
}

export interface MoodSearchResult {
  name: string;
  track_count: number;
  description?: string;
  relevance_score?: number;
}

// Search suggestion interfaces
export interface SearchSuggestion {
  id: string;
  text: string;
  type: SearchType;
  category: 'recent' | 'popular' | 'trending';
  metadata?: {
    artist?: string;
    genre?: string;
    play_count?: number;
  };
}

export interface RecentSearch {
  id: string;
  query: string;
  type: SearchType;
  filters: SearchFilters;
  timestamp: number;
  resultCount: number;
}

// Search state interfaces
export interface SearchState {
  query: string;
  results: SearchResults | null;
  suggestions: SearchSuggestion[];
  recentSearches: RecentSearch[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  filters: SearchFilters;
  sortBy: SortOption;
  hasMore: boolean;
  lastSearchTime: number;
}

// Search cache interfaces
export interface SearchCacheEntry {
  key: string;
  results: SearchResults;
  timestamp: number;
  expiresAt: number;
}

export interface SearchCache {
  [key: string]: SearchCacheEntry;
}

// Search analytics interfaces
export interface SearchAnalytics {
  query: string;
  type: SearchType;
  filters: SearchFilters;
  resultCount: number;
  clickedResults: string[];
  searchTime: number;
  timestamp: number;
  userId?: string;
}

// Rate limiting interfaces
export interface RateLimit {
  requests: number;
  windowStart: number;
  windowSize: number;
  maxRequests: number;
}

// Search configuration
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300,
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REQUEST_TIMEOUT: 5000,
  MAX_RECENT_SEARCHES: 5,
  RATE_LIMIT: {
    MAX_REQUESTS: 10,
    WINDOW_SIZE: 1000, // 1 second
  },
} as const;

// Search error types
export type SearchErrorType = 
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'VALIDATION_ERROR'
  | 'SQL_INJECTION_ATTEMPT'
  | 'UNKNOWN_ERROR';

export interface SearchError {
  type: SearchErrorType;
  message: string;
  query?: string;
  timestamp: number;
  retryable: boolean;
}

// Filter options
export const FILTER_OPTIONS = {
  MOODS: [
    'Chill', 'Energetic', 'Melancholic', 'Uplifting', 'Dark', 'Dreamy',
    'Aggressive', 'Peaceful', 'Nostalgic', 'Euphoric', 'Mysterious', 'Romantic'
  ],
  GENRES: [
    'Electronic', 'Indie Rock', 'Folk', 'Hip Hop', 'Jazz', 'Classical',
    'Ambient', 'Post Rock', 'Lo-Fi', 'Experimental', 'Pop', 'R&B',
    'Funk', 'Blues', 'Country', 'Reggae', 'Punk', 'Metal'
  ],
  SCENES: [
    'Underground', 'Local', 'Experimental', 'Bedroom Pop', 'Lo-fi', 'DIY',
    'Indie', 'Alternative', 'Avant-garde', 'Minimalist'
  ],
  POPULARITY_TIERS: [
    { value: 'emerging', label: '🌱 Emerging (0-99 listeners)', min: 0, max: 99 },
    { value: 'rising', label: '📈 Rising (100-999 listeners)', min: 100, max: 999 },
    { value: 'established', label: '🎯 Established (1K-9K listeners)', min: 1000, max: 9999 },
    { value: 'popular', label: '🔥 Popular (10K+ listeners)', min: 10000, max: Infinity }
  ],
  DURATION_FILTERS: [
    { value: 'short', label: 'Short (< 3 min)', max: 180 },
    { value: 'medium', label: 'Medium (3-6 min)', min: 180, max: 360 },
    { value: 'long', label: 'Long (> 6 min)', min: 360 },
  ],
  SORT_OPTIONS: [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'popularity', label: 'Most Popular' },
    { value: 'date_desc', label: 'Newest First' },
    { value: 'date_asc', label: 'Oldest First' },
    { value: 'alphabetical', label: 'A to Z' },
    { value: 'play_count', label: 'Most Played' },
    { value: 'like_count', label: 'Most Liked' },
    { value: 'duration_asc', label: 'Shortest First' },
    { value: 'duration_desc', label: 'Longest First' },
  ]
} as const;

// Search validation utilities
export const validateSearchQuery = (query: string): boolean => {
  if (query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) return false;
  
  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(UNION\s+SELECT)/i,
    /(OR\s+1\s*=\s*1)/i,
    /(AND\s+1\s*=\s*1)/i,
    /('|\"|;|--|\*|\/\*|\*\/)/,
  ];
  
  return !sqlInjectionPatterns.some(pattern => pattern.test(query));
};

export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS chars
    .replace(/['";]/g, '') // Remove SQL injection chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .slice(0, 100); // Limit length
};
