import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreSettings {
  general: Record<string, any>;
  globalVisibility: {
    showProfit: boolean;
    showPayoutPercent: boolean;
    showMarketValue: boolean;
    showProfitInFooter: boolean;
    showAverageRateInFooter: boolean;
  };
  intakeDefaults: Record<string, any>;
  payoutDefaults: Record<string, any>;
  rateDefaults: Record<string, any>;
  customerSettings: Record<string, any>;
  complianceSettings: Record<string, any>;
  printSettings: Record<string, any>;
  notificationSettings: Record<string, any>;
  appearance: Record<string, any>;
  advanced: Record<string, any>;
  employees: any[];
}

export interface ResolvedVisibility {
  hideProfit: boolean;
  hidePayout: boolean;
  hideMarketValue: boolean;
}

const defaultSettings: StoreSettings = {
  general: {},
  globalVisibility: {
    showProfit: false,
    showPayoutPercent: true,
    showMarketValue: true,
    showProfitInFooter: false,
    showAverageRateInFooter: true,
  },
  intakeDefaults: {},
  payoutDefaults: {},
  rateDefaults: {},
  customerSettings: {},
  complianceSettings: {},
  printSettings: {},
  notificationSettings: {},
  appearance: {},
  advanced: {},
  employees: [],
};

export function useStoreSettings(storeId: string, employeeId?: string) {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const fetchSettings = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch store settings:', error);
      } else if (data) {
        setSettings({
          general: (data.general as Record<string, any>) || {},
          globalVisibility: {
            ...defaultSettings.globalVisibility,
            ...((data.global_visibility as Record<string, any>) || {}),
          },
          intakeDefaults: (data.intake_defaults as Record<string, any>) || {},
          payoutDefaults: (data.payout_defaults as Record<string, any>) || {},
          rateDefaults: (data.rate_defaults as Record<string, any>) || {},
          customerSettings: (data.customer_settings as Record<string, any>) || {},
          complianceSettings: (data.compliance_settings as Record<string, any>) || {},
          printSettings: (data.print_settings as Record<string, any>) || {},
          notificationSettings: (data.notification_settings as Record<string, any>) || {},
          appearance: (data.appearance as Record<string, any>) || {},
          advanced: (data.advanced as Record<string, any>) || {},
          employees: (data.employees as any[]) || [],
        });
      }
    } catch (err) {
      console.error('Error loading store settings:', err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings, version]);

  const refetch = useCallback(() => setVersion(v => v + 1), []);

  // Resolve visibility for a specific employee
  const resolveVisibility = useCallback((): ResolvedVisibility => {
    const gv = settings.globalVisibility;
    const base: ResolvedVisibility = {
      hideProfit: !gv.showProfit,
      hidePayout: !gv.showPayoutPercent,
      hideMarketValue: !gv.showMarketValue,
    };

    if (!employeeId) return base;

    // Check employee-level overrides
    const emp = settings.employees.find((e: any) => e.id === employeeId);
    if (emp?.visibility) {
      return {
        hideProfit: emp.visibility.hideProfit ?? base.hideProfit,
        hidePayout: emp.visibility.hidePercentagePaid ?? base.hidePayout,
        hideMarketValue: emp.visibility.hideMarketValue ?? base.hideMarketValue,
      };
    }

    return base;
  }, [settings, employeeId]);

  const saveSettings = useCallback(async (newSettings: StoreSettings) => {
    try {
      const { error } = await supabase
        .from('store_settings')
        .upsert({
          store_id: storeId,
          general: newSettings.general as any,
          global_visibility: newSettings.globalVisibility as any,
          intake_defaults: newSettings.intakeDefaults as any,
          payout_defaults: newSettings.payoutDefaults as any,
          rate_defaults: newSettings.rateDefaults as any,
          customer_settings: newSettings.customerSettings as any,
          compliance_settings: newSettings.complianceSettings as any,
          print_settings: newSettings.printSettings as any,
          notification_settings: newSettings.notificationSettings as any,
          appearance: newSettings.appearance as any,
          advanced: newSettings.advanced as any,
          employees: newSettings.employees as any,
        }, { onConflict: 'store_id' });

      if (error) throw error;
      setSettings(newSettings);
      return true;
    } catch (err) {
      console.error('Failed to save store settings:', err);
      return false;
    }
  }, [storeId]);

  return {
    settings,
    loading,
    visibility: resolveVisibility(),
    saveSettings,
    refetch,
  };
}
