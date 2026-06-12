import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import {
  MapPin, Calendar, AlertCircle, MessageSquare, Star, CheckCircle2,
  ArrowLeft, Flag, DollarSign, Navigation, XCircle, ImageIcon,
  Clock, Users, Briefcase, Phone, Edit, Trash2, Truck,
  Zap, Award, Building2, FileText, CreditCard, ThumbsUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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

// ── Status stepper config ────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'open',              label: 'Open',      icon: FileText },
  { key: 'pending_selection', label: 'Reviewing', icon: Users },
  { key: 'accepted',          label: 'Accepted',  icon: CheckCircle2 },
  { key: 'enroute',           label: 'En Route',  icon: Truck },
  { key: 'onsite',            label: 'On Site',   icon: Building2 },
  { key: 'completed',         label: 'Done',      icon: ThumbsUp },
];

const getStatusIndex = (status: string) => {
  const idx = STATUS_STEPS.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
};

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
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    budgetMin: '',
    budgetMax: '',
  });

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
      toast({ title: 'Job accepted!', description: 'You can now start working on this job.' });
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
      toast({ title: 'Application submitted!', description: 'The requester will review your application and contact you if selected.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to apply', description: error.message || 'Could not submit your application.', variant: 'destructive' });
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
      toast({ title: 'Provider selected!', description: 'The provider has been assigned to your job.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to select provider', description: error.message || 'Could not select the provider.', variant: 'destructive' });
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
      const res = await apiRequest('POST', '/api/ratings', { jobId, toUserId: job.providerId, rating, comment: ratingComment });
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
      const res = await apiRequest('POST', `/api/jobs/${jobId}/feedback`, { jobId, feedbackText });
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
      const res = await apiRequest('POST', `/api/jobs/${jobId}/report`, { jobId, reason: reportReason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Report submitted', description: 'Thank you for your report. We will review it shortly.' });
      setReportReason('');
      setShowReportDialog(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to submit report', description: error.message, variant: 'destructive' });
    },
  });

  const editJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('PATCH', `/api/jobs/${jobId}`, {
        title: editFormData.title || undefined,
        description: editFormData.description || undefined,
        budgetMin: editFormData.budgetMin || undefined,
        budgetMax: editFormData.budgetMax || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      toast({ title: 'Job updated', description: 'Your job has been updated successfully.' });
      setShowEditDialog(false);
      setEditFormData({ title: '', description: '', budgetMin: '', budgetMax: '' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update job', description: error.message, variant: 'destructive' });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      if (!jobId) throw new Error('Job ID is missing');
      const res = await apiRequest('DELETE', `/api/jobs/${jobId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Job deleted', description: 'Your job has been deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      setLocation('/jobs');
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete job', description: error.message, variant: 'destructive' });
    },
  });

  const openInMaps = () => {
    if (job?.latitude && job?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${job.latitude},${job.longitude}`, '_blank');
    }
  };

  const handleImageClick = (photoUrl: string) => {
    setSelectedPhotoUrl(photoUrl);
    setShowImageDialog(true);
  };

  const renderStars = (value: number, size = 'h-4 w-4') => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`${size} ${s <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-52 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl md:col-span-2" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card className="border-destructive/30">
          <CardContent className="p-12 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="font-semibold text-destructive">{error ? (error as any).message : 'Job not found'}</p>
            <Button variant="outline" onClick={() => setLocation('/jobs')}>← Back to Jobs</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Derived state ────────────────────────────────────────────────────────────
  const isRequester        = user?.id === job.requesterId;
  const isProvider         = user?.role === 'provider';
  const isAssignedProvider = user?.id === job.providerId;
  const pendingApplications = applications?.filter(a => a.status === 'pending') || [];
  const hasApplied = !!myApplication;
  const canApply   = isProvider && !hasApplied && !isAssignedProvider &&
                     (job.status === 'open' || job.status === 'pending_selection') &&
                     pendingApplications.length < 4;
  const isCancelled = job.status === 'cancelled';
  const isCompleted = job.status === 'completed';
  const currentStep = getStatusIndex(job.status);
  const isEmergency = job.urgency === 'emergency';

  const statusLabel: Record<string, string> = {
    open: 'Open', pending_selection: 'Reviewing Applicants',
    accepted: 'Accepted', enroute: 'En Route',
    onsite: 'On Site', completed: 'Completed', cancelled: 'Cancelled',
  };

  const statusColor: Record<string, string> = {
    open:              'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    pending_selection: 'bg-amber-500/10  text-amber-600  border-amber-500/20',
    accepted:          'bg-blue-500/10   text-blue-600   border-blue-500/20',
    enroute:           'bg-orange-500/10 text-orange-600 border-orange-500/20',
    onsite:            'bg-purple-500/10 text-purple-600 border-purple-500/20',
    completed:         'bg-green-500/10  text-green-600  border-green-500/20',
    cancelled:         'bg-red-500/10    text-red-600    border-red-500/20',
  };

  // Top-rated applicant (highest rating, most jobs)
  const topApplicant = pendingApplications.length > 0
    ? [...pendingApplications].sort((a, b) => {
        const ra = parseFloat(a.provider.ratingAverage || '0');
        const rb = parseFloat(b.provider.ratingAverage || '0');
        return rb - ra;
      })[0]
    : null;

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-5xl">

        {/* ── Back nav ── */}
        <button
          onClick={() => setLocation('/jobs')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Jobs
        </button>

        {/* ── HERO CARD ── */}
        <div className="relative overflow-hidden rounded-2xl border bg-card shadow-sm mb-4">
          {/* Top accent stripe */}
          <div className={`h-1.5 w-full ${isEmergency ? 'bg-destructive' : isCompleted ? 'bg-emerald-500' : isCancelled ? 'bg-muted-foreground' : 'bg-primary'}`} />

          <div className="p-5 sm:p-7">
            {/* Badge row */}
            <div className="flex flex-wrap gap-2 mb-4">
              {isEmergency && (
                <Badge variant="destructive" className="gap-1 text-xs font-semibold">
                  <Zap className="h-3 w-3" /> Emergency
                </Badge>
              )}
              <Badge variant="outline" className={`text-xs font-medium border ${statusColor[job.status] || ''}`}>
                {statusLabel[job.status] || job.status}
              </Badge>
              {job.category?.name && (
                <Badge variant="secondary" className="text-xs">{job.category.name}</Badge>
              )}
              {job.allowedProviderType && job.allowedProviderType !== 'both' && (
                <Badge variant="outline" className="text-xs capitalize">{job.allowedProviderType} providers</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-5">{job.title}</h1>

            {/* Meta grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl p-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Location</p>
                  <p className="text-sm font-medium leading-snug truncate">{job.address || 'Not specified'}</p>
                  {isAssignedProvider && job.latitude && job.longitude && (
                    <button onClick={openInMaps} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                      <Navigation className="h-3 w-3" /> Get Directions
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl p-3">
                <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Posted</p>
                  <p className="text-sm font-medium">{new Date(job.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  {job.preferredTime && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Preferred: {new Date(job.preferredTime).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-muted/50 rounded-xl p-3">
                <DollarSign className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Budget</p>
                  {(job as any).budgetMin && (job as any).budgetMax ? (
                    <p className="text-sm font-bold text-primary">
                      {formatPula((job as any).budgetMin)} – {formatPula((job as any).budgetMax)}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not specified</p>
                  )}
                  {(job as any).providerCharge && (
                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                      Quoted: {formatPula((job as any).providerCharge)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Primary CTAs ── */}
            <div className="flex flex-wrap gap-2.5">

              {/* Provider: apply */}
              {canApply && (
                <Button
                  size="lg"
                  onClick={() => setShowApplyDialog(true)}
                  disabled={applyToJobMutation.isPending}
                  className="gap-2 shadow-sm"
                  data-testid="button-apply-job"
                >
                  <Briefcase className="h-4 w-4" />
                  Apply for This Job
                </Button>
              )}

              {/* Provider: already applied */}
              {hasApplied && myApplication?.status === 'pending' && (
                <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-2.5">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Application under review</span>
                </div>
              )}

              {/* Provider: selected */}
              {myApplication?.status === 'selected' && (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg px-4 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">You've been selected!</span>
                </div>
              )}

              {/* Slots full */}
              {pendingApplications.length >= 4 && isProvider && !hasApplied && !isAssignedProvider && (
                <div className="flex items-center gap-2 bg-muted border rounded-lg px-4 py-2.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Application slots full (4/4)</span>
                </div>
              )}

              {/* Message button */}
              {(isAssignedProvider || isRequester) && job.provider && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setLocation(`/messages/${job.id}`)}
                  className="gap-2"
                  data-testid="button-message"
                >
                  <MessageSquare className="h-4 w-4" />
                  Message {isRequester ? 'Provider' : 'Client'}
                </Button>
              )}

              {/* Requester: edit/delete (open only) */}
              {isRequester && (job.status === 'open' || job.status === 'pending_selection') && (
                <>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setEditFormData({ title: job.title || '', description: job.description || '', budgetMin: (job as any).budgetMin || '', budgetMax: (job as any).budgetMax || '' });
                      setShowEditDialog(true);
                    }}
                    disabled={job.status === 'pending_selection'}
                    className="gap-2"
                    title={job.status === 'pending_selection' ? 'Cannot edit while providers have applied' : ''}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="lg" className="gap-2">
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {job.status === 'pending_selection'
                            ? 'All applicants will be notified. This cannot be undone.'
                            : 'This action cannot be undone.'}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteJobMutation.mutate()}
                          disabled={deleteJobMutation.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteJobMutation.isPending ? 'Deleting…' : 'Yes, Delete Job'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {/* Provider: cancel job */}
              {isAssignedProvider && !isCompleted && !isCancelled && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="lg" className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/5">
                      <XCircle className="h-4 w-4" />
                      Cancel Job
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this job?</AlertDialogTitle>
                      <AlertDialogDescription>The requester will be notified. This cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, Keep Job</AlertDialogCancel>
                      <AlertDialogAction onClick={() => updateStatusMutation.mutate('cancelled')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, Cancel Job
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* ── STATUS PROGRESS STEPPER ── */}
        {!isCancelled && (
          <div className="bg-card border rounded-2xl p-4 sm:p-5 mb-4 overflow-x-auto">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Job Progress</p>
            <div className="flex items-center min-w-max">
              {STATUS_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const done    = idx < currentStep;
                const active  = idx === currentStep;
                const future  = idx > currentStep;
                return (
                  <div key={step.key} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`
                        w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                        ${done   ? 'bg-primary border-primary text-primary-foreground'  : ''}
                        ${active ? 'bg-primary/10 border-primary text-primary ring-4 ring-primary/20' : ''}
                        ${future ? 'bg-muted border-muted-foreground/20 text-muted-foreground/40' : ''}
                      `}>
                        {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </div>
                      <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                        {step.label}
                      </span>
                    </div>
                    {idx < STATUS_STEPS.length - 1 && (
                      <div className={`w-10 sm:w-16 h-0.5 mx-1 rounded-full ${idx < currentStep ? 'bg-primary' : 'bg-muted-foreground/15'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-3 bg-destructive/5 border border-destructive/20 rounded-2xl px-5 py-4 mb-4">
            <XCircle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="font-semibold text-destructive text-sm">Job Cancelled</p>
              <p className="text-xs text-muted-foreground">This job has been cancelled and is no longer active.</p>
            </div>
          </div>
        )}

        {/* ── PROVIDER: Next action banner ── */}
        {isAssignedProvider && !isCancelled && !isCompleted && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-5 mb-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Your Next Action</p>
            <div className="flex flex-wrap gap-2.5">
              {job.status === 'accepted' && (
                <Button onClick={() => updateStatusMutation.mutate('enroute')} disabled={updateStatusMutation.isPending} className="gap-2">
                  <Truck className="h-4 w-4" />
                  I'm On My Way (En Route)
                </Button>
              )}
              {job.status === 'enroute' && (
                <Button onClick={() => updateStatusMutation.mutate('onsite')} disabled={updateStatusMutation.isPending} className="gap-2">
                  <Building2 className="h-4 w-4" />
                  I've Arrived (On Site)
                </Button>
              )}
              {job.status === 'onsite' && (
                <Button onClick={() => updateStatusMutation.mutate('completed')} disabled={updateStatusMutation.isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Job as Complete
                </Button>
              )}
              {job.status === 'pending_selection' && (
                <p className="text-sm text-muted-foreground py-1">Waiting for the client to review applications…</p>
              )}
            </div>
          </div>
        )}

        {/* ── MAIN TWO-COLUMN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── LEFT MAIN CONTENT ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Description */}
            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{job.description}</p>
              </CardContent>
            </Card>

            {/* Photos */}
            {(job as any).photos && (job as any).photos.length > 0 && (
              <Card className="rounded-2xl border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Photos ({(job as any).photos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {(job as any).photos.map((photo: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleImageClick(photo)}
                        className="relative group overflow-hidden rounded-xl border aspect-video focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Financials summary (if any amounts exist) */}
            {((job as any).providerCharge || (job as any).amountPaid) && (
              <Card className="rounded-2xl border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(job as any).providerCharge && (
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/15">
                      <span className="text-sm font-medium text-muted-foreground">Provider Quoted</span>
                      <span className="font-bold text-primary">{formatPula((job as any).providerCharge)}</span>
                    </div>
                  )}
                  {(job as any).amountPaid && (
                    <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/15">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium">Amount Paid</span>
                      </div>
                      <span className="font-bold text-emerald-600">{formatPula((job as any).amountPaid)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ── Invoice & Payment (when provider assigned) ── */}
            {job.provider && (isAssignedProvider || isRequester) && (
              <div className="space-y-4">
                <Card className="rounded-2xl border shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      Invoice & Payment
                    </CardTitle>
                    <CardDescription className="text-xs">Track invoice status and payment for this job</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <JobInvoicePaymentStatus jobId={jobId} />
                  </CardContent>
                </Card>
                {isAssignedProvider && <InvoiceForm jobId={jobId} providerId={job.provider.id} />}
                {isRequester && <InvoiceApproval jobId={jobId} />}
                {isRequester && <PaymentForm jobId={jobId} />}
              </div>
            )}

            {/* ── Confirm Payment (legacy) ── */}
            {isRequester && isCompleted && (job as any).providerCharge && !(job as any).amountPaid && (
              <Card className="rounded-2xl border border-primary/20 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    Confirm Payment
                  </CardTitle>
                  <CardDescription className="text-xs">Enter the amount you paid for this service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount-paid">Amount Paid (BWP)</Label>
                    <Input id="amount-paid" type="number" step="0.01" placeholder={formatPula((job as any).providerCharge || '150.00')} className="h-11" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
                  </div>
                  <Button className="w-full sm:w-auto gap-2" disabled={!amountPaid || confirmPaymentMutation.isPending} onClick={() => confirmPaymentMutation.mutate(amountPaid)}>
                    <CreditCard className="h-4 w-4" />
                    {confirmPaymentMutation.isPending ? 'Confirming…' : 'Confirm Payment'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── Rate Provider (requester, completed) ── */}
            {isRequester && isCompleted && job.provider && (
              <Card className="rounded-2xl border border-yellow-500/20 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Rate Your Provider
                  </CardTitle>
                  <CardDescription className="text-xs">How did {job.provider.name} do? Your review helps others.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} onClick={() => setRating(s)} onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} className="transition-transform hover:scale-110 focus:outline-none">
                        <Star className={`h-9 w-9 transition-colors ${s <= (hoverRating || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/25'}`} />
                      </button>
                    ))}
                    {rating > 0 && <span className="ml-2 self-center text-sm font-semibold text-yellow-600">{['','Poor','Fair','Good','Great','Excellent'][rating]}</span>}
                  </div>
                  <Textarea placeholder="Tell others about your experience… (optional)" className="min-h-20 resize-none" value={ratingComment} onChange={e => setRatingComment(e.target.value)} />
                  <Button className="w-full sm:w-auto gap-2 bg-yellow-500 hover:bg-yellow-600 text-white" disabled={rating === 0 || submitRatingMutation.isPending} onClick={() => submitRatingMutation.mutate()}>
                    <Star className="h-4 w-4" />
                    {submitRatingMutation.isPending ? 'Submitting…' : 'Submit Rating'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── Provider feedback ── */}
            {isAssignedProvider && (
              <Card className="rounded-2xl border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    Problems Encountered
                  </CardTitle>
                  <CardDescription className="text-xs">Report any issues you faced during this job</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea placeholder="Describe any problems (optional)…" className="min-h-24 resize-none" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} />
                  <Button variant="outline" className="w-full sm:w-auto gap-2" disabled={!feedbackText || submitFeedbackMutation.isPending} onClick={() => submitFeedbackMutation.mutate()}>
                    {submitFeedbackMutation.isPending ? 'Submitting…' : 'Submit Report'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── Report Job ── */}
            <Card className="rounded-2xl border border-destructive/15 shadow-sm">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Flag className="h-4 w-4" /> Report an Issue
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Something wrong with this job listing?</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 shrink-0" onClick={() => setShowReportDialog(true)}>
                  <Flag className="h-3.5 w-3.5" /> Report
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-4">

            {/* Posted By */}
            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Posted By</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                    <AvatarImage src={job.requester?.profilePhotoUrl} />
                    <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">{job.requester?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{job.requester?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{job.requester?.email}</p>
                    {job.requester?.phone && (
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{job.requester.phone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Provider */}
            {job.provider && (
              <Card className="rounded-2xl border border-primary/15 shadow-sm bg-primary/2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Assigned Provider</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                        <AvatarImage src={job.provider?.profilePhotoUrl} />
                        <AvatarFallback className="font-bold text-sm bg-primary/10 text-primary">{job.provider?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      {job.provider?.isVerified && (
                        <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-0.5">
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{job.provider?.name}</p>
                      {job.provider.ratingAverage ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {renderStars(parseFloat(job.provider.ratingAverage))}
                          <span className="text-xs text-muted-foreground">({job.provider.completedJobsCount ?? 0})</span>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">New provider</p>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> {job.provider?.phone || 'No phone'}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{job.provider?.email}</div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Applicants (requester view, sidebar on desktop) ── */}
            {isRequester && (job.status === 'open' || job.status === 'pending_selection') && pendingApplications.length > 0 && (
              <Card className="rounded-2xl border border-amber-500/20 shadow-sm lg:hidden">
                {/* shown inline on mobile — full-width card below */}
              </Card>
            )}

            {/* Application slot info */}
            {isRequester && (job.status === 'open' || job.status === 'pending_selection') && (
              <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Applications</p>
                  <Badge variant="outline" className="text-xs border-amber-400 text-amber-700">{pendingApplications.length}/4 slots</Badge>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {pendingApplications.length === 0
                    ? 'No applications yet. Job is visible to providers.'
                    : `${pendingApplications.length} provider${pendingApplications.length > 1 ? 's have' : ' has'} applied. Review and select below.`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── APPLICANTS (full width below grid) ── */}
        {isRequester && (job.status === 'open' || job.status === 'pending_selection') && pendingApplications.length > 0 && (
          <div className="mt-4">
            <Card className="rounded-2xl border border-amber-500/20 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4 text-amber-600" />
                    Applications Received
                  </CardTitle>
                  <Badge variant="outline" className="border-amber-400 text-amber-700">{pendingApplications.length}/4</Badge>
                </div>
                <CardDescription className="text-xs">Select the provider you want for this job. Others will be notified.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingApplications.map((app, idx) => {
                  const isTop = app.id === topApplicant?.id && pendingApplications.length > 1;
                  return (
                    <div
                      key={app.id}
                      className={`relative rounded-xl border p-4 transition-all ${isTop ? 'border-amber-400/50 bg-amber-50/50 dark:bg-amber-900/10' : 'bg-card hover:border-primary/30'}`}
                      data-testid={`applicant-card-${app.id}`}
                    >
                      {isTop && (
                        <div className="absolute top-3 right-3">
                          <Badge className="text-xs gap-1 bg-amber-500 text-white hover:bg-amber-500">
                            <Award className="h-3 w-3" /> Top Rated
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11 ring-2 ring-border shrink-0">
                          <AvatarImage src={app.provider.profilePhotoUrl || ''} />
                          <AvatarFallback className="font-bold text-sm">{app.provider.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-sm">{app.provider.name}</p>
                            {app.provider.isVerified && (
                              <Badge variant="secondary" className="text-xs gap-1 h-5">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                              </Badge>
                            )}
                          </div>
                          {app.provider.ratingAverage ? (
                            <div className="flex items-center gap-1.5 mb-2">
                              {renderStars(parseFloat(app.provider.ratingAverage))}
                              <span className="text-xs text-muted-foreground font-medium">{parseFloat(app.provider.ratingAverage).toFixed(1)}</span>
                              <span className="text-xs text-muted-foreground">· {app.provider.completedJobsCount ?? 0} jobs done</span>
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground mb-2">New provider — no reviews yet</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                            {app.provider.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.provider.phone}</span>}
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Applied {new Date(app.createdAt).toLocaleDateString()}</span>
                          </div>
                          {app.message && (
                            <div className="bg-muted/60 rounded-lg px-3 py-2 text-xs text-muted-foreground leading-relaxed">
                              "{app.message}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" className="gap-2" disabled={selectProviderMutation.isPending} data-testid={`button-select-provider-${app.id}`}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Select {app.provider.name.split(' ')[0]}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Select {app.provider.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {app.provider.name} will be assigned to your job. Other applicants will be notified they weren't selected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => selectProviderMutation.mutate(app.id)}>
                                Yes, Select Provider
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}

      </div>{/* /container */}

      {/* ── DIALOGS ── */}

      {/* Apply */}
      <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply for This Job</DialogTitle>
            <DialogDescription>
              Submit your application for "<strong>{job.title}</strong>". The client will review your profile.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="application-message">Cover message <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              id="application-message"
              placeholder="Introduce yourself and explain why you're the best fit…"
              className="min-h-28 resize-none"
              value={applicationMessage}
              onChange={e => setApplicationMessage(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">A good message increases your chances of being selected.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowApplyDialog(false)}>Cancel</Button>
            <Button disabled={applyToJobMutation.isPending} onClick={() => applyToJobMutation.mutate(applicationMessage || undefined)} data-testid="button-submit-application" className="gap-2">
              <Briefcase className="h-4 w-4" />
              {applyToJobMutation.isPending ? 'Submitting…' : 'Submit Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image preview */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl p-1 sm:p-2 bg-black/90 border-black">
          <img src={selectedPhotoUrl} alt="Job Photo" className="w-full h-auto object-contain max-h-[85vh] rounded-lg" />
        </DialogContent>
      </Dialog>

      {/* Edit job */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Job Details</DialogTitle>
            <DialogDescription>Update job details. Editing is locked once providers have applied.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-title">Job Title</Label>
              <Input id="edit-title" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} placeholder="e.g., Plumbing repair needed" className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} placeholder="Describe the job in detail…" rows={4} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-budget-min">Min Budget (BWP)</Label>
                <Input id="edit-budget-min" type="number" value={editFormData.budgetMin} onChange={e => setEditFormData({ ...editFormData, budgetMin: e.target.value })} placeholder="0.00" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-budget-max">Max Budget (BWP)</Label>
                <Input id="edit-budget-max" type="number" value={editFormData.budgetMax} onChange={e => setEditFormData({ ...editFormData, budgetMax: e.target.value })} placeholder="0.00" className="h-11" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={() => editJobMutation.mutate()} disabled={editJobMutation.isPending || (!editFormData.title && !editFormData.description && !editFormData.budgetMin && !editFormData.budgetMax)} className="gap-2">
              {editJobMutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><Flag className="h-4 w-4" />Report This Job</DialogTitle>
            <DialogDescription>Describe the issue you're experiencing with this listing.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Describe the issue in detail (minimum 10 characters)…" className="min-h-28 resize-none" value={reportReason} onChange={e => setReportReason(e.target.value)} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>Cancel</Button>
            <Button variant="destructive" disabled={reportReason.length < 10 || submitReportMutation.isPending} onClick={() => submitReportMutation.mutate()} className="gap-2">
              <Flag className="h-3.5 w-3.5" />
              {submitReportMutation.isPending ? 'Submitting…' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
