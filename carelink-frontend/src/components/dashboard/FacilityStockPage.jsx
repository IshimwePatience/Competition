import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { COMMON_MEDICINES } from '../../constants/health';
import {
  DataTable,
  TableActionButton,
  TableCell,
  TableEmpty,
  TablePanel,
  TablePrimaryCell,
  TableRow,
  StatusBadge,
} from '../ui/DataTable';

const statusFromQty = (qty) => {
  if (qty <= 0) return 'out_of_stock';
  if (qty <= 10) return 'low_stock';
  return 'in_stock';
};

export default function FacilityStockPage({ onCountChange }) {
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
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

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>
    );
  }

  return (
    <div>
      {msg && <p className="mb-4 text-[12px] text-gray-500">{msg}</p>}
      <TablePanel title="Medicine Stock" subtitle="List all medicines you carry — patients rely on this data" count={stock.length}>
        <div className="mb-4 grid gap-3 sm:grid-cols-4">
          <input
            list="medicine-suggestions"
            className="sm:col-span-2 rounded-xl border border-gray-200 px-4 py-3 text-sm"
            placeholder="Medicine name"
            value={draft.name}
            onChange={(e) => {
              const known = suggestions.find((m) => m.name.toLowerCase() === e.target.value.toLowerCase());
              setDraft({ ...draft, name: e.target.value, category: known?.category || draft.category });
            }}
          />
          <datalist id="medicine-suggestions">
            {suggestions.map((m) => <option key={m.name} value={m.name} />)}
          </datalist>
          <input type="number" min="0" className="rounded-xl border border-gray-200 px-4 py-3 text-sm" placeholder="Qty" value={draft.quantity} onChange={(e) => setDraft({ ...draft, quantity: e.target.value })} />
          <button type="button" onClick={addMedicine} disabled={busy} className="rounded-xl bg-brand-peach px-4 py-3 text-sm font-semibold text-white hover:bg-brand-peachHover disabled:opacity-60">
            Add
          </button>
        </div>

        {stock.length === 0 ? (
          <TableEmpty message="No medicines listed yet — add your full stock list" />
        ) : (
          <DataTable
            columns={[
              { key: 'name', label: 'Medicine', sortable: true },
              { key: 'category', label: 'Category' },
              { key: 'quantity', label: 'Quantity' },
              { key: 'status', label: 'Status' },
              { key: 'action', label: 'Action' },
            ]}
          >
            {stock.map((item) => (
              <TableRow key={item.name}>
                <TablePrimaryCell title={item.name} subtitle={item.category} />
                <TableCell className="capitalize">{item.category}</TableCell>
                <TableCell>
                  <input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.name, e.target.value)}
                    disabled={busy}
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                  />
                </TableCell>
                <TableCell>
                  <StatusBadge
                    status={item.status === 'in_stock' ? 'open' : item.status === 'low_stock' ? 'pending' : 'closed'}
                    label={item.status?.replace('_', ' ')}
                  />
                </TableCell>
                <TableCell>
                  <TableActionButton variant="danger" onClick={() => removeMedicine(item.name)} disabled={busy}>
                    Remove
                  </TableActionButton>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </TablePanel>
    </div>
  );
}
