import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { apiRequest } from '@/lib/queryClient';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', data);
      const result = await response.json();

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setUser(result.user);

      if (result.requiresEmailVerification) {
        toast({ title: 'Verify your email', description: 'Please verify your email address to continue.' });
        setLocation(`/verify-email?userId=${result.user.id}`);
        return;
      }

      toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
      setLocation(result.user.role === 'provider' ? '/dashboard' : '/jobs');
    } catch (error: any) {
      let message = error.message || 'An unexpected error occurred';
      if (message.startsWith('400:') || message.startsWith('401:')) {
        message = message.substring(message.indexOf(':') + 1).trim();
      }
      toast({ title: 'Login failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:items-center md:justify-center md:bg-muted/40 md:p-6">
      <div className="flex-1 flex flex-col w-full md:flex-none md:w-full md:max-w-md md:rounded-3xl md:shadow-2xl md:overflow-hidden">

        {/* ── Colored top section ── */}
        <div
          className="relative px-8 pt-14 pb-20 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #1a3a3a 0%, #274345 50%, #2a4d4f 100%)' }}
        >
          {/* Decorative abstract lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 220" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M-80 180 C40 60 200 260 380 80" stroke="white" strokeWidth="50" strokeLinecap="round" opacity="0.06"/>
            <path d="M-40 280 C80 160 240 320 440 180" stroke="white" strokeWidth="35" strokeLinecap="round" opacity="0.06"/>
            <path d="M120 -40 C180 80 60 200 260 300" stroke="white" strokeWidth="40" strokeLinecap="round" opacity="0.06"/>
            <path d="M300 -60 C360 60 200 180 400 260" stroke="white" strokeWidth="30" strokeLinecap="round" opacity="0.05"/>
          </svg>

          {/* Brand */}
          <div className="relative z-10 text-center">
            <img src="/image.png" alt="JobTradeSasa" className="h-20 w-auto object-contain mx-auto drop-shadow-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          </div>

          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0 leading-none">
            <svg viewBox="0 0 500 48" preserveAspectRatio="none" className="w-full h-12 block" style={{ fill: 'hsl(var(--background))' }}>
              <path d="M0,48 L0,28 Q125,0 250,24 Q375,48 500,20 L500,48 Z" />
            </svg>
          </div>
        </div>

        {/* ── Form section ── */}
        <div className="flex-1 bg-background px-8 pb-10 pt-4 overflow-y-auto">
          <h1 className="text-2xl font-bold text-foreground mb-1">Sign in</h1>
          <p className="text-muted-foreground text-sm mb-7">Enter your credentials to access your account</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="demo@email.com"
                          className="pl-10 h-12 rounded-xl border-border bg-muted/30 focus:bg-background"
                          data-testid="input-email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-medium">Password</FormLabel>
                      <Link href="/forgot-password">
                        <a className="text-xs text-primary hover:underline font-medium" data-testid="link-forgot-password">
                          Forgot Password?
                        </a>
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="enter your password"
                          className="pl-10 pr-10 h-12 rounded-xl border-border bg-muted/30 focus:bg-background"
                          data-testid="input-password"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold mt-2 bg-primary hover:bg-primary/90 shadow-lg"
                disabled={isLoading}
                data-testid="button-login-submit"
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...</>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an Account?{' '}
            <Link href="/signup">
              <a className="text-primary hover:underline font-semibold" data-testid="link-signup">Sign up</a>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
