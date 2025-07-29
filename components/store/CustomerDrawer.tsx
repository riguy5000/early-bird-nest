import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Scan, 
  Camera, 
  Edit,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Save,
  X
} from 'lucide-react';

interface CustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  onCustomerUpdate: (customer: any) => void;
}

export function CustomerDrawer({ isOpen, onClose, customer, onCustomerUpdate }: CustomerDrawerProps) {
  const [editMode, setEditMode] = useState(!customer);
  const [formData, setFormData] = useState(customer || {
    name: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    licenseNumber: ''
  });

  const handleSave = () => {
    onCustomerUpdate(formData);
    setEditMode(false);
  };

  const handleLicenseScan = () => {
    // Mock OCR data - in real app would use camera/scanner
    const mockOcrData = {
      name: 'John Smith',
      dateOfBirth: '1985-03-15',
      address: '123 Main St, Anytown, ST 12345',
      gender: 'M',
      licenseNumber: 'DL123456789'
    };
    
    setFormData({ ...formData, ...mockOcrData });
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[80vh] sm:h-auto sm:side-right sm:w-[420px]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <SheetTitle>Customer Information</SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              {customer && !editMode && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditMode(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
              {editMode && (
                <Button 
                  size="sm" 
                  onClick={handleSave}
                  className="flex items-center gap-1"
                >
                  <Save className="h-4 w-4" />
                  Save
                </Button>
              )}
            </div>
          </div>
          <SheetDescription>
            {editMode ? 'Enter customer details or scan driver license' : 'Customer details for this transaction'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Quick Actions */}
          {editMode && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Quick Entry</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleLicenseScan}
                  className="flex-1 flex items-center gap-2"
                >
                  <Scan className="h-4 w-4" />
                  Scan License
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Photo OCR
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Personal Information</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Full Name *</Label>
                {editMode ? (
                  <Input 
                    value={formData.name} 
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter full name"
                  />
                ) : (
                  <div className="mt-1 text-sm">{customer?.name || 'Not provided'}</div>
                )}
              </div>

              <div>
                <Label>Date of Birth</Label>
                {editMode ? (
                  <Input 
                    type="date"
                    value={formData.dateOfBirth} 
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  />
                ) : (
                  <div className="mt-1 text-sm">{customer?.dateOfBirth || 'Not provided'}</div>
                )}
              </div>

              <div>
                <Label>Gender</Label>
                {editMode ? (
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => updateField('gender', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 text-sm">{customer?.gender || 'Not provided'}</div>
                )}
              </div>

              <div className="col-span-2">
                <Label>Driver License #</Label>
                {editMode ? (
                  <Input 
                    value={formData.licenseNumber} 
                    onChange={(e) => updateField('licenseNumber', e.target.value)}
                    placeholder="Enter license number"
                  />
                ) : (
                  <div className="mt-1 text-sm font-mono">{customer?.licenseNumber || 'Not provided'}</div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Contact Information</Label>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Email Address</Label>
                {editMode ? (
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="customer@example.com"
                  />
                ) : (
                  <div className="mt-1 text-sm flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {customer?.email || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <Label>Phone Number</Label>
                {editMode ? (
                  <Input 
                    type="tel"
                    value={formData.phone} 
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                ) : (
                  <div className="mt-1 text-sm flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {customer?.phone || 'Not provided'}
                  </div>
                )}
              </div>

              <div>
                <Label>Address</Label>
                {editMode ? (
                  <Textarea 
                    value={formData.address} 
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                ) : (
                  <div className="mt-1 text-sm flex items-start gap-2">
                    <MapPin className="h-3 w-3 mt-0.5" />
                    <span>{customer?.address || 'Not provided'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Customer Status/Notes */}
          {!editMode && customer && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Customer Status</Label>
                <div className="flex gap-2">
                  <Badge variant="outline">First Time Customer</Badge>
                  <Badge variant="secondary">Verified ID</Badge>
                </div>
              </div>
            </>
          )}

          {/* Compliance Notice */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Compliance Required</p>
                <p>Valid government-issued photo ID required for all transactions. Customer information is kept confidential and used for regulatory compliance only.</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}