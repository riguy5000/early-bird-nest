import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { GooglePlacesAutocomplete, type PlaceDetails } from './GooglePlacesAutocomplete';
import { Mail, Phone, Calendar, Save, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  altPhone: string; // kept on the type for backwards compatibility, no longer in UI
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
}

interface CustomerFormProps {
  customer?: CustomerData | null;
  isEditing?: boolean;
  onSave: (customer: CustomerData) => void;
  onCancel: () => void;
}

export function CustomerForm({ customer, isEditing = false, onSave, onCancel }: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerData>({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    altPhone: customer?.altPhone || '',
    dateOfBirth: customer?.dateOfBirth || '',
    address: customer?.address || '',
    placeId: customer?.placeId || '',
    addressDetails: customer?.addressDetails || null,
    city: customer?.city || '',
    state: customer?.state || '',
    zipCode: customer?.zipCode || '',
    idType: customer?.idType || '',
    idNumber: customer?.idNumber || '',
    notes: customer?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const idTypes = [
    { value: 'drivers_license', label: "Driver's License" },
    { value: 'state_id', label: 'State ID' },
    { value: 'passport', label: 'Passport' },
    { value: 'military_id', label: 'Military ID' },
    { value: 'other', label: 'Other' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.idType) newErrors.idType = 'ID type is required';
    if (!formData.idNumber.trim()) newErrors.idNumber = 'ID number is required';

    if (formData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(formData.dateOfBirth);
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) newErrors.dateOfBirth = 'Customer must be at least 18 years old';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceSelect = (place: PlaceDetails) => {
    setFormData((prev) => ({
      ...prev,
      address: place.streetAddress || place.formattedAddress || prev.address,
      placeId: place.placeId,
      addressDetails: place,
      city: place.city || prev.city,
      state: place.state || prev.state,
      zipCode: place.postalCode || prev.zipCode,
    }));
    if (errors.address) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.address;
        return next;
      });
    }
  };

  const handleAddressInputChange = (value: string) => {
    setFormData((prev) => ({ ...prev, address: value, placeId: '', addressDetails: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }
    setIsLoading(true);
    try {
      onSave(formData);
      toast.success(isEditing ? 'Customer updated successfully!' : 'Customer added successfully!');
    } catch {
      toast.error(isEditing ? 'Failed to update customer' : 'Failed to add customer');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    if (numbers.length >= 3) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    return numbers;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* PERSONAL INFORMATION */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={(e) => setFormData((p) => ({ ...p, firstName: e.target.value }))}
              className={errors.firstName ? 'border-destructive' : ''}
            />
            {errors.firstName && (
              <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={(e) => setFormData((p) => ({ ...p, lastName: e.target.value }))}
              className={errors.lastName ? 'border-destructive' : ''}
            />
            {errors.lastName && (
              <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="dateOfBirth"
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
              className={`pl-10 ${errors.dateOfBirth ? 'border-destructive' : ''}`}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          {errors.dateOfBirth && (
            <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.dateOfBirth}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* CONTACT INFORMATION */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Primary Phone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: formatPhoneNumber(e.target.value) }))}
                className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                maxLength={14}
              />
            </div>
            {errors.phone && (
              <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.email}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* ADDRESS */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Address</h3>
        <GooglePlacesAutocomplete
          id="customerAddress"
          label="Home Address"
          placeholder="Start typing the customer's street address..."
          value={formData.address}
          required
          error={errors.address}
          onPlaceSelect={handlePlaceSelect}
          onInputChange={handleAddressInputChange}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              placeholder="City"
              value={formData.city}
              onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              placeholder="State"
              value={formData.state}
              onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value.toUpperCase() }))}
              maxLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              placeholder="12345"
              value={formData.zipCode}
              onChange={(e) => setFormData((p) => ({ ...p, zipCode: e.target.value }))}
              maxLength={10}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* IDENTIFICATION */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Identification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="idType">ID Type *</Label>
            <Select
              value={formData.idType}
              onValueChange={(value) => setFormData((p) => ({ ...p, idType: value }))}
            >
              <SelectTrigger className={errors.idType ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                {idTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.idType && (
              <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.idType}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="idNumber">ID Number *</Label>
            <Input
              id="idNumber"
              placeholder="Enter ID number"
              value={formData.idNumber}
              onChange={(e) => setFormData((p) => ({ ...p, idNumber: e.target.value }))}
              className={errors.idNumber ? 'border-destructive' : ''}
            />
            {errors.idNumber && (
              <p className="text-destructive text-sm flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.idNumber}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* ADDITIONAL NOTES */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold">Additional Notes</h3>
        <div className="space-y-2">
          <Label htmlFor="notes">Customer Notes</Label>
          <Textarea
            id="notes"
            placeholder="Add any additional notes about this customer..."
            value={formData.notes}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            rows={3}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" /> Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              {isEditing ? 'Updating...' : 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Customer' : 'Add Customer'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
