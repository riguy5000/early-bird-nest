import { useInventoryData } from './inventory/useInventoryData';
import { SendOutScrapView } from './inventory/scrap/SendOutScrapView';

interface Store { id: string; name: string; }

interface ScrapModuleProps {
  currentStore: Store | null;
  employeeId?: string;
}

export function ScrapModule({ currentStore, employeeId = '' }: ScrapModuleProps) {
  const storeId = currentStore?.id || '';
  const { items, loading } = useInventoryData(storeId);

  if (!storeId) {
    return <div className="glass-card p-6"><p className="text-[#76707F] text-[14px]">Select a store to view scrap.</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[36px] font-semibold tracking-tight title-gradient leading-tight">Send Out Scrap</h1>
          <p className="text-[15px] text-[#76707F] mt-0.5">{currentStore?.name}</p>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-6 text-[14px] text-[#76707F]">Loading…</div>
        ) : (
          <SendOutScrapView storeId={storeId} employeeId={employeeId} allItems={items} />
        )}
      </div>
    </div>
  );
}
