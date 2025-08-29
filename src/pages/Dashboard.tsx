import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UploadTrack from '@/components/UploadTrack';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Music, 
  Play, 
  Users, 
  TrendingUp, 
  Calendar,
  BarChart3,
  Upload,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ArtistProfile {
  id: string;
  name: string;
  bio?: string;
  links?: any;
  user_id: string;
}

interface Track {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  total_plays: number;
  unique_listeners: number;
  popularity_tier: string;
  created_at: string;
  cover_url?: string;
}

interface Analytics {
  totalPlays: number;
  totalListeners: number;
  followers: number;
  weeklyGrowth: number;
  topTrack?: Track;
  recentPlays: Array<{
    date: string;
    plays: number;
  }>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch artist profile
      const { data: profile, error: profileError } = await supabase
        .from('artists')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching artist profile:', profileError);
      }

      if (profile) {
        setArtistProfile(profile);
        await fetchTracksAndAnalytics(profile.id);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTracksAndAnalytics = async (artistId: string) => {
    try {
      // Fetch artist's tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('artist_id', artistId)
        .order('created_at', { ascending: false });

      if (tracksError) {
        throw tracksError;
      }

      setTracks(tracksData || []);

      // Calculate analytics
      const totalPlays = tracksData?.reduce((sum, track) => sum + (track.total_plays || 0), 0) || 0;
      const totalListeners = tracksData?.reduce((sum, track) => sum + (track.unique_listeners || 0), 0) || 0;
      const followers = Math.floor(totalListeners / 5); // Mock calculation
      const weeklyGrowth = Math.floor(Math.random() * 50) + 5; // Mock data
      const topTrack = tracksData?.reduce((prev, current) => 
        (prev.total_plays || 0) > (current.total_plays || 0) ? prev : current
      );

      // Mock recent plays data
      const recentPlays = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        plays: Math.floor(Math.random() * 100) + 10
      })).reverse();

      setAnalytics({
        totalPlays,
        totalListeners,
        followers,
        weeklyGrowth,
        topTrack,
        recentPlays
      });
    } catch (error) {
      console.error('Error fetching tracks and analytics:', error);
    }
  };

  const createArtistProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('artists')
        .insert([{
          user_id: user.id,
          name: user.email?.split('@')[0] || 'New Artist',
          bio: 'Tell us about your music...'
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      setArtistProfile(data);
      toast({
        title: 'Success',
        description: 'Artist profile created successfully!'
      });
    } catch (error) {
      console.error('Error creating artist profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to create artist profile',
        variant: 'destructive'
      });
    }
  };

  const handleUploadComplete = () => {
    toast({
      title: 'Success',
      description: 'Track uploaded successfully!'
    });
    fetchDashboardData(); // Refresh data
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!artistProfile) {
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
                <Button variant="outline" onClick={() => navigate('/')}>
                  {user?.email}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Create Profile Prompt */}
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to SoundScape Artists</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground">
                Create your artist profile to start uploading music and connecting with listeners
              </p>
              <Button onClick={createArtistProfile} size="lg">
                Create Artist Profile
              </Button>
            </CardContent>
          </Card>
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
              <Button 
                variant="outline" 
                onClick={() => navigate(`/artist/${artistProfile.id}`)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Public Profile
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                {user?.email}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-center gap-6 mb-8">
          <Avatar className="w-20 h-20">
            <AvatarImage src="" alt={artistProfile.name} />
            <AvatarFallback className="text-2xl">
              {artistProfile.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{artistProfile.name}</h1>
            <p className="text-muted-foreground">Artist Dashboard</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tracks">Tracks</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {analytics && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                      <Play className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalPlays.toLocaleString()}</div>
                      <p className="text-xs text-green-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +{analytics.weeklyGrowth}% from last week
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Unique Listeners</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalListeners.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        Across all tracks
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Followers</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.followers.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">
                        People following your music
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tracks</CardTitle>
                      <Music className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{tracks.length}</div>
                      <p className="text-xs text-muted-foreground">
                        Total uploaded tracks
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Track */}
                {analytics.topTrack && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Performing Track</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <img 
                          src={analytics.topTrack.cover_url || '/src/assets/sample-cover-1.jpg'}
                          alt={analytics.topTrack.title}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{analytics.topTrack.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{analytics.topTrack.total_plays} plays</span>
                            <span>{analytics.topTrack.unique_listeners} listeners</span>
                            <Badge variant="outline">{analytics.topTrack.popularity_tier}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Tracks Tab */}
          <TabsContent value="tracks" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Tracks</h2>
              <Badge variant="secondary">{tracks.length} tracks</Badge>
            </div>

            {tracks.length > 0 ? (
              <div className="space-y-4">
                {tracks.map((track) => (
                  <Card key={track.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <img 
                          src={track.cover_url || '/src/assets/sample-cover-1.jpg'}
                          alt={track.title}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{track.title}</h3>
                          {track.description && (
                            <p className="text-muted-foreground mt-1">{track.description}</p>
                          )}
                          <div className="flex items-center gap-6 mt-2 text-sm text-muted-foreground">
                            <span>{track.total_plays} plays</span>
                            <span>{track.unique_listeners} listeners</span>
                            <Badge variant="outline">{track.popularity_tier}</Badge>
                            <span>{new Date(track.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tracks uploaded yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Upload your first track to start building your audience
                  </p>
                  <Button onClick={() => setActiveTab('upload')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Track
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-4">Upload New Track</h2>
              <UploadTrack onUploadComplete={handleUploadComplete} />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Profile management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}