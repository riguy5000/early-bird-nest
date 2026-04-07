import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { GooglePlacesAutocomplete } from '../GooglePlacesAutocomplete';
import { ArrowLeft, ArrowRight, Store, User, CheckCircle, Phone, Mail, Eye, EyeOff, Building } from 'lucide-react';
import { toast } from 'sonner';
import { AuthFlow } from '../AuthenticationFlow';

interface RegistrationWizardProps {
  onComplete: (userData: any, remember: boolean) => void;
  onNavigate: (flow: AuthFlow) => void;
}

interface StoreDetails {
  storeName: string;
  storeType: string;
  address: string;
  placeId: string;
  addressDetails: any;
  phone: string;
  email: string;
  employeeCount: number;
}

interface OwnerAccount {
  fullName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export function RegistrationWizard({ onComplete, onNavigate }: RegistrationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });

  const [storeDetails, setStoreDetails] = useState<StoreDetails>({
    storeName: '',
    storeType: '',
    address: '',
    placeId: '',
    addressDetails: null,
    phone: '',
    email: '',
    employeeCount: 1
  });

  const [ownerAccount, setOwnerAccount] = useState<OwnerAccount>({
    fullName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { number: 1, title: 'Store Details', icon: Store },
    { number: 2, title: 'Owner Account', icon: User },
    { number: 3, title: 'Confirmation', icon: CheckCircle }
  ];

  const storeTypes = [
    { value: 'jewelry', label: 'Jewelry Store' },
    { value: 'pawn', label: 'Pawn Shop' },
    { value: 'estate', label: 'Estate Jewelry' },
    { value: 'hybrid', label: 'Hybrid (Jewelry + Pawn)' }
  ];

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!storeDetails.storeName.trim()) newErrors.storeName = 'Store name is required';
    if (!storeDetails.storeType) newErrors.storeType = 'Store type is required';
    if (!storeDetails.address.trim()) newErrors.address = 'Address is required';
    if (!storeDetails.placeId) newErrors.address = 'Please select an address from the suggestions';
    if (!storeDetails.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(storeDetails.email)) newErrors.email = 'Please enter a valid email';
    if (!storeDetails.phone.trim()) newErrors.phone = 'Phone number is required';
    if (storeDetails.employeeCount < 1) newErrors.employeeCount = 'Must have at least 1 employee';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!ownerAccount.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!ownerAccount.ownerEmail.trim()) newErrors.ownerEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(ownerAccount.ownerEmail)) newErrors.ownerEmail = 'Please enter a valid email';
    else if (ownerAccount.ownerEmail !== storeDetails.email) newErrors.ownerEmail = 'Must match store email';
    
    if (!ownerAccount.password) newErrors.password = 'Password is required';
    else if (ownerAccount.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(ownerAccount.password)) newErrors.password = 'Password must contain at least one uppercase letter';
    else if (!/[0-9]/.test(ownerAccount.password)) newErrors.password = 'Password must contain at least one number';
    
    if (ownerAccount.password !== ownerAccount.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!ownerAccount.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    return Math.min(strength, 100);
  };

  const getStrengthLabel = (strength: number) => {
    if (strength < 25) return 'Very Weak';
    if (strength < 50) return 'Weak';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const handlePlaceSelect = (placeDetails: any) => {
    setStoreDetails(prev => ({
      ...prev,
      address: placeDetails.formattedAddress,
      placeId: placeDetails.placeId,
      addressDetails: placeDetails
    }));
    
    // Clear address error if it exists
    if (errors.address) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.address;
        return newErrors;
      });
    }
  };

  const handleAddressInputChange = (value: string) => {
    setStoreDetails(prev => ({
      ...prev,
      address: value,
      placeId: '',
      addressDetails: null
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Call the edge function to register store + auth user
      const { data, error } = await supabase.functions.invoke('employee-management', {
        body: {
          action: 'register-store',
          email: ownerAccount.ownerEmail,
          password: ownerAccount.password,
          fullName: ownerAccount.fullName,
          store: {
            name: storeDetails.storeName,
            type: storeDetails.storeType,
            address: storeDetails.address,
            phone: storeDetails.phone,
            email: storeDetails.email,
          },
        },
      });

      if (error || data?.error) {
        throw new Error(data?.error || error?.message || 'Registration failed');
      }

      // Now sign in the user
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: ownerAccount.ownerEmail,
        password: ownerAccount.password,
      });

      if (signInError) throw signInError;

      // Resolve profile
      const { data: profileData, error: profileError } = await supabase.functions.invoke('employee-management', {
        body: { action: 'resolve-profile' },
      });

      if (profileError || profileData?.error) {
        throw new Error(profileData?.error || 'Failed to load profile');
      }

      const { profile, store, permissions, visibility } = profileData;
      const userData = {
        id: profile.id,
        authUserId: authData.user?.id,
        email: profile.email,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        role: profile.role,
        storeId: profile.store_id,
        store: store ? { id: store.id, name: store.name, type: store.type, address: store.address, phone: store.phone, email: store.email, timezone: store.timezone } : null,
        permissions: permissions ? {
          accessTakeIn: permissions.can_access_take_in, accessInventory: permissions.can_access_inventory,
          accessCustomers: permissions.can_access_customers, accessPayouts: permissions.can_access_payouts,
          accessStatistics: permissions.can_access_statistics, accessSettings: permissions.can_access_settings,
          accessSavedForLater: permissions.can_access_saved_for_later, canEditRates: permissions.can_edit_rates,
          canEditFinalPayout: permissions.can_edit_final_payout_amount, canPrintLabels: permissions.can_print_labels,
          canPrintReceipts: permissions.can_print_receipts, canDeleteItems: permissions.can_delete_items,
          canCompletePurchase: permissions.can_complete_purchase, canReopenTransactions: permissions.can_reopen_transactions,
        } : null,
        visibility: visibility ? {
          hideProfit: visibility.hide_profit, hidePercentagePaid: visibility.hide_percentage_paid,
          hideMarketValue: visibility.hide_market_value, hideTotalPayoutBreakdown: visibility.hide_total_payout_breakdown,
          hideAverageRate: visibility.hide_average_rate,
        } : null,
        isActive: profile.is_active,
      };
      
      toast.success('Store created successfully! Welcome aboard!');
      onComplete(userData, false);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to create store. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-0 h-auto"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex-1">
            <CardTitle className="text-xl">Create Your Store</CardTitle>
            <CardDescription>
              Set up your jewelry & pawn management system in 3 easy steps
            </CardDescription>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{Math.round(progressPercentage)}% complete</span>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isComplete = currentStep > step.number;
            
            return (
              <div key={step.number} className="flex flex-col items-center space-y-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  isComplete ? 'bg-primary border-primary text-primary-foreground' :
                  isActive ? 'border-primary text-primary' : 'border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {isComplete ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step 1: Store Details */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store Name *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="storeName"
                  placeholder="Enter your store name"
                  value={storeDetails.storeName}
                  onChange={(e) => setStoreDetails(prev => ({ ...prev, storeName: e.target.value }))}
                  className="pl-10"
                  autoFocus
                />
              </div>
              {errors.storeName && <p className="text-destructive text-sm">{errors.storeName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeType">Store Type *</Label>
              <Select value={storeDetails.storeType} onValueChange={(value) => setStoreDetails(prev => ({ ...prev, storeType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your store type" />
                </SelectTrigger>
                <SelectContent>
                  {storeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.storeType && <p className="text-destructive text-sm">{errors.storeType}</p>}
            </div>

            {/* Google Places Autocomplete for Address */}
            <GooglePlacesAutocomplete
              id="storeAddress"
              label="Store Address"
              placeholder="Start typing your store address..."
              value={storeDetails.address}
              required={true}
              error={errors.address}
              onPlaceSelect={handlePlaceSelect}
              onInputChange={handleAddressInputChange}
              types={['establishment', 'geocode']}
              componentRestrictions={{ country: 'us' }}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={storeDetails.phone}
                    onChange={(e) => setStoreDetails(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                {errors.phone && <p className="text-destructive text-sm">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount">Number of Employees *</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={storeDetails.employeeCount}
                  onChange={(e) => setStoreDetails(prev => ({ ...prev, employeeCount: parseInt(e.target.value) || 1 }))}
                />
                {errors.employeeCount && <p className="text-destructive text-sm">{errors.employeeCount}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeEmail">Store Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="storeEmail"
                  type="email"
                  placeholder="store@example.com"
                  value={storeDetails.email}
                  onChange={(e) => setStoreDetails(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                />
              </div>
              {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Owner Account */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  value={ownerAccount.fullName}
                  onChange={(e) => setOwnerAccount(prev => ({ ...prev, fullName: e.target.value }))}
                  className="pl-10"
                  autoFocus
                />
              </div>
              {errors.fullName && <p className="text-destructive text-sm">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Owner Email (Username) *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="ownerEmail"
                  type="email"
                  placeholder="Must match store email"
                  value={ownerAccount.ownerEmail}
                  onChange={(e) => setOwnerAccount(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  className="pl-10"
                />
              </div>
              {errors.ownerEmail && <p className="text-destructive text-sm">{errors.ownerEmail}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerPhone">Phone (Optional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="ownerPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={ownerAccount.ownerPhone}
                  onChange={(e) => setOwnerAccount(prev => ({ ...prev, ownerPhone: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPasswords.password ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={ownerAccount.password}
                  onChange={(e) => setOwnerAccount(prev => ({ ...prev, password: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, password: !prev.password }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {ownerAccount.password && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Password strength:</span>
                    <span className={getPasswordStrength(ownerAccount.password) >= 75 ? 'text-green-600' : 'text-yellow-600'}>
                      {getStrengthLabel(getPasswordStrength(ownerAccount.password))}
                    </span>
                  </div>
                  <Progress value={getPasswordStrength(ownerAccount.password)} className="h-2" />
                </div>
              )}
              
              {errors.password && <p className="text-destructive text-sm">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={ownerAccount.confirmPassword}
                  onChange={(e) => setOwnerAccount(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-destructive text-sm">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={ownerAccount.agreeToTerms}
                onCheckedChange={(checked) => setOwnerAccount(prev => ({ ...prev, agreeToTerms: checked as boolean }))}
                className="mt-0.5"
              />
              <div className="text-sm">
                <Label htmlFor="terms" className="font-normal">
                  I agree to the{' '}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="link" className="px-0 h-auto text-sm underline">
                        Terms and Conditions
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Terms and Conditions</DialogTitle>
                        <DialogDescription>
                          Please read our terms and conditions carefully.
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-96">
                        <div className="space-y-4 text-sm">
                          <p>By using our jewelry & pawn management system, you agree to:</p>
                          <ul className="list-disc pl-6 space-y-2">
                            <li>Comply with all applicable laws and regulations</li>
                            <li>Maintain accurate records of all transactions</li>
                            <li>Protect customer information and privacy</li>
                            <li>Use the system only for legitimate business purposes</li>
                            <li>Pay subscription fees on time</li>
                            <li>Report any security vulnerabilities immediately</li>
                          </ul>
                          <p>We reserve the right to:</p>
                          <ul className="list-disc pl-6 space-y-2">
                            <li>Suspend accounts for violations</li>
                            <li>Update terms with 30 days notice</li>
                            <li>Backup and secure your data</li>
                            <li>Provide customer support</li>
                          </ul>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                  {' '}and{' '}
                  <Button variant="link" className="px-0 h-auto text-sm underline">
                    Privacy Policy
                  </Button>
                </Label>
              </div>
            </div>
            {errors.agreeToTerms && <p className="text-destructive text-sm">{errors.agreeToTerms}</p>}
          </div>
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Review Your Information</h3>
              <p className="text-muted-foreground">
                Please review your details before creating your store account.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Store Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{storeDetails.storeName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium">{storeTypes.find(t => t.value === storeDetails.storeType)?.label}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Address:</span>
                    <p className="font-medium">{storeDetails.address}</p>
                    {storeDetails.placeId && (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3 w-3" />
                        Address verified with Google Places
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{storeDetails.phone}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Employees:</span>
                    <p className="font-medium">{storeDetails.employeeCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Owner Account
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{ownerAccount.fullName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{ownerAccount.ownerEmail}</p>
                  </div>
                  {ownerAccount.ownerPhone && (
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{ownerAccount.ownerPhone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Your store account will be created</li>
                <li>• You'll receive a verification email</li>
                <li>• Complete onboarding (upload logo, set preferences)</li>
                <li>• Invite your employees to join</li>
                <li>• Start processing your first transactions</li>
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          
          {currentStep < 3 ? (
            <Button onClick={handleNext} className="ml-auto">
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading} className="ml-auto">
              {isLoading ? 'Creating Store...' : 'Create Store'}
            </Button>
          )}
        </div>

        <div className="text-center pt-4 border-t">
          <span className="text-sm text-muted-foreground">Already have an account? </span>
          <Button
            variant="link"
            className="px-0 h-auto text-sm"
            onClick={() => onNavigate('login')}
          >
            Sign in here
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}