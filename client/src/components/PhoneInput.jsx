// PhoneInput — input telefono con flag dropdown (default Italia)
import { useState, useRef, useEffect } from 'react';

const COUNTRIES = [
  { code:'IT', prefix:'+39', flag:'🇮🇹', name:'Italia' },
  { code:'DE', prefix:'+49', flag:'🇩🇪', name:'Germania' },
  { code:'FR', prefix:'+33', flag:'🇫🇷', name:'Francia' },
  { code:'ES', prefix:'+34', flag:'🇪🇸', name:'Spagna' },
  { code:'GB', prefix:'+44', flag:'🇬🇧', name:'Regno Unito' },
  { code:'US', prefix:'+1',  flag:'🇺🇸', name:'Stati Uniti' },
  { code:'CH', prefix:'+41', flag:'🇨🇭', name:'Svizzera' },
  { code:'AT', prefix:'+43', flag:'🇦🇹', name:'Austria' },
  { code:'BE', prefix:'+32', flag:'🇧🇪', name:'Belgio' },
  { code:'NL', prefix:'+31', flag:'🇳🇱', name:'Paesi Bassi' },
  { code:'PT', prefix:'+351',flag:'🇵🇹', name:'Portogallo' },
  { code:'RO', prefix:'+40', flag:'🇷🇴', name:'Romania' },
  { code:'AL', prefix:'+355',flag:'🇦🇱', name:'Albania' },
];

export default function PhoneInput({ value, onChange, error }) {
  // value = { countryCode:'IT', number:'333 1234567' }
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const country = COUNTRIES.find(c => c.code === (value?.countryCode || 'IT')) || COUNTRIES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = COUNTRIES.filter(c => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) || c.prefix.includes(search) || c.code.toLowerCase().includes(search.toLowerCase());
  });

  const selectCountry = (c) => {
    onChange({ ...value, countryCode: c.code });
    setOpen(false);
    setSearch('');
  };

  const handleNumberChange = (e) => {
    onChange({ ...value, number: e.target.value });
  };

  return (
    <div className={`phone-wrapper ${error ? 'phone-error' : ''}`} ref={ref}>
      <div className="phone-input-row">
        <button type="button" className="phone-country-btn" onClick={() => setOpen(!open)}>
          <span className="phone-flag">{country.flag}</span>
          <span className="phone-prefix">{country.prefix}</span>
          <span className="phone-chevron">▾</span>
        </button>
        <input
          type="tel"
          className="phone-number-input"
          value={value?.number || ''}
          onChange={handleNumberChange}
          placeholder="333 1234567"
        />
      </div>
      {open && (
        <div className="phone-dropdown">
          <input
            className="phone-search"
            type="text"
            placeholder="Cerca paese…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
          <div className="phone-options">
            {filtered.map(c => (
              <div
                key={c.code}
                className={`phone-option ${c.code === country.code ? 'selected' : ''}`}
                onClick={() => selectCountry(c)}
              >
                <span className="phone-option-flag">{c.flag}</span>
                <span className="phone-option-name">{c.name}</span>
                <span className="phone-option-prefix">{c.prefix}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
