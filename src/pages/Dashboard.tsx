import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UploadTrack } from '@/components/UploadTrack';
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
import { Skeleton, FormSkeleton, ListSkeleton } from '@/components/Skeleton';
import { formatNumber, formatDate, formatDuration } from '@/lib/utils';
import { validateRequired } from '@/lib/validation';
import { useErrorHandler } from '@/components/ErrorBoundary';
import { MagicButton } from '@/components/MagicalButton';

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
  const { handleError } = useErrorHandler();
  
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
        handleError(new Error('Failed to fetch artist profile'));
      }

      if (profile) {
        setArtistProfile(profile);
        await fetchTracksAndAnalytics(profile.id);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      handleError(error as Error);
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
      handleError(error as Error);
    }
  };

  const createArtistProfile = async () => {
    if (!user) return;

    try {
      // Validate user data
      const validation = validateRequired(user.email, 'Email');
      if (!validation.isValid) {
        toast({
          title: 'Validation Error',
          description: validation.error,
          variant: 'destructive'
        });
        return;
      }

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
      handleError(error as Error);
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
      <div className="min-h-screen page-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!artistProfile) {
    return (
      <div className="min-h-screen page-background">
        {/* Header */}
        <header className="enhanced-header">
          <div className="responsive-container py-4">
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
        <div className="responsive-container py-16">
          <Card className="max-w-2xl mx-auto card-secondary">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to SoundScape Artists</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <p className="text-muted-foreground">
                Create your artist profile to start uploading music and connecting with listeners
              </p>
              <MagicButton onClick={createArtistProfile} size="lg">
                Create Artist Profile
              </MagicButton>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-background">
      {/* Header */}
      <header className="enhanced-header">
        <div className="responsive-container py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-lg font-bold"
            >
              SoundScape
            </Button>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/profile')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                {user?.email}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="responsive-container py-8">
        {/* Artist Profile Header */}
        <div className="mb-8">
          <div className="flex items-center gap-6 mb-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={artistProfile.cover_url} />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {artistProfile.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{artistProfile.name}</h1>
              <p className="text-muted-foreground mb-4">{artistProfile.bio}</p>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="badge-primary">
                  {tracks.length} tracks
                </Badge>
                <Badge variant="secondary" className="badge-success">
                  {formatNumber(analytics?.followers || 0)} followers
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid-stats mb-8">
          <Card className="card-stats text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">
                {formatNumber(analytics?.totalPlays || 0)}
              </div>
              <div className="text-muted-foreground">Total Plays</div>
            </CardContent>
          </Card>
          
          <Card className="card-stats text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-accentColors-blue mb-2">
                {formatNumber(analytics?.totalListeners || 0)}
              </div>
              <div className="text-muted-foreground">Unique Listeners</div>
            </CardContent>
          </Card>
          
          <Card className="card-stats text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-accentColors-green mb-2">
                {formatNumber(analytics?.followers || 0)}
              </div>
              <div className="text-muted-foreground">Followers</div>
            </CardContent>
          </Card>
          
          <Card className="card-stats text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-accentColors-orange mb-2">
                +{analytics?.weeklyGrowth || 0}%
              </div>
              <div className="text-muted-foreground">Weekly Growth</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="enhanced-tabs grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="enhanced-tab-trigger">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tracks" className="enhanced-tab-trigger">
              <Music className="w-4 h-4" />
              Tracks
            </TabsTrigger>
            <TabsTrigger value="upload" className="enhanced-tab-trigger">
              <Upload className="w-4 h-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Top Track */}
            {analytics?.topTrack && (
              <Card className="card-secondary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accentColors-orange" />
                    Top Performing Track
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
                      <Music className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1">{analytics.topTrack.title}</h3>
                      <p className="text-muted-foreground mb-2">
                        {analytics.topTrack.duration && formatDuration(analytics.topTrack.duration)}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {formatNumber(analytics.topTrack.total_plays)} plays
                        </span>
                        <span className="text-accentColors-blue">
                          {formatNumber(analytics.topTrack.unique_listeners)} listeners
                        </span>
                        <Badge variant="secondary" className="badge-primary">
                          {analytics.topTrack.popularity_tier}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Activity */}
            <Card className="card-secondary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accentColors-blue" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.recentPlays.map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface-primary/30 rounded-lg">
                      <span className="text-muted-foreground">{formatDate(day.date)}</span>
                      <span className="font-semibold text-foreground">{day.plays} plays</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tracks Tab */}
          <TabsContent value="tracks" className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Your Tracks</h2>
              <MagicButton onClick={() => setActiveTab('upload')}>
                <Upload className="w-4 h-4 mr-2" />
                Upload New Track
              </MagicButton>
            </div>

            {tracks.length > 0 ? (
              <div className="responsive-grid">
                {tracks.map((track) => (
                  <Card key={track.id} className="card-secondary hover-lift-glow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
                          <Music className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground mb-1">{track.title}</h3>
                          <p className="text-muted-foreground text-sm mb-2">
                            {track.duration && formatDuration(track.duration)}
                          </p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">
                              {formatNumber(track.total_plays)} plays
                            </span>
                            <span className="text-accentColors-blue">
                              {formatNumber(track.unique_listeners)} listeners
                            </span>
                            <Badge variant="secondary" className="badge-primary">
                              {track.popularity_tier}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="card-secondary p-12 text-center">
                <Music className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
                <h3 className="text-2xl font-bold text-foreground mb-3">No tracks yet</h3>
                <p className="text-muted-foreground text-lg mb-6">
                  Start your music journey by uploading your first track
                </p>
                <MagicButton onClick={() => setActiveTab('upload')}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Track
                </MagicButton>
              </Card>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Upload New Track</h2>
              <p className="text-muted-foreground">
                Share your music with the world and get discovered by new listeners
              </p>
            </div>
            
            <UploadTrack onUploadComplete={handleUploadComplete} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}