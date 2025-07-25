import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { StatusBadge } from './StatusBadge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { apiCall } from '../utils/supabase/simple-client';
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Download, 
  Eye, 
  Edit, 
  Package, 
  DollarSign, 
  Calendar, 
  User, 
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  FileText,
  Printer,
  Copy,
  X,
  Gem,
  Archive,
  RefreshCw,
  SlidersHorizontal
} from 'lucide-react';

interface InventoryItem {
  id: string;
  smartId: string;
  category: string;
  subcategory: string;
  status: 'Quote' | 'In Stock' | 'Melted' | 'Resold' | 'Hold';
  marketValue: number;
  finalPaid: number;
  payoutPercent: number;
  profit?: number;
  customerName: string;
  employeeName: string;
  testMethod: string;
  createdAt: string;
  daysHeld: number;
  description: string;
  notes: string;
  photos: string[];
  metals: any[];
  stones: any[];
  watchModel?: string;
  watchSerial?: string;
  weight: number;
  thumbnail?: string;
}

interface Store {
  id: string;
  name: string;
}

interface FilterState {
  search: string;
  categories: string[];
  metalTypes: string[];
  stoneTypes: string[];
  status: string;
  dateRange: { from: Date | null; to: Date | null };
  payoutRange: { min: number; max: number };
  profitRange: { min: number; max: number };
  daysHeld: string;
  karat: string[];
  testMethod: string;
  employee: string;
  batchId: string;
}

type SortField = keyof InventoryItem;
type SortDirection = 'asc' | 'desc';

interface InventoryModuleProps {
  currentStore: Store | null;
}

