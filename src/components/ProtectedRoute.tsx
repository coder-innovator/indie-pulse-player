import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertCircle } from 'lucide-react';

/**
 * Protected Route Component
 * Features:
 * - Redirects to login when unauthorized
 * - Prevents flashing of protected content
 * - Loading states during auth checks
 * - Prevents infinite redirect loops
 * - Maintains intended destination after login
 */

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

/**
 * Loading skeleton for protected routes
 * Prevents content flash while checking authentication
 */
const AuthLoadingSkeleton = () => (
  <div className="min-h-screen bg-background">
    {/* Header skeleton */}
    <div className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>

    {/* Content skeleton */}
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Shield className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 mx-auto" />
              <Skeleton className="h-4 w-64 mx-auto" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-2 w-full rounded-full" />
              <div className="flex justify-between text-xs">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

/**
 * Error state for authentication failures
 */
const AuthErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-background flex items-center justify-center p-4">
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Authentication Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={onRetry}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 
                     px-4 py-2 rounded-md transition-colors duration-200"
        >
          Try Again
        </button>
      </CardContent>
    </Card>
  </div>
);

/**
 * Protected Route Component
 * Wraps components that require authentication
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/auth',
  fallback,
}) => {
  const { isAuthenticated, loading, error, refreshSession, clearError } = useAuth();
  const location = useLocation();
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  /**
   * Handle authentication retry
   * Attempts to refresh session on error
   */
  const handleRetry = async () => {
    clearError();
    setHasAttemptedAuth(false);
    const success = await refreshSession();
    if (!success) {
      setHasAttemptedAuth(true);
    }
  };

  /**
   * Set up redirect path preservation
   * Saves intended destination for post-login redirect
   */
  useEffect(() => {
    if (!isAuthenticated && requireAuth && !loading) {
      // Store the current path for redirect after login
      const currentPath = location.pathname + location.search;
      if (currentPath !== redirectTo && currentPath !== '/') {
        sessionStorage.setItem('auth_redirect_path', currentPath);
      }
    }
  }, [isAuthenticated, requireAuth, loading, location, redirectTo]);

  /**
   * Prevent infinite redirect loops
   * Tracks authentication attempts to avoid loops
   */
  useEffect(() => {
    if (!loading && !hasAttemptedAuth) {
      setHasAttemptedAuth(true);
    }
  }, [loading, hasAttemptedAuth]);

  /**
   * Handle redirect determination
   * Decides where to redirect based on auth state
   */
  useEffect(() => {
    if (!loading && hasAttemptedAuth && requireAuth && !isAuthenticated) {
      // Determine redirect path
      const searchParams = new URLSearchParams();
      const currentPath = location.pathname + location.search;
      
      if (currentPath !== redirectTo && currentPath !== '/') {
        searchParams.set('redirect', currentPath);
      }
      
      const redirectUrl = redirectTo + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      setRedirectPath(redirectUrl);
    }
  }, [loading, hasAttemptedAuth, requireAuth, isAuthenticated, location, redirectTo]);

  // Show loading state while checking authentication
  if (loading || !hasAttemptedAuth) {
    return fallback || <AuthLoadingSkeleton />;
  }

  // Show error state if authentication failed
  if (error && hasAttemptedAuth) {
    return <AuthErrorState error={error} onRetry={handleRetry} />;
  }

  // Redirect to login if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated && redirectPath) {
    console.log('Redirecting to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Redirect authenticated users away from auth pages
  if (!requireAuth && isAuthenticated && location.pathname === '/auth') {
    const redirectPath = sessionStorage.getItem('auth_redirect_path') || '/dashboard';
    sessionStorage.removeItem('auth_redirect_path');
    console.log('Redirecting authenticated user to:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  // Render protected content
  return <>{children}</>;
};

/**
 * Higher-order component for protecting routes
 * Alternative usage pattern for route protection
 */
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAuth?: boolean;
    redirectTo?: string;
    fallback?: React.ReactNode;
  }
) => {
  const WrappedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
  
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for checking route protection status
 * Useful for conditional rendering within components
 */
export const useRouteProtection = () => {
  const { isAuthenticated, loading, error } = useAuth();
  
  return {
    isAuthenticated,
    loading,
    error,
    canAccess: (requireAuth: boolean = true) => {
      if (loading) return null; // Still checking
      return requireAuth ? isAuthenticated : true;
    },
  };
};

export default ProtectedRoute;
