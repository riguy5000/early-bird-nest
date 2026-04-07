import { useState, useEffect } from 'react';
import { AuthenticationFlow } from './components/AuthenticationFlow';
import { JewelryPawnApp } from './components/JewelryPawnApp';
import { Toaster } from './components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && !user) {
        try {
          const { data: profileData, error } = await supabase.functions.invoke('employee-management', {
            body: { action: 'resolve-profile' }
          });

          if (!error && !profileData?.error) {
            const { profile, store, permissions, visibility } = profileData;
            setUser({
              id: profile.id,
              authUserId: session.user.id,
              email: profile.email,
              name: `${profile.first_name} ${profile.last_name}`.trim(),
              role: profile.role,
              storeId: profile.store_id,
              store,
              permissions: permissions ? {
                accessTakeIn: permissions.can_access_take_in,
                accessInventory: permissions.can_access_inventory,
                accessCustomers: permissions.can_access_customers,
                accessPayouts: permissions.can_access_payouts,
                accessStatistics: permissions.can_access_statistics,
                accessSettings: permissions.can_access_settings,
              } : null,
              visibility,
              isActive: profile.is_active,
            });
            setIsAuthenticated(true);
          }
        } catch (err) {
          console.error('Profile resolution error:', err);
        }
        setIsLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setIsLoading(false);
    });

    return () => subscription.unsubscribe();
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <AuthenticationFlow onLogin={handleLogin} />
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <JewelryPawnApp user={user} onLogout={handleLogout} />
      <Toaster position="top-right" />
    </div>
  );
}
