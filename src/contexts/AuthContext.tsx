import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session, AuthError } from '@supabase/supabase-js';

/**
 * Authentication Context Provider
 * Provides global access to authentication state and methods
 * Ensures consistent auth state across the entire application
 */

interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  
  // Actions
  signIn: (options: { email: string; password: string; rememberMe?: boolean }) => Promise<{ success: boolean; data?: any; error?: AuthError }>;
  signUp: (options: { email: string; password: string; options?: { data?: Record<string, any> } }) => Promise<{ success: boolean; data?: any; error?: AuthError }>;
  signOut: () => Promise<{ success: boolean; error?: AuthError }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: AuthError }>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
  
  // Utilities
  updateLastActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Wraps the app to provide authentication context
 */
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 * Throws error if used outside of AuthProvider
 */
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * HOC to inject auth context as props
 * Alternative pattern for class components or when hooks aren't suitable
 */
export const withAuthContext = <P extends object>(
  Component: React.ComponentType<P & { auth: AuthContextType }>
) => {
  const WrappedComponent = (props: P) => {
    const auth = useAuthContext();
    return <Component {...props} auth={auth} />;
  };
  
  WrappedComponent.displayName = `withAuthContext(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default AuthProvider;
