import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/Skeleton";
import Navigation from "./components/Navigation";
import AudioPlayer from "./components/AudioPlayer";
import { EnhancedAudioPlayer } from "./components/EnhancedAudioPlayer";
import { MiniPlayer } from "./components/MiniPlayer";
import { QueueManager } from "./components/QueueManager";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthProvider from "./contexts/AuthContext";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useOfflineDetection } from "./hooks/useOfflineDetection";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load pages for better performance
const Artist = lazy(() => import("./pages/Artist"));
const Trending = lazy(() => import("./pages/Trending"));
const Scenes = lazy(() => import("./pages/Scenes"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const Profile = lazy(() => import("./pages/Profile"));
const Upload = lazy(() => import("./pages/Upload"));
const Library = lazy(() => import("./pages/Library"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Simple fallback component
const SimpleFallback = () => (
  <div className="min-h-screen bg-blue-900 text-white flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Loading...</h1>
      <p className="text-xl">Please wait while the app loads</p>
    </div>
  </div>
);

const App = () => {
  // Enable global keyboard shortcuts
  useKeyboardShortcuts({ enabled: true });
  
  // Enable offline detection
  useOfflineDetection({ showToasts: true });
  
  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Navigation />
            <Suspense fallback={<SimpleFallback />}>
              <Routes>
                {/* Public routes */}
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/auth" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Auth />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/artist/:id" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Artist />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/trending" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Trending />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/scenes" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <Scenes />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/search" 
                  element={
                    <ProtectedRoute requireAuth={false}>
                      <SearchResults />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Protected routes - require authentication */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/upload" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Upload />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/library" 
                  element={
                    <ProtectedRoute requireAuth={true}>
                      <Library />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            {/* Enhanced Audio System - Always available */}
            <EnhancedAudioPlayer />
            <MiniPlayer />
            
            {/* Queue Manager - Positioned overlay */}
            <div className="fixed top-20 right-4 z-30">
              <QueueManager compact={true} />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;
