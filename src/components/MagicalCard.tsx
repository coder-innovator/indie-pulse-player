import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface MagicalCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'glow' | 'shimmer';
  interactive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const MagicalCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  interactive = true,
  onClick,
  disabled = false
}: MagicalCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || disabled) return;
    
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      setMousePosition({
        x: (x - centerX) / centerX,
        y: (y - centerY) / centerY,
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'glass':
        return 'glass-effect border-gradient backdrop-blur-md';
      case 'glow':
        return 'glow-card backdrop-blur-sm';
      case 'shimmer':
        return 'shimmer bg-gradient-to-br from-purple-950/50 to-blue-950/50 border border-purple-500/20 backdrop-blur-sm';
      default:
        return 'bg-card border border-border';
    }
  };

  const getInteractiveClasses = () => {
    if (!interactive || disabled) return '';
    
    return cn(
      'cursor-pointer transition-all duration-300',
      'hover:scale-[1.02] hover:shadow-lg',
      'active:scale-[0.98]',
      'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-background'
    );
  };

  const getTransformStyle = () => {
    if (!interactive || disabled || !isHovered) return {};
    
    const rotateX = mousePosition.y * 10;
    const rotateY = -mousePosition.x * 10;
    const translateZ = 20;
    
    return {
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
    };
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative rounded-xl overflow-hidden transition-all duration-300',
        getVariantClasses(),
        getInteractiveClasses(),
        className
      )}
      style={getTransformStyle()}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      tabIndex={interactive && !disabled ? 0 : undefined}
    >
      {/* Background glow effect */}
      {variant === 'glow' && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}

      {/* Shimmer overlay */}
      {variant === 'shimmer' && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
      )}

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>

      {/* Hover glow effect */}
      {interactive && !disabled && (
        <div 
          className={cn(
            'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none',
            'bg-gradient-to-br from-purple-500/20 to-blue-500/20',
            isHovered && 'opacity-100'
          )}
        />
      )}

      {/* Border glow on hover */}
      {interactive && !disabled && (
        <div 
          className={cn(
            'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 pointer-events-none',
            'border-2 border-transparent',
            'bg-gradient-to-br from-purple-500 to-blue-500 bg-clip-border',
            isHovered && 'opacity-100'
          )}
        />
      )}
    </div>
  );
};

// Specialized card variants
export const GlassCard = ({ children, ...props }: Omit<MagicalCardProps, 'variant'>) => (
  <MagicalCard variant="glass" {...props}>
    {children}
  </MagicalCard>
);

export const GlowCard = ({ children, ...props }: Omit<MagicalCardProps, 'variant'>) => (
  <MagicalCard variant="glow" {...props}>
    {children}
  </MagicalCard>
);

export const ShimmerCard = ({ children, ...props }: Omit<MagicalCardProps, 'variant'>) => (
  <MagicalCard variant="shimmer" {...props}>
    {children}
  </MagicalCard>
);

// Interactive card with magnetic effect
export const MagneticCard = ({ children, ...props }: MagicalCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const strength = 0.1;
    cardRef.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'translate(0px, 0px)';
    }
    setIsHovered(false);
  };

  return (
    <MagicalCard
      ref={cardRef}
      {...props}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'transition-transform duration-200 ease-out',
        props.className
      )}
    >
      {children}
    </MagicalCard>
  );
};
