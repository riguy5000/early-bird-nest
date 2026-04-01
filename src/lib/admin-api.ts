import { supabase } from '@/integrations/supabase/client';

export async function adminSettingsQuery(
  table: 'metal_api_keys' | 'kv_store_62d2b480',
  action: 'select' | 'insert' | 'upsert' | 'update' | 'delete',
  data?: Record<string, any>
) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await supabase.functions.invoke('admin-settings', {
    body: { action, table, data },
    ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
  });

  if (res.error) {
    throw new Error(res.error.message || 'Request failed');
  }
  return res.data;
}
