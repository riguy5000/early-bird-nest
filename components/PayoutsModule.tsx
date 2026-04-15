import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { apiCall } from '../utils/supabase/simple-client';
import { Search, Download, Calendar as CalendarIcon, Receipt, Filter } from 'lucide-react';

interface Payout {
  id: string; customerId: string; customerName: string; amount: number; method: string;
  status: string; items: number; employeeName: string; notes: string; createdAt: string; updatedAt: string;
}

interface PayoutSummary {
  totalPayouts: number; todayPayouts: number; weekPayouts: number; monthPayouts: number;
  averagePayout: number; payoutChange: number;
}

interface Store { id: string; name: string; }
interface PayoutsModuleProps { currentStore: Store | null; }

export function PayoutsModule({ currentStore }: PayoutsModuleProps) {
  const [payouts, setPayouts]                 = useState<Payout[]>([]);
  const [filteredPayouts, setFilteredPayouts] = useState<Payout[]>([]);
  const [summary, setSummary]                 = useState<PayoutSummary | null>(null);
  const [loading, setLoading]                 = useState(false);
  const [searchTerm, setSearchTerm]           = useState('');
  const [statusFilter, setStatusFilter]       = useState('all');
  const [methodFilter, setMethodFilter]       = useState('all');
  const [dateRange, setDateRange]             = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [selectedPayout, setSelectedPayout]   = useState<Payout | null>(null);
  const [showDetails, setShowDetails]         = useState(false);

  useEffect(() => { if (currentStore) loadPayouts(); }, [currentStore]);
  useEffect(() => { filterPayouts(); calculateSummary(); }, [payouts, searchTerm, statusFilter, methodFilter, dateRange]);

  const loadPayouts = async () => {
    if (!currentStore) return;
    setLoading(true);
    try {
      const { payouts: storePayouts } = await apiCall(`/stores/${currentStore.id}/payouts`);
      const mockPayouts: Payout[] = [
        { id: '1', customerId: 'cust1', customerName: 'John Smith',   amount: 450.00,  method: 'Cash',  status: 'Completed', items: 3, employeeName: 'Store Owner', notes: 'Gold jewelry (earl)...', createdAt: new Date().toISOString(),                          updatedAt: new Date().toISOString() },
        { id: '2', customerId: 'cust2', customerName: 'Mary Johnson', amount: 1250.75, method: 'Check', status: 'Completed', items: 5, employeeName: 'Store Owner', notes: 'Watch and two col...',    createdAt: new Date(Date.now() - 86400000).toISOString(),  updatedAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', customerId: 'cust3', customerName: 'Robert Brown', amount: 325.50,  method: 'Cash',  status: 'Pending',   items: 2, employeeName: 'Store Owner', notes: 'Silver items',           createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString() },
      ];
      setPayouts([...mockPayouts, ...(storePayouts || [])]);
    } catch (error) { console.error('Error loading payouts:', error); }
    finally { setLoading(false); }
  };

  const filterPayouts = () => {
    let filtered = payouts;
    if (searchTerm)              filtered = filtered.filter(p => p.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) || p.notes?.toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter !== 'all')  filtered = filtered.filter(p => p.status === statusFilter);
    if (methodFilter !== 'all')  filtered = filtered.filter(p => p.method === methodFilter);
    if (dateRange.from)          filtered = filtered.filter(p => new Date(p.createdAt) >= dateRange.from!);
    if (dateRange.to)            filtered = filtered.filter(p => new Date(p.createdAt) <= dateRange.to!);
    setFilteredPayouts(filtered);
  };

  const calculateSummary = () => {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const completed = payouts.filter(p => p.status === 'Completed');
    const total     = completed.reduce((s, p) => s + p.amount, 0);
    const todayTotal = completed.filter(p => new Date(p.createdAt) >= today).reduce((s, p) => s + p.amount, 0);
    const weekTotal  = completed.filter(p => new Date(p.createdAt) >= weekAgo).reduce((s, p) => s + p.amount, 0);
    const avg = completed.length > 0 ? total / completed.length : 0;
    setSummary({ totalPayouts: total, todayPayouts: todayTotal, weekPayouts: weekTotal, monthPayouts: total, averagePayout: avg, payoutChange: 12.3 });
  };

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const getMethodIcon = (m: string) => m === 'Cash' ? '💵' : m === 'Check' ? '📝' : '💰';

  // Avatar initials
  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (!currentStore) {
    return <div className="glass-card p-6"><p className="text-[#76707F] text-[14px]">Select a store to view payouts.</p></div>;
  }

  // ── Status filter cycle: all → Completed → Pending → all ──
  const cycleStatus = () => setStatusFilter(s => s === 'all' ? 'Completed' : s === 'Completed' ? 'Pending' : 'all');
  const statusLabel = statusFilter === 'all' ? 'All Status' : statusFilter;

  // ── Method filter cycle ──
  const cycleMethod = () => setMethodFilter(m => m === 'all' ? 'Cash' : m === 'Cash' ? 'Check' : 'all');
  const methodLabel = methodFilter === 'all' ? 'All Methods' : methodFilter;

  // ── Date range label ──
  const dateLabel = dateRange.from
    ? dateRange.to
      ? `${dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${dateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Date Range';

  // ── Summary cards — flat white, no icons, matching approved ──
  const summaryCards = [
    { label: 'Total Payouts',   value: fmtCurrency(summary?.totalPayouts || 0),  badge: `+${summary?.payoutChange || 0}%` },
    { label: "Today's Payouts", value: fmtCurrency(summary?.todayPayouts || 0),  badge: null },
    { label: 'This Week',       value: fmtCurrency(summary?.weekPayouts || 0),   badge: null },
    { label: 'Average Payout',  value: fmtCurrency(summary?.averagePayout || 0), badge: null },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight title-gradient leading-tight">
            Payouts Ledger
          </h1>
          <p className="text-[15px] text-[#76707F] mt-0.5">{currentStore.name}</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {/* Export — secondary button with download icon */}
          <button className="btn-secondary-light flex items-center gap-2 text-[13px]">
            <Download className="w-4 h-4" />
            Export
          </button>
          {/* Record Payout — primary dark, no icon (matches screenshot) */}
          <button className="btn-primary-dark">
            Record Payout
          </button>
        </div>
      </div>

      {/* ── KPI cards — flat white, label + optional badge, large value ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card, i) => (
          <div
            key={i}
            className="bg-white/85 backdrop-blur-sm rounded-[16px] p-5 ring-1 ring-white/60"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            {/* Label row — label left, green badge right */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] text-[#76707F] font-medium">{card.label}</div>
              {card.badge && (
                <span className="text-[12px] font-semibold text-[#4ADB8A]">{card.badge}</span>
              )}
            </div>
            {/* Large value */}
            <div className="text-[28px] font-semibold text-[#2B2833] tracking-tight">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + filter chips — standalone, no glass-card wrapper ── */}
      <div className="flex items-center gap-3">
        {/* Search — full-width standalone input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A3AE] pointer-events-none" />
          <input
            placeholder="Search customers, notes, or payment methods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-glass pl-11 w-full"
          />
        </div>

        {/* Filter pill buttons — match approved screenshot exactly */}
        {/* All Status — funnel icon */}
        <button
          onClick={cycleStatus}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-medium border transition-all flex-shrink-0 ${
            statusFilter !== 'all'
              ? 'bg-[#2B2833] text-white border-transparent shadow-sm'
              : 'bg-white/85 border-black/[0.06] text-[#2B2833] hover:bg-white shadow-sm'
          }`}
          style={{ boxShadow: statusFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : undefined }}
        >
          <Filter className="w-3.5 h-3.5" />
          {statusLabel}
        </button>

        {/* All Methods — no icon */}
        <button
          onClick={cycleMethod}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-medium border transition-all flex-shrink-0 ${
            methodFilter !== 'all'
              ? 'bg-[#2B2833] text-white border-transparent shadow-sm'
              : 'bg-white/85 border-black/[0.06] text-[#2B2833] hover:bg-white shadow-sm'
          }`}
          style={{ boxShadow: methodFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.06)' : undefined }}
        >
          {methodLabel}
        </button>

        {/* Date Range — calendar icon, popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-medium border transition-all flex-shrink-0 ${
                dateRange.from
                  ? 'bg-[#2B2833] text-white border-transparent shadow-sm'
                  : 'bg-white/85 border-black/[0.06] text-[#2B2833] hover:bg-white shadow-sm'
              }`}
              style={{ boxShadow: !dateRange.from ? '0 1px 3px rgba(0,0,0,0.06)' : undefined }}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              {dateLabel}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-white/95 backdrop-blur-xl rounded-[14px] border border-white/60 shadow-2xl"
            align="end"
          >
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => {
                if (range) setDateRange({ from: range.from, to: range.to });
                else setDateRange({ from: undefined, to: undefined });
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* ── Payout table — glass-card with internal title ── */}
      <div className="glass-card overflow-hidden">
        {/* Table header */}
        <div className="px-6 py-4 border-b border-black/[0.04]">
          <h3 className="text-[18px] font-semibold text-[#2B2833] tracking-tight">
            Payout History ({filteredPayouts.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="h-6 w-6 rounded-full border-2 border-[#6B5EF9] border-t-transparent animate-spin" />
            <p className="text-[14px] text-[#76707F]">Loading payouts...</p>
          </div>
        ) : filteredPayouts.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-14 h-14 rounded-[14px] icon-container flex items-center justify-center">
              <Receipt className="w-7 h-7 text-[#6B5EF9]" strokeWidth={2} />
            </div>
            <p className="text-[14px] text-[#A8A3AE]">No payouts found.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="table-header-gradient border-b border-black/[0.04]">
              <tr>
                {['CUSTOMER', 'AMOUNT', 'METHOD', 'ITEMS', 'STATUS', 'DATE', 'EMPLOYEE', 'ACTIONS'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-semibold text-[#76707F] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04]">
              {filteredPayouts.map((payout) => (
                <tr
                  key={payout.id}
                  className="hover:bg-[#FAFAF9] transition-colors cursor-pointer"
                  onClick={() => { setSelectedPayout(payout); setShowDetails(true); }}
                >
                  {/* CUSTOMER — avatar tile + name + notes */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar: icon-container gradient, initials in purple */}
                      <div className="w-9 h-9 rounded-full icon-container flex-shrink-0 text-[12px] font-semibold text-[#6B5EF9]">
                        {getInitials(payout.customerName)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[14px] font-medium text-[#2B2833]">
                          {payout.customerName}
                        </div>
                        {payout.notes && (
                          <div className="text-[12px] text-[#A8A3AE] truncate max-w-[140px]">
                            {payout.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* AMOUNT */}
                  <td className="px-6 py-4 text-[14px] font-semibold text-[#2B2833] tabular-nums whitespace-nowrap">
                    {fmtCurrency(payout.amount)}
                  </td>

                  {/* METHOD — emoji + text */}
                  <td className="px-6 py-4">
                    <span className="text-[14px] text-[#2B2833]">
                      {getMethodIcon(payout.method)} {payout.method}
                    </span>
                  </td>

                  {/* ITEMS */}
                  <td className="px-6 py-4 text-[14px] text-[#76707F] whitespace-nowrap">
                    {payout.items} items
                  </td>

                  {/* STATUS — pill badge */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap ${
                      payout.status === 'Completed'
                        ? 'bg-[#E8F5E9] text-[#2E7D32]'
                        : payout.status === 'Pending'
                        ? 'bg-[#FFF9E6] text-[#E65100]'
                        : 'bg-[#F5F5F5] text-[#76707F]'
                    }`}>
                      {payout.status}
                    </span>
                  </td>

                  {/* DATE — calendar icon + formatted date */}
                  <td className="px-6 py-4 text-[13px] text-[#76707F] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#A8A3AE] flex-shrink-0" />
                      {fmtDate(payout.createdAt)}
                    </div>
                  </td>

                  {/* EMPLOYEE */}
                  <td className="px-6 py-4 text-[13px] text-[#76707F]">
                    {payout.employeeName}
                  </td>

                  {/* ACTIONS — empty, row click opens drawer */}
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()} />
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Payout detail drawer — uses Sheet (already styled in sheet.tsx) ── */}
      <Sheet open={showDetails} onOpenChange={setShowDetails}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Payout Details</SheetTitle>
          </SheetHeader>
          {selectedPayout && (
            <div className="mt-6 space-y-5 px-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Customer', value: selectedPayout.customerName },
                  { label: 'Amount',   value: fmtCurrency(selectedPayout.amount) },
                  { label: 'Method',   value: selectedPayout.method },
                  { label: 'Status',   value: selectedPayout.status },
                  { label: 'Items',    value: `${selectedPayout.items} items` },
                  { label: 'Employee', value: selectedPayout.employeeName },
                  { label: 'Date',     value: fmtDate(selectedPayout.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-1">{label}</div>
                    <div className="text-[15px] font-medium text-[#2B2833]">{value}</div>
                  </div>
                ))}
              </div>
              {selectedPayout.notes && (
                <div>
                  <div className="text-[11px] font-semibold text-[#76707F] uppercase tracking-wider mb-1">Notes</div>
                  <p className="text-[14px] text-[#76707F] leading-relaxed">{selectedPayout.notes}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
