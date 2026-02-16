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
        const invoice = await response.json();
        // Debug log to diagnose status issues
        if (invoice?.status) {
          console.log(`[InvoiceForm] Fetched invoice with status: ${invoice.status}`, { id: invoice.id, jobId });
        }
        return invoice;
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

  const resetDeclinedInvoiceMutation = useMutation({
    mutationFn: async () => {
      // Update declined invoice back to draft status with cleared reason
      const response = await apiRequest('PATCH', `/api/invoices/${existingInvoice.id}`, {
        amount: existingInvoice.amount,
        description: existingInvoice.description,
        notes: existingInvoice.notes || '',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Invoice reset to draft. You can now edit and send it again.',
      });
      // Populate form fields with invoice data
      setAmount(existingInvoice.amount.toString());
      setDescription(existingInvoice.description);
      setNotes(existingInvoice.notes || '');
      setPaymentMethod(existingInvoice.paymentMethod);
      setIsEditMode(true);
      queryClient.invalidateQueries({ queryKey: ['invoice', jobId] });
      refetchInvoice();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset invoice',
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
        <div style="padding: 40px; background: white; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="margin-bottom: 30px;">
            <h1 style="font-size: 36px; font-weight: bold; margin: 0 0 5px 0; color: #1f2937;">INVOICE</h1>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">Invoice #${existingInvoice.id.substring(0, 8)}</p>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 2px solid #e5e7eb;" />
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
            <div>
              <p style="font-size: 12px; color: #9ca3af; font-weight: 600; margin-bottom: 5px; text-transform: uppercase;">Service Provider</p>
              <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0;">Invoice Details</p>
              <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">Created: ${new Date(existingInvoice.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <p style="font-size: 12px; color: #9ca3af; font-weight: 600; margin-bottom: 5px; text-transform: uppercase;">Amount Due</p>
              <p style="font-size: 28px; font-weight: 700; color: #2563eb; margin: 0;">${formatPula(typeof existingInvoice.amount === 'string' ? parseFloat(existingInvoice.amount) : existingInvoice.amount)}</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">Payment Method: ${existingInvoice.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : existingInvoice.paymentMethod === 'card' ? 'Card Payment' : 'Cash'}</p>
            </div>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 2px solid #e5e7eb;" />
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 14px; font-weight: 600;">Service Description</h3>
            <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${existingInvoice.description}</p>
            ${existingInvoice.notes ? `<hr style="margin: 15px 0; border: none; border-top: 1px solid #d1d5db;" /><h4 style="margin: 0 0 8px 0; color: #1f2937; font-size: 13px; font-weight: 600;">Additional Notes</h4><p style="color: #374151; font-size: 13px; margin: 0; white-space: pre-wrap;">${existingInvoice.notes}</p>` : ''}
          </div>
          
          <div style="background: #eff6ff; padding: 24px; border-left: 4px solid #2563eb; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #bfdbfe;">
              <span style="color: #374151; font-weight: 600;">Subtotal:</span>
              <span style="color: #374151; font-weight: 600;">${formatPula(typeof existingInvoice.amount === 'string' ? parseFloat(existingInvoice.amount) : existingInvoice.amount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: bold; font-size: 16px; color: #1f2937;">Total Amount:</span>
              <span style="font-weight: bold; font-size: 20px; color: #2563eb;">${formatPula(typeof existingInvoice.amount === 'string' ? parseFloat(existingInvoice.amount) : existingInvoice.amount)}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">SASA Job Delivery Platform</p>
            <p style="color: #9ca3af; font-size: 11px; margin: 5px 0 0 0;">This is an electronically generated invoice</p>
          </div>
        </div>
      `;
      document.body.appendChild(tempDiv);

      // Generate PDF from the temporary element with better error handling
      const element = tempDiv.querySelector('div');
      if (!element) {
        throw new Error('Could not create PDF element');
      }
      
      try {
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;
        
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          allowTaint: true,
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

        const fileName = `invoice-${existingInvoice.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        toast({
          title: 'Success',
          description: 'Invoice downloaded successfully',
        });
      } catch (pdferror) {
        console.error('PDF generation error:', pdferror);
        throw new Error(`PDF generation failed: ${pdferror.message}`);
      }

      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
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
    
    // Prepare message with invoice details
    const statusText = existingInvoice.status.charAt(0).toUpperCase() + existingInvoice.status.slice(1);
    const message = encodeURIComponent(
      `📋 *Invoice Details*\n\n` +
      `*Invoice ID:* ${existingInvoice.id.substring(0, 8)}\n` +
      `*Amount:* ${formatPula(typeof existingInvoice.amount === 'string' ? parseFloat(existingInvoice.amount) : existingInvoice.amount)}\n` +
      `*Payment Method:* ${existingInvoice.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : existingInvoice.paymentMethod === 'card' ? 'Card Payment' : 'Cash'}\n\n` +
      `*Description:*\n${existingInvoice.description}\n\n` +
      `${existingInvoice.notes ? `*Notes:*\n${existingInvoice.notes}\n\n` : ''}` +
      `*Status:* ${statusText}\n` +
      `*Created:* ${new Date(existingInvoice.createdAt).toLocaleDateString()}\n\n` +
      `---\n` +
      `Shared via SASA Job Delivery Platform`
    );

    // Try to use requester phone if available, otherwise use web WhatsApp
    const phoneNumber = requesterData?.phone?.replace(/\D/g, '');
    if (phoneNumber) {
      // Open WhatsApp with the specific contact
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    } else {
      // Fall back to web WhatsApp
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

  const isLoading = createInvoiceMutation.isPending || updateInvoiceMutation.isPending || sendInvoiceMutation.isPending || resetDeclinedInvoiceMutation.isPending;
  const isDraftStatus = existingInvoice && existingInvoice.status === 'draft';
  const isSentOrAccepted = existingInvoice && (existingInvoice.status === 'sent' || existingInvoice.status === 'approved');
  const isPaidStatus = existingInvoice && existingInvoice.status === 'paid';
  const isDeclinedStatus = existingInvoice && existingInvoice.status === 'declined';
  const isCancelledStatus = existingInvoice && existingInvoice.status === 'cancelled';
  
  // IMPORTANT: Treat both 'declined' and 'cancelled' as "needs revision" status
  // Provider should be able to edit and resend in both cases
  const isNeedsRevisionStatus = isDeclinedStatus || isCancelledStatus;

  // Treat cancelled invoices as non-existent for form purposes
  const hasActiveInvoice = existingInvoice && existingInvoice.status !== 'cancelled';

  // Debug: Log status for troubleshooting
  if (existingInvoice && existingInvoice.status) {
    console.log('[InvoiceForm] Invoice status check:', { 
      status: existingInvoice.status, 
      isDraftStatus, 
      isSentOrAccepted, 
      isDeclinedStatus,
      isCancelledStatus,
      isNeedsRevisionStatus,
      invoiceId: existingInvoice.id 
    });
  }

  // Show edit form for BOTH declined AND cancelled invoices (provider needs to revise)
  if (isNeedsRevisionStatus) {
    const statusLabel = isCancelledStatus ? 'Cancelled' : 'Declined';
    const statusMessage = isCancelledStatus 
      ? 'This invoice has been cancelled and needs to be revised before resending' 
      : 'Your invoice has been declined by the requester';
    
    console.log(`[InvoiceForm] Rendering ${statusLabel} invoice UI with edit form`, { 
      invoiceId: existingInvoice.id, 
      declineReason: existingInvoice.declineReason 
    });
    return (
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-red-900 dark:text-red-100">Invoice {statusLabel}</CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                {statusMessage}
              </CardDescription>
            </div>
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingInvoice.declineReason && (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reason for Change:</p>
              <p className="text-gray-700 dark:text-gray-200 italic">{existingInvoice.declineReason}</p>
            </div>
          )}

          {!existingInvoice.declineReason && (
            <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                No specific reason was provided. Please review the invoice and make necessary adjustments before resending.
              </AlertDescription>
            </Alert>
          )}

          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Options:</p>
            <div className="flex gap-2">
              <Button
                onClick={() => resetDeclinedInvoiceMutation.mutate()}
                disabled={isLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Edit Invoice
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Update the invoice details and send it again.
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

  // Show invoice when paid (read-only with download and share options)
  if (isPaidStatus) {
    return (
      <Card className="border-green-200 dark:border-green-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-green-900 dark:text-green-100">Invoice Paid</CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">This invoice has been paid</CardDescription>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">✓ Paid</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatPula(parseFloat(existingInvoice.amount))}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                <p className="font-semibold capitalize">{existingInvoice.paymentMethod.replace('_', ' ')}</p>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</p>
              <p className="text-gray-700 dark:text-gray-300">{existingInvoice.description}</p>
            </div>
            {existingInvoice.notes && (
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes</p>
                <p className="text-gray-700 dark:text-gray-300">{existingInvoice.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Download & Share Options</p>
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
                className="w-full bg-green-50 hover:bg-green-100 dark:bg-green-900 dark:hover:bg-green-800"
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
  // This is a fallback that should rarely be reached
  if (existingInvoice && existingInvoice.status === 'declined') {
    // If we reach here, show the declined UI
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
                onClick={() => resetDeclinedInvoiceMutation.mutate()}
                disabled={isLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white font-semibold"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Edit Invoice
              </Button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Update the invoice details based on the feedback and send it again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invoice with status "{existingInvoice?.status || 'unknown'}" cannot be edited.
            {existingInvoice?.status === 'sent' && ' The requester is reviewing it.'}
            {existingInvoice?.status === 'approved' && ' The invoice has been approved.'}
            {existingInvoice?.status === 'paid' && ' Payment has been received.'}
            {existingInvoice?.status === 'cancelled' && ' This invoice has been cancelled.'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
