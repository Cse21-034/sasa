import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, MapPin, CheckCircle2, XCircle, User, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

interface MigrationRequest {
  id: string;
  providerId: string;
  requestedCity: string;
  requestedRegion: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  createdAt: string;
  provider?: {
    id: string;
    name: string;
    email: string;
    profilePhotoUrl: string | null;
    primaryCity?: string;
    approvedServiceAreas?: string[];
  };
}

const usePendingMigrations = () => {
  return useQuery<MigrationRequest[]>({
    queryKey: ['adminPendingMigrations'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/migrations/pending');
      return res.json();
    },
    refetchInterval: 15000,
  });
};

const useApproveMigration = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await apiRequest('POST', `/api/admin/migrations/${id}/approve`, { notes });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Migration Approved',
        description: 'The provider can now work in the new service area.',
      });
      queryClient.invalidateQueries({ queryKey: ['adminPendingMigrations'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Approval Failed',
        description: error.message || 'Could not approve migration request.',
        variant: 'destructive',
      });
    },
  });
};

const useRejectMigration = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await apiRequest('POST', `/api/admin/migrations/${id}/reject`, { notes });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Migration Rejected',
        description: 'The provider has been notified of the rejection.',
      });
      queryClient.invalidateQueries({ queryKey: ['adminPendingMigrations'] });
      queryClient.invalidateQueries({ queryKey: ['adminOverviewStats'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Could not reject migration request.',
        variant: 'destructive',
      });
    },
  });
};

const ReviewModal = ({ 
  migration, 
  onClose 
}: { 
  migration: MigrationRequest | null; 
  onClose: () => void;
}) => {
  const [notes, setNotes] = useState('');
  const approveMutation = useApproveMigration();
  const rejectMutation = useRejectMigration();
  
  if (!migration) return null;

  const handleApprove = () => {
    approveMutation.mutate({ id: migration.id, notes }, {
      onSuccess: () => onClose()
    });
  };

  const handleReject = () => {
    rejectMutation.mutate({ id: migration.id, notes }, {
      onSuccess: () => onClose()
    });
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Dialog open={!!migration} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-primary" />
            <DialogTitle>Service Area Migration Request</DialogTitle>
          </div>
          <DialogDescription>
            Review this provider's request to expand their service area.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 pt-4">
          <Card className="border">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={migration.provider?.profilePhotoUrl || undefined} />
                <AvatarFallback>{migration.provider?.name?.charAt(0) || 'P'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-bold">{migration.provider?.name || 'Unknown Provider'}</p>
                <p className="text-sm text-muted-foreground">{migration.provider?.email}</p>
                <Badge variant="secondary" className="mt-1">Provider</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-muted-foreground">Current Service Areas</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {migration.provider?.approvedServiceAreas?.map((city, index) => (
                    <Badge key={index} variant="outline">{city}</Badge>
                  )) || <span className="text-muted-foreground">No areas approved</span>}
                </div>
              </CardContent>
            </Card>

            <Card className="border border-primary">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-primary flex items-center gap-1">
                  <ArrowRight className="h-4 w-4" />
                  Requested City
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Badge variant="default" className="text-base">
                  {migration.requestedCity}
                </Badge>
                {migration.requestedRegion && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Region: {migration.requestedRegion}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-muted-foreground">Reason for Migration</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm">{migration.reason}</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-muted-foreground">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm">
                Submitted: {format(new Date(migration.createdAt), 'PPP p')}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <label className="text-sm font-medium">Admin Notes (Optional)</label>
            <Textarea
              placeholder="Add any notes for this decision..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
              disabled={isPending}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={isPending}
          >
            {rejectMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="mr-2 h-4 w-4" />
            )}
            Reject
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={isPending}
          >
            {approveMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function AdminMigrations() {
  const { data: pendingMigrations, isLoading, error } = usePendingMigrations();
  const [selectedMigration, setSelectedMigration] = useState<MigrationRequest | null>(null);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading migration requests: {(error as any).message}</p>
        </div>
      </div>
    );
  }

  const migrations = pendingMigrations || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <MapPin className="h-7 w-7 text-primary" />
        Service Area Migrations
      </h1>
      <p className="text-muted-foreground mb-6">
        Review and approve provider requests to expand their service areas.
      </p>
      
      <Card className="mb-8 border-2">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <AlertCircle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{migrations.length}</div>
          <p className="text-xs text-muted-foreground">Awaiting review</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-12" />
      ) : migrations.length === 0 ? (
        <Card className="border-2 border-dashed mt-8">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
            <h3 className="text-lg font-semibold">No Pending Requests</h3>
            <p className="text-muted-foreground">All migration requests have been reviewed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {migrations.map((migration) => (
            <Card 
              key={migration.id} 
              className="hover-elevate transition-all cursor-pointer border-2"
              onClick={() => setSelectedMigration(migration)}
              data-testid={`card-migration-${migration.id}`}
            >
              <CardContent className="p-4 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={migration.provider?.profilePhotoUrl || undefined} />
                    <AvatarFallback>{migration.provider?.name?.charAt(0) || 'P'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{migration.provider?.name || 'Unknown Provider'}</p>
                    <p className="text-sm text-muted-foreground">{migration.provider?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{migration.provider?.primaryCity || 'Unknown'}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="default">{migration.requestedCity}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(migration.createdAt), 'MMM d, yyyy')}
                  </span>
                  <Button size="sm" variant="outline" data-testid={`button-review-migration-${migration.id}`}>
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReviewModal 
        migration={selectedMigration}
        onClose={() => setSelectedMigration(null)}
      />
    </div>
  );
}
