import React from 'react';

/**
 * Premium dimensional icon artwork for KPI cards and quick actions.
 * Uses layered SVG fills with opacity for a 3D/dimensional feel,
 * matching the approved Figma design system.
 */

interface PremiumIconProps {
  type: string;
  className?: string;
}

export function PremiumIcon({ type, className = 'h-5 w-5' }: PremiumIconProps) {
  const iconMap: Record<string, React.ReactNode> = {
    package: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#6B5EF9" opacity="0.15" />
        <path d="M12 2L3 7l9 5 9-5-9-5z" fill="#6B5EF9" opacity="0.3" stroke="#6B5EF9" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 12v10" stroke="#6B5EF9" strokeWidth="2" strokeLinecap="round" />
        <path d="M3 7l9 5 9-5" stroke="#6B5EF9" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 17l9 5 9-5" stroke="#6B5EF9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    users: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="4" fill="#6B5EF9" opacity="0.2" stroke="#6B5EF9" strokeWidth="1.5" />
        <path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2" fill="#6B5EF9" opacity="0.15" stroke="#6B5EF9" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="17" cy="8" r="3" fill="#4889FA" opacity="0.2" stroke="#4889FA" strokeWidth="1.5" />
        <path d="M22 21v-1.5a3 3 0 00-3-3h-1" stroke="#4889FA" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'dollar-sign': (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#6B5EF9" opacity="0.12" />
        <path d="M12 2v20" stroke="#6B5EF9" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
        <path d="M17 6H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#6B5EF9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    'trending-up': (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M4 18L10 12L14 16L22 6" fill="none" stroke="#4ADB8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 18L10 12L14 16L22 6V18H4Z" fill="#4ADB8A" opacity="0.1" />
        <path d="M16 6h6v6" stroke="#4ADB8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    'trending-down': (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M4 6L10 12L14 8L22 18" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 18h6v-6" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    plus: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" fill="#6B5EF9" opacity="0.12" stroke="#6B5EF9" strokeWidth="1.5" />
        <path d="M12 8v8M8 12h8" stroke="#6B5EF9" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    flame: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M12 2C8 6 4 10 4 14a8 8 0 0016 0c0-4-4-8-8-12z" fill="#FF9F43" opacity="0.2" stroke="#FF9F43" strokeWidth="1.5" />
        <path d="M12 12c-1 2-2 3-2 4.5a2 2 0 004 0c0-1.5-1-2.5-2-4.5z" fill="#FF9F43" opacity="0.5" />
      </svg>
    ),
    'shopping-bag': (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6z" fill="#6B5EF9" opacity="0.12" stroke="#6B5EF9" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M3 6h18" stroke="#6B5EF9" strokeWidth="1.5" />
        <path d="M16 10a4 4 0 01-8 0" stroke="#6B5EF9" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    'bar-chart': (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="12" width="4" height="9" rx="1" fill="#6B5EF9" opacity="0.3" stroke="#6B5EF9" strokeWidth="1" />
        <rect x="10" y="6" width="4" height="15" rx="1" fill="#6B5EF9" opacity="0.5" stroke="#6B5EF9" strokeWidth="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" fill="#6B5EF9" opacity="0.7" stroke="#6B5EF9" strokeWidth="1" />
      </svg>
    ),
    'check-circle': (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#4ADB8A" opacity="0.15" stroke="#4ADB8A" strokeWidth="1.5" />
        <path d="M8 12l3 3 5-6" stroke="#4ADB8A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    layers: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#6B5EF9" opacity="0.3" stroke="#6B5EF9" strokeWidth="1.5" />
        <path d="M2 12l10 5 10-5" stroke="#6B5EF9" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M2 17l10 5 10-5" stroke="#6B5EF9" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    calendar: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="18" rx="3" fill="#6B5EF9" opacity="0.1" stroke="#6B5EF9" strokeWidth="1.5" />
        <path d="M3 9h18" stroke="#6B5EF9" strokeWidth="1.5" />
        <path d="M8 2v4M16 2v4" stroke="#6B5EF9" strokeWidth="2" strokeLinecap="round" />
        <circle cx="8" cy="14" r="1.5" fill="#6B5EF9" opacity="0.5" />
        <circle cx="12" cy="14" r="1.5" fill="#6B5EF9" opacity="0.5" />
        <circle cx="16" cy="14" r="1.5" fill="#6B5EF9" opacity="0.3" />
      </svg>
    ),
    zap: (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#6B5EF9" opacity="0.2" stroke="#6B5EF9" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  };

  return iconMap[type] || (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill="#6B5EF9" opacity="0.12" stroke="#6B5EF9" strokeWidth="1.5" />
    </svg>
  );
}
