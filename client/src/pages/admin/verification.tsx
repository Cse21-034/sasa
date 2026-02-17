import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, UserCheck, XCircle, FileText, User, Wrench, Building2, AlertCircle, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, Suspense } from 'react';
import { pdfjs, Document as PDFDocument, Page as PDFPage } from 'react-pdf';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
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

// 🆕 FIX: Update Submission interface to correctly represent the joined data structure from storage.ts
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
        role: 'requester' | 'provider' | 'supplier' | 'admin';
        profilePhotoUrl: string | null; // Profile photo can be null
    }
}

// --- HOOKS ---
const usePendingSubmissions = () => {
  return useQuery<Submission[]>({
    queryKey: ['adminPendingVerification'],
    queryFn: async () => {
      // The backend is now fixed to return the joined user object
      const res = await apiRequest('GET', '/api/admin/verification/pending');
      return res.json();
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
      // The backend returns a new user object and token on success
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `Submission ${data.submission.status} successfully`,
        description: `User ${data.user.name} is now ${data.user.isVerified ? 'FULLY VERIFIED' : 'PARTIALLY VERIFIED'}. They may need to relogin for full access in all sessions.`,
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

// PDF Preview Component with pagination
const PDFPreviewComponent = ({ fileUrl }: { fileUrl: string }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const handlePreviousPage = () => {
    setPageNumber(prev => (prev > 1 ? prev - 1 : prev));
  };

  const handleNextPage = () => {
    if (numPages) {
      setPageNumber(prev => (prev < numPages ? prev + 1 : prev));
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      }>
        <div className="w-full flex flex-col items-center gap-4">
          <PDFDocument 
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Loading PDF...</p>
              </div>
            }
            error={
              <div className="text-red-500 text-sm">
                <p>Failed to load PDF. Please try downloading the file instead.</p>
              </div>
            }
          >
            <PDFPage 
              pageNumber={pageNumber}
              width={Math.min(600, window.innerWidth - 80)}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </PDFDocument>

          {/* PDF Navigation */}
          {numPages && numPages > 1 && (
            <div className="flex items-center gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={pageNumber <= 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm font-medium">
                Page {pageNumber} of {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={pageNumber >= numPages}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Suspense>
    </div>
  );
};

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
    return `Phase 2: ${submission.user.role === 'provider' ? 'Artisan' : 'Organization'} Documents`;
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
                    <AvatarImage src={submission.user.profilePhotoUrl || undefined} />
                    <AvatarFallback>{submission.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-lg font-bold">{submission.user.name}</p>
                    <p className="text-sm text-muted-foreground">{submission.user.email}</p>
                    <Badge variant="secondary" className="mt-1 capitalize">{submission.user.role}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">User ID: {submission.user.id}</p>
                </div>
            </CardContent>
          </Card>

          {/* Documents View */}
          <Card className="col-span-2 md:col-span-1 border">
            <CardHeader className="p-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Submitted Documents ({submission.documents.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-3 gap-3">
              {submission.documents.map((doc, index) => (
                <div 
                  key={index} 
                  className="group cursor-pointer border rounded-lg overflow-hidden relative shadow-sm"
                  onClick={() => setActiveDocument(doc)}
                >
                    {/* Check if it's a PDF. If so, display a placeholder */}
                    {doc.name.toLowerCase().endsWith('.pdf') ? (
                        <div className="w-full h-24 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-2">
                            <FileText className="h-8 w-8 text-destructive" />
                            <span className="text-xs text-muted-foreground truncate">{doc.name}</span>
                            <span className="text-xs font-medium text-primary">Click to View</span>
                        </div>
                    ) : (
                        <img
                            // ⚠️ FIX: The URL here is the Base64 string, so it should render directly
                            src={doc.url} 
                            alt={doc.name} 
                            className="w-full h-24 object-cover transition-transform group-hover:scale-105"
                        />
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
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
                placeholder="Enter rejection reason if declining... (Required for rejection)"
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

        {/* Document Preview Dialog (Used for large image/PDF display) */}
        <Dialog open={!!activeDocument} onOpenChange={() => setActiveDocument(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">
                <DialogHeader className="flex flex-row items-center justify-between pb-2">
                    <DialogTitle>{activeDocument?.name}</DialogTitle>
                    {activeDocument && (
                        <a
                            href={activeDocument.url}
                            download={activeDocument.name}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </a>
                    )}
                </DialogHeader>
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                    {activeDocument && activeDocument.name.toLowerCase().endsWith('.pdf') ? (
                        <PDFPreviewComponent fileUrl={activeDocument.url} />
                    ) : activeDocument ? (
                        <img 
                            src={activeDocument.url} 
                            alt="Document Preview" 
                            className="w-full h-auto object-contain max-h-[70vh] rounded-lg" 
                        />
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};


export default function AdminVerification() {
  // ⚠️ IMPORTANT FIX: Ensure data is handled safely by defaulting to an empty array
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

  // ⚠️ IMPORTANT FIX: Safely access pendingSubmissions
  const submissions = pendingSubmissions || [];
  const identitySubmissions = submissions.filter(s => s.type === 'identity') || [];
  const documentSubmissions = submissions.filter(s => s.type === 'document') || [];
  const totalPending = submissions.length;


  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">User Verification Review</h1>
      
      <Card className="mb-8">
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
        <Card className="border-dashed mt-8">
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
                                        <AvatarImage src={sub.user.profilePhotoUrl || undefined} />
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
                                        <AvatarImage src={sub.user.profilePhotoUrl || undefined} />
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
