import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { AuthFlow } from '../AuthenticationFlow';
import { supabase } from '@/integrations/supabase/client';

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
  const [shakeAnimation, setShakeAnimation] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email address';
    if (!formData.password) newErrors.password = 'Password is required';
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

    setIsLoading(true);

    try {
      // Real Supabase Auth sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        setShakeAnimation(true);
        setTimeout(() => setShakeAnimation(false), 500);
        toast.error(authError.message || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Login failed. Please try again.');
        setIsLoading(false);
        return;
      }

      // Resolve employee profile via edge function
      const { data: profileData, error: profileError } = await supabase.functions.invoke('employee-management', {
        body: { action: 'resolve-profile' }
      });

      if (profileError || profileData?.error) {
        const errorMsg = profileData?.error || 'Failed to load your profile';
        if (errorMsg.includes('inactive')) {
          toast.error('Your account is inactive. Contact your store administrator.');
        } else if (errorMsg.includes('No employee profile')) {
          toast.error('No store profile found. Please contact your administrator.');
        } else {
          toast.error(errorMsg);
        }
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      const { profile, store, permissions, visibility } = profileData;

      const userData = {
        id: profile.id,
        authUserId: authData.user.id,
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
        storeId: profile.store_id,
        store: store ? {
          id: store.id,
          name: store.name,
          type: store.type,
          address: store.address,
          phone: store.phone,
          email: store.email,
          timezone: store.timezone,
        } : null,
        permissions: permissions ? {
          accessTakeIn: permissions.can_access_take_in,
          accessInventory: permissions.can_access_inventory,
          accessCustomers: permissions.can_access_customers,
          accessPayouts: permissions.can_access_payouts,
          accessStatistics: permissions.can_access_statistics,
          accessSettings: permissions.can_access_settings,
          accessSavedForLater: permissions.can_access_saved_for_later,
          canEditRates: permissions.can_edit_rates,
          canEditFinalPayout: permissions.can_edit_final_payout_amount,
          canPrintLabels: permissions.can_print_labels,
          canPrintReceipts: permissions.can_print_receipts,
          canDeleteItems: permissions.can_delete_items,
          canCompletePurchase: permissions.can_complete_purchase,
          canReopenTransactions: permissions.can_reopen_transactions,
        } : null,
        visibility: visibility ? {
          hideProfit: visibility.hide_profit,
          hidePercentagePaid: visibility.hide_percentage_paid,
          hideMarketValue: visibility.hide_market_value,
          hideTotalPayoutBreakdown: visibility.hide_total_payout_breakdown,
          hideAverageRate: visibility.hide_average_rate,
        } : null,
        isActive: profile.is_active,
      };

      toast.success(`Welcome back, ${userData.name || 'User'}!`);
      onLogin(userData, formData.rememberMe);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <Card className={`w-full ${shakeAnimation ? 'animate-pulse' : ''}`}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Sign in to your store</CardTitle>
        <CardDescription>
          Enter your credentials to access your jewelry & pawn management system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            {errors.email && <p className="text-rose-500 text-sm">{errors.email}</p>}
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
            {errors.password && <p className="text-rose-500 text-sm">{errors.password}</p>}
          </div>

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

          <Button type="submit" className="w-full" disabled={!isFormValid || isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
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
      </CardContent>
    </Card>
  );
}
