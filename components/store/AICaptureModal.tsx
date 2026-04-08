import React, { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Upload, Loader2, Sparkles, Check, X, QrCode, Smartphone, Merge, Split, Trash2, Edit } from 'lucide-react';

interface DetectedItem {
  type: string;
  count: number;
  notes?: string;
  color_notes?: string;
  subcategory?: string;
}

interface ReviewItem {
  id: string;
  type: string;
  color_notes: string;
  notes: string;
  isPair: boolean;
  category: string;
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

const EARRING_TYPES = ['earring', 'earrings', 'stud', 'studs', 'hoop', 'hoops', 'drop earring', 'drop earrings'];

function isEarringType(type: string): boolean {
  return EARRING_TYPES.some(t => type.toLowerCase().includes(t));
}

function categorize(type: string): string {
  if (['Watch'].some(t => type.toLowerCase().includes(t.toLowerCase()))) return 'Watch';
  if (['Coin', 'Bar', 'Round'].some(t => type.toLowerCase().includes(t.toLowerCase()))) return 'Bullion';
  if (['Spoon', 'Fork', 'Knife'].some(t => type.toLowerCase().includes(t.toLowerCase()))) return 'Silverware';
  return 'Jewelry';
}

const SUBCATEGORIES: Record<string, string[]> = {
  Jewelry: ['Ring', 'Wedding Band', 'Earrings', 'Pendant', 'Chain', 'Necklace', 'Bracelet', 'Anklet', 'Brooch', 'Charm', 'Cufflinks', 'Pin', 'Other'],
  Watch: ['Luxury Watch', 'Dress Watch', 'Sport Watch', 'Pocket Watch', 'Other'],
  Bullion: ['Gold Coin', 'Silver Coin', 'Gold Bar', 'Silver Bar', 'Round', 'Other'],
  Silverware: ['Spoon', 'Fork', 'Knife', 'Serving Piece', 'Other'],
};

export function AICaptureModal({ open, onClose, onItemsDetected, batchId }: AICaptureModalProps) {
  const [step, setStep] = useState<'method' | 'capture' | 'qr' | 'analyzing' | 'review'>('method');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    setStep('method');
    setImagePreview(null);
    setImageFile(null);
    setReviewItems([]);
    setSelectedIds(new Set());
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

  const buildReviewItems = useCallback((result: AICaptureResult): ReviewItem[] => {
    const items: ReviewItem[] = [];
    for (const detected of result.items) {
      const isEarring = isEarringType(detected.type);
      const isPair = isEarring && (
        detected.count >= 2 ||
        (detected.notes || '').toLowerCase().includes('pair')
      );

      if (isPair) {
        // Create one pair item
        items.push({
          id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: 'Earrings',
          color_notes: detected.color_notes || '',
          notes: `Pair${detected.notes ? ' — ' + detected.notes : ''}`,
          isPair: true,
          category: 'Jewelry',
        });
        // If count > 2 there might be extra singles
        const remaining = detected.count - 2;
        for (let i = 0; i < remaining; i++) {
          items.push({
            id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_s${i}`,
            type: 'Earring (single)',
            color_notes: detected.color_notes || '',
            notes: detected.notes || '',
            isPair: false,
            category: 'Jewelry',
          });
        }
      } else {
        for (let i = 0; i < detected.count; i++) {
          items.push({
            id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`,
            type: isEarring ? 'Earring (single)' : detected.type,
            color_notes: detected.color_notes || '',
            notes: detected.notes || '',
            isPair: false,
            category: categorize(detected.type),
          });
        }
      }
    }
    return items;
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
      const result = data as AICaptureResult;
      setReviewItems(buildReviewItems(result));
      setStep('review');
    } catch (err: any) {
      console.error('AI capture error:', err);
      toast.error(err.message || 'Failed to analyze image');
      setStep('capture');
    }
  }, [imagePreview, buildReviewItems]);

