import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { apiCall } from '../utils/supabase/simple-client';
import { Camera, Plus, Trash2, Printer, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface TakeInWizardProps {
  onClose: () => void;
  currentStore: any;
  currentEmployee: any;
  onSuccess: () => void;
}

interface Metal {
  id: string;
  type: string;
  karat: string;
  weight: string;
}

interface Stone {
  id: string;
  type: string;
  color: string;
  lab: string;
  certNo: string;
  size: string;
}

const stoneTypes = [
  'Diamond', 'Fancy Color Diamond', 'Sapphire', 'Ruby', 'Emerald', 
  'Tanzanite', 'Topaz', 'Citrine', 'Aquamarine', 'Garnet', 
  'Amethyst', 'Peridot', 'Tourmaline', 'Spinel', 'Zircon', 
  'Opal', 'Onyx', 'Jade', 'Lapis Lazuli', 'Moonstone'
];

export function TakeInWizard({ onClose, currentStore, currentEmployee, onSuccess }: TakeInWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [batchId] = useState(generateSmartBatchId());
  
  // Item state
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [metals, setMetals] = useState<Metal[]>([]);
  const [stones, setStones] = useState<Stone[]>([]);
  const [watchModel, setWatchModel] = useState('');
  const [watchSerial, setWatchSerial] = useState('');
  const [marketValue, setMarketValue] = useState('');
  const [payoutPercent, setPayoutPercent] = useState('78');
  const [itemNotes, setItemNotes] = useState('');
  const [itemStatus, setItemStatus] = useState('Purchase');
  
  // Customer state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDOB, setCustomerDOB] = useState('');
  const [customerGender, setCustomerGender] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [enableFollowUp, setEnableFollowUp] = useState(false);
  
  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('Check');
  const [checkNumber, setCheckNumber] = useState('');
  const [finalAmount, setFinalAmount] = useState('');

  function generateSmartBatchId(): string {
    const storePrefix = currentStore?.name?.substring(0, 2).toUpperCase() || 'ST';
    const date = new Date();
    const dateStr = date.toISOString().slice(2, 10).replace(/-/g, '');
    const sequence = String.fromCharCode(65 + (date.getHours() % 26));
    return `${storePrefix}01-${dateStr}-${sequence}`;
  }

  const addMetal = () => {
    setMetals([...metals, {
      id: Date.now().toString(),
      type: '',
      karat: '',
      weight: ''
    }]);
  };

  const removeMetal = (id: string) => {
    setMetals(metals.filter(m => m.id !== id));
  };

  const updateMetal = (id: string, field: keyof Metal, value: string) => {
    setMetals(metals.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const addStone = () => {
    setStones([...stones, {
      id: Date.now().toString(),
      type: '',
      color: '',
      lab: '',
      certNo: '',
      size: ''
    }]);
  };

  const removeStone = (id: string) => {
    setStones(stones.filter(s => s.id !== id));
  };

  const updateStone = (id: string, field: keyof Stone, value: string) => {
    setStones(stones.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const calculatePayout = () => {
    const market = parseFloat(marketValue) || 0;
    const percent = parseFloat(payoutPercent) || 0;
    return (market * percent / 100).toFixed(2);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 2) {
        setFinalAmount(calculatePayout());
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateStep = () => {
    setError('');
    
    if (currentStep === 1) {
      if (!category) {
        setError('Please select a category');
        return false;
      }
      if (!subcategory) {
        setError('Please select a subcategory');
        return false;
      }
      if (!marketValue || parseFloat(marketValue) <= 0) {
        setError('Please enter a valid market value');
        return false;
      }
    }
    
    if (currentStep === 2) {
      if (!customerName.trim()) {
        setError('Please enter customer name');
        return false;
      }
      if (!customerPhone.trim()) {
        setError('Please enter customer phone');
        return false;
      }
    }
    
    if (currentStep === 3 && itemStatus !== 'Quote') {
      if (!finalAmount || parseFloat(finalAmount) <= 0) {
        setError('Please enter a valid final amount');
        return false;
      }
      if (paymentMethod === 'Check' && !checkNumber.trim()) {
        setError('Please enter check number');
        return false;
      }
    }
    
    return true;
  };

  const handleNextWithValidation = () => {
    if (validateStep()) {
      handleNext();
    }
  };

  const handleComplete = async () => {
    if (!validateStep()) return;
    
    setIsLoading(true);
    setError('');

    try {
      // Create customer first
      const customerData = {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: customerAddress,
        dob: customerDOB,
        gender: customerGender,
      };

      const { customer } = await apiCall(`/stores/${currentStore.id}/customers`, {
        method: 'POST',
        body: JSON.stringify(customerData),
      });

      // Create batch
      const batchData = {
        smartId: batchId,
        employeeId: currentEmployee.id,
        customerId: customer.id,
        status: itemStatus,
      };

      const { batch } = await apiCall(`/stores/${currentStore.id}/batches`, {
        method: 'POST',
        body: JSON.stringify(batchData),
      });

      // Create item
      const itemData = {
        batchId: batch.id,
        category,
        subcategory,
        status: itemStatus,
        marketValue: parseFloat(marketValue),
        payoutPercent: parseFloat(payoutPercent),
        finalPaid: itemStatus !== 'Quote' ? parseFloat(finalAmount) : 0,
        notes: itemNotes,
        metals: metals.filter(m => m.type && m.karat && m.weight),
        stones: stones.filter(s => s.type),
        watchModel: category === 'watches' ? watchModel : undefined,
        watchSerial: category === 'watches' ? watchSerial : undefined,
      };

      const { item } = await apiCall(`/stores/${currentStore.id}/items`, {
        method: 'POST',
        body: JSON.stringify(itemData),
      });

      // Create payout if it's a purchase
      if (itemStatus !== 'Quote') {
        const payoutData = {
          itemId: item.id,
          customerId: customer.id,
          method: paymentMethod,
          amount: parseFloat(finalAmount),
          checkNumber: paymentMethod === 'Check' ? checkNumber : undefined,
        };

        await apiCall(`/stores/${currentStore.id}/payouts`, {
          method: 'POST',
          body: JSON.stringify(payoutData),
        });
      }

      // Create quote record if needed
      if (itemStatus === 'Quote') {
        const quoteData = {
          batchId: batch.id,
          followUpDate: enableFollowUp ? followUpDate : undefined,
          isConverted: false,
        };

        await apiCall(`/stores/${currentStore.id}/quotes`, {
          method: 'POST',
          body: JSON.stringify(quoteData),
        });
      }

      onSuccess();
      onClose();

    } catch (error: any) {
      console.error('Error completing transaction:', error);
      setError(error.message || 'Failed to complete transaction');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">Batch ID: {batchId}</h3>
            <p className="text-sm text-muted-foreground">Employee: {currentEmployee.name}</p>
            <p className="text-sm text-muted-foreground">Store: {currentStore.name}</p>
          </div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {step < currentStep ? <Check className="w-4 h-4" /> : step}
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Item Details */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Photo Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Item Photos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4 space-y-2">
                    <Button variant="outline">Upload Photos</Button>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="ai-assist" />
                      <label htmlFor="ai-assist" className="text-sm">Enable AI count & describe</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Category & Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Item Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jewelry">Jewelry</SelectItem>
                      <SelectItem value="watches">Watches</SelectItem>
                      <SelectItem value="bullion">Bullion</SelectItem>
                      <SelectItem value="silverware">Silverware</SelectItem>
                      <SelectItem value="stones">Loose Stones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subcategory *</Label>
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ring">Ring</SelectItem>
                      <SelectItem value="necklace">Necklace</SelectItem>
                      <SelectItem value="bracelet">Bracelet</SelectItem>
                      <SelectItem value="earrings">Earrings</SelectItem>
                      <SelectItem value="pendant">Pendant</SelectItem>
                      <SelectItem value="chain">Chain</SelectItem>
                      <SelectItem value="coin">Coin</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={itemStatus} onValueChange={setItemStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Purchase">Complete Purchase</SelectItem>
                      <SelectItem value="Quote">Save as Quote</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metals Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Metals</CardTitle>
                <Button variant="outline" size="sm" onClick={addMetal}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Metal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {metals.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No metals added yet</p>
              ) : (
                <div className="space-y-4">
                  {metals.map((metal) => (
                    <div key={metal.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Select value={metal.type} onValueChange={(value) => updateMetal(metal.id, 'type', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Metal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gold">Gold</SelectItem>
                          <SelectItem value="silver">Silver</SelectItem>
                          <SelectItem value="platinum">Platinum</SelectItem>
                          <SelectItem value="palladium">Palladium</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select value={metal.karat} onValueChange={(value) => updateMetal(metal.id, 'karat', value)}>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="Karat" />
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
                      
                      <Input
                        placeholder="Weight (g)"
                        value={metal.weight}
                        onChange={(e) => updateMetal(metal.id, 'weight', e.target.value)}
                        className="w-32"
                      />
                      
                      <Button variant="ghost" size="sm" onClick={() => removeMetal(metal.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stones Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Stones</CardTitle>
                <Button variant="outline" size="sm" onClick={addStone}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stones.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No stones added yet</p>
              ) : (
                <div className="space-y-4">
                  {stones.map((stone) => (
                    <div key={stone.id} className="grid grid-cols-6 gap-4 p-4 border rounded-lg">
                      <Select value={stone.type} onValueChange={(value) => updateStone(stone.id, 'type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {stoneTypes.map((type) => (
                            <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '-')}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Input
                        placeholder="Color"
                        value={stone.color}
                        onChange={(e) => updateStone(stone.id, 'color', e.target.value)}
                      />
                      
                      <Input
                        placeholder="Lab"
                        value={stone.lab}
                        onChange={(e) => updateStone(stone.id, 'lab', e.target.value)}
                      />
                      
                      <Input
                        placeholder="Cert #"
                        value={stone.certNo}
                        onChange={(e) => updateStone(stone.id, 'certNo', e.target.value)}
                      />
                      
                      <Input
                        placeholder="Size (mm)"
                        value={stone.size}
                        onChange={(e) => updateStone(stone.id, 'size', e.target.value)}
                      />
                      
                      <Button variant="ghost" size="sm" onClick={() => removeStone(stone.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Watch Fields (conditional) */}
          {category === 'watches' && (
            <Card>
              <CardHeader>
                <CardTitle>Watch Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Model</Label>
                    <Input
                      placeholder="Start typing for suggestions..."
                      value={watchModel}
                      onChange={(e) => setWatchModel(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Serial Number</Label>
                    <Input
                      placeholder="Enter serial number"
                      value={watchSerial}
                      onChange={(e) => setWatchSerial(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Market Value *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={marketValue}
                    onChange={(e) => setMarketValue(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payout %</Label>
                  <Input
                    type="number"
                    value={payoutPercent}
                    onChange={(e) => setPayoutPercent(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Calculated Payout</Label>
                  <Input
                    value={`$${calculatePayout()}`}
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
              <CardTitle>Item Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any additional notes about this item..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Customer Information */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <Button variant="outline" size="lg">
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Driver's License
                </Button>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    placeholder="Enter full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={customerGender} onValueChange={setCustomerGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={customerDOB}
                    onChange={(e) => setCustomerDOB(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input
                    placeholder="Enter phone number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  placeholder="Enter full address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  rows={3}
                />
              </div>

              {itemStatus === 'Quote' && (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="follow-up" 
                      checked={enableFollowUp}
                      onChange={(e) => setEnableFollowUp(e.target.checked)}
                    />
                    <Label htmlFor="follow-up">Set follow-up reminder</Label>
                  </div>
                  {enableFollowUp && (
                    <Input
                      type="date"
                      className="mt-2"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      placeholder="Follow-up date"
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Payment (only if not Quote) */}
      {currentStep === 3 && itemStatus !== 'Quote' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Check Number *</Label>
                    <Input
                      placeholder="Enter check number"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(e.target.value)}
                    />
                  </div>
                  <div className="text-center">
                    <Button variant="outline">
                      <Camera className="w-4 h-4 mr-2" />
                      Photo Check (OCR)
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Final Amount *</Label>
                <Input
                  type="number"
                  value={finalAmount}
                  onChange={(e) => setFinalAmount(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Review & Labels */}
      {currentStep === 4 || (currentStep === 3 && itemStatus === 'Quote') && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Review & Print Labels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Transaction Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Batch ID:</strong> {batchId}
                  </div>
                  <div>
                    <strong>Employee:</strong> {currentEmployee.name}
                  </div>
                  <div>
                    <strong>Customer:</strong> {customerName}
                  </div>
                  <div>
                    <strong>Status:</strong> {itemStatus}
                  </div>
                  <div>
                    <strong>Category:</strong> {category} - {subcategory}
                  </div>
                  {itemStatus !== 'Quote' && (
                    <div>
                      <strong>Amount:</strong> ${finalAmount}
                    </div>
                  )}
                  {itemStatus === 'Quote' && (
                    <div>
                      <strong>Market Value:</strong> ${marketValue}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Label Options</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="batch-qr" defaultChecked />
                    <Label htmlFor="batch-qr">Batch QR Code</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="item-qr" />
                    <Label htmlFor="item-qr">Individual Item QR</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Print Format</Label>
                  <Select defaultValue="thermal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thermal">Thermal Printer</SelectItem>
                      <SelectItem value="a4">A4 Sheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
          )}
        </div>
        
        <div className="space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
          {currentStep < 4 && !(currentStep === 3 && itemStatus === 'Quote') && (
            <Button onClick={handleNextWithValidation} disabled={isLoading}>Next</Button>
          )}
          {(currentStep === 4 || (currentStep === 3 && itemStatus === 'Quote')) && (
            <>
              <Button variant="outline" disabled={isLoading}>
                <Printer className="w-4 h-4 mr-2" />
                Print Labels
              </Button>
              <Button onClick={handleComplete} disabled={isLoading}>
                {isLoading 
                  ? 'Processing...' 
                  : itemStatus === 'Quote' 
                    ? 'Save Quote' 
                    : 'Complete Transaction'
                }
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}