export function TablePanel({ title, subtitle, count, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-gray-100 bg-white shadow-sm ${className}`}>
      {(title || subtitle || count != null) && (
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            {title && <h2 className="text-[18px] font-bold text-gray-900">{title}</h2>}
            {subtitle && <p className="mt-1 text-[13px] text-gray-500">{subtitle}</p>}
          </div>
          {count != null && (
            <span className="text-[14px] text-gray-400">{count} items total</span>
          )}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}

export function TableToolbar({ search, onSearchChange, count, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-4">
      {onSearchChange != null && (
        <div className="flex min-w-[240px] flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 flex-1 rounded-l-lg border border-r-0 border-gray-200 px-4 text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
          />
          <span className="flex h-10 w-10 items-center justify-center rounded-r-lg border border-gray-200 bg-white text-gray-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
        </div>
      )}
      {count != null && <span className="text-[14px] text-gray-400">{count} items total</span>}
      {children && <div className="ml-auto flex items-center gap-2">{children}</div>}
    </div>
  );
}

export function TableLoading() {
  return (
    <div className="flex h-48 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>
  );
}

export function TableEmpty({ message = 'No items found' }) {
  return (
    <div className="py-16 text-center text-[14px] text-gray-400">{message}</div>
  );
}

export function DataTable({ columns, children }) {
  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-gray-200">
          {columns.map((col) => (
            <th
              key={col.key}
              className={`pb-2 pr-4 text-[13px] font-semibold text-gray-600 ${col.className || ''}`}
            >
              {col.sortable ? (
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              ) : (
                col.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export function TableRow({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-gray-100 hover:bg-gray-50/40 ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`py-2 pr-4 text-[14px] text-gray-600 ${className}`}>
      {children}
    </td>
  );
}

export function TablePrimaryCell({ title, subtitle, avatar }) {
  return (
    <TableCell>
      <div className="flex items-center gap-2">
        {avatar}
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-gray-900">{title}</p>
          {subtitle && <p className="truncate text-[12px] text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </TableCell>
  );
}

export function TableAvatar({ children }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[12px] font-semibold text-gray-500">
      {children}
    </div>
  );
}

export function StatusBadge({ status, label }) {
  const styles = {
    verified: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-500 border-red-100',
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    open: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    closed: 'bg-gray-50 text-gray-500 border-gray-100',
  };
  const text = label || status;
  return (
    <span className={`inline-flex rounded-md border px-2.5 py-1 text-[11px] font-semibold capitalize ${styles[status] || styles.pending}`}>
      {text}
    </span>
  );
}

export function StatusCheck() {
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

export function TableActionButton({ children, onClick, disabled, variant = 'default' }) {
  const cls = variant === 'danger'
    ? 'border border-red-200 text-red-600 hover:bg-red-50'
    : variant === 'primary'
      ? 'bg-gray-800 text-white hover:bg-gray-900'
      : 'border border-gray-200 text-gray-700 hover:bg-gray-50';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-[12px] font-medium disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}
