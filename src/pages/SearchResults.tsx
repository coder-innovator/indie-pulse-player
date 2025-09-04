import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { TrackCard, Track } from "@/components/TrackCard";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTracks } from "@/hooks/useTracks";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Filter, 
  Music, 
  Clock,
  TrendingUp,
  Users
} from "lucide-react";

interface SearchFilters {
  moods: string[];
  genres: string[];
  scenes: string[];
  bpmRange: [number, number];
  duration: string;
  popularityTier: string[];
}

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    moods: [],
    genres: [],
    scenes: [],
    bpmRange: [60, 180] as [number, number],
    duration: "",
    popularityTier: [],
  });

  const query = searchParams.get('q') || '';
  
  // Fetch tracks with current filters
  const hasActiveFilters = query || filters.moods.length || filters.genres.length || filters.scenes.length || filters.popularityTier.length;
  const { tracks, loading, error } = useTracks(hasActiveFilters ? filters : undefined);

  const handlePlay = (track: Track) => {
    toast({
      title: "Now Playing",
      description: `${track.title} by ${track.artist}`,
    });
  };

  const handleLike = (trackId: string) => {
    toast({
      title: "Added to Favorites",
      description: "Track has been liked!",
    });
  };

  const handleAddToQueue = (trackId: string) => {
    toast({
      title: "Added to Queue",
      description: "Track has been added to your queue!",
    });
  };

  const handleSearch = (query: string, searchFilters?: SearchFilters) => {
    if (searchFilters) {
      setFilters(searchFilters);
    }
  };

  const getFilterCount = () => {
    return filters.moods.length + filters.genres.length + filters.scenes.length + filters.popularityTier.length;
  };

  const clearFilters = () => {
    setFilters({
      moods: [],
      genres: [],
      scenes: [],
      bpmRange: [60, 180],
      duration: "",
      popularityTier: [],
    });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Results</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {query ? `Search Results for "${query}"` : 'Browse Music'}
        </h1>
        <p className="text-muted-foreground">
          {loading ? 'Loading...' : `${tracks.length} tracks found`}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <SearchBar value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />
        
        {/* Active Filters Display */}
        {getFilterCount() > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {filters.moods.map(mood => (
              <Badge key={mood} variant="secondary" className="gap-1">
                <Music className="w-3 h-3" />
                {mood}
              </Badge>
            ))}
            {filters.genres.map(genre => (
              <Badge key={genre} variant="secondary" className="gap-1">
                <Music className="w-3 h-3" />
                {genre}
              </Badge>
            ))}
            {filters.scenes.map(scene => (
              <Badge key={scene} variant="secondary" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                {scene}
              </Badge>
            ))}
            {filters.popularityTier.map(tier => (
              <Badge key={tier} variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {tier}
              </Badge>
            ))}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="aspect-square bg-muted rounded-lg mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </Card>
          ))}
        </div>
      ) : tracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              onPlay={handlePlay}
              onLike={handleLike}
              onAddToQueue={handleAddToQueue}
            />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tracks found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search terms or filters
          </p>
          <Button onClick={clearFilters}>Clear Filters</Button>
        </Card>
      )}
    </div>
  );
};

export default SearchResults;
