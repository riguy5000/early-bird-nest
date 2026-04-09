import React, { useState, useRef, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, Upload, Loader2, Sparkles, Check, X, QrCode, Smartphone, Merge, Split, Trash2, ImageIcon, AlertTriangle, ShieldCheck, ShieldAlert, Eye, Crop } from 'lucide-react';
import { CropEditor } from './CropEditor';

interface DetectedItem {
  type: string;
  count: number;
  notes?: string;
  color_notes?: string;
  detection_confidence?: number;
  overlap_flag?: boolean;
  bbox?: { x_min: number; y_min: number; x_max: number; y_max: number };
}

type ReviewStatus = 'clean' | 'low_confidence' | 'mixed_crop' | 'needs_review';

interface ReviewItem {
  id: string;
  type: string;
  color_notes: string;
  notes: string;
  isPair: boolean;
  category: string;
  cropDataUrl?: string;
  cropUrl?: string;
  bbox?: { x_min: number; y_min: number; x_max: number; y_max: number };
  detectionConfidence: number;
  overlapFlag: boolean;
  classificationConfidence: number;
  isMixedCrop: boolean;
  status: ReviewStatus;
}

interface AICaptureResult {
  items: DetectedItem[];
  total_count: number;
}

export interface AICaptureItemResult {
  type: string;
  count: number;
  notes?: string;
  color_notes?: string;
  cropUrl?: string;
}

interface AICaptureModalProps {
  open: boolean;
  onClose: () => void;
  onItemsDetected: (items: AICaptureItemResult[], batchPhotoUrl: string) => void;
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

/** Crop a region from an image using canvas with TIGHT padding */
function cropImageFromDataUrl(
  imageDataUrl: string,
  bbox: { x_min: number; y_min: number; x_max: number; y_max: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const bboxW = bbox.x_max - bbox.x_min;
      const bboxH = bbox.y_max - bbox.y_min;
      // Tighter padding: much less space around item
      const itemSize = Math.max(bboxW, bboxH);
      const padding = itemSize < 0.08 ? 0.04 : itemSize < 0.15 ? 0.025 : itemSize < 0.3 ? 0.015 : 0.01;
      const x1 = Math.max(0, Math.floor((bbox.x_min - padding) * w));
      const y1 = Math.max(0, Math.floor((bbox.y_min - padding) * h));
      const x2 = Math.min(w, Math.ceil((bbox.x_max + padding) * w));
      const y2 = Math.min(h, Math.ceil((bbox.y_max + padding) * h));
      const cw = x2 - x1;
      const ch = y2 - y1;
      if (cw < 20 || ch < 20) { resolve(imageDataUrl); return; }
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, x1, y1, cw, ch, 0, 0, cw, ch);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = reject;
    img.src = imageDataUrl;
  });
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] || '';
}

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

function computeStatus(item: { detectionConfidence: number; classificationConfidence: number; overlapFlag: boolean; isMixedCrop: boolean }): ReviewStatus {
  if (item.isMixedCrop) return 'mixed_crop';
  if (item.overlapFlag && item.detectionConfidence < 0.7) return 'needs_review';
  const avgConf = (item.detectionConfidence + item.classificationConfidence) / 2;
  if (avgConf < 0.6) return 'needs_review';
  if (avgConf < 0.75) return 'low_confidence';
  return 'clean';
}

const STATUS_CONFIG: Record<ReviewStatus, { label: string; color: string; icon: React.ElementType }> = {
  clean: { label: 'Clean', color: 'bg-green-100 text-green-800 border-green-200', icon: ShieldCheck },
  low_confidence: { label: 'Low Confidence', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertTriangle },
  mixed_crop: { label: 'Mixed Crop', color: 'bg-red-100 text-red-800 border-red-200', icon: ShieldAlert },
  needs_review: { label: 'Needs Review', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Eye },
};

