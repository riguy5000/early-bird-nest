import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Users, Search, MoreHorizontal, Shield, Building, UserCheck, UserX,
  ChevronLeft, ChevronRight, Eye, Mail, KeyRound, Trash2, ArrowUpDown
} from 'lucide-react';

async function rootAdminApi(action: string, data: any = {}) {
  const { data: result, error } = await supabase.functions.invoke('root-admin', {
    body: { action, ...data },
  });
  if (error) throw new Error(error.message || 'API error');
  if (result?.error) throw new Error(result.error);
  return result;
}

export function RootAdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState('all');
  const pageSize = 20;

  // Summary
  const [summary, setSummary] = useState<any>(null);

  // Detail drawer
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Action confirm
  const [actionDialog, setActionDialog] = useState<any>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await rootAdminApi('list-users', {
        search: search || undefined,
        userType: tab !== 'all' ? tab : (typeFilter !== 'all' ? typeFilter : undefined),
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        pageSize,
      });
      setUsers(result.users || []);
      setTotal(result.total || 0);
      setSummary(result.summary || null);
    } catch (e: any) {
      toast.error('Failed to load users: ' + e.message);
    }
    setLoading(false);
  }, [search, typeFilter, statusFilter, tab, page]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAction = async (action: string, userId: string, extra: any = {}) => {
    try {
      await rootAdminApi('user-action', { userAction: action, targetUserId: userId, ...extra });
      toast.success(`Action "${action}" completed successfully`);
      setActionDialog(null);
      loadUsers();
    } catch (e: any) {
      toast.error('Action failed: ' + e.message);
    }
  };

  const openDetail = (user: any) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  const roleBadge = (type: string) => {
    const m: Record<string, string> = {
      platform_admin: 'bg-yellow-100 text-yellow-800',
      store_admin: 'bg-blue-100 text-blue-800',
      employee: 'bg-muted text-muted-foreground',
    };
    return <Badge className={m[type] || 'bg-muted text-muted-foreground'}>{type.replace('_', ' ')}</Badge>;
  };

  const statusBadge = (active: boolean, inviteStatus?: string) => {
    if (inviteStatus === 'pending') return <Badge className="bg-orange-100 text-orange-800">Pending Invite</Badge>;
    return active
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Platform Users</h2>
        <p className="text-muted-foreground">Manage all users across the platform</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <SummaryCard label="Total Users" value={summary.total} />
          <SummaryCard label="Active" value={summary.active} />
          <SummaryCard label="Inactive" value={summary.inactive} />
          <SummaryCard label="Pending Invites" value={summary.pendingInvites} />
          <SummaryCard label="Platform Admins" value={summary.platformAdmins} />
          <SummaryCard label="Store Admins" value={summary.storeAdmins} />
          <SummaryCard label="Employees" value={summary.employees} />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="platform_admin">Platform Admins</TabsTrigger>
          <TabsTrigger value="store_admin">Store Admins</TabsTrigger>
          <TabsTrigger value="employee">Employees</TabsTrigger>
          <TabsTrigger value="pending">Pending Invites</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Store</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Login</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  </td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No users found.</td></tr>
                ) : users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{u.name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">{roleBadge(u.userType)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.role}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.storeName || '—'}</td>
                    <td className="px-4 py-3">{statusBadge(u.isActive, u.inviteStatus)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(u)}>
                            <Eye className="h-4 w-4 mr-2" />View Profile
                          </DropdownMenuItem>
                          {u.isActive ? (
                            <DropdownMenuItem onClick={() => setActionDialog({ action: 'deactivate', user: u })}>
                              <UserX className="h-4 w-4 mr-2" />Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setActionDialog({ action: 'reactivate', user: u })}>
                              <UserCheck className="h-4 w-4 mr-2" />Reactivate
                            </DropdownMenuItem>
                          )}
                          {u.inviteStatus === 'pending' && (
                            <DropdownMenuItem onClick={() => handleAction('resend-invite', u.id)}>
                              <Mail className="h-4 w-4 mr-2" />Resend Invite
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setActionDialog({ action: 'delete', user: u })}
                            className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} users)</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[500px] sm:w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>User Profile</SheetTitle>
            <SheetDescription>Detailed user information</SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="space-y-6 mt-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedUser.name || selectedUser.email}</h3>
                <div className="flex items-center gap-2">
                  {roleBadge(selectedUser.userType)}
                  {statusBadge(selectedUser.isActive, selectedUser.inviteStatus)}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-muted-foreground text-xs">Email</p><p className="font-medium">{selectedUser.email}</p></div>
                <div><p className="text-muted-foreground text-xs">Role</p><p className="font-medium">{selectedUser.role}</p></div>
                <div><p className="text-muted-foreground text-xs">Store</p><p className="font-medium">{selectedUser.storeName || '—'}</p></div>
                <div><p className="text-muted-foreground text-xs">Invite Status</p><p className="font-medium">{selectedUser.inviteStatus || '—'}</p></div>
                <div><p className="text-muted-foreground text-xs">Last Login</p><p className="font-medium">{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}</p></div>
                <div><p className="text-muted-foreground text-xs">Created</p><p className="font-medium">{new Date(selectedUser.createdAt).toLocaleString()}</p></div>
              </div>
              {selectedUser.permissions && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Permissions</h4>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(selectedUser.permissions).map(([key, val]) => (
                        <Badge key={key} variant={val ? 'default' : 'secondary'} className="text-xs">
                          {key.replace(/^can_/, '').replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              {selectedUser.visibility && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Visibility Overrides</h4>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(selectedUser.visibility).map(([key, val]) => (
                        <Badge key={key} variant={val ? 'destructive' : 'outline'} className="text-xs">
                          {key.replace(/^hide_/, '').replace(/_/g, ' ')}: {val ? 'Hidden' : 'Visible'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Action Confirmation */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {actionDialog?.action === 'delete' && (
                <>Are you sure you want to <strong>delete</strong> user <strong>{actionDialog?.user?.email}</strong>? This cannot be undone.</>
              )}
              {actionDialog?.action === 'deactivate' && (
                <>Are you sure you want to <strong>deactivate</strong> user <strong>{actionDialog?.user?.email}</strong>?</>
              )}
              {actionDialog?.action === 'reactivate' && (
                <>Are you sure you want to <strong>reactivate</strong> user <strong>{actionDialog?.user?.email}</strong>?</>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              variant={actionDialog?.action === 'delete' ? 'destructive' : 'default'}
              onClick={() => handleAction(actionDialog.action, actionDialog.user.id, { userType: actionDialog.user.userType })}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value ?? 0}</p>
      </CardContent>
    </Card>
  );
}
