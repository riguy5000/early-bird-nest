import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Server, Database, Shield, HardDrive, Activity, AlertTriangle,
  CheckCircle, XCircle, RefreshCw, Wifi, Cloud, Lock, Clock
} from 'lucide-react';

async function rootAdminApi(action: string, data: any = {}) {
  const { data: result, error } = await supabase.functions.invoke('root-admin', {
    body: { action, ...data },
  });
  if (error) throw new Error(error.message || 'API error');
  if (result?.error) throw new Error(result.error);
  return result;
}

export function RootAdminSystem() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const result = await rootAdminApi('get-system-health');
      setHealth(result);
    } catch (e: any) {
      toast.error('Failed to load system health: ' + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { loadHealth(); }, []);

  const statusIcon = (status: string) => {
    if (status === 'healthy' || status === 'active') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (status === 'degraded' || status === 'warning') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const statusColor = (status: string) => {
    if (status === 'healthy' || status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'degraded' || status === 'warning') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
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
          <h2 className="text-2xl font-bold">System Health & Operations</h2>
          <p className="text-muted-foreground">Platform infrastructure monitoring</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadHealth}>
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(health?.services || []).map((svc: any) => (
          <Card key={svc.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {svc.icon === 'database' && <Database className="h-4 w-4 text-muted-foreground" />}
                  {svc.icon === 'server' && <Server className="h-4 w-4 text-muted-foreground" />}
                  {svc.icon === 'shield' && <Shield className="h-4 w-4 text-muted-foreground" />}
                  {svc.icon === 'cloud' && <Cloud className="h-4 w-4 text-muted-foreground" />}
                  {svc.icon === 'drive' && <HardDrive className="h-4 w-4 text-muted-foreground" />}
                  {!svc.icon && <Activity className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium">{svc.name}</span>
                </div>
                {statusIcon(svc.status)}
              </div>
              <Badge className={statusColor(svc.status)}>{svc.status}</Badge>
              {svc.detail && <p className="text-xs text-muted-foreground mt-2">{svc.detail}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle>Integrations & APIs</CardTitle>
          <CardDescription>External service connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(health?.integrations || []).length === 0 ? (
              <p className="text-muted-foreground text-sm">No integrations configured yet.</p>
            ) : (
              health.integrations.map((int: any) => (
                <div key={int.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{int.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {int.lastPing ? `Last ping: ${new Date(int.lastPing).toLocaleString()}` : 'No data'}
                        {int.keysConfigured !== undefined && ` · ${int.keysConfigured} key(s) configured`}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusColor(int.status)}>{int.status}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Storage Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>File storage across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(health?.storage || []).map((bucket: any) => (
              <div key={bucket.name} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{bucket.name}</span>
                </div>
                <p className="text-lg font-bold">{bucket.objectCount ?? 0}</p>
                <p className="text-xs text-muted-foreground">objects</p>
              </div>
            ))}
            {(!health?.storage || health.storage.length === 0) && (
              <p className="text-muted-foreground text-sm col-span-4">No storage data available.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Security Monitor</CardTitle>
          <CardDescription>Authentication and access events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Auth Users</p>
              <p className="text-xl font-bold">{health?.security?.totalAuthUsers ?? 0}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Platform Admins</p>
              <p className="text-xl font-bold">{health?.security?.platformAdmins ?? 0}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Active Employees</p>
              <p className="text-xl font-bold">{health?.security?.activeEmployees ?? 0}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Pending Invites</p>
              <p className="text-xl font-bold">{health?.security?.pendingInvites ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Controls</CardTitle>
          <CardDescription>Platform-wide operational controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Block all store access temporarily</p>
              </div>
              <Badge variant="outline">Not yet available</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Disable Registration</p>
                <p className="text-xs text-muted-foreground">Prevent new store signups</p>
              </div>
              <Badge variant="outline">Not yet available</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Emergency Banner</p>
                <p className="text-xs text-muted-foreground">Show system-wide alert banner</p>
              </div>
              <Badge variant="outline">Not yet available</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>System events and issues</CardDescription>
        </CardHeader>
        <CardContent>
          {(health?.recentIncidents || []).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>No recent incidents. All systems nominal.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {health.recentIncidents.map((inc: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {statusIcon(inc.severity)}
                    <div>
                      <p className="text-sm font-medium">{inc.message}</p>
                      <p className="text-xs text-muted-foreground">{inc.source} · {new Date(inc.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <Badge className={statusColor(inc.severity)}>{inc.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
