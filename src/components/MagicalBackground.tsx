import { useEffect, useState } from 'react';
import { Music, Star, Sparkles, Zap } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  type: 'music' | 'star' | 'sparkle' | 'zap';
  delay: number;
}

interface MagicalBackgroundProps {
  particleCount?: number;
  className?: string;
}

export const MagicalBackground = ({ 
  particleCount = 15, 
  className = '' 
}: MagicalBackgroundProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Initialize particles
    const initialParticles: Particle[] = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 20 + 10,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.6 + 0.2,
      type: ['music', 'star', 'sparkle', 'zap'][Math.floor(Math.random() * 4)] as Particle['type'],
      delay: Math.random() * 2000,
    }));

    setParticles(initialParticles);

    // Animation loop
    let animationId: number;
    const animate = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + particle.speedX;
          let newY = particle.y + particle.speedY;
          let newRotation = particle.rotation + particle.rotationSpeed;

          // Wrap around screen edges
          if (newX < -50) newX = window.innerWidth + 50;
          if (newX > window.innerWidth + 50) newX = -50;
          if (newY < -50) newY = window.innerHeight + 50;
          if (newY > window.innerHeight + 50) newY = -50;

          return {
            ...particle,
            x: newX,
            y: newY,
            rotation: newRotation,
          };
        })
      );

      animationId = requestAnimationFrame(animate);
    };

    // Start animation after delay
    const timer = setTimeout(() => {
      animate();
    }, 1000);

    return () => {
      clearTimeout(timer);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [particleCount]);

  const getParticleIcon = (type: Particle['type']) => {
    switch (type) {
      case 'music':
        return <Music className="w-full h-full" />;
      case 'star':
        return <Star className="w-full h-full" />;
      case 'sparkle':
        return <Sparkles className="w-full h-full" />;
      case 'zap':
        return <Zap className="w-full h-full" />;
      default:
        return <Music className="w-full h-full" />;
    }
  };

  const getParticleColor = (type: Particle['type']) => {
    switch (type) {
      case 'music':
        return 'text-purple-400';
      case 'star':
        return 'text-yellow-400';
      case 'sparkle':
        return 'text-blue-400';
      case 'zap':
        return 'text-green-400';
      default:
        return 'text-purple-400';
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 dynamic-bg opacity-20" />
      
      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`floating-note ${getParticleColor(particle.type)}`}
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            transform: `rotate(${particle.rotation}deg)`,
            opacity: particle.opacity,
            animationDelay: `${particle.delay}ms`,
            animationDuration: `${6 + Math.random() * 4}s`,
          }}
        >
          {getParticleIcon(particle.type)}
        </div>
      ))}

      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
    </div>
  );
};
