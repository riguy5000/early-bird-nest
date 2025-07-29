import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronUp,
  Camera,
  Upload,
  X,
  Zap,
  Settings,
  Eye,
  Calculator,
  Package
} from 'lucide-react';

interface TakeInBalancedProps {
  items: any[];
  activeItemId: string | null;
  onItemAdd: () => void;
  onItemUpdate: (itemId: string, updates: any) => void;
  onItemRemove: (itemId: string) => void;
  onItemSelect: (itemId: string) => void;
  store: any;
}

export function TakeInBalanced({
  items,
  activeItemId,
  onItemAdd,
  onItemUpdate,
  onItemRemove,
  onItemSelect,
  store
}: TakeInBalancedProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [quickControls, setQuickControls] = useState({
    selectedCategories: ['Jewelry'],
    itemCount: 1
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const addMetal = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newMetal = {
      id: `metal_${Date.now()}`,
      type: 'Gold',
      karat: 14,
      weight: 0
    };

    onItemUpdate(itemId, {
      metals: [...item.metals, newMetal]
    });
  };

  const removeMetal = (itemId: string, metalId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    onItemUpdate(itemId, {
      metals: item.metals.filter((m: any) => m.id !== metalId)
    });
  };

  const updateMetal = (itemId: string, metalId: string, updates: any) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const updatedMetals = item.metals.map((m: any) => 
      m.id === metalId ? { ...m, ...updates } : m
    );

    // Recalculate pricing
    const totalWeight = updatedMetals.reduce((sum: number, m: any) => sum + (m.weight || 0), 0);
    const marketValue = totalWeight * 50; // Mock pricing
    const payoutAmount = marketValue * (item.payoutPercentage / 100);

    onItemUpdate(itemId, {
      metals: updatedMetals,
      marketValue,
      payoutAmount
    });
  };

  const addStone = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newStone = {
      id: `stone_${Date.now()}`,
      type: 'Diamond',
      color: 'Clear',
      size: 0
    };

    onItemUpdate(itemId, {
      stones: [...item.stones, newStone]
    });
  };

  const removeStone = (itemId: string, stoneId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    onItemUpdate(itemId, {
      stones: item.stones.filter((s: any) => s.id !== stoneId)
    });
  };

  const updateStone = (itemId: string, stoneId: string, updates: any) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    onItemUpdate(itemId, {
      stones: item.stones.map((s: any) => 
        s.id === stoneId ? { ...s, ...updates } : s
      )
    });
  };

  const handlePhotoUpload = (itemId: string, files: FileList) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    // Mock photo URLs - in real app would upload to storage
    const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
    
    onItemUpdate(itemId, {
      photos: [...item.photos, ...newPhotos]
    });
  };

  const removePhoto = (itemId: string, photoIndex: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    onItemUpdate(itemId, {
      photos: item.photos.filter((_: any, index: number) => index !== photoIndex)
    });
  };

  const activeItem = items.find(item => item.id === activeItemId);

  return (
    <div className="flex flex-col h-full">
      {/* Quick Controls */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Categories:</Label>
            <div className="flex gap-1">
              {['Jewelry', 'Watch', 'Bullion', 'Stones', 'Silverware'].map(category => (
                <Badge 
                  key={category}
                  variant={quickControls.selectedCategories.includes(category) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    setQuickControls(prev => ({
                      ...prev,
                      selectedCategories: prev.selectedCategories.includes(category)
                        ? prev.selectedCategories.filter(c => c !== category)
                        : [...prev.selectedCategories, category]
                    }));
                  }}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Count:</Label>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuickControls(prev => ({ ...prev, itemCount: Math.max(1, prev.itemCount - 1) }))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm">{quickControls.itemCount}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setQuickControls(prev => ({ ...prev, itemCount: prev.itemCount + 1 }))}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Button onClick={onItemAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>

          <Button variant="outline" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            AI Assist
          </Button>
        </div>
      </div>

      {/* Item Tabs */}
      <div className="flex-1 overflow-hidden">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No items added yet</h3>
              <p className="text-muted-foreground mb-4">Add your first item to get started</p>
              <Button onClick={onItemAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            </div>
          </div>
        ) : (
          <Tabs value={activeItemId || ''} onValueChange={onItemSelect} className="h-full flex flex-col">
            <TabsList className="w-full justify-start px-4 overflow-x-auto">
              {items.map((item, index) => (
                <TabsTrigger 
                  key={item.id} 
                  value={item.id}
                  className="flex items-center gap-2 relative"
                >
                  <span>Item {index + 1}</span>
                  {item.category && (
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemRemove(item.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </TabsTrigger>
              ))}
            </TabsList>

            {items.map(item => (
              <TabsContent 
                key={item.id} 
                value={item.id} 
                className="flex-1 overflow-auto p-4"
              >
                <div className="max-w-4xl mx-auto space-y-6">
                  {/* Basic Item Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Item Details</span>
                        <div className="flex items-center gap-2">
                          {!store.hidePayout && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">
                                ${item.payoutAmount?.toFixed(2) || '0.00'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Payout ({item.payoutPercentage}%)
                              </div>
                            </div>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Category</Label>
                          <Select 
                            value={item.category} 
                            onValueChange={(value) => onItemUpdate(item.id, { category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Jewelry">Jewelry</SelectItem>
                              <SelectItem value="Watch">Watch</SelectItem>
                              <SelectItem value="Bullion">Bullion</SelectItem>
                              <SelectItem value="Stones">Stones</SelectItem>
                              <SelectItem value="Silverware">Silverware</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Sub-type</Label>
                          <Input 
                            value={item.subType || ''} 
                            onChange={(e) => onItemUpdate(item.id, { subType: e.target.value })}
                            placeholder="Ring, Necklace, etc."
                          />
                        </div>
                      </div>

                      {/* Metals Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Metals</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addMetal(item.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Metal
                          </Button>
                        </div>
                        
                        {item.metals?.map((metal: any, index: number) => (
                          <div key={metal.id} className="grid grid-cols-4 gap-2 p-3 border rounded-lg">
                            <div>
                              <Label className="text-sm">Type</Label>
                              <Select 
                                value={metal.type} 
                                onValueChange={(value) => updateMetal(item.id, metal.id, { type: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Gold">Gold</SelectItem>
                                  <SelectItem value="Silver">Silver</SelectItem>
                                  <SelectItem value="Platinum">Platinum</SelectItem>
                                  <SelectItem value="Palladium">Palladium</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm">Karat</Label>
                              <Select 
                                value={metal.karat?.toString()} 
                                onValueChange={(value) => updateMetal(item.id, metal.id, { karat: parseInt(value) })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="8">8K</SelectItem>
                                  <SelectItem value="10">10K</SelectItem>
                                  <SelectItem value="14">14K</SelectItem>
                                  <SelectItem value="18">18K</SelectItem>
                                  <SelectItem value="22">22K</SelectItem>
                                  <SelectItem value="24">24K</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm">Weight (g)</Label>
                              <Input 
                                type="number" 
                                step="0.01"
                                value={metal.weight || ''} 
                                onChange={(e) => updateMetal(item.id, metal.id, { weight: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                autoFocus={index === 0}
                              />
                            </div>

                            <div className="flex items-end">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => removeMetal(item.id, metal.id)}
                                className="w-full"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Advanced Details */}
                  <Collapsible 
                    open={expandedItems.has(item.id)} 
                    onOpenChange={() => toggleExpanded(item.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Advanced Details</CardTitle>
                            {expandedItems.has(item.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <Card>
                        <CardContent className="pt-6 space-y-6">
                          {/* Stones Section */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-medium">Stones</Label>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => addStone(item.id)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Stone
                              </Button>
                            </div>
                            
                            {item.stones?.map((stone: any) => (
                              <div key={stone.id} className="grid grid-cols-5 gap-2 p-3 border rounded-lg">
                                <div>
                                  <Label className="text-sm">Type</Label>
                                  <Select 
                                    value={stone.type} 
                                    onValueChange={(value) => updateStone(item.id, stone.id, { type: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Diamond">Diamond</SelectItem>
                                      <SelectItem value="Ruby">Ruby</SelectItem>
                                      <SelectItem value="Sapphire">Sapphire</SelectItem>
                                      <SelectItem value="Emerald">Emerald</SelectItem>
                                      <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-sm">Color</Label>
                                  <Input 
                                    value={stone.color} 
                                    onChange={(e) => updateStone(item.id, stone.id, { color: e.target.value })}
                                    placeholder="Clear, Blue, etc."
                                  />
                                </div>

                                <div>
                                  <Label className="text-sm">Size (ct)</Label>
                                  <Input 
                                    type="number" 
                                    step="0.01"
                                    value={stone.size || ''} 
                                    onChange={(e) => updateStone(item.id, stone.id, { size: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                  />
                                </div>

                                <div>
                                  <Label className="text-sm">Lab Cert #</Label>
                                  <Input 
                                    value={stone.labCert || ''} 
                                    onChange={(e) => updateStone(item.id, stone.id, { labCert: e.target.value })}
                                    placeholder="Optional"
                                  />
                                </div>

                                <div className="flex items-end">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => removeStone(item.id, stone.id)}
                                    className="w-full"
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Watch Info */}
                          {item.category === 'Watch' && (
                            <div className="space-y-4">
                              <Label className="text-base font-medium">Watch Information</Label>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>Brand</Label>
                                  <Input 
                                    value={item.watchInfo?.brand || ''} 
                                    onChange={(e) => onItemUpdate(item.id, { 
                                      watchInfo: { ...item.watchInfo, brand: e.target.value }
                                    })}
                                    placeholder="Rolex, Omega, etc."
                                  />
                                </div>
                                <div>
                                  <Label>Model</Label>
                                  <Input 
                                    value={item.watchInfo?.model || ''} 
                                    onChange={(e) => onItemUpdate(item.id, { 
                                      watchInfo: { ...item.watchInfo, model: e.target.value }
                                    })}
                                    placeholder="Submariner, Speedmaster, etc."
                                  />
                                </div>
                                <div>
                                  <Label>Serial Number</Label>
                                  <Input 
                                    value={item.watchInfo?.serial || ''} 
                                    onChange={(e) => onItemUpdate(item.id, { 
                                      watchInfo: { ...item.watchInfo, serial: e.target.value }
                                    })}
                                  />
                                </div>
                                <div>
                                  <Label>Condition</Label>
                                  <Select 
                                    value={item.watchInfo?.condition || ''} 
                                    onValueChange={(value) => onItemUpdate(item.id, { 
                                      watchInfo: { ...item.watchInfo, condition: value }
                                    })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select condition" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Excellent">Excellent</SelectItem>
                                      <SelectItem value="Good">Good</SelectItem>
                                      <SelectItem value="Fair">Fair</SelectItem>
                                      <SelectItem value="Poor">Poor</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Photos */}
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Photos</Label>
                            <div className="grid grid-cols-4 gap-4">
                              {item.photos?.map((photo: string, index: number) => (
                                <div key={index} className="relative">
                                  <img 
                                    src={photo} 
                                    alt={`Item photo ${index + 1}`}
                                    className="w-full h-24 object-cover rounded-lg border"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                    onClick={() => removePhoto(item.id, index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              
                              <div 
                                className="flex items-center justify-center h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <div className="text-center">
                                  <Camera className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Add Photo</p>
                                </div>
                              </div>
                            </div>
                            
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files) {
                                  handlePhotoUpload(item.id, e.target.files);
                                }
                              }}
                            />
                          </div>

                          {/* Notes */}
                          <div>
                            <Label>Notes</Label>
                            <Textarea 
                              value={item.notes || ''} 
                              onChange={(e) => onItemUpdate(item.id, { notes: e.target.value })}
                              placeholder="Additional notes about this item..."
                              rows={3}
                            />
                          </div>

                          {/* Test Method & Status */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Test Method</Label>
                              <Select 
                                value={item.testMethod || ''} 
                                onValueChange={(value) => onItemUpdate(item.id, { testMethod: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Loop">Loop</SelectItem>
                                  <SelectItem value="Acid">Acid</SelectItem>
                                  <SelectItem value="XRF">XRF</SelectItem>
                                  <SelectItem value="Melt">Melt</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label>Status</Label>
                              <Select 
                                value={item.status || 'In Stock'} 
                                onValueChange={(value) => onItemUpdate(item.id, { status: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="In Stock">In Stock</SelectItem>
                                  <SelectItem value="Melted">Melted</SelectItem>
                                  <SelectItem value="Resold">Resold</SelectItem>
                                  <SelectItem value="Used Toward Sale">Used Toward Sale</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
}