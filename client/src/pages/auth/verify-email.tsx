import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Briefcase, Loader2, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/queryClient';

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const userId = searchParams.get('userId');
  
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const effectiveUserId = userId || user?.id;

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the complete 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      await apiRequest('POST', '/api/auth/verify-email', {
        userId: effectiveUserId,
        code,
      });

      toast({
        title: 'Email verified!',
        description: 'Your email has been verified successfully.',
      });

      if (user) {
        const updatedUser = { ...user, isEmailVerified: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      setLocation(user?.role === 'provider' ? '/dashboard' : '/jobs');
    } catch (error: any) {
      let message = error.message || 'Verification failed';
      if (message.includes(':')) {
        message = message.substring(message.indexOf(':') + 1).trim();
      }
      
      toast({
        title: 'Verification failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await apiRequest('POST', '/api/auth/resend-verification', {
        userId: effectiveUserId,
      });

      toast({
        title: 'Code sent!',
        description: 'A new verification code has been sent to your email.',
      });
      
      setCode('');
    } catch (error: any) {
      let message = error.message || 'Failed to resend code';
      if (message.includes(':')) {
        message = message.substring(message.indexOf(':') + 1).trim();
      }
      
      toast({
        title: 'Failed to resend',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!effectiveUserId) {
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
            <CardTitle className="text-2xl text-center text-destructive">Invalid Request</CardTitle>
            <CardDescription className="text-center">
              No user information found. Please try signing up or logging in again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => setLocation('/login')}
              data-testid="button-goto-login"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Verify Your Email</CardTitle>
          <CardDescription className="text-center">
            We've sent a 6-digit verification code to your email address. 
            Enter the code below to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <InputOTP 
              maxLength={6} 
              value={code} 
              onChange={setCode}
              data-testid="input-verification-code"
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
            onClick={handleVerify}
            disabled={isVerifying || code.length !== 6}
            data-testid="button-verify"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={isResending}
              data-testid="button-resend"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Code
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            The verification code will expire in 15 minutes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
