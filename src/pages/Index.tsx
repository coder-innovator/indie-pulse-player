import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Music, Play, Star, Users, Globe, Headphones, Sparkles, Zap } from "lucide-react";
import { MagicalBackground } from "@/components/MagicalBackground";
import { MagicalCard, GlassCard, GlowCard } from "@/components/MagicalCard";
import { MagicalButton, GlowButton, ShimmerButton } from "@/components/MagicalButton";
import { MagicalLoadingScreen } from "@/components/MagicalLoadingScreen";

export default function Index() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/auth');
    }, 1500);
  };

  if (isLoading) {
    return <MagicalLoadingScreen title="Welcome to SoundScape" subtitle="Your musical journey is about to begin..." />;
  }

  return (
    <div className="min-h-screen page-background relative overflow-hidden">
      <MagicalBackground variant="subtle" />
      
      {/* Header */}
      <header className="glass-effect border-border/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 glass-effect rounded-lg border-border/30 magic-glow">
                <Music className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <h1 className="text-2xl font-bold text-gradient fluid-text">SoundScape</h1>
            </div>
            <GlowButton onClick={() => navigate('/auth')} className="glass-effect">
              Sign In
            </GlowButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-32 px-4 relative">
        <div className="container mx-auto text-center max-w-6xl space-y-16">
          <div className="space-y-8 animate-fade-in">
            <div className="relative">
              <h1 className="text-6xl md:text-8xl font-black tracking-tight text-gradient fluid-text leading-tight">
                Discover Your
                <span className="block text-gradient-warm animate-pulse">Sound</span>
              </h1>
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-accent/20 rounded-full blur-xl animate-float" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-4xl mx-auto fluid-text-sm">
              Unearth the next generation of music. From underground scenes to rising stars, 
              experience the raw energy of independent artists shaping the future of sound.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <MagicalButton onClick={handleGetStarted} size="lg" className="magic-button group">
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Start Exploring
            </MagicalButton>
            <ShimmerButton onClick={() => navigate('/scenes')} size="lg">
              <Globe className="w-5 h-5 mr-2" />
              Explore Scenes
            </ShimmerButton>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gradient mb-6 fluid-text">
              The Future of Music Discovery
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto fluid-text-sm">
              Powered by cutting-edge technology and passionate communities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <GlassCard className="p-8 hover-scale animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <div className="mb-6">
                <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mb-4 magic-glow">
                  <Headphones className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Immersive Listening</h3>
                <p className="text-muted-foreground">
                  Experience music like never before with our advanced audio streaming and waveform visualization.
                </p>
              </div>
            </GlassCard>

            <GlowCard className="p-8 hover-scale animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="mb-6">
                <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mb-4 magic-glow">
                  <Star className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Rising Artists</h3>
                <p className="text-muted-foreground">
                  Discover emerging talent before they hit the mainstream. Support independent creators.
                </p>
              </div>
            </GlowCard>

            <MagicalCard variant="shimmer" className="p-8 hover-scale animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="mb-6">
                <div className="w-16 h-16 glass-effect rounded-full flex items-center justify-center mb-4 magic-glow">
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Community Driven</h3>
                <p className="text-muted-foreground">
                  Join local music scenes and connect with like-minded music enthusiasts worldwide.
                </p>
              </div>
            </MagicalCard>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto max-w-4xl">
          <GlassCard className="p-12 text-center animate-fade-in">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <div className="text-4xl font-bold text-gradient">50K+</div>
                <div className="text-muted-foreground">Artists</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-gradient">1M+</div>
                <div className="text-muted-foreground">Tracks</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-gradient">200+</div>
                <div className="text-muted-foreground">Scenes</div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl font-bold text-gradient">5M+</div>
                <div className="text-muted-foreground">Plays</div>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-32 px-4 relative">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Sparkles className="w-8 h-8 text-accent animate-pulse" />
              <Zap className="w-8 h-8 text-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Sparkles className="w-8 h-8 text-accent animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-gradient mb-6 fluid-text">
              Ready to Explore?
            </h2>
            <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto fluid-text-sm">
              Join thousands of music lovers discovering the next wave of independent artists
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <MagicalButton onClick={handleGetStarted} size="lg" className="magic-button">
                <Play className="w-5 h-5 mr-2" />
                Start Your Journey
              </MagicalButton>
              <GlowButton onClick={() => navigate('/trending')} size="lg">
                <Star className="w-5 h-5 mr-2" />
                Discover Trending
              </GlowButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-effect border-t border-border/20 relative z-10">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-2 glass-effect rounded-lg border-border/30">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-gradient">SoundScape</span>
            </div>
            <p className="text-muted-foreground">
              © 2024 SoundScape. Discover the future of independent music.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="story-link hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="story-link hover:text-primary transition-colors">Terms</a>
              <a href="#" className="story-link hover:text-primary transition-colors">Support</a>
              <a href="#" className="story-link hover:text-primary transition-colors">API</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}