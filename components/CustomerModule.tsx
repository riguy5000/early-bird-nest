import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { CustomerForm } from './CustomerForm';
import { CustomerDetailDrawer } from './CustomerDetailDrawer';
import { toast } from 'sonner';
import { 
  Search, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign,
  Package,
  Eye,
  Edit,
  History
} from 'lucide-react';

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
}

interface CustomerTransaction {
  id: string;
  date: string;
  type: string;
  amount: string;
  items: number;
  status: string;
}

interface CustomerModuleProps {
  user: any;
}

export function CustomerModule({ user }: CustomerModuleProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showEditCustomer, setShowEditCustomer] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) return;

      // Get store ID
      const { data: ep } = await supabase
        .from('employee_profiles')
        .select('store_id')
        .eq('auth_user_id', session.session.user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      let storeId = ep?.store_id;
      if (!storeId) {
        const { data: store } = await supabase
          .from('stores')
          .select('id')
          .eq('owner_auth_user_id', session.session.user.id)
          .limit(1)
          .maybeSingle();
        storeId = store?.id;
      }
      if (!storeId) return;

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Customer[] = (data || []).map((c: any) => ({
        id: c.id,
        firstName: c.first_name || '',
        lastName: c.last_name || '',
        email: c.email || '',
        phone: c.phone || '',
        altPhone: '',
        dateOfBirth: c.date_of_birth || '',
        address: c.address || '',
        placeId: '',
        addressDetails: null,
        city: '',
        state: '',
        zipCode: '',
        idType: c.license_number ? 'Government ID' : '',
        idNumber: c.license_number || '',
        notes: c.notes || '',
        createdAt: c.created_at,
        storeId: c.store_id,
        gender: c.gender || '',
        idScanUrl: c.id_scan_url || '',
        idScanBackUrl: c.id_scan_back_url || '',
      }));

      setCustomers(mapped);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer => 
        `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleAddCustomer = (customerData: any) => {
    const newCustomer: Customer = {
      id: Date.now().toString(),
      ...customerData,
      createdAt: new Date().toISOString(),
      storeId: user?.storeId || 'store_1'
    };

    setCustomers(prev => [newCustomer, ...prev]);
    setShowAddCustomer(false);
    toast.success('Customer added successfully!');
  };

  const handleEditCustomer = (customerData: any) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === selectedCustomer?.id 
        ? { ...customer, ...customerData }
        : customer
    ));
    setShowEditCustomer(false);
    setSelectedCustomer(null);
    toast.success('Customer updated successfully!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer CRM</h2>
          <p className="text-muted-foreground">{user?.store?.name || 'Your Store'}</p>
        </div>
        
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Add a new customer to your database with their contact information and ID details.
              </DialogDescription>
            </DialogHeader>
            <CustomerForm 
              onSave={handleAddCustomer}
              onCancel={() => setShowAddCustomer(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {customers.length === 0 ? 'No customers yet.' : 'No customers match your search.'}
              </p>
              {customers.length === 0 && (
                <Button 
                  className="mt-4" 
                  onClick={() => setShowAddCustomer(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Customer
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>ID Info</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow 
                    key={customer.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => { setSelectedCustomer(customer); setShowDetailDrawer(true); }}
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {customer.firstName} {customer.lastName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-1 text-muted-foreground" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1 text-muted-foreground" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        {customer.city && customer.state ? `${customer.city}, ${customer.state}` : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{customer.idType}</div>
                        <div className="text-muted-foreground">{customer.idNumber}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(customer.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Customer Details</DialogTitle>
                              <DialogDescription>
                                View customer information and transaction history.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedCustomer && (
                              <CustomerDetailsView 
                                customer={selectedCustomer} 
                                storeId={user?.storeId || 'store_1'}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Dialog open={showEditCustomer} onOpenChange={setShowEditCustomer}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Customer</DialogTitle>
                              <DialogDescription>
                                Update customer information and contact details.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedCustomer && (
                              <CustomerForm 
                                customer={selectedCustomer}
                                isEditing={true}
                                onSave={handleEditCustomer}
                                onCancel={() => {
                                  setShowEditCustomer(false);
                                  setSelectedCustomer(null);
                                }}
                              />
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CustomerDetailDrawer
        customer={selectedCustomer}
        open={showDetailDrawer}
        onClose={() => { setShowDetailDrawer(false); setSelectedCustomer(null); }}
        onEdit={(c) => { setShowDetailDrawer(false); setSelectedCustomer(c); setShowEditCustomer(true); }}
      />
    </div>
  );
}

function CustomerDetailsView({ customer, storeId }: { customer: Customer; storeId: string }) {
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomerTransactions();
  }, [customer.id]);

  const loadCustomerTransactions = async () => {
    setLoading(true);
    try {
      // Mock transaction data - would come from actual API
      const mockTransactions: CustomerTransaction[] = [
        {
          id: '1',
          date: '2024-01-20T14:30:00Z',
          type: 'Purchase',
          amount: '450.00',
          items: 1,
          status: 'Completed'
        },
        {
          id: '2',
          date: '2024-01-18T11:15:00Z',
          type: 'Pawn',
          amount: '200.00',
          items: 2,
          status: 'Active'
        },
        {
          id: '3',
          date: '2024-01-15T09:45:00Z',
          type: 'Sale',
          amount: '125.00',
          items: 1,
          status: 'Completed'
        }
      ];
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error loading customer transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="font-medium">Full Name</Label>
            <p className="mt-1">{customer.firstName} {customer.lastName}</p>
          </div>
          
          {customer.email && (
            <div>
              <Label className="font-medium">Email</Label>
              <p className="mt-1">{customer.email}</p>
            </div>
          )}
          
          {customer.phone && (
            <div>
              <Label className="font-medium">Phone</Label>
              <p className="mt-1">{customer.phone}</p>
            </div>
          )}
          
          <div>
            <Label className="font-medium">Address</Label>
            <p className="mt-1 whitespace-pre-line">
              {customer.address}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="font-medium">ID Information</Label>
            <p className="mt-1">{customer.idType}: {customer.idNumber}</p>
          </div>
          
          <div>
            <Label className="font-medium">Customer Since</Label>
            <p className="mt-1">{new Date(customer.createdAt).toLocaleDateString()}</p>
          </div>
          
          {customer.notes && (
            <div>
              <Label className="font-medium">Notes</Label>
              <p className="mt-1 whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center mb-4">
          <History className="w-4 h-4 mr-2" />
          <Label className="font-medium">Transaction History</Label>
        </div>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : transactions.length === 0 ? (
          <Alert>
            <AlertDescription>No transactions found for this customer.</AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{transaction.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {transaction.amount}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Package className="w-3 h-3 mr-1" />
                      {transaction.items}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.status === 'Completed' ? 'default' : 'secondary'}>
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}