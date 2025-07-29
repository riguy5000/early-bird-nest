import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Zap, X } from 'lucide-react';

interface AIAssistBannerProps {
  onActivate: () => void;
}

export function AIAssistBanner({ onActivate }: AIAssistBannerProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-primary/5 border-b border-primary/10 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <Badge variant="secondary" className="text-xs">AI Assist</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Multiple items detected. Try AI tray capture to auto-detect and count items.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onActivate}
            className="flex items-center gap-1"
          >
            <Camera className="h-3 w-3" />
            Try AI Capture
            <Badge variant="outline" className="ml-1 text-[10px] px-1">⌘+J</Badge>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}