// client/src/components/layout/header.tsx
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
          ? 'bg-background/90 backdrop-blur-xl border-b border-border shadow-sm' 
          : 'bg-background/80 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo Section */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-3 hover-lift rounded-lg px-3 py-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">
                  JobTradeSasa
                </span>
                <span className="text-xs text-muted-foreground -mt-1">
                  Find. Connect. Hire.
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-1">
              <Link href="/jobs">
                <Button 
                  variant="ghost" 
                  className="hover:bg-primary/10 hover:text-foreground transition-colors"
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
                    className="hover:bg-primary/10 hover:text-foreground transition-colors"
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
                  className="hover:bg-primary/10 hover:text-foreground transition-colors"
                  data-testid="link-suppliers"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Suppliers
                </Button>
              </Link>

              <Link href="/messages">
                <Button 
                  variant="ghost"
                  className="hover:bg-primary/10 hover:text-foreground transition-colors"
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
                    className="hover:bg-primary/10 hover:text-foreground transition-colors"
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
                    className="hover:bg-primary/10 hover:text-foreground transition-colors"
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
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {user?.role === 'requester' && (
                <Link href="/post-job">
                  <Button 
                    className="hidden sm:flex bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-300"
                    data-testid="button-post-job"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                </Link>
              )}

              <Button 
                variant="ghost" 
                size="icon"
                className="relative hover:bg-primary/10 transition-colors"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-primary transition-all"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profilePhotoUrl || undefined} alt={user?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user?.isVerified && (
                      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                        <Sparkles className="h-2 w-2 text-primary-foreground" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 border border-border">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge 
                        className="w-fit bg-primary text-primary-foreground border-none text-xs"
                      >
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setLocation('/profile')}
                    className="cursor-pointer hover:bg-primary/10"
                    data-testid="menu-profile"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/messages')}
                    className="cursor-pointer hover:bg-primary/10"
                    data-testid="menu-messages"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    className="cursor-pointer text-destructive hover:bg-destructive/10"
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
                  className="hover:bg-primary/10 transition-colors"
                  data-testid="button-login"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md transition-all duration-300"
                  data-testid="button-signup"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
