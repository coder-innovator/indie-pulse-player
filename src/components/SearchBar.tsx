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
  scenes: string[];
  bpmRange: [number, number];
  duration: string;
  popularityTier: string[];
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
  'Underground', 'Local', 'Experimental', 'Bedroom Pop', 'Lo-fi', 'DIY'
];

const POPULARITY_TIER_OPTIONS = [
  { value: "emerging", label: "🌱 Emerging (0-99 listeners)", description: "Support new artists" },
  { value: "rising", label: "📈 Rising (100-999 listeners)", description: "Rising talent" },
  { value: "established", label: "🎯 Established (1K-9K listeners)", description: "Growing following" },
  { value: "popular", label: "🔥 Popular (10K+ listeners)", description: "Proven hits" }
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
  
  const [localFilters, setLocalFilters] = useState<SearchFilters>({
    moods: [],
    genres: [],
    scenes: [],
    bpmRange: [60, 180],
    duration: "",
    popularityTier: [],
  });

  // Use filters prop or local state
  const currentFilters = filters || localFilters;
  const setCurrentFilters = onFiltersChange || setLocalFilters;

  const clearAllFilters = () => {
    const clearedFilters = {
      moods: [],
      genres: [],
      scenes: [],
      bpmRange: [60, 180] as [number, number],
      duration: "",
      popularityTier: [],
    };
    setLocalFilters(clearedFilters);
    onFiltersChange?.(clearedFilters);
  };

  const activeFilterCount = currentFilters.moods.length + 
    currentFilters.genres.length + 
    currentFilters.scenes.length + 
    currentFilters.popularityTier.length +
    (currentFilters.duration ? 1 : 0);

  const handleSearch = () => {
    onSearch?.(value, currentFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleArrayFilter = (
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
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
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
                      {POPULARITY_TIER_OPTIONS.map((tier) => (
                        <button
                          key={tier.value}
                          onClick={() => {
                            const newTiers = currentFilters.popularityTier.includes(tier.value)
                              ? currentFilters.popularityTier.filter(t => t !== tier.value)
                              : [...currentFilters.popularityTier, tier.value];
                            const newFilters = { ...currentFilters, popularityTier: newTiers };
                            setLocalFilters(newFilters);
                            onFiltersChange?.(newFilters);
                          }}
                          className={cn(
                            "w-full p-3 rounded-lg text-left transition-all border",
                            currentFilters.popularityTier.includes(tier.value)
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-card/50 border-card text-foreground hover:bg-card"
                          )}
                        >
                          <div className="font-medium text-sm">{tier.label}</div>
                          <div className="text-xs opacity-70">{tier.description}</div>
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
                      {MOOD_OPTIONS.map((mood) => (
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
                      {GENRE_OPTIONS.map((genre) => (
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
                      {SCENE_OPTIONS.map((scene) => (
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
            const tierInfo = POPULARITY_TIER_OPTIONS.find(t => t.value === tier);
            return (
              <Badge key={tier} variant="secondary" className="text-xs">
                {tierInfo?.label || tier}
                <button
                  onClick={() => {
                    const newTiers = currentFilters.popularityTier.filter(t => t !== tier);
                    const newFilters = { ...currentFilters, popularityTier: newTiers };
                    setLocalFilters(newFilters);
                    onFiltersChange?.(newFilters);
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
                  const newFilters = { ...currentFilters, duration: "" };
                  setLocalFilters(newFilters);
                  onFiltersChange?.(newFilters);
                }}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}