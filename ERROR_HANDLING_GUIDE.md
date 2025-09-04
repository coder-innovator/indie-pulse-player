# 🛡️ Authentication Error Handling Guide

## Overview
This guide documents comprehensive error handling strategies for the SoundScape authentication system, covering input validation, runtime errors, network failures, state corruption, user feedback, and debugging.

---

## 📋 INPUT VALIDATION

### **What to Check Before Processing**

#### **Email Validation**
```typescript
// Location: Auth.tsx, useAuth.ts
const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  if (!email.includes('@')) return 'Please enter a valid email address';
  if (email.length < 5) return 'Email is too short';
  if (email.length > 254) return 'Email is too long';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email format';
  return null;
};
```

#### **Password Validation**
```typescript
// Location: Auth.tsx
const validatePassword = (password: string, isSignUp = false): string | null => {
  if (!password) return 'Password is required';
  
  if (isSignUp) {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
    if (!/(?=.*[!@#$%^&*])/.test(password)) return 'Password should contain a special character';
  }
  
  return null;
};
```

#### **Session Validation**
```typescript
// Location: useAuth.ts
const validateSession = (session: Session | null): boolean => {
  if (!session) return false;
  if (!session.access_token) return false;
  if (!session.expires_at) return false;
  if (session.expires_at * 1000 < Date.now()) return false;
  return true;
};
```

#### **Pre-Request Validation Checklist**
- ✅ Email format and length
- ✅ Password strength (sign-up only)
- ✅ Password confirmation match
- ✅ Network connectivity
- ✅ Rate limit status
- ✅ Session validity
- ✅ Required fields presence

---

## 🔧 RUNTIME ERRORS

### **Try-Catch Placement Strategy**

#### **Authentication Operations**
```typescript
// Location: useAuth.ts - signIn method
const signIn = useCallback(async ({ email, password, rememberMe = false }) => {
  try {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    // Supabase API call wrapped in try-catch
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error; // Convert Supabase error to exception
    
    if (!data.session || !data.user) {
      throw new Error('Authentication successful but no session received');
    }
    
    // State updates in try block
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
    updateAuthState(data.session, data.user);
    
    return { success: true, data };
    
  } catch (error) {
    // Comprehensive error handling
    console.error('Sign in failed:', error);
    handleAuthError(error as AuthError, 'sign in');
    return { success: false, error: error as AuthError };
  }
}, [handleAuthError, updateAuthState]);
```

#### **Session Refresh Operations**
```typescript
// Location: useAuth.ts - refreshSession method
const refreshSession = useCallback(async (retryCount = 0): Promise<boolean> => {
  // Prevent concurrent refresh attempts
  if (isRefreshingRef.current) return false;
  
  isRefreshingRef.current = true;
  
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) throw error;
    
    if (!data.session) {
      throw new Error('No session returned from refresh');
    }
    
    updateAuthState(data.session, data.user);
    return true;
    
  } catch (error) {
    console.error(`Session refresh failed (attempt ${retryCount + 1}):`, error);
    
    // Retry logic with exponential backoff
    if (retryCount < MAX_RETRY_ATTEMPTS - 1) {
      const delay = RETRY_DELAY * Math.pow(2, retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));
      return refreshSession(retryCount + 1);
    }
    
    // Final failure - clear session
    handleAuthError(error as AuthError, 'session refresh');
    clearAuthData();
    return false;
    
  } finally {
    isRefreshingRef.current = false; // Always reset flag
  }
}, [handleAuthError, clearAuthData]);
```

#### **Component Error Boundaries**
```typescript
// Location: ProtectedRoute.tsx
const AuthErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => {
  // Error recovery UI with retry mechanism
  const handleRetry = async () => {
    try {
      clearError();
      const success = await refreshSession();
      if (!success) {
        // Show persistent error if retry fails
        setHasAttemptedAuth(true);
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      // Show retry-specific error
    }
  };
  
  return (
    <div className="error-boundary">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2>Authentication Error</h2>
      <p>{error}</p>
      <button onClick={handleRetry}>Try Again</button>
    </div>
  );
};
```

---

## 🌐 NETWORK FAILURES

### **Retry Strategy Implementation**

#### **Exponential Backoff Pattern**
```typescript
// Location: useAuth.ts
const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s
const MAX_RETRY_ATTEMPTS = 3;

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  context: string,
  maxAttempts = MAX_RETRY_ATTEMPTS
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`${context} failed (attempt ${attempt + 1}/${maxAttempts}):`, error);
      
      // Don't retry on certain errors
      if (error.message.includes('Invalid login credentials') ||
          error.message.includes('Email not confirmed') ||
          error.message.includes('Too many requests')) {
        throw error;
      }
      
      // Wait before retry (except on last attempt)
      if (attempt < maxAttempts - 1) {
        const delay = RETRY_DELAYS[attempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};
```

