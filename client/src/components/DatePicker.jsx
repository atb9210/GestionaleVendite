// DatePicker — componente data con calendario popup
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const DAYS = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];

// Parsa "YYYY-MM-DD" come data locale evitando lo shift UTC
function parseLocalDate(iso) {
  if (!iso) return null;
  const parts = String(iso).split('T')[0].split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

// Serializza in "YYYY-MM-DD" usando parti locali (mai toISOString che applica UTC)
function toISODate(d) {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso) {
  if (!iso) return '';
  const d = parseLocalDate(iso);
  if (!d) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(2);
  return `${dd}/${mm}/${yy}`;
}

export default function DatePicker({ value, onChange, placeholder = 'Seleziona data', error }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const triggerRef = useRef(null);

  const parsedDate = parseLocalDate(value);
  const today = new Date();
  const [viewMonth, setViewMonth] = useState((parsedDate || today).getMonth());
  const [viewYear, setViewYear] = useState((parsedDate || today).getFullYear());

  // Chiudi su click fuori
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target) &&
          !e.target.closest('.dp-dropdown')) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    if (open) { setOpen(false); return; }
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownH = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= dropdownH
      ? rect.bottom + 4
      : rect.top - dropdownH - 4;
    setDropdownStyle({ top, left: rect.left, width: Math.max(rect.width, 280) });
    setOpen(true);
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day) => {
    onChange(toISODate(new Date(viewYear, viewMonth, day)));
    setOpen(false);
  };

  const isSelected = (day) => {
    if (!parsedDate) return false;
    return parsedDate.getDate() === day && parsedDate.getMonth() === viewMonth && parsedDate.getFullYear() === viewYear;
  };

  const isToday = (day) => {
    return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
  };

  const setTodayDate = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
    onChange(toISODate(today));
    setOpen(false);
  };

  const dropdown = (
    <div className="dp-dropdown" style={{ position: 'fixed', zIndex: 9999, ...dropdownStyle }}>
      <div className="dp-header">
        <button type="button" className="dp-nav-btn" onClick={prevMonth}>‹</button>
        <span className="dp-month-label">{MONTHS[viewMonth]} {viewYear}</span>
        <button type="button" className="dp-nav-btn" onClick={nextMonth}>›</button>
      </div>
      <div className="dp-days-header">
        {DAYS.map(d => <span key={d} className="dp-day-label">{d}</span>)}
      </div>
      <div className="dp-grid">
        {Array(firstDay).fill(null).map((_, i) => <span key={`e${i}`} className="dp-cell empty" />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
          <button
            key={day}
            type="button"
            className={`dp-cell ${isSelected(day) ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
            onClick={() => selectDay(day)}
          >
            {day}
          </button>
        ))}
      </div>
      <div className="dp-footer">
        <button type="button" className="dp-today-btn" onClick={setTodayDate}>Oggi</button>
      </div>
    </div>
  );

  return (
    <div className={`dp-wrapper ${error ? 'dp-error' : ''}`} ref={triggerRef}>
      <button type="button" className={`dp-trigger ${open ? 'active' : ''}`} onClick={handleOpen}>
        <span className={`dp-value ${!value ? 'placeholder' : ''}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <span className="dp-icon">📅</span>
      </button>
      {open && createPortal(dropdown, document.body)}
    </div>
  );
}
