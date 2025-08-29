import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackCard } from '@/components/TrackCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, Users, MapPin, Music, Play, Pause } from 'lucide-react';

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
  totalPlays?: number;
  weeklyGrowth?: number;
}

interface TrendingArtist {
  id: string;
  name: string;
  avatar_url?: string;
  follower_count: number;
  weekly_growth: number;
  total_plays: number;
  track_count: number;
}

interface TrendingScene {
  name: string;
  location: string;
  track_count: number;
  listener_count: number;
  growth_rate: number;
  primary_genre: string;
}

export default function Trending() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [trendingArtists, setTrendingArtists] = useState<TrendingArtist[]>([]);
  const [trendingScenes, setTrendingScenes] = useState<TrendingScene[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingData();
  }, []);

  const fetchTrendingData = async () => {
    try {
      setLoading(true);

      // Fetch trending tracks (most played this week)
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          duration,
          cover_url,
          unique_listeners,
          total_plays,
          popularity_tier,
          artists (
            id,
            name
          ),
          track_tags (
            tags (
              name,
              type
            )
          )
        `)
        .order('total_plays', { ascending: false })
        .limit(20);

      if (tracksError) {
        console.error('Error fetching trending tracks:', tracksError);
      }

      // Format tracks data with mock weekly growth
      const formattedTracks: Track[] = tracksData?.map((track: any, index) => ({
        id: track.id,
        title: track.title,
        artist: track.artists?.name || 'Unknown Artist',
        duration: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : undefined,
        coverUrl: track.cover_url || '/src/assets/sample-cover-1.jpg',
        uniqueListeners: track.unique_listeners,
        popularityTier: track.popularity_tier,
        totalPlays: track.total_plays,
        weeklyGrowth: Math.floor(Math.random() * 200) + 10, // Mock growth data
        tags: track.track_tags?.map((tt: any) => tt.tags?.name).filter(Boolean) || [],
      })) || [];

      // Fetch artists with their stats
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select(`
          id,
          name,
          bio,
          links,
          tracks (
            total_plays,
            unique_listeners
          )
        `)
        .limit(10);

      if (artistsError) {
        console.error('Error fetching artists:', artistsError);
      }

      // Format artists data with calculated stats
      const formattedArtists: TrendingArtist[] = artistsData?.map((artist: any) => {
        const totalPlays = artist.tracks?.reduce((sum: number, track: any) => sum + (track.total_plays || 0), 0) || 0;
        const totalListeners = artist.tracks?.reduce((sum: number, track: any) => sum + (track.unique_listeners || 0), 0) || 0;
        
        return {
          id: artist.id,
          name: artist.name,
          follower_count: Math.floor(totalListeners / 5), // Mock calculation
          weekly_growth: Math.floor(Math.random() * 150) + 5,
          total_plays: totalPlays,
          track_count: artist.tracks?.length || 0,
        };
      }).sort((a, b) => b.weekly_growth - a.weekly_growth) || [];

      // Mock trending scenes data
      const mockScenes: TrendingScene[] = [
        {
          name: "Brooklyn Underground",
          location: "Brooklyn, NY",
          track_count: 234,
          listener_count: 12400,
          growth_rate: 185,
          primary_genre: "Electronic"
        },
        {
          name: "Berlin Techno",
          location: "Berlin, DE",
          track_count: 456,
          listener_count: 28900,
          growth_rate: 167,
          primary_genre: "Techno"
        },
        {
          name: "Tokyo City Pop",
          location: "Tokyo, JP",
          track_count: 189,
          listener_count: 9800,
          growth_rate: 143,
          primary_genre: "City Pop"
        },
        {
          name: "LA Indie Rock",
          location: "Los Angeles, CA",
          track_count: 312,
          listener_count: 15600,
          growth_rate: 132,
          primary_genre: "Indie Rock"
        },
        {
          name: "London Grime",
          location: "London, UK",
          track_count: 278,
          listener_count: 18200,
          growth_rate: 128,
          primary_genre: "Grime"
        }
      ];

      setTrendingTracks(formattedTracks);
      setTrendingArtists(formattedArtists);
      setTrendingScenes(mockScenes);
    } catch (error) {
      console.error('Error fetching trending data:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading trending content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
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
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <TrendingUp className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-6xl font-bold">Trending Now</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Discover the hottest tracks, rising artists, and emerging scenes taking the world by storm
            </p>
          </div>
        </div>
      </section>

      {/* Trending Content */}
      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="tracks" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="scenes">Scenes</TabsTrigger>
          </TabsList>

          {/* Trending Tracks */}
          <TabsContent value="tracks" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Trending Tracks</h2>
              <Badge variant="secondary">Most played this week</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {trendingTracks.map((track, index) => (
                <div key={track.id} className="relative">
                  <Badge 
                    className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground"
                  >
                    #{index + 1}
                  </Badge>
                  <TrackCard
                    track={track}
                    onPlay={() => handlePlay(track)}
                    onLike={() => handleLike(track.id)}
                    onAddToQueue={() => {}}
                    isPlaying={currentTrack?.id === track.id && isPlaying}
                  />
                  {track.weeklyGrowth && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      +{track.weeklyGrowth}% this week
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Trending Artists */}
          <TabsContent value="artists" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Rising Artists</h2>
              <Badge variant="secondary">Fastest growing</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingArtists.map((artist, index) => (
                <Card 
                  key={artist.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/artist/${artist.id}`)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <Badge className="bg-primary text-primary-foreground">
                        #{index + 1}
                      </Badge>
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={artist.avatar_url} alt={artist.name} />
                        <AvatarFallback>
                          {artist.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{artist.name}</h3>
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <TrendingUp className="w-3 h-3" />
                          +{artist.weekly_growth}% growth
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{artist.follower_count.toLocaleString()} followers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4" />
                        <span>{artist.track_count} tracks</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        <span>{artist.total_plays.toLocaleString()} total plays</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Trending Scenes */}
          <TabsContent value="scenes" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Trending Scenes</h2>
              <Badge variant="secondary">Hottest communities</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingScenes.map((scene, index) => (
                <Card 
                  key={scene.name} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/scenes?location=${encodeURIComponent(scene.location)}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{scene.name}</CardTitle>
                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4" />
                          <span>{scene.location}</span>
                        </div>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">
                        #{index + 1}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Primary Genre:</span>
                        <Badge variant="outline">{scene.primary_genre}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tracks:</span>
                          <div className="font-semibold">{scene.track_count}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Listeners:</span>
                          <div className="font-semibold">{scene.listener_count.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <TrendingUp className="w-4 h-4" />
                        +{scene.growth_rate}% growth this month
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}