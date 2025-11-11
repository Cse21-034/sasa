import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserCheck, Users, FileText, TrendingUp, AlertCircle, Briefcase, Loader2, ArrowRight, 
  LayoutDashboard // 🚨 FIX: Added missing import
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';

// Simplified stats fetch for dashboard quick view
const useAdminOverview = () => {
  return useQuery({
    queryKey: ['adminOverviewStats'],
    queryFn: async () => {
        const statsRes = await apiRequest('GET', '/api/admin/analytics');
        const analytics = await statsRes.json();
        
        const verificationRes = await apiRequest('GET', '/api/admin/verification/pending');
        const verification = await verificationRes.json();
        
        const reportsRes = await apiRequest('GET', '/api/admin/reports?status=unresolved');
        const reports = await reportsRes.json();
        
        const totalUsersRes = await apiRequest('GET', '/api/admin/users');
        const totalUsers = await totalUsersRes.json();

        return {
            ...analytics,
            pendingVerificationCount: verification.length,
            unresolvedReportsCount: reports.length,
            totalUsersCount: totalUsers.length,
        }
    },
    refetchInterval: 60000, // Refresh every minute
  });
};


export default function AdminDashboardHub() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = useAdminOverview();

  const menuItems = [
    {
      title: 'User Verification',
      description: 'Approve or reject provider identity and document submissions. (Pending users will not be able to accept jobs)',
      icon: UserCheck,
      path: '/admin/verification',
      badge: stats?.pendingVerificationCount > 0 ? `${stats.pendingVerificationCount} Pending` : null,
      badgeVariant: 'destructive' as const,
    },
    {
      title: 'Users Management',
      description: 'View, block, deactivate, and manage all user accounts (requesters/providers/suppliers).',
      icon: Users,
      path: '/admin/users',
      badge: `${stats?.totalUsersCount || 0} Total`,
      badgeVariant: 'secondary' as const,
    },
    {
      title: 'Reports & Disputes',
      description: 'Review and resolve job reports and disputes raised by users. Block user accounts if necessary.',
      icon: FileText,
      path: '/admin/reports',
      badge: stats?.unresolvedReportsCount > 0 ? `${stats.unresolvedReportsCount} Unresolved` : null,
      badgeVariant: 'warning' as const,
    },
    {
      title: 'Jobs Analytics',
      description: 'View platform metrics, job completion rates, and top provider performance.',
      icon: TrendingUp,
      path: '/admin/analytics',
      badge: `${stats?.completedJobs || 0} Completed`,
      badgeVariant: 'default' as const,
    },
  ];
  
  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">Platform-wide</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <LayoutDashboard className="h-7 w-7 text-primary" /> {/* Uses LayoutDashboard */}
            Admin Panel
        </h1>
        <p className="text-muted-foreground">Platform administration and moderation tools</p>
      </div>
      
      {isLoading ? (
         <Loader2 className="h-8 w-8 animate-spin mx-auto mt-12" />
      ) : (
        <>
            {/* Overview Stats */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Total Users" 
                    value={stats?.totalUsersCount} 
                    icon={Users} 
                    color="text-primary" 
                />
                <StatCard 
                    title="Total Jobs" 
                    value={stats?.totalJobs} 
                    icon={Briefcase} 
                    color="text-secondary" 
                />
                <StatCard 
                    title="Jobs Completed" 
                    value={stats?.completedJobs} 
                    icon={CheckCircle2} 
                    color="text-success" 
                />
                <StatCard 
                    title="Pending Verifications" 
                    value={stats?.pendingVerificationCount} 
                    icon={AlertCircle} 
                    color="text-destructive" 
                />
            </div>
        
            {/* Admin Menu */}
            <h2 className="text-2xl font-bold mb-6">Management Tools</h2>
            <div className="grid md:grid-cols-2 gap-6">
            {menuItems.map((item) => (
                <Card 
                    key={item.path} 
                    className="cursor-pointer hover:border-primary transition-colors hover-elevate border-2"
                    onClick={() => setLocation(item.path)}
                >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                    <item.icon className="h-5 w-5 text-primary" />
                    {item.title}
                    </CardTitle>
                    {item.badge && (
                    <Badge variant={item.badgeVariant} className="text-sm">
                        {item.badge}
                    </Badge>
                    )}
                </CardHeader>
                <CardContent>
                    <CardDescription>{item.description}</CardDescription>
                    <Button variant="link" className="p-0 mt-2">
                        Go to Section 
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                </CardContent>
                </Card>
            ))}
            </div>
        </>
      )}
    </div>
  );
}
