import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Save, 
  Printer, 
  DollarSign,
  Calculator,
  Clock,
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
      case 'Check': return <CreditCard className="h-4 w-4" />;
      case 'Cash': return <Banknote className="h-4 w-4" />;
      case 'Store Credit': return <Gift className="h-4 w-4" />;
    }
  };

  return (
    <div className="sticky bottom-0 bg-white border-t shadow-lg">
      <div className="px-6 py-4 space-y-4">
        {/* Summary Stats - 4 KPI chips evenly spaced */}
        <div className="flex justify-between items-center">
          <div className="flex gap-6">
            <div className="bg-slate-50 px-4 py-2 rounded-full">
              <div className="text-xs text-slate-500">Market</div>
              <div className="text-sm font-semibold">
                ${totals.totalMarketValue.toFixed(2)}
              </div>
            </div>
            
            {!hidePayout && (
              <div className="bg-blue-50 px-4 py-2 rounded-full">
                <div className="text-xs text-slate-500">Payout</div>
                <div className="text-lg font-semibold text-primary">
                  ${totals.totalPayout.toFixed(2)}
                </div>
              </div>
            )}
            
            <div className="bg-slate-50 px-4 py-2 rounded-full">
              <div className="text-xs text-slate-500">Avg %</div>
              <div className="text-sm font-semibold">
                {totals.avgPayoutPercentage.toFixed(1)}%
              </div>
            </div>
            
            {!hideProfit && (
              <div className="bg-green-50 px-4 py-2 rounded-full">
                <div className="text-xs text-slate-500">Profit</div>
                <div className="text-sm font-semibold text-green-600">
                  ${totals.profit.toFixed(2)}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons - Right aligned */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={onSave}
              disabled={!hasItems}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Quote
            </Button>

            <Button 
              onClick={onSave}
              disabled={!hasItems}
              className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white"
            >
              <DollarSign className="h-4 w-4" />
              Complete Purchase
            </Button>
          </div>
        </div>

        {/* Customer & Payout Information */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-6">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onCustomerInfo}
              className="flex items-center gap-2"
            >
              <User className="h-3 w-3" />
              Customer Info
            </Button>

            <div className="flex items-center gap-3">
              <Label className="text-xs">Payment:</Label>
              <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
                <SelectTrigger className="w-28 h-8">
                  <div className="flex items-center gap-1">
                    {getPaymentIcon()}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
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
                  className="w-24 h-8"
                />
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts - Under header tooltip */}
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="px-1 py-0 text-[9px]">Tab</Badge>
              Next field
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="px-1 py-0 text-[9px]">Shift+D</Badge>
              Toggle view
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="px-1 py-0 text-[9px]">⌘+J</Badge>
              AI Assist
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}