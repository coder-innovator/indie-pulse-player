import { useState, useEffect, useCallback, useRef } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Authentication hook with comprehensive session management
 * Features:
 * - Persistent sessions across page refreshes
 * - Auto-refresh tokens before expiry
 * - Cross-tab synchronization
 * - Remember me functionality
 * - Comprehensive error handling
 * - Rate limiting awareness
 */

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  lastActivity: number;
}

interface SignInOptions {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface SignUpOptions {
  email: string;
  password: string;
  options?: {
    data?: Record<string, any>;
  };
}

// Constants
const SESSION_STORAGE_KEY = 'supabase.auth.token';
const REMEMBER_ME_KEY = 'soundscape.remember_me';
const LAST_ACTIVITY_KEY = 'soundscape.last_activity';
const TOKEN_REFRESH_BUFFER = 5 * 60 * 1000; // 5 minutes before expiry
const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

export const useAuth = () => {
  // State management
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
    isSessionExpired: false,
    lastActivity: Date.now(),
  });

  // Refs for cleanup and state management
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isRefreshingRef = useRef(false);
  const authListenerRef = useRef<{ data: { subscription: any } } | null>(null);

  /**
   * Update last activity timestamp
   * Used for session timeout management
   */
  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    setAuthState(prev => ({ ...prev, lastActivity: now }));
    localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
  }, []);

  /**
   * Clear all authentication data
   * Used during logout and error cleanup
   */
  const clearAuthData = useCallback(() => {
    setAuthState({
      user: null,
      session: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      isSessionExpired: false,
      lastActivity: Date.now(),
    });
    
    // Clear stored data
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    
    // Clear timeouts
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
      activityTimeoutRef.current = null;
    }
  }, []);

  /**
   * Handle authentication errors with retry logic
   * Provides user-friendly error messages and recovery
   */
  const handleAuthError = useCallback((error: AuthError | Error, context: string) => {
    console.error(`Auth error in ${context}:`, error);
    
    let errorMessage = 'An authentication error occurred';
    
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password';
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Please check your email and click the confirmation link';
    } else if (error.message.includes('Too many requests')) {
      errorMessage = 'Too many attempts. Please wait a moment and try again';
    } else if (error.message.includes('Network')) {
      errorMessage = 'Network error. Please check your connection';
    } else if (error.message.includes('refresh_token_not_found')) {
      errorMessage = 'Session expired. Please log in again';
      clearAuthData();
    } else if (error.message.includes('invalid_grant')) {
      errorMessage = 'Session expired. Please log in again';
      clearAuthData();
    }
    
    setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }));
  }, [clearAuthData]);

  /**
   * Schedule token refresh before expiry
   * Implements automatic token refresh with retry logic
   */
  const scheduleTokenRefresh = useCallback((session: Session) => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    if (!session.expires_at) return;
    
    const expiresAt = session.expires_at * 1000; // Convert to milliseconds
    const refreshAt = expiresAt - TOKEN_REFRESH_BUFFER;
    const timeUntilRefresh = refreshAt - Date.now();
    
    if (timeUntilRefresh > 0) {
      console.log(`Scheduling token refresh in ${Math.round(timeUntilRefresh / 1000)}s`);
      
      refreshTimeoutRef.current = setTimeout(async () => {
        await refreshSession();
      }, timeUntilRefresh);
    } else {
      // Token is already expired or about to expire, refresh immediately
      refreshSession();
    }
  }, []);

  /**
   * Refresh session with retry logic
   * Handles network errors and concurrent refresh attempts
   */
  const refreshSession = useCallback(async (retryCount = 0): Promise<boolean> => {
    if (isRefreshingRef.current) {
      console.log('Refresh already in progress, skipping');
      return false;
    }
    
    isRefreshingRef.current = true;
    
    try {
      console.log(`Refreshing session (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`);
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }
      
      if (data.session) {
        console.log('Session refreshed successfully');
        updateAuthState(data.session, data.user);
        retryCountRef.current = 0;
        return true;
      } else {
        throw new Error('No session returned from refresh');
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      
      if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
        const delay = RETRY_DELAY * Math.pow(2, retryCount);
        console.log(`Retrying session refresh in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return refreshSession(retryCount + 1);
      } else {
        console.error('Max refresh attempts reached, clearing session');
        handleAuthError(error as AuthError, 'session refresh');
        clearAuthData();
        return false;
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [handleAuthError, clearAuthData]);

  /**
   * Update authentication state
   * Centralized state update with activity tracking and token scheduling
   */
  const updateAuthState = useCallback((session: Session | null, user: User | null) => {
    const isAuthenticated = !!(session && user);
    const isExpired = session ? (session.expires_at || 0) * 1000 < Date.now() : false;
    
    setAuthState(prev => ({
      ...prev,
      session,
      user,
      isAuthenticated,
      isSessionExpired: isExpired,
      loading: false,
      error: null,
    }));
    
    if (session && user) {
      updateLastActivity();
      scheduleTokenRefresh(session);
      
      // Store session if remember me is enabled
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
      if (rememberMe) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      }
    } else {
      clearAuthData();
    }
  }, [updateLastActivity, scheduleTokenRefresh, clearAuthData]);

  /**
   * Initialize authentication state
   * Checks for existing sessions and sets up listeners
   */
  const initializeAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        handleAuthError(error, 'session initialization');
        return;
      }
      
      if (session) {
        console.log('Existing session found');
        updateAuthState(session, session.user);
      } else {
        console.log('No existing session');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      handleAuthError(error as AuthError, 'initialization');
    }
  }, [handleAuthError, updateAuthState]);

  /**
   * Set up authentication listeners
   * Handles auth state changes and cross-tab synchronization
   */
  const setupAuthListeners = useCallback(() => {
    // Set up Supabase auth listener
    authListenerRef.current = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        switch (event) {
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            if (session) {
              updateAuthState(session, session.user);
            }
            break;
            
          case 'SIGNED_OUT':
            clearAuthData();
            break;
            
          case 'USER_UPDATED':
            if (session) {
              updateAuthState(session, session.user);
            }
            break;
            
          default:
            break;
        }
      }
    );
    
    // Set up storage listener for cross-tab synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY) {
        if (e.newValue === null) {
          // Session was cleared in another tab
          clearAuthData();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up activity tracking
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => updateLastActivity();
    
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });
    
    return () => {
      // Cleanup listeners
      if (authListenerRef.current) {
        authListenerRef.current.data.subscription.unsubscribe();
      }
      window.removeEventListener('storage', handleStorageChange);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [updateAuthState, clearAuthData, updateLastActivity]);

  /**
   * Sign in with email and password
   * Supports remember me functionality and comprehensive error handling
   */
  const signIn = useCallback(async ({ email, password, rememberMe = false }: SignInOptions) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      if (data.session && data.user) {
        // Store remember me preference
        localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
        
        updateAuthState(data.session, data.user);
        console.log('Sign in successful');
        return { success: true, data };
      } else {
        throw new Error('No session or user returned');
      }
    } catch (error) {
      console.error('Sign in failed:', error);
      handleAuthError(error as AuthError, 'sign in');
      return { success: false, error: error as AuthError };
    }
  }, [handleAuthError, updateAuthState]);

  /**
   * Sign up with email and password
   * Handles email confirmation and user metadata
   */
  const signUp = useCallback(async ({ email, password, options }: SignUpOptions) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options,
      });
      
      if (error) {
        throw error;
      }
      
      console.log('Sign up successful');
      return { success: true, data };
    } catch (error) {
      console.error('Sign up failed:', error);
      handleAuthError(error as AuthError, 'sign up');
      return { success: false, error: error as AuthError };
    }
  }, [handleAuthError]);

  /**
   * Sign out user
   * Clears all session data and notifies other tabs
   */
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        // Don't throw - still clear local data
      }
      
      clearAuthData();
      console.log('Sign out successful');
      return { success: true };
    } catch (error) {
      console.error('Sign out failed:', error);
      clearAuthData(); // Clear data anyway
      return { success: false, error: error as AuthError };
    }
  }, [clearAuthData]);

  /**
   * Reset password
   * Sends password reset email
   */
  const resetPassword = useCallback(async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?mode=reset`,
      });
      
      if (error) {
        throw error;
      }
      
      setAuthState(prev => ({ ...prev, loading: false }));
      console.log('Password reset email sent');
      return { success: true };
    } catch (error) {
      console.error('Password reset failed:', error);
      handleAuthError(error as AuthError, 'password reset');
      return { success: false, error: error as AuthError };
    }
  }, [handleAuthError]);

  /**
   * Clear authentication error
   * Used by components to dismiss error messages
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
    const cleanup = setupAuthListeners();
    
    return cleanup;
  }, [initializeAuth, setupAuthListeners]);

  // Session timeout management
  useEffect(() => {
    if (authState.isAuthenticated && authState.session) {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      activityTimeoutRef.current = setTimeout(() => {
        const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0');
        const timeSinceActivity = Date.now() - lastActivity;
        
        if (timeSinceActivity > ACTIVITY_TIMEOUT) {
          console.log('Session timed out due to inactivity');
          signOut();
        }
      }, ACTIVITY_TIMEOUT);
    }
    
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, [authState.isAuthenticated, authState.lastActivity, signOut]);

  return {
    // State
    user: authState.user,
    session: authState.session,
    loading: authState.loading,
    error: authState.error,
    isAuthenticated: authState.isAuthenticated,
    isSessionExpired: authState.isSessionExpired,
    
    // Actions
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
    clearError,
    
    // Utilities
    updateLastActivity,
  };
};
