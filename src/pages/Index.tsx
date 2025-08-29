import { useState } from "react";
import { MusicPlayer } from "@/components/MusicPlayer";
import { DiscoveryShelf } from "@/components/DiscoveryShelf";
import { SearchBar } from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  TrendingUp, 
  Sparkles, 
  MapPin, 
  Clock,
  Heart,
  Users,
  Music
} from "lucide-react";
import sampleCover1 from "@/assets/sample-cover-1.jpg";
import sampleCover2 from "@/assets/sample-cover-2.jpg";
import sampleCover3 from "@/assets/sample-cover-3.jpg";

// Sample data - this would come from your backend
const SAMPLE_TRACKS = [
  {
    id: "1",
    title: "Neon Dreams",
    artist: "Cosmic Wanderer",
    duration: "3:24",
    coverUrl: sampleCover1,
    tags: ["Electronic", "Dreamy", "Chill"],
    isLiked: true
  },
  {
    id: "2",
    title: "Mountain Folk",
    artist: "River Valley",
    duration: "4:12",
    coverUrl: sampleCover2,
    tags: ["Folk", "Acoustic", "Peaceful"],
    isLiked: false
  },
  {
    id: "3",
    title: "Urban Pulse",
    artist: "Street Lights",
    duration: "2:58",
    coverUrl: sampleCover3,
    tags: ["Indie Rock", "Energetic", "Urban"],
    isLiked: false
  },
  {
    id: "4",
    title: "Midnight Thoughts",
    artist: "Luna Echo",
    duration: "5:31",
    coverUrl: sampleCover1,
    tags: ["Ambient", "Dark", "Melancholic"],
    isLiked: true
  },
  {
    id: "5",
    title: "Coffee Shop Jazz",
    artist: "The Warm Collective",
    duration: "3:45",
    coverUrl: sampleCover2,
    tags: ["Jazz", "Lo-Fi", "Chill"],
    isLiked: false
  }
];

const FRESH_TRACKS = SAMPLE_TRACKS.slice(0, 3);
const MOOD_TRACKS = SAMPLE_TRACKS.slice(1, 4);
const SURPRISE_TRACKS = SAMPLE_TRACKS.slice(2, 5);

interface SearchFilters {
  moods: string[];
  genres: string[];
  bpmRange: [number, number];
  duration: 'any' | 'short' | 'medium' | 'long';
  scenes: string[];
}

const Index = () => {
  const [currentTrack, setCurrentTrack] = useState({
    ...SAMPLE_TRACKS[0],
    duration: 204 // 3:24 in seconds
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [volume, setVolume] = useState(75);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    moods: [],
    genres: [],
    bpmRange: [60, 180],
    duration: 'any',
    scenes: []
  });

  const handleTrackPlay = (trackId: string) => {
    const track = SAMPLE_TRACKS.find(t => t.id === trackId);
    if (track) {
      // Convert duration string to seconds for player
      const durationParts = track.duration.split(':');
      const durationInSeconds = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);
      
      setCurrentTrack({
        ...track,
        duration: durationInSeconds
      });
      setIsPlaying(true);
    }
  };

  const handleTrackLike = (trackId: string) => {
    // This would update the backend
    console.log("Liked track:", trackId);
  };

  const handleTrackQueue = (trackId: string) => {
    // This would add to queue
    console.log("Added to queue:", trackId);
  };

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
              <Button 
                variant="outline" 
                className="gap-2 focus-ring border-primary/20 hover:bg-primary/10"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Button className="focus-ring gradient-primary text-white border-0">
                Join Community
              </Button>
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
              value={searchQuery}
              onChange={setSearchQuery}
              filters={searchFilters}
              onFiltersChange={setSearchFilters}
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

        {/* Discovery Shelves */}
        <DiscoveryShelf
          title="Fresh Finds"
          description="New releases guaranteed fair exposure"
          tracks={FRESH_TRACKS}
          currentPlayingId={isPlaying ? currentTrack.id : undefined}
          onTrackPlay={handleTrackPlay}
          onTrackLike={handleTrackLike}
          onTrackQueue={handleTrackQueue}
        />

        <DiscoveryShelf
          title="Mood: Chill Vibes"
          description="Perfect for your evening unwind"
          tracks={MOOD_TRACKS}
          currentPlayingId={isPlaying ? currentTrack.id : undefined}
          onTrackPlay={handleTrackPlay}
          onTrackLike={handleTrackLike}
          onTrackQueue={handleTrackQueue}
        />

        <DiscoveryShelf
          title="Surprise Me"
          description="Algorithmic serendipity from emerging scenes"
          tracks={SURPRISE_TRACKS}
          currentPlayingId={isPlaying ? currentTrack.id : undefined}
          onTrackPlay={handleTrackPlay}
          onTrackLike={handleTrackLike}
          onTrackQueue={handleTrackQueue}
        />

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
      <MusicPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        volume={volume}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={() => console.log("Next track")}
        onPrevious={() => console.log("Previous track")}
        onSeek={(time) => setCurrentTime(time)}
        onVolumeChange={(vol) => setVolume(vol)}
        onToggleLike={() => console.log("Toggle like")}
        onShowQueue={() => console.log("Show queue")}
      />
    </div>
  );
};

export default Index;