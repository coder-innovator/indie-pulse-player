import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrackCard, Track } from "@/components/TrackCard";
import { 
  User, 
  Edit, 
  Heart, 
  Clock, 
  Settings, 
  Music,
  Calendar,
  Mail,
  MapPin,
  Link as LinkIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
  artist_profile?: {
    id: string;
    name: string;
    bio: string;
    links: any;
  };
}

interface LikedTrack extends Track {
  liked_at: string;
}

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [likedTracks, setLikedTracks] = useState<LikedTrack[]>([]);
  const [recentPlays, setRecentPlays] = useState<any[]>([]);
  
  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    links: {
      website: '',
      instagram: '',
      twitter: '',
      spotify: ''
    }
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchLikedTracks();
      fetchRecentPlays();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      // Fetch artist profile if user is an artist
      let artistProfile = null;
      if (userData.role === 'artist') {
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (!artistError && artistData) {
          artistProfile = artistData;
        }
      }

      const profileData: UserProfile = {
        ...userData,
        artist_profile: artistProfile
      };

      setProfile(profileData);
      
      if (artistProfile) {
        setFormData({
          name: artistProfile.name || '',
          bio: artistProfile.bio || '',
          links: artistProfile.links || {
            website: '',
            instagram: '',
            twitter: '',
            spotify: ''
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          created_at,
          tracks (
            id,
            title,
            duration,
            cover_url,
            unique_listeners,
            popularity_tier,
            artists (
              name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTracks: LikedTrack[] = data?.map(like => ({
        id: like.tracks.id,
        title: like.tracks.title,
        artist: like.tracks.artists?.name || 'Unknown Artist',
        duration: like.tracks.duration ? `${Math.floor(like.tracks.duration / 60)}:${(like.tracks.duration % 60).toString().padStart(2, '0')}` : undefined,
        coverUrl: like.tracks.cover_url || '/src/assets/sample-cover-1.jpg',
        uniqueListeners: like.tracks.unique_listeners,
        popularityTier: like.tracks.popularity_tier,
        liked_at: like.created_at
      })) || [];

      setLikedTracks(formattedTracks);
    } catch (error) {
      console.error('Error fetching liked tracks:', error);
    }
  };

  const fetchRecentPlays = async () => {
    try {
      const { data, error } = await supabase
        .from('plays')
        .select(`
          created_at,
          play_duration,
          tracks (
            id,
            title,
            duration,
            cover_url,
            artists (
              name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentPlays(data || []);
    } catch (error) {
      console.error('Error fetching recent plays:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      if (profile?.role === 'artist') {
        // Update or create artist profile
        const { error } = await supabase
          .from('artists')
          .upsert({
            user_id: user?.id,
            name: formData.name,
            bio: formData.bio,
            links: formData.links
          });

        if (error) throw error;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully!",
      });

      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: Track) => {
    toast({
      title: "Now Playing",
      description: `${track.title} by ${track.artist}`,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-4">You need to be signed in to view your profile.</p>
          <Button asChild>
            <a href="/auth">Sign In</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Profile Header */}
      <Card className="p-8 mb-8">
        <div className="flex items-start gap-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={profile?.artist_profile?.links?.website} />
            <AvatarFallback className="text-2xl">
              {profile?.artist_profile?.name?.[0] || user.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold">
                {profile?.artist_profile?.name || user.email}
              </h1>
              <Badge variant={profile?.role === 'artist' ? 'default' : 'secondary'}>
                {profile?.role === 'artist' ? 'Artist' : 'Listener'}
              </Badge>
              {editing && (
                <Button size="sm" onClick={() => setEditing(false)} variant="outline">
                  Cancel
                </Button>
              )}
            </div>
            
            {profile?.artist_profile?.bio && !editing && (
              <p className="text-muted-foreground mb-4">{profile.artist_profile.bio}</p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Member since {new Date(profile?.created_at || '').toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {!editing && (
            <Button onClick={() => setEditing(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </Card>

      {/* Edit Profile Form */}
      {editing && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="name">Artist Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your artist name"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about your music..."
                rows={3}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.links.website}
                onChange={(e) => setFormData({
                  ...formData,
                  links: { ...formData.links, website: e.target.value }
                })}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                value={formData.links.instagram}
                onChange={(e) => setFormData({
                  ...formData,
                  links: { ...formData.links, instagram: e.target.value }
                })}
                placeholder="@username"
              />
            </div>
            <div>
              <Label htmlFor="twitter">Twitter</Label>
              <Input
                id="twitter"
                value={formData.links.twitter}
                onChange={(e) => setFormData({
                  ...formData,
                  links: { ...formData.links, twitter: e.target.value }
                })}
                placeholder="@username"
              />
            </div>
            <div>
              <Label htmlFor="spotify">Spotify</Label>
              <Input
                id="spotify"
                value={formData.links.spotify}
                onChange={(e) => setFormData({
                  ...formData,
                  links: { ...formData.links, spotify: e.target.value }
                })}
                placeholder="Spotify profile URL"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={loading}>
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Profile Tabs */}
      <Tabs defaultValue="liked" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="liked" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Liked Tracks ({likedTracks.length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Plays
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <Music className="w-4 h-4" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="liked" className="mt-6">
          {likedTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {likedTracks.map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onPlay={handlePlay}
                />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No liked tracks yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring music and like your favorite tracks!
              </p>
              <Button asChild>
                <a href="/">Discover Music</a>
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-6">
          {recentPlays.length > 0 ? (
            <div className="space-y-4">
              {recentPlays.map((play) => (
                <Card key={play.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={play.tracks.cover_url || '/src/assets/sample-cover-1.jpg'}
                      alt={play.tracks.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{play.tracks.title}</h4>
                      <p className="text-muted-foreground">{play.tracks.artists?.name}</p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{new Date(play.created_at).toLocaleDateString()}</div>
                      <div>{Math.floor(play.play_duration / 60)}:{(play.play_duration % 60).toString().padStart(2, '0')}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No recent plays</h3>
              <p className="text-muted-foreground mb-4">
                Start listening to music to see your recent activity!
              </p>
              <Button asChild>
                <a href="/">Start Listening</a>
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{likedTracks.length}</div>
              <div className="text-muted-foreground">Liked Tracks</div>
            </Card>
            <Card className="p-6 text-center">
              <Clock className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{recentPlays.length}</div>
              <div className="text-muted-foreground">Total Plays</div>
            </Card>
            <Card className="p-6 text-center">
              <Music className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {profile?.role === 'artist' ? 'Artist' : 'Listener'}
              </div>
              <div className="text-muted-foreground">Account Type</div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
