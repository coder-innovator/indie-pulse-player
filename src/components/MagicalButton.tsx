import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MagicalButtonProps {
  children: React.ReactNode;
  variant?: 'default' | 'magic' | 'glow' | 'shimmer' | 'liquid';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const MagicalButton = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left'
}: MagicalButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    
    setIsPressed(true);
    
    if (variant === 'magic' || variant === 'liquid') {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const size = Math.max(rect.width, rect.height);
        
        const newRipple = {
          id: rippleId.current++,
          x,
          y,
          size,
        };
        
        setRipples(prev => [...prev, newRipple]);
        
        // Remove ripple after animation
        setTimeout(() => {
          setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);
      }
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'magic':
        return cn(
          'relative overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold',
          'hover:from-purple-600 hover:to-blue-600',
          'active:from-purple-700 active:to-blue-700',
          'transform transition-all duration-300',
          'hover:scale-105 hover:shadow-lg',
          'active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2'
        );
      
      case 'glow':
        return cn(
          'relative bg-purple-600 text-white font-semibold',
          'hover:bg-purple-700',
          'transform transition-all duration-300',
          'hover:scale-105',
          'shadow-lg hover:shadow-purple-500/50',
          'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2'
        );
      
      case 'shimmer':
        return cn(
          'relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold',
          'hover:from-purple-700 hover:to-blue-700',
          'transform transition-all duration-300',
          'hover:scale-105',
          'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2'
        );
      
      case 'liquid':
        return cn(
          'relative overflow-hidden bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 text-white font-semibold',
          'hover:from-purple-600 hover:via-blue-600 hover:to-purple-700',
          'transform transition-all duration-300',
          'hover:scale-105',
          'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2'
        );
      
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm';
      case 'md':
        return 'px-4 py-2 text-base';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconClasses = cn(
      'transition-transform duration-200',
      isHovered && 'scale-110',
      iconPosition === 'left' ? 'mr-2' : 'ml-2'
    );
    
    return (
      <span className={iconClasses}>
        {icon}
      </span>
    );
  };

  const renderRipples = () => {
    if (variant !== 'magic' && variant !== 'liquid') return null;
    
    return ripples.map((ripple) => (
      <span
        key={ripple.id}
        className="absolute rounded-full bg-white/30 animate-ping"
        style={{
          left: ripple.x - ripple.size / 2,
          top: ripple.y - ripple.size / 2,
          width: ripple.size,
          height: ripple.size,
        }}
      />
    ));
  };

  const renderShimmer = () => {
    if (variant !== 'shimmer') return null;
    
    return (
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
    );
  };

  const renderLiquidEffect = () => {
    if (variant !== 'liquid') return null;
    
    return (
      <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-blue-400/20 to-purple-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    );
  };

  return (
    <Button
      ref={buttonRef}
      className={cn(
        'group relative overflow-hidden transition-all duration-300',
        getVariantClasses(),
        getSizeClasses(),
        disabled && 'opacity-50 cursor-not-allowed',
        loading && 'cursor-wait',
        className
      )}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Background effects */}
      {renderShimmer()}
      {renderLiquidEffect()}
      
      {/* Ripple effects */}
      {renderRipples()}
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center">
        {icon && iconPosition === 'left' && renderIcon()}
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          children
        )}
        {icon && iconPosition === 'right' && renderIcon()}
      </div>
      
      {/* Hover glow effect */}
      {variant === 'glow' && (
        <div 
          className={cn(
            'absolute inset-0 rounded-md opacity-0 transition-opacity duration-300',
            'bg-gradient-to-r from-purple-400/20 to-blue-400/20',
            isHovered && 'opacity-100'
          )}
        />
      )}
    </Button>
  );
};

// Specialized button variants
export const MagicButton = ({ children, ...props }: Omit<MagicalButtonProps, 'variant'>) => (
  <MagicalButton variant="magic" {...props}>
    {children}
  </MagicalButton>
);

export const GlowButton = ({ children, ...props }: Omit<MagicalButtonProps, 'variant'>) => (
  <MagicalButton variant="glow" {...props}>
    {children}
  </MagicalButton>
);

export const ShimmerButton = ({ children, ...props }: Omit<MagicalButtonProps, 'variant'>) => (
  <MagicalButton variant="shimmer" {...props}>
    {children}
  </MagicalButton>
);

export const LiquidButton = ({ children, ...props }: Omit<MagicalButtonProps, 'variant'>) => (
  <MagicalButton variant="liquid" {...props}>
    {children}
  </MagicalButton>
);
