import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { formatPula } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InvoiceFormProps {
  jobId: string;
  onSuccess?: () => void;
  providerId: string;
}

type PaymentMethod = 'cash' | 'bank_transfer' | 'card';

export function InvoiceForm({ jobId, onSuccess, providerId }: InvoiceFormProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  // Check if invoice already exists
  const { data: existingInvoice } = useQuery({
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

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: {
      jobId: string;
      amount: number;
      currency: string;
      paymentMethod: PaymentMethod;
      description: string;
      notes: string;
    }) => {
      const response = await apiRequest('POST', '/api/invoices', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
      setAmount('');
      setDescription('');
      setNotes('');
      setPaymentMethod('cash');
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: async (data: {
      amount: string;
      description: string;
      notes: string;
    }) => {
      const response = await apiRequest('PATCH', `/api/invoices/${existingInvoice.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update invoice',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    const invoiceData = {
      amount: amount.toString(), // 💰 Send as string, not number
      description,
      notes,
    };

    if (existingInvoice) {
      updateInvoiceMutation.mutate(invoiceData);
    } else {
      createInvoiceMutation.mutate({
        jobId,
        currency: 'BWP',
        paymentMethod,
        ...invoiceData,
      });
    }
  };

  const isLoading = createInvoiceMutation.isPending || updateInvoiceMutation.isPending;
  const isEditing = existingInvoice && existingInvoice.status === 'draft';

  if (existingInvoice && existingInvoice.status !== 'draft') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invoice with status "{existingInvoice.status}" cannot be edited.
              {existingInvoice.status === 'sent' && ' The requester is reviewing it.'}
              {existingInvoice.status === 'approved' && ' The invoice has been approved.'}
              {existingInvoice.status === 'declined' && ' Please create a new invoice.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Invoice' : 'Create Invoice'}</CardTitle>
        <CardDescription>
          {isEditing 
            ? 'Update your invoice details before sending' 
            : 'Send an invoice for your work'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (BWP) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="500"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash (Manual Confirmation)</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description of Work *</Label>
            <Textarea
              id="description"
              placeholder="E.g., Labour for house cleaning, materials included..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="E.g., Half payment on start, half on completion..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Invoice' : 'Create Invoice'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
