/**
 * AppDrawer — Global approved right-side drawer shell
 * 
 * Source of truth: /design/approved-screens/customer-drawer-approved.png
 * + /design/DEVELOPER_HANDOFF.md §7 Right Drawer
 *
 * ALL right-side slideout panels must use this component or match this
 * exact styling system. Do not patch drawer styles individually.
 *
 * Visual spec:
 *   - Frosted glass surface: bg-white/80 backdrop-blur-xl
 *   - Floating with gap: mr-4, h-[calc(100vh-32px)], rounded-[20px]
 *   - Ring: ring-1 ring-white/60
 *   - Shadow: shadow-2xl shadow-black/[0.15]
 *   - Backdrop: bg-black/[0.08] backdrop-blur-sm
 *   - Header: p-6, border-b border-black/[0.06], title text-[22px] font-semibold
 *   - Footer: p-6, border-t border-black/[0.06]
 *   - Close button: w-9 h-9 rounded-[10px] hover:bg-[#F8F7FB]
 *   - Slide-in animation: 0.3s ease-out
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface AppDrawerProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number; // default 440
}

export function AppDrawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 440,
}: AppDrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — approved: bg-black/[0.08] backdrop-blur-sm */}
      <div
        className="fixed inset-0 z-50 bg-black/[0.08] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — approved spec */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{
          width: `${width}px`,
          /* Floating gap from all edges, matching approved design */
          top: '16px',
          right: '16px',
          bottom: '16px',
          /* Frosted glass surface */
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          /* All corners rounded */
          borderRadius: '20px',
          /* Depth */
          boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)',
          /* Subtle white ring */
          border: '1px solid rgba(255,255,255,0.6)',
          /* Slide-in animation */
          animation: 'drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-black/[0.06]">
          {typeof title === 'string' ? (
            <h2 className="text-[22px] font-semibold text-[#2B2833] tracking-tight truncate pr-4">
              {title}
            </h2>
          ) : (
            <div className="flex-1 min-w-0 pr-4">{title}</div>
          )}
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-[10px] hover:bg-[#F8F7FB] transition-colors"
            aria-label="Close"
          >
            <X className="w-[18px] h-[18px] text-[#76707F]" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {children}
        </div>

        {/* Optional footer */}
        {footer && (
          <div className="flex-shrink-0 px-6 py-5 border-t border-black/[0.06]">
            {footer}
          </div>
        )}
      </div>

      {/* Keyframe — injected once */}
      <style>{`
        @keyframes drawerSlideIn {
          from { transform: translateX(calc(100% + 16px)); opacity: 0.6; }
          to   { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
