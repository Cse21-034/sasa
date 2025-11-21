// client/src/components/layout/header.tsx - UPDATED WITH LOGO BACKGROUND COLOR & IMPROVED NOTIFICATIONS

import { Link, useLocation } from 'wouter';
import { Menu, Bell, User, Briefcase, MessageSquare, LayoutDashboard, FileText, Plus, Sparkles, Tag, ArrowRight, ShoppingBag } from 'lucide-react';
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
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [prevNotificationCount, setPrevNotificationCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const isLandingPage = location === '/'; 
  
  // Query for unread messages count
  const { data: conversations } = useQuery({
    queryKey: ['/api/messages/conversations'],
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  // Query for pending verifications (admin only)
  const { data: pendingVerifications } = useQuery({
    queryKey: ['adminPendingVerification'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/verification/pending');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 60000,
  });

  // Query for unresolved reports (admin only)
  const { data: unresolvedReports } = useQuery({
    queryKey: ['adminUnresolvedReports'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/reports?status=unresolved');
      return res.json();
    },
    enabled: isAuthenticated && user?.role === 'admin',
    refetchInterval: 60000,
  });

  // Calculate notification counts
  const unreadMessagesCount = conversations?.filter((c: any) => c.unreadCount > 0).length || 0;
  const pendingVerificationsCount = pendingVerifications?.length || 0;
  const unresolvedReportsCount = unresolvedReports?.length || 0;
  
  const totalNotifications = isAuthenticated 
    ? (user?.role === 'admin' 
        ? pendingVerificationsCount + unresolvedReportsCount + unreadMessagesCount
        : unreadMessagesCount)
    : 0;

  // Play notification sound when count increases
  useEffect(() => {
    if (!audioRef.current) {
      // Create audio element for notification sound
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGJ0fPTfzMGHm7A7+OZURE');
    }

    if (totalNotifications > prevNotificationCount && prevNotificationCount > 0) {
      // Play sound only if notifications increased (not on initial load)
      audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
    }
    
    setPrevNotificationCount(totalNotifications);
  }, [totalNotifications, prevNotificationCount]);

  return (
    <header 
      className="sticky top-0 z-50 w-full transition-all duration-300 shadow-2xl"
      style={{ 
        background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 50%, #2a4d4f 100%)',
      }}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        
        {/* Logo Section with improved spacing */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-4 hover:opacity-90 transition-opacity rounded-xl px-4 py-2 cursor-pointer group">
              <img 
                src="/image.png" 
                alt="JobTradeSasa" 
                className="h-14 w-14 object-contain drop-shadow-lg"
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white tracking-tight"> 
                  JobTradeSasa
                </span>
                <span className="text-xs text-orange-300 -mt-1 font-medium">
                  Find. Connect. Hire.
                </span>
              </div>
            </div>
          </Link>

          {/* Landing Page Desktop Navigation */}
          {isLandingPage && !isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2 text-sm font-medium">
              <a 
                href="/#popular-services" 
                className="px-4 py-2 text-white/90 hover:text-orange-300 transition-colors rounded-lg hover:bg-white/5"
              >
                Services
              </a>
              <a 
                href="/#why-choose-us" 
                className="px-4 py-2 text-white/90 hover:text-orange-300 transition-colors rounded-lg hover:bg-white/5"
              >
                About
              </a>
              <a 
                href="/#suppliers-section" 
                className="px-4 py-2 text-white/90 hover:text-orange-300 transition-colors rounded-lg hover:bg-white/5"
              >
                Suppliers
              </a>
            </nav>
          )}

          {/* Authenticated Desktop Navigation */}
          {isAuthenticated && (
            <nav className="hidden lg:flex items-center gap-2">
              {user?.role !== 'admin' && (
                <>
                  <Link href="/jobs">
                    <Button 
                      variant="ghost" 
                      className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors"
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
                        className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors"
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
                        className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors"
                        data-testid="link-supplier-promotions"
                      >
                        <Tag className="h-4 w-4 mr-2" /> Promotions
                      </Button>
                    </Link>
                  )}

                  <Link href="/suppliers">
                    <Button 
                      variant="ghost" 
                      className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors"
                      data-testid="link-suppliers"
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" /> Suppliers
                    </Button>
                  </Link>

                  <Link href="/messages">
                    <Button 
                      variant="ghost"
                      className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors"
                      data-testid="link-messages"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" /> 
                      Messages
                    </Button>
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <>
                  <Link href="/admin">
                    <Button 
                      variant="ghost"
                      className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors"
                      data-testid="link-admin-dashboard"
                    >
                      <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/users">
                    <Button 
                      variant="ghost"
                      className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors"
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
        
        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <>
              {/* Enhanced Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative text-white hover:text-orange-300 hover:bg-white/10 transition-all h-11 w-11"
                  >
                    <Bell className={`h-6 w-6 ${totalNotifications > 0 ? 'animate-pulse' : ''}`} />
                    {totalNotifications > 0 && (
                      <>
                        <Badge 
                          className="absolute -top-1 -right-1 h-6 w-6 p-0 flex items-center justify-center rounded-full text-xs font-bold bg-orange-500 text-white border-2 border-[#274345] shadow-lg animate-bounce"
                        >
                          {totalNotifications > 9 ? '9+' : totalNotifications}
                        </Badge>
                        {/* Pulse ring effect */}
                        <span className="absolute top-0 right-0 h-6 w-6 rounded-full bg-orange-500 animate-ping opacity-75"></span>
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-3 bg-white dark:bg-gray-900">
                  <DropdownMenuLabel className="text-lg font-bold flex items-center gap-2">
                    <Bell className="h-5 w-5 text-orange-500" />
                    Notifications
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {totalNotifications === 0 && (
                     <div className="text-center py-8 text-muted-foreground">
                        <Sparkles className="h-8 w-8 mx-auto mb-3 text-orange-500" />
                        <p className="text-sm font-medium">You're all caught up!</p>
                        <p className="text-xs mt-1">No new notifications</p>
                      </div>
                  )}

                  {unreadMessagesCount > 0 && (
                    <DropdownMenuItem onClick={() => setLocation('/messages')} className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-950 p-3 mb-2">
                      <div className="flex items-center gap-3 w-full">
                        <div className="bg-orange-100 dark:bg-orange-900 p-2 rounded-full">
                          <MessageSquare className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">Unread Messages</p>
                          <p className="text-xs text-muted-foreground">
                            {unreadMessagesCount} conversation{unreadMessagesCount !== 1 ? 's' : ''} waiting
                          </p>
                        </div>
                        <Badge className="bg-orange-500 text-white font-bold">{unreadMessagesCount}</Badge>
                      </div>
                    </DropdownMenuItem>
                  )}

                  {user?.role === 'admin' && (
                    <>
                      {pendingVerificationsCount > 0 && (
                        <DropdownMenuItem onClick={() => setLocation('/admin/verification')} className="cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-950 p-3 mb-2">
                          <div className="flex items-center gap-3 w-full">
                            <div className="bg-yellow-100 dark:bg-yellow-900 p-2 rounded-full">
                              <User className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">Pending Verifications</p>
                              <p className="text-xs text-muted-foreground">
                                {pendingVerificationsCount} user{pendingVerificationsCount !== 1 ? 's' : ''} awaiting approval
                              </p>
                            </div>
                            <Badge className="bg-yellow-500 text-white font-bold">{pendingVerificationsCount}</Badge>
                          </div>
                        </DropdownMenuItem>
                      )}
                      {unresolvedReportsCount > 0 && (
                        <DropdownMenuItem onClick={() => setLocation('/admin/reports')} className="cursor-pointer hover:bg-red-50 dark:hover:bg-red-950 p-3">
                          <div className="flex items-center gap-3 w-full">
                            <div className="bg-red-100 dark:bg-red-900 p-2 rounded-full">
                              <FileText className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-sm">Unresolved Reports</p>
                              <p className="text-xs text-muted-foreground">
                                {unresolvedReportsCount} report{unresolvedReportsCount !== 1 ? 's' : ''} requiring action
                              </p>
                            </div>
                            <Badge className="bg-red-500 text-white font-bold">{unresolvedReportsCount}</Badge>
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
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-full hover:bg-white/10 transition-all">
                    <Avatar className="h-10 w-10 border-2 border-orange-400 shadow-lg">
                      <AvatarImage src={user?.profilePictureUrl} alt={user?.name} />
                      <AvatarFallback className="bg-orange-500 text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2">
                  <DropdownMenuLabel className="font-semibold text-sm truncate">
                    {user?.name} ({user?.role})
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
                  className="text-white hover:bg-white/10 hover:text-orange-300 transition-colors"
                  data-testid="button-login"
                >
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button 
                  className="bg-orange-500 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:bg-orange-600 border-2 border-orange-400"
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
