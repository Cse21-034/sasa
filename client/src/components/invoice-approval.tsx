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
import { AlertCircle, Loader2, CheckCircle2, XCircle, Download, Mail, MessageCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { generateInvoicePDF, shareViaEmail, shareViaWhatsApp } from '@/lib/invoice-pdf';
import { InvoiceDetailDisplay } from './invoice-detail-display';

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
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
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

  // Fetch provider and requester details for invoice display
  const { data: providerData } = useQuery({
    queryKey: ['user', invoice?.providerId],
    queryFn: async () => {
      if (!invoice?.providerId) return null;
      try {
        const response = await apiRequest('GET', `/api/providers/${invoice.providerId}`);
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: !!invoice?.providerId,
  });

  const { data: requesterData } = useQuery({
    queryKey: ['user', invoice?.requesterId],
    queryFn: async () => {
      if (!invoice?.requesterId) return null;
      try {
        const response = await apiRequest('GET', `/api/users/${invoice.requesterId}`);
        return response.json();
      } catch {
        return null;
      }
    },
    enabled: !!invoice?.requesterId,
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

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    try {
      setIsPdfGenerating(true);
      // Create a hidden temporary element with invoice details
      const tempDiv = document.createElement('div');
      tempDiv.id = 'temp-invoice-pdf';
      tempDiv.style.display = 'none';
      tempDiv.innerHTML = `
        <div style="padding: 40px; background: white;">
          <h1 style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">INVOICE</h1>
          <p style="color: #666; font-size: 14px;">Invoice ID: ${invoice.id}</p>
          <p style="color: #666; font-size: 14px;">Created: ${new Date(invoice.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}</p>
          
          <hr style="margin: 30px 0;" />
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
            <div>
              <p style="font-weight: bold; color: #999; font-size: 12px; margin-bottom: 5px;">FROM (SERVICE PROVIDER)</p>
              <p style="font-weight: bold; font-size: 18px;">${providerData?.name || 'Provider'}</p>
              <p style="color: #666; font-size: 14px;">${providerData?.email || ''}</p>
              <p style="color: #666; font-size: 14px;">${providerData?.phone || ''}</p>
            </div>
            <div>
              <p style="font-weight: bold; color: #999; font-size: 12px; margin-bottom: 5px;">BILL TO (REQUESTER)</p>
              <p style="font-weight: bold; font-size: 18px;">${requesterData?.name || 'Requester'}</p>
              <p style="color: #666; font-size: 14px;">${requesterData?.email || ''}</p>
              <p style="color: #666; font-size: 14px;">${requesterData?.phone || ''}</p>
            </div>
          </div>
          
          <hr style="margin: 30px 0;" />
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;"><strong>Description:</strong> ${invoice.description}</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 10px;"><strong>Payment Method:</strong> ${invoice.paymentMethod.replace('_', ' ')}</p>
            ${invoice.notes ? `<p style="color: #666; font-size: 14px;"><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
          </div>
          
          <hr style="margin: 30px 0;" />
          
          <div style="background: #eff6ff; padding: 24px; border: 2px solid #bfdbfe; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #666;">Subtotal:</span>
              <span>${formatPula(typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount)}</span>
            </div>
            <hr style="margin: 10px 0;" />
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: bold; font-size: 18px;">Amount Due:</span>
              <span style="font-weight: bold; font-size: 24px; color: #2563eb;">${formatPula(typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount)}</span>
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

        const fileName = `invoice-${invoice.id}-${new Date().toISOString().split('T')[0]}.pdf`;
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
    if (!invoice || !requesterData?.email) return;
    const subject = encodeURIComponent(`Invoice #${invoice.id}`);
    const body = encodeURIComponent(`
Hi ${requesterData?.name},

Please find the invoice details below:

Amount: ${formatPula(typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount)}
Payment Method: ${invoice.paymentMethod.replace('_', ' ')}
Description: ${invoice.description}
Status: ${invoice.status}

Invoice ID: ${invoice.id}
Created: ${new Date(invoice.createdAt).toLocaleDateString()}

Best regards,
${providerData?.name || 'Service Provider'}
    `);

    window.location.href = `mailto:${requesterData.email}?subject=${subject}&body=${body}`;
  };

  const handleShareWhatsApp = () => {
    if (!invoice) return;
    
    // Prepare message with invoice details
    const statusText = invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1);
    const message = encodeURIComponent(
      `📋 *Invoice Details*\n\n` +
      `*Invoice ID:* ${invoice.id.substring(0, 8)}\n` +
      `*Amount:* ${formatPula(typeof invoice.amount === 'string' ? parseFloat(invoice.amount) : invoice.amount)}\n` +
      `*Payment Method:* ${invoice.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : invoice.paymentMethod === 'card' ? 'Card Payment' : 'Cash'}\n\n` +
      `*Description:*\n${invoice.description}\n\n` +
      `${invoice.notes ? `*Notes:*\n${invoice.notes}\n\n` : ''}` +
      `*Status:* ${statusText}\n` +
      `*Created:* ${new Date(invoice.createdAt).toLocaleDateString()}\n\n` +
      `---\n` +
      `Shared via SASA Job Delivery Platform`
    );

    // Try to use provider phone if available, otherwise use web WhatsApp
    const phoneNumber = providerData?.phone?.replace(/\D/g, '');
    if (phoneNumber) {
      // Open WhatsApp with the specific contact
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    } else {
      // Fall back to web WhatsApp
      window.open(`https://web.whatsapp.com/send?text=${message}`, '_blank');
    }
  };

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
      <InvoiceDetailDisplay
        invoice={invoice}
        provider={providerData}
        requester={requesterData}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Invoice Actions</CardTitle>
          <CardDescription>Download or share this invoice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {(canApprove || canDecline) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Review & Approve</CardTitle>
            <CardDescription>Take action on this invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
      )}

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
