import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatPula } from '@/lib/utils';
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PaymentFormProps {
  jobId: string;
  onSuccess?: () => void;
}

interface Invoice {
  id: string;
  jobId: string;
  status: string;
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
}

interface Payment {
  id: string;
  invoiceId: string;
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod: string;
  transactionId?: string;
  paidAt?: string;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash (Manual Confirmation)',
  bank_transfer: 'Bank Transfer',
  card: 'Card Payment',
};

export function PaymentForm({ jobId, onSuccess }: PaymentFormProps) {
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [showCashDialog, setShowCashDialog] = useState(false);
  const { toast } = useToast();

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', jobId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/invoices/job/${jobId}`);
        return response.json() as Promise<Invoice>;
      } catch {
        return null;
      }
    },
  });

  const { data: payment, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment', invoice?.id],
    queryFn: async () => {
      if (!invoice?.id) return null;
      try {
        const response = await apiRequest('GET', `/api/payments/invoice/${invoice.id}`);
        return response.json() as Promise<Payment>;
      } catch {
        return null;
      }
    },
    enabled: !!invoice?.id,
  });

  const processPaymentMutation = useMutation({
    mutationFn: async (data: {
      paymentMethod: string;
      transactionId?: string;
    }) => {
      const response = await apiRequest('POST', `/api/payments/${invoice!.id}/process`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Payment processed successfully',
      });
      setTransactionId('');
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['payment', invoice?.id] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process payment',
        variant: 'destructive',
      });
    },
  });

  const markCashPaidMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/payments/${invoice!.id}/mark-paid`, {
        notes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Payment marked as completed',
      });
      setNotes('');
      setShowCashDialog(false);
      queryClient.invalidateQueries({ queryKey: ['payment', invoice?.id] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark payment',
        variant: 'destructive',
      });
    },
  });

  const isLoading = invoiceLoading || paymentLoading;

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
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No invoice found for this job</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (invoice.status !== 'approved') {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invoice must be approved before payment. Current status: {invoice.status}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const isPaid = payment?.paymentStatus === 'paid';

  const handleCashPayment = () => {
    if (invoice.paymentMethod === 'cash') {
      setShowCashDialog(true);
    }
  };

  const handleCardPayment = () => {
    if (!transactionId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a transaction ID',
        variant: 'destructive',
      });
      return;
    }
    processPaymentMutation.mutate({
      paymentMethod: 'card',
      transactionId,
    });
  };

  const handleBankTransfer = () => {
    if (!transactionId.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a reference number',
        variant: 'destructive',
      });
      return;
    }
    processPaymentMutation.mutate({
      paymentMethod: 'bank_transfer',
      transactionId,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment</CardTitle>
              <CardDescription>Invoice payment</CardDescription>
            </div>
            {isPaid && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Paid
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Amount Due</p>
              <p className="text-2xl font-bold">{formatPula(invoice.amount)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Payment Method</p>
              <p className="text-lg font-semibold">
                {paymentMethodLabels[invoice.paymentMethod]}
              </p>
            </div>
          </div>

          {isPaid && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Payment received. The job is ready to start.
              </AlertDescription>
            </Alert>
          )}

          {!isPaid && (
            <>
              {invoice.paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Please arrange to pay the provider in cash. Once paid, confirm below.
                    </AlertDescription>
                  </Alert>
                  <Button
                    onClick={handleCashPayment}
                    disabled={markCashPaidMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {markCashPaidMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm Cash Payment
                  </Button>
                </div>
              )}

              {invoice.paymentMethod === 'card' && (
                <div className="space-y-3">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Enter the card transaction ID after completing payment.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="cardTxId">Card Transaction ID *</Label>
                    <Input
                      id="cardTxId"
                      placeholder="e.g., CHARGE_STRIPE_12345..."
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCardPayment}
                    disabled={processPaymentMutation.isPending || !transactionId}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {processPaymentMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Process Card Payment
                  </Button>
                </div>
              )}

              {invoice.paymentMethod === 'bank_transfer' && (
                <div className="space-y-3">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Transfer the amount to the provider's account. Enter the transfer reference below.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2">
                    <Label htmlFor="bankRef">Bank Transfer Reference *</Label>
                    <Input
                      id="bankRef"
                      placeholder="e.g., REF_BANK_20240211_123..."
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleBankTransfer}
                    disabled={processPaymentMutation.isPending || !transactionId}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {processPaymentMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Confirm Bank Transfer
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCashDialog} onOpenChange={setShowCashDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Cash Payment</DialogTitle>
            <DialogDescription>
              Confirm that you have paid {formatPula(invoice.amount)} to the provider in cash.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cashNotes">Notes (Optional)</Label>
              <Textarea
                id="cashNotes"
                placeholder="E.g., Paid on 11 Feb 2024..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCashDialog(false);
                setNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => markCashPaidMutation.mutate()}
              disabled={markCashPaidMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {markCashPaidMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
