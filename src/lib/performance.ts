/**
 * Performance optimization utilities for the SoundScape application
 */

// Debounce function for expensive operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

// Throttle function for scroll and resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Request animation frame wrapper for smooth animations
export const rafThrottle = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let ticking = false;
  
  return (...args: Parameters<T>) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        func(...args);
        ticking = false;
      });
      ticking = true;
    }
  };
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Lazy loading hook for images
export const useLazyImage = (src: string, placeholder: string = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setError(false);
    };
    
    img.onerror = () => {
      setError(true);
      setIsLoaded(false);
    };
    
    img.src = src;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);
  
  return { imageSrc, isLoaded, error };
};

// Virtual scrolling utilities
export const virtualScroll = {
  // Calculate visible range for virtual scrolling
  getVisibleRange: (
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number
  ) => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      totalItems
    );
    
    return {
      startIndex: Math.max(0, startIndex),
      endIndex,
      offsetY: startIndex * itemHeight
    };
  },
  
  // Get items to render based on visible range
  getVisibleItems: <T>(
    items: T[],
    startIndex: number,
    endIndex: number
  ): T[] => {
    return items.slice(startIndex, endIndex);
  }
};

// Memory management utilities
export const memoryManagement = {
  // Clear object references to help garbage collection
  clearReferences: (obj: Record<string, any>) => {
    Object.keys(obj).forEach(key => {
      delete obj[key];
    });
  },
  
  // WeakMap for storing data that can be garbage collected
  createWeakCache: <K extends object, V>() => {
    return new WeakMap<K, V>();
  },
  
  // Clear array while preserving reference
  clearArray: <T>(arr: T[]) => {
    arr.length = 0;
  }
};

// Performance monitoring
export const performanceMonitor = {
  // Measure execution time of a function
  measureTime: <T>(func: () => T, label: string): T => {
    const start = performance.now();
    const result = func();
    const end = performance.now();
    
    console.log(`${label} took ${(end - start).toFixed(2)}ms`);
    return result;
  },
  
  // Measure memory usage
  measureMemory: (label: string = 'Memory Usage') => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`${label}:`, {
        used: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`
      });
    }
  },
  
  // Performance mark and measure
  mark: (name: string) => {
    performance.mark(name);
  },
  
  measure: (name: string, startMark: string, endMark: string) => {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }
};

// Bundle size optimization
export const bundleOptimization = {
  // Dynamic import for code splitting
  dynamicImport: <T>(importFn: () => Promise<T>) => {
    return importFn();
  },
  
  // Preload critical resources
  preloadResource: (href: string, as: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
  },
  
  // Prefetch non-critical resources
  prefetchResource: (href: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
};

// Web Workers for heavy computations
export const workerUtils = {
  // Create a web worker
  createWorker: (workerScript: string) => {
    if (typeof Worker !== 'undefined') {
      return new Worker(workerScript);
    }
    return null;
  },
  
  // Execute heavy computation in worker
  executeInWorker: <T, R>(
    worker: Worker,
    data: T,
    onMessage: (result: R) => void,
    onError: (error: ErrorEvent) => void
  ) => {
    worker.onmessage = (event) => onMessage(event.data);
    worker.onerror = onError;
    worker.postMessage(data);
  }
};

// Service Worker utilities
export const serviceWorkerUtils = {
  // Register service worker
  register: async (scriptURL: string, options?: RegistrationOptions) => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(scriptURL, options);
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
    throw new Error('Service Workers not supported');
  },
  
  // Check if service worker is ready
  isReady: async (): Promise<boolean> => {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready;
      return true;
    }
    return false;
  }
};

// Cache management
export const cacheManagement = {
  // Set item in cache with expiration
  set: (key: string, value: any, ttl: number = 5 * 60 * 1000) => {
    const item = {
      value,
      timestamp: Date.now(),
      ttl
    };
    
    try {
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.warn('Failed to cache item:', error);
    }
  },
  
  // Get item from cache
  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      const now = Date.now();
      
      if (now - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(key);
        return null;
      }
      
      return parsed.value;
    } catch (error) {
      console.warn('Failed to retrieve cached item:', error);
      return null;
    }
  },
  
  // Clear expired cache items
  cleanup: () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            const now = Date.now();
            
            if (now - parsed.timestamp > parsed.ttl) {
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }
};

// Network optimization
export const networkOptimization = {
  // Retry failed requests with exponential backoff
  retryWithBackoff: async <T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  },
  
  // Batch multiple requests
  batchRequests: async <T>(
    requests: (() => Promise<T>)[],
    batchSize: number = 5
  ): Promise<T[]> => {
    const results: T[] = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(req => req()));
      results.push(...batchResults);
    }
    
    return results;
  }
};

// Import React hooks for the lazy image hook
import { useState, useEffect } from 'react';

// Export all utilities
export default {
  debounce,
  throttle,
  rafThrottle,
  createIntersectionObserver,
  useLazyImage,
  virtualScroll,
  memoryManagement,
  performanceMonitor,
  bundleOptimization,
  workerUtils,
  serviceWorkerUtils,
  cacheManagement,
  networkOptimization
};
