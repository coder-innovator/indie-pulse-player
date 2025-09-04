import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Play, 
  Heart, 
  MoreHorizontal,
  Clock,
  Users,
  TrendingUp,
  Music,
  Plus,
  Grid3X3,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton, TrackCardSkeleton, ListSkeleton } from '@/components/Skeleton';
import { formatNumber, formatDate, formatDuration, debounce } from '@/lib/utils';
import { MagicButton } from '@/components/MagicalButton';
import { useErrorHandler } from '@/components/ErrorBoundary';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  cover_url: string;
  total_plays: number;
  unique_listeners: number;
  popularity_tier: string;
  created_at: string;
  genre: string;
  mood: string;
  scene: string;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  track_count: number;
  created_at: string;
  is_public: boolean;
}

export default function Library() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'plays' | 'title' | 'artist'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('tracks');
  const [filters, setFilters] = useState({
    genre: '',
    mood: '',
    scene: '',
    popularity: ''
  });

  useEffect(() => {
    if (!authLoading && user) {
      fetchLibraryData();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    filterAndSortTracks();
  }, [tracks, searchQuery, filters, sortBy, sortOrder]);

  const fetchLibraryData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          duration,
          cover_url,
          total_plays,
          unique_listeners,
          popularity_tier,
          created_at,
          artists (
            name
          )
        `)
        .eq('artist_id', user.id)
        .order('created_at', { ascending: false });

      if (tracksError) throw tracksError;

      const formattedTracks: Track[] = (tracksData || []).map((track: {
        id: string;
        title: string;
        duration: number | null;
        cover_url: string | null;
        total_plays: number | null;
        unique_listeners: number | null;
        popularity_tier: string | null;
        created_at: string;
        artists: { name: string } | null;
      }) => ({
        id: track.id,
        title: track.title,
        artist: track.artists?.name || 'Unknown Artist',
        duration: track.duration || 0,
        cover_url: track.cover_url || '/src/assets/sample-cover-1.jpg',
        total_plays: track.total_plays || 0,
        unique_listeners: track.unique_listeners || 0,
        popularity_tier: track.popularity_tier || 'emerging',
        created_at: track.created_at,
        genre: 'Electronic', // Mock data - would come from tags
        mood: 'Chill', // Mock data - would come from tags
        scene: 'Underground' // Mock data - would come from tags
      }));

      setTracks(formattedTracks);

      // For now, use mock playlists since the table doesn't exist yet
      const mockPlaylists: Playlist[] = [
        {
          id: '1',
          name: 'Chill Vibes',
          description: 'Perfect for relaxing and studying',
          created_at: new Date().toISOString(),
          track_count: 12,
          is_public: true
        },
        {
          id: '2',
          name: 'Workout Mix',
          description: 'High energy tracks to keep you motivated',
          created_at: new Date().toISOString(),
          track_count: 8,
          is_public: false
        }
      ];
      
      setPlaylists(mockPlaylists);

    } catch (error) {
      console.error('Error fetching library data:', error);
      handleError(error as Error);
      toast({
        title: 'Error',
        description: 'Failed to load library data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortTracks = () => {
    let filtered = [...tracks];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(track =>
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filters
    if (filters.genre) {
      filtered = filtered.filter(track => track.genre === filters.genre);
    }
    if (filters.mood) {
      filtered = filtered.filter(track => track.mood === filters.mood);
    }
    if (filters.scene) {
      filtered = filtered.filter(track => track.scene === filters.scene);
    }
    if (filters.popularity) {
      filtered = filtered.filter(track => track.popularity_tier === filters.popularity);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number, bValue: string | number;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'plays':
          aValue = a.total_plays;
          bValue = b.total_plays;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'artist':
          aValue = a.artist.toLowerCase();
          bValue = b.artist.toLowerCase();
          break;
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTracks(filtered);
  };

  const handlePlay = async (track: Track) => {
    try {
      // Update play count
      const { error } = await supabase
        .from('tracks')
        .update({ total_plays: track.total_plays + 1 })
        .eq('id', track.id);

      if (error) throw error;

      // Update local state
      setTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, total_plays: t.total_plays + 1 } : t
      ));

      toast({
        title: 'Now Playing',
        description: `${track.title} by ${track.artist}`,
      });
    } catch (error) {
      console.error('Error playing track:', error);
      handleError(error as Error);
    }
  };

  const handleLike = async (track: Track) => {
    try {
      // Toggle like status (would need a likes table)
      toast({
        title: 'Track Liked',
        description: `${track.title} added to your favorites`,
      });
    } catch (error) {
      console.error('Error liking track:', error);
      handleError(error as Error);
    }
  };

  const clearFilters = () => {
    setFilters({
      genre: '',
      mood: '',
      scene: '',
      popularity: ''
    });
    setSearchQuery('');
  };

  const debouncedSearch = debounce((query: string) => {
    setSearchQuery(query);
  }, 300);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen page-background">
        <div className="responsive-container py-8">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            {/* Search and Filters Skeleton */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24" />
                ))}
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-3">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </div>
              
              {/* Tracks Grid Skeleton */}
              <div className="responsive-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <TrackCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-background">
      <div className="responsive-container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gradient mb-2">Your Library</h1>
          <p className="text-muted-foreground text-lg">
            Manage your tracks, playlists, and discover your music journey
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search your tracks and playlists..."
                onChange={(e) => debouncedSearch(e.target.value)}
                className="pl-10 form-input"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/upload')}
              className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Track
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Analytics
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-3">
            <Select value={filters.genre} onValueChange={(value) => setFilters(prev => ({ ...prev, genre: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Genres</SelectItem>
                <SelectItem value="Electronic">Electronic</SelectItem>
                <SelectItem value="Indie Rock">Indie Rock</SelectItem>
                <SelectItem value="Ambient">Ambient</SelectItem>
                <SelectItem value="Hip Hop">Hip Hop</SelectItem>
                <SelectItem value="Folk">Folk</SelectItem>
                <SelectItem value="Pop">Pop</SelectItem>
                <SelectItem value="R&B">R&B</SelectItem>
                <SelectItem value="Jazz">Jazz</SelectItem>
                <SelectItem value="Classical">Classical</SelectItem>
                <SelectItem value="Country">Country</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.mood} onValueChange={(value) => setFilters(prev => ({ ...prev, mood: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Moods</SelectItem>
                <SelectItem value="Chill">Chill</SelectItem>
                <SelectItem value="Energetic">Energetic</SelectItem>
                <SelectItem value="Dreamy">Dreamy</SelectItem>
                <SelectItem value="Dark">Dark</SelectItem>
                <SelectItem value="Uplifting">Uplifting</SelectItem>
                <SelectItem value="Melancholic">Melancholic</SelectItem>
                <SelectItem value="Euphoric">Euphoric</SelectItem>
                <SelectItem value="Aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.scene} onValueChange={(value) => setFilters(prev => ({ ...prev, scene: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Scene" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Scenes</SelectItem>
                <SelectItem value="Underground">Underground</SelectItem>
                <SelectItem value="Local">Local</SelectItem>
                <SelectItem value="Experimental">Experimental</SelectItem>
                <SelectItem value="Bedroom Pop">Bedroom Pop</SelectItem>
                <SelectItem value="College">College</SelectItem>
                <SelectItem value="Club">Club</SelectItem>
                <SelectItem value="Festival">Festival</SelectItem>
                <SelectItem value="Studio">Studio</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.popularity} onValueChange={(value) => setFilters(prev => ({ ...prev, popularity: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Popularity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Levels</SelectItem>
                <SelectItem value="emerging">Emerging</SelectItem>
                <SelectItem value="rising">Rising</SelectItem>
                <SelectItem value="established">Established</SelectItem>
                <SelectItem value="viral">Viral</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary"
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="enhanced-tabs grid w-full grid-cols-2">
            <TabsTrigger value="tracks" className="enhanced-tab-trigger">
              <Music className="w-4 h-4" />
              Tracks ({filteredTracks.length})
            </TabsTrigger>
            <TabsTrigger value="playlists" className="enhanced-tab-trigger">
              <Heart className="w-4 h-4" />
              Playlists ({playlists.length})
            </TabsTrigger>
          </TabsList>

          {/* Tracks Tab */}
          <TabsContent value="tracks" className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Label className="text-sm font-medium text-muted-foreground">Sort by:</Label>
                <Select value={sortBy} onValueChange={(value: 'date' | 'plays' | 'title' | 'artist') => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="plays">Plays</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="hover-lift"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="hover-lift"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="hover-lift"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Tracks Display */}
            {filteredTracks.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="responsive-grid">
                  {filteredTracks.map((track) => (
                    <Card key={track.id} className="card-secondary hover-lift-glow">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* Cover Image */}
                          <div className="aspect-square w-full rounded-lg overflow-hidden bg-surface-secondary border border-border-medium">
                            <img
                              src={track.cover_url}
                              alt={track.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          
                          {/* Track Info */}
                          <div className="space-y-2">
                            <h3 className="font-bold text-foreground truncate">{track.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                            
                            {/* Stats */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(track.duration)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {formatNumber(track.unique_listeners)}
                              </span>
                            </div>
                            
                            {/* Popularity Badge */}
                            <Badge variant="secondary" className="badge-primary w-fit">
                              {track.popularity_tier}
                            </Badge>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <MagicButton
                              size="sm"
                              onClick={() => handlePlay(track)}
                              className="flex-1"
                            >
                              <Play className="w-4 h-4" />
                            </MagicButton>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLike(track)}
                              className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary"
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTracks.map((track) => (
                    <Card key={track.id} className="card-secondary hover-lift">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          {/* Cover Image */}
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-secondary border border-border-medium flex-shrink-0">
                            <img
                              src={track.cover_url}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Track Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground truncate">{track.title}</h3>
                            <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(track.duration)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {formatNumber(track.unique_listeners)} listeners
                              </span>
                              <span className="flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                {formatNumber(track.total_plays)} plays
                              </span>
                            </div>
                          </div>
                          
                          {/* Popularity Badge */}
                          <Badge variant="secondary" className="badge-primary flex-shrink-0">
                            {track.popularity_tier}
                          </Badge>
                          
                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <MagicButton
                              size="sm"
                              onClick={() => handlePlay(track)}
                            >
                              <Play className="w-4 h-4" />
                            </MagicButton>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLike(track)}
                              className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary"
                            >
                              <Heart className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            ) : (
              <Card className="card-secondary p-12 text-center">
                <Music className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-3">No tracks found</h3>
                <p className="text-muted-foreground text-lg mb-6">
                  {searchQuery || Object.values(filters).some(f => f) 
                    ? 'Try adjusting your search or filters'
                    : 'Start your music journey by uploading your first track'
                  }
                </p>
                {!searchQuery && !Object.values(filters).some(f => f) && (
                  <MagicButton onClick={() => navigate('/upload')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Your First Track
                  </MagicButton>
                )}
              </Card>
            )}
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Your Playlists</h2>
              <MagicButton>
                <Plus className="w-4 h-4 mr-2" />
                Create Playlist
              </MagicButton>
            </div>

            {playlists.length > 0 ? (
              <div className="responsive-grid">
                {playlists.map((playlist) => (
                  <Card key={playlist.id} className="card-secondary hover-lift-glow">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30 mx-auto">
                          <Music className="w-8 h-8 text-primary" />
                        </div>
                        
                        <div className="text-center space-y-2">
                          <h3 className="font-bold text-foreground">{playlist.name}</h3>
                          {playlist.description && (
                            <p className="text-sm text-muted-foreground">{playlist.description}</p>
                          )}
                          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                            <span>{playlist.track_count} tracks</span>
                            <span>{formatDate(playlist.created_at)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="outline" className="flex-1 hover-lift border-border-medium text-foreground hover:bg-surface-secondary">
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Button>
                          <Button variant="outline" className="hover-lift border-border-medium text-foreground hover:bg-surface-secondary">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-secondary p-12 text-center">
                <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-3">No playlists yet</h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Create playlists to organize your favorite tracks
                </p>
                <MagicButton>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Playlist
                </MagicButton>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
