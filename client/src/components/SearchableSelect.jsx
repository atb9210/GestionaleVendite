// SearchableSelect — dropdown searchable con recent in alto
import { useState, useRef, useEffect } from 'react';

export default function SearchableSelect({ options, value, onChange, placeholder = 'Seleziona…', error, disabled }) {
  // options: [{ value, label, recent? }]
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus input on open
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const selected = options.find(o => o.value === value);

  // Sort: recent first, then filter by query
  const sorted = [...options].sort((a, b) => {
    if (a.recent && !b.recent) return -1;
    if (!a.recent && b.recent) return 1;
    return 0;
  });

  const filtered = sorted.filter(o => {
    if (!query) return true;
    return o.label.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className={`ss-wrapper ${error ? 'ss-error' : ''}`} ref={ref}>
      <button
        type="button"
        className={`ss-trigger ${open ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => { if (!disabled) { setOpen(!open); setQuery(''); } }}
      >
        <span className={`ss-value ${!selected ? 'placeholder' : ''}`}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="ss-chevron">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="ss-dropdown">
          <input
            ref={inputRef}
            className="ss-search"
            type="text"
            placeholder="Cerca…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
          <div className="ss-options">
            {filtered.length === 0 && <div className="ss-empty">Nessun risultato</div>}
            {filtered.map(o => (
              <div
                key={o.value}
                className={`ss-option ${o.value === value ? 'selected' : ''}`}
                onClick={() => { onChange(o.value); setOpen(false); }}
              >
                {o.icon && <span className="ss-option-icon">{o.icon}</span>}
                <span>{o.label}</span>
                {o.recent && <span className="ss-recent-badge">recente</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
