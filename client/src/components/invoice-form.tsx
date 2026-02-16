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
import { AlertCircle, Loader2, Send, Edit2, BadgeCheck, Download, Mail, MessageCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface InvoiceFormProps {
  jobId: string;
  onSuccess?: () => void;
  providerId: string;
}

type PaymentMethod = 'cash' | 'bank_transfer' | 'card';

interface Invoice {
  id: string;
  jobId: string;
  providerId: string;
  requesterId: string;
  status: 'draft' | 'sent' | 'approved' | 'declined' | 'paid' | 'cancelled';
  amount: string | number;
  currency: string;
  paymentMethod: PaymentMethod;
  description: string;
  notes?: string;
  declineReason?: string;
  sentAt?: string;
  declinedAt?: string;
  createdAt: string;
}

export function InvoiceForm({ jobId, onSuccess, providerId }: InvoiceFormProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const { toast } = useToast();

  // Check if invoice already exists
  const { data: existingInvoice, refetch: refetchInvoice } = useQuery({
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

  // Fetch requester data for sharing
  const { data: requesterData } = useQuery({
    queryKey: ['requester', existingInvoice?.requesterId],
    queryFn: async () => {
      if (!existingInvoice?.requesterId) return null;
      try {
        const response = await apiRequest('GET', `/api/users/${existingInvoice.requesterId}`);
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: !!existingInvoice?.requesterId,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: {
      jobId: string;
      amount: string;
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
        description: 'Invoice created successfully. Review and send to requester.',
      });
      setAmount('');
      setDescription('');
      setNotes('');
      setPaymentMethod('cash');
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      refetchInvoice();
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
        description: 'Invoice updated successfully. Ready to send.',
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      refetchInvoice();
      setIsEditMode(false);
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

  const sendInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/invoices/${existingInvoice.id}/send`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice sent to requester for approval',
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      refetchInvoice();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invoice',
        variant: 'destructive',
      });
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/invoices/${existingInvoice.id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice deleted. You can now create a new invoice.',
      });
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      refetchInvoice();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete invoice',
        variant: 'destructive',
      });
    },
  });

  const handleDownloadPDF = async () => {
    if (!existingInvoice) return;
    try {
      setIsPdfGenerating(true);
      // Create a hidden temporary element with invoice details
      const tempDiv = document.createElement('div');
      tempDiv.id = 'temp-invoice-pdf';
      tempDiv.style.display = 'none';
      tempDiv.innerHTML = `
        <div style="padding: 40px; background: white;">
          <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">INVOICE</h1>
          <p style="color: #666; font-size: 14px;">Invoice ID: ${existingInvoice.id}</p>
          <p style="color: #666; font-size: 14px;">Created: ${new Date(existingInvoice.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</p>
          
          <hr style="margin: 30px 0;" />
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;"><strong>Description:</strong> ${existingInvoice.description}</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;"><strong>Payment Method:</strong> ${existingInvoice.paymentMethod.replace('_', ' ')}</p>
            ${existingInvoice.notes ? `<p style="color: #666; font-size: 14px;"><strong>Notes:</strong> ${existingInvoice.notes}</p>` : ''}
          </div>
          
          <hr style="margin: 30px 0;" />
          
          <div style="background: #eff6ff; padding: 24px; border: 2px solid #bfdbfe; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666;">Subtotal:</span>
              <span>${formatPula(typeof existingInvoice.amount === 'string' ? parseFloat(existingInvoice.amount) : existingInvoice.amount)}</span>
            </div>
            <hr style="margin: 10px 0;" />
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: bold; font-size: 18px;">Amount Due:</span>
              <span style="font-weight: bold; font-size: 24px; color: #2563eb;">${formatPula(typeof existingInvoice.amount === 'string' ? parseFloat(existingInvoice.amount) : existingInvoice.amount)}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 60px; color: #999; font-size: 12px;">
            <p>SASA Job Delivery Platform - www.sasajobs.com</p>
            <p>This is an electronically generated invoice</p>
          </div>
        </div>
      `;
      document.body.appendChild(tempDiv);

      // Generate PDF from the temporary element
      const element = tempDiv.querySelector('div');
      if (element) {
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        const fileName = `invoice-${existingInvoice.id}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        toast({
          title: 'Success',
          description: 'Invoice downloaded successfully',
        });
      }

      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleShareEmail = () => {
    if (!existingInvoice || !requesterData?.email) return;
    const subject = encodeURIComponent(`Invoice #${existingInvoice.id}`);
    const body = encodeURIComponent(`
Hi ${requesterData?.name},

Please find the invoice details below:

Amount: ${formatPula(typeof existingInvoice.amount === 'string' ? parseFloat(existingInvoice.amount) : existingInvoice.amount)}
Payment Method: ${existingInvoice.paymentMethod.replace('_', ' ')}
Description: ${existingInvoice.description}
Status: ${existingInvoice.status}

Invoice ID: ${existingInvoice.id}
Created: ${new Date(existingInvoice.createdAt).toLocaleDateString()}

Best regards,
Service Provider
    `);

    window.location.href = `mailto:${requesterData.email}?subject=${subject}&body=${body}`;
  };

  const handleShareWhatsApp = () => {
    if (!existingInvoice) return;
    const message = encodeURIComponent(`
📋 *Invoice #${existingInvoice.id}*

💰 *Amount:* ${formatPula(typeof existingInvoice.amount === 'string' ? parseFloat(existingInvoice.amount) : existingInvoice.amount)}
💳 *Payment Method:* ${existingInvoice.paymentMethod.replace('_', ' ')}

📝 *Description:* ${existingInvoice.description}

${existingInvoice.notes ? `📌 *Notes:* ${existingInvoice.notes}` : ''}

Status: ${existingInvoice.status}
Created: ${new Date(existingInvoice.createdAt).toLocaleDateString()}

---
Sent via SASA Job Delivery Platform
    `);

    const phoneNumber = requesterData?.phone?.replace(/\D/g, '');
    if (phoneNumber) {
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    } else {
      window.open(`https://web.whatsapp.com/send?text=${message}`, '_blank');
    }
  };

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

    if (existingInvoice && existingInvoice.status === 'draft') {
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

  const isLoading = createInvoiceMutation.isPending || updateInvoiceMutation.isPending || sendInvoiceMutation.isPending || deleteInvoiceMutation.isPending;
  const isDraftStatus = existingInvoice && existingInvoice.status === 'draft';
  const isSentOrAccepted = existingInvoice && (existingInvoice.status === 'sent' || existingInvoice.status === 'approved');
  const isDeclinedStatus = existingInvoice && existingInvoice.status === 'declined';

  // Show decline reason and create new invoice option when declined
  if (isDeclinedStatus) {
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-red-900 dark:text-red-100">Invoice Declined</CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                Your invoice has been declined by the requester
              </CardDescription>
            </div>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
              Declined
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingInvoice.declineReason && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reason for Decline:</p>
              <p className="text-gray-700 dark:text-gray-200 italic">{existingInvoice.declineReason}</p>
            </div>
          )}

          {!existingInvoice.declineReason && (
            <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                No specific reason was provided for the decline. Please review the invoice and make necessary adjustments.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Options:</p>
            <div className="flex gap-2">
              <Button
                onClick={() => deleteInvoiceMutation.mutate()}
                disabled={isLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create New Invoice
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              This will delete the declined invoice and allow you to create a new one with updated details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show invoice preview when sent or accepted
  if (isSentOrAccepted) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice</CardTitle>
              <CardDescription>Awaiting requester response</CardDescription>
            </div>
            <Badge className={existingInvoice.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
              {existingInvoice.status.charAt(0).toUpperCase() + existingInvoice.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold">{formatPula(parseFloat(existingInvoice.amount))}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold capitalize">{existingInvoice.paymentMethod.replace('_', ' ')}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
              <p className="text-gray-700">{existingInvoice.description}</p>
            </div>
            {existingInvoice.notes && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                <p className="text-gray-700">{existingInvoice.notes}</p>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm text-gray-600">
              <span>Status:</span>
              <span className="font-medium">{existingInvoice.status === 'approved' ? '✓ Approved' : 'Sent to Requester'}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Download & Share Options</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button
                onClick={handleDownloadPDF}
                disabled={isPdfGenerating}
                variant="outline"
                className="w-full"
              >
                {isPdfGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
              <Button
                onClick={handleShareEmail}
                variant="outline"
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Share via Email
              </Button>
              <Button
                onClick={handleShareWhatsApp}
                variant="outline"
                className="w-full bg-green-50 hover:bg-green-100"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Share via WhatsApp
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show invoice preview with send button when in draft status
  if (isDraftStatus && !isEditMode) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Invoice Preview</CardTitle>
              <CardDescription>Review before sending to requester</CardDescription>
            </div>
            <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="text-2xl font-bold">{formatPula(parseFloat(existingInvoice.amount))}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Payment Method</p>
                <p className="font-semibold capitalize">{existingInvoice.paymentMethod.replace('_', ' ')}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
              <p className="text-gray-700">{existingInvoice.description}</p>
            </div>
            {existingInvoice.notes && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Notes</p>
                <p className="text-gray-700">{existingInvoice.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditMode(true)}
              className="flex-1"
              disabled={isLoading}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              onClick={() => sendInvoiceMutation.mutate()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Send to Requester
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show edit form when in edit mode
  if (isDraftStatus && isEditMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Edit Invoice</CardTitle>
          <CardDescription>Update your invoice details before sending</CardDescription>
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
                value={amount || existingInvoice.amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description of Work *</Label>
              <Textarea
                id="description"
                placeholder="E.g., Labour for house cleaning, materials included..."
                value={description || existingInvoice.description}
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
                value={notes || existingInvoice.notes || ''}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditMode(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Invoice
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Show create form when no invoice exists
  if (!existingInvoice) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Invoice</CardTitle>
          <CardDescription>Send an invoice for your work</CardDescription>
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
              Create Invoice
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Show message when invoice is not in draft (shouldn't reach here)
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
