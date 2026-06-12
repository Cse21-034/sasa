import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Clock, CheckCircle2, XCircle, ArrowRight, Briefcase, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending')
    return (
      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[11px] gap-1">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    );
  if (status === 'selected')
    return (
      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 text-[11px] gap-1">
        <CheckCircle2 className="h-3 w-3" /> Selected
      </Badge>
    );
  return (
    <Badge variant="secondary" className="bg-muted text-muted-foreground text-[11px] gap-1">
      <XCircle className="h-3 w-3" /> Not Selected
    </Badge>
  );
}

function ApplicationRow({
  application,
  onView,
  onWithdraw,
  withdrawing,
}: {
  application: JobApplication;
  onView: () => void;
  onWithdraw?: () => void;
  withdrawing?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40 hover:bg-muted/30 active:bg-muted/50 transition-colors cursor-pointer"
      onClick={onView}
      data-testid={`card-application-${application.id}`}
    >
      {/* Status indicator bar */}
      <div
        className={`w-1 self-stretch rounded-full flex-shrink-0 ${
          application.status === 'selected'
            ? 'bg-green-500'
            : application.status === 'pending'
            ? 'bg-amber-400'
            : 'bg-muted-foreground/30'
        }`}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-sm leading-tight truncate">{application.job.title}</p>
          <StatusBadge status={application.status} />
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {application.job.address || application.job.city}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(application.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}
          </span>
          {application.job.urgency === 'emergency' && (
            <Badge variant="destructive" className="text-[10px] py-0 h-4">Emergency</Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        {application.status === 'pending' && onWithdraw && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive h-7 text-xs px-2"
                disabled={withdrawing}
                data-testid={`button-withdraw-${application.id}`}
              >
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
                  onClick={onWithdraw}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Withdraw
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      </div>
    </div>
  );
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
      toast({ title: 'Application withdrawn', description: 'Your application has been withdrawn.' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to withdraw', description: error.message, variant: 'destructive' });
    },
  });

  if (!user || user.role !== 'provider') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <p className="text-muted-foreground">Only providers can view applications.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="px-4 py-5 border-b border-border/40">
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-3 divide-x border-b border-border/40">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-4 text-center">
              <Skeleton className="h-7 w-8 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/40">
            <Skeleton className="w-1 h-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    );
  }

  const pending  = applications?.filter(a => a.status === 'pending')  || [];
  const selected = applications?.filter(a => a.status === 'selected') || [];
  const rejected = applications?.filter(a => a.status === 'rejected') || [];

  if (!applications || applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mb-4">
          <Briefcase className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">No applications yet</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          Browse available jobs and submit your application to get started.
        </p>
        <Button onClick={() => setLocation('/jobs')} data-testid="button-browse-available-jobs">
          Browse Available Jobs
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    );
  }

  const sections = [
    { status: 'pending',  list: pending,  label: 'Pending',      icon: Clock,         iconClass: 'text-amber-500' },
    { status: 'selected', list: selected, label: 'Selected',     icon: CheckCircle2,  iconClass: 'text-green-500' },
    { status: 'rejected', list: rejected, label: 'Not Selected', icon: XCircle,       iconClass: 'text-muted-foreground' },
  ] as const;

  return (
    <div className="max-w-2xl mx-auto">

      {/* Page header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border/40">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            My Applications
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track your job applications</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/jobs')}
          data-testid="button-browse-jobs"
          className="text-xs"
        >
          Browse Jobs
          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 divide-x border-b border-border/40 bg-muted/20">
        {[
          { count: pending.length,  label: 'Pending',  colorClass: 'text-amber-500' },
          { count: selected.length, label: 'Selected', colorClass: 'text-green-500' },
          { count: rejected.length, label: 'Not Selected', colorClass: 'text-muted-foreground' },
        ].map((s) => (
          <div key={s.label} className="px-3 py-3.5 text-center">
            <p className={`text-2xl font-bold ${s.colorClass}`}>{s.count}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Sections */}
      {sections.map(({ status, list, label, icon: Icon, iconClass }) =>
        list.length > 0 ? (
          <div key={status}>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/30">
              <Icon className={`h-4 w-4 ${iconClass}`} />
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label} · {list.length}
              </span>
            </div>
            {list.map((app) => (
              <ApplicationRow
                key={app.id}
                application={app}
                onView={() => setLocation(`/jobs/${app.jobId}`)}
                onWithdraw={status === 'pending' ? () => withdrawMutation.mutate(app.id) : undefined}
                withdrawing={withdrawMutation.isPending}
              />
            ))}
          </div>
        ) : null
      )}
    </div>
  );
}
