// client/src/pages/admin/verification.tsx

import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, UserCheck, XCircle, FileText, User, Wrench, Building2, AlertCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// --- TYPES ---
interface Document {
    name: string;
    url: string; // This is the base64 string
}
interface Submission {
  id: string;
  userId: string;
  type: 'identity' | 'document';
  documents: Document[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  createdAt: string;
  user: {
      id: string;
      name: string;
      email: string;
      role: 'requester' | 'provider' | 'supplier';
      profilePhotoUrl: string;
  }
}

// --- HOOKS ---
const usePendingSubmissions = () => {
  return useQuery<Submission[]>({
    queryKey: ['adminPendingVerification'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/admin/verification/pending');
      const data = await res.json();
      // Attach user details manually if needed, but endpoint should handle
      return data;
    },
    refetchInterval: 15000, // Refresh every 15 seconds
  });
};

const useUpdateSubmissionStatus = () => {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id, status, reason }: { id: string, status: 'approved' | 'rejected', reason?: string }) => {
      const res = await apiRequest('PATCH', `/api/admin/verification/${id}/update-status`, { 
        status, 
        rejectionReason: reason 
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `Submission ${data.submission.status} successfully`,
        description: `User ${data.user.name} is now ${data.user.isVerified ? 'FULLY VERIFIED' : 'PARTIALLY VERIFIED'}.`,
      });
      // Invalidate query to refresh the pending list
      queryClient.invalidateQueries({ queryKey: ['adminPendingVerification'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update verification status.',
        variant: 'destructive',
      });
    },
  });
};

// --- COMPONENTS ---

// Helper component for the modal
const ReviewModal = ({ submission, onClose }: { submission: Submission | null, onClose: () => void }) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const updateMutation = useUpdateSubmissionStatus();
  
  if (!submission) return null;

  const handleAction = (status: 'approved' | 'rejected') => {
    const reason = status === 'rejected' ? rejectionReason : undefined;
    updateMutation.mutate({ id: submission.id, status, reason }, {
        onSuccess: () => onClose()
    });
  };

  const getTitle = () => {
    if (submission.type === 'identity') return 'Phase 1: Identity Check';
    return `Phase 2: ${submission.user.role === 'requester' ? 'Requester' : submission.user.role === 'provider' ? 'Artisan' : 'Organization'} Documents`;
  }
  
  const getIcon = () => {
      if (submission.type === 'identity') return <User className="h-6 w-6 text-primary" />;
      return submission.user.role === 'provider' ? <Wrench className="h-6 w-6 text-secondary" /> : <Building2 className="h-6 w-6 text-secondary" />;
  }

  return (
    <Dialog open={!!submission} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
          <DialogDescription>
            Review the submitted documents for **{submission.user.name}** ({submission.user.role}).
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 pt-4">
          {/* User Info Card */}
          <Card className="col-span-2 md:col-span-1 border">
             <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={submission.user.profilePhotoUrl} />
                    <AvatarFallback>{submission.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-lg font-bold">{submission.user.name}</p>
                    <p className="text-sm text-muted-foreground">{submission.user.email}</p>
                    <Badge variant="secondary" className="mt-1 capitalize">{submission.user.role}</Badge>
                </div>
            </CardContent>
          </Card>

          {/* Documents View */}
          <Card className="col-span-2 md:col-span-1 border">
            <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Submitted Documents
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 gap-3">
              {submission.documents.map((doc, index) => (
                <div 
                  key={index} 
                  className="group cursor-pointer border rounded-lg overflow-hidden relative shadow-sm"
                  onClick={() => setActiveDocument(doc)}
                >
                    <img
                        src={doc.url} 
                        alt={doc.name} 
                        className="w-full h-24 object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs p-1 bg-black/70 rounded">{doc.name}</span>
                    </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Action Panel */}
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Action</h3>
            <Textarea
                placeholder="Enter rejection reason if declining..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
                disabled={updateMutation.isPending}
            />
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => handleAction('rejected')}
            disabled={!rejectionReason || updateMutation.isPending}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button 
            onClick={() => handleAction('approved')}
            disabled={updateMutation.isPending}
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Approve
          </Button>
        </DialogFooter>

        {/* Document Preview Dialog */}
        <Dialog open={!!activeDocument} onOpenChange={() => setActiveDocument(null)}>
            <DialogContent className="max-w-4xl p-0">
                {activeDocument && (
                    <img 
                        src={activeDocument.url} 
                        alt="Document Preview" 
                        className="w-full h-auto object-contain max-h-[80vh] rounded-lg" 
                    />
                )}
            </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};


export default function AdminVerification() {
  const { data: pendingSubmissions, isLoading, error } = usePendingSubmissions();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <p className="text-destructive">Error loading pending submissions: {error.message}</p>
      </div>
    );
  }

  const identitySubmissions = pendingSubmissions?.filter(s => s.type === 'identity') || [];
  const documentSubmissions = pendingSubmissions?.filter(s => s.type === 'document') || [];
  const totalPending = (pendingSubmissions || []).length;


  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">User Verification Review</h1>
      
      <Card className="mb-8 border-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{totalPending}</div>
            <p className="text-xs text-muted-foreground">Submissions awaiting review</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Loader2 className="h-8 w-8 animate-spin mx-auto mt-12" />
      ) : totalPending === 0 ? (
        <Card className="border-2 border-dashed mt-8">
            <CardContent className="p-12 text-center">
                <UserCheck className="h-12 w-12 mx-auto text-success mb-4" />
                <h3 className="text-lg font-semibold">No Pending Submissions</h3>
                <p className="text-muted-foreground">All users are up to date or under review.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <User className="h-5 w-5" />
                        Identity Submissions ({identitySubmissions.length})
                    </CardTitle>
                    <CardDescription>Review ID and Selfie uploads (Phase 1)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {identitySubmissions.map((sub) => (
                        <Card key={sub.id} className="hover-elevate transition-all cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                            <CardContent className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={sub.user.profilePhotoUrl} />
                                        <AvatarFallback>{sub.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{sub.user.name}</p>
                                        <Badge variant="secondary" className="capitalize">{sub.user.role}</Badge>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline">Review</Button>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-secondary">
                        <FileText className="h-5 w-5" />
                        Document Submissions ({documentSubmissions.length})
                    </CardTitle>
                    <CardDescription>Review Trade/Business Document uploads (Phase 2)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {documentSubmissions.map((sub) => (
                        <Card key={sub.id} className="hover-elevate transition-all cursor-pointer" onClick={() => setSelectedSubmission(sub)}>
                            <CardContent className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={sub.user.profilePhotoUrl} />
                                        <AvatarFallback>{sub.user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{sub.user.name}</p>
                                        <Badge variant="secondary" className="capitalize">{sub.user.role}</Badge>
                                    </div>
                                </div>
                                <Button size="sm" variant="outline">Review</Button>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
      )}

      {/* Modal for detailed review */}
      <ReviewModal 
        submission={selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
}
