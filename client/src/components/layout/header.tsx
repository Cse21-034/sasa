 // client/src/components/layout/header.tsx
import { Link, useLocation } from 'wouter';
import { Search, Bell, User, MessageSquare, Plus, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <div className="w-4 h-4 rounded bg-background"></div>
            </div>
            <span className="text-xl font-semibold tracking-tight">JobTrade</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/jobs">
              <Button variant="ghost" className="text-sm font-medium hover:bg-accent">
                Jobs
              </Button>
            </Link>
            <Link href="/messages">
              <Button variant="ghost" className="text-sm font-medium hover:bg-accent">
                Messages
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" className="text-sm font-medium hover:bg-accent">
                Dashboard
              </Button>
            </Link>
          </nav>
        )}

        {/* Search Bar - Desktop */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="w-full pl-10 pr-4 h-9 rounded-lg bg-muted/50 border-0 focus:bg-background"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isAuthenticated ? (
            <>
              {/* Mobile Search */}
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>

              <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full"></span>
              </Button>

              {user?.role === 'requester' && (
                <Link href="/post-job">
                  <Button className="hidden sm:flex h-9 px-4 gap-2">
                    <Plus className="h-4 w-4" />
                    Post Job
                  </Button>
                </Link>
              )}

              <div className="relative">
                <Avatar className="h-9 w-9 cursor-pointer border">
                  <AvatarImage src={user?.profilePhotoUrl} alt={user?.name} />
                  <AvatarFallback className="bg-foreground text-background text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="h-9">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="h-9">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-9 w-9"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-lg">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {isAuthenticated && (
              <>
                <Link href="/jobs">
                  <Button variant="ghost" className="w-full justify-start">Jobs</Button>
                </Link>
                <Link href="/messages">
                  <Button variant="ghost" className="w-full justify-start">Messages</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                </Link>
              </>
            )}
            <div className="pt-4 border-t border-border">
              <Input placeholder="Search..." className="w-full" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
