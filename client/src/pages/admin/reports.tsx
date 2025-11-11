import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, FileText, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

interface JobReport {
    id: string;
    jobId: string;
    reason: string;
    resolved: boolean;
    createdAt: string;
    reporter: {
        name: string;
        email: string;
        id: string;
    };
    jobTitle: string;
    jobStatus: string;
}

const useJobReports = (statusFilter: string) => {
  return useQuery<JobReport[]>({
    queryKey: ['adminJobReports', { statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter === 'resolved' ? 'resolved' : 'unresolved');
      
      const res = await apiRequest('GET', `/api/admin/reports?${params.toString()}`);
      return res.json();
    },
    refetchInterval: 30000,
  });
};

const useResolveReport = () => {
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (reportId: string) => {
            const res = await apiRequest('PATCH', `/api/admin/reports/${reportId}/resolve`, {});
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Report Resolved',
                description: 'The job report has been marked as resolved.',
            });
            queryClient.invalidateQueries({ queryKey: ['adminJobReports'] });
        },
        onError: (error: any) => {
            toast({
                title: 'Resolution Failed',
                description: error.message || 'Could not resolve report.',
                variant: 'destructive',
            });
        },
    });
}

export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState('unresolved');
  const { data: reports, isLoading } = useJobReports(statusFilter);
  const resolveMutation = useResolveReport();

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <FileText className="h-7 w-7 text-warning" />
            Reports & Disputes
        </h1>
        <p className="text-muted-foreground">Review and resolve issues reported by users on jobs.</p>
      </div>

      {/* Filter */}
      <Card className="mb-6 border-2">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <CardDescription className="flex-shrink-0">Filter Status:</CardDescription>
            <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger className="w-[180px] h-10">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unresolved">Unresolved ({reports?.filter(r => !r.resolved).length || 0})</SelectItem>
                <SelectItem value="resolved">Resolved ({reports?.filter(r => r.resolved).length || 0})</SelectItem>
                <SelectItem value="all">All Reports</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>{statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Reports ({reports?.length || 0})</CardTitle>
          <CardDescription>
            {statusFilter === 'unresolved' ? 'Actionable reports requiring moderator attention.' : 'Reports that have been closed.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto my-12" />
          ) : reports && reports.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="min-w-[200px]">Report Reason</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        {report.resolved ? (
                          <Badge variant="secondary" className="bg-success/20 text-success border-success">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Resolved
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" /> Unresolved
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] whitespace-normal">
                          <p className="font-medium line-clamp-2">{report.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                             Job: <Link href={`/jobs/${report.jobId}`}><a className="text-primary hover:underline">{report.jobTitle}</a></Link>
                          </p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{report.jobTitle}</p>
                        <Badge variant="outline" className="capitalize text-xs mt-1">{report.jobStatus}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{report.reporter?.name}</p>
                        <p className="text-xs text-muted-foreground">{report.reporter?.email}</p>
                      </TableCell>
                      <TableCell>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Link href={`/messages/${report.jobId}`}>
                            <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4" />
                            </Button>
                        </Link>
                        {!report.resolved && (
                            <Button 
                                variant="default" 
                                size="sm" 
                                onClick={() => resolveMutation.mutate(report.id)}
                                disabled={resolveMutation.isPending}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Resolve
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                No reports found matching the filter.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
