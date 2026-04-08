import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings, Save, Shield, Mail, CreditCard, Flag, Headphones, Scale, Building } from 'lucide-react';
import { MetalApiKeysSettings } from './MetalApiKeysSettings';
import { OpenAIKeySettings } from './OpenAIKeySettings';

async function rootAdminApi(action: string, data: any = {}) {
  const { data: result, error } = await supabase.functions.invoke('root-admin', {
    body: { action, ...data },
  });
  if (error) throw new Error(error.message || 'API error');
  if (result?.error) throw new Error(result.error);
  return result;
}

const defaultSettings = {
  general: {
    platformName: 'Jewelry & Pawn SaaS',
    supportEmail: '',
    defaultTimezone: 'America/New_York',
    defaultCurrency: 'USD',
  },
  registration: {
    allowPublicRegistration: true,
    requireApproval: false,
    defaultNewStoreStatus: 'active',
    requireEmailVerification: false,
    inviteExpirationDays: 7,
  },
  defaultStoreTemplate: {
    defaultVisibility: {},
    defaultIntakeSettings: {},
    defaultPayoutDefaults: {},
    defaultPrintingDefaults: {},
    defaultComplianceDefaults: {},
  },
  auth: {
    minPasswordLength: 8,
    requireUppercase: true,
    requireNumber: true,
    sessionTimeoutMinutes: 480,
    inviteLinkExpirationHours: 72,
  },
  featureFlags: {
    enableAiOcr: true,
    enableQrRemoteCapture: true,
    enableBatchPhotos: true,
    enableSaveForLater: true,
    enableImpersonation: true,
    enablePublicRegistration: true,
    enableManualStoreCreation: true,
    enableExportFeatures: true,
  },
  billing: {
    trialDurationDays: 14,
    gracePeriodDays: 7,
  },
};

