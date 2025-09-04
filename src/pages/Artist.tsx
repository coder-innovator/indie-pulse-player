import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrackCard } from '@/components/TrackCard';
import { Play, Pause, Users, Music, ExternalLink, UserPlus, UserMinus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Artist {
  id: string;
  name: string;
  bio?: string;
  user_id?: string;
  links?: any;
  avatar_url?: string;
  follower_count?: number;
  track_count?: number;
  total_plays?: number;
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
}

export default function Artist() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [artist, setArtist] = useState<Artist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }
    fetchArtistData();
    if (user) {
      checkFollowStatus();
    }
  }, [id, user]);

  const fetchArtistData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch artist info
      const { data: artistData, error: artistError } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();

      if (artistError) {
        throw new Error('Artist not found');
      }

      // Fetch artist's tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select(`
          id,
          title,
          duration,
          cover_url,
          unique_listeners,
          popularity_tier,
          total_plays,
          track_tags (
            tags (
              name,
              type
            )
          )
        `)
        .eq('artist_id', id);

      if (tracksError) {
        console.error('Error fetching tracks:', tracksError);
      }

      // Format tracks data
      const formattedTracks: Track[] = tracksData?.map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: artistData.name,
        duration: track.duration ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : undefined,
        coverUrl: track.cover_url || '/src/assets/sample-cover-1.jpg',
        uniqueListeners: track.unique_listeners,
        popularityTier: track.popularity_tier,
        tags: track.track_tags?.map((tt: any) => tt.tags?.name).filter(Boolean) || [],
      })) || [];

      // Calculate stats
      const totalPlays = tracksData?.reduce((sum, track) => sum + (track.total_plays || 0), 0) || 0;
      const followerCount = Math.floor(totalPlays / 10); // Mock calculation

      setArtist({
        ...artistData,
        follower_count: followerCount,
        track_count: tracksData?.length || 0,
        total_plays: totalPlays,
      });
      setTracks(formattedTracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load artist');
    } finally {
      setLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    if (!user || !id) return;

    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('user_id', user.id)
      .eq('artist_id', id)
      .single();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('user_id', user.id)
          .eq('artist_id', id);
        setIsFollowing(false);
        toast({ title: 'Unfollowed artist' });
      } else {
        await supabase
          .from('follows')
          .insert([{ user_id: user.id, artist_id: id }]);
        setIsFollowing(true);
        toast({ title: 'Following artist' });
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
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

    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('track_id', trackId)
        .single();

      if (existingLike) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('track_id', trackId);
      } else {
        await supabase
          .from('likes')
          .insert([{ user_id: user.id, track_id: trackId }]);
      }

      // Update local state
      setTracks(tracks.map(track => 
        track.id === trackId 
          ? { ...track, isLiked: !track.isLiked }
          : track
      ));
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to update like status',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading artist...</p>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="text-center p-6">
            <h2 className="text-xl font-semibold mb-2">Artist Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || 'The artist you\'re looking for doesn\'t exist.'}</p>
            <Button onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
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

      {/* Artist Header */}
      <section className="bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <Avatar className="w-48 h-48 mx-auto md:mx-0">
              <AvatarImage src={artist.avatar_url} alt={artist.name} />
              <AvatarFallback className="text-4xl">
                {artist.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{artist.name}</h1>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{artist.follower_count?.toLocaleString() || 0} followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  <span>{artist.track_count} tracks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  <span>{artist.total_plays?.toLocaleString() || 0} total plays</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                <Button 
                  size="lg" 
                  onClick={() => handlePlay(tracks[0])}
                  className="min-w-32"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
                
                <Button 
                  variant={isFollowing ? "secondary" : "outline"}
                  onClick={handleFollow}
                  size="lg"
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </>
                  )}
                </Button>
              </div>

              {artist.bio && (
                <p className="text-muted-foreground max-w-2xl mb-6">
                  {artist.bio}
                </p>
              )}

              {artist.links && Array.isArray(artist.links) && artist.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {artist.links.map((link: any, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {link.label}
                      </a>
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tracks Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Tracks</h2>
          <Badge variant="secondary">{tracks.length} tracks</Badge>
        </div>

        {tracks.length > 0 ? (
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
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No tracks yet</h3>
              <p className="text-muted-foreground">
                This artist hasn't uploaded any tracks yet.
              </p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}