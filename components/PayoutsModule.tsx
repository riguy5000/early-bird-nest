import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { apiCall } from '../utils/supabase/simple-client';
import { 
  Search, 
  Plus, 
  DollarSign, 
  Calendar as CalendarIcon, 
  User, 
  Receipt,
  TrendingUp,
  TrendingDown,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';

interface Payout {
  id: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: string;
  status: string;
  items: number;
  employeeName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface PayoutSummary {
  totalPayouts: number;
  todayPayouts: number;
  weekPayouts: number;
  monthPayouts: number;
  averagePayout: number;
  payoutChange: number;
}

interface Store {
  id: string;
  name: string;
}

interface PayoutsModuleProps {
  currentStore: Store | null;
}

export function PayoutsModule({ currentStore }: PayoutsModuleProps) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [showAddPayout, setShowAddPayout] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (currentStore) {
      loadPayouts();
    }
  }, [currentStore]);

  useEffect(() => {
    filterPayouts();
    calculateSummary();
  }, [payouts, searchTerm, statusFilter, methodFilter, dateRange]);

  const loadPayouts = async () => {
    if (!currentStore) return;
    
    setLoading(true);
    try {
      const { payouts: storePayouts } = await apiCall(`/stores/${currentStore.id}/payouts`);
      
      // Mock additional data since API might not have complete payout records
      const mockPayouts: Payout[] = [
        {
          id: '1',
          customerId: 'cust1',
          customerName: 'John Smith',
          amount: 450.00,
          method: 'Cash',
          status: 'Completed',
          items: 3,
          employeeName: 'Store Owner',
          notes: 'Gold jewelry purchase',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          customerId: 'cust2',
          customerName: 'Mary Johnson',
          amount: 1250.75,
          method: 'Check',
          status: 'Completed',
          items: 5,
          employeeName: 'Store Owner',
          notes: 'Watch and ring collection',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '3',
          customerId: 'cust3',
          customerName: 'Robert Brown',
          amount: 325.50,
          method: 'Cash',
          status: 'Pending',
          items: 2,
          employeeName: 'Store Owner',
          notes: 'Silver items',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      
      setPayouts([...mockPayouts, ...(storePayouts || [])]);
    } catch (error) {
      console.error('Error loading payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPayouts = () => {
    let filtered = payouts;

    if (searchTerm) {
      filtered = filtered.filter(payout => 
        payout.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payout.method?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(payout => payout.status === statusFilter);
    }

    if (methodFilter !== 'all') {
      filtered = filtered.filter(payout => payout.method === methodFilter);
    }

    if (dateRange.from) {
      filtered = filtered.filter(payout => 
        new Date(payout.createdAt) >= dateRange.from!
      );
    }

    if (dateRange.to) {
      filtered = filtered.filter(payout => 
        new Date(payout.createdAt) <= dateRange.to!
      );
    }

    setFilteredPayouts(filtered);
  };

  const calculateSummary = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const completedPayouts = payouts.filter(p => p.status === 'Completed');
    const totalPayouts = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
    
    const todayPayouts = completedPayouts
      .filter(p => new Date(p.createdAt) >= today)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const weekPayouts = completedPayouts
      .filter(p => new Date(p.createdAt) >= weekAgo)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const monthPayouts = completedPayouts
      .filter(p => new Date(p.createdAt) >= monthAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    const averagePayout = completedPayouts.length > 0 ? totalPayouts / completedPayouts.length : 0;

    setSummary({
      totalPayouts,
      todayPayouts,
      weekPayouts,
      monthPayouts,
      averagePayout,
      payoutChange: 12.3, // Mock change percentage
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Cash': return '💵';
      case 'Check': return '📝';
      case 'Bank Transfer': return '🏦';
      case 'Digital': return '💳';
      default: return '💰';
    }
  };

  if (!currentStore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payouts Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please select a store to view payouts.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payouts Ledger</h2>
          <p className="text-muted-foreground">{currentStore.name}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Record Payout
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                Total Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{formatCurrency(summary.totalPayouts)}</span>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-sm">+{summary.payoutChange}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatCurrency(summary.todayPayouts)}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatCurrency(summary.weekPayouts)}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold">{formatCurrency(summary.averagePayout)}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search customers, notes, or payment methods..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Check">Check</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Digital">Digital</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range) {
                      setDateRange({ from: range.from, to: range.to });
                    } else {
                      setDateRange({ from: undefined, to: undefined });
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History ({filteredPayouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading payouts...</p>
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {payouts.length === 0 ? 'No payouts recorded yet.' : 'No payouts match your filters.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{payout.customerName}</div>
                          {payout.notes && (
                            <div className="text-sm text-muted-foreground truncate max-w-32">
                              {payout.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-medium">
                        <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                        {formatCurrency(payout.amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="mr-2">{getMethodIcon(payout.method)}</span>
                        {payout.method}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payout.items} items</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {formatDate(payout.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{payout.employeeName}</span>
                    </TableCell>
                    <TableCell>
                      <Dialog open={showDetails} onOpenChange={setShowDetails}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPayout(payout)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Payout Details</DialogTitle>
                            <DialogDescription>
                              View detailed information about this payout transaction.
                            </DialogDescription>
                          </DialogHeader>
                          {selectedPayout && <PayoutDetailsView payout={selectedPayout} />}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayoutDetailsView({ payout }: { payout: Payout }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="font-medium">Customer</Label>
            <p className="mt-1 text-lg">{payout.customerName}</p>
          </div>
          
          <div>
            <Label className="font-medium">Amount</Label>
            <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(payout.amount)}</p>
          </div>
          
          <div>
            <Label className="font-medium">Payment Method</Label>
            <p className="mt-1">{payout.method}</p>
          </div>
          
          <div>
            <Label className="font-medium">Number of Items</Label>
            <p className="mt-1">{payout.items} items</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="font-medium">Status</Label>
            <div className="mt-1">
              <Badge className={getStatusColor(payout.status)}>
                {payout.status}
              </Badge>
            </div>
          </div>
          
          <div>
            <Label className="font-medium">Processed By</Label>
            <p className="mt-1">{payout.employeeName}</p>
          </div>
          
          <div>
            <Label className="font-medium">Date Created</Label>
            <p className="mt-1">{new Date(payout.createdAt).toLocaleString()}</p>
          </div>
          
          <div>
            <Label className="font-medium">Last Updated</Label>
            <p className="mt-1">{new Date(payout.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {payout.notes && (
        <div>
          <Label className="font-medium">Notes</Label>
          <div className="mt-1 p-3 bg-muted rounded-lg">
            <p className="whitespace-pre-wrap">{payout.notes}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button variant="outline">
          <Receipt className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
        {payout.status === 'Pending' && (
          <Button>
            Mark as Completed
          </Button>
        )}
      </div>
    </div>
  );
}