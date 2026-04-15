import { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { apiCall } from '../utils/supabase/simple-client';
import { Search, Plus, DollarSign, Calendar as CalendarIcon, User, Receipt, TrendingUp, Download, Eye } from 'lucide-react';

interface Payout {
  id: string; customerId: string; customerName: string; amount: number; method: string;
  status: string; items: number; employeeName: string; notes: string; createdAt: string; updatedAt: string;
}

interface PayoutSummary { totalPayouts: number; todayPayouts: number; weekPayouts: number; monthPayouts: number; averagePayout: number; payoutChange: number; }
interface Store { id: string; name: string; }
interface PayoutsModuleProps { currentStore: Store | null; }

export function PayoutsModule({ currentStore }: PayoutsModuleProps) {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => { if (currentStore) loadPayouts(); }, [currentStore]);
  useEffect(() => { filterPayouts(); calculateSummary(); }, [payouts, searchTerm, statusFilter, methodFilter, dateRange]);

  const loadPayouts = async () => {
    if (!currentStore) return;
    setLoading(true);
    try {
      const { payouts: storePayouts } = await apiCall(`/stores/${currentStore.id}/payouts`);
      const mockPayouts: Payout[] = [
        { id: '1', customerId: 'cust1', customerName: 'John Smith', amount: 450.00, method: 'Cash', status: 'Completed', items: 3, employeeName: 'Store Owner', notes: 'Gold jewelry (earl)...', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: '2', customerId: 'cust2', customerName: 'Mary Johnson', amount: 1250.75, method: 'Check', status: 'Completed', items: 5, employeeName: 'Store Owner', notes: 'Watch and two col...', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', customerId: 'cust3', customerName: 'Robert Brown', amount: 325.50, method: 'Cash', status: 'Pending', items: 2, employeeName: 'Store Owner', notes: 'Silver items', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString() },
      ];
      setPayouts([...mockPayouts, ...(storePayouts || [])]);
    } catch (error) { console.error('Error loading payouts:', error); }
    finally { setLoading(false); }
  };

  const filterPayouts = () => {
    let filtered = payouts;
    if (searchTerm) filtered = filtered.filter(p => p.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || p.notes?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter !== 'all') filtered = filtered.filter(p => p.status === statusFilter);
    if (methodFilter !== 'all') filtered = filtered.filter(p => p.method === methodFilter);
    if (dateRange.from) filtered = filtered.filter(p => new Date(p.createdAt) >= dateRange.from!);
    if (dateRange.to) filtered = filtered.filter(p => new Date(p.createdAt) <= dateRange.to!);
    setFilteredPayouts(filtered);
  };

  const calculateSummary = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const completed = payouts.filter(p => p.status === 'Completed');
    const total = completed.reduce((s, p) => s + p.amount, 0);
    const todayTotal = completed.filter(p => new Date(p.createdAt) >= today).reduce((s, p) => s + p.amount, 0);
    const weekTotal = completed.filter(p => new Date(p.createdAt) >= weekAgo).reduce((s, p) => s + p.amount, 0);
    const avg = completed.length > 0 ? total / completed.length : 0;
    setSummary({ totalPayouts: total, todayPayouts: todayTotal, weekPayouts: weekTotal, monthPayouts: total, averagePayout: avg, payoutChange: 12.3 });
  };

  const fmtCurrency = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getMethodIcon = (m: string) => m === 'Cash' ? '💵' : m === 'Check' ? '📝' : '💰';

  if (!currentStore) {
    return <div className="glass-card p-6"><p className="text-[#76707F] text-[14px]">Select a store to view payouts.</p></div>;
  }

  const summaryCards = [
    { label: 'Total Payouts', value: fmtCurrency(summary?.totalPayouts || 0), extra: `+${summary?.payoutChange || 0}%` },
    { label: "Today's Payouts", value: fmtCurrency(summary?.todayPayouts || 0) },
    { label: 'This Week', value: fmtCurrency(summary?.weekPayouts || 0) },
    { label: 'Average Payout', value: fmtCurrency(summary?.averagePayout || 0) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[36px] font-semibold tracking-tight title-gradient">Payouts Ledger</h2>
          <p className="text-[15px] text-[#76707F]">{currentStore.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary-light flex items-center gap-2 text-[13px] px-4 py-2">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="btn-primary-dark flex items-center gap-2">
            <Plus className="w-4 h-4" /> Record Payout
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <div key={i} className="kpi-card">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] text-[#76707F] font-medium">{card.label}</div>
              {card.extra && <span className="text-[12px] text-[#4ADB8A] font-medium">+{summary?.payoutChange}%</span>}
            </div>
            <div className="text-[28px] font-semibold text-[#2B2833] tracking-tight">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A3AE]" />
          <input placeholder="Search customers, notes, or payment methods..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-glass pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 bg-white/60 border-black/[0.06] rounded-[10px] text-[13px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-36 h-9 bg-white/60 border-black/[0.06] rounded-[10px] text-[13px]">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Check">Check</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <button className="btn-secondary-light flex items-center gap-2 text-[13px] px-4 py-2">
                <CalendarIcon className="w-4 h-4" /> Date Range
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white/90 backdrop-blur-xl rounded-[14px] border border-white/60 shadow-2xl" align="end">
              <Calendar mode="range" selected={{ from: dateRange.from, to: dateRange.to }} onSelect={(range) => { if (range) setDateRange({ from: range.from, to: range.to }); else setDateRange({ from: undefined, to: undefined }); }} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-black/[0.04]">
          <h3 className="text-[18px] font-semibold text-[#2B2833]">Payout History ({filteredPayouts.length})</h3>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B5EF9] mx-auto" />
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-[#A8A3AE] mx-auto mb-4" />
            <p className="text-[#76707F] text-[14px]">No payouts found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="table-header-gradient">
              <tr>
                {['CUSTOMER', 'AMOUNT', 'METHOD', 'ITEMS', 'STATUS', 'DATE', 'EMPLOYEE', 'ACTIONS'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-[#FAFAF9] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#6B5EF9]/10 flex items-center justify-center text-[12px] font-semibold text-[#6B5EF9]">
                        {payout.customerName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-[14px] font-medium text-[#2B2833]">{payout.customerName}</div>
                        {payout.notes && <div className="text-[12px] text-[#A8A3AE] truncate max-w-32">{payout.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[14px] font-semibold text-[#2B2833]">{fmtCurrency(payout.amount)}</td>
                  <td className="px-6 py-4"><span className="text-[14px] text-[#2B2833]">{getMethodIcon(payout.method)} {payout.method}</span></td>
                  <td className="px-6 py-4 text-[14px] text-[#76707F]">{payout.items} items</td>
                  <td className="px-6 py-4">
                    <Badge className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${payout.status === 'Completed' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF9E6] text-[#E65100]'}`}>
                      {payout.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#76707F]">
                    <div className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {fmtDate(payout.createdAt)}</div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-[#76707F]">{payout.employeeName}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setSelectedPayout(payout); setShowDetails(true); }} className="w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-[#F8F7FB] transition-colors">
                      <Eye className="w-4 h-4 text-[#76707F]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-[22px] font-semibold text-[#2B2833]">Payout Details</SheetTitle>
          </SheetHeader>
          {selectedPayout && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-[11px] text-[#76707F] uppercase tracking-wider">Customer</div><div className="text-[15px] font-medium text-[#2B2833] mt-1">{selectedPayout.customerName}</div></div>
                <div><div className="text-[11px] text-[#76707F] uppercase tracking-wider">Amount</div><div className="text-[15px] font-medium text-[#2B2833] mt-1">{fmtCurrency(selectedPayout.amount)}</div></div>
                <div><div className="text-[11px] text-[#76707F] uppercase tracking-wider">Method</div><div className="text-[15px] text-[#2B2833] mt-1">{selectedPayout.method}</div></div>
                <div><div className="text-[11px] text-[#76707F] uppercase tracking-wider">Status</div><div className="mt-1"><Badge className={`${selectedPayout.status === 'Completed' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'bg-[#FFF9E6] text-[#E65100]'}`}>{selectedPayout.status}</Badge></div></div>
                <div><div className="text-[11px] text-[#76707F] uppercase tracking-wider">Date</div><div className="text-[15px] text-[#2B2833] mt-1">{fmtDate(selectedPayout.createdAt)}</div></div>
                <div><div className="text-[11px] text-[#76707F] uppercase tracking-wider">Employee</div><div className="text-[15px] text-[#2B2833] mt-1">{selectedPayout.employeeName}</div></div>
              </div>
              {selectedPayout.notes && <div><div className="text-[11px] text-[#76707F] uppercase tracking-wider">Notes</div><p className="text-[14px] text-[#2B2833] mt-1">{selectedPayout.notes}</p></div>}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
