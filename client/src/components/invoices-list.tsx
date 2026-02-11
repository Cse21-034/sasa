import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { formatPula } from '@/lib/utils';
import { format } from 'date-fns';

interface InvoicesListProps {
  jobId: string;
}

interface Invoice {
  id: string;
  status: 'draft' | 'sent' | 'approved' | 'declined' | 'paid' | 'cancelled';
  amount: number;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card';
  description: string;
  sentAt?: string;
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-purple-100 text-purple-800',
  declined: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
};

export function InvoicesList({ jobId }: InvoicesListProps) {
  const { data: invoice, isLoading } = useQuery({
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{formatPula(invoice.amount)}</p>
                <p className="text-sm text-gray-600">{invoice.description}</p>
              </div>
              <Badge className={statusColors[invoice.status]}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-600">Payment Method</p>
                <p className="font-medium">{paymentMethodLabels[invoice.paymentMethod]}</p>
              </div>
              <div>
                <p className="text-gray-600">Created</p>
                <p className="font-medium">{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</p>
              </div>
            </div>

            <div className="mt-3 space-y-1 text-sm">
              {invoice.sentAt && (
                <p className="text-gray-600">
                  Sent: <span className="font-medium">{format(new Date(invoice.sentAt), 'MMM d, HH:mm')}</span>
                </p>
              )}
              {invoice.approvedAt && (
                <p className="text-green-700">
                  Approved: <span className="font-medium">{format(new Date(invoice.approvedAt), 'MMM d, HH:mm')}</span>
                </p>
              )}
              {invoice.paidAt && (
                <p className="text-green-700">
                  Paid: <span className="font-medium">{format(new Date(invoice.paidAt), 'MMM d, HH:mm')}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
