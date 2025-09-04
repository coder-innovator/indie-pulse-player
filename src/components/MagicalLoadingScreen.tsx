import { GlassLoader } from "./GlassCard";

interface MagicalLoadingScreenProps {
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'minimal' | 'fullscreen';
}

export function MagicalLoadingScreen({ 
  title = "Welcome to SoundScape", 
  subtitle = "Your musical journey is about to begin...",
  variant = 'default'
}: MagicalLoadingScreenProps) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center p-8">
        <GlassLoader size="lg" />
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen page-background flex items-center justify-center">
        <div className="glass-card text-center space-y-6 max-w-md mx-4 animate-glass-in">
          <GlassLoader size="lg" className="mx-auto" />
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gradient">
              {title}
            </h2>
            <p className="text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="min-h-screen page-background flex items-center justify-center">
      <div className="glass-card text-center space-y-6 max-w-md mx-4 animate-glass-in">
        <GlassLoader size="lg" className="mx-auto" />
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gradient">
            {title}
          </h2>
          <p className="text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
