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
    <div className="sticky bottom-0 bg-card/95 backdrop-blur border-t border-border/50">
      <div className="p-4 space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Market Value</div>
            <div className="text-lg font-semibold">
              ${totals.totalMarketValue.toFixed(2)}
            </div>
          </div>
          
          {!hidePayout && (
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Payout</div>
              <div className="text-2xl font-bold text-primary">
                ${totals.totalPayout.toFixed(2)}
              </div>
            </div>
          )}
          
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Avg Payout %</div>
            <div className="text-lg font-semibold">
              {totals.avgPayoutPercentage.toFixed(1)}%
            </div>
          </div>
          
          {!hideProfit && (
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Profit</div>
              <div className="text-lg font-semibold text-green-600">
                ${totals.profit.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Payment & Actions */}
        <div className="flex items-center justify-between gap-4">
          {/* Payment Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Payment:</Label>
              <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
                <SelectTrigger className="w-32">
                  <div className="flex items-center gap-2">
                    {getPaymentIcon()}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Check">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Check
                    </div>
                  </SelectItem>
                  <SelectItem value="Cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="Store Credit">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Store Credit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'Check' && (
              <div className="flex items-center gap-2">
                <Label className="text-sm">Check #:</Label>
                <Input 
                  value={checkNumber}
                  onChange={(e) => onCheckNumberChange(e.target.value)}
                  placeholder="Enter check number"
                  className="w-32"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch 
                id="follow-up"
                checked={followUpReminder}
                onCheckedChange={onFollowUpReminderChange}
              />
              <Label htmlFor="follow-up" className="text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                7-day follow-up
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onCustomerInfo}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Customer Info
            </Button>

            <Button 
              variant="outline" 
              onClick={onPrintLabels}
              disabled={!hasItems}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Labels
            </Button>

            <Button 
              onClick={onSave}
              disabled={!hasItems}
              className="flex items-center gap-2 min-w-24"
            >
              <Save className="h-4 w-4" />
              Save Quote
            </Button>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="flex justify-center">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="px-1 py-0 text-[10px]">Ctrl+S</Badge>
              <span>Save</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="px-1 py-0 text-[10px]">+</Badge>
              <span>Add Item</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="px-1 py-0 text-[10px]">Shift+D</Badge>
              <span>Toggle View</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="px-1 py-0 text-[10px]">⌘+J</Badge>
              <span>AI Assist</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}