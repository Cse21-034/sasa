import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Users, UserX, Search, AlertCircle, RefreshCw, XCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'requester' | 'provider' | 'supplier' | 'admin';
    status: 'active' | 'blocked' | 'deactivated';
    isVerified: boolean;
    isIdentityVerified: boolean;
    profilePhotoUrl: string | null;
    createdAt: string;
}

const useUsers = (roleFilter: string, statusFilter: string, searchQuery: string) => {
  return useQuery<User[]>({
    queryKey: ['adminUsers', { roleFilter, statusFilter, searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await apiRequest('GET', `/api/admin/users?${params.toString()}`);
      return res.json();
    },
    refetchInterval: 60000,
  });
};

const useUpdateUserStatus = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'active' | 'blocked' | 'deactivated' }) => {
      const res = await apiRequest('PATCH', `/api/admin/users/${id}/update-status`, { status });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `User ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
        description: `User ${data.name}'s status has been updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update user status.',
        variant: 'destructive',
      });
    },
  });
};

const StatusCell = ({ user }: { user: User }) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'warning' = 'secondary';
    let icon = <CheckCircle2 className="h-3 w-3 mr-1" />;

    if (user.status === 'blocked' || user.status === 'deactivated') {
        variant = 'destructive';
        icon = <XCircle className="h-3 w-3 mr-1" />;
    } else if (user.status === 'active' && user.isVerified) {
        variant = 'secondary';
        icon = <CheckCircle2 className="h-3 w-3 mr-1" />;
    } else if (user.status === 'active' && !user.isVerified) {
        variant = 'warning';
        icon = <AlertCircle className="h-3 w-3 mr-1" />;
    }

    return (
        <Badge variant={variant} className="capitalize">
            {icon}
            {user.status}
        </Badge>
    );
};

export default function AdminUsers() {
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSearch, setCurrentSearch] = useState('');

  const { data: users, isLoading, refetch } = useUsers(roleFilter, statusFilter, currentSearch);
  const updateStatusMutation = useUpdateUserStatus();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentSearch(searchQuery);
  };

  const ActionButton = ({ user }: { user: User }) => {
    // Cannot block/deactivate admins
    if (user.role === 'admin') {
      return <Badge variant="outline">Protected</Badge>;
    }
    
    const isBlocked = user.status === 'blocked' || user.status === 'deactivated';
    const newStatus = isBlocked ? 'active' : 'blocked';
    const actionText = isBlocked ? 'Activate' : 'Block';
    const actionIcon = isBlocked ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <UserX className="h-4 w-4 mr-2" />;
    const actionVariant = isBlocked ? 'default' : 'destructive';

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant={actionVariant} size="sm" disabled={updateStatusMutation.isPending || user.role === 'admin'}>
                    {actionIcon} {actionText}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{actionText} User: {user.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to {actionText.toLowerCase()} this account? 
                        This will prevent them from logging in and accessing features.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => updateStatusMutation.mutate({ id: user.id, status: newStatus as any })}
                        className={buttonVariants({ variant: actionVariant })}
                    >
                        Confirm {actionText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
  };


  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Users Management
        </h1>
        <p className="text-muted-foreground">View and manage all platform users. Block or deactivate accounts as needed.</p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 border-2">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select onValueChange={setRoleFilter} value={roleFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="requester">Requester</SelectItem>
                <SelectItem value="provider">Provider</SelectItem>
                <SelectItem value="supplier">Supplier</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="deactivated">Deactivated</SelectItem>
              </SelectContent>
            </Select>
          </form>
          <Button variant="outline" size="sm" type="submit" onClick={handleSearch} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Apply Filters
          </Button>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>User Accounts ({users?.length || 0})</CardTitle>
          <CardDescription>A list of all users on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto my-12" />
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">User</TableHead>
                    <TableHead className="min-w-[150px]">Name/Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profilePhotoUrl || undefined} />
                            <AvatarFallback className="text-xs">{user.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusCell user={user} />
                      </TableCell>
                      <TableCell>
                        {user.isVerified ? (
                          <Badge variant="default" className="bg-success text-success-foreground">Verified</Badge>
                        ) : (
                          <Badge variant="warning">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionButton user={user} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
                No users found matching the criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