export function RootAdminPlatformSettings() {
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const result = await rootAdminApi('get-platform-settings');
      if (result?.settings) {
        setSettings((prev: any) => deepMerge(prev, result.settings));
      }
    } catch (e: any) {
      // Settings may not exist yet, use defaults
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await rootAdminApi('save-platform-settings', { settings });
      toast.success('Platform settings saved');
    } catch (e: any) {
      toast.error('Failed to save: ' + e.message);
    }
    setSaving(false);
  };

  const update = (section: string, key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Settings</h2>
          <p className="text-muted-foreground">Global SaaS configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="general"><Settings className="h-3 w-3 mr-1" />General</TabsTrigger>
          <TabsTrigger value="registration"><Building className="h-3 w-3 mr-1" />Registration</TabsTrigger>
          <TabsTrigger value="template"><Building className="h-3 w-3 mr-1" />Store Template</TabsTrigger>
          <TabsTrigger value="auth"><Shield className="h-3 w-3 mr-1" />Auth & Security</TabsTrigger>
          <TabsTrigger value="features"><Flag className="h-3 w-3 mr-1" />Feature Flags</TabsTrigger>
          <TabsTrigger value="billing"><CreditCard className="h-3 w-3 mr-1" />Billing</TabsTrigger>
          <TabsTrigger value="integrations"><Settings className="h-3 w-3 mr-1" />Integrations</TabsTrigger>
          <TabsTrigger value="legal"><Scale className="h-3 w-3 mr-1" />Legal</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Platform identity and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input value={settings.general.platformName} onChange={e => update('general', 'platformName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input value={settings.general.supportEmail} onChange={e => update('general', 'supportEmail', e.target.value)} placeholder="support@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Default Timezone</Label>
                  <Select value={settings.general.defaultTimezone} onValueChange={v => update('general', 'defaultTimezone', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern (New York)</SelectItem>
                      <SelectItem value="America/Chicago">Central (Chicago)</SelectItem>
                      <SelectItem value="America/Denver">Mountain (Denver)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific (LA)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={settings.general.defaultCurrency} onValueChange={v => update('general', 'defaultCurrency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration */}
        <TabsContent value="registration">
          <Card>
            <CardHeader>
              <CardTitle>Store Registration</CardTitle>
              <CardDescription>Control how new stores join the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingSwitch label="Allow Public Store Registration" description="Let anyone register a new store" checked={settings.registration.allowPublicRegistration} onChange={v => update('registration', 'allowPublicRegistration', v)} />
              <SettingSwitch label="Require Approval Before Activation" description="New stores need admin approval" checked={settings.registration.requireApproval} onChange={v => update('registration', 'requireApproval', v)} />
              <SettingSwitch label="Require Email Verification" description="Owners must verify email before access" checked={settings.registration.requireEmailVerification} onChange={v => update('registration', 'requireEmailVerification', v)} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default New Store Status</Label>
                  <Select value={settings.registration.defaultNewStoreStatus} onValueChange={v => update('registration', 'defaultNewStoreStatus', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending Approval</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Invite Expiration (days)</Label>
                  <Input type="number" value={settings.registration.inviteExpirationDays} onChange={e => update('registration', 'inviteExpirationDays', parseInt(e.target.value) || 7)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Default Store Template */}
        <TabsContent value="template">
          <Card>
            <CardHeader>
              <CardTitle>Default Store Settings Template</CardTitle>
              <CardDescription>Settings applied automatically to newly created stores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Building className="h-8 w-8 mx-auto mb-2" />
                <p>Default store template configuration</p>
                <p className="text-xs mt-1">This will be applied when creating new stores. Configure visibility rules, intake defaults, payout defaults, printing, and compliance defaults.</p>
                <p className="text-xs mt-3 text-muted-foreground">Full template editor will be wired in a future phase when all store settings fields are finalized.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Auth & Security */}
        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication & Security</CardTitle>
              <CardDescription>Password rules, sessions, and access policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Minimum Password Length</Label>
                  <Input type="number" value={settings.auth.minPasswordLength} onChange={e => update('auth', 'minPasswordLength', parseInt(e.target.value) || 8)} />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input type="number" value={settings.auth.sessionTimeoutMinutes} onChange={e => update('auth', 'sessionTimeoutMinutes', parseInt(e.target.value) || 480)} />
                </div>
                <div className="space-y-2">
                  <Label>Invite Link Expiration (hours)</Label>
                  <Input type="number" value={settings.auth.inviteLinkExpirationHours} onChange={e => update('auth', 'inviteLinkExpirationHours', parseInt(e.target.value) || 72)} />
                </div>
              </div>
              <SettingSwitch label="Require Uppercase Letter" description="Passwords must include at least one uppercase letter" checked={settings.auth.requireUppercase} onChange={v => update('auth', 'requireUppercase', v)} />
              <SettingSwitch label="Require Number" description="Passwords must include at least one digit" checked={settings.auth.requireNumber} onChange={v => update('auth', 'requireNumber', v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Flags */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>Enable or disable platform features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingSwitch label="AI OCR (ID Scanning)" description="Enable AI-based document scanning" checked={settings.featureFlags.enableAiOcr} onChange={v => update('featureFlags', 'enableAiOcr', v)} />
              <SettingSwitch label="QR Remote Capture" description="Allow scanning IDs from another device via QR code" checked={settings.featureFlags.enableQrRemoteCapture} onChange={v => update('featureFlags', 'enableQrRemoteCapture', v)} />
              <SettingSwitch label="Batch Photos" description="Allow batch photo uploads" checked={settings.featureFlags.enableBatchPhotos} onChange={v => update('featureFlags', 'enableBatchPhotos', v)} />
              <SettingSwitch label="Save for Later" description="Allow saving take-in drafts" checked={settings.featureFlags.enableSaveForLater} onChange={v => update('featureFlags', 'enableSaveForLater', v)} />
              <SettingSwitch label="Store Impersonation" description="Allow platform admins to impersonate stores" checked={settings.featureFlags.enableImpersonation} onChange={v => update('featureFlags', 'enableImpersonation', v)} />
              <SettingSwitch label="Public Registration" description="Allow public store sign-up" checked={settings.featureFlags.enablePublicRegistration} onChange={v => update('featureFlags', 'enablePublicRegistration', v)} />
              <SettingSwitch label="Manual Store Creation" description="Allow root admins to create stores manually" checked={settings.featureFlags.enableManualStoreCreation} onChange={v => update('featureFlags', 'enableManualStoreCreation', v)} />
              <SettingSwitch label="Export Features" description="Allow CSV/PDF exports" checked={settings.featureFlags.enableExportFeatures} onChange={v => update('featureFlags', 'enableExportFeatures', v)} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>Plan defaults and trial configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trial Duration (days)</Label>
                  <Input type="number" value={settings.billing.trialDurationDays} onChange={e => update('billing', 'trialDurationDays', parseInt(e.target.value) || 14)} />
                </div>
                <div className="space-y-2">
                  <Label>Grace Period (days)</Label>
                  <Input type="number" value={settings.billing.gracePeriodDays} onChange={e => update('billing', 'gracePeriodDays', parseInt(e.target.value) || 7)} />
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
                Full billing/plan management will be available when payment integration is set up.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <OpenAIKeySettings />
            <Separator />
            <MetalApiKeysSettings />
          </div>
        </TabsContent>

        {/* Legal */}
        <TabsContent value="legal">
          <Card>
            <CardHeader>
              <CardTitle>Legal & Compliance</CardTitle>
              <CardDescription>Global legal templates and notices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center text-muted-foreground text-sm">
                Legal template editor (disclaimers, receipt footers, privacy notices, terms links) will be available in a future phase.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingSwitch({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}
