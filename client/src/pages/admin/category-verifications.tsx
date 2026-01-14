import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Wrench, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';
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
import type { ProviderCategoryVerification } from '@shared/schema';

interface CategoryVerificationWithDetails extends ProviderCategoryVerification {
  provider?: {
    id: string;
    name: string;
    email: string;
    profilePhotoUrl: string | null;
  };
  category?: {
    id: number;
    name: string;
    description?: string;
  };
}

const usePendingCategoryVerifications = () => {
  return useQuery<CategoryVerificationWithDetails[]>({
    queryKey: ['adminPendingCategoryVerifications'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/provider-category-verifications');
      return res.json();
    },
    refetchInterval: 15000,
  });
};

const useApproveCategoryVerification = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ providerId, categoryId, notes }: { providerId: string; categoryId: number; notes?: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/provider-category-verifications/${providerId}/${categoryId}`, { 
        status: 'approved',
        rejectionReason: notes,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Category Approved',
        description: 'The provider is now verified for this category.',
      });
      queryClient.invalidateQueries({ queryKey: ['adminPendingCategoryVerifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Approval Failed',
        description: error.message || 'Could not approve category verification.',
        variant: 'destructive',
      });
    },
  });
};

const useRejectCategoryVerification = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ providerId, categoryId, rejectionReason }: { providerId: string; categoryId: number; rejectionReason: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/provider-category-verifications/${providerId}/${categoryId}`, { 
        status: 'rejected',
        rejectionReason,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Category Rejected',
        description: 'The provider has been notified of the rejection.',
      });
      queryClient.invalidateQueries({ queryKey: ['adminPendingCategoryVerifications'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Rejection Failed',
        description: error.message || 'Could not reject category verification.',
        variant: 'destructive',
      });
    },
  });
};

const ReviewModal = ({ 
  verification, 
  onClose 
}: { 
  verification: CategoryVerificationWithDetails | null; 
  onClose: () => void;
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const approveMutation = useApproveCategoryVerification();
  const rejectMutation = useRejectCategoryVerification();
  
  if (!verification) return null;

  const handleApprove = () => {
    approveMutation.mutate({ 
      providerId: (verification as any).providerId,
      categoryId: (verification as any).categoryId,
      notes: rejectionReason,
    }, {
      onSuccess: () => onClose()
    });
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({ 
      providerId: (verification as any).providerId,
      categoryId: (verification as any).categoryId,
      rejectionReason,
    }, {
      onSuccess: () => onClose()
    });
  };

  const isPending = approveMutation.isPending || rejectMutation.isPending;

  return (
    <Dialog open={!!verification} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-primary" />
            <DialogTitle>Category Verification Request</DialogTitle>
          </div>
          <DialogDescription>
            Review this provider's request for category verification.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 pt-4">
          <Card className="border">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={verification.provider?.profilePhotoUrl || undefined} />
                <AvatarFallback>{verification.provider?.name?.charAt(0) || 'P'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-bold">{verification.provider?.name || 'Unknown Provider'}</p>
                <p className="text-sm text-muted-foreground">{verification.provider?.email}</p>
                <Badge variant="secondary" className="mt-1">Provider</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-primary">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Requested Category
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Badge variant="default" className="text-base">
                {verification.category?.name || 'Unknown Category'}
              </Badge>
              {verification.category?.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {verification.category.description}
                </p>
              )}
            </CardContent>
          </Card>

          {(verification as any).documents && (verification as any).documents.length > 0 && (
            <Card className="border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Uploaded Documents ({(verification as any).documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="space-y-2">
                  {(verification as any).documents.map((doc: any, index: number) => (
                    <a
                      key={index}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-md border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm truncate text-blue-600 hover:underline">{doc.name}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm text-muted-foreground">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm">
                Submitted: {format(new Date((verification as any).createdAt), 'PPP p')}
              </p>
              <p className="text-sm text-muted-foreground">
                Status: {(verification as any).status}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {(verification as any).status === 'rejected' ? 'Rejection Reason' : 'Optional Notes'}
            </label>
            <Textarea
              placeholder={(verification as any).status === 'rejected' 
                ? 'This field is required for rejection' 
                : 'Add any notes for this decision...'}
              value={rejectionReason}
              onChange={(e: any) => setRejectionReason(e.target.value)}
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


export default function AdminCategoryVerifications() {
  const { data: pendingVerifications, isLoading, error } = usePendingCategoryVerifications();
  const [selectedVerification, setSelectedVerification] = useState<CategoryVerificationWithDetails | null>(null);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading category verification requests: {(error as any).message}</p>
        </div>
      </div>
    );
  }

  const verifications = pendingVerifications || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
        <Wrench className="h-7 w-7 text-primary" />
        Category Verifications
      </h1>
      <p className="text-muted-foreground mb-6">
        Review and approve provider requests for category verification.
      </p>
      
      <Card className="mb-8 border-2">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          <AlertCircle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{verifications.length}</div>
          <p className="text-xs text-muted-foreground">Awaiting review</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-12" />
      ) : verifications.length === 0 ? (
        <Card className="border-2 border-dashed mt-8">
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
            <h3 className="text-lg font-semibold">No Pending Requests</h3>
            <p className="text-muted-foreground">All category verification requests have been reviewed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {verifications.map((verification) => (
            <Card 
              key={`${(verification as any).providerId}-${(verification as any).categoryId}`}
              className="hover-elevate transition-all cursor-pointer border-2"
              onClick={() => setSelectedVerification(verification)}
              data-testid={`card-category-verification-${(verification as any).providerId}-${(verification as any).categoryId}`}
            >
              <CardContent className="p-4 flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={verification.provider?.profilePhotoUrl || undefined} />
                    <AvatarFallback>{verification.provider?.name?.charAt(0) || 'P'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{verification.provider?.name || 'Unknown Provider'}</p>
                    <p className="text-sm text-muted-foreground">{verification.provider?.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{verification.category?.name || 'Unknown'}</Badge>
                  {(verification as any).documents && (verification as any).documents.length > 0 && (
                    <Badge variant="secondary">
                      <FileText className="h-3 w-3 mr-1" />
                      {(verification as any).documents.length} doc{(verification as any).documents.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {format(new Date((verification as any).createdAt), 'MMM d, yyyy')}
                  </span>
                  <Button size="sm" variant="outline" data-testid={`button-review-category-${(verification as any).providerId}-${(verification as any).categoryId}`}>
                    Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReviewModal 
        verification={selectedVerification}
        onClose={() => setSelectedVerification(null)}
      />
    </div>
  );
}
