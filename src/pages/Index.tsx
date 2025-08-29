import { useState } from "react";
import { Link } from "react-router-dom";
import { MusicPlayer } from "@/components/MusicPlayer";
import { DiscoveryShelf } from "@/components/DiscoveryShelf";
import { SearchBar } from "@/components/SearchBar";
import { TrackCard, Track } from "@/components/TrackCard";
import AudioPlayer from "@/components/AudioPlayer";
import UploadTrack from "@/components/UploadTrack";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useTracks, useTracksByTier } from "@/hooks/useTracks";
import { useAuth } from "@/hooks/useAuth";
import { 
  Upload, 
  TrendingUp, 
  Sparkles, 
  MapPin, 
  Clock,
  Heart,
  Users,
  Music,
  LogOut,
  LogIn
} from "lucide-react";

interface SearchFilters {
  moods: string[];
  genres: string[];
  scenes: string[];
  bpmRange: [number, number];
  duration: string;
  popularityTier: string[];
}


const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [volume, setVolume] = useState(75);
  const [searchValue, setSearchValue] = useState("");
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    moods: [],
    genres: [],
    scenes: [],
    bpmRange: [60, 180] as [number, number],
    duration: "",
    popularityTier: [],
  });

  // Fetch tracks with current filters
  const hasActiveFilters = searchValue || filters.moods.length || filters.genres.length || filters.scenes.length || filters.popularityTier.length;
  const { tracks: filteredTracks, loading: tracksLoading } = useTracks(hasActiveFilters ? filters : undefined);
  
  // Fetch tracks by tier for discovery shelves
  const { tracks: emergingTracks } = useTracksByTier('emerging');
  const { tracks: risingTracks } = useTracksByTier('rising');
  const { tracks: establishedTracks } = useTracksByTier('established');
  const { tracks: popularTracks } = useTracksByTier('popular');

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    toast({
      title: "Now Playing",
      description: `${track.title} by ${track.artist}`,
    });
  };

  const handleLike = (trackId: string) => {
    // This would update the backend
    toast({
      title: "Added to Favorites",
      description: "Track has been liked!",
    });
  };

  const handleAddToQueue = (trackId: string) => {
    // This would add to queue
    toast({
      title: "Added to Queue",
      description: "Track has been added to your queue!",
    });
  };

  const handleSearch = (query: string, searchFilters?: SearchFilters) => {
    setSearchValue(query);
    if (searchFilters) {
      setFilters(searchFilters);
    }
  };

  const handleUploadComplete = () => {
    setUploadSheetOpen(false);
    // Refresh tracks if needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Music className="h-12 w-12 animate-pulse mx-auto text-primary" />
          <p>Loading SoundScape...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-effect border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">IndieFlow</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Button variant="ghost" className="focus-ring">Discover</Button>
              <Button variant="ghost" className="focus-ring">Trending</Button>
              <Button variant="ghost" className="focus-ring">Scenes</Button>
              <Button variant="ghost" className="focus-ring">For Artists</Button>
            </nav>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Sheet open={uploadSheetOpen} onOpenChange={setUploadSheetOpen}>
                    <SheetTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="gap-2 focus-ring border-primary/20 hover:bg-primary/10"
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>Upload Your Track</SheetTitle>
                        <SheetDescription>
                          Share your music with the SoundScape community
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <UploadTrack onUploadComplete={handleUploadComplete} />
                      </div>
                    </SheetContent>
                  </Sheet>
                  <Button 
                    variant="ghost" 
                    onClick={signOut}
                    className="focus-ring"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" className="gap-2 focus-ring border-primary/20 hover:bg-primary/10">
                    <Link to="/auth">
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild className="focus-ring gradient-primary text-white border-0">
                    <Link to="/auth">Join Community</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 pb-32 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6 py-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary">
            <Sparkles className="w-4 h-4" />
            Discover Fresh Independent Music
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Where <span className="gradient-primary bg-clip-text text-transparent">Indie Artists</span><br />
            Get <span className="gradient-warm bg-clip-text text-transparent">Discovered</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A fair, transparent platform that guarantees every artist exposure without pay-to-play. 
            Discover your next favorite song through algorithmic fairness and community curation.
          </p>
          
          {/* Search */}
          <div className="max-w-2xl mx-auto pt-6">
            <SearchBar
              value={searchValue}
              onChange={setSearchValue}
              filters={filters}
              onFiltersChange={setFilters}
              onSearch={handleSearch}
              placeholder="Find your next favorite track..."
            />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Music, label: "New Tracks Today", value: "247", color: "text-primary" },
            { icon: Users, label: "Active Artists", value: "1.2K", color: "text-accent" },
            { icon: Heart, label: "Community Likes", value: "45K", color: "text-pink-500" },
            { icon: TrendingUp, label: "Fair Discoveries", value: "100%", color: "text-green-500" }
          ].map((stat, index) => (
            <Card key={index} className="p-4 text-center border-border/50 hover:border-primary/30 transition-colors">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Card>
          ))}
        </section>

        {/* Discovery Shelves - Show filtered results or tier-based discovery */}
        <div className="space-y-8">
          {hasActiveFilters ? (
            // Show filtered results
            <div className="space-y-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Search Results
              </h2>
              {tracksLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading tracks...</div>
              ) : filteredTracks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredTracks.slice(0, 20).map((track) => (
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
                <div className="text-center py-8 text-muted-foreground">
                  No tracks found matching your criteria
                </div>
              )}
            </div>
          ) : (
            // Show discovery shelves by tier
            <>
              <DiscoveryShelf
                title="🌱 Support Emerging Artists"
                description="Discover new talent with under 100 listeners"
                tracks={emergingTracks.slice(0, 8)}
                onPlay={handlePlay}
                onLike={handleLike}
                onAddToQueue={handleAddToQueue}
              />
              
              <DiscoveryShelf
                title="📈 Rising Stars"
                description="Growing artists worth following (100-999 listeners)"
                tracks={risingTracks.slice(0, 8)}
                onPlay={handlePlay}
                onLike={handleLike}
                onAddToQueue={handleAddToQueue}
              />
              
              <DiscoveryShelf
                title="🎯 Established Favorites"
                description="Proven quality with growing following (1K-9K listeners)"
                tracks={establishedTracks.slice(0, 8)}
                onPlay={handlePlay}
                onLike={handleLike}
                onAddToQueue={handleAddToQueue}
              />
              
              <DiscoveryShelf
                title="🔥 Popular Hits"
                description="Indie favorites loved by thousands (10K+ listeners)"
                tracks={popularTracks.slice(0, 8)}
                onPlay={handlePlay}
                onLike={handleLike}
                onAddToQueue={handleAddToQueue}
              />
            </>
          )}
        </div>

        {/* Scene Highlights */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Trending Scenes</h2>
            <Button variant="ghost" className="focus-ring">View All</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Brooklyn Indie", count: "127 artists", trend: "+12%" },
              { name: "Berlin Electronic", count: "89 artists", trend: "+8%" },
              { name: "Nashville Folk", count: "156 artists", trend: "+15%" }
            ].map((scene) => (
              <Card key={scene.name} className="p-6 border-border/50 hover:border-primary/30 transition-all duration-300 group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    {scene.trend}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {scene.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{scene.count}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Call to Action for Artists */}
        <section className="relative overflow-hidden">
          <Card className="p-8 md:p-12 border-primary/20 bg-gradient-subtle">
            <div className="relative z-10 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Ready to Get <span className="gradient-primary bg-clip-text text-transparent">Discovered</span>?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload your music and get guaranteed exposure to listeners who match your style. 
                No pay-to-play, no reduced royalties, just fair algorithmic discovery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button size="lg" className="gradient-primary text-white border-0 focus-ring">
                  Start Uploading
                </Button>
                <Button variant="outline" size="lg" className="focus-ring border-primary/20">
                  Learn More
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>

      {/* Music Player */}
      {currentTrack && (
        <MusicPlayer
          currentTrack={{
            id: currentTrack.id,
            title: currentTrack.title,
            artist: currentTrack.artist,
            coverUrl: currentTrack.coverUrl,
            duration: 204 // TODO: Get actual duration from track
          }}
          isPlaying={isPlaying}
          currentTime={currentTime}
          volume={volume}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onNext={() => console.log("Next track")}
          onPrevious={() => console.log("Previous track")}
          onSeek={(time) => setCurrentTime(time)}
          onVolumeChange={(vol) => setVolume(vol)}
          onToggleLike={() => handleLike(currentTrack.id)}
          onShowQueue={() => console.log("Show queue")}
        />
      )}

      {/* New Audio Player */}
      <AudioPlayer 
        track={currentTrack}
        onPlay={handlePlay}
      />
    </div>
  );
};

export default Index;