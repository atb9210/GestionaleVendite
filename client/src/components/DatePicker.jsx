// DatePicker — componente data con calendario popup
import { useState, useRef, useEffect } from 'react';

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
const DAYS = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];

function formatDisplay(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return date;
  return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
}

function toISODate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return date;
  return d.toISOString().split('T')[0];
}

export default function DatePicker({ value, onChange, placeholder = 'Seleziona data', error }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Parse value to Date or use today
  const parsedDate = value ? new Date(value) : null;
  const [viewMonth, setViewMonth] = useState((parsedDate || new Date()).getMonth());
  const [viewYear, setViewYear] = useState((parsedDate || new Date()).getFullYear());

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday=0

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    onChange(toISODate(d));
    setOpen(false);
  };

  const isSelected = (day) => {
    if (!parsedDate) return false;
    return parsedDate.getDate() === day && parsedDate.getMonth() === viewMonth && parsedDate.getFullYear() === viewYear;
  };

  const isToday = (day) => {
    const t = new Date();
    return t.getDate() === day && t.getMonth() === viewMonth && t.getFullYear() === viewYear;
  };

  const setToday = () => {
    const t = new Date();
    setViewMonth(t.getMonth());
    setViewYear(t.getFullYear());
    onChange(toISODate(t));
    setOpen(false);
  };

  return (
    <div className={`dp-wrapper ${error ? 'dp-error' : ''}`} ref={ref}>
      <button type="button" className={`dp-trigger ${open ? 'active' : ''}`} onClick={() => setOpen(!open)}>
        <span className={`dp-value ${!value ? 'placeholder' : ''}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <span className="dp-icon">📅</span>
      </button>
      {open && (
        <div className="dp-dropdown">
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
            <button type="button" className="dp-today-btn" onClick={setToday}>Oggi</button>
          </div>
        </div>
      )}
    </div>
  );
}