export function AICaptureModal({ open, onClose, onItemsDetected, batchId }: AICaptureModalProps) {
  const [step, setStep] = useState<'method' | 'capture' | 'qr' | 'detecting' | 'cropping' | 'classifying' | 'review'>('method');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [stageProgress, setStageProgress] = useState('');
  const [reCropItemId, setReCropItemId] = useState<string | null>(null);
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
    setStageProgress('');
    setReCropItemId(null);
    if (qrPollRef.current) {
      clearInterval(qrPollRef.current);
      qrPollRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [onClose, reset]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => { setImagePreview(reader.result as string); setStep('capture'); };
    reader.readAsDataURL(file);
  }, []);

  // ========== 4-STAGE PIPELINE ==========
  const handleAnalyze = useCallback(async () => {
    if (!imagePreview) return;
    try {
      setStep('detecting');
      setStageProgress('Stage 1/4 — Detecting item regions…');
      const base64 = imagePreview.split(',')[1];
      const { data: detectData, error: detectError } = await supabase.functions.invoke('ai-capture', {
        body: { image_base64: base64 },
      });
      if (detectError) throw detectError;
      if (detectData?.error) throw new Error(detectData.error);
      const detections = detectData as AICaptureResult;

      if (!detections.items || detections.items.length === 0) {
        toast.error('No items detected in the image');
        setStep('capture');
        return;
      }

      setStep('cropping');
      setStageProgress(`Stage 2/4 — Cropping ${detections.items.length} items…`);

      const cropsWithMeta: Array<{
        detected: DetectedItem;
        cropDataUrl: string;
        cropBase64: string;
      }> = [];

      for (const detected of detections.items) {
        if (!detected.bbox) continue;
        try {
          const cropDataUrl = await cropImageFromDataUrl(imagePreview, detected.bbox);
          cropsWithMeta.push({
            detected,
            cropDataUrl: cropDataUrl !== imagePreview ? cropDataUrl : imagePreview,
            cropBase64: cropDataUrl !== imagePreview ? dataUrlToBase64(cropDataUrl) : base64,
          });
        } catch {
          cropsWithMeta.push({ detected, cropDataUrl: imagePreview, cropBase64: base64 });
        }
      }

      setStep('classifying');
      setStageProgress(`Stage 3/4 — Classifying ${cropsWithMeta.length} crops…`);

      let classifications: Array<{
        crop_index: number;
        type: string;
        category: string;
        color_notes?: string;
        notes?: string;
        classification_confidence: number;
        is_mixed_crop: boolean;
      }> = [];

      try {
        const cropsPayload = cropsWithMeta.map((c) => ({
          crop_base64: c.cropBase64,
          original_type_hint: c.detected.type,
        }));
        const { data: classifyData, error: classifyError } = await supabase.functions.invoke('ai-classify-crop', {
          body: { crops: cropsPayload },
        });
        if (!classifyError && classifyData?.classifications) {
          classifications = classifyData.classifications;
        }
      } catch (err) {
        console.warn('Stage 3 classification failed, using Stage 1 types as fallback', err);
      }

      setStageProgress('Stage 4/4 — Validating results…');

      const items: ReviewItem[] = [];
      for (let i = 0; i < cropsWithMeta.length; i++) {
        const crop = cropsWithMeta[i];
        const detected = crop.detected;
        const classification = classifications.find(c => c.crop_index === i);
        const finalType = classification?.type || detected.type;
        const finalCategory = classification?.category || categorize(detected.type);
        const finalColorNotes = classification?.color_notes || detected.color_notes || '';
        const finalNotes = classification?.notes || detected.notes || '';
        const classificationConfidence = classification?.classification_confidence ?? 0.5;
        const isMixedCrop = classification?.is_mixed_crop ?? false;
        const detectionConfidence = detected.detection_confidence ?? 0.7;
        const overlapFlag = detected.overlap_flag ?? false;
        const isEarring = isEarringType(finalType);
        const isPair = isEarring && (finalType.toLowerCase().includes('earrings') || (finalNotes || '').toLowerCase().includes('pair'));
        const id = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${i}`;

        const reviewItem: ReviewItem = {
          id, type: isPair ? 'Earrings' : (isEarring ? 'Earring (single)' : finalType),
          color_notes: finalColorNotes, notes: isPair ? `Pair${finalNotes ? ' — ' + finalNotes : ''}` : finalNotes,
          isPair, category: finalCategory, cropDataUrl: crop.cropDataUrl, bbox: detected.bbox,
          detectionConfidence, overlapFlag, classificationConfidence, isMixedCrop, status: 'clean',
        };
        reviewItem.status = computeStatus(reviewItem);
        items.push(reviewItem);
      }

      items.sort((a, b) => {
        const order: Record<ReviewStatus, number> = { mixed_crop: 0, needs_review: 1, low_confidence: 2, clean: 3 };
        return order[a.status] - order[b.status];
      });

      setReviewItems(items);
      setStep('review');
      const flagged = items.filter(i => i.status !== 'clean').length;
      if (flagged > 0) toast.info(`${flagged} item(s) flagged for review`);
    } catch (err: any) {
      console.error('AI capture pipeline error:', err);
      toast.error(err.message || 'Failed to analyze image');
      setStep('capture');
    }
  }, [imagePreview]);

  // QR remote capture
  const startQrFlow = useCallback(() => {
    const sessionId = `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setQrSessionId(sessionId);
    setStep('qr');
    if (qrPollRef.current) clearInterval(qrPollRef.current);
    qrPollRef.current = setInterval(async () => {
      try {
        const { data } = await supabase.from('kv_store_62d2b480').select('value').eq('key', `qr_scan_${sessionId}`).maybeSingle();
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
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const mergeSelected = () => {
    if (selectedIds.size < 2) { toast.error('Select at least 2 items to merge'); return; }
    const ids = Array.from(selectedIds);
    const kept = reviewItems.find(i => i.id === ids[0])!;
    setReviewItems(prev => [
      ...prev.filter(i => !selectedIds.has(i.id)),
      { ...kept, type: 'Earrings', isPair: true, notes: `Merged pair${kept.notes ? ' — ' + kept.notes : ''}`, status: 'clean' as ReviewStatus, classificationConfidence: 0.9 },
    ]);
    setSelectedIds(new Set());
  };

  const splitItem = (id: string) => {
    const item = reviewItems.find(i => i.id === id);
    if (!item) return;
    setReviewItems(prev => [
      ...prev.filter(i => i.id !== id),
      { ...item, id: `${id}_a`, type: 'Earring (single)', isPair: false, notes: 'Split from pair', status: 'clean' as ReviewStatus },
      { ...item, id: `${id}_b`, type: 'Earring (single)', isPair: false, notes: 'Split from pair', cropDataUrl: item.cropDataUrl, status: 'clean' as ReviewStatus },
    ]);
  };

  const deleteItem = (id: string) => {
    setReviewItems(prev => prev.filter(i => i.id !== id));
    setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const updateReviewItem = (id: string, updates: Partial<ReviewItem>) => {
    setReviewItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, ...updates };
      if (updates.category || updates.type) {
        updated.status = 'clean';
        updated.classificationConfidence = 1.0;
      }
      return updated;
    }));
  };

  const handleReCropSave = (itemId: string, croppedDataUrl: string, newBbox: { x_min: number; y_min: number; x_max: number; y_max: number }) => {
    setReviewItems(prev => prev.map(i => {
      if (i.id !== itemId) return i;
      return { ...i, cropDataUrl: croppedDataUrl, bbox: newBbox, status: 'clean' as ReviewStatus, classificationConfidence: 1.0 };
    }));
    setReCropItemId(null);
    toast.success('Crop updated');
  };

  const uploadCrop = async (cropDataUrl: string, itemIndex: number): Promise<string> => {
    const file = dataUrlToFile(cropDataUrl, `crop-${itemIndex}.jpg`);
    const filePath = `${batchId}/crops/item-${itemIndex}-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from('batch-photos').upload(filePath, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('batch-photos').getPublicUrl(filePath);
    return urlData?.publicUrl || '';
  };

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

      const results: AICaptureItemResult[] = [];
      for (let i = 0; i < reviewItems.length; i++) {
        const ri = reviewItems[i];
        let cropUrl = '';
        if (ri.cropDataUrl) {
          try { cropUrl = await uploadCrop(ri.cropDataUrl, i); } catch (err) { console.error('Failed to upload crop', i, err); }
        }
        results.push({ type: ri.type, count: 1, notes: ri.notes, color_notes: ri.color_notes, cropUrl });
      }

      onItemsDetected(results, batchPhotoUrl);
      handleClose();
      toast.success(`Added ${reviewItems.length} draft items with individual photos`);
    } catch (err: any) {
      console.error('Failed to save', err);
      toast.error('Failed to save batch photo');
      const results: AICaptureItemResult[] = reviewItems.map(ri => ({
        type: ri.type, count: 1, notes: ri.notes, color_notes: ri.color_notes,
      }));
      onItemsDetected(results, '');
      handleClose();
    }
  }, [reviewItems, imageFile, batchId, onItemsDetected, handleClose]);

  const qrUrl = qrSessionId
    ? `${window.location.origin}/scan-upload?session=${qrSessionId}&mode=single`
    : '';

  const confidencePercent = (val: number) => `${Math.round(val * 100)}%`;

  const reCropItem = reCropItemId ? reviewItems.find(i => i.id === reCropItemId) : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col">
        <SheetHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Tray Capture
          </SheetTitle>
          <SheetDescription className="text-xs">
            Photo items on a tray — AI detects, crops, and classifies each piece.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Re-crop editor overlay */}
          {reCropItem && imagePreview && (
            <CropEditor
              imageSrc={imagePreview}
              initialBox={reCropItem.bbox || { x_min: 0.1, y_min: 0.1, x_max: 0.9, y_max: 0.9 }}
              onSave={(dataUrl, newBbox) => handleReCropSave(reCropItem.id, dataUrl, newBbox)}
              onCancel={() => setReCropItemId(null)}
            />
          )}

          {/* Method selection */}
          {!reCropItem && step === 'method' && (
            <div className="space-y-3 pt-2">
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

          {/* QR waiting */}
          {!reCropItem && step === 'qr' && (
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

          {/* Preview captured image */}
          {!reCropItem && step === 'capture' && (
            <div className="space-y-4">
              {imagePreview && (
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={imagePreview} alt="Batch preview" className="w-full max-h-56 object-contain bg-muted" />
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

          {/* Processing stages */}
          {!reCropItem && (step === 'detecting' || step === 'cropping' || step === 'classifying') && (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
              <div>
                <p className="font-medium">{stageProgress}</p>
                <p className="text-sm text-muted-foreground mt-1">This may take a moment…</p>
              </div>
              <div className="flex items-center justify-center gap-1">
                {['Detect', 'Crop', 'Classify', 'Validate'].map((label, idx) => {
                  const stageIdx = step === 'detecting' ? 0 : step === 'cropping' ? 1 : 2;
                  return (
                    <div key={label} className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${idx <= stageIdx ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                      <span className={`text-[10px] ${idx <= stageIdx ? 'text-primary font-medium' : 'text-muted-foreground/50'}`}>{label}</span>
                      {idx < 3 && <span className="text-muted-foreground/30 text-[10px] mx-0.5">→</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review */}
          {!reCropItem && step === 'review' && (
            <div className="space-y-3">
              {imagePreview && (
                <div className="rounded-lg overflow-hidden border max-h-28">
                  <img src={imagePreview} alt="Batch" className="w-full max-h-28 object-contain bg-muted" />
                </div>
              )}

              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Review Detected Items</h4>
                <div className="flex items-center gap-1.5">
                  {(() => {
                    const clean = reviewItems.filter(i => i.status === 'clean').length;
                    const flagged = reviewItems.length - clean;
                    return (
                      <>
                        <Badge variant="secondary" className="text-[10px]">{reviewItems.length} items</Badge>
                        {flagged > 0 && <Badge variant="destructive" className="text-[10px]">{flagged} flagged</Badge>}
                      </>
                    );
                  })()}
                </div>
              </div>

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

              <div className="space-y-2">
                {reviewItems.map((item) => {
                  const statusConfig = STATUS_CONFIG[item.status];
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div key={item.id} className={`p-2.5 rounded-lg border transition-colors ${selectedIds.has(item.id) ? 'bg-primary/5 border-primary/30' : item.status !== 'clean' ? 'bg-yellow-50/50 border-yellow-200/50' : 'bg-muted/30'}`}>
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-muted-foreground/30 mt-1"
                        />

                        <div className="w-12 h-12 rounded border bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {item.cropDataUrl ? (
                            <img src={item.cropDataUrl} alt={item.type} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Input
                              value={item.type}
                              onChange={(e) => updateReviewItem(item.id, { type: e.target.value })}
                              className="h-5 text-xs font-medium border-0 border-b border-transparent hover:border-border focus:border-primary bg-transparent px-0 w-auto max-w-[110px]"
                            />
                            <Select value={item.category} onValueChange={(v) => updateReviewItem(item.id, { category: v })}>
                              <SelectTrigger className="h-5 w-[70px] text-[10px] border-0 bg-muted/50">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Jewelry">Jewelry</SelectItem>
                                <SelectItem value="Watch">Watch</SelectItem>
                                <SelectItem value="Bullion">Bullion</SelectItem>
                                <SelectItem value="Silverware">Silverware</SelectItem>
                              </SelectContent>
                            </Select>
                            {item.isPair && <Badge variant="secondary" className="text-[8px] h-3.5 px-1">Pair</Badge>}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`inline-flex items-center gap-0.5 text-[8px] px-1 py-0 rounded-full border ${statusConfig.color}`}>
                              <StatusIcon className="h-2 w-2" />
                              {statusConfig.label}
                            </span>
                            <span className="text-[8px] text-muted-foreground">
                              {confidencePercent(item.detectionConfidence)}/{confidencePercent(item.classificationConfidence)}
                            </span>
                          </div>
                          {item.color_notes && <span className="text-[9px] text-muted-foreground italic block truncate">{item.color_notes}</span>}
                        </div>

                        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setReCropItemId(item.id)} title="Re-crop">
                            <Crop className="h-3 w-3" />
                          </Button>
                          {item.isPair && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => splitItem(item.id)} title="Split">
                              <Split className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteItem(item.id)} title="Remove">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-muted-foreground italic">
                Metal type, karat, and weight still need manual entry. Use Re-crop to fix any mixed or inaccurate crops.
              </p>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        {!reCropItem && step === 'review' && (
          <div className="flex gap-2 p-4 border-t flex-shrink-0">
            <Button variant="outline" className="flex-1" onClick={reset}>
              <Camera className="h-4 w-4 mr-1" />
              Retake
            </Button>
            <Button className="flex-1" onClick={handleConfirm} disabled={reviewItems.length === 0}>
              <Check className="h-4 w-4 mr-1" />
              Add {reviewItems.length} Items
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
