import { Switch, Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { AdminLayout } from "@/components/layout/admin-layout";
import { SupplierLayout } from "@/components/layout/supplier-layout";
import { PushNotificationContainer } from "@/components/push-notification";
import { AppInstallPrompt } from "@/components/app-install-prompt";
import "@/lib/i18n";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import VerifyEmail from "@/pages/auth/verify-email";
import ForgotPassword from "@/pages/auth/forgot-password";
import BrowseJobs from "@/pages/jobs/browse";
import PostJob from "@/pages/jobs/post";
import JobDetail from "@/pages/jobs/detail";
import ProviderDashboard from "@/pages/provider/dashboard";
import Messages from "@/pages/messages/index";
import Chat from "@/pages/messages/chat";
import Profile from "@/pages/profile";
import Reports from "@/pages/reports";
import Suppliers from "@/pages/suppliers";
import PublicSuppliers from "@/pages/public-suppliers";
import NotFound from "@/pages/not-found";
import VerificationPage from "@/pages/verification";
import SupplierDetail from "@/pages/supplier-detail";
import PromotionsPage from "@/pages/promotions";
import PaymentResult from "@/pages/payment-result";
import SupplierDashboard from "@/pages/supplier/dashboard";
import SupplierSettings from "@/pages/supplier/settings";
import ProviderApplications from "@/pages/provider/applications";

// Admin Imports
import AdminDashboardHub from "@/pages/admin/index"; 
import AdminVerification from "@/pages/admin/verification";
import AdminUsers from "@/pages/admin/users";
import AdminReports from "@/pages/admin/reports";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminMessages from "@/pages/admin/messages"; 
import AdminChat from "@/pages/admin/messages"; 
import AdminChatUserView from "@/pages/messages/admin-chat";
import AdminMigrations from "@/pages/admin/migrations";
import AdminCategoryVerifications from "@/pages/admin/category-verifications";

// 🔥 TIER 2 & 3: Cache Management Component
const APP_VERSION = "1.0.1"; // Increment on each deployment

function CacheManager({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // TIER 2: Check token expiration
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.exp * 1000 < Date.now()) {
          console.warn('⚠️ Token expired - redirecting to login');
          localStorage.clear();
          sessionStorage.clear();
          queryClient.clear();
          window.location.href = '/login?expired=true';
          return;
        }
      } catch (error) {
        console.error('Invalid token format:', error);
        localStorage.removeItem('token');
      }
    }

    // TIER 3: App version cache busting
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion !== APP_VERSION) {
      console.log('🔄 App updated - clearing cache...');
      localStorage.clear();
      sessionStorage.clear();
      queryClient.clear();
      localStorage.setItem('appVersion', APP_VERSION);
      // Force reload to pick up new assets
      window.location.reload();
    }
  }, []);

  return <>{children}</>;
}


function ProtectedRoute({ component: Component, path, ...rest }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;

  if (user && user.role !== 'admin' && !user.isVerified) {
    if (path !== '/profile' && path !== '/verification') {
      return <Redirect to="/verification" />;
    }
  }

  return <Component {...rest} />;
}

function AdminRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Redirect to={isAuthenticated ? "/404" : "/login"} />;
  }
  return <AdminLayout><Component {...rest} /></AdminLayout>;
}

function SupplierRoute({ component: Component, path, ...rest }: any) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect to="/login" />;
  if (user && !user.isVerified) return <Redirect to="/verification" />;
  if (user?.role !== 'supplier') return <Redirect to="/jobs" />;
  return <SupplierLayout><Component {...rest} /></SupplierLayout>;
}

function PublicRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return !isAuthenticated ? <Component {...rest} /> : <Redirect to="/jobs" />;
}

// 🔥 ADDED: Smart redirect based on user role
function SmartRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Landing />;

  if (user.role === 'admin')    return <Redirect to="/admin" />;
  if (user.role === 'supplier') return <Redirect to="/supplier/dashboard" />;
  if (user.role === 'provider') return <Redirect to="/dashboard" />;
  return <Redirect to="/jobs" />;
}


