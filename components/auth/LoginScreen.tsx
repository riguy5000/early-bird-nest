import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Eye, EyeOff, Smartphone, Crown, Gem } from 'lucide-react';
import { toast } from 'sonner';
import { AuthFlow } from '../AuthenticationFlow';

interface LoginScreenProps {
  onLogin: (userData: any, remember: boolean) => void;
  onNavigate: (flow: AuthFlow) => void;
}

export function LoginScreen({ onLogin, onNavigate }: LoginScreenProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (loginAttempts >= 5) {
      toast.error('Too many failed attempts. Please try again in 15 minutes.');
      return;
    }

    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (formData.email === 'admin@bravojewellers.com' && formData.password === '9811QWEasd') {
        const rootAdminData = {
          id: 'root_admin_1',
          email: formData.email,
          name: 'Root Administrator',
          role: 'root_admin',
          permissions: ['all'],
          isRootAdmin: true
        };
        toast.success('Welcome, Root Administrator!');
        onLogin(rootAdminData, formData.rememberMe);
        return;
      }
      
      if (formData.email === 'demo@example.com' && formData.password === 'password123') {
        const has2FA = formData.email.includes('2fa');
        if (has2FA && !show2FA) {
          setShow2FA(true);
          setIsLoading(false);
          return;
        }
        
        const userData = {
          id: '1',
          email: formData.email,
          name: 'Demo User',
          role: 'store_admin',
          storeId: 'store_1',
          permissions: ['store_management', 'inventory', 'customers', 'reports']
        };
        toast.success('Welcome back!');
        onLogin(userData, formData.rememberMe);
      } else {
        setLoginAttempts(prev => prev + 1);
        if (loginAttempts >= 4) {
          toast.error('Account temporarily locked. Too many failed attempts.');
        } else {
          toast.error('Invalid email or password');
        }
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    toast.info(`${provider} login will be implemented with OAuth2`);
  };

  const handle2FASubmit = async () => {
    if (twoFactorCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (twoFactorCode === '123456') {
        const userData = {
          id: '1',
          email: formData.email,
          name: 'Demo User',
          role: 'store_admin',
          storeId: 'store_1',
          permissions: ['store_management', 'inventory', 'customers', 'reports']
        };
        toast.success('Two-factor authentication successful!');
        onLogin(userData, formData.rememberMe);
      } else {
        toast.error('Invalid verification code');
        setTwoFactorCode('');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;
  const isRootAdminCredentials = formData.email === 'admin@bravojewellers.com' && formData.password === '9811QWEasd';

  return (
    <>
      <div className="w-full space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground mb-2">
            <Gem className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to your store management system
            </p>
          </div>
        </div>

        {/* Root Admin Badge */}
        {isRootAdminCredentials && (
          <div className="flex items-center gap-2 justify-center py-2 px-4 rounded-lg bg-warning/10 text-warning">
            <Crown className="h-4 w-4" />
            <span className="text-sm font-medium">Root Administrator Access</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              autoComplete="email"
              className="h-11"
            />
            {errors.email && (
              <p className="text-destructive text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                autoComplete="current-password"
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-destructive text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
              }
            />
            <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
              Remember me for 30 days
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-11 text-sm font-medium"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Signing in…
              </div>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 text-xs text-muted-foreground bg-background">
              or continue with
            </span>
          </div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin('google')}
            className="h-11"
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSocialLogin('apple')}
            className="h-11"
          >
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple
          </Button>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="font-medium text-foreground hover:underline underline-offset-4"
          >
            Create your store
          </button>
        </p>

        {/* Dev Credentials */}
        <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Demo Credentials</p>
          <p className="text-xs text-muted-foreground">Root Admin: admin@bravojewellers.com / 9811QWEasd</p>
          <p className="text-xs text-muted-foreground">Regular: demo@example.com / password123</p>
        </div>
      </div>

      {/* 2FA Modal */}
      <AlertDialog open={show2FA} onOpenChange={setShow2FA}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5" />
              Verify your identity
            </AlertDialogTitle>
            <AlertDialogDescription>
              Enter the 6-digit code from your authenticator app.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            <InputOTP maxLength={6} value={twoFactorCode} onChange={setTwoFactorCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            
            <p className="text-xs text-muted-foreground">
              Didn't receive a code?{' '}
              <button className="text-foreground hover:underline underline-offset-4">Resend</button>
            </p>
          </div>
          
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShow2FA(false)} size="sm">
              Cancel
            </Button>
            <Button onClick={handle2FASubmit} disabled={isLoading} size="sm">
              {isLoading ? 'Verifying…' : 'Verify'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
