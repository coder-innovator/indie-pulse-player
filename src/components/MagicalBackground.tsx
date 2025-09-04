import { useEffect, useState } from 'react';

interface WelcomingBackgroundProps {
  className?: string;
  variant?: 'default' | 'subtle' | 'minimal';
}

export const MagicalBackground = ({ 
  className = '',
  variant = 'default'
}: WelcomingBackgroundProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* Warm gradient background */}
      <div className="absolute inset-0 warm-gradient opacity-90" />
      
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/5 to-accent/5" />
      
      {/* Single ambient glow - warm and welcoming */}
      {variant !== 'minimal' && (
        <>
          <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse opacity-60" />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse opacity-40" style={{ animationDelay: '2s' }} />
        </>
      )}
      
      {/* Subtle noise texture for depth */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}
      />
    </div>
  );
};
