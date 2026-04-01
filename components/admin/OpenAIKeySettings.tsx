import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { adminSettingsQuery } from '@/lib/admin-api';
import { Key, Eye, EyeOff, Save, Trash2, CheckCircle, AlertCircle, Brain } from 'lucide-react';

const KV_KEY = 'openai_api_key';

export function OpenAIKeySettings() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadKey();
  }, []);

  const loadKey = async () => {
    setLoading(true);
    try {
      const res = await adminSettingsQuery('kv_store_62d2b480', 'select', {
        eq: { key: KV_KEY },
        single: true,
      });
      if (res?.data?.value) {
        const key = typeof res.data.value === 'string' ? res.data.value : (res.data as any)?.value?.key || '';
        setSavedKey(key);
        setApiKey(key);
      }
    } catch (err) {
      console.error('Failed to load key', err);
    }
    setLoading(false);
  };

  const maskKey = (key: string) => {
    if (key.length < 12) return '••••••••';
    return key.slice(0, 7) + '••••••••' + key.slice(-4);
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('API key is required');
      return;
    }
    if (!apiKey.startsWith('sk-')) {
      toast.error('OpenAI API keys should start with "sk-"');
      return;
    }

    setSaving(true);
    try {
      await adminSettingsQuery('kv_store_62d2b480', 'upsert', {
        row: { key: KV_KEY, value: { key: apiKey.trim() } }
      });
      setSavedKey(apiKey.trim());
      toast.success('OpenAI API key saved');
    } catch (err) {
      toast.error('Failed to save API key');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('kv_store_62d2b480')
      .delete()
      .eq('key', KV_KEY);

    if (error) {
      toast.error('Failed to delete API key');
    } else {
      setApiKey('');
      setSavedKey('');
      toast.success('OpenAI API key removed');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5" />
          OpenAI API Key
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure your OpenAI API key for AI-powered features like item capture and identification.
        </p>
      </div>

      {/* Status */}
      {savedKey ? (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <span>OpenAI API key is configured and active.</span>
            <Badge variant="outline" className="text-xs text-green-700 border-green-300">Connected</Badge>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No OpenAI API key configured. AI features will use the default gateway. Add your own key for dedicated usage.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Input */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="openai-key">API Key</Label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="openai-key"
                  placeholder="sk-proj-..."
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Get your API key from{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                platform.openai.com/api-keys
              </a>
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            {savedKey && (
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                Remove
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving || !apiKey.trim()}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Key'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
