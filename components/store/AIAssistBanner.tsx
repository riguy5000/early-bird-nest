import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Zap, X } from 'lucide-react';

interface AIAssistBannerProps {
  onActivate: () => void;
}

export function AIAssistBanner({ onActivate }: AIAssistBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs text-muted-foreground">
          Multiple items detected — try <span className="font-medium text-foreground">AI tray capture</span> to auto-detect items.
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onActivate}
          className="btn-primary-dark flex items-center gap-1.5 text-xs px-3 h-8"
        >
          <Camera className="h-3 w-3" />
          Try AI Capture
          <kbd className="ml-1 text-[10px] text-white/70 font-mono">⌘J</kbd>
        </button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsVisible(false)}
          className="h-6 w-6 p-0 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
