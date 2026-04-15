import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { CustomerForm } from './CustomerForm';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { toast } from 'sonner';
import { Search, Plus, User, Calendar } from 'lucide-react';

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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Avatar initials from name
  const getInitials = (c: Customer) =>
    `${c.firstName?.[0] ?? ''}${c.lastName?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight title-gradient leading-tight">
            Customer CRM
          </h1>
          <p className="text-[15px] text-[#76707F] mt-0.5">{user?.store?.name || 'Your Store'}</p>
        </div>
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogTrigger asChild>
            <button className="btn-primary-dark flex items-center gap-2 mt-1">
              <Plus className="w-4 h-4" />
              Add Customer
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

      {/* ── Search — standalone full-width input, no card wrapper ── */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A3AE] pointer-events-none" />
        <input
          placeholder="Search customers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-glass pl-11 w-full"
        />
      </div>

      {/* ── Count label — above table, outside card ── */}
      <p className="text-[14px] text-[#76707F]">
        Customers{' '}
        <span className="text-[#2B2833] font-medium">({filteredCustomers.length})</span>
      </p>

      {/* ── Table card — thead starts immediately, no internal header ── */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#6B5EF9] border-t-transparent" />
            <p className="text-[14px] text-[#76707F]">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-[14px] icon-container flex items-center justify-center">
              <User className="w-7 h-7 text-[#6B5EF9]" strokeWidth={2} />
            </div>
            <p className="text-[14px] text-[#A8A3AE]">
              {customers.length === 0 ? 'No customers yet.' : 'No customers match your search.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            {/* thead — gradient, border-bottom */}
            <thead className="table-header-gradient border-b border-black/[0.04]">
              <tr>
                {['NAME', 'CONTACT', 'LOCATION', 'ID INFO', 'ADDED', 'ACTIONS'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">
                    {h}
                  </th>
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
                  {/* NAME — avatar tile + name */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar: lavender→blue gradient tile, initials in purple */}
                      <div className="w-9 h-9 rounded-full icon-container flex-shrink-0 text-[13px] font-semibold text-[#6B5EF9]">
                        {getInitials(customer)}
                      </div>
                      <span className="text-[14px] font-medium text-[#2B2833]">
                        {customer.firstName} {customer.lastName}
                      </span>
                    </div>
                  </td>

                  {/* CONTACT — email + phone stacked */}
                  <td className="px-6 py-4">
                    <div className="space-y-0.5">
                      {customer.email && (
                        <div className="text-[13px] text-[#76707F]">{customer.email}</div>
                      )}
                      {customer.phone && (
                        <div className="text-[13px] text-[#76707F]">{customer.phone}</div>
                      )}
                      {!customer.email && !customer.phone && (
                        <span className="text-[13px] text-[#A8A3AE]">—</span>
                      )}
                    </div>
                  </td>

                  {/* LOCATION — bullet dot + text, no icon */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[13px] text-[#76707F]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A8A3AE] flex-shrink-0" />
                      {customer.city && customer.state
                        ? `${customer.city}, ${customer.state}`
                        : 'N/A'}
                    </div>
                  </td>

                  {/* ID INFO — type + number stacked */}
                  <td className="px-6 py-4">
                    <div className="text-[13px] text-[#76707F]">
                      {customer.idType || 'Government ID'}
                    </div>
                    <div className="text-[13px] text-[#A8A3AE]">
                      {customer.idNumber || '—'}
                    </div>
                  </td>

                  {/* ADDED — calendar icon + date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[13px] text-[#76707F]">
                      <Calendar className="w-3.5 h-3.5 text-[#A8A3AE] flex-shrink-0" />
                      {formatDate(customer.createdAt)}
                    </div>
                  </td>

                  {/* ACTIONS — empty column, row click handles navigation */}
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()} />
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Edit dialog ── */}
      <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-white/90 backdrop-blur-xl rounded-[20px] border border-white/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[22px] font-semibold text-[#2B2833]">Edit Customer</DialogTitle>
            <DialogDescription className="text-[14px] text-[#76707F]">Update customer information.</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <CustomerForm
              customer={selectedCustomer}
              isEditing={true}
              onSave={handleEditCustomer}
              onCancel={() => { setShowEditCustomer(false); setSelectedCustomer(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Detail drawer ── */}
      <CustomerDetailDrawer
        customer={selectedCustomer}
        open={showDetailDrawer}
        onClose={() => { setShowDetailDrawer(false); setSelectedCustomer(null); }}
        onEdit={(c: any) => {
          setShowDetailDrawer(false);
          setSelectedCustomer(c as Customer);
          setShowEditCustomer(true);
        }}
      />
    </div>
  );
}
