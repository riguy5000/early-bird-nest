import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  Upload
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
    name: '', email: '', phone: '', address: '', dateOfBirth: '', gender: '', licenseNumber: ''
  });
  const [scanStep, setScanStep] = useState<'idle' | 'front' | 'back' | 'analyzing'>('idle');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [imageQualityWarning, setImageQualityWarning] = useState<string | null>(null);
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onCustomerUpdate(formData);
    setEditMode(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
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
      const { data, error } = await supabase.functions.invoke('scan-license', {
        body: { front_image_base64: front, back_image_base64: back },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        setScanStep('idle');
        return;
      }
      setFormData((prev: any) => ({
        ...prev,
        name: data.name || prev.name,
        dateOfBirth: data.dateOfBirth || prev.dateOfBirth,
        address: data.address || prev.address,
        gender: data.gender || prev.gender,
        licenseNumber: data.licenseNumber || prev.licenseNumber,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
      }));
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

  const startScan = () => {
    setFrontImage(null);
    setBackImage(null);
    setImageQualityWarning(null);
    setScanStep('front');
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
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
                <Button size="sm" onClick={handleSave} className="rounded-lg text-xs bg-primary hover:bg-primary/90">
                  <Save className="h-3.5 w-3.5 mr-1" />
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
            {/* Scan License Section */}
            {editMode && (
              <div className="space-y-3">
                {scanStep === 'idle' && (
                  <Button 
                    variant="outline" 
                    onClick={startScan}
                    className="w-full flex items-center gap-2 h-11 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <Scan className="h-4 w-4" />
                    Scan Customer ID
                  </Button>
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
                    <input ref={frontInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFrontCapture} />
                  </div>
                )}

                {scanStep === 'back' && (
                  <div className="border border-slate-200 rounded-xl p-5 text-center space-y-3 bg-slate-50">
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
                    <Button onClick={() => backInputRef.current?.click()} className="w-full rounded-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Capture Back
                    </Button>
                    <Button variant="ghost" size="sm" onClick={skipBack} className="w-full text-xs text-muted-foreground rounded-full">
                      Skip — analyze front only
                    </Button>
                    <input ref={backInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBackCapture} />
                  </div>
                )}

                {scanStep === 'analyzing' && (
                  <div className="border border-slate-200 rounded-xl p-6 text-center space-y-3 bg-slate-50">
                    <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                    <div>
                      <p className="font-medium text-sm">Analyzing License…</p>
                      <p className="text-xs text-muted-foreground">AI is extracting information</p>
                    </div>
                  </div>
                )}

                {imageQualityWarning && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-yellow-50 border border-yellow-200/60 text-yellow-800">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-xs">{imageQualityWarning}</p>
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
                  <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                  {editMode ? (
                    <Input type="date" value={formData.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} className="mt-1 rounded-lg bg-white border border-slate-200" />
                  ) : (
                    <div className="mt-1 text-sm">{customer?.dateOfBirth || 'Not provided'}</div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Gender</Label>
                  {editMode ? (
                    <Select value={formData.gender} onValueChange={(v) => updateField('gender', v)}>
                      <SelectTrigger className="mt-1 rounded-lg bg-white border border-slate-200"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
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
                  <Label className="text-xs text-muted-foreground">Driver License #</Label>
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
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  {editMode ? (
                    <Input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)} placeholder="customer@example.com" className="mt-1 rounded-lg bg-white border border-slate-200" />
                  ) : (
                    <div className="mt-1 text-sm flex items-center gap-2"><Mail className="h-3 w-3 text-muted-foreground" />{customer?.email || 'Not provided'}</div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  {editMode ? (
                    <Input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)} placeholder="(555) 123-4567" className="mt-1 rounded-lg bg-white border border-slate-200" />
                  ) : (
                    <div className="mt-1 text-sm flex items-center gap-2"><Phone className="h-3 w-3 text-muted-foreground" />{customer?.phone || 'Not provided'}</div>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  {editMode ? (
                    <Textarea value={formData.address} onChange={(e) => updateField('address', e.target.value)} placeholder="Full address" rows={2} className="mt-1 rounded-lg bg-white border border-slate-200 resize-none" />
                  ) : (
                    <div className="mt-1 text-sm flex items-start gap-2"><MapPin className="h-3 w-3 mt-0.5 text-muted-foreground" /><span>{customer?.address || 'Not provided'}</span></div>
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
                    <Badge variant="outline" className="rounded-full text-xs">First Time Customer</Badge>
                    <Badge variant="secondary" className="rounded-full text-xs">Verified ID</Badge>
                  </div>
                </div>
              </>
            )}

            {/* Compliance Notice */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
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
  );
}
