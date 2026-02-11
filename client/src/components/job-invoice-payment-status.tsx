import { useQuery } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Clock, DollarSign, AlertOctagon } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatPula } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface JobInvoicePaymentStatusProps {
  jobId: string;
  className?: string;
}

interface InvoiceStatus {
  hasInvoice: boolean;
  status?: string;
  amount?: number;
}

interface PaymentStatus {
  hasPayment: boolean;
  status?: string;
  amount?: number;
  method?: string;
}

export function JobInvoicePaymentStatus({ jobId, className }: JobInvoicePaymentStatusProps) {
  const { data: invoiceStatus } = useQuery({
    queryKey: ['invoiceStatus', jobId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/jobs/${jobId}/invoice-status`);
        return response.json() as Promise<InvoiceStatus>;
      } catch {
        return null;
      }
    },
  });

  const { data: paymentStatus } = useQuery({
    queryKey: ['paymentStatus', jobId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', `/api/invoices/${jobId}/payment-status`);
        return response.json() as Promise<PaymentStatus>;
      } catch {
        return null;
      }
    },
  });

  if (!invoiceStatus && !paymentStatus) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Invoice Status */}
      {invoiceStatus?.hasInvoice && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
          {invoiceStatus.status === 'approved' && (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900">Invoice Approved</p>
                <p className="text-xs text-green-700">{formatPula(invoiceStatus.amount || 0)}</p>
              </div>
            </>
          )}
          {invoiceStatus.status === 'sent' && (
            <>
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">Invoice Pending</p>
                <p className="text-xs text-blue-700">Awaiting approval - {formatPula(invoiceStatus.amount || 0)}</p>
              </div>
            </>
          )}
          {invoiceStatus.status === 'draft' && (
            <>
              <AlertOctagon className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-900">Invoice Draft</p>
                <p className="text-xs text-orange-700">Not yet sent - {formatPula(invoiceStatus.amount || 0)}</p>
              </div>
            </>
          )}
          {invoiceStatus.status === 'declined' && (
            <>
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-900">Invoice Declined</p>
                <p className="text-xs text-red-700">Provider requested to revise</p>
              </div>
            </>
          )}
          {invoiceStatus.status === 'paid' && (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900">Invoice Paid</p>
                <p className="text-xs text-green-700">{formatPula(invoiceStatus.amount || 0)}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Payment Status */}
      {paymentStatus?.hasPayment && (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-white">
          {paymentStatus.status === 'paid' && (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-900">Payment Received</p>
                <p className="text-xs text-green-700">
                  {formatPula(paymentStatus.amount || 0)} via {paymentStatus.method}
                </p>
              </div>
            </>
          )}
          {paymentStatus.status === 'unpaid' && (
            <>
              <DollarSign className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-900">Payment Pending</p>
                <p className="text-xs text-orange-700">
                  {formatPula(paymentStatus.amount || 0)} due via {paymentStatus.method}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
