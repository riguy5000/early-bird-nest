import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminSettingsQuery } from '@/lib/admin-api';
import { 
  Plus, 
  Trash2, 
  Key, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface ApiKey {
  id: string;
  label: string;
  api_key: string;
  provider: string;
  is_active: boolean;
  monthly_limit: number;
  requests_used: number;
  last_reset_at: string;
  last_used_at: string | null;
  created_at: string;
  sort_order: number;
}

interface MetalPrice {
  metal: string;
  symbol: string;
  price_usd: number;
  change_percent: number;
  fetched_at: string;
}

export function MetalApiKeysSettings() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [prices, setPrices] = useState<MetalPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState({ label: '', api_key: '', monthly_limit: 100 });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [keysRes, pricesRes] = await Promise.all([
        adminSettingsQuery('metal_api_keys', 'select', { order: 'sort_order' }),
        supabase.from('metal_prices').select('*').order('metal'),
      ]);
      if (keysRes?.data) setApiKeys(keysRes.data as ApiKey[]);
      if (pricesRes.data) setPrices(pricesRes.data as MetalPrice[]);
    } catch (err) {
      console.error('Failed to load data', err);
    }
    setLoading(false);
  };

  const handleAddKey = async () => {
    if (!newKey.api_key.trim()) {
      toast.error('API key is required');
      return;
    }
    try {
      await adminSettingsQuery('metal_api_keys', 'insert', {
        row: {
          label: newKey.label || `Key ${apiKeys.length + 1}`,
          api_key: newKey.api_key.trim(),
          monthly_limit: newKey.monthly_limit,
          sort_order: apiKeys.length,
        }
      toast.success('API key added');
      setNewKey({ label: '', api_key: '', monthly_limit: 100 });
      setShowAddForm(false);
      loadData();
    } catch (err) {
      toast.error('Failed to add API key');
    }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await adminSettingsQuery('metal_api_keys', 'delete', { eq: { id } });
      toast.success('API key deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete key');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('metal_api_keys').update({ is_active: isActive }).eq('id', id);
    loadData();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const idx = apiKeys.findIndex(k => k.id === id);
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === apiKeys.length - 1)) return;
    
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    await Promise.all([
      supabase.from('metal_api_keys').update({ sort_order: swapIdx }).eq('id', apiKeys[idx].id),
      supabase.from('metal_api_keys').update({ sort_order: idx }).eq('id', apiKeys[swapIdx].id),
    ]);
    loadData();
  };

  const handleFetchNow = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-metal-prices');
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        toast.success(`Fetched ${data?.requests_made || 0} metal prices`);
      }
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch prices');
    } finally {
      setFetching(false);
    }
  };

  const maskKey = (key: string) => key.slice(0, 8) + '••••••••' + key.slice(-4);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Metal Price API Keys</h3>
          <p className="text-sm text-muted-foreground">
            Manage goldapi.io API keys for live metal pricing. Keys rotate automatically when one hits its limit.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleFetchNow} disabled={fetching || apiKeys.length === 0}>
            <RefreshCw className={`h-4 w-4 mr-2 ${fetching ? 'animate-spin' : ''}`} />
            Fetch Now
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Key
          </Button>
        </div>
      </div>

      {/* Add Key Form */}
      {showAddForm && (
        <Card className="border-dashed">
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Label</Label>
                <Input
                  placeholder="e.g. Primary Key"
                  value={newKey.label}
                  onChange={(e) => setNewKey(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              <div>
                <Label>API Key *</Label>
                <Input
                  placeholder="goldapi-xxxxxxxx"
                  value={newKey.api_key}
                  onChange={(e) => setNewKey(prev => ({ ...prev, api_key: e.target.value }))}
                  type="password"
                />
              </div>
              <div>
                <Label>Monthly Limit</Label>
                <Input
                  type="number"
                  value={newKey.monthly_limit}
                  onChange={(e) => setNewKey(prev => ({ ...prev, monthly_limit: parseInt(e.target.value) || 100 }))}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddKey}>Save Key</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No API keys configured. Add a goldapi.io key to enable live metal pricing.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key, idx) => (
            <Card key={key.id} className={!key.is_active ? 'opacity-60' : ''}>
              <CardContent className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Key className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{key.label}</span>
                      {key.is_active ? (
                        <Badge variant="outline" className="text-xs">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-muted-foreground">
                        {showKey[key.id] ? key.api_key : maskKey(key.api_key)}
                      </code>
                      <button onClick={() => setShowKey(prev => ({ ...prev, [key.id]: !prev[key.id] }))}>
                        {showKey[key.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Usage */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-medium">
                    {key.requests_used} / {key.monthly_limit}
                  </div>
                  <div className="text-xs text-muted-foreground">requests this month</div>
                  <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((key.requests_used / key.monthly_limit) * 100, 100)}%`,
                        backgroundColor: key.requests_used >= key.monthly_limit
                          ? 'hsl(var(--destructive))'
                          : key.requests_used > key.monthly_limit * 0.8
                          ? 'hsl(45 93% 47%)'
                          : 'hsl(var(--primary))',
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <div className="flex flex-col">
                    <button
                      className="p-1 hover:bg-muted rounded disabled:opacity-30"
                      onClick={() => handleReorder(key.id, 'up')}
                      disabled={idx === 0}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      className="p-1 hover:bg-muted rounded disabled:opacity-30"
                      onClick={() => handleReorder(key.id, 'down')}
                      disabled={idx === apiKeys.length - 1}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <Switch
                    checked={key.is_active}
                    onCheckedChange={(checked) => handleToggleActive(key.id, checked)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteKey(key.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Cached Prices */}
      {prices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cached Metal Prices</CardTitle>
            <CardDescription>Last fetched prices stored in the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {prices.map((p) => (
                <div key={p.metal} className="p-3 bg-muted/50 rounded-lg">
                  <div className="text-sm font-medium">{p.metal}</div>
                  <div className="text-lg font-bold">${Number(p.price_usd).toFixed(2)}</div>
                  <div className={`text-xs ${Number(p.change_percent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(p.change_percent) >= 0 ? '+' : ''}{Number(p.change_percent).toFixed(2)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(p.fetched_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
