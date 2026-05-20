// Pagina Acquisti — CRUD con SearchableSelect fornitori da Settings + tracking + DatePicker
import { useState } from 'react';
import { useData, fmt, genId } from '../context/DataContext';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import DatePicker from '../components/DatePicker';

const STATUS = {
  intransit: { label:'In transito', cls:'badge-blue'  },
  received:  { label:'Ricevuto',    cls:'badge-green' },
  topay:     { label:'Da pagare',   cls:'badge-amber' },
};

const emptyForm = { poNumber:'', supplierId:'', items:'', total:'', status:'intransit', date:'', tracking:'' };

export default function Purchases() {
  const { purchases, suppliers, showToast, createPurchase, updatePurchase, deletePurchase } = useData();
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

  const getSupplierName = (id) => suppliers.find(s => s.id === id)?.name || id || '—';

  const filtered = purchases.filter(p => {
    if (filter === 'intransit' && p.status !== 'intransit') return false;
    if (filter === 'received' && p.status !== 'received') return false;
    if (filter === 'topay' && p.status !== 'topay') return false;
    if (search) {
      const q = search.toLowerCase();
      const supName = getSupplierName(p.supplierId || p.supplier);
      return p.poNumber.toLowerCase().includes(q) || supName.toLowerCase().includes(q) || p.items.toLowerCase().includes(q);
    }
    return true;
  });

  const validate = () => {
    const e = {};
    if (!form.poNumber.trim()) e.poNumber = 'Numero PO obbligatorio';
    if (!form.supplierId) e.supplierId = 'Seleziona fornitore';
    if (!form.items.trim()) e.items = 'Articoli obbligatori';
    if (!form.total || isNaN(Number(form.total)) || Number(form.total) <= 0) e.total = 'Totale non valido';
    if (!form.date) e.date = 'Data obbligatoria';
    const dup = purchases.find(p => p.poNumber.toLowerCase() === form.poNumber.trim().toLowerCase() && p.id !== editingId);
    if (dup) e.poNumber = 'PO già esistente';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm({...emptyForm, date: new Date().toISOString().split('T')[0]}); setEditingId(null); setErrors({}); setModalOpen(true); };
  const openEdit = (p) => {
    setForm({ poNumber:p.poNumber, supplierId:p.supplierId || '', items:p.items, total:String(p.total), status:p.status, date: p._rawDate ? p._rawDate.split('T')[0] : p.date, tracking:p.tracking || '' });
    setEditingId(p.id); setErrors({}); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    const data = { poNumber:form.poNumber.trim(), supplierId:form.supplierId, items:form.items.trim(), total:Number(form.total), status:form.status.toUpperCase(), date:form.date, tracking:form.tracking.trim() || null };
    setModalOpen(false);
    try {
      if (editingId) {
        await updatePurchase(editingId, data);
        showToast('Acquisto aggiornato');
      } else {
        await createPurchase(data);
        showToast('Acquisto creato');
      }
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const handleDelete = async () => {
    setDeleteModal(null);
    try {
      await deletePurchase(deleteModal.id);
      showToast('Acquisto eliminato', 'error');
    } catch (e) { showToast(e.message || 'Errore eliminazione', 'error'); }
  };

  const supplierOpts = suppliers.map((s, i) => ({ value:s.id, label:s.name, recent: i < 2 }));

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
              <div><div className="row-name">{getSupplierName(purchase.supplierId || purchase.supplier)}</div><div className="row-meta">{purchase.items} · {purchase.date}</div></div>
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
          <div className="form-group"><label className="form-label">Numero PO</label><input className={`form-input ${errors.poNumber ? 'error' : ''}`} value={form.poNumber} onChange={e => setForm({...form, poNumber:e.target.value})} placeholder="es. PO-019" />{errors.poNumber && <div className="form-error">{errors.poNumber}</div>}</div>
          <div className="form-group">
            <label className="form-label">Fornitore</label>
            <SearchableSelect options={supplierOpts} value={form.supplierId} onChange={v => setForm({...form, supplierId:v})} placeholder="Seleziona fornitore…" error={errors.supplierId} />
            {errors.supplierId && <div className="form-error">{errors.supplierId}</div>}
          </div>
        </div>
        <div className="form-group"><label className="form-label">Articoli</label><input className={`form-input ${errors.items ? 'error' : ''}`} value={form.items} onChange={e => setForm({...form, items:e.target.value})} placeholder="es. OBD Scanner ×10, Cavi ×50" />{errors.items && <div className="form-error">{errors.items}</div>}</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Totale (€)</label><input className={`form-input ${errors.total ? 'error' : ''}`} type="number" min="0" value={form.total} onChange={e => setForm({...form, total:e.target.value})} />{errors.total && <div className="form-error">{errors.total}</div>}</div>
          <div className="form-group">
            <label className="form-label">Data</label>
            <DatePicker value={form.date} onChange={v => setForm({...form, date:v})} error={errors.date} />
            {errors.date && <div className="form-error">{errors.date}</div>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Stato</label>
            <select className="form-select" value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
              {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Tracking</label><input className="form-input" value={form.tracking} onChange={e => setForm({...form, tracking:e.target.value})} placeholder="https://track.corriere.it/..." /></div>
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
