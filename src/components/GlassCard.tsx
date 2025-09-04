import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'strong' | 'subtle';
  hover?: boolean;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true,
  glow = false,
  ...props
}) => {
  const baseClasses = "glass rounded-xl transition-all duration-300";
  
  const variantClasses = {
    default: "glass",
    strong: "glass-strong",
    subtle: "bg-card/50 backdrop-blur-sm border border-border/50"
  };
  
  const hoverClasses = hover ? "glass-hover" : "";
  const glowClasses = glow ? "animate-glow" : "";
  
  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        glowClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const GlassButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'subtle';
  disabled?: boolean;
}> = ({ 
  children, 
  onClick, 
  className, 
  variant = 'default',
  disabled = false
}) => {
  const baseClasses = "glass-button focus-ring disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    default: "text-foreground",
    primary: "bg-primary-gradient text-primary-foreground font-semibold",
    subtle: "text-muted-foreground hover:text-foreground"
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export const GlassLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };
  
  return (
    <div 
      className={cn(
        "glass rounded-lg loading-pulse animate-spin",
        sizeClasses[size],
        className
      )}
    >
      <div className="w-full h-full rounded-lg bg-primary-gradient opacity-75"></div>
    </div>
  );
};