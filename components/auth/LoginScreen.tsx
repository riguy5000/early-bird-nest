import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { Eye, EyeOff, Mail, Lock, Smartphone, Crown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
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
  const [shakeAnimation, setShakeAnimation] = useState(false);

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
    
    if (!validateForm()) {
      setShakeAnimation(true);
      setTimeout(() => setShakeAnimation(false), 500);
      return;
    }

    // Rate limiting check
    if (loginAttempts >= 5) {
      toast.error('Too many failed attempts. Please try again in 15 minutes.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for Root Admin credentials
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
      
      // Mock authentication logic for regular users
      if (formData.email === 'demo@example.com' && formData.password === 'password123') {
        // Check if user has 2FA enabled (mock check)
        const has2FA = formData.email.includes('2fa');
        
        if (has2FA && !show2FA) {
          setShow2FA(true);
          setIsLoading(false);
          return;
        }
        
        // Successful login for regular user
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
        // Failed login
        setLoginAttempts(prev => prev + 1);
        setShakeAnimation(true);
        setTimeout(() => setShakeAnimation(false), 500);
        
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
      // Simulate 2FA verification
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

  const isFormValid = formData.email && formData.password && Object.keys(errors).length === 0;

  // Check if current inputs match root admin credentials
  const isRootAdminCredentials = formData.email === 'admin@bravojewellers.com' && formData.password === '9811QWEasd';

  return (
    <>
      <Card className={`w-full ${shakeAnimation ? 'animate-pulse' : ''}`}>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            {isRootAdminCredentials && <Crown className="h-5 w-5 text-yellow-600" />}
            Sign in to your store
          </CardTitle>
          <CardDescription>
            {isRootAdminCredentials ? (
              <span className="text-yellow-600 font-medium">Root Administrator Access</span>
            ) : (
              'Enter your credentials to access your jewelry & pawn management system'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email / Username</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-rose-500 text-sm">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-500 text-sm">{errors.password}</p>
              )}
            </div>

            {/* Root Admin Indicator */}
            {isRootAdminCredentials && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-yellow-700">
                  <Crown className="h-4 w-4" />
                  <span className="text-sm font-medium">Root Administrator Detected</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  You will be signed in with full platform access
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, rememberMe: checked as boolean }))
                  }
                />
                <Label htmlFor="remember" className="text-sm font-normal">
                  Remember me for 30 days
                </Label>
              </div>
              
              <Button
                type="button"
                variant="link"
                className="px-0 h-auto text-sm"
                onClick={() => onNavigate('forgot-password')}
              >
                Forgot password?
              </Button>
            </div>

            <Button
              type="submit"
              className={`w-full ${isRootAdminCredentials ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
              disabled={!isFormValid || isLoading}
            >
              {isLoading ? 'Signing in...' : isRootAdminCredentials ? 'Sign In as Root Admin' : 'Sign In'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('google')}
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialLogin('apple')}
              className="w-full"
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C6.624 0 2.246 4.378 2.246 9.771s4.378 9.771 9.771 9.771 9.771-4.378 9.771-9.771S17.41 0 12.017 0zm4.31 7.139c-1.365 0-2.47 1.105-2.47 2.47s1.105 2.47 2.47 2.47 2.47-1.105 2.47-2.47-1.105-2.47-2.47-2.47z"/>
              </svg>
              Apple
            </Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Button
              type="button"
              variant="link"
              className="px-0 h-auto"
              onClick={() => onNavigate('register')}
            >
              Create your store
            </Button>
          </div>

          {/* Development Helper */}
          <div className="mt-6 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">Demo Credentials:</p>
            <p>• Root Admin: admin@bravojewellers.com / 9811QWEasd</p>
            <p>• Regular User: demo@example.com / password123</p>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Modal */}
      <AlertDialog open={show2FA} onOpenChange={setShow2FA}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Two-Factor Authentication
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please enter the 6-digit verification code sent to your device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex flex-col items-center space-y-4 py-4">
            <InputOTP
              maxLength={6}
              value={twoFactorCode}
              onChange={setTwoFactorCode}
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
            
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive a code? 
              <Button variant="link" className="px-1 h-auto text-sm">
                Resend
              </Button>
            </p>
          </div>
          
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShow2FA(false)}>
              Cancel
            </Button>
            <Button onClick={handle2FASubmit} disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}