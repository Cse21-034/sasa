  import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { 
  MapPin, Calendar, AlertCircle, MessageSquare, Star, CheckCircle2, 
  ArrowLeft, Flag, DollarSign, Navigation, XCircle, ImageIcon, 
  Clock, Users, Briefcase, Phone
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
import { formatPula } from '@/lib/utils';
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
import { InvoiceForm } from '@/components/invoice-form';
import { InvoiceApproval } from '@/components/invoice-approval';
import { PaymentForm } from '@/components/payment-form';
import { JobInvoicePaymentStatus } from '@/components/job-invoice-payment-status';

interface JobWithRelations extends Job {
  requester: any;
  provider: any & { ratingAverage?: string; completedJobsCount?: number };
  category: any;
}

interface JobApplication {
  id: string;
  jobId: string;
  providerId: string;
  status: 'pending' | 'selected' | 'rejected';
  message: string | null;
  createdAt: string;
  provider: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profilePhotoUrl: string | null;
    isVerified: boolean;
    ratingAverage?: string;
    completedJobsCount?: number;
  };
}

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
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState('');
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');


  const jobId = params?.id;

  const { data: job, isLoading, error } = useQuery<JobWithRelations>({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      const response = await apiRequest('GET', `/api/jobs/${jobId}`);
      return response.json();
    },
    enabled: !!jobId,
  });

  const { data: applications } = useQuery<JobApplication[]>({
    queryKey: ['/api/jobs', jobId, 'applications'],
    queryFn: async () => {
      if (!jobId) return [];
      const response = await apiRequest('GET', `/api/jobs/${jobId}/applications`);
      return response.json();
    },
    enabled: !!jobId && !!user,
  });

  const { data: myApplication } = useQuery<JobApplication | null>({
    queryKey: ['/api/jobs', jobId, 'my-application'],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await apiRequest('GET', `/api/jobs/${jobId}/my-application`);
      if (response.status === 404) return null;
      return response.json();
    },
    enabled: !!jobId && user?.role === 'provider',
  });

  const acceptJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('POST', `/api/jobs/${jobId}/accept`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({
        title: 'Job accepted!',
        description: 'You can now start working on this job.',
      });
    },
  });

  const applyToJobMutation = useMutation({
    mutationFn: async (message?: string) => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('POST', `/api/jobs/${jobId}/apply`, { message });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId, 'my-application'] });
      queryClient.invalidateQueries({ queryKey: ['/api/provider/applications'] });
      setShowApplyDialog(false);
      setApplicationMessage('');
      toast({
        title: 'Application submitted!',
        description: 'The requester will review your application and contact you if selected.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to apply',
        description: error.message || 'Could not submit your application.',
        variant: 'destructive',
      });
    },
  });

  const selectProviderMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('POST', `/api/jobs/${jobId}/select-provider`, { applicationId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', jobId, 'applications'] });
      toast({
        title: 'Provider selected!',
        description: 'The provider has been assigned to your job.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to select provider',
        description: error.message || 'Could not select the provider.',
        variant: 'destructive',
      });
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
      toast({
        title: 'Status updated',
        description: 'Job status has been updated successfully.',
      });
    },
  });

  const setChargeMutation = useMutation({
    mutationFn: async (charge: string) => {
      if (!jobId) throw new Error('Job ID is missing');
      // This route now works due to server/routes.ts fix
      const res = await apiRequest('POST', `/api/jobs/${jobId}/set-charge`, { providerCharge: charge });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({
        title: 'Charge set successfully',
        description: 'Your charge has been saved.',
      });
      setProviderCharge('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to set charge',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (amount: string) => {
      if (!jobId) throw new Error('Job ID is missing');
      // This route now works due to server/routes.ts fix
      const res = await apiRequest('POST', `/api/jobs/${jobId}/confirm-payment`, { amountPaid: amount });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({
        title: 'Payment confirmed',
        description: 'Payment has been recorded successfully.',
      });
      setAmountPaid('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to confirm payment',
        description: error.message,
        variant: 'destructive',
      });
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
      toast({
        title: 'Rating submitted',
        description: 'Thank you for your feedback!',
      });
      setRating(0);
      setRatingComment('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit rating',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      // This route now works due to server/routes.ts fix
      const res = await apiRequest('POST', `/api/jobs/${jobId}/feedback`, {
        jobId,
        feedbackText,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Feedback submitted',
        description: 'Your feedback has been recorded.',
      });
      setFeedbackText('');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit feedback',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const submitReportMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      // This route now works due to server/routes.ts fix
      const res = await apiRequest('POST', `/api/jobs/${jobId}/report`, {
        jobId,
        reason: reportReason,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Report submitted',
        description: 'Thank you for your report. We will review it shortly.',
      });
      setReportReason('');
      setShowReportDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to submit report',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const openInMaps = () => {
    if (job?.latitude && job?.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`;
      window.open(url, '_blank');
    }
  };

  // 👇 ADDED: Handler for image click
  const handleImageClick = (photoUrl: string) => {
    setSelectedPhotoUrl(photoUrl);
    setShowImageDialog(true);
  };

  // Function to render star rating (copied from the bottom of the original file)
  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
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
      pending_selection: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      accepted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      enroute: 'bg-warning/10 text-warning border-warning/20',
      onsite: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
    };
    return colors[status] || '';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Open',
      pending_selection: 'Reviewing Applicants',
      accepted: 'Accepted',
      enroute: 'En Route',
      onsite: 'On Site',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  const pendingApplications = applications?.filter(a => a.status === 'pending') || [];
  const hasApplied = !!myApplication;
  const canApply = isProvider && !hasApplied && !isAssignedProvider && 
                   (job?.status === 'open' || job?.status === 'pending_selection') && 
                   pendingApplications.length < 4;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Button
        variant="ghost"
        onClick={() => setLocation('/jobs')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Jobs
      </Button>

      <div className="space-y-6">
        {/* Job Header Card */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant={job.urgency === 'emergency' ? 'destructive' : 'secondary'} className="text-sm">
                    {job.urgency === 'emergency' ? '🚨 Emergency' : 'Normal Priority'}
                  </Badge>
                  <Badge variant="outline" className={`text-sm ${getStatusColor(job.status)}`}>
                    {job.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {job.status === 'pending_selection' && <Clock className="h-3 w-3 mr-1" />}
                    {getStatusLabel(job.status)}
                  </Badge>
                  <Badge variant="outline" className="text-sm">{job.category?.name}</Badge>
                </div>
                <CardTitle className="text-3xl mb-3">{job.title}</CardTitle>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{job.address || 'Location not specified'}</span>
                    {isAssignedProvider && job.latitude && job.longitude && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={openInMaps}
                        className="h-auto p-0 text-primary"
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Get Directions
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {canApply && (
                  <Button
                    onClick={() => setShowApplyDialog(true)}
                    disabled={applyToJobMutation.isPending}
                    className="w-full md:w-auto"
                    data-testid="button-apply-job"
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Apply for Job
                  </Button>
                )}
                {hasApplied && myApplication?.status === 'pending' && (
                  <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 py-2 px-4">
                    <Clock className="h-4 w-4 mr-2" />
                    Application Pending
                  </Badge>
                )}
                {pendingApplications.length >= 4 && isProvider && !hasApplied && !isAssignedProvider && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground py-2 px-4">
                    <Users className="h-4 w-4 mr-2" />
                    Maximum Applicants Reached
                  </Badge>
                )}
                {(isAssignedProvider || isRequester) && job.provider && (
                  <Button
                    onClick={() => setLocation(`/messages/${job.id}`)}
                    variant="outline"
                    className="w-full md:w-auto"
                    data-testid="button-message"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Message {isRequester ? 'Provider' : 'Requester'}
                  </Button>
                )}
                {isAssignedProvider && job.status !== 'completed' && job.status !== 'cancelled' && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full md:w-auto">
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Job
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel this job? This action cannot be undone and the requester will be notified.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>No, Keep Job</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => updateStatusMutation.mutate('cancelled')}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Yes, Cancel Job
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-lg">Description</h3>
                <p className="text-muted-foreground leading-relaxed">{job.description}</p>
              </div>

              {job.preferredTime && (
                <div>
                  <h3 className="font-semibold mb-2 text-lg">Preferred Time</h3>
                  <p className="text-muted-foreground">
                    {new Date(job.preferredTime).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Budget Range Display */}
              {(job as any).budgetMin && (job as any).budgetMax && (
                <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg border">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Budget Range</p>
                    <p className="text-lg font-bold">
                      {formatPula((job as any).budgetMin)} - {formatPula((job as any).budgetMax)}
                    </p>
                  </div>
                </div>
              )}

              {/* Display provider charge if set */}
              {(job as any).providerCharge && (
                <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Provider Charge</p>
                    <p className="text-lg font-bold text-primary">
                      {formatPula((job as any).providerCharge)}
                    </p>
                  </div>
                </div>
              )}

              {/* Display amount paid if confirmed */}
              {(job as any).amountPaid && (
                <div className="flex items-center gap-2 p-4 bg-success/10 rounded-lg border border-success/20">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <div>
                    <p className="text-sm font-medium">Amount Paid</p>
                    <p className="text-lg font-bold text-success">
                      {formatPula((job as any).amountPaid)}
                    </p>
                  </div>
                </div>
              )}

              {/* Job Photos */}
              {(job as any).photos && (job as any).photos.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 text-lg flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Job Photos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {(job as any).photos.map((photo: string, index: number) => (
                      <div 
                        key={index} 
                        className="relative group cursor-pointer overflow-hidden rounded-lg border-2"
                        onClick={() => handleImageClick(photo)} // 👇 FIX: Added click handler
                      >
                        <img
                          src={photo}
                          alt={`Job photo ${index + 1}`}
                          className="w-full h-40 object-cover transition-transform group-hover:scale-110"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Requester Info */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Posted By</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={job.requester?.profilePhotoUrl} />
                  <AvatarFallback className="text-lg">{job.requester?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{job.requester?.name}</p>
                  <p className="text-sm text-muted-foreground">{job.requester?.email}</p>
                  {job.requester?.phone && (
                    <p className="text-sm text-muted-foreground">{job.requester?.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Provider Info */}
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
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold text-lg">{job.provider?.name}</p>
                      {job.provider?.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    
                    {/* Display provider rating (fixed to use provider object) */}
                    {job.provider.ratingAverage && (
                      <div className="mb-2">
                        {renderStarRating(parseFloat(job.provider.ratingAverage))}
                        {job.provider.completedJobsCount !== undefined && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({job.provider.completedJobsCount} jobs)
                          </span>
                        )}
                      </div>
                    )}
                    
                    <p className="text-sm text-muted-foreground">{job.provider?.email}</p>
                    {job.provider?.phone && (
                      <p className="text-sm text-muted-foreground">{job.provider?.phone}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Invoice & Payment Management - Only when provider is assigned */}
        {job.provider && (isAssignedProvider || isRequester) && (
          <>
            {/* Invoice/Payment Status Display */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Invoice & Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <JobInvoicePaymentStatus jobId={jobId} />
              </CardContent>
            </Card>

            {/* Provider: Create Invoice */}
            {isAssignedProvider && (
              <InvoiceForm jobId={jobId} providerId={job.provider.id} />
            )}

            {/* Requester: Approve/Decline Invoice */}
            {isRequester && (
              <InvoiceApproval jobId={jobId} />
            )}

            {/* Requester: Process Payment */}
            {isRequester && (
              <PaymentForm jobId={jobId} />
            )}
          </>
        )}

        {/* Job Applicants Section - For Requesters */}
        {isRequester && (job.status === 'open' || job.status === 'pending_selection') && pendingApplications.length > 0 && (
          <Card className="border-2 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Provider Applications ({pendingApplications.length}/4)
              </CardTitle>
              <CardDescription>
                Review the providers who have applied for your job. Select the best fit based on their ratings, experience, and profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApplications.map((application) => (
                  <div 
                    key={application.id} 
                    className="flex flex-col md:flex-row items-start gap-4 p-4 border rounded-lg"
                    data-testid={`applicant-card-${application.id}`}
                  >
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={application.provider.profilePhotoUrl || ''} />
                      <AvatarFallback className="text-lg">
                        {application.provider.name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-lg">{application.provider.name}</p>
                        {application.provider.isVerified && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      {application.provider.ratingAverage && (
                        <div className="mb-2">
                          {renderStarRating(parseFloat(application.provider.ratingAverage))}
                          {application.provider.completedJobsCount !== undefined && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({application.provider.completedJobsCount} jobs completed)
                            </span>
                          )}
                        </div>
                      )}
                      
                      {!application.provider.ratingAverage && (
                        <div className="text-sm text-muted-foreground mb-2">
                          New provider - No ratings yet
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        {application.provider.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{application.provider.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {application.message && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm">
                          <p className="font-medium mb-1">Message:</p>
                          <p className="text-muted-foreground">{application.message}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            className="w-full"
                            disabled={selectProviderMutation.isPending}
                            data-testid={`button-select-provider-${application.id}`}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Select Provider
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Select {application.provider.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will assign {application.provider.name} to your job. 
                              Other applicants will be notified that they were not selected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => selectProviderMutation.mutate(application.id)}
                            >
                              Yes, Select This Provider
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Provider Charge Input - Update label and placeholder */}
        {isAssignedProvider && job.status !== 'cancelled' && !(job as any).providerCharge && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Set Your Charge
              </CardTitle>
              <CardDescription>Enter the amount you will charge for this service (in Pula)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider-charge">Your Charge (BWP)</Label>
                  <Input
                    id="provider-charge"
                    type="number"
                    step="0.01"
                    placeholder="P 150.00"
                    className="h-12 mt-2"
                    value={providerCharge}
                    onChange={(e) => setProviderCharge(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full md:w-auto"
                  disabled={!providerCharge || setChargeMutation.isPending}
                  onClick={() => setChargeMutation.mutate(providerCharge)}
                >
                  {setChargeMutation.isPending ? 'Saving...' : 'Save Charge'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Amount Paid Input - Update label and placeholder */}
        {isRequester && job.status === 'completed' && (job as any).providerCharge && !(job as any).amountPaid && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Confirm Payment
              </CardTitle>
              <CardDescription>Enter the amount you paid for this service (in Pula)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount-paid">Amount Paid (BWP)</Label>
                  <Input
                    id="amount-paid"
                    type="number"
                    step="0.01"
                    placeholder={formatPula((job as any).providerCharge || "150.00")}
                    className="h-12 mt-2"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full md:w-auto"
                  disabled={!amountPaid || confirmPaymentMutation.isPending}
                  onClick={() => confirmPaymentMutation.mutate(amountPaid)}
                >
                  {confirmPaymentMutation.isPending ? 'Confirming...' : 'Confirm Payment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Actions for Provider */}
        {isAssignedProvider && job.status !== 'cancelled' && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Update Job Status</CardTitle>
              <CardDescription>Update the current status of this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {job.status === 'accepted' && (
                  <Button
                    onClick={() => updateStatusMutation.mutate('enroute')}
                    disabled={updateStatusMutation.isPending}
                  >
                    En Route
                  </Button>
                )}
                {job.status === 'enroute' && (
                  <Button
                    onClick={() => updateStatusMutation.mutate('onsite')}
                    disabled={updateStatusMutation.isPending}
                  >
                    On Site
                  </Button>
                )}
                {job.status === 'onsite' && (
                  <Button
                    onClick={() => updateStatusMutation.mutate('completed')}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Section */}
        {isRequester && job.status === 'completed' && job.provider && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Rate Service Provider</CardTitle>
              <CardDescription>Share your experience with {job.provider.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm font-medium">
                      {rating} {rating === 1 ? 'star' : 'stars'}
                    </span>
                  )}
                </div>
                <Textarea
                  placeholder="Share your experience... (Optional)"
                  className="min-h-24"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
                <Button 
                  className="w-full md:w-auto"
                  disabled={rating === 0 || submitRatingMutation.isPending}
                  onClick={() => submitRatingMutation.mutate()}
                >
                  {submitRatingMutation.isPending ? 'Submitting...' : 'Submit Rating'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Section (Provider) */}
        {isAssignedProvider && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Problems Encountered</CardTitle>
              <CardDescription>Report any issues during this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe any problems..."
                  className="min-h-32"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                <Button 
                  variant="outline" 
                  className="w-full md:w-auto"
                  disabled={!feedbackText || submitFeedbackMutation.isPending}
                  onClick={() => submitFeedbackMutation.mutate()} // Calls fixed API route
                >
                  {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Feedback'}
                </Button>
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

      {/* Apply to Job Dialog */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for this Job</DialogTitle>
            <DialogDescription>
              Submit your application to work on "{job.title}". 
              The requester will review your profile and decide who to select.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="application-message">Message (Optional)</Label>
              <Textarea
                id="application-message"
                placeholder="Introduce yourself and explain why you're the best fit for this job..."
                className="min-h-32 mt-2"
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                A good message can help you stand out to the requester.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
              Cancel
            </Button>
            <Button 
              disabled={applyToJobMutation.isPending}
              onClick={() => applyToJobMutation.mutate(applicationMessage || undefined)}
              data-testid="button-submit-application"
            >
              {applyToJobMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl sm:max-w-4xl p-0">
          <img 
            src={selectedPhotoUrl} 
            alt="Job Photo Preview" 
            // Use w-full and object-contain to scale the image appropriately within the dialog
            className="w-full h-auto object-contain max-h-[80vh] rounded-lg" 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
