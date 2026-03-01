import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, Sparkles, Check, X, ImageIcon } from 'lucide-react';

interface DetectedItem {
  type: string;
  count: number;
  notes?: string;
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
  const [step, setStep] = useState<'capture' | 'analyzing' | 'results'>('capture');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [result, setResult] = useState<AICaptureResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('capture');
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
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
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imagePreview) return;

    setStep('analyzing');

    try {
      // Extract base64 from data URL
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

  const handleConfirm = useCallback(async () => {
    if (!result || !imageFile) return;

    try {
      // Upload batch photo to storage
      const ext = imageFile.name.split('.').pop() || 'jpg';
      const filePath = `${batchId}/batch-photo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('batch-photos')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        // Continue even if upload fails — items are more important
      }

      const { data: urlData } = supabase.storage
        .from('batch-photos')
        .getPublicUrl(filePath);

      onItemsDetected(result.items, urlData?.publicUrl || '');
      handleClose();
      toast.success(`Detected ${result.total_count} items — added to your batch`);
    } catch (err: any) {
      toast.error('Failed to save batch photo');
      // Still pass items even if photo upload fails
      onItemsDetected(result.items, '');
      handleClose();
    }
  }, [result, imageFile, batchId, onItemsDetected, handleClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Tray Capture
          </DialogTitle>
          <DialogDescription>
            Take a photo of your tray to auto-detect and count jewelry items.
          </DialogDescription>
        </DialogHeader>

        {step === 'capture' && (
          <div className="space-y-4">
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Batch preview" className="w-full max-h-64 object-contain bg-muted" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur"
                  onClick={() => { setImagePreview(null); setImageFile(null); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload or drag a photo</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 20MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>

            {imagePreview && (
              <Button className="w-full" onClick={handleAnalyze}>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze with AI
              </Button>
            )}
          </div>
        )}

        {step === 'analyzing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
            <div>
              <p className="font-medium">Analyzing your tray...</p>
              <p className="text-sm text-muted-foreground">AI is detecting and counting items</p>
            </div>
          </div>
        )}

        {step === 'results' && result && (
          <div className="space-y-4">
            {/* Preview thumbnail */}
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
                    {item.notes && (
                      <p className="text-xs text-muted-foreground">{item.notes}</p>
                    )}
                  </div>
                  <Badge variant="outline">×{item.count}</Badge>
                </div>
              ))}
            </div>

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