  // QR remote capture
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
            const byteArray = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
            const blob = new Blob([byteArray], { type: 'image/jpeg' });
            setImageFile(new File([blob], 'qr-capture.jpg', { type: 'image/jpeg' }));
            setStep('capture');
            toast.success('Photo received from device');
            await supabase.from('kv_store_62d2b480').delete().eq('key', `qr_scan_${sessionId}`);
          }
        }
      } catch (_) {}
    }, 2000);
  }, []);

  // Review actions
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const mergeSelected = () => {
    if (selectedIds.size < 2) { toast.error('Select at least 2 items to merge'); return; }
    const ids = Array.from(selectedIds);
    const kept = reviewItems.find(i => i.id === ids[0])!;
    setReviewItems(prev => [
      ...prev.filter(i => !selectedIds.has(i.id)),
      { ...kept, type: 'Earrings', isPair: true, notes: `Merged pair${kept.notes ? ' — ' + kept.notes : ''}` },
    ]);
    setSelectedIds(new Set());
  };

  const splitItem = (id: string) => {
    const item = reviewItems.find(i => i.id === id);
    if (!item) return;
    setReviewItems(prev => [
      ...prev.filter(i => i.id !== id),
      { ...item, id: `${id}_a`, type: 'Earring (single)', isPair: false, notes: 'Split from pair' },
      { ...item, id: `${id}_b`, type: 'Earring (single)', isPair: false, notes: 'Split from pair' },
    ]);
  };

  const deleteItem = (id: string) => {
    setReviewItems(prev => prev.filter(i => i.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const updateReviewItem = (id: string, updates: Partial<ReviewItem>) => {
    setReviewItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  // Confirm and send to TakeIn
  const handleConfirm = useCallback(async () => {
    if (reviewItems.length === 0) return;
    try {
      let batchPhotoUrl = '';
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const filePath = `${batchId}/batch-photo.${ext}`;
        await supabase.storage.from('batch-photos').upload(filePath, imageFile, { upsert: true });
        const { data: urlData } = supabase.storage.from('batch-photos').getPublicUrl(filePath);
        batchPhotoUrl = urlData?.publicUrl || '';
      }

      // Convert review items to detected items format
      const detected: DetectedItem[] = reviewItems.map(ri => ({
        type: ri.type,
        count: 1,
        notes: ri.notes,
        color_notes: ri.color_notes,
      }));

      onItemsDetected(detected, batchPhotoUrl);
      handleClose();
      toast.success(`Added ${reviewItems.length} draft items to your batch`);
    } catch (err: any) {
      toast.error('Failed to save batch photo');
      const detected: DetectedItem[] = reviewItems.map(ri => ({ type: ri.type, count: 1, notes: ri.notes, color_notes: ri.color_notes }));
      onItemsDetected(detected, '');
      handleClose();
    }
  }, [reviewItems, imageFile, batchId, onItemsDetected, handleClose]);

  const qrUrl = qrSessionId
    ? `${window.location.origin}/scan-upload?session=${qrSessionId}&mode=single`
    : '';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            <Button className="w-full h-12 rounded-lg flex items-center gap-3" onClick={() => cameraInputRef.current?.click()}>
              <Camera className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Use This Device Camera</div>
                <div className="text-[11px] opacity-80">Take a photo directly</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-lg flex items-center gap-3" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Upload Image</div>
                <div className="text-[11px] text-muted-foreground">Select from your files</div>
              </div>
            </Button>
            <Button variant="outline" className="w-full h-12 rounded-lg flex items-center gap-3" onClick={startQrFlow}>
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
            <Button variant="ghost" size="sm" onClick={reset} className="text-xs text-muted-foreground">Cancel</Button>
          </div>
        )}

        {/* Step: Preview captured image */}
        {step === 'capture' && (
          <div className="space-y-4">
            {imagePreview && (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={imagePreview} alt="Batch preview" className="w-full max-h-64 object-contain bg-muted" />
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 bg-background/80 backdrop-blur" onClick={() => { setImagePreview(null); setImageFile(null); setStep('method'); }}>
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

        {/* Step: Review */}
        {step === 'review' && (
          <div className="space-y-4">
            {/* Batch image thumbnail */}
            {imagePreview && (
              <div className="rounded-lg overflow-hidden border max-h-28">
                <img src={imagePreview} alt="Batch" className="w-full max-h-28 object-contain bg-muted" />
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-medium">Review Detected Items</h4>
              <Badge>{reviewItems.length} items</Badge>
            </div>

            {/* Merge/Split toolbar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                <span className="text-xs font-medium">{selectedIds.size} selected</span>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={mergeSelected}>
                  <Merge className="h-3 w-3 mr-1" /> Merge as Pair
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
                  Clear
                </Button>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-auto">
              {reviewItems.map((item) => (
                <div key={item.id} className={`p-3 rounded-lg border transition-colors ${selectedIds.has(item.id) ? 'bg-primary/5 border-primary/30' : 'bg-muted/50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-muted-foreground/30 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Input
                            value={item.type}
                            onChange={(e) => updateReviewItem(item.id, { type: e.target.value })}
                            className="h-6 text-xs font-medium border-0 border-b border-transparent hover:border-border focus:border-primary bg-transparent px-0 w-auto max-w-[140px]"
                          />
                          <Select value={item.category} onValueChange={(v) => updateReviewItem(item.id, { category: v })}>
                            <SelectTrigger className="h-6 w-20 text-[10px] border-0 bg-muted/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Jewelry">Jewelry</SelectItem>
                              <SelectItem value="Watch">Watch</SelectItem>
                              <SelectItem value="Bullion">Bullion</SelectItem>
                              <SelectItem value="Silverware">Silverware</SelectItem>
                            </SelectContent>
                          </Select>
                          {item.isPair && <Badge variant="secondary" className="text-[9px] h-4 px-1">Pair</Badge>}
                        </div>
                        {item.color_notes && (
                          <span className="text-[10px] text-muted-foreground italic">{item.color_notes}</span>
                        )}
                        {item.notes && (
                          <p className="text-[10px] text-muted-foreground truncate">{item.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {item.isPair && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => splitItem(item.id)} title="Split into singles">
                          <Split className="h-3 w-3" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteItem(item.id)} title="Remove">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground italic">
              Draft items only — metal type, karat, and weight still need manual verification.
            </p>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                <Camera className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button className="flex-1" onClick={handleConfirm} disabled={reviewItems.length === 0}>
                <Check className="h-4 w-4 mr-2" />
                Add {reviewItems.length} Items
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
