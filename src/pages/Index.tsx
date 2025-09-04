import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-md sticky top-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-700/50 rounded-lg border border-gray-600/50">
                <Music className="w-8 h-8 text-gray-300" />
              </div>
              <h1 className="text-2xl font-bold text-white">SoundScape</h1>
            </div>
            <Button onClick={() => navigate('/auth')} className="bg-white text-gray-900 hover:bg-gray-100">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-6xl mx-auto space-y-12">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight">
              Discover Your
              <span className="block text-gray-200">Sound</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 font-medium leading-relaxed max-w-4xl mx-auto">
              Unearth the next generation of music. From underground scenes to rising stars, 
              experience the raw energy of independent artists shaping the future of sound.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleGetStarted} className="text-lg px-8 py-4 bg-white text-gray-900 hover:bg-gray-100">
              Start Exploring
            </Button>
            <Button onClick={() => navigate('/scenes')} variant="outline" className="text-lg px-8 py-4 border-gray-500 text-white hover:bg-gray-800">
              Explore Scenes
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-700/50 bg-gray-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-500">
              © 2024 SoundScape. Discover the future of independent music.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}