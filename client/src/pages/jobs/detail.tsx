import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute, useLocation } from 'wouter';
import { MapPin, Calendar, AlertCircle, MessageSquare, Star, CheckCircle2, XCircle, AlertTriangle, ArrowLeft, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function JobDetail() {
  const [, params] = useRoute('/jobs/:id');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reportReason, setReportReason] = useState('');
  const [feedbackText, setFeedbackText] = useState('');

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
      toast({
        title: 'Job accepted!',
        description: 'You can now start working on this job.',
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
            <p className="text-muted-foreground">{error ? error.message : 'Job not found'}</p>
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
      {/* Back Button */}
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
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                  <Badge variant="outline" className="text-sm">{job.category?.name}</Badge>
                </div>
                <CardTitle className="text-3xl mb-3">{job.title}</CardTitle>
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{job.address || 'Location not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {isProvider && job.status === 'open' && !isAssignedProvider && (
                  <Button
                    onClick={() => acceptJobMutation.mutate()}
                    disabled={acceptJobMutation.isPending}
                    className="w-full md:w-auto"
                    data-testid="button-accept-job"
                  >
                    Accept Job
                  </Button>
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
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{job.provider?.name}</p>
                      {job.provider?.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
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

        {/* Status Actions for Provider */}
        {isAssignedProvider && (
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
                    data-testid="button-status-enroute"
                  >
                    En Route
                  </Button>
                )}
                {job.status === 'enroute' && (
                  <Button
                    onClick={() => updateStatusMutation.mutate('onsite')}
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-status-onsite"
                  >
                    On Site
                  </Button>
                )}
                {job.status === 'onsite' && (
                  <Button
                    onClick={() => updateStatusMutation.mutate('completed')}
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-status-complete"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rating Section (for requester after completion) */}
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
                  placeholder="Share your experience with this service provider... (Optional)"
                  className="min-h-24"
                />
                <Button className="w-full md:w-auto">
                  Submit Rating
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback/Problems Section (for provider) */}
        {isAssignedProvider && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">Problems Encountered</CardTitle>
              <CardDescription>Report any issues or provide feedback about this job</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe any problems or issues encountered during this job..."
                  className="min-h-32"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                <Button variant="outline" className="w-full md:w-auto">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Submit Feedback
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
            <CardDescription>Report problems with this job listing or service</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full md:w-auto">
                  <Flag className="mr-2 h-4 w-4" />
                  Report Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Job</DialogTitle>
                  <DialogDescription>
                    Please describe the issue you're experiencing with this job
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Reason for report</Label>
                    <Textarea
                      placeholder="Describe the issue..."
                      className="mt-2 min-h-32"
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Submit Report</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
