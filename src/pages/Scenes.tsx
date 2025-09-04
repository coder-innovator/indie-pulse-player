import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrackCard } from '@/components/TrackCard';
import { MagicalBackground } from '@/components/MagicalBackground';
import { MapPin, Search, Filter, Users, Music, TrendingUp } from 'lucide-react';

interface Scene {
  id: string;
  name: string;
  location: string;
  description?: string;
  primary_genre: string;
  track_count: number;
  listener_count: number;
  growth_rate: number;
  image_url?: string;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  duration?: string;
  coverUrl: string;
  tags?: string[];
  isLiked?: boolean;
  uniqueListeners?: number;
  popularityTier?: 'emerging' | 'rising' | 'established' | 'popular';
  scene?: string;
}

export default function Scenes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const genres = ['Electronic', 'Techno', 'House', 'Ambient', 'Hip Hop', 'Jazz', 'Rock', 'Pop', 'Experimental'];
  const locations = ['New York', 'Los Angeles', 'London', 'Berlin', 'Tokyo', 'Amsterdam', 'Barcelona', 'Montreal'];

  useEffect(() => {
    fetchScenesData();
    
    // Check for location filter from URL params
    const locationParam = searchParams.get('location');
    if (locationParam) {
      setLocationFilter(locationParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedScene) {
      fetchSceneTracks(selectedScene.id);
    }
  }, [selectedScene]);

  const fetchScenesData = async () => {
    try {
      setLoading(true);
      
      // Mock scenes data since we don't have a scenes table yet
      const mockScenes: Scene[] = [
        {
          id: '1',
          name: 'Brooklyn Underground',
          location: 'Brooklyn, NY',
          description: 'Raw electronic sounds emerging from Brooklyn\'s warehouse scene',
          primary_genre: 'Electronic',
          track_count: 234,
          listener_count: 12400,
          growth_rate: 185,
          image_url: '/src/assets/sample-cover-1.jpg'
        },
        {
          id: '2',
          name: 'Berlin Techno',
          location: 'Berlin, DE',
          description: 'The legendary techno capital continues to evolve',
          primary_genre: 'Techno',
          track_count: 456,
          listener_count: 28900,
          growth_rate: 167,
          image_url: '/src/assets/sample-cover-2.jpg'
        },
        {
          id: '3',
          name: 'Tokyo City Pop',
          location: 'Tokyo, JP',
          description: 'Modern takes on classic Japanese city pop vibes',
          primary_genre: 'Pop',
          track_count: 189,
          listener_count: 9800,
          growth_rate: 143,
          image_url: '/src/assets/sample-cover-3.jpg'
        },
        {
          id: '4',
          name: 'LA Indie Rock',
          location: 'Los Angeles, CA',
          description: 'Independent rock artists pushing creative boundaries',
          primary_genre: 'Rock',
          track_count: 312,
          listener_count: 15600,
          growth_rate: 132
        },
        {
          id: '5',
          name: 'London Grime',
          location: 'London, UK',
          description: 'The birthplace of grime continues to innovate',
          primary_genre: 'Hip Hop',
          track_count: 278,
          listener_count: 18200,
          growth_rate: 128
        },
        {
          id: '6',
          name: 'Amsterdam House',
          location: 'Amsterdam, NL',
          description: 'Deep house rhythms from the Dutch electronic scene',
          primary_genre: 'House',
          track_count: 195,
          listener_count: 11300,
          growth_rate: 115
        }
      ];

      setScenes(mockScenes);
    } catch (error) {
      console.error('Error fetching scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSceneTracks = async (sceneId: string) => {
    try {
      // Fetch tracks related to the scene (using genre/location tags for now)
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene) return;

      const { data: tracksData, error } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          duration,
          cover_url,
          unique_listeners,
          popularity_tier,
          artists (
            name
          ),
          track_tags (
            tags (
              name,
              type
            )
          )
        `)
        .limit(20);

      if (error) {
        console.error('Error fetching scene tracks:', error);
        return;
      }

      // Filter tracks by scene's genre and format
      const formattedTracks: Track[] = tracksData
        ?.filter((track: any) => {
          const tags = track.track_tags?.map((tt: any) => tt.tags?.name.toLowerCase()) || [];
          return tags.includes(scene.primary_genre.toLowerCase()) || 
                 tags.includes(scene.location.split(',')[0].toLowerCase());
        })
        .map((track: any) => ({
          id: track.id,
          title: track.title,
          artist: track.artists?.name || 'Unknown Artist',
          duration: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : undefined,
          coverUrl: track.cover_url || '/src/assets/sample-cover-1.jpg',
          uniqueListeners: track.unique_listeners,
          popularityTier: track.popularity_tier,
          scene: scene.name,
          tags: track.track_tags?.map((tt: any) => tt.tags?.name).filter(Boolean) || [],
        })) || [];

      setTracks(formattedTracks);
    } catch (error) {
      console.error('Error fetching scene tracks:', error);
    }
  };

  const handlePlay = (track?: Track) => {
    if (track) {
      setCurrentTrack(track);
    }
    setIsPlaying(!isPlaying);
  };

  const handleLike = async (trackId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Like functionality implementation
  };

  const filteredScenes = scenes.filter(scene => {
    const matchesSearch = scene.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scene.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scene.primary_genre.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGenre = genreFilter === 'all' || scene.primary_genre === genreFilter;
    
    const matchesLocation = locationFilter === 'all' || 
                           scene.location.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesGenre && matchesLocation;
  });

  if (loading) {
    return (
      <div className="min-h-screen page-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading scenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-background relative overflow-hidden">
      <MagicalBackground variant="minimal" className="opacity-40" />
      
      {/* Header */}
      <header className="glass-effect border-border/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-lg font-bold"
            >
              SoundScape
            </Button>
            <div className="flex items-center gap-4">
              {user ? (
                <Button variant="outline" onClick={() => navigate('/auth')}>
                  {user.email}
                </Button>
              ) : (
                <Button onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-accent/10 via-primary/5 to-accent/10">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <MapPin className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-6xl font-bold">Explore Scenes</h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8">
              Discover vibrant music communities from around the world
            </p>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search scenes, locations, or genres..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Scenes Grid */}
      <section className="container mx-auto px-4 py-12">
        {selectedScene ? (
          // Scene Detail View
          <div className="space-y-8">
            <Button 
              variant="outline" 
              onClick={() => setSelectedScene(null)}
              className="mb-4"
            >
              ← Back to Scenes
            </Button>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">{selectedScene.name}</h2>
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4" />
                <span>{selectedScene.location}</span>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
                {selectedScene.description}
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span>{selectedScene.track_count} tracks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{selectedScene.listener_count.toLocaleString()} listeners</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{selectedScene.growth_rate}% growth</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onPlay={() => handlePlay(track)}
                  onLike={() => handleLike(track.id)}
                  onAddToQueue={() => {}}
                  isPlaying={currentTrack?.id === track.id && isPlaying}
                />
              ))}
            </div>
          </div>
        ) : (
          // Scenes Grid View
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {filteredScenes.length === scenes.length 
                  ? 'All Scenes' 
                  : `${filteredScenes.length} scene${filteredScenes.length !== 1 ? 's' : ''} found`
                }
              </h2>
              <Badge variant="secondary">{filteredScenes.length} scenes</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScenes.map((scene) => (
                <Card 
                  key={scene.id}
                  className="hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => setSelectedScene(scene)}
                >
                  {scene.image_url && (
                    <div className="relative h-48 overflow-hidden rounded-t-lg">
                      <img 
                        src={scene.image_url} 
                        alt={scene.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                        {scene.primary_genre}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <CardTitle className="text-xl">{scene.name}</CardTitle>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{scene.location}</span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-muted-foreground mb-4 line-clamp-2">
                      {scene.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-muted-foreground" />
                        <span>{scene.track_count} tracks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{scene.listener_count.toLocaleString()}</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span>+{scene.growth_rate}% growth this month</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}