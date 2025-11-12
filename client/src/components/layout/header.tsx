import { Link, useLocation } from 'wouter';
import { Menu, Bell, User, Briefcase, MessageSquare, LayoutDashboard, FileText, Plus, Sparkles, Tag } from 'lucide-react';
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
          ? 'bg-card/80 backdrop-blur-xl border-b border-border shadow-md' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo Section - Primary/Secondary Colors */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-3 hover-elevate rounded-xl px-3 py-2 cursor-pointer group" data-testid="link-home">
              {/* Logo icon: Solid Primary (Emerald Green) */}
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                {/* Text: Primary (Emerald Green) */}
                <span className="text-xl font-bold text-primary dark:text-secondary">
                  JobTradeSasa
                </span>
                <span className="text-xs text-muted-foreground -mt-1">
                  Find. Connect. Hire.
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation - Using primary/secondary for hover/text */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2">
              <Link href="/jobs">
                <Button 
                  variant="ghost" 
                  className="hover:bg-accent/10 dark:hover:bg-accent/20 hover:text-accent transition-colors"
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
                    className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
                    data-testid="link-dashboard"
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              )}

              {user?.role === 'supplier' && (
                <Link href="/supplier/dashboard">
                  <Button
                    variant="ghost"
                    className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
                    data-testid="link-supplier-promotions"
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Promotions
                  </Button>
                </Link>
              )}

              <Link href="/suppliers">
                <Button 
                  variant="ghost"
                  className="hover:bg-accent/10 dark:hover:bg-accent/20 hover:text-accent transition-colors"
                  data-testid="link-suppliers"
                >
                  <Briefcase className="h-4 w-4 mr-2" />
                  Suppliers
                </Button>
              </Link>

              <Link href="/messages">
                <Button 
                  variant="ghost"
                  className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
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
                    className="hover:bg-accent/10 dark:hover:bg-accent/20 hover:text-accent transition-colors"
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
                    className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
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
                    // Solid Secondary (Warm Tan)
                    className="hidden sm:flex bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-secondary/90"
                    data-testid="button-post-job"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                     {/* <Sparkles className="h-3 w-3 ml-2" /> */}
                  </Button>
                </Link>
              )}

              <Button 
                variant="ghost" 
                size="icon"
                // Hover: Primary (Emerald Green)
                className="relative hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
                {/* Notification dot: Secondary (Warm Tan) */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full animate-pulse"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    // Ring: Secondary (Warm Tan)
                    className="relative h-10 w-10 rounded-full hover:ring-4 hover:ring-secondary/20 dark:hover:ring-secondary/30 transition-all"
                    data-testid="button-user-menu"
                  >
                    {/* Avatar ring: Secondary (Warm Tan) */}
                    <Avatar className="h-10 w-10 ring-2 ring-secondary">
                      <AvatarImage src={user?.profilePhotoUrl || undefined} alt={user?.name} />
                      {/* Avatar Fallback: Solid Primary (Emerald Green) */}
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user?.isVerified && (
                      <div 
                        // Solid Primary (Emerald Green)
                        className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background"
                      >
                        <Sparkles className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  // Border: Secondary (Warm Tan)
                  className="w-64 border-2 border-secondary/20 dark:border-secondary/30"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-2">
                      <p className="text-base font-bold">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge 
                        // Solid Primary (Emerald Green)
                        className="w-fit bg-primary text-primary-foreground border-none"
                      >
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setLocation('/profile')}
                    // Hover/Text: Secondary (Warm Tan)
                    className="cursor-pointer hover:bg-secondary/10 dark:hover:bg-secondary/20 hover:text-secondary"
                    data-testid="menu-profile"
                  >
                    <User className="mr-2 h-4 w-4 text-secondary" />
                    Profile
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                     <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => setLocation('/admin/verification')}
                        // Hover/Text: Primary (Emerald Green)
                        className="cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary"
                        data-testid="menu-admin-verification"
                      >
                        <User className="mr-2 h-4 w-4 text-primary" />
                        Verify Users
                      </DropdownMenuItem>
                     </>
                  )}
                  <DropdownMenuItem 
                    onClick={() => setLocation('/messages')}
                    // Hover/Text: Primary (Emerald Green)
                    className="cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary"
                    data-testid="menu-messages"
                  >
                    <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
                    // Text: Destructive (Red)
                    className="cursor-pointer text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20"
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
                  // Hover/Text: Primary (Emerald Green)
                  className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
                  data-testid="button-login"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  // Solid Secondary (Warm Tan)
                  className="bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-secondary/90"
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
