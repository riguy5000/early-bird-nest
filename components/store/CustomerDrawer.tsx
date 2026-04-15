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
  X,
  Search,
  Image as ImageIcon
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

interface CustomerSuggestion {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  license_number: string | null;
  date_of_birth: string | null;
  address: string | null;
  gender: string | null;
  first_name: string;
  last_name: string;
  id_scan_url: string | null;
  id_scan_back_url: string | null;
  source: string;
  notes: string | null;
  ocr_payload: any;
}

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
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
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
      setSuggestions([]);
      setShowSuggestions(false);
      
      if (!isEditing && mode === 'scan') {
        setScanStep('choose');
      }
    } else {
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

  // ---- CUSTOMER SEARCH ----
  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, license_number, date_of_birth, address, gender, first_name, last_name, id_scan_url, id_scan_back_url, source, notes, ocr_payload')
        .eq('store_id', storeId)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,license_number.ilike.%${query}%`)
        .limit(5);
      if (error) throw error;
      setSuggestions((data || []) as CustomerSuggestion[]);
      setShowSuggestions((data || []).length > 0);
    } catch (err) {
      console.error('Customer search error:', err);
    }
  }, [storeId]);

  const selectSuggestion = (s: CustomerSuggestion) => {
    setFormData({
      id: s.id,
      name: s.full_name,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.email || '',
      phone: s.phone || '',
      address: s.address || '',
      dateOfBirth: s.date_of_birth || '',
      gender: s.gender || '',
      licenseNumber: s.license_number || '',
      idScanUrl: s.id_scan_url || undefined,
      idScanBackUrl: s.id_scan_back_url || undefined,
      ocrPayload: s.ocr_payload,
      source: (s.source as 'scan' | 'manual') || 'manual',
      notes: s.notes || '',
    });
    setDirty(true);
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success(`Loaded existing customer: ${s.full_name}`);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setDirty(true);
    // Trigger customer search for name, email, phone, license
    if (['name', 'email', 'phone', 'licenseNumber'].includes(field) && value.length >= 2) {
      if (searchTimeout) clearTimeout(searchTimeout);
      const t = setTimeout(() => searchCustomers(value), 300);
      setSearchTimeout(t);
    } else if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
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
      toast.success('ID data extracted successfully');
      setScanStep('idle');
      setEditMode(true);
    } catch (err: any) {
      console.error('License scan error:', err);
      toast.error(err.message || 'Failed to scan ID');
      setScanStep('idle');
    }
  };

  // QR Code flow
  const startQrFlow = useCallback(() => {
    const sessionId = `qr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setQrSessionId(sessionId);
    setScanStep('qr');

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
            await supabase.from('kv_store_62d2b480').delete().eq('key', `qr_scan_${sessionId}`);
          }
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 2000);
  }, []);

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast.error('Full name is required');
      return;
    }

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
      toast.error('Government ID number is required by store settings');
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
        const { error } = await supabase
          .from('customers')
          .update(customerPayload)
          .eq('id', formData.id);
        if (error) throw error;
      } else {
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

  const getIdImageUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const { data } = supabase.storage.from('customer-id-scans').getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const frontUrl = getIdImageUrl(formData.idScanUrl);
  const backUrl = getIdImageUrl(formData.idScanBackUrl);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent side="right" className="w-full sm:w-[440px] p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-black/[0.06]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full icon-container flex items-center justify-center">
                  <User className="h-4 w-4 text-[#6B5EF9]" />
                </div>
                <SheetTitle className="text-[18px] font-semibold text-[#2B2833]">Customer</SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                {customer && !editMode && (
                  <Button variant="ghost" size="sm" onClick={() => setEditMode(true)} className="text-[12px] font-medium text-[#76707F] px-3 py-1.5 rounded-[8px] hover:bg-[#F8F7FB] transition-colors">
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                )}
                {editMode && (
                  <Button size="sm" onClick={handleSave} disabled={saving} className="btn-primary-dark">
                    {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                    Save
                  </Button>
                )}
              </div>
            </div>
            <SheetDescription className="text-[12px] text-[#76707F]">
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
                        className="w-full flex items-center gap-2 btn-secondary-light"
                      >
                        <Scan className="h-4 w-4" />
                        Scan Government ID
                      </Button>
                    </div>
                  )}

                  {scanStep === 'choose' && (
                    <div className="glass-surface p-5 space-y-3">
                      <div className="text-center mb-2">
                        <p className="text-[14px] font-semibold text-[#2B2833]">How do you want to capture the ID?</p>
                        <p className="text-[12px] text-[#76707F] mt-0.5">Driver License, State ID, or Passport</p>
                      </div>
                      <Button 
                        onClick={startDeviceCapture}
                        className="w-full btn-primary-dark flex items-center gap-2"
                      >
                        <Camera className="h-4 w-4" />
                        Use This Device Camera
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={startQrFlow}
                        className="w-full btn-primary-dark flex items-center gap-2"
                      >
                        <QrCode className="h-4 w-4" />
                        Scan with Another Device
                      </Button>
                      <Button 
                        variant="ghost" size="sm"
                        onClick={() => setScanStep('idle')}
                        className="w-full text-[12px] text-[#76707F]"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {scanStep === 'qr' && (
                    <div className="glass-surface p-5 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Smartphone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#2B2833]">Scan from Another Device</p>
                        <p className="text-[12px] text-[#76707F] mt-0.5">
                          Scan this QR code with a phone to capture the ID photo
                        </p>
                      </div>
                      <div className="flex justify-center py-2">
                        <QRCodeSVG value={qrUrl} size={180} />
                      </div>
                      <div className="flex items-center justify-center gap-2 text-[12px] text-[#76707F]">
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
                        className="w-full text-[12px] text-[#76707F]"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {scanStep === 'front' && (
                    <div className="glass-surface p-5 text-center space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#2B2833]">Front of ID</p>
                        <p className="text-[12px] text-[#76707F] mt-0.5">Take a photo or upload the front side of the government ID</p>
                      </div>
                      <Button onClick={() => frontInputRef.current?.click()} className="w-full btn-primary-dark">
                        <Upload className="h-4 w-4 mr-2" />
                        Capture Front
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setScanStep('choose')} className="w-full text-[12px] text-[#76707F]">
                        Back
                      </Button>
                      <input ref={frontInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFrontCapture} />
                    </div>
                  )}

                  {scanStep === 'back' && (
                    <div className="glass-surface p-5 text-center space-y-3">
                      <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="text-[12px] font-medium text-[#2B2833]">Front captured</span>
                      </div>
                      <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-[#2B2833]">Back of ID</p>
                        <p className="text-[12px] text-[#76707F] mt-0.5">Take a photo of the back side</p>
                      </div>
                      <Button onClick={() => backInputRef.current?.click()} className="w-full btn-primary-dark">
                        <Upload className="h-4 w-4 mr-2" />
                        Capture Back
                      </Button>
                      <Button variant="ghost" size="sm" onClick={skipBack} className="w-full text-[12px] text-[#76707F]">
                        Skip — analyze front only
                      </Button>
                      <input ref={backInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBackCapture} />
                    </div>
                  )}

                  {scanStep === 'analyzing' && (
                    <div className="glass-surface p-6 text-center space-y-3">
                      <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                      <div>
                        <p className="text-[14px] font-semibold text-[#2B2833]">Analyzing ID…</p>
                        <p className="text-[12px] text-[#76707F]">AI is extracting information</p>
                      </div>
                    </div>
                  )}

                  {imageQualityWarning && (
                    <div className="flex items-start gap-2.5 p-3 tip-box-warning flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="text-[12px] text-[#E65100]">{imageQualityWarning}</p>
                    </div>
                  )}

                  {/* Scanned ID image thumbnails */}
                  {(frontUrl || backUrl) && scanStep === 'idle' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 tip-box-success flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[12px] font-medium text-[#2E7D32]">ID scanned</span>
                        <Button 
                          variant="ghost" size="sm" 
                          onClick={() => setScanStep('choose')}
                          className="ml-auto h-6 text-[10px] text-green-700 hover:text-green-800"
                        >
                          Re-scan
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        {frontUrl && (
                          <div className="flex-1">
                            <p className="text-[10px] text-[#A8A3AE] mb-1">Front</p>
                            <img src={frontUrl} alt="ID Front" className="w-full h-20 object-cover rounded-[8px] border border-black/[0.06]" />
                          </div>
                        )}
                        {backUrl && (
                          <div className="flex-1">
                            <p className="text-[10px] text-[#A8A3AE] mb-1">Back</p>
                            <img src={backUrl} alt="ID Back" className="w-full h-20 object-cover rounded-[8px] border border-black/[0.06]" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* View-mode ID images */}
              {!editMode && (frontUrl || backUrl) && (
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Scanned ID</h4>
                  <div className="flex gap-2">
                    {frontUrl && (
                      <div className="flex-1">
                        <p className="text-[10px] text-[#A8A3AE] mb-1">Front</p>
                        <img src={frontUrl} alt="ID Front" className="w-full h-20 object-cover rounded-[8px] border border-black/[0.06]" />
                      </div>
                    )}
                    {backUrl && (
                      <div className="flex-1">
                        <p className="text-[10px] text-[#A8A3AE] mb-1">Back</p>
                        <img src={backUrl} alt="ID Back" className="w-full h-20 object-cover rounded-[8px] border border-black/[0.06]" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t border-border/30" />

              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Personal Information</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 relative">
                    <Label className="text-[12px] text-[#76707F]">Full Name *</Label>
                    {editMode ? (
                      <>
                        <div className="relative">
                          <Input 
                            value={formData.name} 
                            onChange={(e) => updateField('name', e.target.value)} 
                            placeholder="Full name" 
                            className="mt-1 input-glass pr-8"
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          />
                          {formData.name.length >= 2 && (
                            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A8A3AE] mt-0.5" />
                          )}
                        </div>
                        {/* Suggestions dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white/95 border border-black/[0.06] rounded-[12px] shadow-xl overflow-hidden backdrop-blur-xl">
                            <div className="px-3 py-1.5 text-[10px] text-[#A8A3AE] uppercase tracking-wider bg-black/[0.02] border-b border-black/[0.04]">
                              Existing Customers
                            </div>
                            {suggestions.map(s => (
                              <button
                                key={s.id}
                                className="w-full px-3 py-2.5 text-left hover:bg-[#FAFAF9] transition-colors border-b border-black/[0.04] last:border-0"
                                onMouseDown={() => selectSuggestion(s)}
                              >
                                <div className="text-[14px] font-medium text-[#2B2833]">{s.full_name}</div>
                                <div className="text-[11px] text-[#A8A3AE] flex gap-2">
                                  {s.license_number && <span>ID: {s.license_number}</span>}
                                  {s.phone && <span>{s.phone}</span>}
                                  {s.email && <span>{s.email}</span>}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="mt-1 text-[14px] font-medium text-[#2B2833]">{customer?.name || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#76707F]">
                      Date of Birth {storeSettings?.requireDob && '*'}
                    </Label>
                    {editMode ? (
                      <Input type="date" value={formData.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} className="mt-1 input-glass" />
                    ) : (
                      <div className="mt-1 text-[14px] text-[#2B2833]">{customer?.dateOfBirth || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#76707F]">
                      Gender {storeSettings?.requireGender && '*'}
                    </Label>
                    {editMode ? (
                      <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                        <SelectTrigger className="mt-1 input-glass"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="rounded-[12px] bg-white/95 backdrop-blur-xl border-white/60 shadow-xl">
                          <SelectItem value="M">Male</SelectItem>
                          <SelectItem value="F">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="mt-1 text-[14px] text-[#2B2833]">{customer?.gender || 'Not provided'}</div>
                    )}
                  </div>

                  <div className="col-span-2">
                    <Label className="text-[12px] text-[#76707F]">
                      ID / License / Passport # {storeSettings?.requireLicenseNumber && '*'}
                    </Label>
                    {editMode ? (
                      <Input value={formData.licenseNumber} onChange={(e) => updateField('licenseNumber', e.target.value)} placeholder="Government ID number" className="mt-1 input-glass font-mono" />
                    ) : (
                      <div className="mt-1 text-[14px] font-mono text-[#2B2833]">{customer?.licenseNumber || 'Not provided'}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-border/30" />

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Contact</h4>

                <div className="space-y-3">
                  <div>
                    <Label className="text-[12px] text-[#76707F]">
                      Email {storeSettings?.requireEmail && '*'}
                    </Label>
                    {editMode ? (
                      <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="customer@example.com" className="mt-1 input-glass" />
                    ) : (
                      <div className="mt-1 text-[14px] text-[#2B2833] flex items-center gap-2"><Mail className="h-3 w-3 text-[#A8A3AE]" />{customer?.email || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#76707F]">
                      Phone {storeSettings?.requirePhone && '*'}
                    </Label>
                    {editMode ? (
                      <Input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(555) 123-4567" className="mt-1 input-glass" />
                    ) : (
                      <div className="mt-1 text-[14px] text-[#2B2833] flex items-center gap-2"><Phone className="h-3 w-3 text-[#A8A3AE]" />{customer?.phone || 'Not provided'}</div>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#76707F]">
                      Address {storeSettings?.requireAddress && '*'}
                    </Label>
                    {editMode ? (
                      <Textarea value={formData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Full address" rows={2} className="mt-1 textarea-glass resize-none" />
                    ) : (
                      <div className="mt-1 text-[14px] text-[#2B2833] flex items-start gap-2"><MapPin className="h-3 w-3 mt-0.5 text-[#A8A3AE]" /><span>{customer?.address || 'Not provided'}</span></div>
                    )}
                  </div>

                  <div>
                    <Label className="text-[12px] text-[#76707F]">Notes</Label>
                    {editMode ? (
                      <Textarea value={formData.notes || ''} onChange={(e) => updateField('notes', e.target.value)} placeholder="Additional notes" rows={2} className="mt-1 textarea-glass resize-none" />
                    ) : (
                      formData.notes ? <div className="mt-1 text-[14px] text-[#76707F]">{formData.notes}</div> : null
                    )}
                  </div>
                </div>
              </div>

              {/* Customer Status */}
              {!editMode && customer && (
                <>
                  <div className="border-t border-border/30" />
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">Status</h4>
                    <div className="flex gap-2">
                      {customer.source === 'scan' && (
                        <Badge variant="secondary" className="text-[12px] font-medium text-[#76707F] px-3 py-1.5 rounded-[8px] hover:bg-[#F8F7FB] transition-colors">Verified ID</Badge>
                      )}
                      <Badge variant="outline" className="text-[12px] font-medium text-[#76707F] px-3 py-1.5 rounded-[8px] hover:bg-[#F8F7FB] transition-colors">
                        {customer.source === 'scan' ? 'Scanned' : 'Manual Entry'}
                      </Badge>
                    </div>
                  </div>
                </>
              )}

              {/* Compliance Notice */}
              <div className="bg-white/60 border border-black/[0.06] p-3.5 rounded-[12px]">
                <div className="flex items-start gap-2.5">
                  <CreditCard className="h-3.5 w-3.5 mt-0.5 text-[#A8A3AE]" />
                  <div className="text-[12px] text-[#76707F]">
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
