import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatPula } from '@/lib/utils';
import { AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface InvoiceApprovalProps {
  jobId: string;
  onSuccess?: () => void;
}

interface Invoice {
  id: string;
  jobId: string;
  providerId: string;
  requesterId: string;
  status: 'draft' | 'sent' | 'approved' | 'declined' | 'paid' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  description: string;
  notes?: string;
  sentAt?: string;
  approvedAt?: string;
  declinedAt?: string;
  paidAt?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export function InvoiceApproval({ jobId, onSuccess }: InvoiceApprovalProps) {
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const { toast } = useToast();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', jobId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/invoices/job/${jobId}`);
        return response.json();
      } catch {
        return null;
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/invoices/${invoice.id}/approve`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice approved. You can now proceed with payment.',
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve invoice',
        variant: 'destructive',
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (reason?: string) => {
      const response = await apiRequest('POST', `/api/invoices/${invoice.id}/decline`, {
        reason,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice declined. Provider will revise and resubmit.',
      });
      setDeclineReason('');
      setShowDeclineDialog(false);
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to decline invoice',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) {
    return null;
  }

  const canApprove = invoice.status === 'sent';
  const canDecline = invoice.status === 'sent';

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice</CardTitle>
              <CardDescription>From the provider</CardDescription>
            </div>
            <Badge className={statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Amount</p>
              <p className="text-2xl font-bold text-green-600">
                {formatPula(invoice.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Payment Method</p>
              <p className="text-lg font-semibold capitalize">
                {invoice.paymentMethod.replace('_', ' ')}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Work Description</p>
            <p className="text-gray-700 bg-gray-50 p-3 rounded-md border">{invoice.description}</p>
          </div>

          {invoice.notes && (
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Notes</p>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-md border">{invoice.notes}</p>
            </div>
          )}

          {invoice.status === 'sent' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review the invoice details carefully before deciding to approve or request changes.
              </AlertDescription>
            </Alert>
          )}

          {invoice.status === 'approved' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                You have approved this invoice. You can now proceed with payment.
              </AlertDescription>
            </Alert>
          )}

          {invoice.status === 'declined' && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Invoice has been sent back to the provider for revision.
              </AlertDescription>
            </Alert>
          )}

          {invoice.status === 'paid' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Payment has been received. The provider can now start the job.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {canApprove && (
              <Button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {approveMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Approve Invoice
              </Button>
            )}
            {canDecline && (
              <Button
                onClick={() => setShowDeclineDialog(true)}
                disabled={declineMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {declineMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Request Changes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Invoice Changes</DialogTitle>
            <DialogDescription>
              Let the provider know what changes you'd like them to make.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Changes (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="E.g., Please reduce the amount by 20%..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeclineDialog(false);
                setDeclineReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => declineMutation.mutate(declineReason || undefined)}
              disabled={declineMutation.isPending}
              variant="destructive"
            >
              {declineMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Request Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
