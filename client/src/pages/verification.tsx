import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, UserCheck, XCircle, FileText, Upload, Camera, ArrowRight, X, Wrench, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Progress } from '@/components/ui/progress';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// --- SCHEMAS ---
// 🆕 Updated to include idType for Smile Identity
const identityUploadSchema = z.object({
  idType: z.enum(['national_id', 'passport', 'driver_licence'], {
    errorMap: () => ({ message: 'Please select a valid ID type' })
  }),
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

// 🆕 Updated mutation to include idType for Smile Identity
const useVerificationSubmission = (type: 'identity' | 'document') => {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (payload: { documents: { name: string; url: string }[]; idType?: string }) => {
      // Documents must be an array of { name, url } for the backend schema
      const res = await apiRequest('POST', '/api/verification/submit', {
        type,
        documents: payload.documents,
        idType: payload.idType, // 🆕 For Smile Identity (Phase 1)
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: `${type === 'identity' ? 'Identity' : 'Document'} Submitted`,
        description: data.message,
      });

      // If Requester identity is auto-approved via Smile Identity, redirect
      if (user?.role === 'requester' && type === 'identity' && data.user && data.phase1Verified) {
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
      
      // If Provider/Supplier identity passed Phase 1, update user
      if (data.user && data.token && data.phase1Verified) {
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

// 🆕 SMILE IDENTITY PHASE 1 COMPONENT
const IdentityVerification = ({ statusData }: { statusData: any }) => {
  const { user } = useAuth();
  const form = useForm<IdentityUploadForm>({
    resolver: zodResolver(identityUploadSchema),
  });

  const identityMutation = useVerificationSubmission('identity');
  const [photoPreviews, setPhotoPreviews] = useState({ id: '', selfie: '' });

  const phase1Status = statusData.phase1?.status; // not_submitted, pending, approved, rejected
  const phase1Verified = statusData.phase1?.verified;
  const smileResult = statusData.phase1?.smileResult; // PASS or FAIL
  const confidenceScore = statusData.phase1?.confidenceScore;

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
    identityMutation.mutate({ documents, idType: data.idType });
  };
  
  const StatusAlert = () => {
    // ✅ APPROVED
    if (phase1Verified && smileResult === 'PASS') {
      return (
        <Alert className="bg-success/10 border-success/20">
          <UserCheck className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">✅ Phase 1 Verified (Smile Identity)</AlertTitle>
          <AlertDescription>
            {user?.role === 'requester' 
              ? 'You are fully verified. Proceed to dashboard.' 
              : `Identity verified with ${confidenceScore}% confidence. You can now proceed to Phase 2 (category verification).`}
          </AlertDescription>
        </Alert>
      );
    }

    // ⏳ PENDING
    if (phase1Status === 'pending') {
      return (
        <Alert className="bg-warning/10 border-warning/20">
          <Loader2 className="h-4 w-4 text-warning animate-spin" />
          <AlertTitle className="text-warning">Smile Identity Verification Processing...</AlertTitle>
          <AlertDescription>
            Your photos are being verified by Smile Identity. This usually takes a few seconds.
          </AlertDescription>
        </Alert>
      );
    }

    // ❌ REJECTED
    if (phase1Status === 'rejected' && smileResult === 'FAIL') {
      return (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Identity Verification Failed</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="font-semibold">Smile Identity Feedback:</p>
            <p>{statusData.phase1?.rejectionReason || 'Please ensure your photos are clear and meet the requirements.'}</p>
            <p className="text-sm mt-2">✓ Ensure good lighting and clear visibility of your face</p>
            <p className="text-sm">✓ ID document must be fully visible and not blurry</p>
            <p className="text-sm">✓ Selfie should show your face clearly next to the ID</p>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  const isDisabled = phase1Verified || phase1Status === 'pending' || identityMutation.isPending;
  const idTypeValue = form.watch('idType');

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          {user?.role === 'requester' ? 'Full Verification (Smile Identity)' : 'Phase 1: Identity Verification'}
        </CardTitle>
        <CardDescription>
          {user?.role === 'requester' 
            ? 'Automated verification powered by Smile Identity. Grants you instant access to post jobs.'
            : 'Automated identity check using Smile Identity KYC. No admin approval needed - results are instant.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <StatusAlert />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 🆕 ID TYPE SELECTOR */}
            <FormField
              control={form.control}
              name="idType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    ID Type <span className="text-destructive ml-1">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isDisabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your ID type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driver_licence">Driver's Licence</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {idTypeValue && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {/* ID Upload */}
                  <FormField
                    control={form.control}
                    name="idDocument"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          {idTypeValue === 'national_id' && 'National ID Photo'}
                          {idTypeValue === 'passport' && 'Passport Photo'}
                          {idTypeValue === 'driver_licence' && "Driver's Licence Photo"}
                          <span className="text-destructive ml-1">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-all ${!isDisabled ? 'hover:border-primary/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                            {photoPreviews.id ? (
                              <img src={photoPreviews.id} alt="ID Preview" className="w-full h-32 object-cover rounded" />
                            ) : (
                              <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                            )}
                            <p className="text-xs text-muted-foreground text-center max-w-[150px]">
                              Clear photo of your {idTypeValue === 'national_id' ? 'National ID' : idTypeValue === 'passport' ? 'Passport' : "Driver's Licence"}
                            </p>
                            <Input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileChange(e.target.files?.[0], 'idDocument')}
                              disabled={isDisabled}
                              {...fieldProps}
                            />
                            <Button type="button" variant="outline" size="sm" className="mt-2" 
                              onClick={() => (document.querySelector(`input[name="idDocument"]`) as HTMLInputElement)?.click()}
                              disabled={isDisabled}
                            >
                              {photoPreviews.id ? 'Change' : 'Select'}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Selfie Capture - CAMERA ONLY */}
                  <FormField
                    control={form.control}
                    name="selfiePhoto"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          Selfie with ID <span className="text-destructive ml-1">*</span>
                          <span className="text-xs text-orange-600 ml-2 font-semibold">📷 Camera Required</span>
                        </FormLabel>
                        <FormControl>
                          <div className={`flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-all ${!isDisabled ? 'hover:border-primary/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                            {photoPreviews.selfie ? (
                              <img src={photoPreviews.selfie} alt="Selfie Preview" className="w-full h-32 object-cover rounded" />
                            ) : (
                              <Camera className="h-10 w-10 text-orange-600 mb-2" />
                            )}
                            <p className="text-xs text-muted-foreground text-center max-w-[150px]">
                              📷 Use your device camera to take a selfie holding your ID next to your face
                            </p>
                            <Input
                              type="file"
                              accept="image/*"
                              capture="user"
                              className="hidden"
                              onChange={(e) => handleFileChange(e.target.files?.[0], 'selfiePhoto')}
                              disabled={isDisabled}
                              {...fieldProps}
                            />
                            <Button type="button" variant="outline" size="sm" className="mt-2"
                              onClick={() => (document.querySelector(`input[name="selfiePhoto"]`) as HTMLInputElement)?.click()}
                              disabled={isDisabled}
                            >
                              {photoPreviews.selfie ? 'Retake' : 'Take Selfie'}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Powered by Smile Identity</AlertTitle>
                  <AlertDescription className="text-blue-800 text-sm">
                    Your photos are securely verified using Smile Identity's KYC technology with liveness detection and face matching. No images are stored permanently.
                  </AlertDescription>
                </Alert>
                
                <Button
                  type="submit"
                  className="w-full h-12 font-semibold"
                  disabled={isDisabled || !form.getValues('idDocument') || !form.getValues('selfiePhoto') || identityMutation.isPending}
                >
                  {identityMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying with Smile Identity...
                    </>
                  ) : (
                    '✅ Verify Identity'
                  )}
                </Button>
              </>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// 🆕 PHASE 2: CATEGORY/QUALIFICATION VERIFICATION (Admin Approval)
const DocumentVerification = ({ statusData }: { statusData: any }) => {
  const { user } = useAuth();
  const form = useForm<DocumentUploadForm>({
    resolver: zodResolver(documentUploadSchema),
  });
  
  const [fileList, setFileList] = useState<File[]>([]);
  const documentMutation = useVerificationSubmission('document');

  // 🔍 Check Phase 2 status
  const phase2Status = statusData.phase2?.status; // pending, approved, rejected, null
  const phase2Approved = statusData.phase2?.status === 'approved';
  
  // 🔐 Check Phase 1 completion  
  const phase1Verified = statusData.phase1?.verified;
  const canProceedToPhase2 = statusData.canProceedToPhase2;

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
    // ❌ Phase 1 not complete
    if (!phase1Verified) {
      return (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Complete Phase 1 First</AlertTitle>
          <AlertDescription>
            You must complete Phase 1 (Identity Verification) before you can proceed to Phase 2.
          </AlertDescription>
        </Alert>
      );
    }

    // ✅ APPROVED
    if (phase2Approved) {
      return (
        <Alert className="bg-success/10 border-success/20">
          <UserCheck className="h-4 w-4 text-success" />
          <AlertTitle className="text-success">Phase 2 Complete</AlertTitle>
          <AlertDescription>
            Your documents have been approved! You can now accept jobs in your verified categories.
          </AlertDescription>
        </Alert>
      );
    }

    // ⏳ PENDING
    if (phase2Status === 'pending') {
      return (
        <Alert className="bg-warning/10 border-warning/20">
          <Loader2 className="h-4 w-4 text-warning animate-spin" />
          <AlertTitle className="text-warning">Phase 2 Under Review</AlertTitle>
          <AlertDescription>
            Admin is reviewing your documents. This typically takes 24-48 hours.
          </AlertDescription>
        </Alert>
      );
    }

    // ❌ REJECTED
    if (phase2Status === 'rejected') {
      return (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Documents Rejected</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p className="font-semibold">Admin Feedback:</p>
            <p>{statusData.phase2?.rejectionReason || 'Please resubmit your documents.'}</p>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  const isDisabled = phase2Approved || phase2Status === 'pending' || documentMutation.isPending || !phase1Verified;

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Phase 2: Category Verification
        </CardTitle>
        <CardDescription>
          Upload professional documents to verify your expertise. Admin review required - no automation here, just human verification.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <StatusAlert />

        {phase1Verified && (
          <>
            <div className="p-4 bg-muted/50 rounded-lg border">
              <p className="font-semibold mb-2">Required Documents ({user?.role === 'provider' ? 'Service Providers' : 'Suppliers'})</p>
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
                    <div className={`border-2 border-dashed rounded-lg p-6 transition-colors ${!isDisabled ? 'hover:border-primary/50 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id="document-upload"
                        disabled={isDisabled}
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} disabled={isDisabled}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 font-semibold"
                  disabled={isDisabled || fileList.length === 0 || documentMutation.isPending}
                >
                  {documentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Documents...
                    </>
                  ) : (
                    '📤 Submit for Admin Review'
                  )}
                </Button>
              </form>
            </Form>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// 🆕 MAIN VERIFICATION PAGE WITH SMILE IDENTITY
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

  // ✅ REQUESTER: If Phase 1 (full verification) is complete
  if (user.role === 'requester' && statusData?.isVerified) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <Card className="border-2 border-green-500">
          <CardContent className="p-8 space-y-4">
            <UserCheck className="h-12 w-12 text-green-600 mx-auto" />
            <h1 className="text-2xl font-bold">✅ Account Fully Verified!</h1>
            <p className="text-muted-foreground">Your identity has been verified by Smile Identity. You now have full access to post jobs.</p>
            <Button onClick={() => setLocation('/jobs')} className="mt-4">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ PROVIDER/SUPPLIER: If both Phase 1 & Phase 2 are complete
  if (isProviderOrSupplier && statusData?.phase1?.verified && statusData?.phase2?.status === 'approved') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <Card className="border-2 border-green-500">
          <CardContent className="p-8 space-y-4">
            <UserCheck className="h-12 w-12 text-green-600 mx-auto" />
            <h1 className="text-2xl font-bold">✅ Fully Verified & Approved!</h1>
            <p className="text-muted-foreground">Your identity (Phase 1) and documents (Phase 2) have been verified. You can now accept jobs in your approved categories.</p>
            <Button onClick={() => setLocation('/jobs')} className="mt-4">
              Browse Jobs
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 📊 Calculate progress for display
  let progress = 0;
  if (statusData?.phase1?.verified) {
    progress = isProviderOrSupplier ? 50 : 100;
  }
  if (statusData?.isVerified) {
    progress = 100;
  } else if (statusData?.phase2?.status === 'pending') {
    progress = 75;
  } else if (statusData?.phase2?.status === 'approved') {
    progress = 100;
  } else if (statusData?.phase1?.status === 'pending') {
    progress = 25;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* HEADER */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Account Verification</h1>
        <p className="text-muted-foreground mb-4">
          {user.role === 'requester' 
            ? 'Complete identity verification to unlock full access.' 
            : 'Complete both phases to unlock job opportunities.'}
        </p>
        
        {/* 🔄 PROGRESS TRACKER */}
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center gap-3 text-left">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${statusData?.phase1?.verified ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {statusData?.phase1?.verified ? '✓' : '1'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Phase 1: Identity Verification</p>
              <p className="text-xs text-muted-foreground">
                {statusData?.phase1?.verified ? '✅ Completed (Smile Identity)' : 'Pending - Automated KYC'}
              </p>
            </div>
          </div>

          {isProviderOrSupplier && (
            <div className="flex items-center gap-3 text-left">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${statusData?.phase2?.status === 'approved' ? 'bg-green-500 text-white' : statusData?.phase2?.status === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {statusData?.phase2?.status === 'approved' ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Phase 2: Category Verification</p>
                <p className="text-xs text-muted-foreground">
                  {statusData?.phase2?.status === 'approved' ? '✅ Approved' : statusData?.phase2?.status === 'pending' ? '⏳ Under Admin Review' : '❌ Not Started'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VERIFICATION COMPONENTS */}
      <div className="space-y-6">
        {/* PHASE 1 - SMILE IDENTITY */}
        <IdentityVerification statusData={statusData} />

        {/* PHASE 2 - ADMIN REVIEW (Providers/Suppliers Only) */}
        {isProviderOrSupplier && (
          <DocumentVerification statusData={statusData} />
        )}
      </div>

      {/* ADMIN NOTICE */}
      {user.role === 'admin' && (
        <Alert className="mt-8 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Admin Account</AlertTitle>
          <AlertDescription className="text-blue-800">
            Your account is automatically verified. Navigate to Admin Panel to review pending verifications.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
