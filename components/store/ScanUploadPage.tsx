import React, { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, CheckCircle2, Loader2, Smartphone, Sparkles } from 'lucide-react';

/**
 * Lightweight page opened by scanning a QR code.
 * Supports two modes via ?mode= query param:
 *   - "id" (default): Customer ID scan — front + optional back
 *   - "single": AI item capture — single photo of items on a tray
 */
export function ScanUploadPage() {
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session') || '';
  const mode = params.get('mode') || 'id';
  const isItemCapture = mode === 'single';

  const [step, setStep] = useState<'front' | 'back' | 'uploading' | 'done' | 'error'>('front');
  const [frontBase64, setFrontBase64] = useState<string | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFront = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    if (isItemCapture) {
      // Single photo mode — submit immediately
      await submitImages(b64, null);
    } else {
      setFrontBase64(b64);
      setStep('back');
    }
  }, [isItemCapture]);

  const handleBack = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await fileToBase64(file);
    await submitImages(frontBase64!, b64);
  }, [frontBase64]);

  const skipBack = useCallback(async () => {
    if (frontBase64) await submitImages(frontBase64, null);
  }, [frontBase64]);

  const submitImages = async (front: string, back: string | null) => {
    setStep('uploading');
    try {
      const payload: any = isItemCapture
        ? { image_base64: front }
        : { front_image_base64: front, ...(back ? { back_image_base64: back } : {}) };

      const { error } = await supabase
        .from('kv_store_62d2b480')
        .upsert({ key: `qr_scan_${sessionId}`, value: payload as any });

      if (error) throw error;
      setStep('done');
    } catch (err) {
      console.error('Submit error:', err);
      setStep('error');
    }
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center text-red-500">
          <p className="font-medium">Invalid scan link</p>
          <p className="text-sm text-slate-500 mt-1">This link is missing session information.</p>
        </div>
      </div>
    );
  }

  const title = isItemCapture ? 'Capture Items' : 'Scan Customer ID';
  const subtitle = isItemCapture
    ? 'Take a photo of items spread out on a tray'
    : 'Take photos of the customer\'s ID';
  const Icon = isItemCapture ? Sparkles : Smartphone;
  const iconBg = isItemCapture ? 'bg-amber-100' : 'bg-blue-100';
  const iconColor = isItemCapture ? 'text-amber-600' : 'text-blue-600';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className={`w-14 h-14 mx-auto rounded-2xl ${iconBg} flex items-center justify-center mb-3`}>
            <Icon className={`h-7 w-7 ${iconColor}`} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
        </div>

        {step === 'front' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
              <Camera className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-slate-900">
                {isItemCapture ? 'Photo of Items' : 'Front of ID'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {isItemCapture
                  ? 'Spread items out and take a clear photo'
                  : 'Take a clear photo of the front'}
              </p>
            </div>
            <button
              onClick={() => frontRef.current?.click()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {isItemCapture ? 'Take Photo' : 'Capture Front'}
            </button>
            <input ref={frontRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFront} />
          </div>
        )}

        {step === 'back' && !isItemCapture && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center space-y-4">
            <div className="flex items-center justify-center gap-1.5 text-green-600 mb-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Front captured</span>
            </div>
            <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center">
              <Camera className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-slate-900">Back of ID</p>
              <p className="text-xs text-slate-500 mt-0.5">Take a photo of the back side</p>
            </div>
            <button
              onClick={() => backRef.current?.click()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Capture Back
            </button>
            <button
              onClick={skipBack}
              className="w-full py-2 text-slate-500 text-xs hover:text-slate-700"
            >
              Skip — use front only
            </button>
            <input ref={backRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleBack} />
          </div>
        )}

        {step === 'uploading' && (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
            <Loader2 className="h-6 w-6 mx-auto animate-spin text-blue-600" />
            <p className="font-medium text-sm text-slate-900">
              {isItemCapture ? 'Sending photo…' : 'Sending photos…'}
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="bg-white border border-green-200 rounded-xl p-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-500" />
            <p className="font-semibold text-slate-900">
              {isItemCapture ? 'Photo received!' : 'Photos received!'}
            </p>
            <p className="text-xs text-slate-500">You can close this page now.</p>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-center space-y-3">
            <p className="font-medium text-red-600">
              {isItemCapture ? 'Failed to send photo' : 'Failed to send photos'}
            </p>
            <button
              onClick={() => setStep('front')}
              className="text-sm text-blue-600 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
