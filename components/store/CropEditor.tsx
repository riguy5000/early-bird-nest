import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check, X, ZoomIn, ZoomOut } from 'lucide-react';

interface CropBox {
  x: number; y: number; width: number; height: number;
}

interface CropEditorProps {
  imageSrc: string;
  initialBox: { x_min: number; y_min: number; x_max: number; y_max: number };
  onSave: (croppedDataUrl: string, newBbox: { x_min: number; y_min: number; x_max: number; y_max: number }) => void;
  onCancel: () => void;
}

export function CropEditor({ imageSrc, initialBox, onSave, onCancel }: CropEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [displaySize, setDisplaySize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, width: 0, height: 0 });
  const [dragging, setDragging] = useState<null | 'move' | 'nw' | 'ne' | 'sw' | 'se'>(null);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0, cw: 0, ch: 0 });

  const originalBox = useRef(initialBox);

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setImgSize({ w: natW, h: natH });

    const container = containerRef.current;
    if (!container) return;
    const maxW = container.clientWidth;
    const maxH = 400;
    const scale = Math.min(maxW / natW, maxH / natH, 1);
    const dw = natW * scale;
    const dh = natH * scale;
    setDisplaySize({ w: dw, h: dh });

    setCrop({
      x: initialBox.x_min * dw,
      y: initialBox.y_min * dh,
      width: (initialBox.x_max - initialBox.x_min) * dw,
      height: (initialBox.y_max - initialBox.y_min) * dh,
    });
  }, [initialBox]);

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

  const handleMouseDown = useCallback((e: React.MouseEvent, mode: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(mode);
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y, cw: crop.width, ch: crop.height };
  }, [crop]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const { cx, cy, cw, ch } = dragStart.current;
    const dw = displaySize.w * zoom;
    const dh = displaySize.h * zoom;

    if (dragging === 'move') {
      setCrop({ x: clamp(cx + dx, 0, dw - cw), y: clamp(cy + dy, 0, dh - ch), width: cw, height: ch });
    } else {
      let nx = cx, ny = cy, nw = cw, nh = ch;
      if (dragging === 'se') { nw = clamp(cw + dx, 30, dw - cx); nh = clamp(ch + dy, 30, dh - cy); }
      if (dragging === 'sw') { const newX = clamp(cx + dx, 0, cx + cw - 30); nw = cw - (newX - cx); nx = newX; nh = clamp(ch + dy, 30, dh - cy); }
      if (dragging === 'ne') { nw = clamp(cw + dx, 30, dw - cx); const newY = clamp(cy + dy, 0, cy + ch - 30); nh = ch - (newY - cy); ny = newY; }
      if (dragging === 'nw') { const newX = clamp(cx + dx, 0, cx + cw - 30); nw = cw - (newX - cx); nx = newX; const newY = clamp(cy + dy, 0, cy + ch - 30); nh = ch - (newY - cy); ny = newY; }
      setCrop({ x: nx, y: ny, width: nw, height: nh });
    }
  }, [dragging, displaySize, zoom]);

  const handleMouseUp = useCallback(() => { setDragging(null); }, []);

  const resetCrop = () => {
    const dw = displaySize.w * zoom;
    const dh = displaySize.h * zoom;
    setCrop({
      x: initialBox.x_min * dw,
      y: initialBox.y_min * dh,
      width: (initialBox.x_max - initialBox.x_min) * dw,
      height: (initialBox.y_max - initialBox.y_min) * dh,
    });
  };

  const handleSave = () => {
    const dw = displaySize.w * zoom;
    const dh = displaySize.h * zoom;
    if (dw === 0 || dh === 0) return;
    const newBbox = {
      x_min: crop.x / dw,
      y_min: crop.y / dh,
      x_max: (crop.x + crop.width) / dw,
      y_max: (crop.y + crop.height) / dh,
    };

    // Generate cropped image
    const img = new Image();
    img.onload = () => {
      const sx = Math.floor(newBbox.x_min * img.naturalWidth);
      const sy = Math.floor(newBbox.y_min * img.naturalHeight);
      const sw = Math.ceil((newBbox.x_max - newBbox.x_min) * img.naturalWidth);
      const sh = Math.ceil((newBbox.y_max - newBbox.y_min) * img.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      onSave(canvas.toDataURL('image/jpeg', 0.92), newBbox);
    };
    img.src = imageSrc;
  };

  const scaledW = displaySize.w * zoom;
  const scaledH = displaySize.h * zoom;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Re-crop Item</h4>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={resetCrop}>
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-auto rounded-lg border bg-muted"
        style={{ maxHeight: 420 }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="relative" style={{ width: scaledW || '100%', height: scaledH || 'auto' }}>
          <img
            src={imageSrc}
            alt="Batch"
            onLoad={onImgLoad}
            className="block"
            style={{ width: scaledW || '100%', height: scaledH || 'auto' }}
            draggable={false}
          />
          {/* Overlay dimming outside crop */}
          {scaledW > 0 && (
            <>
              <div className="absolute inset-0 bg-black/40 pointer-events-none" style={{ clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 ${crop.y}px, ${crop.x}px ${crop.y}px, ${crop.x}px ${crop.y + crop.height}px, ${crop.x + crop.width}px ${crop.y + crop.height}px, ${crop.x + crop.width}px ${crop.y}px, 0 ${crop.y}px)` }} />
              {/* Crop box */}
              <div
                className="absolute border-2 border-primary cursor-move"
                style={{ left: crop.x, top: crop.y, width: crop.width, height: crop.height }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
              >
                {/* Corner handles */}
                {(['nw', 'ne', 'sw', 'se'] as const).map(corner => (
                  <div
                    key={corner}
                    className="absolute w-3 h-3 bg-primary rounded-full border-2 border-background"
                    style={{
                      top: corner.startsWith('n') ? -6 : undefined,
                      bottom: corner.startsWith('s') ? -6 : undefined,
                      left: corner.endsWith('w') ? -6 : undefined,
                      right: corner.endsWith('e') ? -6 : undefined,
                      cursor: corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize',
                    }}
                    onMouseDown={(e) => handleMouseDown(e, corner)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          <X className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Button className="flex-1" onClick={handleSave}>
          <Check className="h-4 w-4 mr-1" /> Save Crop
        </Button>
      </div>
    </div>
  );
}
