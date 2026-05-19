// Pagina Acquisti — CRUD completo con filtri e ricerca
import { useState } from 'react';
import { useData, fmt, genId } from '../context/DataContext';
import Modal from '../components/Modal';

const STATUS = {
  intransit: { label:'In transito', cls:'badge-blue'  },
  received:  { label:'Ricevuto',    cls:'badge-green' },
  topay:     { label:'Da pagare',   cls:'badge-amber' },
};

const emptyForm = { poNumber:'', supplier:'', items:'', total:'', status:'intransit', date:'' };

export default function Purchases() {
  const { purchases, setPurchases, showToast } = useData();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const totalSpent = purchases.reduce((a, p) => a + p.total, 0);
  const transitCnt = purchases.filter(p => p.status === 'intransit').length;
  const topayCnt = purchases.filter(p => p.status === 'topay').length;

  const filtered = purchases.filter(p => {
    if (filter === 'intransit' && p.status !== 'intransit') return false;
    if (filter === 'received' && p.status !== 'received') return false;
    if (filter === 'topay' && p.status !== 'topay') return false;
    if (search) {
      const q = search.toLowerCase();
      return p.poNumber.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q) || p.items.toLowerCase().includes(q);
    }
    return true;
  });

  const validate = () => {
    const e = {};
    if (!form.poNumber.trim()) e.poNumber = 'Numero PO obbligatorio';
    if (!form.supplier.trim()) e.supplier = 'Fornitore obbligatorio';
    if (!form.items.trim()) e.items = 'Articoli obbligatori';
    if (!form.total || isNaN(Number(form.total)) || Number(form.total) <= 0) e.total = 'Totale non valido';
    if (!form.date.trim()) e.date = 'Data obbligatoria';
    const dup = purchases.find(p => p.poNumber.toLowerCase() === form.poNumber.trim().toLowerCase() && p.id !== editingId);
    if (dup) e.poNumber = 'PO già esistente';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setErrors({}); setModalOpen(true); };
  const openEdit = (p) => { setForm({ poNumber: p.poNumber, supplier: p.supplier, items: p.items, total: String(p.total), status: p.status, date: p.date }); setEditingId(p.id); setErrors({}); setModalOpen(true); };

  const handleSave = () => {
    if (!validate()) return;
    if (editingId) {
      setPurchases(prev => prev.map(p => p.id === editingId ? { ...p, poNumber: form.poNumber.trim(), supplier: form.supplier.trim(), items: form.items.trim(), total: Number(form.total), status: form.status, date: form.date.trim() } : p));
      showToast('Acquisto aggiornato');
    } else {
      setPurchases(prev => [{ id: genId('pu'), poNumber: form.poNumber.trim(), supplier: form.supplier.trim(), items: form.items.trim(), total: Number(form.total), status: form.status, date: form.date.trim() }, ...prev]);
      showToast('Acquisto creato');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    setPurchases(prev => prev.filter(p => p.id !== deleteModal.id));
    setDeleteModal(null); showToast('Acquisto eliminato', 'error');
  };

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-h1">Acquisti</h1>
          <div className="page-sub">Rifornimenti dal fornitore · {fmt(totalSpent)} questo mese</div>
        </div>
        <button className="btn-primary" onClick={openCreate}><span className="plus">+</span> Acquisto</button>
      </div>

      <div className="stat-strip">
        <div className="stat-card"><span className="stat-icon">🛒</span><div className="stat-val">{purchases.length}</div><div className="stat-lbl">Ordini fornitore</div></div>
        <div className="stat-card"><span className="stat-icon">📥</span><div className="stat-val">{transitCnt}</div><div className="stat-lbl">In transito</div></div>
        <div className="stat-card"><span className="stat-icon">💼</span><div className="stat-val">{fmt(totalSpent)}</div><div className="stat-lbl">Speso (mese)</div></div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'active' : ''}`}>Tutti <span className="chip-count">{purchases.length}</span></button>
          <button onClick={() => setFilter('intransit')} className={`chip ${filter === 'intransit' ? 'active' : ''}`}>In transito <span className="chip-count">{transitCnt}</span></button>
          <button onClick={() => setFilter('received')} className={`chip ${filter === 'received' ? 'active' : ''}`}>Ricevuti</button>
          <button onClick={() => setFilter('topay')} className={`chip ${filter === 'topay' ? 'active' : ''}`}>Da pagare <span className="chip-count">{topayCnt}</span></button>
        </div>
        <input type="text" placeholder="Cerca acquisto, fornitore…" value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      <div className="table-card">
        {filtered.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--text3)', fontSize:'13px' }}>Nessun acquisto trovato</div>}
        {filtered.map((purchase) => {
          const st = STATUS[purchase.status] || { label: purchase.status, cls: 'badge-muted' };
          return (
            <div key={purchase.id} className="list-row" style={{ gridTemplateColumns:'80px 1fr auto auto', cursor:'pointer' }} onClick={() => openEdit(purchase)}>
              <span className="ord-id">{purchase.poNumber}</span>
              <div><div className="row-name">{purchase.supplier}</div><div className="row-meta">{purchase.items} · {purchase.date}</div></div>
              <div><span className={`badge ${st.cls}`}>{st.label}</span></div>
              <div className="row-money">{fmt(purchase.total)}</div>
            </div>
          );
        })}
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'14px 16px', marginTop:'14px', display:'flex', gap:'10px', alignItems:'flex-start' }}>
        <span style={{ fontSize:'14px' }}>💡</span>
        <div style={{ fontSize:'12px', color:'var(--text2)', lineHeight:1.5 }}><strong style={{ color:'var(--text)' }}>Promemoria:</strong> gli acquisti non sono spese. Diventano costi (COGS) <em>solo quando vendi</em>.</div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifica acquisto' : 'Nuovo acquisto'}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Numero PO</label><input className={`form-input ${errors.poNumber ? 'error' : ''}`} value={form.poNumber} onChange={e => setForm({...form, poNumber: e.target.value})} placeholder="es. PO-019" />{errors.poNumber && <div className="form-error">{errors.poNumber}</div>}</div>
          <div className="form-group"><label className="form-label">Fornitore</label><input className={`form-input ${errors.supplier ? 'error' : ''}`} value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} placeholder="es. AutoTools SRL" />{errors.supplier && <div className="form-error">{errors.supplier}</div>}</div>
        </div>
        <div className="form-group"><label className="form-label">Articoli</label><input className={`form-input ${errors.items ? 'error' : ''}`} value={form.items} onChange={e => setForm({...form, items: e.target.value})} placeholder="es. OBD Scanner ×10, Cavi ×50" />{errors.items && <div className="form-error">{errors.items}</div>}</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Totale (€)</label><input className={`form-input ${errors.total ? 'error' : ''}`} type="number" min="0" value={form.total} onChange={e => setForm({...form, total: e.target.value})} />{errors.total && <div className="form-error">{errors.total}</div>}</div>
          <div className="form-group"><label className="form-label">Data</label><input className={`form-input ${errors.date ? 'error' : ''}`} value={form.date} onChange={e => setForm({...form, date: e.target.value})} placeholder="es. 15 mag" />{errors.date && <div className="form-error">{errors.date}</div>}</div>
        </div>
        <div className="form-group"><label className="form-label">Stato</label>
          <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Annulla</button>
          {editingId && <button className="btn-danger" onClick={() => { setModalOpen(false); setDeleteModal(purchases.find(p => p.id === editingId)); }}>Elimina</button>}
          <button className="btn-primary" onClick={handleSave}>{editingId ? 'Salva' : 'Crea acquisto'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Elimina acquisto">
        <p className="confirm-text">Eliminare acquisto <span className="confirm-highlight">{deleteModal?.poNumber}</span>?</p>
        <div className="form-actions"><button className="btn-secondary" onClick={() => setDeleteModal(null)}>Annulla</button><button className="btn-danger" onClick={handleDelete}>Elimina</button></div>
      </Modal>
    </main>
  );
}
