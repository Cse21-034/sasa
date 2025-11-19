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
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);

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
        {/* Logo Section */}
        <div className="flex items-center gap-8">
          <Link href="/">
            <div className="flex items-center gap-3 hover-elevate rounded-xl px-3 py-2 cursor-pointer group">
              <img src="/logo.png" alt="JobTradeSasa" className="h-10 w-10" />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary">
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
            <nav className="hidden lg:flex items-center gap-2">
              {/* Show Jobs/Dashboard ONLY for non-admin users */}
              {user?.role !== 'admin' && (
                <>
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
                      className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors relative"
                      data-testid="link-messages-nav"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Messages
                      {/* 🔥 NEW: Unread messages badge */}
                      {unreadMessagesCount > 0 && (
                        <span className="absolute top-0 right-0 w-5 h-5 bg-destructive text-destructive-foreground text-xs flex items-center justify-center rounded-full">
                          {unreadMessagesCount}
                        </span>
                      )}
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
                </>
              )}

              {/* Admin Panel - ONLY for admins */}
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
                    className="hidden sm:flex bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-secondary/90"
                    data-testid="button-post-job"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post a Job
                  </Button>
                </Link>
              )}

              {/* 🔥 NEW: Notification Bell with Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="relative hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
                    data-testid="button-notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {/* 🔥 NEW: Show notification count */}
                    {totalNotifications > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs flex items-center justify-center rounded-full animate-pulse">
                        {totalNotifications}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* 🔥 NEW: Admin notifications */}
                  {user?.role === 'admin' && (
                    <>
                      {pendingVerificationsCount > 0 && (
                        <DropdownMenuItem 
                          onClick={() => setLocation('/admin/verification')}
                          className="cursor-pointer"
                        >
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
                        <DropdownMenuItem 
                          onClick={() => setLocation('/admin/reports')}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <FileText className="h-4 w-4 text-destructive" />
                            <div className="flex-1">
                              <p className="font-medium">Unresolved Reports</p>
                              <p className="text-xs text-muted-foreground">
                                {unresolvedReportsCount} report{unresolvedReportsCount !== 1 ? 's' : ''} need attention
                              </p>
                            </div>
                            <Badge variant="destructive">{unresolvedReportsCount}</Badge>
                          </div>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  
                  {/* 🔥 NEW: Unread messages notification */}
                  {unreadMessagesCount > 0 && (
                    <DropdownMenuItem 
                      onClick={() => setLocation('/messages')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium">New Messages</p>
                          <p className="text-xs text-muted-foreground">
                            {unreadMessagesCount} unread conversation{unreadMessagesCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge>{unreadMessagesCount}</Badge>
                      </div>
                    </DropdownMenuItem>
                  )}
                  
                  {totalNotifications === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No new notifications
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="relative h-10 w-10 rounded-full hover:ring-4 hover:ring-secondary/20 dark:hover:ring-secondary/30 transition-all"
                    data-testid="button-user-menu"
                  >
                    <Avatar className="h-10 w-10 ring-2 ring-secondary">
                      <AvatarImage src={user?.profilePhotoUrl || undefined} alt={user?.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {user?.isVerified && (
                      <div 
                        className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background"
                      >
                        <Sparkles className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 border-2 border-secondary/20 dark:border-secondary/30"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-2">
                      <p className="text-base font-bold">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge 
                        className="w-fit bg-primary text-primary-foreground border-none"
                      >
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setLocation('/profile')}
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
                    className="cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary"
                    data-testid="menu-messages"
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
                  className="hover:bg-primary/10 dark:hover:bg-primary/20 hover:text-primary transition-colors"
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
        </div>
      </div>
    </header>
  );
}
