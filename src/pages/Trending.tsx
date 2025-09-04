import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Filter, 
  Search, 
  Clock, 
  Heart, 
  Star, 
  Zap, 
  Globe, 
  Calendar, 
  BarChart3, 
  Target, 
  Upload, 
  RefreshCw,
  Play,
  Music,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRealTimeTracks } from "@/hooks/useRealTimeTracks";
import { useRealTimeUploads } from "@/hooks/useRealTimeUploads";
import { TrackCard, Track } from "@/components/TrackCard";
import { MagicalCard, GlassCard, GlowCard } from "@/components/MagicalCard";
import { MagicalLoader } from "@/components/MagicalLoader";
import { MagicButton } from "@/components/MagicalButton";
import { MagicalBackground } from "@/components/MagicalBackground";

interface TrendingFilters {
  timeRange: string;
  popularityTier: string[];
  genre: string[];
  mood: string[];
  scene: string[];
  bpmRange: [number, number];
  listenerRange: [number, number];
  engagementRange: [number, number];
  sortBy: string;
  searchQuery: string;
}

const TIME_RANGES = [
  { value: '24h', label: 'Last 24 Hours', icon: Clock },
  { value: '7d', label: 'This Week', icon: Calendar },
  { value: '30d', label: 'This Month', icon: Calendar },
  { value: '90d', label: 'Last 3 Months', icon: Calendar },
  { value: '1y', label: 'This Year', icon: Calendar },
];

const SORT_OPTIONS = [
  { value: 'listeners', label: 'Most Listeners', icon: Users },
  { value: 'plays', label: 'Most Plays', icon: Play },
  { value: 'growth', label: 'Fastest Growing', icon: TrendingUp },
  { value: 'engagement', label: 'Highest Engagement', icon: Heart },
  { value: 'recent', label: 'Recently Added', icon: Calendar },
];

const GENRE_OPTIONS = [
  'Electronic', 'Indie Rock', 'Hip Hop', 'Pop', 'R&B', 'Jazz', 'Classical',
  'Country', 'Folk', 'Reggae', 'Metal', 'Punk', 'Blues', 'Soul', 'Funk',
  'Disco', 'House', 'Techno', 'Ambient', 'Experimental', 'Lo-Fi', 'Trap'
];

const MOOD_OPTIONS = [
  'Energetic', 'Chill', 'Happy', 'Sad', 'Dark', 'Uplifting', 'Melancholic',
  'Aggressive', 'Peaceful', 'Nostalgic', 'Euphoric', 'Mysterious', 'Romantic',
  'Adventurous', 'Relaxed', 'Intense', 'Dreamy', 'Confident', 'Vulnerable'
];

const SCENE_OPTIONS = [
  'Underground', 'Mainstream', 'Local', 'International', 'College', 'Club',
  'Festival', 'Bedroom', 'Studio', 'Live', 'DIY', 'Independent', 'Major Label',
  'Alternative', 'Avant-garde', 'Traditional', 'Fusion', 'Crossover'
];

