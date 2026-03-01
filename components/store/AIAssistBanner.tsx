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
    <div className="mx-6 mt-3">
      <div className="bg-primary/[0.03] border border-primary/10 rounded-xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">
            Multiple items detected — try <span className="font-medium text-foreground">AI tray capture</span> to auto-detect items.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onActivate}
            className="flex items-center gap-1.5 text-xs rounded-full bg-primary/5 hover:bg-primary/10 text-primary px-3"
          >
            <Camera className="h-3 w-3" />
            Try AI Capture
            <kbd className="ml-1 text-[10px] text-muted-foreground font-mono">⌘J</kbd>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0 rounded-full text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
