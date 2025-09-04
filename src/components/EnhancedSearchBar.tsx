import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Filter, 
  X, 
  Music, 
  User, 
  Hash,
  Sliders,
  Clock,
  TrendingUp,
  Loader2,
  History,
  Play,
  Heart,
  ChevronDown,
  ArrowUpDown
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/useSearch";
import { usePlayerStore } from "@/stores/playerStore";
import { 
  SearchFilters, 
  SearchType, 
  SortOption, 
  TrackSearchResult,
  FILTER_OPTIONS 
} from "@/types/search";

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  filters?: SearchFilters;
  onFiltersChange?: (filters: SearchFilters) => void;
  onSearch?: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  className?: string;
  showResults?: boolean;
  maxResults?: number;
  autoFocus?: boolean;
}

/**
 * Format duration in seconds to MM:SS format
 */
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Search Result Item Component
 */
const SearchResultItem: React.FC<{
  track: TrackSearchResult;
  onPlay: (track: TrackSearchResult) => void;
  onSelect: (track: TrackSearchResult) => void;
  isPlaying: boolean;
}> = ({ track, onPlay, onSelect, isPlaying }) => {
  return (
    <div 
      className="flex items-center gap-3 p-3 hover:bg-accent/50 rounded-lg cursor-pointer transition-colors group"
      onClick={() => onSelect(track)}
    >
      {/* Cover Art */}
      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-secondary flex-shrink-0">
        {track.cover_art_url ? (
          <img 
            src={track.cover_art_url}
            alt={track.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
        
        {/* Play Button Overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlay(track);
          }}
          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isPlaying ? (
            <div className="w-3 h-3 bg-primary animate-pulse rounded-full" />
          ) : (
            <Play className="w-3 h-3 text-white fill-white" />
          )}
        </button>
      </div>
      
      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{track.title}</h4>
          {track.is_explicit && (
            <Badge variant="secondary" className="text-xs px-1 py-0">E</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{track.artist.name}</span>
          <span>•</span>
          <span>{track.genre}</span>
          <span>•</span>
          <span>{formatDuration(track.duration)}</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Play className="w-3 h-3" />
          <span>{track.play_count.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          <span>{track.like_count.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Recent Search Item Component
 */
const RecentSearchItem: React.FC<{
  search: { query: string; resultCount: number; timestamp: number };
  onSelect: (query: string) => void;
}> = ({ search, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(search.query)}
      className="flex items-center justify-between w-full p-2 hover:bg-accent/50 rounded-lg text-left transition-colors"
    >
      <div className="flex items-center gap-2">
        <History className="w-3 h-3 text-muted-foreground" />
        <span className="text-sm">{search.query}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        {search.resultCount} results
      </div>
    </button>
  );
};

/**
 * Loading Skeleton for Search Results
 */
const SearchResultSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton className="w-10 h-10 rounded-md" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    ))}
  </div>
);

export function EnhancedSearchBar({
  value: externalValue,
  onChange: externalOnChange,
  filters: externalFilters,
  onFiltersChange,
  onSearch,
  placeholder = "Search tracks, artists, or tags...",
  className,
  showResults = true,
  maxResults = 10,
  autoFocus = false
}: SearchBarProps) {
  // Hooks
  const navigate = useNavigate();
  const { setCurrentTrack, currentTrack } = usePlayerStore();
  const {
    query,
    results,
    recentSearches,
    isLoading,
    error,
    filters,
    sortBy,
    search,
    updateFilters,
    updateSortBy,
    clearSearch,
    clearRecentSearches
  } = useSearch();
  
  // Local state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [searchType, setSearchType] = useState<SearchType>('all');
  const [localValue, setLocalValue] = useState(externalValue || '');
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Use external or internal state
  const currentValue = externalValue !== undefined ? externalValue : localValue;
  const currentFilters = externalFilters || filters;

  // Auto-focus input
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setIsResultsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Handle external value changes
  useEffect(() => {
    if (externalValue !== undefined && externalValue !== localValue) {
      setLocalValue(externalValue);
      if (externalValue !== query) {
        search(externalValue, currentFilters, sortBy);
      }
    }
  }, [externalValue, localValue, query, search, currentFilters, sortBy]);
  
  // Handle external filter changes
  useEffect(() => {
    if (externalFilters && JSON.stringify(externalFilters) !== JSON.stringify(filters)) {
      updateFilters(externalFilters);
    }
  }, [externalFilters, filters, updateFilters]);

  /**
   * Handle input value changes
   */
  const handleInputChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    externalOnChange?.(newValue);
    
    // Trigger search with debouncing
    search(newValue, currentFilters, sortBy);
    
    // Show results if there's a query or recent searches
    if (newValue.trim() || recentSearches.length > 0) {
      setIsResultsOpen(true);
    }
  }, [externalOnChange, search, currentFilters, sortBy, recentSearches.length]);
  
  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    updateFilters(newFilters);
    onFiltersChange?.(newFilters);
    
    // Re-search with new filters if there's a query
    if (currentValue.trim()) {
      search(currentValue, newFilters, sortBy, true);
    }
  }, [updateFilters, onFiltersChange, currentValue, search, sortBy]);
  
  /**
   * Handle sort changes
   */
  const handleSortChange = useCallback((newSort: SortOption) => {
    updateSortBy(newSort);
    
    // Re-search with new sort if there's a query
    if (currentValue.trim()) {
      search(currentValue, currentFilters, newSort, true);
    }
  }, [updateSortBy, currentValue, search, currentFilters]);
  
  /**
   * Clear all filters
   */
  const clearAllFilters = useCallback(() => {
    const clearedFilters: SearchFilters = {
      moods: [],
      genres: [],
      scenes: [],
      bpmRange: [60, 180],
      duration: '',
      popularityTier: [],
    };
    handleFiltersChange(clearedFilters);
  }, [handleFiltersChange]);

  /**
   * Handle manual search trigger
   */
  const handleSearch = useCallback(() => {
    onSearch?.(currentValue, currentFilters);
    search(currentValue, currentFilters, sortBy, true);
    setIsResultsOpen(false);
    
    // Navigate to search results if not handled externally
    if (!onSearch && currentValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(currentValue)}`);
    }
  }, [onSearch, currentValue, currentFilters, search, sortBy, navigate]);
  
  /**
   * Handle keyboard navigation
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsResultsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'ArrowDown' && results?.tracks.length) {
      // TODO: Implement keyboard navigation through results
      e.preventDefault();
    }
  }, [handleSearch, results]);
  
  /**
   * Handle track play
   */
  const handleTrackPlay = useCallback((track: TrackSearchResult) => {
    setCurrentTrack({
      id: track.id,
      title: track.title,
      artist: track.artist.name,
      coverUrl: track.cover_art_url || '',
      streamUrl: track.stream_url || '',
      duration: track.duration.toString(),
    });
  }, [setCurrentTrack]);
  
  /**
   * Handle track selection
   */
  const handleTrackSelect = useCallback((track: TrackSearchResult) => {
    setIsResultsOpen(false);
    navigate(`/artist/${track.artist.id}`);
  }, [navigate]);
  
  /**
   * Handle recent search selection
   */
  const handleRecentSearchSelect = useCallback((searchQuery: string) => {
    setLocalValue(searchQuery);
    externalOnChange?.(searchQuery);
    search(searchQuery, currentFilters, sortBy, true);
    setIsResultsOpen(false);
  }, [externalOnChange, search, currentFilters, sortBy]);
  
  /**
   * Calculate active filter count
   */
  const activeFilterCount = useMemo(() => {
    return currentFilters.moods.length + 
           currentFilters.genres.length + 
           currentFilters.scenes.length + 
           currentFilters.popularityTier.length +
           (currentFilters.duration ? 1 : 0) +
           (currentFilters.hasLyrics !== undefined ? 1 : 0) +
           (currentFilters.isExplicit !== undefined ? 1 : 0);
  }, [currentFilters]);

  /**
   * Toggle array filter values
   */
  const toggleArrayFilter = useCallback((
    filterKey: 'moods' | 'genres' | 'scenes' | 'popularityTier',
    value: string
  ) => {
    const currentArray = currentFilters[filterKey];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    const newFilters = {
      ...currentFilters,
      [filterKey]: newArray
    };
    handleFiltersChange(newFilters);
  }, [currentFilters, handleFiltersChange]);
  
  /**
   * Get display results (limited for dropdown)
   */
  const displayResults = useMemo(() => {
    if (!results) return null;
    
    return {
      ...results,
      tracks: results.tracks.slice(0, maxResults)
    };
  }, [results, maxResults]);

  return (
    <div className={cn("relative space-y-3", className)} ref={resultsRef}>
      {/* Search Type Tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: 'all', label: 'All', icon: Search },
          { key: 'tracks', label: 'Tracks', icon: Music },
          { key: 'artists', label: 'Artists', icon: User },
          { key: 'tags', label: 'Tags', icon: Hash }
        ].map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={searchType === key ? "default" : "ghost"}
            size="sm"
            className="h-8 px-3 focus-ring"
            onClick={() => setSearchType(key as SearchType)}
          >
            <Icon className="w-3 h-3 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            ref={inputRef}
            value={currentValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              if (currentValue.trim() || recentSearches.length > 0) {
                setIsResultsOpen(true);
              }
            }}
            placeholder={placeholder}
            className="pl-10 pr-32 h-11 bg-secondary/50 border-border focus:bg-background transition-colors focus-ring"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {/* Sort Selector */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-auto h-8 px-2 border-0 bg-transparent hover:bg-accent/50">
                <ArrowUpDown className="w-3 h-3" />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-8 h-8 focus-ring",
                    activeFilterCount > 0 && "text-primary hover:text-primary"
                  )}
                  aria-label="Open filters"
                >
                  <Filter className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Filters</h3>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-7 px-2 text-xs"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 text-foreground">Discovery Level</h4>
                    <div className="space-y-2">
                      {FILTER_OPTIONS.POPULARITY_TIERS.map((tier) => (
                        <button
                          key={tier.value}
                          onClick={() => {
                            const newTiers = currentFilters.popularityTier.includes(tier.value)
                              ? currentFilters.popularityTier.filter(t => t !== tier.value)
                              : [...currentFilters.popularityTier, tier.value];
                            const newFilters = { ...currentFilters, popularityTier: newTiers };
                            handleFiltersChange(newFilters);
                          }}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-all border",
                            currentFilters.popularityTier.includes(tier.value)
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-card/50 border-card text-foreground hover:bg-card"
                          )}
                        >
                          <div className="font-medium text-sm">{tier.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Moods */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Moods
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {FILTER_OPTIONS.MOODS.map((mood) => (
                        <Badge
                          key={mood}
                          variant={currentFilters.moods.includes(mood) ? "default" : "secondary"}
                          className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                          onClick={() => toggleArrayFilter('moods', mood)}
                        >
                          {mood}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Genres */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Genres
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {FILTER_OPTIONS.GENRES.map((genre) => (
                        <Badge
                          key={genre}
                          variant={currentFilters.genres.includes(genre) ? "default" : "secondary"}
                          className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                          onClick={() => toggleArrayFilter('genres', genre)}
                        >
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Scenes */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Scenes
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {FILTER_OPTIONS.SCENES.map((scene) => (
                        <Badge
                          key={scene}
                          variant={currentFilters.scenes.includes(scene) ? "default" : "secondary"}
                          className="cursor-pointer hover:bg-primary/20 transition-colors text-xs"
                          onClick={() => toggleArrayFilter('scenes', scene)}
                        >
                          {scene}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 focus-ring"
              onClick={handleSearch}
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {currentFilters.popularityTier.map((tier) => {
            const tierInfo = FILTER_OPTIONS.POPULARITY_TIERS.find(t => t.value === tier);
            return (
              <Badge key={tier} variant="secondary" className="text-xs">
                {tierInfo?.label || tier}
                <button
                  onClick={() => {
                    const newTiers = currentFilters.popularityTier.filter(t => t !== tier);
                    const newFilters = { ...currentFilters, popularityTier: newTiers };
                    handleFiltersChange(newFilters);
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            );
          })}
          {currentFilters.moods.map((mood) => (
            <Badge key={mood} variant="secondary" className="text-xs">
              {mood}
              <button
                onClick={() => toggleArrayFilter('moods', mood)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
          {currentFilters.genres.map((genre) => (
            <Badge key={genre} variant="secondary" className="text-xs">
              {genre}
              <button
                onClick={() => toggleArrayFilter('genres', genre)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
          {currentFilters.scenes.map((scene) => (
            <Badge key={scene} variant="secondary" className="text-xs">
              {scene}
              <button
                onClick={() => toggleArrayFilter('scenes', scene)}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
          {currentFilters.duration && (
            <Badge variant="secondary" className="text-xs">
              {currentFilters.duration}
              <button
                onClick={() => {
                  const newFilters = { ...currentFilters, duration: '' as any };
                  handleFiltersChange(newFilters);
                }}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
      
      {/* Search Results Dropdown */}
      {showResults && isResultsOpen && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-hidden shadow-lg border">
          <CardContent className="p-0">
            <ScrollArea className="h-full max-h-96">
              {isLoading ? (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                  <SearchResultSkeleton />
                </div>
              ) : error ? (
                <div className="p-4 text-center">
                  <div className="text-sm text-destructive mb-2">Search Error</div>
                  <div className="text-xs text-muted-foreground">{error}</div>
                </div>
              ) : displayResults?.tracks.length ? (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {displayResults.total} results found
                    </span>
                    {displayResults.tracks.length < displayResults.total && (
                      <button
                        onClick={() => {
                          setIsResultsOpen(false);
                          navigate(`/search?q=${encodeURIComponent(currentValue)}`);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        View all results
                      </button>
                    )}
                  </div>
                  
                  {displayResults.tracks.map((track) => (
                    <SearchResultItem
                      key={track.id}
                      track={track}
                      onPlay={handleTrackPlay}
                      onSelect={handleTrackSelect}
                      isPlaying={currentTrack?.id === track.id}
                    />
                  ))}
                </div>
              ) : currentValue.trim() ? (
                <div className="p-4 text-center">
                  <div className="text-sm text-muted-foreground mb-2">No results found</div>
                  <div className="text-xs text-muted-foreground">
                    Try adjusting your search terms or filters
                  </div>
                </div>
              ) : recentSearches.length > 0 ? (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1 mb-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </button>
                  </div>
                  
                  {recentSearches.map((search) => (
                    <RecentSearchItem
                      key={search.id}
                      search={search}
                      onSelect={handleRecentSearchSelect}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <div className="text-sm text-muted-foreground">
                    Start typing to search tracks, artists, and more
                  </div>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
