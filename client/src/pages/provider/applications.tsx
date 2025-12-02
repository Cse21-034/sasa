import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Clock, CheckCircle2, XCircle, ArrowRight, Briefcase, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
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

interface JobApplication {
  id: string;
  jobId: string;
  providerId: string;
  status: 'pending' | 'selected' | 'rejected';
  message: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    description: string;
    city: string;
    address: string | null;
    status: string;
    urgency: string;
    createdAt: string;
  };
}

export default function ProviderApplications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: applications, isLoading } = useQuery<JobApplication[]>({
    queryKey: ['/api/provider/applications'],
    enabled: !!user && user.role === 'provider',
  });

  const withdrawMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const res = await apiRequest('DELETE', `/api/applications/${applicationId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/provider/applications'] });
      toast({
        title: 'Application withdrawn',
        description: 'Your application has been withdrawn successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to withdraw',
        description: error.message || 'Could not withdraw the application.',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Waiting for Selection
          </Badge>
        );
      case 'selected':
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Selected
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Not Selected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (!user || user.role !== 'provider') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Only providers can view applications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">My Job Applications</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const pendingApplications = applications?.filter(a => a.status === 'pending') || [];
  const selectedApplications = applications?.filter(a => a.status === 'selected') || [];
  const rejectedApplications = applications?.filter(a => a.status === 'rejected') || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            My Job Applications
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your pending applications and their status
          </p>
        </div>
        <Button onClick={() => setLocation('/jobs')} variant="outline" data-testid="button-browse-jobs">
          Browse Jobs
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {(!applications || applications.length === 0) ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start applying to jobs to see them here. Browse available jobs and submit your application.
            </p>
            <Button onClick={() => setLocation('/jobs')} data-testid="button-browse-available-jobs">
              Browse Available Jobs
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {pendingApplications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                Pending Applications ({pendingApplications.length})
              </h2>
              <div className="space-y-4">
                {pendingApplications.map((application) => (
                  <Card key={application.id} className="border-2 border-yellow-500/20" data-testid={`card-application-${application.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {getStatusBadge(application.status)}
                            {application.job.urgency === 'emergency' && (
                              <Badge variant="destructive">Emergency</Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{application.job.title}</h3>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{application.job.address || application.job.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <p className="text-sm mt-3 p-3 bg-muted/50 rounded-md">
                            The requester is reviewing applications. You will be notified when they make a decision.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setLocation(`/jobs/${application.jobId}`)}
                            data-testid={`button-view-job-${application.id}`}
                          >
                            View Job
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" className="text-destructive" data-testid={`button-withdraw-${application.id}`}>
                                Withdraw
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Withdraw Application?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to withdraw your application for "{application.job.title}"? 
                                  You can apply again if the job is still open.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => withdrawMutation.mutate(application.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Withdraw
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {selectedApplications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Selected ({selectedApplications.length})
              </h2>
              <div className="space-y-4">
                {selectedApplications.map((application) => (
                  <Card key={application.id} className="border-2 border-green-500/20" data-testid={`card-selected-${application.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(application.status)}
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{application.job.title}</h3>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{application.job.address || application.job.city}</span>
                            </div>
                          </div>
                          <p className="text-sm mt-3 p-3 bg-green-500/10 rounded-md text-green-700 dark:text-green-400">
                            Congratulations! You have been selected for this job.
                          </p>
                        </div>
                        <Button 
                          onClick={() => setLocation(`/jobs/${application.jobId}`)}
                          data-testid={`button-go-to-job-${application.id}`}
                        >
                          Go to Job
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {rejectedApplications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Not Selected ({rejectedApplications.length})
              </h2>
              <div className="space-y-4">
                {rejectedApplications.map((application) => (
                  <Card key={application.id} className="border-2 border-muted opacity-75" data-testid={`card-rejected-${application.id}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusBadge(application.status)}
                          </div>
                          <h3 className="text-lg font-semibold mb-2">{application.job.title}</h3>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{application.job.address || application.job.city}</span>
                            </div>
                          </div>
                          <p className="text-sm mt-3 text-muted-foreground">
                            The requester selected another provider for this job.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setLocation('/jobs')}
                        >
                          Find More Jobs
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
