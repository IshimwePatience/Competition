import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        setResults(res.data);
        setOpen(true);
      } catch {
        setResults({ facilities: [], reports: [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder="Search facilities, services..."
          className="ml-2 w-full border-0 bg-transparent text-sm focus:ring-0"
        />
        {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-orange border-t-transparent" />}
      </div>

      {open && results && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl">
          {results.facilities?.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase text-gray-400">Facilities</p>
              {results.facilities.map((f) => (
                <div key={f.id} className="rounded-lg px-3 py-2 hover:bg-gray-50">
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-gray-500">{f.type} · {f.address}</p>
                </div>
              ))}
            </div>
          )}
          {results.reports?.length > 0 && (
            <div className="border-t border-gray-100 p-2">
              <p className="px-2 py-1 text-xs font-semibold uppercase text-gray-400">Reports</p>
              {results.reports.map((r) => (
                <div key={r.id} className="rounded-lg px-3 py-2 hover:bg-gray-50">
                  <p className="text-sm font-medium">{r.facilityName}</p>
                  <p className="text-xs text-gray-500">{r.status} · {r.notes?.slice(0, 60)}</p>
                </div>
              ))}
            </div>
          )}
          {!results.facilities?.length && !results.reports?.length && (
            <p className="p-4 text-center text-sm text-gray-400">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}
