import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { 
  User, 
  Scan, 
  Camera, 
  Edit,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  QrCode,
  Smartphone,
  X
} from 'lucide-react';

export interface CustomerData {
  id?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  licenseNumber: string;
  idScanUrl?: string;
  idScanBackUrl?: string;
  ocrPayload?: any;
  source?: 'scan' | 'manual';
  notes?: string;
}

interface CustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerData | null;
  onCustomerUpdate: (customer: CustomerData) => void;
  mode?: 'scan' | 'manual';
  storeId: string;
  storeSettings?: {
    requireIdScan?: boolean;
    allowManualEntry?: boolean;
    requirePhone?: boolean;
    requireEmail?: boolean;
    requireAddress?: boolean;
    requireGender?: boolean;
    requireDob?: boolean;
    requireLicenseNumber?: boolean;
  };
}

const EMPTY_FORM: CustomerData = {
  name: '', email: '', phone: '', address: '', dateOfBirth: '', gender: '', licenseNumber: '',
  firstName: '', lastName: '', notes: '', source: 'manual'
};

export function CustomerDrawer({ 
  isOpen, onClose, customer, onCustomerUpdate, mode, storeId, storeSettings 
}: CustomerDrawerProps) {
  const [editMode, setEditMode] = useState(!customer);
  const [formData, setFormData] = useState<CustomerData>(customer || { ...EMPTY_FORM });
  const [scanStep, setScanStep] = useState<'idle' | 'choose' | 'front' | 'back' | 'analyzing' | 'qr'>('idle');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [imageQualityWarning, setImageQualityWarning] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset state when drawer opens
  useEffect(() => {
    if (isOpen) {
      const isEditing = !!customer;
      setEditMode(!isEditing);
      setFormData(customer || { ...EMPTY_FORM });
      setScanStep('idle');
      setFrontImage(null);
      setBackImage(null);
      setImageQualityWarning(null);
      setDirty(false);
      
      // Auto-start scan or manual mode if specified
      if (!isEditing && mode === 'scan') {
        setScanStep('choose');
      }
    } else {
      // Cleanup QR polling
      if (qrPollRef.current) {
        clearInterval(qrPollRef.current);
        qrPollRef.current = null;
      }
    }
  }, [isOpen, customer, mode]);

  const handleClose = () => {
    if (dirty && editMode) {
      setShowDiscardDialog(true);
    } else {
      onClose();
    }
  };

  const confirmDiscard = () => {
    setShowDiscardDialog(false);
    setDirty(false);
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadIdImage = async (base64: string, side: 'front' | 'back'): Promise<string | null> => {
    try {
      const fileName = `${storeId}/${Date.now()}_${side}.jpg`;
      const byteArray = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const { data, error } = await supabase.storage
        .from('customer-id-scans')
        .upload(fileName, byteArray, { contentType: 'image/jpeg', upsert: false });
      if (error) {
        console.error('Upload error:', error);
        return null;
      }
      return data.path;
    } catch (e) {
      console.error('Upload failed:', e);
      return null;
    }
  };

  const handleFrontCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setFrontImage(base64);
    setScanStep('back');
  }, []);

  const handleBackCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    setBackImage(base64);
    analyzeLicense(frontImage!, base64);
  }, [frontImage]);

  const skipBack = useCallback(() => {
    if (frontImage) analyzeLicense(frontImage, null);
  }, [frontImage]);

  const analyzeLicense = async (front: string, back: string | null) => {
    setScanStep('analyzing');
    setImageQualityWarning(null);
    try {
      // Upload images in parallel
      const [frontUrl, backUrl] = await Promise.all([
        uploadIdImage(front, 'front'),
        back ? uploadIdImage(back, 'back') : Promise.resolve(null)
      ]);

      const { data, error } = await supabase.functions.invoke('scan-license', {
        body: { front_image_base64: front, back_image_base64: back },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        setScanStep('idle');
        return;
      }

      // Parse name into first/last
      const fullName = data.name || '';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setFormData(prev => ({
        ...prev,
        name: fullName || prev.name,
        firstName: firstName || prev.firstName,
        lastName: lastName || prev.lastName,
        dateOfBirth: data.dateOfBirth || prev.dateOfBirth,
        address: data.address || prev.address,
        gender: data.gender || prev.gender,
        licenseNumber: data.licenseNumber || prev.licenseNumber,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        idScanUrl: frontUrl || prev.idScanUrl,
        idScanBackUrl: backUrl || prev.idScanBackUrl,
        ocrPayload: data,
        source: 'scan' as const,
      }));
      setDirty(true);

      if (data.image_quality !== 'clear') {
        setImageQualityWarning(data.image_quality_note || 'The front image appears blurry. Please verify the extracted information.');
      }
      toast.success('License data extracted successfully');
      setScanStep('idle');
      setEditMode(true);
    } catch (err: any) {
      console.error('License scan error:', err);
      toast.error(err.message || 'Failed to scan license');
      setScanStep('idle');
    }
  };

  // QR Code flow
  const startQrFlow = useCallback(() => {
    const sessionId = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setQrSessionId(sessionId);
    setScanStep('qr');

    // Poll for uploaded images from remote device
    if (qrPollRef.current) clearInterval(qrPollRef.current);
    qrPollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase
          .from('kv_store_62d2b480')
          .select('value')
          .eq('key', `qr_scan_${sessionId}`)
          .maybeSingle();
        
        if (data?.value) {
          clearInterval(qrPollRef.current!);
          qrPollRef.current = null;
          const payload = data.value as any;
          if (payload.front_image_base64) {
            setFrontImage(payload.front_image_base64);
            analyzeLicense(payload.front_image_base64, payload.back_image_base64 || null);
            // Cleanup the KV entry
            await supabase.from('kv_store_62d2b480').delete().eq('key', `qr_scan_${sessionId}`);
          }
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 2000);
  }, []);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name?.trim()) {
      toast.error('Full name is required');
      return;
    }

    // Enforce store settings requirements
    if (storeSettings?.requirePhone && !formData.phone?.trim()) {
      toast.error('Phone number is required by store settings');
      return;
    }
    if (storeSettings?.requireEmail && !formData.email?.trim()) {
      toast.error('Email is required by store settings');
      return;
    }
    if (storeSettings?.requireAddress && !formData.address?.trim()) {
      toast.error('Address is required by store settings');
      return;
    }
    if (storeSettings?.requireLicenseNumber && !formData.licenseNumber?.trim()) {
      toast.error('License number is required by store settings');
      return;
    }
    if (storeSettings?.requireDob && !formData.dateOfBirth?.trim()) {
      toast.error('Date of birth is required by store settings');
      return;
    }
    if (storeSettings?.requireGender && !formData.gender?.trim()) {
      toast.error('Gender is required by store settings');
      return;
    }

    setSaving(true);
    try {
      const nameParts = (formData.name || '').split(' ');
      const firstName = formData.firstName || nameParts[0] || '';
      const lastName = formData.lastName || nameParts.slice(1).join(' ') || '';

      const customerPayload = {
        store_id: storeId,
        full_name: formData.name,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: formData.dateOfBirth || '',
        gender: formData.gender || '',
        email: formData.email || '',
        phone: formData.phone || '',
        address: formData.address || '',
        license_number: formData.licenseNumber || '',
        id_scan_url: formData.idScanUrl || '',
        id_scan_back_url: formData.idScanBackUrl || '',
        ocr_payload: formData.ocrPayload || {},
        notes: formData.notes || '',
        source: formData.source || 'manual',
      };

      if (formData.id) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(customerPayload)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
        // Insert new customer
        const { data, error } = await supabase
          .from('customers')
          .insert(customerPayload)
          .select('id')
          .single();
        if (error) throw error;
        formData.id = data.id;
      }

      const savedCustomer = { ...formData, firstName, lastName };
      onCustomerUpdate(savedCustomer);
      setEditMode(false);
      setDirty(false);
      toast.success('Customer saved');
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const startDeviceCapture = () => {
    setFrontImage(null);
    setBackImage(null);
    setImageQualityWarning(null);
    setScanStep('front');
  };

  const qrUrl = qrSessionId
    ? `${window.location.origin}/scan-upload?session=${qrSessionId}&store=${storeId}`
    : '';

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full sm:w-[440px] p-0 flex flex-col border-l border-border/40">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <SheetTitle className="text-base font-semibold">Customer</SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                {customer && !editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)} className="rounded-lg text-xs">
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                )}
                {editMode && (
                  <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-lg text-xs bg-primary hover:bg-primary/90">
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Save
                  </Button>
                )}
              </div>
            </div>
            <SheetDescription className="text-xs">
              {editMode ? 'Enter details or scan their ID' : 'Customer details for this transaction'}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="space-y-5 px-6 py-5">
              {/* Scan / Capture Section */}
              {editMode && (
                <div className="space-y-3">
                  {scanStep === 'idle' && (
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setScanStep('choose')}
                        className="w-full flex items-center gap-2 h-11 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        <Scan className="h-4 w-4" />
                        Scan Customer ID
                      </Button>
                    </div>
                  )}

                  {/* Choose capture method */}
                  {scanStep === 'choose' && (
                    <div className="border border-slate-200 rounded-lg p-5 space-y-3 bg-slate-50">
                      <div className="text-center mb-2">
                        <p className="font-medium text-sm">How do you want to capture the ID?</p>
                      </div>
                      <Button 
                        onClick={startDeviceCapture}
                        className="w-full rounded-lg flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Use This Device Camera
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={startQrFlow}
                        className="w-full rounded-lg flex items-center gap-2"
                      >
                        <QrCode className="h-4 w-4" />
                        Scan with Another Device
                      </Button>
                      <Button 
                        variant="ghost" size="sm"
                        onClick={() => setScanStep('idle')}
                        className="w-full text-xs text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* QR Code for remote capture */}
                  {scanStep === 'qr' && (
                    <div className="border border-slate-200 rounded-lg p-5 text-center space-y-3 bg-slate-50">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Scan from Another Device</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Scan this QR code with a phone to capture the ID photo
                        </p>
                      </div>
                      <div className="flex justify-center py-2">
                        <QRCodeSVG value={qrUrl} size={180} />
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Waiting for photo…
                      </div>
                      <Button 
                        variant="ghost" size="sm"
                        onClick={() => {
                          if (qrPollRef.current) {
                            clearInterval(qrPollRef.current);
                            qrPollRef.current = null;
                          }
                          setScanStep('choose');
                        }}
                        className="w-full text-xs text-muted-foreground"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {scanStep === 'front' && (
                    <div className="border border-slate-200 rounded-lg p-5 text-center space-y-3 bg-slate-50">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Front of License</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Take a photo or upload the front side</p>
                      </div>
                      <Button onClick={() => frontInputRef.current?.click()} className="w-full rounded-lg">
                        <Upload className="h-4 w-4 mr-2" />
                        Capture Front
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setScanStep('choose')} className="w-full text-xs text-muted-foreground">
                        Back
                      </Button>
                      <input ref={frontInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFrontCapture} />
                    </div>
                  )}

                  {scanStep === 'back' && (
                    <div className="border border-slate-200 rounded-lg p-5 text-center space-y-3 bg-slate-50">
                      <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Front captured</span>
                      </div>
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Back of License</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Take a photo of the back side</p>
                      </div>
                      <Button onClick={() => backInputRef.current?.click()} className="w-full rounded-lg">
                        <Upload className="h-4 w-4 mr-2" />
                        Capture Back
                      </Button>
                      <Button variant="ghost" size="sm" onClick={skipBack} className="w-full text-xs text-muted-foreground rounded-lg">
                        Skip — analyze front only
                      </Button>
                      <input ref={backInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBackCapture} />
                    </div>
                  )}

                  {scanStep === 'analyzing' && (
                    <div className="border border-slate-200 rounded-lg p-6 text-center space-y-3 bg-slate-50">
                      <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                      <div>
                        <p className="font-medium text-sm">Analyzing License…</p>
                        <p className="text-xs text-muted-foreground">AI is extracting information</p>
                      </div>
                    </div>
                  )}

                  {imageQualityWarning && (
                    <div className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-50 border border-yellow-200/60 text-yellow-800">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="text-xs">{imageQualityWarning}</p>
                    </div>
                  )}

                  {/* Scanned image indicator */}
                  {formData.idScanUrl && scanStep === 'idle' && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200/60 text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="text-xs font-medium">ID scanned</span>
                      <Button 
                        variant="ghost" size="sm" 
                        onClick={() => setScanStep('choose')}
                        className="ml-auto h-6 text-[10px] text-green-700 hover:text-green-800"
                      >
                        Re-scan
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-border/30" />

              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Personal Information</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Full Name *</Label>
                    {editMode ? (
                      <Input value={formData.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Full name" className="mt-1 rounded-lg bg-white border border-slate-200" />
                    ) : (
                      <div className="mt-1 text-sm font-medium">{customer?.name || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Date of Birth {storeSettings?.requireDob && '*'}
                    </Label>
                    {editMode ? (
                      <Input type="date" value={formData.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} className="mt-1 rounded-lg bg-white border border-slate-200" />
                    ) : (
                      <div className="mt-1 text-sm">{customer?.dateOfBirth || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Gender {storeSettings?.requireGender && '*'}
                    </Label>
                    {editMode ? (
                      <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                        <SelectTrigger className="mt-1 rounded-lg bg-white border border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="rounded-lg">
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
                    <Label className="text-xs text-muted-foreground">
                      Driver License # {storeSettings?.requireLicenseNumber && '*'}
                    </Label>
                    {editMode ? (
                      <Input value={formData.licenseNumber} onChange={(e) => updateField('licenseNumber', e.target.value)} placeholder="License number" className="mt-1 rounded-lg bg-white border border-slate-200 font-mono" />
                    ) : (
                      <div className="mt-1 text-sm font-mono">{customer?.licenseNumber || 'Not provided'}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/30" />

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</h4>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Email {storeSettings?.requireEmail && '*'}
                    </Label>
                    {editMode ? (
                      <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="customer@example.com" className="mt-1 rounded-lg bg-white border border-slate-200" />
                    ) : (
                      <div className="mt-1 text-sm flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" />{customer?.email || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Phone {storeSettings?.requirePhone && '*'}
                    </Label>
                    {editMode ? (
                      <Input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(555) 123-4567" className="mt-1 rounded-lg bg-white border border-slate-200" />
                    ) : (
                      <div className="mt-1 text-sm flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" />{customer?.phone || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Address {storeSettings?.requireAddress && '*'}
                    </Label>
                    {editMode ? (
                      <Textarea value={formData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Full address" rows={2} className="mt-1 rounded-lg bg-white border border-slate-200 resize-none" />
                    ) : (
                      <div className="mt-1 text-sm flex items-start gap-2"><MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" /><span>{customer?.address || 'Not provided'}</span></div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Notes</Label>
                    {editMode ? (
                      <Textarea value={formData.notes || ''} onChange={(e) => updateField('notes', e.target.value)} placeholder="Additional notes" rows={2} className="mt-1 rounded-lg bg-white border border-slate-200 resize-none" />
                    ) : (
                      formData.notes ? <div className="mt-1 text-sm text-muted-foreground">{formData.notes}</div> : null
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Status */}
              {!editMode && customer && (
                <>
                  <div className="border-t border-border/30" />
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</h4>
                    <div className="flex gap-2">
                      {customer.source === 'scan' && (
                        <Badge variant="secondary" className="rounded-lg text-xs">Verified ID</Badge>
                      )}
                      <Badge variant="outline" className="rounded-lg text-xs">
                        {customer.source === 'scan' ? 'Scanned' : 'Manual Entry'}
                      </Badge>
                    </div>
                  </div>
                </>
              )}

              {/* Compliance Notice */}
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-lg">
                <div className="flex items-start gap-2.5">
                  <CreditCard className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-0.5">Compliance Required</p>
                    <p>Valid government-issued photo ID required for all transactions.</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Discard changes dialog */}
      <Dialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>You have unsaved changes. Discard them?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDiscardDialog(false)}>Keep Editing</Button>
            <Button variant="destructive" onClick={confirmDiscard}>Discard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
