import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import {
  MapPin, Calendar, AlertCircle, MessageSquare, Star, CheckCircle2,
  ArrowLeft, Flag, DollarSign, Navigation, XCircle, ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Job } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function JobDetail() {
  const [, params] = useRoute('/jobs/:id');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [providerCharge, setProviderCharge] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [ratingComment, setRatingComment] = useState('');
  const [showReportDialog, setShowReportDialog] = useState(false);

  const jobId = params?.id;

  const { data: job, isLoading, error } = useQuery<Job & { requester: any; provider: any; category: any }>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      const response = await apiRequest('GET', `/api/jobs/${jobId}`);
      return response.json();
    },
    enabled: !!jobId,
  });

  const acceptJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('POST', `/api/jobs/${jobId}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({ title: 'Job accepted!', description: 'You can now start working on this job.' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('PATCH', `/api/jobs/${jobId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({ title: 'Status updated', description: 'Job status has been updated successfully.' });
    },
  });

  const setChargeMutation = useMutation({
    mutationFn: async (charge: string) => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('POST', `/api/jobs/${jobId}/set-charge`, { providerCharge: charge });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({ title: 'Charge set successfully', description: 'Your charge has been saved.' });
      setProviderCharge('');
    },
    onError: (error: any) => {
      toast({ title: 'Failed to set charge', description: error.message, variant: 'destructive' });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (amount: string) => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('POST', `/api/jobs/${jobId}/confirm-payment`, { amountPaid: amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({ title: 'Payment confirmed', description: 'Payment has been recorded successfully.' });
      setAmountPaid('');
    },
    onError: (error: any) => {
      toast({ title: 'Failed to confirm payment', description: error.message, variant: 'destructive' });
    },
  });

  const submitRatingMutation = useMutation({
    mutationFn: async () => {
      if (!jobId || !job?.providerId) throw new Error('Missing data');
      const res = await apiRequest('POST', '/api/ratings', {
        jobId,
        toUserId: job.providerId,
        rating,
        comment: ratingComment,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({ title: 'Rating submitted', description: 'Thank you for your feedback!' });
      setRating(0);
      setRatingComment('');
    },
    onError: (error: any) => {
      toast({ title: 'Failed to submit rating', description: error.message, variant: 'destructive' });
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('POST', `/api/jobs/${jobId}/feedback`, {
        jobId,
        feedbackText,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Feedback submitted', description: 'Your feedback has been recorded.' });
      setFeedbackText('');
    },
    onError: (error: any) => {
      toast({ title: 'Failed to submit feedback', description: error.message, variant: 'destructive' });
    },
  });

  const submitReportMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('POST', `/api/jobs/${jobId}/report`, {
        jobId,
        reason: reportReason,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Report submitted', description: 'Thank you for your report.' });
      setReportReason('');
      setShowReportDialog(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to submit report', description: error.message, variant: 'destructive' });
    },
  });

  const openInMaps = () => {
    if (job?.latitude && job?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full mb-4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">{error ? (error as any).message : 'Job not found'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRequester = user?.id === job.requesterId;
  const isProvider = user?.role === 'provider';
  const isAssignedProvider = user?.id === job.providerId;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-success/10 text-success border-success/20',
      accepted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      enroute: 'bg-warning/10 text-warning border-warning/20',
      onsite: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status] || '';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button variant="ghost" onClick={() => setLocation('/jobs')} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Jobs
      </Button>

      <div className="space-y-6">

        {/* --- Provider Info Card --- */}
        {job.provider && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Assigned Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={job.provider?.profilePhotoUrl} />
                  <AvatarFallback className="text-lg">{job.provider?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-lg">{job.provider?.name}</p>
                    {job.provider?.isVerified && (
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{job.provider?.email}</p>
                  {job.provider?.phone && (
                    <p className="text-sm text-muted-foreground">{job.provider?.phone}</p>
                  )}
                  {(job.provider as any)?.ratingAverage && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-sm">
                        {parseFloat((job.provider as any).ratingAverage).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(job.provider as any).completedJobsCount || 0} jobs)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Job Section */}
        <Card className="border-2 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <Flag className="h-5 w-5" />
              Report an Issue
            </CardTitle>
            <CardDescription>Report problems with this job</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
              <Button
                variant="destructive"
                className="w-full md:w-auto"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="mr-2 h-4 w-4" />
                Report Job
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Job</DialogTitle>
                  <DialogDescription>
                    Describe the issue you're experiencing
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Describe the issue in detail..."
                    className="min-h-32"
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    disabled={reportReason.length < 10 || submitReportMutation.isPending}
                    onClick={() => submitReportMutation.mutate()}
                  >
                    {submitReportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
