import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, X, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/hooks/useSearch';
import { Badge } from '@/components/ui/badge';

interface EnhancedSearchBarProps {
  className?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  showFilters?: boolean;
  autoFocus?: boolean;
}

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  className,
  placeholder = "Search tracks, artists, albums...",
  value: externalValue,
  onValueChange,
  showFilters = true,
  autoFocus = false,
}) => {
  const [localValue, setLocalValue] = useState(externalValue || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    results,
    loading,
    search,
    query,
    recentSearches,
    filters,
    updateFilters,
    clearRecentSearches,
  } = useSearch();

  const handleSearch = useCallback((term: string) => {
    search(term);
    onValueChange?.(term);
  }, [search, onValueChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    if (newValue.length > 2) {
      handleSearch(newValue);
    }
  }, [handleSearch]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    setIsExpanded(false);
    onValueChange?.('');
  }, [onValueChange]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* Main Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={localValue}
          onChange={handleInputChange}
          onFocus={() => setIsExpanded(true)}
          className={cn(
            "pl-10 pr-20 h-12 text-base bg-glass border-glass backdrop-blur-md",
            "transition-all duration-300 ease-in-out",
            isExpanded && "ring-2 ring-primary/20 border-primary/30"
          )}
        />
        
        {/* Right side buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {localValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          
          {showFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-white/10"
            >
              <Filter className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-glass border border-glass rounded-lg backdrop-blur-md">
          <div className="text-sm text-muted-foreground">Searching...</div>
        </div>
      )}

      {/* Search Results Dropdown */}
      {isExpanded && localValue.length > 2 && results.tracks.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-glass border border-glass rounded-lg backdrop-blur-md shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-sm font-medium text-foreground mb-2">
              Tracks ({results.tracks.length})
            </div>
            {results.tracks.slice(0, 5).map((track: any) => (
              <div
                key={track.id}
                className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer"
                onClick={() => {
                  setLocalValue(track.title);
                  setIsExpanded(false);
                  handleSearch(track.title);
                }}
              >
                <div className="w-8 h-8 bg-secondary rounded flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{track.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {track.artist?.name || track.artist}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Searches */}
      {isExpanded && !localValue && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-glass border border-glass rounded-lg backdrop-blur-md shadow-xl z-50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Searches
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
            {recentSearches.slice(0, 5).map((searchTerm: string, index: number) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 hover:bg-white/10 rounded cursor-pointer"
                onClick={() => {
                  setLocalValue(searchTerm);
                  handleSearch(searchTerm);
                  setIsExpanded(false);
                }}
              >
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">{searchTerm}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters */}
      {(filters.moods.length > 0 || filters.genres.length > 0 || filters.scenes.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-2">
          {filters.moods.map((mood) => (
            <Badge key={mood} variant="secondary" className="text-xs">
              {mood}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 w-4 h-4"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    moods: filters.moods.filter(m => m !== mood)
                  };
                  updateFilters(newFilters);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          
          {filters.genres.map((genre) => (
            <Badge key={genre} variant="secondary" className="text-xs">
              {genre}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-auto p-0 w-4 h-4"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    genres: filters.genres.filter(g => g !== genre)
                  };
                  updateFilters(newFilters);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};