export function InventoryModule({ currentStore }: InventoryModuleProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Admin visibility controls
  const [showPayoutPercent, setShowPayoutPercent] = useState(true);
  const [showProfit, setShowProfit] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    metalTypes: [],
    stoneTypes: [],
    status: 'all',
    dateRange: { from: null, to: null },
    payoutRange: { min: 0, max: 10000 },
    profitRange: { min: 0, max: 5000 },
    daysHeld: 'all',
    karat: [],
    testMethod: 'all',
    employee: 'all',
    batchId: ''
  });

  useEffect(() => {
    if (currentStore) {
      loadItems();
      loadAdminSettings();
    }
  }, [currentStore]);

  useEffect(() => {
    filterAndSortItems();
  }, [items, filters, sortField, sortDirection]);

  const loadAdminSettings = async () => {
    // Load admin visibility settings from store settings
    // For now, using mock data - in production this would come from API
    setShowPayoutPercent(true);
    setShowProfit(false);
  };

  const loadItems = async () => {
    if (!currentStore) return;
    
    setLoading(true);
    try {
      const { items: storeItems } = await apiCall(`/stores/${currentStore.id}/items`);
      
      // Transform API data to match our interface
      const transformedItems: InventoryItem[] = (storeItems || []).map((item: any) => ({
        id: item.id,
        smartId: item.smartId || `${currentStore.name.substring(0, 2).toUpperCase()}01-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-A-${item.id.slice(-1)}`,
        category: item.category || 'jewelry',
        subcategory: item.subcategory || 'ring',
        status: item.status || 'In Stock',
        marketValue: item.marketValue || 0,
        finalPaid: item.finalPaid || 0,
        payoutPercent: item.payoutPercent || 75,
        profit: item.marketValue ? (item.marketValue - (item.finalPaid || 0)) : 0,
        customerName: item.customerName || 'Unknown',
        employeeName: item.employeeName || 'Unknown',
        testMethod: item.testMethod || 'Acid Test',
        createdAt: item.createdAt,
        daysHeld: Math.floor((Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        description: item.description || '',
        notes: item.notes || '',
        photos: item.photos || [],
        metals: item.metals || [],
        stones: item.stones || [],
        watchModel: item.watchModel,
        watchSerial: item.watchSerial,
        weight: item.metals?.reduce((total: number, metal: any) => total + (parseFloat(metal.weight) || 0), 0) || 0,
        thumbnail: item.photos?.[0] || null
      }));

      setItems(transformedItems);
    } catch (error) {
      console.error('Error loading items:', error);
      // Mock data for development
      setItems([
        {
          id: '1',
          smartId: 'ST01-250124-A-1',
          category: 'jewelry',
          subcategory: 'ring',
          status: 'In Stock',
          marketValue: 450.00,
          finalPaid: 351.00,
          payoutPercent: 78,
          profit: 99.00,
          customerName: 'John Smith',
          employeeName: 'Alice Johnson',
          testMethod: 'Acid Test',
          createdAt: '2025-01-20T10:30:00Z',
          daysHeld: 4,
          description: '14k Gold Wedding Ring',
          notes: 'Excellent condition, minor scratches',
          photos: [],
          metals: [{ type: 'gold', karat: '14k', color: 'yellow', weight: '3.2' }],
          stones: [],
          weight: 3.2,
          thumbnail: null
        },
        {
          id: '2',
          smartId: 'ST01-250123-A-2',
          category: 'watches',
          subcategory: 'luxury watch',
          status: 'Quote',
          marketValue: 2800.00,
          finalPaid: 0,
          payoutPercent: 70,
          profit: 0,
          customerName: 'Mary Johnson',
          employeeName: 'Bob Wilson',
          testMethod: 'Visual Inspection',
          createdAt: '2025-01-19T14:15:00Z',
          daysHeld: 5,
          description: 'Rolex Submariner',
          notes: 'Needs authentication verification',
          photos: [],
          metals: [],
          stones: [],
          watchModel: 'Submariner 116610LN',
          watchSerial: 'A1234567',
          weight: 0,
          thumbnail: null
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortItems = () => {
    let filtered = [...items];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.smartId.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.customerName.toLowerCase().includes(searchLower) ||
        item.subcategory.toLowerCase().includes(searchLower)
      );
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(item => filters.categories.includes(item.category));
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.employee !== 'all') {
      filtered = filtered.filter(item => item.employeeName === filters.employee);
    }

    if (filters.testMethod !== 'all') {
      filtered = filtered.filter(item => item.testMethod === filters.testMethod);
    }

    if (filters.daysHeld !== 'all') {
      const days = parseInt(filters.daysHeld);
      if (days === 30) {
        filtered = filtered.filter(item => item.daysHeld <= 30);
      } else if (days === 60) {
        filtered = filtered.filter(item => item.daysHeld > 30 && item.daysHeld <= 60);
      } else if (days === 90) {
        filtered = filtered.filter(item => item.daysHeld > 60);
      }
    }

    if (filters.batchId) {
      filtered = filtered.filter(item => item.smartId.includes(filters.batchId));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle different data types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredItems(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    try {
      // Implementation would batch update selected items
      console.log('Bulk status change:', selectedItems, newStatus);
      setSelectedItems([]);
      loadItems();
    } catch (error) {
      console.error('Error updating bulk status:', error);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredItems.map(item => ({
      'Item ID': item.smartId,
      'Category': item.category,
      'Subcategory': item.subcategory,
      'Description': item.description,
      'Status': item.status,
      'Market Value': item.marketValue,
      'Payout': item.finalPaid,
      'Customer': item.customerName,
      'Employee': item.employeeName,
      'Date In': new Date(item.createdAt).toLocaleDateString(),
      'Days Held': item.daysHeld
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-${currentStore?.name}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      categories: [],
      metalTypes: [],
      stoneTypes: [],
      status: 'all',
      dateRange: { from: null, to: null },
      payoutRange: { min: 0, max: 10000 },
      profitRange: { min: 0, max: 5000 },
      daysHeld: 'all',
      karat: [],
      testMethod: 'all',
      employee: 'all',
      batchId: ''
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
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
      year: 'numeric'
    });
  };

  if (!currentStore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please select a store to view inventory.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">{currentStore.name} • {filteredItems.length} items</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-muted-foreground">
            Total Value: <span className="font-bold">
              {formatCurrency(filteredItems.reduce((sum, item) => sum + item.marketValue, 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Controls Bar */}
      <div className="flex items-center justify-between bg-card rounded-lg border p-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search items... (⌘/Ctrl+K)"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10"
            />
          </div>

          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {(filters.categories.length > 0 || filters.status !== 'all' || filters.employee !== 'all') && (
                  <Badge variant="secondary" className="ml-2">
                    {[filters.categories.length, filters.status !== 'all' ? 1 : 0, filters.employee !== 'all' ? 1 : 0].reduce((a, b) => a + b)}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <FiltersDrawer filters={filters} setFilters={setFilters} onReset={resetFilters} />
          </Sheet>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="rounded-r-none"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('card')}
              className="rounded-l-none"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={handleExportCSV} disabled={filteredItems.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Card>
          <CardContent className="py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading inventory...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-24">
            <div className="text-center">
              <Archive className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No items match your filters</h3>
              <p className="text-muted-foreground mb-6">
                {items.length === 0 
                  ? "You don't have any items in inventory yet."
                  : "Try adjusting your search criteria or clearing some filters."
                }
              </p>
              <div className="flex items-center justify-center space-x-4">
                {items.length > 0 && (
                  <Button variant="outline" onClick={resetFilters}>
                    Clear Filters
                  </Button>
                )}
                <Button onClick={() => window.location.href = '#take-in'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Items
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto" style={{ minWidth: '1600px' }}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedItems.length === filteredItems.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('smartId')}>
                      <div className="flex items-center space-x-1">
                        <span>Item ID</span>
                        {getSortIcon('smartId')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('category')}>
                      <div className="flex items-center space-x-1">
                        <span>Category</span>
                        {getSortIcon('category')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('subcategory')}>
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        {getSortIcon('subcategory')}
                      </div>
                    </TableHead>
                    <TableHead>Metal Summary</TableHead>
                    <TableHead>Stones</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('weight')}>
                      <div className="flex items-center space-x-1">
                        <span>Weight</span>
                        {getSortIcon('weight')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('marketValue')}>
                      <div className="flex items-center space-x-1">
                        <span>Market $</span>
                        {getSortIcon('marketValue')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('finalPaid')}>
                      <div className="flex items-center space-x-1">
                        <span>Payout $</span>
                        {getSortIcon('finalPaid')}
                      </div>
                    </TableHead>
                    {showPayoutPercent && (
                      <TableHead className="cursor-pointer" onClick={() => handleSort('payoutPercent')}>
                        <div className="flex items-center space-x-1">
                          <span>Payout %</span>
                          {getSortIcon('payoutPercent')}
                        </div>
                      </TableHead>
                    )}
                    {showProfit && (
                      <TableHead className="cursor-pointer" onClick={() => handleSort('profit')}>
                        <div className="flex items-center space-x-1">
                          <span>Profit $</span>
                          {getSortIcon('profit')}
                        </div>
                      </TableHead>
                    )}
                    <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('employeeName')}>
                      <div className="flex items-center space-x-1">
                        <span>Buyer</span>
                        {getSortIcon('employeeName')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('testMethod')}>
                      <div className="flex items-center space-x-1">
                        <span>Test Method</span>
                        {getSortIcon('testMethod')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('createdAt')}>
                      <div className="flex items-center space-x-1">
                        <span>Date In</span>
                        {getSortIcon('createdAt')}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => handleSort('daysHeld')}>
                      <div className="flex items-center space-x-1">
                        <span>Days Held</span>
                        {getSortIcon('daysHeld')}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                          {item.thumbnail ? (
                            <ImageWithFallback
                              src={item.thumbnail}
                              alt={item.description}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{item.smartId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{item.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{item.subcategory}</span>
                      </TableCell>
                      <TableCell>
                        {item.metals.length > 0 ? (
                          <div className="text-sm">
                            {item.metals.map((metal, index) => (
                              <div key={index}>
                                {metal.karat} {metal.color} • {metal.weight}g
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.stones.length > 0 ? (
                          <div className="flex items-center">
                            <Gem className="w-4 h-4 mr-1" />
                            <span className="text-sm">{item.stones.length}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.weight.toFixed(1)}g</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(item.marketValue)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatCurrency(item.finalPaid)}</span>
                      </TableCell>
                      {showPayoutPercent && (
                        <TableCell>
                          <span className="text-sm">{item.payoutPercent}%</span>
                        </TableCell>
                      )}
                      {showProfit && (
                        <TableCell>
                          <span className="font-medium text-blue-600">{formatCurrency(item.profit || 0)}</span>
                        </TableCell>
                      )}
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{item.employeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.testMethod}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(item.createdAt)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.daysHeld} days</span>
                      </TableCell>
                      <TableCell>
                        <RowActions item={item} onViewDetails={setSelectedItem} onShowDetails={setShowDetails} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              selected={selectedItems.includes(item.id)}
              onSelect={(checked) => handleSelectItem(item.id, checked)}
              onViewDetails={() => {
                setSelectedItem(item);
                setShowDetails(true);
              }}
              showPayoutPercent={showPayoutPercent}
              showProfit={showProfit}
            />
          ))}
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 shadow-lg z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-medium">{selectedItems.length} items selected</span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedItems([])}
              >
                Clear Selection
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('In Stock')}>
                    In Stock
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('Sold')}>
                    Sold
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('Melted')}>
                    Melted
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('Returned')}>
                    Returned
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="secondary" size="sm">
                <Printer className="w-4 h-4 mr-2" />
                Print Labels
              </Button>
              
              <Button variant="secondary" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Item Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
            <DialogDescription>
              View detailed information about this inventory item.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && <ItemDetailsView item={selectedItem} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FiltersDrawerProps {
  filters: FilterState;
  setFilters: (filters: FilterState | ((prev: FilterState) => FilterState)) => void;
  onReset: () => void;
}

function FiltersDrawer({ filters, setFilters, onReset }: FiltersDrawerProps) {
  const categories = ['jewelry', 'watches', 'bullion', 'silverware', 'stones'];
  const metalTypes = ['gold', 'silver', 'platinum', 'palladium'];
  const stoneTypes = ['diamond', 'ruby', 'sapphire', 'emerald', 'other'];
  const karats = ['24k', '22k', '18k', '14k', '10k', 'sterling'];
  const testMethods = ['Acid Test', 'Electronic Test', 'Visual Inspection', 'X-Ray'];
  const employees = ['Alice Johnson', 'Bob Wilson', 'Carol Davis'];

  return (
    <SheetContent className="w-80 overflow-auto">
      <SheetHeader>
        <SheetTitle>Filters</SheetTitle>
        <SheetDescription>
          Refine your inventory view with advanced filters
        </SheetDescription>
      </SheetHeader>
      
      <div className="space-y-6 mt-6">
        {/* Categories */}
        <div>
          <Label className="text-sm font-medium">Categories</Label>
          <div className="mt-2 space-y-2">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={(checked) => {
                    setFilters(prev => ({
                      ...prev,
                      categories: checked
                        ? [...prev.categories, category]
                        : prev.categories.filter(c => c !== category)
                    }));
                  }}
                />
                <Label htmlFor={`category-${category}`} className="capitalize">
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Status */}
        <div>
          <Label className="text-sm font-medium">Status</Label>
          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="In Stock">In Stock</SelectItem>
              <SelectItem value="Quote">Quote</SelectItem>
              <SelectItem value="Sold">Sold</SelectItem>
              <SelectItem value="Melted">Melted</SelectItem>
              <SelectItem value="Returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employee */}
        <div>
          <Label className="text-sm font-medium">Employee Buyer</Label>
          <Select value={filters.employee} onValueChange={(value) => setFilters(prev => ({ ...prev, employee: value }))}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee} value={employee}>
                  {employee}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Test Method */}
        <div>
          <Label className="text-sm font-medium">Test Method</Label>
          <Select value={filters.testMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, testMethod: value }))}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              {testMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Days Held */}
        <div>
          <Label className="text-sm font-medium">Days Held</Label>
          <Select value={filters.daysHeld} onValueChange={(value) => setFilters(prev => ({ ...prev, daysHeld: value }))}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Periods</SelectItem>
              <SelectItem value="30">≤ 30 days</SelectItem>
              <SelectItem value="60">31-60 days</SelectItem>
              <SelectItem value="90">&gt; 60 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Batch/Item ID Search */}
        <div>
          <Label className="text-sm font-medium">Batch / Item ID</Label>
          <Input
            className="mt-2"
            placeholder="Enter batch or item ID"
            value={filters.batchId}
            onChange={(e) => setFilters(prev => ({ ...prev, batchId: e.target.value }))}
          />
        </div>

        <Separator />

        {/* Footer Buttons */}
        <div className="flex space-x-2 pt-4">
          <Button variant="outline" className="flex-1" onClick={onReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button className="flex-1">
            Apply
          </Button>
        </div>
      </div>
    </SheetContent>
  );
}

interface ItemCardProps {
  item: InventoryItem;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onViewDetails: () => void;
  showPayoutPercent: boolean;
  showProfit: boolean;
}

function ItemCard({ item, selected, onSelect, onViewDetails, showPayoutPercent, showProfit }: ItemCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card className={`group hover:shadow-lg hover:scale-102 transition-all cursor-pointer ${selected ? 'ring-2 ring-primary' : ''}`} style={{ width: '240px', height: '260px' }}>
      <div className="relative">
        {/* Image */}
        <div className="w-full h-32 rounded-t-lg overflow-hidden bg-muted">
          {item.thumbnail ? (
            <ImageWithFallback
              src={item.thumbnail}
              alt={item.description}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Selection Checkbox */}
        <div className="absolute top-2 left-2">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            className="bg-background/80 backdrop-blur-sm"
          />
        </div>

        {/* Actions Menu */}
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="bg-background/80 backdrop-blur-sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Printer className="w-4 h-4 mr-2" />
                Print Label
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="w-4 h-4 mr-2" />
                PDF Receipt
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 space-y-2">
        <div className="font-mono text-xs text-muted-foreground">{item.smartId}</div>
        <Badge variant="outline" className="text-xs capitalize">{item.category}</Badge>
        <div className="text-sm font-medium truncate">{item.description || 'Untitled Item'}</div>
        <div className="text-xs text-muted-foreground">{item.weight.toFixed(1)}g</div>
        <div className="text-sm font-bold">{formatCurrency(item.finalPaid)}</div>
      </CardContent>

      {/* Footer */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <StatusBadge status={item.status} />
        <span className="text-xs text-muted-foreground">{item.daysHeld}d</span>
      </div>
    </Card>
  );
}

interface RowActionsProps {
  item: InventoryItem;
  onViewDetails: (item: InventoryItem) => void;
  onShowDetails: (show: boolean) => void;
}

function RowActions({ item, onViewDetails, onShowDetails }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            onViewDetails(item);
            onShowDetails(true);
          }}
        >
          <Eye className="w-4 h-4 mr-2" />
          View / Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Archive className="w-4 h-4 mr-2" />
          Change Status
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Printer className="w-4 h-4 mr-2" />
          Print Label
        </DropdownMenuItem>
        <DropdownMenuItem>
          <FileText className="w-4 h-4 mr-2" />
          Generate PDF Receipt
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ItemDetailsView({ item }: { item: InventoryItem }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Item ID</Label>
          <p className="mt-1 font-mono">{item.smartId}</p>
        </div>
        <div>
          <Label>Status</Label>
          <div className="mt-1">
            <StatusBadge status={item.status} />
          </div>
        </div>
        <div>
          <Label>Category</Label>
          <p className="mt-1 capitalize">{item.category}</p>
        </div>
        <div>
          <Label>Type</Label>
          <p className="mt-1 capitalize">{item.subcategory}</p>
        </div>
        <div>
          <Label>Market Value</Label>
          <p className="mt-1 font-medium">{formatCurrency(item.marketValue)}</p>
        </div>
        <div>
          <Label>Payout Amount</Label>
          <p className="mt-1 font-medium">{formatCurrency(item.finalPaid)}</p>
        </div>
        <div>
          <Label>Customer</Label>
          <p className="mt-1">{item.customerName}</p>
        </div>
        <div>
          <Label>Employee</Label>
          <p className="mt-1">{item.employeeName}</p>
        </div>
        <div>
          <Label>Test Method</Label>
          <p className="mt-1">{item.testMethod}</p>
        </div>
        <div>
          <Label>Date Added</Label>
          <p className="mt-1">{new Date(item.createdAt).toLocaleString()}</p>
        </div>
        <div>
          <Label>Days Held</Label>
          <p className="mt-1">{item.daysHeld} days</p>
        </div>
        <div>
          <Label>Weight</Label>
          <p className="mt-1">{item.weight.toFixed(1)}g</p>
        </div>
      </div>

      {item.description && (
        <div>
          <Label>Description</Label>
          <p className="mt-1 text-sm">{item.description}</p>
        </div>
      )}

      {item.metals && item.metals.length > 0 && (
        <div>
          <Label>Metals</Label>
          <div className="mt-2 space-y-2">
            {item.metals.map((metal: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <strong>Type:</strong> {metal.karat} {metal.color}
                  </div>
                  <div>
                    <strong>Weight:</strong> {metal.weight}g
                  </div>
                  <div>
                    <strong>Type:</strong> {metal.type}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {item.stones && item.stones.length > 0 && (
        <div>
          <Label>Stones</Label>
          <div className="mt-2 space-y-2">
            {item.stones.map((stone: any, index: number) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <strong>Type:</strong> {stone.type}
                  </div>
                  <div>
                    <strong>Carat:</strong> {stone.carat}
                  </div>
                  <div>
                    <strong>Clarity:</strong> {stone.clarity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {item.watchModel && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Watch Model</Label>
            <p className="mt-1">{item.watchModel}</p>
          </div>
          <div>
            <Label>Serial Number</Label>
            <p className="mt-1 font-mono">{item.watchSerial}</p>
          </div>
        </div>
      )}

      {item.notes && (
        <div>
          <Label>Notes</Label>
          <p className="mt-1 text-sm whitespace-pre-wrap">{item.notes}</p>
        </div>
      )}
    </div>
  );
}