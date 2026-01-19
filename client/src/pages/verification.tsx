import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UserCheck, XCircle, FileText, Upload, Camera, ArrowRight, X, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// --- SCHEMAS ---
const identityUploadSchema = z.object({
  idDocument: z.any().refine(file => file instanceof File, { message: 'ID photo is required' }),
  selfiePhoto: z.any().refine(file => file instanceof File, { message: 'Selfie photo is required' }),
});

const documentUploadSchema = z.object({
  documents: z.array(z.any().refine(file => file instanceof File)).min(1, 'At least one document is required.'),
});

type IdentityUploadForm = z.infer<typeof identityUploadSchema>;
type DocumentUploadForm = z.infer<typeof documentUploadSchema>;

// --- API & HOOKS ---

// Hook to get current verification status
const useVerificationStatus = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['verificationStatus', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const res = await apiRequest('GET', '/api/verification/status');
      return res.json();
    },
    enabled: !!user,
  });
};

// General mutation function for submitting verification
const useVerificationSubmission = (type: 'identity' | 'document') => {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (payload: { documents: { name: string; url: string }[] }) => {
      // Documents must be an array of { name, url } for the backend schema
      const res = await apiRequest('POST', '/api/verification/submit', {
        type,
        documents: payload.documents,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `${type === 'identity' ? 'Identity' : 'Document'} Submitted`,
        description: data.message,
      });

      // If Requester identity is auto-approved, the backend sends new token/user data
      if (user?.role === 'requester' && type === 'identity' && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        toast({
          title: 'Verification Complete! 🎉',
          description: 'Your account is now fully verified. You can now post jobs.',
          duration: 5000,
        });
        setLocation('/jobs');
      }
      
      // If Provider/Supplier identity approved, update user in state with new token
      if (data.user && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      }
      
      // Invalidate query to update UI status
      queryClient.invalidateQueries({ queryKey: ['verificationStatus', user?.id] });
    },
    onError: (error: any) => {
      const message = error.message.startsWith('400:') 
        ? error.message.substring(error.message.indexOf(':') + 1).trim()
        : error.message;

      toast({
        title: 'Submission Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });
};

// --- UTILS ---

// Helper function to convert File to Base64 (for mock upload)
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- COMPONENTS ---

const IdentityVerification = ({ statusData }: { statusData: any }) => {
  const { user } = useAuth();
  const form = useForm<IdentityUploadForm>({
    resolver: zodResolver(identityUploadSchema),
  });

  const identityMutation = useVerificationSubmission('identity');
  const [photoPreviews, setPhotoPreviews] = useState({ id: '', selfie: '' });

  const isPending = statusData.identitySubmission?.status === 'pending';
  const isApproved = statusData.isIdentityVerified;

  const handleFileChange = async (file: File | undefined, field: 'idDocument' | 'selfiePhoto') => {
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        form.setError(field, { message: 'File too large (Max 5MB)' });
        return;
      }
      form.clearErrors(field);
      form.setValue(field, file as any, { shouldValidate: true });
      const base64 = await fileToBase64(file);
      setPhotoPreviews(prev => ({ ...prev, [field === 'idDocument' ? 'id' : 'selfie']: base64 }));
    }
  };

  const onSubmit = async (data: IdentityUploadForm) => {
    const documents = [
      { name: 'national_id', url: await fileToBase64(data.idDocument) },
      { name: 'selfie_photo', url: await fileToBase64(data.selfiePhoto) },
    ];
    identityMutation.mutate({ documents });
  };
  
  const StatusAlert = () => {
      if (isApproved) {
        return (
          <Alert className="bg-success/10 border-success/20">
            <UserCheck className="h-4 w-4 text-success" />
            <AlertTitle className="text-success">Identity Approved</AlertTitle>
            <AlertDescription>
              {user?.role === 'requester' ? 'You are fully verified. Proceed to dashboard.' : 'Phase 1: Identity is verified.'}
            </AlertDescription>
          </Alert>
        );
      }
      if (isPending) {
        return (
          <Alert className="bg-warning/10 border-warning/20">
            <Loader2 className="h-4 w-4 text-warning animate-spin" />
            <AlertTitle className="text-warning">Identity Verification Pending</AlertTitle>
            <AlertDescription>
              Your submission is under review {user?.role === 'requester' ? ' (auto-review in progress).' : 'by the admin.'} Please check back later.
            </AlertDescription>
          </Alert>
        );
      }
      
      const isRejected = statusData.identitySubmission?.status === 'rejected';
      if (isRejected) {
          return (
            <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Identity Verification Rejected</AlertTitle>
                <AlertDescription>
                    {statusData.identitySubmission?.rejectionReason || 'Your submission was rejected. Please resubmit clear photos.'}
                </AlertDescription>
            </Alert>
          );
      }
      return null;
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            {user?.role === 'requester' ? <UserCheck className="h-6 w-6" /> : <Wrench className="h-6 w-6" />}
            {user?.role === 'requester' ? 'Full Verification' : 'Phase 1: Identity Check'}
        </CardTitle>
        <CardDescription>
          Upload your National ID and a selfie for identity verification.
          {user?.role === 'requester' && ' This grants you full access automatically.'}
          {user?.role !== 'requester' && ' This is the first step before document verification.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusAlert />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* ID Upload */}
              <FormField
                control={form.control}
                name="idDocument"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Valid Government ID <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${!isApproved && !isPending ? 'hover:border-primary/50' : ''}`}>
                        {photoPreviews.id ? (
                          <img src={photoPreviews.id} alt="ID Preview" className="w-full h-24 object-cover rounded" />
                        ) : (
                          <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                        )}
                        <p className="text-xs text-muted-foreground text-center">
                            Upload a clear photo of your ID.
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e.target.files?.[0], 'idDocument')}
                          {...fieldProps}
                        />
                         <Button type="button" variant="outline" size="sm" className="mt-2" 
                            onClick={() => (document.querySelector(`input[name=\"idDocument\"]`) as HTMLInputElement)?.click()}
                            disabled={isApproved || isPending}
                        >
                             {photoPreviews.id ? 'Change File' : 'Select File'}
                         </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Selfie Upload */}
              <FormField
                control={form.control}
                name="selfiePhoto"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Selfie Photo <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${!isApproved && !isPending ? 'hover:border-primary/50' : ''}`}>
                        {photoPreviews.selfie ? (
                          <img src={photoPreviews.selfie} alt="Selfie Preview" className="w-full h-24 object-cover rounded" />
                        ) : (
                          <Camera className="h-10 w-10 text-muted-foreground mb-2" />
                        )}
                         <p className="text-xs text-muted-foreground text-center">
                            Hold your ID next to your face.
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileChange(e.target.files?.[0], 'selfiePhoto')}
                          {...fieldProps}
                        />
                        <Button type="button" variant="outline" size="sm" className="mt-2" 
                            onClick={() => (document.querySelector(`input[name=\"selfiePhoto\"]`) as HTMLInputElement)?.click()}
                            disabled={isApproved || isPending}
                        >
                             {photoPreviews.selfie ? 'Change File' : 'Take Selfie'}
                         </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button
              type="submit"
              className="w-full h-12"
              disabled={isApproved || isPending || identityMutation.isPending || !form.getValues('idDocument') || !form.getValues('selfiePhoto')}
            >
              {identityMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Identity...
                </>
              ) : (
                'Submit for Identity Verification'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const DocumentVerification = ({ statusData }: { statusData: any }) => {
  const { user } = useAuth();
  const form = useForm<DocumentUploadForm>({
    resolver: zodResolver(documentUploadSchema),
  });
  
  const [fileList, setFileList] = useState<File[]>([]);
  const documentMutation = useVerificationSubmission('document');

  const isPending = statusData.documentSubmission?.status === 'pending';
  const isApproved = statusData.isVerified;
  const isIdentityApproved = statusData.isIdentityVerified;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles = Array.from(files).filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          alert(`${file.name} is too large (Max 5MB)`);
          return false;
        }
        return true;
      });
      setFileList(prev => [...prev, ...validFiles]);
      form.setValue('documents', [...fileList, ...validFiles] as any, { shouldValidate: true });
    }
  };

  const removeFile = (index: number) => {
    const newFileList = fileList.filter((_, i) => i !== index);
    setFileList(newFileList);
    form.setValue('documents', newFileList as any, { shouldValidate: true });
  };

  const onSubmit = async () => {
    const documents = await Promise.all(fileList.map(async (file) => ({
      name: file.name,
      url: await fileToBase64(file),
    })));

    documentMutation.mutate({ documents });
  };

  const artisanDocumentList = [
    'Trade Certificate', 'Work Portfolio', 'Trade License', 'Insurance Certificate', 'References', 'Safety Certificate (Optional)', 'Equipment Certificate (Optional)', 'Background Check (Self-declared)', 'Bank Details (Proof)'
  ];

  const supplierDocumentList = [
      'Business Registration', 'Tax Compliance Certificate', 'Trading Licence', 'Product Catalog/Price List', 'Quality Certificate (Optional)', 'Insurance', 'Bank Reference', 'Financial Statement', 'Company Profile', 'References'
  ];
  
  const documentList = user?.role === 'provider' ? artisanDocumentList : supplierDocumentList;

  const StatusAlert = () => {
    if (!isIdentityApproved) {
        return (
             <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Action Required</AlertTitle>
                <AlertDescription>
                    Please complete and approve **Phase 1: Identity Check** first.
                </AlertDescription>
            </Alert>
        );
    }

    if (isApproved) {
        return (
          <Alert className="bg-success/10 border-success/20">
            <UserCheck className="h-4 w-4 text-success" />
            <AlertTitle className="text-success">Verification Complete</AlertTitle>
            <AlertDescription>
              Your account is now fully verified.
            </AlertDescription>
          </Alert>
        );
    }
    if (isPending) {
        return (
          <Alert className="bg-warning/10 border-warning/20">
            <Loader2 className="h-4 w-4 text-warning animate-spin" />
            <AlertTitle className="text-warning">Document Verification Pending</AlertTitle>
            <AlertDescription>
              Your documents are under review by the admin. This may take 1-2 business days.
            </AlertDescription>
          </Alert>
        );
    }
    
    const isRejected = statusData.documentSubmission?.status === 'rejected';
    if (isRejected) {
        return (
          <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Document Verification Rejected</AlertTitle>
              <AlertDescription>
                  <strong>Reason:</strong> {statusData.documentSubmission?.rejectionReason || 'Your document submission was rejected. Please resubmit with clear documents.'}
              </AlertDescription>
          </Alert>
        );
    }
    return null;
  }

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Phase 2: Document Verification
        </CardTitle>
        <CardDescription>
          Upload your professional documents for final review.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusAlert />

        <div className="p-4 bg-muted/50 rounded-lg border">
          <p className="font-semibold mb-2">Required Documents ({user?.role === 'provider' ? 'Artisans' : 'Organizations'})</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {documentList.map((doc, index) => (
              <li key={index}>{doc}</li>
            ))}
          </ul>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Dropzone */}
            <FormItem>
              <FormLabel>Upload Documents (PDF, JPG, PNG - Max 5MB each)</FormLabel>
              <FormControl>
                <div className={`border-2 border-dashed rounded-lg p-6 hover:border-primary/50 transition-colors cursor-pointer ${!isIdentityApproved || isApproved || isPending ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="document-upload"
                    disabled={!isIdentityApproved || isApproved || isPending}
                  />
                  <label
                    htmlFor="document-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">Click or drag files to upload</p>
                  </label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>

            {/* File List */}
            {fileList.length > 0 && (
              <div className="space-y-2">
                <p className="font-semibold text-sm">Uploaded Files ({fileList.length})</p>
                {fileList.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={!isIdentityApproved || isApproved || isPending || fileList.length === 0 || documentMutation.isPending}
            >
              {documentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting Documents...
                </>
              ) : (
                'Submit Documents for Review'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// 3. MAIN VERIFICATION PAGE
export default function VerificationPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: statusData, isLoading: isStatusLoading } = useVerificationStatus();

  const isProviderOrSupplier = user?.role === 'provider' || user?.role === 'supplier';

  if (isStatusLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (statusData?.isVerified) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <Card className="border-2 border-primary/50">
          <CardContent className="p-8 space-y-4">
            <UserCheck className="h-12 w-12 text-primary mx-auto" />
            <h1 className="text-2xl font-bold">Account Fully Verified!</h1>
            <p className="text-muted-foreground">You now have full access to all platform features.</p>
            <Button onClick={() => setLocation('/jobs')}>
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress for display
  let progress = 0;
  if (statusData?.isIdentityVerified) {
    progress = isProviderOrSupplier ? 50 : 100;
  }
  if (statusData?.isVerified) {
      progress = 100;
  } else if (statusData?.documentSubmission?.status === 'pending') {
      progress = isProviderOrSupplier ? 75 : 100; 
  } else if (statusData?.identitySubmission?.status === 'pending') {
      progress = 25;
  }


  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Account Verification</h1>
        <p className="text-muted-foreground">
          Complete the required steps to unlock full access to the marketplace as a **{user.role}**.
        </p>
      </div>

      <div className="mb-8 space-y-4">
        <p className="text-lg font-semibold flex items-center gap-2">
            Verification Progress
        </p>
        <Progress value={progress} className="w-full h-4" />
        <p className="text-sm text-muted-foreground">{progress}% Complete</p>
      </div>

      <div className="space-y-6">
        <IdentityVerification statusData={statusData} />

        {isProviderOrSupplier && (
            <DocumentVerification statusData={statusData} />
        )}
      </div>

       {user.role === 'admin' && (
          <Alert className="mt-8">
            <AlertTitle>Admin Notice</AlertTitle>
            <AlertDescription>
              As an Admin, your account is automatically verified. Please navigate to the Admin Panel to manage pending verifications.
            </AlertDescription>
          </Alert>
       )}
    </div>
  );
}
