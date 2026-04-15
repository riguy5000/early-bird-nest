import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  images: string[];
  initialIndex?: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ images, initialIndex = 0, open, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open) {
      setIndex(initialIndex);
      setZoom(1);
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
      else if (e.key === 'ArrowRight') setIndex(i => Math.min(images.length - 1, i + 1));
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, images.length, onClose]);

  if (!images.length) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-none overflow-hidden [&>button]:hidden">
        <div className="relative flex items-center justify-center w-full h-[85vh]">
          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Zoom controls */}
          <div className="absolute top-3 left-3 z-10 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-white text-xs flex items-center px-2">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              className="text-white hover:bg-white/20 rounded-full h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* Nav arrows */}
          {images.length > 1 && index > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIndex(i => i - 1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full h-10 w-10 p-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          {images.length > 1 && index < images.length - 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIndex(i => i + 1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20 rounded-full h-10 w-10 p-0"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* Image */}
          <div className="overflow-auto w-full h-full flex items-center justify-center">
            <img
              src={images[index]}
              alt={`Photo ${index + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          </div>

          {/* Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-xs bg-black/50 px-3 py-1 rounded-full">
              {index + 1} / {images.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
