import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Upload, Loader2, Sparkles, Check, X, ImageIcon, QrCode, Smartphone } from 'lucide-react';

interface DetectedItem {
  type: string;
  count: number;
  notes?: string;
  color_notes?: string;
  subcategory?: string;
}

interface AICaptureResult {
  items: DetectedItem[];
  total_count: number;
}

interface AICaptureModalProps {
  open: boolean;
  onClose: () => void;
  onItemsDetected: (items: DetectedItem[], batchPhotoUrl: string) => void;
  batchId: string;
}

export function AICaptureModal({ open, onClose, onItemsDetected, batchId }: AICaptureModalProps) {
  const [step, setStep] = useState<'method' | 'capture' | 'qr' | 'analyzing' | 'results'>('method');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<AICaptureResult | null>(null);
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    setStep('method');
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
    setQrSessionId(null);
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setStep('capture');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imagePreview) return;
    setStep('analyzing');
    try {
      const base64 = imagePreview.split(',')[1];
      const { data, error } = await supabase.functions.invoke('ai-capture', {
        body: { image_base64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as AICaptureResult);
      setStep('results');
    } catch (err: any) {
      console.error('AI capture error:', err);
      toast.error(err.message || 'Failed to analyze image');
      setStep('capture');
    }
  }, [imagePreview]);

  // QR remote capture for AI assist
  const startQrFlow = useCallback(() => {
    const sessionId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setQrSessionId(sessionId);
    setStep('qr');

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
          const imageBase64 = payload.front_image_base64 || payload.image_base64;
          if (imageBase64) {
            setImagePreview(`data:image/jpeg;base64,${imageBase64}`);
            // Create a File object from base64
            const byteArray = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            setImageFile(new File([blob], 'qr-capture.jpg', { type: 'image/jpeg' }));
            setStep('capture');
            toast.success('Photo received from device');
            await supabase.from('kv_store_62d2b480').delete().eq('key', `qr_scan_${sessionId}`);
          }
        }
      } catch (e) {
        // Ignore
      }
    }, 2000);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!result || !imageFile) return;
    try {
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filePath = `${batchId}/batch-photo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('batch-photos')
        .upload(filePath, imageFile, { upsert: true });
      if (uploadError) {
        console.error('Upload error:', uploadError);
      }
      const { data: urlData } = supabase.storage
        .from('batch-photos')
        .getPublicUrl(filePath);

      onItemsDetected(result.items, urlData?.publicUrl || '');
      handleClose();
      toast.success(`Detected ${result.total_count} items — added to your batch`);
    } catch (err: any) {
      toast.error('Failed to save batch photo');
      onItemsDetected(result.items, '');
      handleClose();
    }
  }, [result, imageFile, batchId, onItemsDetected, handleClose]);

  const qrUrl = qrSessionId
    ? `${window.location.origin}/scan-upload?session=${qrSessionId}&mode=single`
    : '';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Tray Capture
          </DialogTitle>
          <DialogDescription>
            Take a photo of items spread out on a tray. AI will detect, count, and categorize each piece.
          </DialogDescription>
        </DialogHeader>

        {/* Step: Choose input method */}
        {step === 'method' && (
          <div className="space-y-3">
            <Button
              className="w-full h-12 rounded-lg flex items-center gap-3"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Use This Device Camera</div>
                <div className="text-[11px] opacity-80">Take a photo directly</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 rounded-lg flex items-center gap-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Upload Image</div>
                <div className="text-[11px] text-muted-foreground">Select from your files</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 rounded-lg flex items-center gap-3"
              onClick={startQrFlow}
            >
              <QrCode className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">QR Code Remote Capture</div>
                <div className="text-[11px] text-muted-foreground">Scan QR with phone to take photo</div>
              </div>
            </Button>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
          </div>
        )}

        {/* Step: QR waiting */}
        {step === 'qr' && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">Scan with Phone</p>
              <p className="text-xs text-muted-foreground mt-1">Take one photo of all items spread out</p>
            </div>
            <div className="flex justify-center py-2">
              <QRCodeSVG value={qrUrl} size={180} />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Waiting for photo…
            </div>
            <Button variant="ghost" size="sm" onClick={() => { reset(); }} className="text-xs text-muted-foreground">
              Cancel
            </Button>
          </div>
        )}

        {/* Step: Preview captured image */}
        {step === 'capture' && (
          <div className="space-y-4">
            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Batch preview" className="w-full max-h-64 object-contain bg-muted" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur"
                  onClick={() => { setImagePreview(null); setImageFile(null); setStep('method'); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Button className="w-full" onClick={handleAnalyze}>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze with AI
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setStep('method')}>
              Choose different method
            </Button>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === 'analyzing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-medium">Analyzing your tray...</p>
              <p className="text-sm text-muted-foreground">AI is detecting, counting, and categorizing items</p>
            </div>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && result && (
          <div className="space-y-4">
            {imagePreview && (
              <div className="rounded-lg overflow-hidden border max-h-32">
                <img src={imagePreview} alt="Batch" className="w-full max-h-32 object-contain bg-muted" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-medium">Detected Items</h4>
              <Badge>{result.total_count} total</Badge>
            </div>

            <div className="space-y-2 max-h-48 overflow-auto">
              {result.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                  <div>
                    <span className="font-medium">{item.type}</span>
                    {item.color_notes && (
                      <span className="text-xs text-muted-foreground ml-2">({item.color_notes})</span>
                    )}
                    {item.notes && (
                      <p className="text-xs text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                  <Badge variant="outline">×{item.count}</Badge>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground italic">
              These are draft items. Metal type, karat, and weight still need manual verification.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                <Camera className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button className="flex-1" onClick={handleConfirm}>
                <Check className="h-4 w-4 mr-2" />
                Add to Batch
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
