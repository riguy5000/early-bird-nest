import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthenticationFlow } from '../components/AuthenticationFlow';
import { JewelryPawnApp } from '../components/JewelryPawnApp';
import { RootAdminConsole } from '../components/RootAdminConsole';
import { ScanUploadPage } from '../components/store/ScanUploadPage';
import { supabase } from '@/integrations/supabase/client';

const queryClient = new QueryClient();

function buildStoreUserData(profileData: any, authUserId: string) {
  const { profile, store, permissions, visibility } = profileData;
  return {
    id: profile.id,
    authUserId,
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
}

function buildPlatformAdminData(platformAdmin: any, authUserId: string) {
  return {
    id: platformAdmin.id,
    authUserId,
    email: platformAdmin.email,
    name: platformAdmin.full_name,
    role: platformAdmin.role,
    isPlatformAdmin: true,
    isActive: platformAdmin.is_active,
  };
}

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let isResolved = false;

    const resolveProfile = async (session: any) => {
      if (isResolved) return;
      isResolved = true;

      try {
        const { data: profileData, error } = await supabase.functions.invoke('employee-management', {
          body: { action: 'resolve-profile' }
        });

        if (!mounted) return;

        if (error || profileData?.error) {
          console.error('Profile resolution failed:', profileData?.error || error);
          isResolved = false;
          setIsLoading(false);
          return;
        }

        if (profileData.type === 'platform_admin') {
          setUser(buildPlatformAdminData(profileData.platformAdmin, session.user.id));
        } else {
          setUser(buildStoreUserData(profileData, session.user.id));
        }
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error resolving profile:', err);
        isResolved = false;
      }
      if (mounted) setIsLoading(false);
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) {
        resolveProfile(session);
      } else {
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        if (mounted) {
          isResolved = false;
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
        }
        return;
      }

      // Ignore token refreshes and redundant sign-in events
      if (event === 'TOKEN_REFRESHED') return;
      if (isResolved) return;

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        resolveProfile(session);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = (userData: any, _remember: boolean) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Handle QR scan-upload route (no auth required)
  if (window.location.pathname === '/scan-upload') {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ScanUploadPage />
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (isLoading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading application...</p>
            </div>
          </div>
          <Toaster />
          <Sonner />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            <AuthenticationFlow onLogin={handleLogin} />
            <Toaster />
            <Sonner />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Route: Platform Admin → Root Admin Console
  // Route: Store User → Jewelry Pawn App
  const isPlatformAdmin = user?.isPlatformAdmin === true;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          {isPlatformAdmin ? (
            <RootAdminConsole user={user} onLogout={handleLogout} />
          ) : (
            <JewelryPawnApp user={user} onLogout={handleLogout} />
          )}
          <Toaster />
          <Sonner />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
