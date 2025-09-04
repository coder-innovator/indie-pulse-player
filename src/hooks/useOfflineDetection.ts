import { useState, useEffect, useCallback } from 'react';
import { useEnhancedPlayerStore } from '@/stores/enhancedPlayerStore';
import { useToast } from '@/hooks/use-toast';

/**
 * Offline Detection Hook
 * Monitors network connectivity and provides graceful degradation
 * - Detects online/offline state
 * - Manages cached content
 * - Provides offline-friendly UI states
 * - Handles connectivity recovery
 */

interface OfflineState {
  isOnline: boolean;
  isOffline: boolean;
  lastOnlineAt: number;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface OfflineDetectionOptions {
  pingUrl?: string;
  pingInterval?: number;
  showToasts?: boolean;
  enableNetworkInfo?: boolean;
}

export const useOfflineDetection = (options: OfflineDetectionOptions = {}) => {
  const {
    pingUrl = '/api/ping',
    pingInterval = 30000, // 30 seconds
    showToasts = true,
    enableNetworkInfo = true,
  } = options;
  
  const { toast } = useToast();
  const { setOfflineState, offlineState: storeOfflineState } = useEnhancedPlayerStore();
  
  // Local state
  const [offlineState, setLocalOfflineState] = useState<OfflineState>({
    isOnline: navigator.onLine,
    isOffline: !navigator.onLine,
    lastOnlineAt: navigator.onLine ? Date.now() : 0,
  });
  
  // Update network information
  const updateNetworkInfo = useCallback(() => {
    if (!enableNetworkInfo || !('connection' in navigator)) {
      return;
    }
    
    const connection = (navigator as any).connection;
    if (connection) {
      setLocalOfflineState(prev => ({
        ...prev,
        connectionType: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      }));
    }
  }, [enableNetworkInfo]);
  
  // Ping server to verify connectivity
  const pingServer = useCallback(async (): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(pingUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Server ping failed:', error);
      return false;
    }
  }, [pingUrl]);
  
  // Handle online state change
  const handleOnline = useCallback(async () => {
    console.log('Network: Online event detected');
    
    // Verify with server ping
    const serverReachable = await pingServer();
    
    const newState: OfflineState = {
      ...offlineState,
      isOnline: serverReachable,
      isOffline: !serverReachable,
      lastOnlineAt: serverReachable ? Date.now() : offlineState.lastOnlineAt,
    };
    
    setLocalOfflineState(newState);
    
    // Update store
    setOfflineState({
      isOffline: !serverReachable,
      lastOnlineAt: serverReachable ? Date.now() : storeOfflineState.lastOnlineAt,
    });
    
    if (serverReachable && showToasts) {
      toast({
        title: 'Back online',
        description: 'Connection restored. All features are available.',
      });
    }
    
    updateNetworkInfo();
  }, [offlineState, pingServer, setOfflineState, storeOfflineState, showToasts, toast, updateNetworkInfo]);
  
  // Handle offline state change
  const handleOffline = useCallback(() => {
    console.log('Network: Offline event detected');
    
    const newState: OfflineState = {
      ...offlineState,
      isOnline: false,
      isOffline: true,
    };
    
    setLocalOfflineState(newState);
    
    // Update store
    setOfflineState({
      isOffline: true,
    });
    
    if (showToasts) {
      toast({
        title: 'You\'re offline',
        description: 'Some features may be limited. Cached content is still available.',
        variant: 'destructive',
      });
    }
  }, [offlineState, setOfflineState, showToasts, toast]);
  
  // Periodic connectivity check
  const checkConnectivity = useCallback(async () => {
    if (!navigator.onLine) {
      return;
    }
    
    const serverReachable = await pingServer();
    
    if (serverReachable !== offlineState.isOnline) {
      if (serverReachable) {
        handleOnline();
      } else {
        handleOffline();
      }
    }
  }, [offlineState.isOnline, pingServer, handleOnline, handleOffline]);
  
