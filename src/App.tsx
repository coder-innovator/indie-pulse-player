import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PageSkeleton } from "./components/Skeleton";
import Navigation from "./components/Navigation";
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

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navigation />
          <Suspense fallback={<SimpleFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/artist/:id" element={<Artist />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/scenes" element={<Scenes />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/library" element={<Library />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
