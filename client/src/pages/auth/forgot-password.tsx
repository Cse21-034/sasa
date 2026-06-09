import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, KeyRound, Loader2, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const stepMeta: Record<Step, { icon: typeof Mail; title: string; subtitle: string }> = {
  email: { icon: Mail, title: 'Forgot Password?', subtitle: "Enter your email and we'll send a reset code" },
  code: { icon: KeyRound, title: 'Enter Reset Code', subtitle: "We've sent a 6-digit code to your email" },
  reset: { icon: KeyRound, title: 'New Password', subtitle: 'Create a strong new password for your account' },
  success: { icon: CheckCircle, title: 'All Done!', subtitle: 'Your password has been reset successfully' },
};

function WaveTop({ step }: { step: Step }) {
  const { icon: Icon, title, subtitle } = stepMeta[step];
  return (
    <div
      className="relative px-8 pt-12 pb-20 flex-shrink-0"
      style={{ background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 50%, #2a4d4f 100%)' }}
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 220" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M-80 180 C40 60 200 260 380 80" stroke="white" strokeWidth="50" strokeLinecap="round" opacity="0.06"/>
        <path d="M-40 280 C80 160 240 320 440 180" stroke="white" strokeWidth="35" strokeLinecap="round" opacity="0.06"/>
        <path d="M120 -40 C180 80 60 200 260 300" stroke="white" strokeWidth="40" strokeLinecap="round" opacity="0.06"/>
      </svg>

      <div className="relative z-10 text-center">
        <img src="/logo-full.png" alt="JobTradeSasa" className="h-28 w-auto max-w-[280px] object-contain mx-auto mb-4 drop-shadow-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
          <Icon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="text-white/70 text-base mt-1">{subtitle}</p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 leading-none">
        <svg viewBox="0 0 500 48" preserveAspectRatio="none" className="w-full h-12 block" style={{ fill: 'hsl(var(--background))' }}>
          <path d="M0,48 L0,28 Q125,0 250,24 Q375,48 500,20 L500,48 Z" />
        </svg>
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      if (result.userId) setUserId(result.userId);
      toast({ title: 'Check your email', description: 'If an account exists with that email, a reset code has been sent.' });
      setStep('code');
    } catch {
      toast({ title: 'Request failed', description: 'Unable to process your request. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerify = () => {
    if (code.length !== 6) {
      toast({ title: 'Invalid code', description: 'Please enter the complete 6-digit code.', variant: 'destructive' });
      return;
    }
    setStep('reset');
  };

  const handleResetSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/reset-password', { userId, code, newPassword: data.newPassword, confirmPassword: data.confirmPassword });
      toast({ title: 'Password reset!', description: 'Your password has been reset successfully.' });
      setStep('success');
    } catch (error: any) {
      let message = error.message || 'Password reset failed';
      if (message.includes(':')) message = message.substring(message.indexOf(':') + 1).trim();
      toast({ title: 'Reset failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:items-center md:justify-center md:bg-muted/40 md:p-6">
      <div className="flex-1 flex flex-col w-full md:flex-none md:w-full md:max-w-md md:rounded-3xl md:shadow-2xl md:overflow-hidden">

        <WaveTop step={step} />

        <div className="flex-1 bg-background px-8 pb-10 pt-4 overflow-y-auto space-y-5">

          {/* Step: email */}
          {step === 'email' && (
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-5">
                <FormField
                  control={emailForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="pl-11 h-14 rounded-xl border-border bg-muted/30 focus:bg-background text-base"
                            data-testid="input-email"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-14 rounded-xl text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg" disabled={isLoading} data-testid="button-send-code">
                  {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</> : 'Send Reset Code'}
                </Button>
              </form>
            </Form>
          )}

          {/* Step: code */}
          {step === 'code' && (
            <div className="space-y-5">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode} data-testid="input-reset-code">
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
              <Button className="w-full h-14 rounded-xl text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg" onClick={handleCodeVerify} disabled={code.length !== 6} data-testid="button-verify-code">
                Verify Code
              </Button>
              <Button variant="ghost" className="w-full h-12 rounded-xl text-base" onClick={() => setStep('email')}>
                <ArrowLeft className="mr-2 h-5 w-5" /> Back to Email
              </Button>
            </div>
          )}

          {/* Step: reset */}
          {step === 'reset' && (
            <Form {...resetForm}>
              <form onSubmit={resetForm.handleSubmit(handleResetSubmit)} className="space-y-5">
                <FormField
                  control={resetForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input type={showNew ? 'text' : 'password'} placeholder="Enter new password" className="pl-11 pr-11 h-14 rounded-xl border-border bg-muted/30 focus:bg-background text-base" data-testid="input-new-password" {...field} />
                          <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={resetForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input type={showConfirm ? 'text' : 'password'} placeholder="Confirm new password" className="pl-11 pr-11 h-14 rounded-xl border-border bg-muted/30 focus:bg-background text-base" data-testid="input-confirm-password" {...field} />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-sm" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-14 rounded-xl text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg" disabled={isLoading} data-testid="button-reset-password">
                  {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Resetting...</> : 'Reset Password'}
                </Button>
              </form>
            </Form>
          )}

          {/* Step: success */}
          {step === 'success' && (
            <Button className="w-full h-14 rounded-xl text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg" onClick={() => setLocation('/login')} data-testid="button-goto-login">
              Go to Login
            </Button>
          )}

          {step !== 'success' && (
            <p className="text-center text-base text-muted-foreground pt-2">
              Remember your password?{' '}
              <Link href="/login">
                <a className="text-primary hover:underline font-semibold" data-testid="link-login">Back to Login</a>
              </Link>
            </p>
          )}

          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-border flex-wrap">
            <Link href="/">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Home</a>
            </Link>
            <span className="text-border text-sm">·</span>
            <Link href="/support">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support</a>
            </Link>
            <span className="text-border text-sm">·</span>
            <Link href="/terms">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms & Conditions</a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
