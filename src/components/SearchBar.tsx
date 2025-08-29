import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  X, 
  Music, 
  User, 
  Hash,
  Sliders 
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface SearchFilters {
  moods: string[];
  genres: string[];
  bpmRange: [number, number];
  duration: 'any' | 'short' | 'medium' | 'long';
  scenes: string[];
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  filters?: SearchFilters;
  onFiltersChange?: (filters: SearchFilters) => void;
  onSearch?: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  className?: string;
}

const MOOD_OPTIONS = [
  'Chill', 'Energetic', 'Melancholic', 'Uplifting', 'Dark', 'Dreamy', 
  'Aggressive', 'Peaceful', 'Nostalgic', 'Euphoric'
];

const GENRE_OPTIONS = [
  'Electronic', 'Indie Rock', 'Folk', 'Hip Hop', 'Jazz', 'Classical',
  'Ambient', 'Post Rock', 'Lo-Fi', 'Experimental'
];

const SCENE_OPTIONS = [
  'Brooklyn', 'Berlin', 'London', 'LA', 'Nashville', 'Montreal',
  'Portland', 'Austin', 'Melbourne', 'São Paulo'
];

export function SearchBar({
  value,
  onChange,
  filters,
  onFiltersChange,
  onSearch,
  placeholder = "Search tracks, artists, or tags...",
  className
}: SearchBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'tracks' | 'artists' | 'tags'>('all');

  const hasActiveFilters = filters && (
    filters.moods.length > 0 ||
    filters.genres.length > 0 ||
    filters.scenes.length > 0 ||
    filters.duration !== 'any' ||
    filters.bpmRange[0] > 60 || filters.bpmRange[1] < 180
  );

  const handleSearch = () => {
    onSearch?.(value, filters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearFilters = () => {
    onFiltersChange?.({
      moods: [],
      genres: [],
      bpmRange: [60, 180],
      duration: 'any',
      scenes: []
    });
  };

  const toggleArrayFilter = (
    filterKey: 'moods' | 'genres' | 'scenes',
    value: string
  ) => {
    if (!filters || !onFiltersChange) return;
    
    const currentArray = filters[filterKey];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    onFiltersChange({
      ...filters,
      [filterKey]: newArray
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
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
            onClick={() => setSearchType(key as any)}
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="pl-10 pr-20 h-11 bg-secondary/50 border-border focus:bg-background transition-colors focus-ring"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-8 h-8 focus-ring",
                    hasActiveFilters && "text-primary hover:text-primary"
                  )}
                  aria-label="Open filters"
                >
                  <Filter className="w-4 h-4" />
                  {hasActiveFilters && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Filters</h3>
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-7 px-2 text-xs"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Moods */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Moods
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {MOOD_OPTIONS.map((mood) => (
                        <Badge
                          key={mood}
                          variant={filters?.moods.includes(mood) ? "default" : "secondary"}
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
                      {GENRE_OPTIONS.map((genre) => (
                        <Badge
                          key={genre}
                          variant={filters?.genres.includes(genre) ? "default" : "secondary"}
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
                      {SCENE_OPTIONS.map((scene) => (
                        <Badge
                          key={scene}
                          variant={filters?.scenes.includes(scene) ? "default" : "secondary"}
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
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          
          {filters?.moods.map((mood) => (
            <Badge key={mood} variant="secondary" className="text-xs">
              {mood}
              <Button
                variant="ghost"
                size="icon"
                className="w-3 h-3 ml-1 p-0 hover:bg-transparent"
                onClick={() => toggleArrayFilter('moods', mood)}
              >
                <X className="w-2 h-2" />
              </Button>
            </Badge>
          ))}
          
          {filters?.genres.map((genre) => (
            <Badge key={genre} variant="secondary" className="text-xs">
              {genre}
              <Button
                variant="ghost"
                size="icon"
                className="w-3 h-3 ml-1 p-0 hover:bg-transparent"
                onClick={() => toggleArrayFilter('genres', genre)}
              >
                <X className="w-2 h-2" />
              </Button>
            </Badge>
          ))}
          
          {filters?.scenes.map((scene) => (
            <Badge key={scene} variant="secondary" className="text-xs">
              {scene}
              <Button
                variant="ghost"
                size="icon"
                className="w-3 h-3 ml-1 p-0 hover:bg-transparent"
                onClick={() => toggleArrayFilter('scenes', scene)}
              >
                <X className="w-2 h-2" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}