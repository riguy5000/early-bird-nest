import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { AuthFlow } from '../AuthenticationFlow';
import { supabase } from '@/integrations/supabase/client';

interface LoginScreenProps {
  onLogin: (userData: any, remember: boolean) => void;
  onNavigate: (flow: AuthFlow) => void;
}

export function LoginScreen({ onLogin, onNavigate }: LoginScreenProps) {
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
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
      const { data: profileData, error: profileError } = await supabase.functions.invoke('employee-management', {
        body: { action: 'resolve-profile' }
      });
      if (profileError || profileData?.error) {
        const errorMsg = profileData?.error || 'Failed to load your profile';
        if (errorMsg.includes('inactive')) toast.error('Your account is inactive. Contact your administrator.');
        else if (errorMsg.includes('No employee profile')) toast.error('No profile found. Please contact your administrator.');
        else toast.error(errorMsg);
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }
      if (profileData.type === 'platform_admin') {
        const pa = profileData.platformAdmin;
        const userData = { id: pa.id, authUserId: authData.user.id, email: pa.email, name: pa.full_name, role: pa.role, isPlatformAdmin: true, isActive: pa.is_active };
        toast.success(`Welcome back, ${userData.name || 'Admin'}!`);
        onLogin(userData, formData.rememberMe);
      } else {
        const { profile, store, permissions, visibility } = profileData;
        const userData = {
          id: profile.id, authUserId: authData.user.id, email: profile.email,
          name: `${profile.first_name} ${profile.last_name}`.trim(),
          firstName: profile.first_name, lastName: profile.last_name,
          role: profile.role, storeId: profile.store_id,
          store: store ? { id: store.id, name: store.name, type: store.type, address: store.address, phone: store.phone, email: store.email, timezone: store.timezone } : null,
          permissions: permissions ? {
            accessTakeIn: permissions.can_access_take_in, accessInventory: permissions.can_access_inventory,
            accessCustomers: permissions.can_access_customers, accessPayouts: permissions.can_access_payouts,
            accessStatistics: permissions.can_access_statistics, accessSettings: permissions.can_access_settings,
            accessSavedForLater: permissions.can_access_saved_for_later, canEditRates: permissions.can_edit_rates,
            canEditFinalPayout: permissions.can_edit_final_payout_amount, canPrintLabels: permissions.can_print_labels,
            canPrintReceipts: permissions.can_print_receipts, canDeleteItems: permissions.can_delete_items,
            canCompletePurchase: permissions.can_complete_purchase, canReopenTransactions: permissions.can_reopen_transactions,
          } : null,
          visibility: visibility ? {
            hideProfit: visibility.hide_profit, hidePercentagePaid: visibility.hide_percentage_paid,
            hideMarketValue: visibility.hide_market_value, hideTotalPayoutBreakdown: visibility.hide_total_payout_breakdown,
            hideAverageRate: visibility.hide_average_rate,
          } : null,
          isActive: profile.is_active,
        };
        toast.success(`Welcome back, ${userData.name || 'User'}!`);
        onLogin(userData, formData.rememberMe);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    /* ── Auth card — matches login-approved.png exactly ── */
    <div
      className={`w-full bg-white/90 backdrop-blur-xl rounded-[20px] px-8 py-10 ${shakeAnimation ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(255,255,255,0.7)' }}
    >
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-[28px] font-semibold tracking-tight title-gradient mb-2">
          Sign in to your store
        </h1>
        <p className="text-[14px] text-[#76707F]">
          Enter your credentials to access your jewelry & pawn management system
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div>
          <label className="text-[13px] font-medium text-[#2B2833] block mb-1.5">Email</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A3AE] pointer-events-none" />
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              autoComplete="email"
              className="w-full h-11 pl-10 pr-4 bg-white border border-black/[0.08] rounded-[10px] text-[14px] text-[#2B2833] placeholder:text-[#A8A3AE] focus:outline-none focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10 transition-all"
            />
          </div>
          {errors.email && <p className="text-[12px] text-[#F87171] mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="text-[13px] font-medium text-[#2B2833] block mb-1.5">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A8A3AE] pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={formData.password}
              onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
              autoComplete="current-password"
              className="w-full h-11 pl-10 pr-11 bg-white border border-black/[0.08] rounded-[10px] text-[14px] text-[#2B2833] placeholder:text-[#A8A3AE] focus:outline-none focus:border-[#6B5EF9]/40 focus:ring-4 focus:ring-[#6B5EF9]/10 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A3AE] hover:text-[#76707F] transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-[12px] text-[#F87171] mt-1">{errors.password}</p>}
        </div>

        {/* Remember me + Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={e => setFormData(p => ({ ...p, rememberMe: e.target.checked }))}
              className="w-4 h-4 rounded border-black/[0.15] text-[#6B5EF9] focus:ring-[#6B5EF9]/20"
            />
            <span className="text-[13px] text-[#76707F]">Remember me for 30 days</span>
          </label>
          <button
            type="button"
            onClick={() => onNavigate('forgot-password')}
            className="text-[13px] font-medium text-[#6B5EF9] hover:text-[#5848D9] transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Sign In button */}
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="w-full h-11 btn-primary-dark disabled:opacity-50 disabled:pointer-events-none text-[15px]"
        >
          {isLoading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* OR divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-black/[0.06]" />
        <span className="text-[12px] text-[#A8A3AE] uppercase tracking-wider">OR</span>
        <div className="flex-1 h-px bg-black/[0.06]" />
      </div>

      {/* Footer link */}
      <p className="text-center text-[13px] text-[#76707F]">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => onNavigate('register')}
          className="font-semibold title-gradient hover:opacity-80 transition-opacity"
        >
          Create your store
        </button>
      </p>
    </div>
  );
}