function Router() {
  const { isAuthenticated, user } = useAuth();
  const [location] = useLocation();

  const isDashboardRoute = location.startsWith('/admin') || location.startsWith('/supplier/');
  const hideHeader = ['/login', '/signup', '/forgot-password'].includes(location) || isDashboardRoute;

  return (
    <div className="flex flex-col min-h-screen">
      {!hideHeader && <Header />}
      {!hideHeader && <AppInstallPrompt />}
      <main className={isDashboardRoute ? 'flex-1' : 'flex-1 pb-nav md:pb-0'}>
        <Switch>
          {/* 🔥 FIXED: Use SmartRedirect for root route */}
          <Route path="/">
            <SmartRedirect />
          </Route>
          
          <Route path="/login">
            {() => <PublicRoute component={Login} />}
          </Route>
          <Route path="/signup">
            {() => <PublicRoute component={Signup} />}
          </Route>
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/promotions" component={PromotionsPage} />
          <Route path="/payment-result" component={PaymentResult} />

          {/* Verification Routes */}
          <Route path="/verification">
            {() => <ProtectedRoute component={VerificationPage} path="/verification" />}
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin">
            {() => <AdminRoute component={AdminDashboardHub} />}
          </Route>
          <Route path="/admin/profile">
            {() => <AdminRoute component={Profile} />}
          </Route>
          <Route path="/admin/verification">
            {() => <AdminRoute component={AdminVerification} />}
          </Route>
          <Route path="/admin/users">
            {() => <AdminRoute component={AdminUsers} />} 
          </Route>
          <Route path="/admin/reports">
            {() => <AdminRoute component={AdminReports} />} 
          </Route>
          <Route path="/admin/analytics">
            {() => <AdminRoute component={AdminAnalytics} />} 
          </Route>
          <Route path="/admin/migrations">
            {() => <AdminRoute component={AdminMigrations} />}
          </Route>
          <Route path="/admin/category-verifications">
            {() => <AdminRoute component={AdminCategoryVerifications} />}
          </Route>
          {/* Admin messaging routes */}
          <Route path="/admin/messages">
            {() => <AdminRoute component={AdminMessages} />}
          </Route>
          <Route path="/admin/messages/:userId">
            {() => <AdminRoute component={AdminChat} />}
          </Route>
          {/* Admin supplier browse routes */}
          <Route path="/admin/suppliers">
            {() => <AdminRoute component={Suppliers} />}
          </Route>
          <Route path="/admin/suppliers/:id">
            {() => <AdminRoute component={SupplierDetail} />}
          </Route>
          
          {/* Protected Routes */}
          <Route path="/jobs" >{() => <ProtectedRoute component={BrowseJobs} path="/jobs" />}</Route>
          <Route path="/jobs/:id" >{() => <ProtectedRoute component={JobDetail} path="/jobs/:id" />}</Route>
          <Route path="/post-job">
            {() => <ProtectedRoute component={PostJob} path="/post-job" />}
          </Route>
          <Route path="/dashboard">
            {() => <ProtectedRoute component={ProviderDashboard} path="/dashboard" />}
          </Route>
          <Route path="/provider/applications">
            {() => <ProtectedRoute component={ProviderApplications} path="/provider/applications" />}
          </Route>
          <Route path="/messages">
            {() => <ProtectedRoute component={Messages} path="/messages" />}
          </Route>
          {/* NEW: Static route for user's Admin Chat */}
          <Route path="/messages/admin-chat">
            {() => <ProtectedRoute component={AdminChatUserView} path="/messages/admin-chat" />}
          </Route>
          <Route path="/messages/:jobId">
            {() => <ProtectedRoute component={Chat} path="/messages/:jobId" />}
          </Route>
          <Route path="/profile">
            {() => <ProtectedRoute component={Profile} path="/profile" />}
          </Route>
          <Route path="/reports">
            {() => <ProtectedRoute component={Reports} path="/reports" />}
          </Route>
          
          {/* Public Routes */}
          <Route path="/browse-suppliers" component={PublicSuppliers} />
          <Route path="/suppliers" component={Suppliers} /> 
          <Route path="/my-jobs">
            {() => <ProtectedRoute component={BrowseJobs} path="/my-jobs" />}
          </Route>

          {/* Supplier Routes */}
          <Route path="/suppliers/:id">
            {() => <SupplierDetail />}
          </Route>
          
          {/* Supplier Dashboard - Supplier only */}
          <Route path="/supplier/dashboard">
            {() => <SupplierRoute component={SupplierDashboard} path="/supplier/dashboard" />}
          </Route>
          <Route path="/supplier/settings">
            {() => <SupplierRoute component={SupplierSettings} path="/supplier/settings" />}
          </Route>
          <Route path="/supplier/messages">
            {() => <SupplierRoute component={Messages} path="/supplier/messages" />}
          </Route>
          <Route path="/supplier/messages/:jobId">
            {() => <SupplierRoute component={Chat} path="/supplier/messages/:jobId" />}
          </Route>
          <Route path="/supplier/profile">
            {() => <SupplierRoute component={Profile} path="/supplier/profile" />}
          </Route>
          {/* Supplier browse routes */}
          <Route path="/supplier/browse">
            {() => <SupplierRoute component={Suppliers} path="/supplier/browse" />}
          </Route>
          <Route path="/supplier/browse/:id">
            {() => <SupplierRoute component={SupplierDetail} path="/supplier/browse/:id" />}
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </main>
      {!isDashboardRoute && <MobileNav />}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CacheManager>
            <TooltipProvider>
              <Router />
              <Toaster />
              <PushNotificationContainer />
            </TooltipProvider>
          </CacheManager>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
