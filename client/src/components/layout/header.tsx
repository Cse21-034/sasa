import { Link, useLocation } from 'wouter';
import { Menu, Bell, User, Briefcase, MessageSquare, LayoutDashboard, FileText, Plus, Sparkles, Tag, ArrowRight } from 'lucide-react';
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
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  
  // New: Check if we are on the landing page (root route)
  const isLandingPage = location === '/'; 
  
  // NOTE: 'scrolled' state and its useEffect have been removed 
  // because the header is now always a fixed color.

  // 🔥 NEW: Query for unread messages count
  const { data: conversations } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // 🔥 NEW: Query for pending verifications (admin only)
  const { data: pendingVerifications } = useQuery({
    queryKey: ['adminPendingVerification'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/verification/pending');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 60000, // Refresh every minute
  });

  // 🔥 NEW: Query for unresolved reports (admin only)
  const { data: unresolvedReports } = useQuery({
    queryKey: ['adminUnresolvedReports'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/reports?status=unresolved');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 60000, // Refresh every minute
  });

  // 🔥 NEW: Calculate notification counts
  const unreadMessagesCount = conversations?.filter((c: any) => c.unreadCount > 0).length || 0;
  const pendingVerificationsCount = pendingVerifications?.length || 0;
  const unresolvedReportsCount = unresolvedReports?.length || 0;
  
  const totalNotifications = isAuthenticated 
    ? (user?.role === 'admin' 
        ? pendingVerificationsCount + unresolvedReportsCount + unreadMessagesCount
        : unreadMessagesCount)
    : 0;


  return (
    // 1. Fixed dark grey background for header (consistent regardless of theme)
    <header 
      className={`sticky top-0 z-50 w-full bg-neutral-800 text-white transition-all duration-300 shadow-xl`}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        
        {/* Logo Section and Landing Page Nav */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-3 hover-elevate rounded-xl px-3 py-2 cursor-pointer group">
              <img src="/logo.png" alt="JobTradeSasa" className="h-10 w-10" />
              <div className="flex flex-col">
                {/* Text color changed to white/light grey for contrast on dark background */}
                <span className="text-xl font-bold text-white"> 
                  JobTradeSasa
                </span>
                <span className="text-xs text-neutral-300 -mt-1">
                  Find. Connect. Hire.
                </span>
              </div>
            </div>
          </Link>

          {/* Landing Page Desktop Navigation - ONLY show if not authenticated AND on landing page */}
          {isLandingPage && !isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2 text-sm font-medium">
              <a 
                href="/#popular-services" 
                className="px-3 py-2 transition-colors hover:text-secondary"
              >
                Services
              </a>
              <a 
                href="/#why-choose-us" 
                className="px-3 py-2 transition-colors hover:text-secondary"
              >
                About
              </a>
              <a 
                href="/#suppliers-section" 
                className="px-3 py-2 transition-colors hover:text-secondary"
              >
                Buy supply materials with trusted suppliers
              </a>
            </nav>
          )}

          {/* Existing Desktop Navigation (Authenticated) */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2">
              {/* Show Jobs/Dashboard ONLY for non-admin users */}
              {user?.role !== 'admin' && (
                <>
                  <Link href="/jobs">
                    <Button 
                      variant="ghost" 
                      className="hover:bg-accent/10 dark:hover:bg-accent/20 hover:text-accent transition-colors text-white hover:text-secondary"
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
                        className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors text-white hover:text-secondary"
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
                        className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors text-white hover:text-secondary"
                        data-testid="link-supplier-promotions"
                      >
                        <Tag className="h-4 w-4 mr-2" /> Promotions
                      </Button>
                    </Link>
                  )}

                  <Link href="/suppliers">
                    <Button 
                      variant="ghost" 
                      className="hover:bg-accent/10 dark:hover:bg-accent/20 hover:text-accent transition-colors text-white hover:text-secondary"
                      data-testid="link-suppliers"
                    >
                      <Briefcase className="h-4 w-4 mr-2" /> Suppliers
                    </Button>
                  </Link>

                  <Link href="/messages">
                    <Button 
                      variant="ghost"
                      className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors text-white hover:text-secondary"
                      data-testid="link-messages"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" /> 
                      Messages
                    </Button>
                  </Link>
                </>
              )}
              {/* Admin Links */}
              {user?.role === 'admin' && (
                <>
                  <Link href="/admin">
                    <Button 
                      variant="ghost"
                      className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors text-white hover:text-secondary"
                      data-testid="link-admin-dashboard"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button 
                      variant="ghost"
                      className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors text-white hover:text-secondary"
                      data-testid="link-admin-users"
                    >
                      <User className="h-4 w-4 mr-2" /> Users
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
        
        {/* Right Side - Auth/User/Notifications/ThemeToggle */}
        <div className="flex items-center gap-2 sm:gap-4">

          {/* User Profile / Notifications / Theme Toggle */}
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-white hover:text-secondary hover:bg-transparent">
                    <Bell className="h-6 w-6" />
                    {totalNotifications > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs"
                      >
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-3">
                  <DropdownMenuLabel className="text-lg font-bold">Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {totalNotifications === 0 && (
                     <div className="text-center py-4 text-muted-foreground">
                        <Sparkles className="h-6 w-6 mx-auto mb-2 text-primary" />
                        <p className="text-sm">You're all caught up!</p>
                      </div>
                  )}

                  {/* Message Notifications */}
                  {unreadMessagesCount > 0 && (
                    <DropdownMenuItem onClick={() => setLocation('/messages')} className="cursor-pointer">
                      <div className="flex items-center gap-2 w-full">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">Unread Messages</p>
                          <p className="text-xs text-muted-foreground">
                            {unreadMessagesCount} conversation{unreadMessagesCount !== 1 ? 's' : ''} with new messages
                          </p>
                        </div>
                        <Badge variant="default">{unreadMessagesCount}</Badge>
                      </div>
                    </DropdownMenuItem>
                  )}

                  {/* Admin Notifications */}
                  {user?.role === 'admin' && (
                    <>
                      {pendingVerificationsCount > 0 && (
                        <DropdownMenuItem onClick={() => setLocation('/admin/verification')} className="cursor-pointer" >
                          <div className="flex items-center gap-2 w-full">
                            <User className="h-4 w-4 text-warning" />
                            <div className="flex-1">
                              <p className="font-medium">Pending Verifications</p>
                              <p className="text-xs text-muted-foreground">
                                {pendingVerificationsCount} user{pendingVerificationsCount !== 1 ? 's' : ''} awaiting approval
                              </p>
                            </div>
                            <Badge variant="warning">{pendingVerificationsCount}</Badge>
                          </div>
                        </DropdownMenuItem>
                      )}
                      {unresolvedReportsCount > 0 && (
                        <DropdownMenuItem onClick={() => setLocation('/admin/reports')} className="cursor-pointer" >
                          <div className="flex items-center gap-2 w-full">
                            <FileText className="h-4 w-4 text-destructive" />
                            <div className="flex-1">
                              <p className="font-medium">Unresolved Reports</p>
                              <p className="text-xs text-muted-foreground">
                                {unresolvedReportsCount} report{unresolvedReportsCount !== 1 ? 's' : ''} requiring action
                              </p>
                            </div>
                            <Badge variant="destructive">{unresolvedReportsCount}</Badge>
                          </div>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-neutral-700">
                    <Avatar className="h-9 w-9 border-2 border-white">
                      <AvatarImage src={user?.profilePictureUrl} alt={user?.username} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <DropdownMenuLabel className="font-semibold text-sm truncate">
                    {user?.username} ({user?.role})
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setLocation('/profile')}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setLocation('/messages')}
                    className="cursor-pointer"
                  >
                    <MessageSquare className="mr-2 h-4 w-4 text-primary" />
                    Messages
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={logout}
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
                  className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors text-white"
                  data-testid="button-login"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  className="bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-secondary/90"
                  data-testid="button-signup"
                >
                  Get Started
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
          
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