export default function Trending() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('tracks');
  const [filters, setFilters] = useState<TrendingFilters>({
    timeRange: '7d',
    popularityTier: [],
    genre: [],
    mood: [],
    scene: [],
    bpmRange: [60, 180],
    listenerRange: [0, 100000],
    engagementRange: [0, 100],
    sortBy: 'listeners',
    searchQuery: '',
  });

  // Use real-time hooks for data
  const { tracks: trendingTracks, loading, error, recordPlay, refreshData } = useRealTimeTracks(filters);
  const { recentUploads } = useRealTimeUploads();

  // Filter handling functions
  const handleFilterChange = <K extends keyof TrendingFilters>(key: K, value: TrendingFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  };

  const clearFilters = () => {
    setFilters({
      timeRange: '7d',
      popularityTier: [],
      genre: [],
      mood: [],
      scene: [],
      bpmRange: [60, 180],
      listenerRange: [0, 100000],
      engagementRange: [0, 100],
      sortBy: 'listeners',
      searchQuery: '',
    });
  };

  const applyFilters = () => {
    refreshData();
  };

  // Filter tracks based on search query and other filters
  const filteredTracks = trendingTracks.filter(track => {
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      if (!track.title.toLowerCase().includes(query) && 
          !track.artist.toLowerCase().includes(query) &&
          !track.genre.toLowerCase().includes(query)) {
        return false;
      }
    }

    if (filters.genre.length > 0 && !filters.genre.includes(track.genre)) {
      return false;
    }

    if (filters.mood.length > 0 && !filters.mood.includes(track.mood)) {
      return false;
    }

    if (filters.scene.length > 0 && !filters.scene.includes(track.scene)) {
      return false;
    }

    if (track.engagementRate < filters.engagementRange[0] || 
        track.engagementRate > filters.engagementRange[1]) {
      return false;
    }

    return true;
  });

  const handlePlay = async (track?: Track) => {
    if (track) {
      try {
        await recordPlay(track.id, 30);
        // Optional: Show success feedback
        // toast({
        //   title: "Now Playing",
        //   description: `${track.title} by ${track.artist}`,
        // });
      } catch (error) {
        console.error('Failed to record play:', error);
        // Show user-friendly error message
        // toast({
        //   title: "Playback Error",
        //   description: "Unable to record play data. Please try again.",
        //   variant: "destructive"
        // });
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <MagicalLoader size="lg" variant="liquid" />
          <p className="loading-text">Loading trending content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-background relative overflow-hidden">
      {/* Magical Background */}
      <MagicalBackground particleCount={20} className="opacity-30" />
      
      {/* Header */}
      <header className="enhanced-header backdrop-blur-md bg-surface-primary/80">
        <div className="responsive-container py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-xl font-bold text-primary hover:text-primary/80 hover:scale-105 transition-all duration-200"
            >
              SoundScape
            </Button>
            <div className="flex items-center gap-4">
              {user ? (
                <Button variant="outline" onClick={() => navigate('/auth')} className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary">
                  {user.email}
                </Button>
              ) : (
                <MagicButton onClick={() => navigate('/auth')}>
                  Sign In
                </MagicButton>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="enhanced-hero">
        <div className="responsive-container text-center max-w-4xl mx-auto space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-full border border-primary/30">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h1 className="enhanced-hero-title text-gradient tracking-tight">
                Trending Now
              </h1>
            </div>
            <p className="enhanced-hero-subtitle text-muted-foreground">
              Discover the hottest tracks, rising artists, and emerging scenes taking the world by storm
            </p>
          </div>
        </div>
      </section>

      {/* Enhanced Filters Section */}
      <section className="responsive-container responsive-section">
        <div className="filter-section">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                <Filter className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Advanced Filters</h2>
                <p className="text-muted-foreground text-sm">Refine your music discovery</p>
              </div>
              <Badge variant="secondary" className="badge-primary">
                {filteredTracks.length} results
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={clearFilters} className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary">
                Clear All
              </Button>
              <MagicButton onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? 'Hide' : 'Show'} Filters
              </MagicButton>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            {TIME_RANGES.map((timeRange) => (
              <Button
                key={timeRange.value}
                variant={filters.timeRange === timeRange.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange('timeRange', timeRange.value)}
                className={`gap-2 hover-lift transition-all duration-200 ${
                  filters.timeRange === timeRange.value 
                    ? 'bg-primary hover:bg-primary/90' 
                    : 'border-border-medium text-foreground hover:bg-surface-secondary'
                }`}
              >
                <timeRange.icon className="w-4 h-4" />
                {timeRange.label}
              </Button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <GlassCard className="filter-section animate-slide-up">
              <div className="filter-grid">
              {/* Search */}
              <div className="filter-item">
                <Label className="form-label">Search</Label>
                <Input
                  placeholder="Search tracks..."
                  value={filters.searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Sort By */}
              <div className="filter-item">
                <Label className="form-label">Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger className="enhanced-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="enhanced-select-content">
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="enhanced-select-item">
                        <div className="flex items-center gap-2">
                          <option.icon className="w-4 h-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Popularity Tier */}
              <div className="filter-item">
                <Label className="form-label">Popularity Tier</Label>
                <div className="space-y-3">
                  {['emerging', 'rising', 'established', 'popular'].map((tier) => (
                    <div key={tier} className="flex items-center space-x-3">
                      <Checkbox
                        id={tier}
                        checked={filters.popularityTier.includes(tier)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleFilterChange('popularityTier', [...filters.popularityTier, tier]);
                          } else {
                            handleFilterChange('popularityTier', filters.popularityTier.filter(t => t !== tier));
                          }
                        }}
                        className="enhanced-checkbox"
                      />
                      <Label htmlFor={tier} className="text-sm text-muted-foreground font-medium capitalize cursor-pointer">{tier}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* BPM Range */}
              <div className="filter-item">
                <Label className="form-label">BPM Range: {filters.bpmRange[0]} - {filters.bpmRange[1]}</Label>
                <Slider
                  value={filters.bpmRange}
                  onValueChange={(value) => handleFilterChange('bpmRange', value as [number, number])}
                  max={200}
                  min={60}
                  step={5}
                  className="enhanced-slider"
                />
              </div>

              {/* Listener Range */}
              <div className="filter-item">
                <Label className="form-label">Listener Range: {filters.listenerRange[0].toLocaleString()} - {filters.listenerRange[1].toLocaleString()}</Label>
                <Slider
                  value={filters.listenerRange}
                  onValueChange={(value) => handleFilterChange('listenerRange', value as [number, number])}
                  max={100000}
                  min={0}
                  step={1000}
                  className="enhanced-slider"
                />
              </div>

              {/* Engagement Range */}
              <div className="filter-item">
                <Label className="form-label">Engagement Rate: {filters.engagementRange[0]}% - {filters.engagementRange[1]}%</Label>
                <Slider
                  value={filters.engagementRange}
                  onValueChange={(value) => handleFilterChange('engagementRange', value as [number, number])}
                  max={100}
                  min={0}
                  step={5}
                  className="enhanced-slider"
                />
              </div>

              {/* Genre Filter */}
              <div className="filter-item">
                <Label className="form-label">Genre</Label>
                <Select 
                  value={filters.genre[0] || ''} 
                  onValueChange={(value) => handleFilterChange('genre', value ? [value] : [])}
                >
                  <SelectTrigger className="enhanced-select">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent className="enhanced-select-content">
                    <SelectItem value="" className="enhanced-select-item">All Genres</SelectItem>
                    {GENRE_OPTIONS.map((genre) => (
                      <SelectItem key={genre} value={genre} className="enhanced-select-item">{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mood Filter */}
              <div className="filter-item">
                <Label className="form-label">Mood</Label>
                <Select 
                  value={filters.mood[0] || ''} 
                  onValueChange={(value) => handleFilterChange('mood', value ? [value] : [])}
                >
                  <SelectTrigger className="enhanced-select">
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent className="enhanced-select-content">
                    <SelectItem value="" className="enhanced-select-item">All Moods</SelectItem>
                    {MOOD_OPTIONS.map((mood) => (
                      <SelectItem key={mood} value={mood} className="enhanced-select-item">{mood}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Scene Filter */}
              <div className="filter-item">
                <Label className="form-label">Scene</Label>
                <Select 
                  value={filters.scene[0] || ''} 
                  onValueChange={(value) => handleFilterChange('scene', value ? [value] : [])}
                >
                  <SelectTrigger className="enhanced-select">
                    <SelectValue placeholder="Select scene" />
                  </SelectTrigger>
                  <SelectContent className="enhanced-select-content">
                    <SelectItem value="" className="enhanced-select-item">All Scenes</SelectItem>
                    {SCENE_OPTIONS.map((scene) => (
                      <SelectItem key={scene} value={scene} className="enhanced-select-item">{scene}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </GlassCard>
          )}
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="responsive-container responsive-section">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="enhanced-tabs grid w-full grid-cols-3">
            <TabsTrigger value="tracks" className="enhanced-tab-trigger">
              <Music className="w-4 h-4" />
              Tracks ({filteredTracks.length})
            </TabsTrigger>
            <TabsTrigger value="artists" className="enhanced-tab-trigger">
              <Users className="w-4 h-4" />
              Artists
            </TabsTrigger>
            <TabsTrigger value="scenes" className="enhanced-tab-trigger">
              <Globe className="w-4 h-4" />
              Scenes
            </TabsTrigger>
          </TabsList>

          {/* Tracks Tab */}
          <TabsContent value="tracks" className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gradient mb-2">
                  {filters.searchQuery ? `Search Results for "${filters.searchQuery}"` : 'Trending Tracks'}
                </h2>
                <p className="text-muted-foreground text-lg">
                  {filters.searchQuery 
                    ? `Found ${filteredTracks.length} tracks matching your search`
                    : 'Discover the most popular tracks based on unique listeners and engagement'
                  }
                </p>
              </div>
              <Button onClick={refreshData} variant="outline" className="gap-2 hover-lift border-border-medium text-foreground hover:bg-surface-secondary">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            {/* Distribution Stats */}
            <div className="grid-stats">
              {[
                { label: 'Emerging', count: filteredTracks.filter(t => t.popularityTier === 'emerging').length, color: 'badge-emerging' },
                { label: 'Rising', count: filteredTracks.filter(t => t.popularityTier === 'rising').length, color: 'badge-rising' },
                { label: 'Established', count: filteredTracks.filter(t => t.popularityTier === 'established').length, color: 'badge-established' },
                { label: 'Popular', count: filteredTracks.filter(t => t.popularityTier === 'popular').length, color: 'badge-popular' },
              ].map((stat) => (
                <div key={stat.label} className="card-stats text-center hover-lift-glow">
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.count}</div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Tracks Grid */}
            {filteredTracks.length > 0 ? (
              <div className="grid-responsive">
                {filteredTracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    onPlay={handlePlay}
                    onLike={() => console.log('Like track:', track.id)}
                    onAddToQueue={() => console.log('Add to queue:', track.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center card-secondary">
                <Music className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-3">No tracks found</h3>
                <p className="text-muted-foreground text-lg">
                  Try adjusting your filters or search terms to find more music
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Artists Tab */}
          <TabsContent value="artists" className="space-y-8">
            <h2 className="text-3xl font-bold text-gradient">Trending Artists</h2>
            <div className="responsive-grid">
              {/* Mock artist data - would be replaced with real data */}
              {[
                { name: 'Luna Waves', followers: '1.2K', growth: '+45%', genre: 'Electronic' },
                { name: 'Echo Chamber', followers: '890', growth: '+67%', genre: 'Indie Rock' },
                { name: 'Neon Dreams', followers: '2.1K', growth: '+23%', genre: 'Pop' },
              ].map((artist) => (
                <div key={artist.name} className="card-artist hover-lift-glow">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                      <Music className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">{artist.name}</h3>
                      <p className="text-muted-foreground mb-3">{artist.genre}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <span className="text-muted-foreground">{artist.followers} followers</span>
                        <span className="text-accent font-semibold">{artist.growth}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Scenes Tab */}
          <TabsContent value="scenes" className="space-y-8">
            <h2 className="text-3xl font-bold text-gradient">Trending Scenes</h2>
            <div className="responsive-grid">
              {/* Mock scene data - would be replaced with real data */}
              {[
                { name: 'Brooklyn Underground', location: 'Brooklyn, NY', tracks: '234', listeners: '12.4K', growth: '+185%' },
                { name: 'Berlin Techno', location: 'Berlin, DE', tracks: '456', listeners: '28.9K', growth: '+167%' },
                { name: 'Tokyo City Pop', location: 'Tokyo, JP', tracks: '189', listeners: '8.9K', growth: '+143%' },
              ].map((scene) => (
                <div key={scene.name} className="card-scene hover-lift-glow">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{scene.name}</h3>
                      <p className="text-muted-foreground">{scene.location}</p>
                    </div>
                    <Badge variant="secondary" className="badge-success">
                      {scene.growth}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <span className="text-muted-foreground block mb-1">Tracks:</span>
                      <div className="text-foreground font-semibold text-lg">{scene.tracks}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Listeners:</span>
                      <div className="text-foreground font-semibold text-lg">{scene.listeners}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Real-Time Uploads Section */}
      <section className="responsive-container responsive-section">
        <div className="card-secondary p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary/20 rounded-lg border border-primary/30">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Recent Uploads</h2>
              <p className="text-muted-foreground">Fresh tracks from the community</p>
            </div>
            <Badge variant="secondary" className="badge-primary">
              {recentUploads.length} new tracks
            </Badge>
          </div>
          <div className="responsive-grid">
            {recentUploads.slice(0, 6).map((upload) => (
              <Card key={upload.id} className="p-6 hover-lift card-primary">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                    <Music className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground mb-1 truncate">{upload.title}</h4>
                    <p className="text-muted-foreground text-sm mb-1 truncate">{upload.artist_name}</p>
                    <p className="text-muted-foreground/60 text-xs">
                      {new Date(upload.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Error Display */}
      {error && (
        <section className="error-container">
          <div className="error-card">
            <div className="error-header">
              <Target className="w-6 h-6" />
              <h3 className="error-title">Error Loading Data</h3>
            </div>
            <p className="error-message">{error}</p>
            <Button onClick={refreshData} variant="outline" size="lg" className="hover-lift border-destructive/30 text-destructive hover:bg-destructive/10">
              <RefreshCw className="w-5 h-5 mr-2" />
              Retry
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}