  // Force refresh connectivity status
  const refreshConnectivity = useCallback(async () => {
    const browserOnline = navigator.onLine;
    const serverReachable = browserOnline ? await pingServer() : false;
    
    const newState: OfflineState = {
      ...offlineState,
      isOnline: serverReachable,
      isOffline: !serverReachable,
      lastOnlineAt: serverReachable ? Date.now() : offlineState.lastOnlineAt,
    };
    
    setLocalOfflineState(newState);
    setOfflineState({
      isOffline: !serverReachable,
      lastOnlineAt: serverReachable ? Date.now() : storeOfflineState.lastOnlineAt,
    });
    
    updateNetworkInfo();
    
    return serverReachable;
  }, [offlineState, pingServer, setOfflineState, storeOfflineState, updateNetworkInfo]);
  
  // Get offline duration
  const getOfflineDuration = useCallback((): number => {
    if (offlineState.isOnline) return 0;
    return Date.now() - (offlineState.lastOnlineAt || Date.now());
  }, [offlineState]);
  
  // Check if content should be available offline
  const isContentAvailable = useCallback((contentId: string): boolean => {
    return storeOfflineState.cachedTracks.includes(contentId);
  }, [storeOfflineState.cachedTracks]);
  
  // Get connection quality description
  const getConnectionQuality = useCallback((): string => {
    if (offlineState.isOffline) return 'Offline';
    if (!offlineState.effectiveType) return 'Online';
    
    switch (offlineState.effectiveType) {
      case 'slow-2g':
        return 'Very slow';
      case '2g':
        return 'Slow';
      case '3g':
        return 'Good';
      case '4g':
        return 'Fast';
      default:
        return 'Online';
    }
  }, [offlineState]);
  
  // Setup event listeners
  useEffect(() => {
    // Browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Network information changes
    if (enableNetworkInfo && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        connection.addEventListener('change', updateNetworkInfo);
      }
    }
    
    // Periodic connectivity check
    const intervalId = setInterval(checkConnectivity, pingInterval);
    
    // Initial network info update
    updateNetworkInfo();
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (enableNetworkInfo && 'connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          connection.removeEventListener('change', updateNetworkInfo);
        }
      }
      
      clearInterval(intervalId);
    };
  }, [
    handleOnline,
    handleOffline,
    updateNetworkInfo,
    checkConnectivity,
    pingInterval,
    enableNetworkInfo,
  ]);
  
  return {
    // State
    isOnline: offlineState.isOnline,
    isOffline: offlineState.isOffline,
    lastOnlineAt: offlineState.lastOnlineAt,
    connectionType: offlineState.connectionType,
    effectiveType: offlineState.effectiveType,
    downlink: offlineState.downlink,
    rtt: offlineState.rtt,
    
    // Methods
    refreshConnectivity,
    getOfflineDuration,
    isContentAvailable,
    getConnectionQuality,
    
    // Computed values
    offlineDuration: getOfflineDuration(),
    connectionQuality: getConnectionQuality(),
    
    // Cache info
    cachedTracksCount: storeOfflineState.cachedTracks.length,
    cachedTracks: storeOfflineState.cachedTracks,
  };
};

/**
 * Hook for components that need offline-aware behavior
 */
export const useOfflineAware = () => {
  const { isOnline, isOffline, isContentAvailable } = useOfflineDetection();
  
  const shouldShowContent = useCallback((contentId?: string): boolean => {
    if (isOnline) return true;
    if (!contentId) return false;
    return isContentAvailable(contentId);
  }, [isOnline, isContentAvailable]);
  
  const getOfflineMessage = useCallback((feature: string): string => {
    return `${feature} is not available offline. Connect to the internet to access this feature.`;
  }, []);
  
  return {
    isOnline,
    isOffline,
    shouldShowContent,
    getOfflineMessage,
  };
};
