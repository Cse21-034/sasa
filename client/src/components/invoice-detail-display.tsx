import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatPula } from '@/lib/utils';

interface Invoice {
  id: string;
  jobId: string;
  providerId: string;
  requesterId: string;
  status: 'draft' | 'sent' | 'approved' | 'declined' | 'paid' | 'cancelled';
  amount: string | number;
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

interface ProviderProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
}

interface RequesterProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface InvoiceDetailDisplayProps {
  invoice: Invoice;
  provider?: ProviderProfile;
  requester?: RequesterProfile;
  isForPDF?: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

const paymentMethodDisplay: Record<string, string> = {
  cash: '💵 Cash (Manual Confirmation)',
  bank_transfer: '🏦 Bank Transfer',
  card: '💳 Card Payment',
};

export function InvoiceDetailDisplay({
  invoice,
  provider,
  requester,
  isForPDF = false,
}: InvoiceDetailDisplayProps) {
  return (
    <div id="invoice-detail" className={isForPDF ? 'p-8 bg-white' : ''}>
      <Card className={isForPDF ? 'border-0 shadow-none' : ''}>
        <CardHeader>
          <div className={isForPDF ? 'mb-4' : 'flex items-center justify-between'}>
            <div>
              <CardTitle className="text-3xl font-bold mb-2">INVOICE</CardTitle>
              <p className="text-sm text-gray-600">Invoice ID: {invoice.id}</p>
              <p className="text-sm text-gray-600">
                Created: {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {!isForPDF && (
              <Badge className={statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            )}
          </div>
          {isForPDF && (
            <Badge className={statusColors[invoice.status] || 'bg-gray-100 text-gray-800'}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Provider and Requester Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">From (Service Provider)</h3>
              <p className="font-bold text-lg">{provider?.name || 'Provider'}</p>
              {provider?.companyName && <p className="text-gray-600">{provider.companyName}</p>}
              <p className="text-gray-600 text-sm">{provider?.email}</p>
              {provider?.phone && <p className="text-gray-600 text-sm">{provider.phone}</p>}
            </div>

            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 mb-2">Bill To (Requester)</h3>
              <p className="font-bold text-lg">{requester?.name || 'Requester'}</p>
              <p className="text-gray-600 text-sm">{requester?.email}</p>
              {requester?.phone && <p className="text-gray-600 text-sm">{requester.phone}</p>}
            </div>
          </div>

          <Separator />

          {/* Invoice Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Invoice Details</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Description:</span>
                <span className="font-semibold text-gray-900 text-right flex-1 ml-4">{invoice.description}</span>
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between items-center">
                <span className="text-gray-700">Payment Method:</span>
                <span className="font-semibold text-gray-900">{paymentMethodDisplay[invoice.paymentMethod]}</span>
              </div>

              {invoice.notes && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between items-start">
                    <span className="text-gray-700">Notes:</span>
                    <span className="font-semibold text-gray-900 text-right flex-1 ml-4">{invoice.notes}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator />

          {/* Amount Due */}
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-lg">{formatPula(parseFloat(invoice.amount))}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between items-center">
              <span className="font-bold text-xl text-gray-900">Amount Due:</span>
              <span className="font-bold text-3xl text-blue-600">{formatPula(parseFloat(invoice.amount))}</span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Status History</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span className="text-gray-600">
                  Created: {new Date(invoice.createdAt).toLocaleDateString()}
                </span>
              </div>
              {invoice.sentAt && (
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  <span className="text-gray-600">
                    Sent: {new Date(invoice.sentAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {invoice.approvedAt && (
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-600">
                    Approved: {new Date(invoice.approvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {invoice.declinedAt && (
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                  <span className="text-gray-600">
                    Declined: {new Date(invoice.declinedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  <span className="text-gray-600">
                    Paid: {new Date(invoice.paidAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isForPDF && (
            <div className="absolute bottom-10 left-0 right-0 text-center text-gray-400 text-xs">
              <p>SASA Job Delivery Platform - www.sasajobs.com</p>
              <p>This is an electronically generated invoice</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