#### **Network Status Detection**
```typescript
// Location: useAuth.ts - setupAuthListeners
const setupNetworkListener = () => {
  const handleOnline = () => {
    console.log('Network restored, checking session...');
    if (authState.isAuthenticated && authState.session) {
      // Verify session is still valid after network restoration
      refreshSession();
    }
  };
  
  const handleOffline = () => {
    console.log('Network lost, pausing auth operations');
    setAuthState(prev => ({ 
      ...prev, 
      error: 'Network connection lost. Retrying when connection is restored...' 
    }));
  };
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
```

#### **Request Timeout Handling**
```typescript
// Location: useAuth.ts
const withTimeout = <T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// Usage in auth operations
const signInWithTimeout = async (credentials) => {
  return withTimeout(
    supabase.auth.signInWithPassword(credentials),
    15000 // 15 second timeout
  );
};
```

---

## 🔄 STATE CORRUPTION

### **Recovery Methods**

#### **Session State Recovery**
```typescript
// Location: useAuth.ts
const recoverFromCorruptedState = useCallback(() => {
  console.warn('Attempting to recover from corrupted auth state');
  
  try {
    // Clear potentially corrupted localStorage
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    
    // Reset all timeouts
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    
    // Reset state to initial values
    setAuthState({
      user: null,
      session: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      isSessionExpired: false,
      lastActivity: Date.now(),
    });
    
    // Re-initialize from fresh state
    initializeAuth();
    
    console.log('Auth state recovery completed');
    
  } catch (error) {
    console.error('Failed to recover auth state:', error);
    // Force page reload as last resort
    window.location.reload();
  }
}, [initializeAuth]);
```

#### **Cross-Tab State Synchronization**
```typescript
// Location: useAuth.ts - setupAuthListeners
const handleStorageChange = (e: StorageEvent) => {
  if (e.key === SESSION_STORAGE_KEY) {
    if (e.newValue === null) {
      // Session cleared in another tab
      console.log('Session cleared in another tab, synchronizing...');
      clearAuthData();
    } else {
      try {
        const session = JSON.parse(e.newValue);
        if (validateSession(session)) {
          console.log('Session updated in another tab, synchronizing...');
          updateAuthState(session, session.user);
        }
      } catch (error) {
        console.error('Failed to parse session from storage:', error);
        recoverFromCorruptedState();
      }
    }
  }
};
```

#### **Memory Leak Prevention**
```typescript
// Location: useAuth.ts
useEffect(() => {
  // Cleanup function to prevent memory leaks
  return () => {
    // Clear all timeouts
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    
    // Unsubscribe from auth listener
    if (authListenerRef.current) {
      authListenerRef.current.data.subscription.unsubscribe();
    }
    
    // Remove event listeners
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.removeEventListener(event, updateLastActivity, true);
    });
    
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

---

## 💬 USER FEEDBACK

### **Exact Error Messages to Show**

#### **Authentication Errors**
```typescript
// Location: useAuth.ts - handleAuthError
const getErrorMessage = (error: AuthError): string => {
  const errorMessages = {
    // Supabase specific errors
    'Invalid login credentials': 'Invalid email or password. Please check your credentials and try again.',
    'Email not confirmed': 'Please check your email and click the confirmation link before signing in.',
    'Too many requests': 'Too many login attempts. Please wait 5 minutes before trying again.',
    'User not found': 'No account found with this email address. Please sign up first.',
    'Email already registered': 'An account with this email already exists. Please sign in instead.',
    'Weak password': 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.',
    
    // Network errors
    'Network request failed': 'Unable to connect to our servers. Please check your internet connection and try again.',
    'Request timeout': 'The request took too long to complete. Please check your connection and try again.',
    'Failed to fetch': 'Connection failed. Please check your internet connection and try again.',
    
    // Session errors
    'refresh_token_not_found': 'Your session has expired. Please sign in again.',
    'invalid_grant': 'Your session is no longer valid. Please sign in again.',
    'Session expired': 'Your session has expired for security reasons. Please sign in again.',
    
    // Rate limiting
    'Rate limit exceeded': 'Too many requests. Please wait a moment before trying again.',
    
    // Generic fallback
    'default': 'An unexpected error occurred. Please try again or contact support if the problem persists.'
  };
  
  // Find matching error message
  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.message.includes(key)) {
      return message;
    }
  }
  
  return errorMessages.default;
};
```

#### **Form Validation Messages**
```typescript
// Location: Auth.tsx
const validationMessages = {
  email: {
    required: 'Email address is required',
    invalid: 'Please enter a valid email address',
    tooShort: 'Email is too short',
    tooLong: 'Email is too long (max 254 characters)'
  },
  password: {
    required: 'Password is required',
    tooShort: 'Password must be at least 8 characters long',
    noUppercase: 'Password must contain at least one uppercase letter',
    noLowercase: 'Password must contain at least one lowercase letter',
    noNumber: 'Password must contain at least one number',
    noSpecial: 'Password should contain at least one special character (!@#$%^&*)',
    mismatch: 'Passwords do not match'
  },
  general: {
    required: 'This field is required',
    networkError: 'Network error. Please check your connection and try again.',
    unexpectedError: 'An unexpected error occurred. Please try again.'
  }
};
```

#### **Success Messages**
```typescript
// Location: Auth.tsx
const successMessages = {
  signIn: 'Welcome back! You have successfully signed in.',
  signUp: 'Account created! Please check your email to verify your account.',
  passwordReset: 'Password reset email sent. Please check your inbox.',
  emailVerified: 'Email verified successfully! You can now access all features.',
  sessionRefreshed: 'Session refreshed automatically.',
  loggedOut: 'You have been logged out successfully.'
};
```

---

## 📊 LOGGING

### **What to Log for Debugging**

#### **Authentication Events**
```typescript
// Location: useAuth.ts
const logAuthEvent = (event: string, details?: any) => {
  const logData = {
    timestamp: new Date().toISOString(),
    event,
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: authState.session?.access_token?.slice(-8), // Last 8 chars for privacy
    ...details
  };
  
  console.log(`[AUTH] ${event}:`, logData);
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // analytics.track('auth_event', logData);
  }
};

