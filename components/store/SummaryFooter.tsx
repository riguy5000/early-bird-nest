import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Save, 
  DollarSign,
  CreditCard,
  Banknote,
  Gift
} from 'lucide-react';

interface SummaryFooterProps {
  totals: {
    totalMarketValue: number;
    totalPayout: number;
    avgPayoutPercentage: number;
    profit: number;
  };
  paymentMethod: 'Check' | 'Cash' | 'Store Credit';
  onPaymentMethodChange: (method: 'Check' | 'Cash' | 'Store Credit') => void;
  checkNumber: string;
  onCheckNumberChange: (number: string) => void;
  followUpReminder: boolean;
  onFollowUpReminderChange: (enabled: boolean) => void;
  onCustomerInfo: () => void;
  onSave: () => void;
  onPrintLabels: () => void;
  hideProfit: boolean;
  hidePayout: boolean;
  hasItems: boolean;
}

export function SummaryFooter({
  totals,
  paymentMethod,
  onPaymentMethodChange,
  checkNumber,
  onCheckNumberChange,
  followUpReminder,
  onFollowUpReminderChange,
  onCustomerInfo,
  onSave,
  onPrintLabels,
  hideProfit,
  hidePayout,
  hasItems
}: SummaryFooterProps) {
  const getPaymentIcon = () => {
    switch (paymentMethod) {
      case 'Check': return <CreditCard className="h-3.5 w-3.5" />;
      case 'Cash': return <Banknote className="h-3.5 w-3.5" />;
      case 'Store Credit': return <Gift className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/40">
      <div className="px-6 py-3 space-y-3">
        {/* Summary Stats + Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-full">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Market</div>
              <div className="text-sm font-semibold text-foreground tabular-nums">
                ${totals.totalMarketValue.toFixed(2)}
              </div>
            </div>
            
            {!hidePayout && (
              <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Payout</div>
                <div className="text-base font-semibold text-primary tabular-nums">
                  ${totals.totalPayout.toFixed(2)}
                </div>
              </div>
            )}
            
            <div className="bg-slate-100 border border-slate-200 px-4 py-2 rounded-full">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg %</div>
              <div className="text-sm font-semibold text-foreground tabular-nums">
                {totals.avgPayoutPercentage.toFixed(1)}%
              </div>
            </div>
            
            {!hideProfit && (
              <div className="bg-green-50 px-4 py-2 rounded-full border border-green-200">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Profit</div>
                <div className="text-sm font-semibold text-green-600 tabular-nums">
                  ${totals.profit.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={onSave}
              disabled={!hasItems}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            >
              <Save className="h-4 w-4" />
              Save Quote
            </Button>

            <Button 
              onClick={onSave}
              disabled={!hasItems}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6"
            >
              <DollarSign className="h-4 w-4" />
              Complete Purchase
            </Button>
          </div>
        </div>

        {/* Customer & Payment row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onCustomerInfo}
              className="flex items-center gap-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-full"
            >
              <User className="h-3 w-3" />
              Customer Info
            </Button>

            <div className="flex items-center gap-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Payment</Label>
              <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
                <SelectTrigger className="w-28 h-7 text-xs rounded-full bg-white border border-slate-200">
                  <div className="flex items-center gap-1.5">
                    {getPaymentIcon()}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Check">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3" />
                      Check
                    </div>
                  </SelectItem>
                  <SelectItem value="Cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-3 w-3" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="Store Credit">
                    <div className="flex items-center gap-2">
                      <Gift className="h-3 w-3" />
                      Store Credit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {paymentMethod === 'Check' && (
                <Input 
                  value={checkNumber}
                  onChange={(e) => onCheckNumberChange(e.target.value)}
                  placeholder="Check #"
                  className="w-24 h-7 text-xs rounded-full bg-white border border-slate-200"
                />
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[9px] font-mono">Tab</kbd>
              Next
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[9px] font-mono">⇧D</kbd>
              View
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-200 rounded text-[9px] font-mono">⌘J</kbd>
              AI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
