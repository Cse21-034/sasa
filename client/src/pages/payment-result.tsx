import { useLocation } from 'wouter';
import { CheckCircle2, XCircle, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'wouter';

export default function PaymentResult() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const status    = params.get('status')    || 'failed';
  const reference = params.get('reference') || '';
  const jobId     = params.get('jobId')     || '';
  const isSuccess = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardContent className="pt-10 pb-8 px-8 flex flex-col items-center text-center gap-4">

          {isSuccess ? (
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          )}

          <h1 className="text-2xl font-bold text-foreground">
            {isSuccess ? 'Payment Successful!' : 'Payment Failed'}
          </h1>

          <p className="text-muted-foreground">
            {isSuccess
              ? 'Your card payment has been confirmed. The provider has been notified and the job is ready to begin.'
              : 'Your payment could not be processed. Please try again or choose a different payment method.'}
          </p>

          {reference && (
            <div className="w-full rounded-lg bg-muted/50 px-4 py-3 text-sm text-left">
              <span className="text-muted-foreground">Reference: </span>
              <span className="font-mono font-medium break-all">{reference}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            {jobId ? (
              <Link href={`/jobs/${jobId}`} className="flex-1">
                <Button className="w-full gap-2">
                  <ArrowRight className="h-4 w-4" /> View Job
                </Button>
              </Link>
            ) : null}
            <Link href="/jobs" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" />
                {isSuccess ? 'Back to Jobs' : 'Try Again'}
              </Button>
            </Link>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
