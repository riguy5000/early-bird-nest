import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { apiCall } from '../utils/supabase/simple-client';
import { 
  Camera, 
  Plus, 
  Minus, 
  Trash2, 
  Package,
  Calculator,
  ChevronDown,
  ChevronUp,
  QrCode,
  Save,
  CreditCard,
  Banknote,
  FileText,
  Check,
  Sparkles,
  Smartphone,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Store {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface MetalPrice {
  metal: string;
  price: number;
  change: number;
  isUp: boolean;
}

interface Metal {
  id: string;
  type: string;
  karat: string;
  color: string;
  weight: string;
  value?: number;
}

interface Stone {
  id: string;
  type: string;
  color: string;
  clarity: string;
  carat: string;
  lab: string;
  certNumber: string;
}

interface ItemData {
  id: string;
  category: string;
  subcategory: string;
  metals: Metal[];
  stones: Stone[];
  watchModel?: string;
  watchSerial?: string;
  marketValue: string;
  notes: string;
  photos: string[];
}

interface EnhancedTakeInModuleProps {
  currentStore: Store | null;
  currentEmployee: Employee | null;
  metalPrices: MetalPrice[];
  onSuccess: () => void;
}

const categories = [
  { id: 'jewelry', label: 'Jewelry', subcategories: ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Pendant', 'Chain'] },
  { id: 'watches', label: 'Watches', subcategories: ['Luxury Watch', 'Sport Watch', 'Dress Watch', 'Smart Watch'] },
  { id: 'bullion', label: 'Bullion', subcategories: ['Gold Bar', 'Silver Bar', 'Platinum Bar', 'Gold Coin', 'Silver Coin'] },
  { id: 'silverware', label: 'Silverware', subcategories: ['Flatware Set', 'Serving Pieces', 'Tea Set', 'Decorative Items'] },
  { id: 'stones', label: 'Loose Stones', subcategories: ['Diamond', 'Colored Stone', 'Pearl', 'Gemstone Set'] }
];

const stoneTypes = [
  'Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Tanzanite', 'Topaz', 
  'Citrine', 'Aquamarine', 'Garnet', 'Amethyst', 'Peridot', 'Tourmaline'
];

export function EnhancedTakeInModule({ currentStore, currentEmployee, metalPrices, onSuccess }: EnhancedTakeInModuleProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [itemCount, setItemCount] = useState(1);
  const [items, setItems] = useState<ItemData[]>([]);
  const [activeItemTab, setActiveItemTab] = useState('item-0');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [payoutPercent, setPayoutPercent] = useState(78);
  const [paymentMethod, setPaymentMethod] = useState('Check');
  const [checkNumber, setCheckNumber] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [showAIAssist, setShowAIAssist] = useState(false);
  
  // Admin visibility controls
  const [showPayoutPercent, setShowPayoutPercent] = useState(true);
  const [showProfit, setShowProfit] = useState(false);

  const generateBatchId = () => {
    const storePrefix = currentStore?.name?.substring(0, 2).toUpperCase() || 'ST';
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const sequence = String.fromCharCode(65 + (date.getHours() % 26));
    return `${storePrefix}01-${dateStr}-${sequence}`;
  };

  const [batchId] = useState(generateBatchId());

  // Check if current employee is admin
  const isAdmin = currentEmployee?.role === 'admin' || currentEmployee?.role === 'manager';

  useEffect(() => {
    // Initialize with one item when categories are selected
    if (selectedCategories.length > 0 && items.length === 0) {
      initializeItems();
    }
  }, [selectedCategories, itemCount]);

  useEffect(() => {
    // Load admin settings for visibility controls
    loadAdminSettings();
  }, [currentStore]);

  const loadAdminSettings = async () => {
    if (!currentStore) return;
    
    try {
      // In production, this would load from store settings
      // For now, using defaults based on employee role
      setShowPayoutPercent(isAdmin);
      setShowProfit(isAdmin);
    } catch (error) {
      console.error('Error loading admin settings:', error);
    }
  };

  const initializeItems = () => {
    const newItems: ItemData[] = [];
    for (let i = 0; i < itemCount; i++) {
      newItems.push({
        id: `item-${i}`,
        category: selectedCategories[0] || '',
        subcategory: '',
        metals: [],
        stones: [],
        marketValue: '',
        notes: '',
        photos: []
      });
    }
    setItems(newItems);
    setActiveItemTab('item-0');
  };

  const updateItem = (itemId: string, field: keyof ItemData, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
    
    // Clear field errors when user updates values
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      const errorKey = `item-${itemIndex}-${field}`;
      if (fieldErrors[errorKey]) {
        setFieldErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[errorKey];
          return newErrors;
        });
      }
    }
  };

  const addMetal = (itemId: string) => {
    const newMetal: Metal = {
      id: Date.now().toString(),
      type: 'gold',
      karat: '14k',
      color: 'yellow',
      weight: ''
    };
    
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, metals: [...item.metals, newMetal] } : item
    ));
  };

  const updateMetal = (itemId: string, metalId: string, field: keyof Metal, value: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? {
        ...item,
        metals: item.metals.map(m => m.id === metalId ? { ...m, [field]: value } : m)
      } : item
    ));
  };

  const removeMetal = (itemId: string, metalId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? {
        ...item,
        metals: item.metals.filter(m => m.id !== metalId)
      } : item
    ));
  };

  const addStone = (itemId: string) => {
    const newStone: Stone = {
      id: Date.now().toString(),
      type: 'diamond',
      color: '',
      clarity: '',
      carat: '',
      lab: '',
      certNumber: ''
    };
    
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, stones: [...item.stones, newStone] } : item
    ));
  };

  const updateStone = (itemId: string, stoneId: string, field: keyof Stone, value: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? {
        ...item,
        stones: item.stones.map(s => s.id === stoneId ? { ...s, [field]: value } : s)
      } : item
    ));
  };

  const removeStone = (itemId: string, stoneId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? {
        ...item,
        stones: item.stones.filter(s => s.id !== stoneId)
      } : item
    ));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const addItem = () => {
    const newItemId = `item-${items.length}`;
    const newItem: ItemData = {
      id: newItemId,
      category: selectedCategories[0] || '',
      subcategory: '',
      metals: [],
      stones: [],
      marketValue: '',
      notes: '',
      photos: []
    };
    setItems(prev => [...prev, newItem]);
    setItemCount(prev => prev + 1);
    setActiveItemTab(newItemId);
  };

  const calculateTotalMarketValue = () => {
    return items.reduce((total, item) => {
      return total + (parseFloat(item.marketValue) || 0);
    }, 0);
  };

  const calculateTotalPayout = () => {
    return (calculateTotalMarketValue() * payoutPercent / 100);
  };

  const calculateProfit = () => {
    return calculateTotalMarketValue() - calculateTotalPayout();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAIAssist = () => {
    setShowAIAssist(true);
  };

  const handleAIComplete = (aiResults: any) => {
    // Mock AI processing - in production this would process actual AI results
    const mockItems = [
      {
        id: 'item-0',
        category: 'jewelry',
        subcategory: 'ring',
        metals: [{ id: '1', type: 'gold', karat: '14k', color: 'yellow', weight: '3.2' }],
        stones: [],
        marketValue: '450',
        notes: 'AI detected: Gold ring, excellent condition',
        photos: []
      },
      {
        id: 'item-1',
        category: 'jewelry',
        subcategory: 'necklace',
        metals: [{ id: '2', type: 'gold', karat: '18k', color: 'yellow', weight: '5.8' }],
        stones: [],
        marketValue: '890',
        notes: 'AI detected: Gold chain necklace',
        photos: []
      }
    ];
    
    setItems(mockItems);
    setItemCount(mockItems.length);
    setActiveItemTab('item-0');
    setShowAIAssist(false);
  };

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    // Validate customer information
    if (!customerInfo.name.trim()) {
      errors.customerName = 'Customer name is required';
    }
    
    // Validate items
    if (items.length === 0) {
      errors.items = 'At least one item is required';
    }
    
    items.forEach((item, index) => {
      if (!item.marketValue || parseFloat(item.marketValue) <= 0) {
        errors[`item-${index}-marketValue`] = `Item ${index + 1} must have a valid market value`;
      }
      if (!item.subcategory) {
        errors[`item-${index}-subcategory`] = `Item ${index + 1} must have a type selected`;
      }
    });
    
    // Validate payment method specific requirements
    if (paymentMethod === 'Check' && !checkNumber.trim()) {
      errors.checkNumber = 'Check number is required for check payments';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleComplete = async (saveAsQuote = false) => {
    setIsLoading(true);
    setError('');
    setFieldErrors({});
    
    try {
      // Validate form
      if (!validateForm()) {
        setError('Please fix the highlighted errors before continuing');
        setIsLoading(false);
        return;
      }

      // Create customer
      const customerData = {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email,
        address: customerInfo.address,
      };

      const { customer } = await apiCall(`/stores/${currentStore!.id}/customers`, {
        method: 'POST',
        body: JSON.stringify(customerData),
      });

      // Create batch
      const batchData = {
        smartId: batchId,
        employeeId: currentEmployee!.id,
        customerId: customer.id,
        status: saveAsQuote ? 'Quote' : 'Purchase',
      };

      const { batch } = await apiCall(`/stores/${currentStore!.id}/batches`, {
        method: 'POST',
        body: JSON.stringify(batchData),
      });

      // Create items
      for (const item of items) {
        const itemData = {
          batchId: batch.id,
          category: item.category,
          subcategory: item.subcategory,
          status: saveAsQuote ? 'Quote' : 'Purchase',
          marketValue: parseFloat(item.marketValue),
          payoutPercent: saveAsQuote ? 0 : payoutPercent,
          finalPaid: saveAsQuote ? 0 : (parseFloat(item.marketValue) * payoutPercent / 100),
          notes: item.notes,
          metals: item.metals.filter(m => m.type && m.weight),
          stones: item.stones.filter(s => s.type),
          watchModel: item.watchModel,
          watchSerial: item.watchSerial,
        };

        await apiCall(`/stores/${currentStore!.id}/items`, {
          method: 'POST',
          body: JSON.stringify(itemData),
        });
      }

      // Create payout if not a quote
      if (!saveAsQuote) {
        const payoutData = {
          customerId: customer.id,
          method: paymentMethod,
          amount: calculateTotalPayout(),
          checkNumber: paymentMethod === 'Check' ? checkNumber : undefined,
        };

        await apiCall(`/stores/${currentStore!.id}/payouts`, {
          method: 'POST',
          body: JSON.stringify(payoutData),
        });
      }

      onSuccess();
      
    } catch (error: any) {
      console.error('Error completing transaction:', error);
      setError(error.message || 'Failed to complete transaction');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentStore || !currentEmployee) {
    return (
      <div className="w-full max-w-5xl mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please select a store and employee to begin the take-in process.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Live Spot Price Bar - Persistent */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border/50 px-6 py-3">
        <div className="flex items-center space-x-6 text-sm">
          <span className="font-medium text-muted-foreground">Live Prices:</span>
          {metalPrices.map((metal, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="font-medium">{metal.metal}:</span>
              <span className="font-bold">${metal.price}</span>
              <span className={`text-xs ${metal.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {metal.isUp ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                {metal.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">New Take-In Process</h1>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
              <span>Batch ID: <strong>{batchId}</strong></span>
              <span>Employee: <strong>{currentEmployee.name}</strong></span>
              <span>Store: <strong>{currentStore.name}</strong></span>
            </div>
          </div>
        </div>



        {/* Category Multi-Select + Item Count + AI Assist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Selection */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Select Categories</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose one or more categories for the items you're processing.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedCategories.includes(category.id)
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => handleCategoryToggle(category.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => {}}
                      />
                      <div>
                        <h4 className="font-medium text-sm">{category.label}</h4>
                        <p className="text-xs text-muted-foreground">
                          {category.subcategories.slice(0, 2).join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Item Count + AI Assist */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Item Count</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setItemCount(Math.max(1, itemCount - 1))}
                    disabled={itemCount <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold">{itemCount}</div>
                    <div className="text-sm text-muted-foreground">Items</div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setItemCount(itemCount + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Assist Button */}
            <Dialog open={showAIAssist} onOpenChange={setShowAIAssist}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleAIAssist}
                  disabled={selectedCategories.length === 0}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI Assist
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>AI Photo Capture</DialogTitle>
                  <DialogDescription>
                    Use your phone to capture photos of items for AI analysis
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center border-2 border-dashed">
                      <QrCode className="w-16 h-16 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Scan this QR code with your mobile device
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</div>
                      <span className="text-sm">Open camera on your phone</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</div>
                      <span className="text-sm">Take photos of item tray</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</div>
                      <span className="text-sm">AI will analyze and pre-fill details</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowAIAssist(false)}>
                      Cancel
                    </Button>
                    <Button className="flex-1" onClick={() => handleAIComplete({})}>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Simulate AI
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Item Tabs & Details */}
        {selectedCategories.length > 0 && (
          <div className="space-y-6">
            <Tabs value={activeItemTab} onValueChange={setActiveItemTab}>
              <div className="flex items-center justify-between">
                <TabsList className="grid w-auto" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
                  {items.map((item, index) => (
                    <TabsTrigger key={item.id} value={item.id}>
                      Item {index + 1}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {items.length < itemCount && (
                  <Button variant="outline" onClick={addItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                )}
              </div>

              {items.map((item) => (
                <TabsContent key={item.id} value={item.id} className="space-y-6">
                  {/* Basic Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Select 
                            value={item.category} 
                            onValueChange={(value) => updateItem(item.id, 'category', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {selectedCategories.map(catId => {
                                const category = categories.find(c => c.id === catId);
                                return category ? (
                                  <SelectItem key={catId} value={catId}>
                                    {category.label}
                                  </SelectItem>
                                ) : null;
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Item Type *</Label>
                          <Select 
                            value={item.subcategory} 
                            onValueChange={(value) => updateItem(item.id, 'subcategory', value)}
                          >
                            <SelectTrigger className={fieldErrors[`item-${items.indexOf(item)}-subcategory`] ? 'border-red-500' : ''}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories
                                .find(c => c.id === item.category)
                                ?.subcategories.map(sub => (
                                  <SelectItem key={sub} value={sub.toLowerCase()}>
                                    {sub}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          {fieldErrors[`item-${items.indexOf(item)}-subcategory`] && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors[`item-${items.indexOf(item)}-subcategory`]}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metals Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Metals</CardTitle>
                        <Button variant="outline" size="sm" onClick={() => addMetal(item.id)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Metal
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.metals.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No metals added yet</p>
                      ) : (
                        <div className="space-y-4">
                          {item.metals.map((metal) => (
                            <div key={metal.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                              <Select value={metal.type} onValueChange={(value) => updateMetal(item.id, metal.id, 'type', value)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="gold">Gold</SelectItem>
                                  <SelectItem value="silver">Silver</SelectItem>
                                  <SelectItem value="platinum">Platinum</SelectItem>
                                  <SelectItem value="palladium">Palladium</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Select value={metal.karat} onValueChange={(value) => updateMetal(item.id, metal.id, 'karat', value)}>
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="24k">24k</SelectItem>
                                  <SelectItem value="22k">22k</SelectItem>
                                  <SelectItem value="18k">18k</SelectItem>
                                  <SelectItem value="14k">14k</SelectItem>
                                  <SelectItem value="10k">10k</SelectItem>
                                  <SelectItem value="sterling">Sterling</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Select value={metal.color} onValueChange={(value) => updateMetal(item.id, metal.id, 'color', value)}>
                                <SelectTrigger className="w-24">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="yellow">Yellow</SelectItem>
                                  <SelectItem value="white">White</SelectItem>
                                  <SelectItem value="rose">Rose</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Input
                                placeholder="Weight (g)"
                                value={metal.weight}
                                onChange={(e) => updateMetal(item.id, metal.id, 'weight', e.target.value)}
                                className="w-32"
                              />
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeMetal(item.id, metal.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Stones Section (Expandable) */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <button
                          className="flex items-center space-x-2 text-left"
                          onClick={() => toggleSection(`stones-${item.id}`)}
                        >
                          <CardTitle>Stones (Optional)</CardTitle>
                          {expandedSections[`stones-${item.id}`] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        {expandedSections[`stones-${item.id}`] && (
                          <Button variant="outline" size="sm" onClick={() => addStone(item.id)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Stone
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    {expandedSections[`stones-${item.id}`] && (
                      <CardContent>
                        {item.stones.length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">No stones added yet</p>
                        ) : (
                          <div className="space-y-4">
                            {item.stones.map((stone) => (
                              <div key={stone.id} className="grid grid-cols-6 gap-4 p-4 border rounded-lg">
                                <Select value={stone.type} onValueChange={(value) => updateStone(item.id, stone.id, 'type', value)}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {stoneTypes.map((type) => (
                                      <SelectItem key={type} value={type.toLowerCase()}>
                                        {type}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <Input
                                  placeholder="Color"
                                  value={stone.color}
                                  onChange={(e) => updateStone(item.id, stone.id, 'color', e.target.value)}
                                />
                                
                                <Input
                                  placeholder="Clarity"
                                  value={stone.clarity}
                                  onChange={(e) => updateStone(item.id, stone.id, 'clarity', e.target.value)}
                                />
                                
                                <Input
                                  placeholder="Carat"
                                  value={stone.carat}
                                  onChange={(e) => updateStone(item.id, stone.id, 'carat', e.target.value)}
                                />
                                
                                <Input
                                  placeholder="Lab"
                                  value={stone.lab}
                                  onChange={(e) => updateStone(item.id, stone.id, 'lab', e.target.value)}
                                />
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => removeStone(item.id, stone.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>

                  {/* Watch Info (if category is watches) */}
                  {item.category === 'watches' && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Watch Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Model</Label>
                            <Input
                              placeholder="Start typing for suggestions..."
                              value={item.watchModel || ''}
                              onChange={(e) => updateItem(item.id, 'watchModel', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Serial Number</Label>
                            <Input
                              placeholder="Enter serial number"
                              value={item.watchSerial || ''}
                              onChange={(e) => updateItem(item.id, 'watchSerial', e.target.value)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Market Value */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Market Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`grid gap-4 ${showPayoutPercent ? 'grid-cols-3' : 'grid-cols-2'}`}>
                        <div>
                          <Label>Market Value *</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={item.marketValue}
                            onChange={(e) => updateItem(item.id, 'marketValue', e.target.value)}
                            className={fieldErrors[`item-${items.indexOf(item)}-marketValue`] ? 'border-red-500' : ''}
                          />
                          {fieldErrors[`item-${items.indexOf(item)}-marketValue`] && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors[`item-${items.indexOf(item)}-marketValue`]}</p>
                          )}
                        </div>
                        {showPayoutPercent && (
                          <div>
                            <Label>Store Payout %</Label>
                            <Input
                              type="number"
                              value={payoutPercent}
                              onChange={(e) => setPayoutPercent(parseFloat(e.target.value) || 0)}
                              className="bg-muted"
                            />
                          </div>
                        )}
                        <div>
                          <Label>Item Payout</Label>
                          <Input
                            value={formatCurrency((parseFloat(item.marketValue) || 0) * payoutPercent / 100)}
                            readOnly
                            className="bg-muted"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="Add any additional notes about this item..."
                        value={item.notes}
                        onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
                        rows={3}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Calculation Summary */}
            <Card className="bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculation Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`grid gap-4 text-center ${showProfit ? 'grid-cols-4' : showPayoutPercent ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(calculateTotalMarketValue())}</div>
                    <div className="text-sm text-muted-foreground">Total Market Value</div>
                  </div>
                  {showPayoutPercent && (
                    <div>
                      <div className="text-2xl font-bold">{payoutPercent}%</div>
                      <div className="text-sm text-muted-foreground">Payout Percentage</div>
                    </div>
                  )}
                  <div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(calculateTotalPayout())}</div>
                    <div className="text-sm text-muted-foreground">Total Payout</div>
                  </div>
                  {showProfit && (
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{formatCurrency(calculateProfit())}</div>
                      <div className="text-sm text-muted-foreground">Store Profit</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Customer name is required to complete the transaction.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="Enter customer name"
                      value={customerInfo.name}
                      onChange={(e) => {
                        setCustomerInfo(prev => ({ ...prev, name: e.target.value }));
                        // Clear error when user starts typing
                        if (fieldErrors.customerName) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.customerName;
                            return newErrors;
                          });
                        }
                      }}
                      className={fieldErrors.customerName ? 'border-red-500' : ''}
                    />
                    {fieldErrors.customerName && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.customerName}</p>
                    )}
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      placeholder="Enter phone number"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="Enter email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Input
                      placeholder="Enter address"
                      value={customerInfo.address}
                      onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Check">Check</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Credit">Store Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {paymentMethod === 'Check' && (
                  <div>
                    <Label>Check Number *</Label>
                    <Input
                      placeholder="Enter check number"
                      value={checkNumber}
                      onChange={(e) => {
                        setCheckNumber(e.target.value);
                        // Clear error when user starts typing
                        if (fieldErrors.checkNumber) {
                          setFieldErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.checkNumber;
                            return newErrors;
                          });
                        }
                      }}
                      className={fieldErrors.checkNumber ? 'border-red-500' : ''}
                    />
                    {fieldErrors.checkNumber && (
                      <p className="text-sm text-red-600 mt-1">{fieldErrors.checkNumber}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Footer Buttons */}
            <div className="space-y-4 pb-8">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {Object.keys(fieldErrors).length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Please correct the following errors:
                    <ul className="list-disc list-inside mt-2">
                      {Object.values(fieldErrors).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => handleComplete(true)}
                  disabled={isLoading}
                  size="lg"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Save as Quote
                </Button>
                <Button
                  onClick={() => handleComplete(false)}
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    'Processing...'
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Customer Agrees
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}