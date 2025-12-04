import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Briefcase, Loader2, ArrowLeft, Mail, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

type Step = 'email' | 'code' | 'reset' | 'success';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState('');

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const handleEmailSubmit = async (data: EmailForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/forgot-password', data);
      const result = await response.json();
      
      if (result.userId) {
        setUserId(result.userId);
      }
      
      toast({
        title: 'Check your email',
        description: 'If an account exists with that email, a reset code has been sent.',
      });
      
      setStep('code');
    } catch (error: any) {
      toast({
        title: 'Request failed',
        description: 'Unable to process your request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerify = () => {
    if (code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the complete 6-digit code.',
        variant: 'destructive',
      });
      return;
    }
    setStep('reset');
  };

  const handleResetSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/reset-password', {
        userId,
        code,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      
      toast({
        title: 'Password reset!',
        description: 'Your password has been reset successfully.',
      });
      
      setStep('success');
    } catch (error: any) {
      let message = error.message || 'Password reset failed';
      if (message.includes(':')) {
        message = message.substring(message.indexOf(':') + 1).trim();
      }
      
      toast({
        title: 'Reset failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">JobTradeSasa</span>
            </div>
          </div>

          {step === 'email' && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Forgot Password?</CardTitle>
              <CardDescription className="text-center">
                Enter your email address and we'll send you a code to reset your password.
              </CardDescription>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Enter Reset Code</CardTitle>
              <CardDescription className="text-center">
                We've sent a 6-digit code to your email. Enter it below.
              </CardDescription>
            </>
          )}

          {step === 'reset' && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Create New Password</CardTitle>
              <CardDescription className="text-center">
                Enter a new password for your account.
              </CardDescription>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <KeyRound className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center text-green-600 dark:text-green-400">
                Password Reset Successful!
              </CardTitle>
              <CardDescription className="text-center">
                You can now log in with your new password.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'email' && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          data-testid="input-email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-send-code"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
              </form>
            </Form>
          )}

          {step === 'code' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={code} 
                  onChange={setCode}
                  data-testid="input-reset-code"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                className="w-full"
                onClick={handleCodeVerify}
                disabled={code.length !== 6}
                data-testid="button-verify-code"
              >
                Verify Code
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep('email')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Email
              </Button>
            </div>
          )}

          {step === 'reset' && (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-4">
                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          data-testid="input-new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          data-testid="input-confirm-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-reset-password"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </Form>
          )}

          {step === 'success' && (
            <Button
              className="w-full"
              onClick={() => setLocation('/login')}
              data-testid="button-goto-login"
            >
              Go to Login
            </Button>
          )}

          {step !== 'success' && (
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Remember your password?{' '}
                <Link href="/login">
                  <a className="text-primary hover:underline font-medium" data-testid="link-login">
                    Back to Login
                  </a>
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
