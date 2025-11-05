import { Link, useLocation } from 'wouter';
import { Menu, Bell, User, Briefcase, MessageSquare, LayoutDashboard, FileText, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b-2 border-orange-200 dark:border-orange-800 shadow-lg' 
          : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-b border-gray-200 dark:border-gray-800'
      }`}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo Section */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-3 hover-elevate rounded-xl px-3 py-2 cursor-pointer group" data-testid="link-home">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-lime-500 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-lime-600 bg-clip-text text-transparent">
                  JobTradeSasa
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Find. Connect. Hire.
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2">
              <Link href="/jobs">
                <Button 
                  variant="ghost" 
                  className="hover:bg-orange-50 dark:hover:bg-orange-950 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  data-testid="link-jobs"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  {user?.role === 'requester' ? 'My Jobs' : 'Browse Jobs'}
                </Button>
              </Link>
              
              {user?.role === 'provider' && (
                <Link href="/dashboard">
                  <Button 
                    variant="ghost"
                    className="hover:bg-lime-50 dark:hover:bg-lime-950 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                    data-testid="link-dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              )}

              <Link href="/suppliers">
                <Button 
                  variant="ghost"
                  className="hover:bg-orange-50 dark:hover:bg-orange-950 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                  data-testid="link-suppliers"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Suppliers
                </Button>
              </Link>

              <Link href="/messages">
                <Button 
                  variant="ghost"
                  className="hover:bg-lime-50 dark:hover:bg-lime-950 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                  data-testid="link-messages-nav"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Button>
              </Link>

              {user?.role === 'requester' && (
                <Link href="/reports">
                  <Button 
                    variant="ghost"
                    className="hover:bg-orange-50 dark:hover:bg-orange-950 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                    data-testid="link-reports"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Reports
                  </Button>
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link href="/admin">
                  <Button 
                    variant="ghost"
                    className="hover:bg-lime-50 dark:hover:bg-lime-950 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                    data-testid="link-admin"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {user?.role === 'requester' && (
                <Link href="/post-job">
                  <Button 
                    className="hidden sm:flex bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    data-testid="button-post-job"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                    <Sparkles className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              )}

              <Button 
                variant="ghost" 
                size="icon"
                className="relative hover:bg-lime-50 dark:hover:bg-lime-950 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-full hover:ring-4 hover:ring-orange-200 dark:hover:ring-orange-800 transition-all"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-orange-500">
                      <AvatarImage src={user?.profilePhotoUrl || undefined} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-r from-orange-500 to-lime-500 text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user?.isVerified && (
                      <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-lime-500 to-lime-600 flex items-center justify-center border-2 border-white dark:border-gray-900">
                        <Sparkles className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 border-2 border-orange-200 dark:border-orange-800">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-2">
                      <p className="text-base font-bold">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge 
                        className="w-fit bg-gradient-to-r from-orange-500 to-lime-500 text-white border-none"
                      >
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setLocation('/profile')}
                    className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950"
                    data-testid="menu-profile"
                  >
                    <User className="mr-2 h-4 w-4 text-orange-500" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/messages')}
                    className="cursor-pointer hover:bg-lime-50 dark:hover:bg-lime-950"
                    data-testid="menu-messages"
                  >
                    <MessageSquare className="mr-2 h-4 w-4 text-lime-500" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    data-testid="menu-logout"
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button 
                  variant="ghost"
                  className="hover:bg-lime-50 dark:hover:bg-lime-950 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
                  data-testid="button-login"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-lime-500 hover:from-orange-600 hover:to-lime-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  data-testid="button-signup"
                >
                  Get Started
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
