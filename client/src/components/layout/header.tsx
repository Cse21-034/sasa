// src/components/header.tsx
import { Link, useLocation } from 'wouter';
import { Briefcase, Bell, User, Plus, Sparkles, MessageSquare, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 text-white ${
      scrolled 
        ? 'bg-[hsl(var(--navy))/0.95] backdrop-blur-xl border-b-2 border-orange-500/30 shadow-2xl'
        : 'bg-[hsl(var(--navy))/0.9] backdrop-blur-md'
    }`}>
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center gap-3 hover:scale-105 transition-transform">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold text-orange-500">JobTradeSasa</span>
              <p className="text-xs text-white/70">Find. Connect. Hire.</p>
            </div>
          </a>
        </Link>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {user?.role === 'requester' && (
                <Link href="/post-job">
                  <Button className="hidden sm:flex bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Job
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}

              <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 rounded-full">
                    <Avatar className="h-10 w-10 ring-2 ring-orange-500">
                      <AvatarImage src={user?.profilePhotoUrl} />
                      <AvatarFallback className="bg-orange-500 text-white font-bold text-lg">
                        {user?.name?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <p className="font-bold">{user?.name}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className="mt-2 bg-orange-500 text-white">{user?.role}</Badge>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="text-red-600">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-white hover:bg-white/10">Login</Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                  Get Started <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
