import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Bookmark, BarChart3, LogOut, ChevronDown, MessageCircle, TestTube, Home, GraduationCap, Image, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setProfileDropdownOpen(false);
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      // Force navigation even on error
      navigate("/", { replace: true });
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const publicLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/learning', label: 'Learning', icon: GraduationCap },
    { to: '/materials', label: 'Materials', icon: Image },
    { to: '/about', label: 'About', icon: Info },
  ];

  const authLinks = [
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/tests', label: 'Tests', icon: TestTube },
    { to: '/progress', label: 'Progress', icon: BarChart3 },
    { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      {/* Bar 1 - Main Navigation */}
      <div className="bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🌌</span>
              <span className="text-white font-bold text-lg hidden sm:block">
                Ethio-Cosmos
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive(link.to)
                      ? 'text-orange-500'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5 transition-colors"
                  >
                    {profile?.avatarUrl ? (
                      <img
                        src={profile.avatarUrl}
                        alt={profile.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium">
                        {profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-gray-300 text-sm hidden sm:block">
                      {profile?.username}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-white/10 rounded-lg shadow-xl py-2">
                      <div className="px-4 py-2 border-b border-white/10">
                        <p className="text-white font-medium">{profile?.username}</p>
                        <p className="text-gray-400 text-sm">{profile?.email}</p>
                      </div>
                      
                      <Link
                        to="/progress"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        <BarChart3 className="w-4 h-4" />
                        Progress
                      </Link>
                      <Link
                        to="/bookmarks"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-white/5 hover:text-white"
                      >
                        <Bookmark className="w-4 h-4" />
                        Bookmarks
                      </Link>
                      
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-orange-500 hover:bg-white/5"
                        >
                          <User className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      )}
                      
                      <div className="border-t border-white/10 mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-white/5 w-full text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="text-gray-300 hover:text-white"
                  >
                    Log In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => navigate('/login')}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Sign Up
                  </Button>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bar 2 - Secondary Navigation (Auth Links) */}
      {user && (
        <div className="bg-slate-950/60 backdrop-blur-md border-b border-white/10 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-1 h-12">
              {authLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'px-4 py-2 text-sm font-medium transition-colors relative',
                    isActive(link.to)
                      ? 'text-orange-500'
                      : 'text-gray-400 hover:text-white'
                  )}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-orange-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 backdrop-blur-md border-b border-white/10">
          <div className="px-4 py-4 space-y-2">
            {publicLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium',
                  isActive(link.to)
                    ? 'text-orange-500 bg-orange-500/10'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                )}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
            
            {user && (
              <>
                <div className="border-t border-white/10 my-2 pt-2" />
                {authLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium',
                      isActive(link.to)
                        ? 'text-orange-500 bg-orange-500/10'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
