import { useAuth } from '@/lib/auth-context';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InvoiceForm } from './invoice-form';
import { InvoiceApproval } from './invoice-approval';
import { PaymentForm } from './payment-form';
import { InvoicesList } from './invoices-list';
import { Skeleton } from '@/components/ui/skeleton';

interface InvoicePaymentManagementProps {
  jobId: string;
  providerId: string;
  requesterId: string;
  onSuccess?: () => void;
}

interface Job {
  id: string;
  title: string;
  status: string;
  invoiceStatus?: string;
  paymentStatus?: string;
}

export function InvoicePaymentManagement({
  jobId,
  providerId,
  requesterId,
  onSuccess,
}: InvoicePaymentManagementProps) {
  const { user } = useAuth();

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/jobs/${jobId}`);
      return response.json() as Promise<Job>;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const isProvider = user?.id === providerId;
  const isRequester = user?.id === requesterId;

  if (!isProvider && !isRequester) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>You don't have access to manage invoices for this job.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider View */}
      {isProvider && (
        <Tabs defaultValue="invoice" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="payment">Payment Status</TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="space-y-4">
            <InvoiceForm jobId={jobId} providerId={providerId} onSuccess={onSuccess} />
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Track payment for your invoice</CardDescription>
              </CardHeader>
              <CardContent>
                <InvoicesList jobId={jobId} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Requester View */}
      {isRequester && (
        <Tabs defaultValue="invoice" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>

          <TabsContent value="invoice" className="space-y-4">
            <InvoiceApproval jobId={jobId} onSuccess={onSuccess} />
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <PaymentForm jobId={jobId} onSuccess={onSuccess} />
          </TabsContent>
        </Tabs>
      )}

      {/* Workflow Status Alert */}
      {job && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base text-blue-900">Job Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <span>Invoice must be approved before starting the job</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-600" />
              <span>Payment must be received before completing the job</span>
            </div>
            {isProvider && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-600" />
                <span>You cannot apply to new jobs until current jobs are completed</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
