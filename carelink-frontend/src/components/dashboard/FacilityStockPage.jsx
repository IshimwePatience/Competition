import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { COMMON_MEDICINES } from '../../constants/health';
import NotificationBell from '../NotificationBell';
import EmptyState from '../ui/EmptyState';

const statusFromQty = (qty) => {
  if (qty <= 0) return 'out_of_stock';
  if (qty <= 10) return 'low_stock';
  return 'in_stock';
};

const STATUS_LABELS = {
  in_stock: 'In Stock',
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
};

function MedicineAvatar({ name }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[12px] font-semibold text-gray-500">
      {initials || 'Rx'}
    </div>
  );
}

function StockStatusBadge({ status }) {
  if (status === 'in_stock') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-emerald-700">
        {STATUS_LABELS[status]}
      </span>
    );
  }
  if (status === 'low_stock') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-orange-600">
        {STATUS_LABELS[status]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gray-500">
      {STATUS_LABELS[status]}
    </span>
  );
}

export default function FacilityStockPage({ onCountChange }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState({ name: '', category: '', quantity: 1 });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.myFacilityStock();
      const items = res.data || [];
      setStock(items);
      onCountChange?.(items.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const suggestions = useMemo(() => COMMON_MEDICINES, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stock;
    return stock.filter((item) =>
      item.name?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q)
    );
  }, [stock, search]);

  const saveStock = async (nextStock) => {
    setBusy(true);
    try {
      const res = await api.updateMyFacilityStock(nextStock);
      setStock(res.data);
      onCountChange?.(res.data.length);
      setMsg('Medicine stock updated');
    } catch (err) {
      setMsg(err.message || 'Failed to update stock');
    } finally {
      setBusy(false);
    }
  };

  const addMedicine = () => {
    if (!draft.name.trim()) return;
    const known = suggestions.find((m) => m.name.toLowerCase() === draft.name.trim().toLowerCase());
    const quantity = Math.max(0, Number(draft.quantity) || 0);
    const item = {
      name: draft.name.trim(),
      category: known?.category || draft.category || 'general',
      quantity,
      status: statusFromQty(quantity),
    };
    const next = [...stock.filter((s) => s.name.toLowerCase() !== item.name.toLowerCase()), item];
    saveStock(next);
    setDraft({ name: '', category: '', quantity: 1 });
  };

  const updateQuantity = (name, quantity) => {
    const qty = Math.max(0, Number(quantity) || 0);
    saveStock(stock.map((s) =>
      s.name === name ? { ...s, quantity: qty, status: statusFromQty(qty) } : s
    ));
  };

  const removeMedicine = (name) => {
    saveStock(stock.filter((s) => s.name !== name));
  };

  const fieldClass =
    'h-10 rounded-lg border border-gray-200 px-4 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300';

  return (
    <div className="flex min-h-full flex-col bg-white">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Dashboard / Stock</p>
            <h1 className="text-xl font-bold text-gray-900">Medicine Stock</h1>
            <p className="mt-1 text-sm text-gray-500">
              List all medicines you carry — patients rely on this data
            </p>
          </div>
          <NotificationBell />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 px-8 py-5">
        <input
          list="medicine-suggestions"
          className={`min-w-[200px] flex-1 max-w-md ${fieldClass}`}
          placeholder="Medicine name"
          value={draft.name}
          onChange={(e) => {
            const known = suggestions.find((m) => m.name.toLowerCase() === e.target.value.toLowerCase());
            setDraft({ ...draft, name: e.target.value, category: known?.category || draft.category });
          }}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMedicine())}
        />
        <datalist id="medicine-suggestions">
          {suggestions.map((m) => <option key={m.name} value={m.name} />)}
        </datalist>
        <input
          type="number"
          min="0"
          className={`w-24 ${fieldClass}`}
          placeholder="Qty"
          value={draft.quantity}
          onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
        />
        <button
          type="button"
          onClick={addMedicine}
          disabled={busy}
          className="inline-flex h-10 items-center rounded-lg border border-gray-200 px-4 text-[14px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 px-8 pb-5">
        <div className="flex min-w-[280px] flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Search medicines"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 flex-1 rounded-l-lg border border-r-0 border-gray-200 px-4 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-gray-200 bg-white text-gray-400 hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        <span className="text-[14px] text-gray-400">{filtered.length} items total</span>
      </div>

      {msg && <p className="px-8 text-[12px] text-gray-500">{msg}</p>}

      <div className="flex-1 px-8">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message={stock.length === 0 ? 'No medicines listed yet — add your full stock list' : 'No medicines found'} />
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-2 pr-4 text-[13px] font-semibold text-gray-600">
                  <span className="inline-flex items-center gap-1">
                    Medicine
                    <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </th>
                <th className="pb-2 pr-4 text-[13px] font-semibold text-gray-600">Category</th>
                <th className="pb-2 pr-4 text-[13px] font-semibold text-gray-600">Quantity</th>
                <th className="pb-2 pr-4 text-[13px] font-semibold text-gray-600">Status</th>
                <th className="pb-2 text-[13px] font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.name} className="border-b border-gray-100 hover:bg-gray-50/40">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <MedicineAvatar name={item.name} />
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-gray-900">{item.name}</p>
                        <p className="truncate text-[12px] capitalize text-gray-400">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-[14px] capitalize text-gray-600">{item.category}</td>
                  <td className="py-2 pr-4">
                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.name, e.target.value)}
                      disabled={busy}
                      className="h-8 w-20 rounded-lg border border-gray-200 px-2 text-[14px] text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-50"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <StockStatusBadge status={item.status} />
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeMedicine(item.name)}
                      disabled={busy}
                      className="text-[12px] font-medium text-gray-500 underline hover:text-gray-800 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-gray-100 px-8 py-4">
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-brand-orange"
            style={{ width: `${Math.min(100, (filtered.length / Math.max(stock.length, 1)) * 100)}%` }}
          />
        </div>
        <span className="text-[12px] text-gray-400">
          Medicine stock: {filtered.length} shown · {stock.length} total
        </span>
      </div>
    </div>
  );
}
