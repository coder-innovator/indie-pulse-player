import { useState, useEffect } from 'react';
import { Music, Sparkles, Zap, Star } from 'lucide-react';

interface MagicalLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'liquid' | 'particles' | 'beat' | 'frequency';
  className?: string;
}

export const MagicalLoader = ({ 
  size = 'md', 
  variant = 'liquid',
  className = '' 
}: MagicalLoaderProps) => {
  const [beat, setBeat] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (variant === 'beat') {
      const interval = setInterval(() => {
        setBeat(prev => (prev + 1) % 4);
      }, 150);
      return () => clearInterval(interval);
    }

    if (variant === 'particles') {
      const newParticles = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: i * 0.1,
      }));
      setParticles(newParticles);
    }
  }, [variant]);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const renderLoader = () => {
    switch (variant) {
      case 'liquid':
        return (
          <div className={`liquid-loader ${sizeClasses[size]} ${className}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Music className="w-1/2 h-1/2 text-white animate-pulse" />
            </div>
          </div>
        );

      case 'particles':
        return (
          <div className={`relative ${sizeClasses[size]} ${className}`}>
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-2 h-2 bg-purple-400 rounded-full animate-ping"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  animationDelay: `${particle.delay}s`,
                  animationDuration: '1.5s',
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <Music className="w-1/3 h-1/3 text-purple-400" />
            </div>
          </div>
        );

      case 'beat':
        return (
          <div className={`flex items-center gap-1 ${className}`}>
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-8 bg-gradient-to-t from-purple-400 to-purple-600 rounded-full transition-all duration-150 ${
                  beat === i ? 'scale-y-125 opacity-100' : 'scale-y-75 opacity-60'
                }`}
              />
            ))}
          </div>
        );

      case 'frequency':
        return (
          <div className={`flex items-end gap-1 ${sizeClasses[size]} ${className}`}>
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t from-purple-400 to-purple-600 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 60 + 20}%`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.8s',
                }}
              />
            ))}
          </div>
        );

      default:
        return (
          <div className={`liquid-loader ${sizeClasses[size]} ${className}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Music className="w-1/2 h-1/2 text-white animate-pulse" />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-center">
      {renderLoader()}
    </div>
  );
};

// Enhanced loading screen component
export const MagicalLoadingScreen = ({ 
  message = "Loading your musical journey...",
  showProgress = true 
}: { 
  message?: string; 
  showProgress?: boolean;
}) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState(message);

  useEffect(() => {
    if (showProgress) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      return () => clearInterval(interval);
    }

    // Rotate loading messages
    const messages = [
      "Tuning the instruments...",
      "Setting the stage...",
      "Preparing the magic...",
      "Almost there...",
    ];

    const textInterval = setInterval(() => {
      setLoadingText(prev => {
        const currentIndex = messages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % messages.length;
        return messages[nextIndex];
      });
    }, 2000);

    return () => clearInterval(textInterval);
  }, [showProgress, message]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
      <MagicalBackground particleCount={20} />
      
      <div className="relative z-10 text-center space-y-8">
        {/* Main loader */}
        <div className="space-y-6">
          <MagicalLoader size="lg" variant="liquid" />
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-white fluid-text">
              {loadingText}
            </h2>
            
            {showProgress && (
              <div className="space-y-2">
                <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-white/80 text-sm">{Math.round(progress)}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Floating elements */}
        <div className="flex items-center justify-center space-x-8">
          <div className="floating-note text-purple-400">
            <Music className="w-8 h-8" />
          </div>
          <div className="floating-note text-yellow-400" style={{ animationDelay: '1s' }}>
            <Star className="w-6 h-6" />
          </div>
          <div className="floating-note text-blue-400" style={{ animationDelay: '2s' }}>
            <Sparkles className="w-7 h-7" />
          </div>
        </div>
      </div>
    </div>
  );
};
