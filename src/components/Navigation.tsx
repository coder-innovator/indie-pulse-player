import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
// import { useAuth } from "@/hooks/useAuth";
import { 
  Music, 
  Upload, 
  LogOut, 
  LogIn, 
  Menu,
  X,
  Home,
  TrendingUp,
  MapPin,
  User,
  Heart,
  Search
} from "lucide-react";

const Navigation = () => {
  // const { user, signOut } = useAuth();
  const user = null; // Temporary fix
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { name: "Discover", href: "/", icon: Home },
    { name: "Trending", href: "/trending", icon: TrendingUp },
    { name: "Scenes", href: "/scenes", icon: MapPin },
    { name: "Search", href: "/search", icon: Search },
  ];

  const userMenuItems = [
    { name: "Profile", href: "/profile", icon: User },
    { name: "Library", href: "/library", icon: Heart },
    { name: "Upload", href: "/upload", icon: Upload },
    { name: "Dashboard", href: "/dashboard", icon: TrendingUp },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-700/50 bg-gray-900/95 backdrop-blur-md">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-200">
              <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                <Music className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">SoundScape</h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  asChild
                  className={`gap-2 transition-colors duration-200 ${
                    isActive(item.href) 
                      ? 'bg-white text-gray-900 hover:bg-gray-100' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Link to={item.href}>
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* Upload Button */}
                <Button asChild variant="outline" className="gap-2 hidden md:flex border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  <Link to="/upload">
                    <Upload className="w-4 h-4" />
                    Upload
                  </Link>
                </Button>

                {/* User Profile Dropdown */}
                <div className="relative group">
                  <Button variant="ghost" className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800">
                    <User className="w-4 h-4" />
                    Profile
                  </Button>
                </div>
              </>
            ) : (
              <Button asChild className="bg-white text-gray-900 hover:bg-gray-100">
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                    Navigate through the app
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-6">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.name}
                        variant={isActive(item.href) ? "default" : "ghost"}
                        asChild
                        className="justify-start gap-3"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link to={item.href}>
                          <Icon className="w-5 h-5" />
                          {item.name}
                        </Link>
                      </Button>
                    );
                  })}
                  
                  <div className="border-t pt-4 mt-4">
                    {user ? (
                      <>
                        {userMenuItems.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Button
                              key={item.name}
                              variant="ghost"
                              asChild
                              className="justify-start gap-3 w-full"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <Link to={item.href}>
                                <Icon className="w-5 h-5" />
                                {item.name}
                              </Link>
                            </Button>
                          );
                        })}
                        <Button
                          variant="ghost"
                          className="justify-start gap-3 w-full text-red-600 hover:text-red-700"
                          onClick={() => {
                            // signOut();
                            setMobileMenuOpen(false);
                          }}
                        >
                          <LogOut className="w-5 h-5" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <Button asChild className="justify-start gap-3 w-full">
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                          <LogIn className="w-5 h-5" />
                          Sign In
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