// Usage examples
logAuthEvent('sign_in_attempt', { email: email.split('@')[0] + '@***' });
logAuthEvent('sign_in_success', { method: 'email_password' });
logAuthEvent('sign_in_failure', { error: error.message, retryCount });
logAuthEvent('token_refresh_success', { expiresAt: session.expires_at });
logAuthEvent('session_expired', { lastActivity: authState.lastActivity });
```

#### **Error Logging with Context**
```typescript
// Location: useAuth.ts
const logError = (error: Error, context: string, additionalData?: any) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error.message,
      name: error.name,
      stack: error.stack
    },
    userAgent: navigator.userAgent,
    url: window.location.href,
    authState: {
      isAuthenticated: authState.isAuthenticated,
      loading: authState.loading,
      isSessionExpired: authState.isSessionExpired
    },
    ...additionalData
  };
  
  console.error(`[AUTH ERROR] ${context}:`, errorLog);
  
  // Send to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error, { extra: errorLog });
  }
};
```

#### **Performance Logging**
```typescript
// Location: useAuth.ts
const logPerformance = (operation: string, startTime: number, success: boolean) => {
  const duration = Date.now() - startTime;
  const perfLog = {
    operation,
    duration,
    success,
    timestamp: new Date().toISOString()
  };
  
  console.log(`[AUTH PERF] ${operation}: ${duration}ms`, perfLog);
  
  // Track performance metrics
  if (process.env.NODE_ENV === 'production') {
    // analytics.track('auth_performance', perfLog);
  }
};

// Usage in auth operations
const signIn = async (credentials) => {
  const startTime = Date.now();
  try {
    const result = await supabase.auth.signInWithPassword(credentials);
    logPerformance('sign_in', startTime, true);
    return result;
  } catch (error) {
    logPerformance('sign_in', startTime, false);
    throw error;
  }
};
```

#### **Security Event Logging**
```typescript
// Location: useAuth.ts
const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high', details?: any) => {
  const securityLog = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    ip: 'client-side', // Would be actual IP on server
    userAgent: navigator.userAgent,
    sessionId: authState.session?.access_token?.slice(-8),
    ...details
  };
  
  console.warn(`[SECURITY] ${event}:`, securityLog);
  
  // Send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // securityService.logEvent(securityLog);
  }
};

// Usage examples
logSecurityEvent('multiple_failed_attempts', 'medium', { attempts: failedAttempts });
logSecurityEvent('session_hijack_attempt', 'high', { suspiciousActivity: true });
logSecurityEvent('password_reset_requested', 'low', { email: sanitizedEmail });
```

---

## 🔍 DEBUGGING CHECKLIST

### **Common Issues and Solutions**

#### **Session Issues**
- ✅ Check localStorage for corrupted session data
- ✅ Verify token expiry times
- ✅ Confirm Supabase project configuration
- ✅ Check network connectivity
- ✅ Verify CORS settings

#### **Authentication Flow Issues**
- ✅ Validate email confirmation process
- ✅ Check redirect URLs configuration
- ✅ Verify password requirements
- ✅ Confirm rate limiting settings
- ✅ Check for JavaScript errors

#### **State Management Issues**
- ✅ Verify useEffect dependencies
- ✅ Check for memory leaks
- ✅ Confirm proper cleanup
- ✅ Validate cross-tab synchronization
- ✅ Check for race conditions

---

## 🚨 EMERGENCY PROCEDURES

### **Complete Auth System Recovery**
```typescript
// Emergency reset function - use only when all else fails
const emergencyAuthReset = () => {
  console.warn('EMERGENCY: Performing complete auth system reset');
  
  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Clear all cookies (if any)
  document.cookie.split(";").forEach(c => {
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });
  
  // Force page reload
  window.location.href = '/auth?emergency=true';
};
```

This comprehensive error handling system ensures robust, user-friendly authentication with proper debugging capabilities and recovery mechanisms.
