// Pagina Spese — CRUD completo con filtri e ricerca
import { useState } from 'react';
import { useData, fmt, genId } from '../context/DataContext';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import DatePicker from '../components/DatePicker';

const emptyForm = { cat:'', desc:'', amount:'', channel:'', date:'' };

export default function Expenses() {
  const { expenses, setExpenses, expenseCategories, channels, getChannel, getExpenseCat, showToast } = useData();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const totalMonth = expenses.reduce((a, e) => a + e.amount, 0);
  const mktTotal = expenses.filter(e => e.cat === 'marketing').reduce((a, e) => a + e.amount, 0);

  const filtered = expenses.filter(e => {
    if (filter !== 'all' && e.cat !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.desc.toLowerCase().includes(q);
    }
    return true;
  });

  const catCounts = {};
  expenseCategories.forEach(c => { catCounts[c.key] = expenses.filter(e => e.cat === c.key).length; });

  const validate = () => {
    const e = {};
    if (!form.cat) e.cat = 'Seleziona categoria';
    if (!form.desc.trim()) e.desc = 'Descrizione obbligatoria';
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Importo non valido';
    if (!form.date.trim()) e.date = 'Data obbligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm({...emptyForm, date: new Date().toISOString().split('T')[0]}); setEditingId(null); setErrors({}); setModalOpen(true); };
  const openEdit = (exp) => { setForm({ cat: exp.cat, desc: exp.desc, amount: String(exp.amount), channel: exp.channel || '', date: exp.date }); setEditingId(exp.id); setErrors({}); setModalOpen(true); };

  const handleSave = () => {
    if (!validate()) return;
    const data = { cat: form.cat, desc: form.desc.trim(), amount: Number(form.amount), channel: form.channel || null, date: form.date.trim() };
    if (editingId) {
      setExpenses(prev => prev.map(e => e.id === editingId ? { ...e, ...data } : e));
      showToast('Spesa aggiornata');
    } else {
      setExpenses(prev => [{ id: genId('e'), ...data }, ...prev]);
      showToast('Spesa registrata');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    setExpenses(prev => prev.filter(e => e.id !== deleteModal.id));
    setDeleteModal(null); showToast('Spesa eliminata', 'error');
  };

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-h1">Spese</h1>
          <div className="page-sub">Operative · {fmt(totalMonth)} questo mese</div>
        </div>
        <button className="btn-primary" onClick={openCreate}><span className="plus">+</span> Spesa</button>
      </div>

      <div className="stat-strip">
        <div className="stat-card"><span className="stat-icon">💸</span><div className="stat-val">{fmt(totalMonth)}</div><div className="stat-lbl">Totale (mese)</div></div>
        <div className="stat-card"><span className="stat-icon">📣</span><div className="stat-val">{fmt(mktTotal)}</div><div className="stat-lbl">Marketing</div></div>
        <div className="stat-card"><span className="stat-icon">📊</span><div className="stat-val">{expenses.length}</div><div className="stat-lbl">Transazioni</div></div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'active' : ''}`}>Tutte <span className="chip-count">{expenses.length}</span></button>
          {expenseCategories.map(c => (
            <button key={c.key} onClick={() => setFilter(c.key)} className={`chip ${filter === c.key ? 'active' : ''}`}>
              {c.label} {catCounts[c.key] > 0 && <span className="chip-count">{catCounts[c.key]}</span>}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Cerca spesa…" value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      <div className="table-card">
        {filtered.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--text3)', fontSize:'13px' }}>Nessuna spesa trovata</div>}
        {filtered.map((expense) => {
          const c = getExpenseCat(expense.cat);
          const ch = expense.channel ? getChannel(expense.channel) : null;
          return (
            <div key={expense.id} className="exp-row" style={{ cursor:'pointer' }} onClick={() => openEdit(expense)}>
              <div className="exp-icon" style={{ background: (c?.color || '#a1a1aa') + '22', color: c?.color || '#a1a1aa' }}>{c?.icon || '📄'}</div>
              <div className="exp-info">
                <div className="exp-name">{expense.desc}</div>
                <div className="exp-meta">
                  <span className="badge badge-muted">{c?.label || expense.cat}</span>
                  {ch && <span className="chan-badge" style={{ background:ch.dim, color:ch.color, borderColor:ch.bord }}><span className="chan-dot" style={{ background:ch.color }}></span>{ch.name}</span>}
                  <span style={{ color:'var(--text3)' }}>{expense.date}</span>
                </div>
              </div>
              <div className="exp-amount">−{fmt(expense.amount)}</div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifica spesa' : 'Nuova spesa'}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Categoria</label>
            <SearchableSelect options={expenseCategories.map(c => ({ value:c.key, label:c.label, icon:c.icon }))} value={form.cat} onChange={v => setForm({...form, cat:v})} placeholder="Seleziona categoria…" error={errors.cat} />
            {errors.cat && <div className="form-error">{errors.cat}</div>}
          </div>
          <div className="form-group"><label className="form-label">Canale (opz.)</label>
            <SearchableSelect options={[{ value:'', label:'Nessuno' }, ...channels.map(c => ({ value:c.id, label:c.name }))]} value={form.channel} onChange={v => setForm({...form, channel:v})} placeholder="Nessuno" />
          </div>
        </div>
        <div className="form-group"><label className="form-label">Descrizione</label><input className={`form-input ${errors.desc ? 'error' : ''}`} value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="es. Spend Facebook Ads" />{errors.desc && <div className="form-error">{errors.desc}</div>}</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Importo (€)</label><input className={`form-input ${errors.amount ? 'error' : ''}`} type="number" min="0" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />{errors.amount && <div className="form-error">{errors.amount}</div>}</div>
          <div className="form-group"><label className="form-label">Data</label>
            <DatePicker value={form.date} onChange={v => setForm({...form, date:v})} error={errors.date} />
            {errors.date && <div className="form-error">{errors.date}</div>}
          </div>
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Annulla</button>
          {editingId && <button className="btn-danger" onClick={() => { setModalOpen(false); setDeleteModal(expenses.find(e => e.id === editingId)); }}>Elimina</button>}
          <button className="btn-primary" onClick={handleSave}>{editingId ? 'Salva' : 'Registra spesa'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Elimina spesa">
        <p className="confirm-text">Eliminare spesa <span className="confirm-highlight">{deleteModal?.desc}</span>?</p>
        <div className="form-actions"><button className="btn-secondary" onClick={() => setDeleteModal(null)}>Annulla</button><button className="btn-danger" onClick={handleDelete}>Elimina</button></div>
      </Modal>
    </main>
  );
}
