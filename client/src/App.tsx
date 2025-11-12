import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/auth/login";
import Signup from "@/pages/auth/signup";
import BrowseJobs from "@/pages/jobs/browse";
import PostJob from "@/pages/jobs/post";
import JobDetail from "@/pages/jobs/detail";
import ProviderDashboard from "@/pages/provider/dashboard";
import Messages from "@/pages/messages/index";
import Chat from "@/pages/messages/chat";
import Profile from "@/pages/profile";
import Reports from "@/pages/reports";
import Suppliers from "@/pages/suppliers";
import NotFound from "@/pages/not-found";
import VerificationPage from "@/pages/verification";
import SupplierDetail from "@/pages/supplier-detail";
import SupplierDashboard from "@/pages/supplier/dashboard";

// 🆕 New Admin Imports
import AdminDashboardHub from "@/pages/admin/index"; 
import AdminVerification from "@/pages/admin/verification";
import AdminUsers from "@/pages/admin/users";
import AdminReports from "@/pages/admin/reports";
import AdminAnalytics from "@/pages/admin/analytics";


function ProtectedRoute({ component: Component, path, ...rest }: any) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  // Verification Gate: If authenticated but not fully verified (and not admin), redirect to verification page.
  if (user && user.role !== 'admin' && !user.isVerified) {
    // Allow access to Profile/Verification page for verification steps
    if (path !== '/profile' && path !== '/verification') {
        return <Redirect to="/verification" />;
    }
  }

  return <Component {...rest} />;
}

function AdminRoute({ component: Component, ...rest }: any) {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated || user?.role !== 'admin') {
        // Redirect to 404 or login if not admin
        return <Redirect to={isAuthenticated ? "/404" : "/login"} />;
    }
    return <Component {...rest} />;
}


function PublicRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated } = useAuth();
  
  return !isAuthenticated ? <Component {...rest} /> : <Redirect to="/jobs" />;
}


function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Switch>
          <Route path="/" component={isAuthenticated ? BrowseJobs : Landing} />
          <Route path="/login">
            {() => <PublicRoute component={Login} />}
          </Route>
          <Route path="/signup">
            {() => <PublicRoute component={Signup} />}
          </Route>

          {/* Verification Routes */}
          <Route path="/verification">
            {() => <ProtectedRoute component={VerificationPage} path="/verification" />}
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin">
            {() => <AdminRoute component={AdminDashboardHub} />} 
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
          
          {/* Protected Routes */}
          <Route path="/jobs" >{() => <ProtectedRoute component={BrowseJobs} path="/jobs" />}</Route>
          <Route path="/jobs/:id" >{() => <ProtectedRoute component={JobDetail} path="/jobs/:id" />}</Route>
          <Route path="/post-job">
            {() => <ProtectedRoute component={PostJob} path="/post-job" />}
          </Route>
          <Route path="/dashboard">
            {() => <ProtectedRoute component={ProviderDashboard} path="/dashboard" />}
          </Route>
          <Route path="/messages">
            {() => <ProtectedRoute component={Messages} path="/messages" />}
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
          <Route path="/suppliers" component={Suppliers} /> 
          <Route path="/my-jobs">
            {() => <ProtectedRoute component={BrowseJobs} path="/my-jobs" />}
          </Route>

          {/* Supplier Routes */}
          <Route path="/suppliers" component={Suppliers} /> 
          <Route path="/suppliers/:id">
            <SupplierDetail />
          </Route>
          
          {/* Supplier Dashboard - Protected */}
          <Route path="/supplier/dashboard">
            {() => <ProtectedRoute component={SupplierDashboard} path="/supplier/dashboard" />}
          </Route>
          
          <Route component={NotFound} />
        </Switch>
      </main>
      <MobileNav />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
