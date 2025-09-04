import { cn } from '@/lib/utils';

// Base skeleton component
interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton = ({ className, children }: SkeletonProps) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-secondary',
        className
      )}
    >
      {children}
    </div>
  );
};

// Track card skeleton
export const TrackCardSkeleton = () => {
  return (
    <div className="card-secondary p-4 space-y-4">
      {/* Cover image skeleton */}
      <Skeleton className="aspect-square w-full rounded-lg" />
      
      {/* Title skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      
      {/* Badge skeleton */}
      <Skeleton className="h-5 w-20" />
    </div>
  );
};

// Artist card skeleton
export const ArtistCardSkeleton = () => {
  return (
    <div className="card-artist p-6 space-y-4">
      {/* Avatar skeleton */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
};

// Scene card skeleton
export const SceneCardSkeleton = () => {
  return (
    <div className="card-scene p-6 space-y-4">
      {/* Header skeleton */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-16" />
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
};

// Stats card skeleton
export const StatsCardSkeleton = () => {
  return (
    <div className="card-stats p-6 text-center space-y-2">
      <Skeleton className="h-8 w-16 mx-auto" />
      <Skeleton className="h-4 w-20 mx-auto" />
    </div>
  );
};

// Filter section skeleton
export const FilterSectionSkeleton = () => {
  return (
    <div className="filter-section space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
      
      {/* Quick filters skeleton */}
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32" />
        ))}
      </div>
      
      {/* Advanced filters skeleton */}
      <div className="grid-stats">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Tabs skeleton
export const TabsSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Tab list skeleton */}
      <div className="enhanced-tabs grid w-full grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
      
      {/* Tab content skeleton */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        
        {/* Stats grid skeleton */}
        <div className="grid-stats">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatsCardSkeleton key={i} />
          ))}
        </div>
        
        {/* Tracks grid skeleton */}
        <div className="grid-responsive">
          {Array.from({ length: 10 }).map((_, i) => (
            <TrackCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Page skeleton
export const PageSkeleton = () => {
  return (
    <div className="min-h-screen page-background">
      {/* Header skeleton */}
      <header className="enhanced-header">
        <div className="responsive-container py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </header>
      
      {/* Hero section skeleton */}
      <section className="enhanced-hero">
        <div className="responsive-container text-center max-w-4xl mx-auto space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Skeleton className="w-14 h-14 rounded-full" />
              <Skeleton className="h-16 w-80" />
            </div>
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
        </div>
      </section>
      
      {/* Content skeleton */}
      <div className="responsive-container responsive-section">
        <FilterSectionSkeleton />
      </div>
      
      <div className="responsive-container responsive-section">
        <TabsSkeleton />
      </div>
    </div>
  );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => {
  return (
    <div className="space-y-3">
      {/* Header skeleton */}
      <div className="grid grid-cols-4 gap-4 p-4 border-b border-border-medium">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Rows skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-4 gap-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Form skeleton
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
};

// List skeleton
export const ListSkeleton = ({ items = 5 }: { items?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border border-border-medium rounded-lg">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
};
