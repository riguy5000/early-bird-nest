import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CustomerForm } from './CustomerForm';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { toast } from 'sonner';
import { Search, Plus, User, Phone, Mail, MapPin, Calendar, Eye, Edit } from 'lucide-react';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone: string;
  dateOfBirth: string;
  address: string;
  placeId: string;
  addressDetails: any;
  city: string;
  state: string;
  zipCode: string;
  idType: string;
  idNumber: string;
  notes: string;
  createdAt: string;
  storeId: string;
  gender?: string;
  idScanUrl?: string;
  idScanBackUrl?: string;
}

interface CustomerModuleProps { user: any; }

export function CustomerModule({ user }: CustomerModuleProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => { filterCustomers(); }, [customers, searchTerm]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) return;
      const { data: ep } = await supabase.from('employee_profiles').select('store_id').eq('auth_user_id', session.session.user.id).eq('is_active', true).limit(1).maybeSingle();
      let storeId = ep?.store_id;
      if (!storeId) { const { data: store } = await supabase.from('stores').select('id').eq('owner_auth_user_id', session.session.user.id).limit(1).maybeSingle(); storeId = store?.id; }
      if (!storeId) return;
      const { data, error } = await supabase.from('customers').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
      if (error) throw error;
      const mapped: Customer[] = (data || []).map((c: any) => ({
        id: c.id, firstName: c.first_name || '', lastName: c.last_name || '', email: c.email || '', phone: c.phone || '',
        altPhone: '', dateOfBirth: c.date_of_birth || '', address: c.address || '', placeId: '', addressDetails: null, city: '', state: '', zipCode: '',
        idType: c.license_number ? 'Government ID' : '', idNumber: c.license_number || '', notes: c.notes || '', createdAt: c.created_at, storeId: c.store_id,
        gender: c.gender || '', idScanUrl: c.id_scan_url || '', idScanBackUrl: c.id_scan_back_url || '',
      }));
      setCustomers(mapped);
    } catch (error) { console.error('Error loading customers:', error); toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  const filterCustomers = () => {
    let filtered = customers;
    if (searchTerm) { filtered = filtered.filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || c.email?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone?.includes(searchTerm)); }
    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = (customerData: any) => {
    const newCustomer: Customer = { id: Date.now().toString(), ...customerData, createdAt: new Date().toISOString(), storeId: user?.storeId || 'store_1' };
    setCustomers(prev => [newCustomer, ...prev]);
    setShowAddCustomer(false);
    toast.success('Customer added successfully!');
  };

  const handleEditCustomer = (customerData: any) => {
    setCustomers(prev => prev.map(customer => customer.id === selectedCustomer?.id ? { ...customer, ...customerData } : customer));
    setShowEditCustomer(false);
    setSelectedCustomer(null);
    toast.success('Customer updated successfully!');
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[36px] font-semibold tracking-tight title-gradient">Customer CRM</h2>
          <p className="text-[15px] text-[#76707F]">{user?.store?.name || 'Your Store'}</p>
        </div>
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogTrigger asChild>
            <button className="btn-primary-dark flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Customer
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-white/90 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-[22px] font-semibold text-[#2B2833]">Add New Customer</DialogTitle>
              <DialogDescription className="text-[14px] text-[#76707F]">Add a new customer to your database.</DialogDescription>
            </DialogHeader>
            <CustomerForm onSave={handleAddCustomer} onCancel={() => setShowAddCustomer(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#A8A3AE]" />
          <input
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.04]">
          <h3 className="text-[18px] font-semibold text-[#2B2833]">Customers ({filteredCustomers.length})</h3>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B5EF9] mx-auto" />
            <p className="mt-2 text-[#76707F] text-[14px]">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8">
            <User className="w-12 h-12 text-[#A8A3AE] mx-auto mb-4" />
            <p className="text-[#76707F] text-[14px]">{customers.length === 0 ? 'No customers yet.' : 'No customers match your search.'}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="table-header-gradient">
              <tr>
                {['NAME', 'CONTACT', 'LOCATION', 'ID INFO', 'ADDED', 'ACTIONS'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-[#FAFAF9] transition-colors cursor-pointer"
                  onClick={() => { setSelectedCustomer(customer); setShowDetailDrawer(true); }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6B5EF9]/10 flex items-center justify-center text-[12px] font-semibold text-[#6B5EF9]">
                        {customer.firstName?.[0]}{customer.lastName?.[0]}
                      </div>
                      <span className="text-[14px] font-medium text-[#2B2833]">{customer.firstName} {customer.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      {customer.email && <div className="text-[13px] text-[#76707F]">{customer.email}</div>}
                      {customer.phone && <div className="text-[13px] text-[#76707F]">{customer.phone}</div>}
                      {!customer.email && !customer.phone && <span className="text-[13px] text-[#A8A3AE]">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[13px] text-[#76707F]">
                      <MapPin className="w-3 h-3" />
                      {customer.city && customer.state ? `${customer.city}, ${customer.state}` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[13px]">
                      <div className="text-[#76707F]">{customer.idType || 'Government ID'}</div>
                      <div className="text-[#A8A3AE]">{customer.idNumber || '—'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[13px] text-[#76707F]">
                      <Calendar className="w-3 h-3" />
                      {formatDate(customer.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedCustomer(customer); setShowDetailDrawer(true); }} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#F8F7FB] transition-colors">
                        <Eye className="w-4 h-4 text-[#76707F]" />
                      </button>
                      <button onClick={() => { setSelectedCustomer(customer); setShowEditCustomer(true); }} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#F8F7FB] transition-colors">
                        <Edit className="w-4 h-4 text-[#76707F]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-white/90 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-[#2B2833]">Edit Customer</DialogTitle>
            <DialogDescription className="text-[14px] text-[#76707F]">Update customer information.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm customer={selectedCustomer} isEditing={true} onSave={handleEditCustomer} onCancel={() => { setShowEditCustomer(false); setSelectedCustomer(null); }} />
          )}
        </DialogContent>
      </Dialog>

      <CustomerDetailDrawer
        customer={selectedCustomer}
        open={showDetailDrawer}
        onClose={() => { setShowDetailDrawer(false); setSelectedCustomer(null); }}
        onEdit={(c: any) => { setShowDetailDrawer(false); setSelectedCustomer(c as Customer); setShowEditCustomer(true); }}
      />
    </div>
  );
}
