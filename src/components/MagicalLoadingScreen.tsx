import { MagicalBackground } from "./MagicalBackground";
import { MagicalLoader } from "./MagicalLoader";

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
        <MagicalLoader size="lg" variant="liquid" />
      </div>
    );
  }

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen page-background flex items-center justify-center">
        <MagicalBackground />
        <div className="relative z-10 text-center space-y-8">
          <div className="space-y-6">
            <MagicalLoader size="xl" variant="liquid" />
            <h2 className="text-3xl font-bold text-gradient fluid-text">
              {title}
            </h2>
            <p className="text-muted-foreground fluid-text-sm">
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
      <MagicalBackground />
      <div className="relative z-10 text-center space-y-8">
        <div className="space-y-6">
          <MagicalLoader size="lg" variant="liquid" />
          <h2 className="text-3xl font-bold text-gradient fluid-text">
            {title}
          </h2>
          <p className="text-muted-foreground fluid-text-sm">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
