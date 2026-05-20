// Pagina Abbonamenti — CRUD completo con filtri
import { useState } from 'react';
import { useData, fmt, genId } from '../context/DataContext';
import Modal from '../components/Modal';

const STATUS = {
  active:   { label:'Attivo',      cls:'badge-green' },
  expiring: { label:'In scadenza', cls:'badge-amber' },
  suspended:{ label:'Sospeso',     cls:'badge-red'   },
  cancelled:{ label:'Annullato',   cls:'badge-muted' },
};

const emptyForm = { customerId:'', plan:'', mrr:'', next:'', status:'active' };

export default function Subscriptions() {
  const { subscriptions, customers, getCustomer, showToast, createSubscription, updateSubscription, deleteSubscription } = useData();
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [alertVisible, setAlertVisible] = useState(true);

  const mrr = subscriptions.filter(s => s.status === 'active' || s.status === 'expiring').reduce((a, s) => a + s.mrr, 0);
  const activeCnt = subscriptions.filter(s => s.status === 'active').length;
  const expiringCnt = subscriptions.filter(s => s.status === 'expiring').length;

  const filtered = subscriptions.filter(s => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = 'Seleziona cliente';
    if (!form.plan.trim()) e.plan = 'Piano obbligatorio';
    if (!form.mrr || isNaN(Number(form.mrr)) || Number(form.mrr) <= 0) e.mrr = 'MRR non valido';
    if (!form.next.trim()) e.next = 'Data obbligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm({...emptyForm, next: new Date().toISOString().split('T')[0]}); setEditingId(null); setErrors({}); setModalOpen(true); };
  const openEdit = (s) => { setForm({ customerId: s.customerId, plan: s.plan, mrr: String(s.mrr), next: s._rawNext ? s._rawNext.split('T')[0] : s.next, status: s.status }); setEditingId(s.id); setErrors({}); setModalOpen(true); };

  const handleSave = async () => {
    if (!validate()) return;
    const data = { customerId: form.customerId, plan: form.plan.trim(), mrr: Number(form.mrr), nextDate: form.next.trim(), status: form.status.toUpperCase() };
    setModalOpen(false);
    try {
      if (editingId) {
        await updateSubscription(editingId, data);
        showToast('Abbonamento aggiornato');
      } else {
        await createSubscription(data);
        showToast('Abbonamento creato');
      }
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const handleDelete = async () => {
    setDeleteModal(null);
    try {
      await deleteSubscription(deleteModal.id);
      showToast('Abbonamento eliminato', 'error');
    } catch (e) { showToast(e.message || 'Errore eliminazione', 'error'); }
  };

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-h1">Abbonamenti</h1>
          <div className="page-sub">Gestione ricorrente · {activeCnt + expiringCnt} attivi · {fmt(mrr)} MRR</div>
        </div>
        <button className="btn-primary" onClick={openCreate}><span className="plus">+</span> Abbonamento</button>
      </div>

      {alertVisible && expiringCnt > 0 && (
        <div className="alert">
          <div className="alert-dot"></div>
          <div className="alert-body">
            <div className="alert-title">{expiringCnt} rinnovi in scadenza</div>
            <div className="alert-msg">Contatta i clienti per conferma rinnovo.</div>
          </div>
          <button className="alert-close" onClick={() => setAlertVisible(false)}>✕</button>
        </div>
      )}

      <div className="stat-strip">
        <div className="stat-card"><span className="stat-icon">💰</span><div className="stat-val">{fmt(mrr)}</div><div className="stat-lbl">MRR</div></div>
        <div className="stat-card"><span className="stat-icon">♻️</span><div className="stat-val">{activeCnt}</div><div className="stat-lbl">Attivi</div></div>
        <div className="stat-card"><span className="stat-icon">⚠️</span><div className="stat-val">{expiringCnt}</div><div className="stat-lbl">In scadenza</div></div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'active' : ''}`}>Tutti <span className="chip-count">{subscriptions.length}</span></button>
          <button onClick={() => setFilter('active')} className={`chip ${filter === 'active' ? 'active' : ''}`}>Attivi <span className="chip-count">{activeCnt}</span></button>
          <button onClick={() => setFilter('expiring')} className={`chip ${filter === 'expiring' ? 'active' : ''}`}>In scadenza <span className="chip-count">{expiringCnt}</span></button>
          <button onClick={() => setFilter('suspended')} className={`chip ${filter === 'suspended' ? 'active' : ''}`}>Sospesi</button>
          <button onClick={() => setFilter('cancelled')} className={`chip ${filter === 'cancelled' ? 'active' : ''}`}>Annullati</button>
        </div>
      </div>

      <div className="table-card">
        {filtered.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--text3)', fontSize:'13px' }}>Nessun abbonamento trovato</div>}
        {filtered.map((sub) => {
          const cust = getCustomer(sub.customerId);
          const st = STATUS[sub.status] || { label: sub.status, cls: 'badge-muted' };
          return (
            <div key={sub.id} className="list-row" style={{ gridTemplateColumns:'1fr auto auto', cursor:'pointer' }} onClick={() => openEdit(sub)}>
              <div>
                <div className="row-name">{cust?.name || '—'}</div>
                <div className="row-meta">{sub.plan} · rinnovo {sub.next}</div>
              </div>
              <div className="row-money">{fmt(sub.mrr)}<div style={{ fontSize:'10.5px', color:'var(--text3)', fontWeight:400, marginTop:'2px' }}>/mese</div></div>
              <div><span className={`badge ${st.cls}`}>{st.label}</span></div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifica abbonamento' : 'Nuovo abbonamento'}>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Cliente</label>
            <select className={`form-select ${errors.customerId ? 'error' : ''}`} value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
              <option value="">Seleziona…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.customerId && <div className="form-error">{errors.customerId}</div>}
          </div>
          <div className="form-group"><label className="form-label">Piano</label><input className={`form-input ${errors.plan ? 'error' : ''}`} value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} placeholder="es. Abbonamento Pro" />{errors.plan && <div className="form-error">{errors.plan}</div>}</div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">MRR (€/mese)</label><input className={`form-input ${errors.mrr ? 'error' : ''}`} type="number" min="0" value={form.mrr} onChange={e => setForm({...form, mrr: e.target.value})} />{errors.mrr && <div className="form-error">{errors.mrr}</div>}</div>
          <div className="form-group"><label className="form-label">Prossimo rinnovo</label><input className={`form-input ${errors.next ? 'error' : ''}`} value={form.next} onChange={e => setForm({...form, next: e.target.value})} placeholder="es. 22 mag" />{errors.next && <div className="form-error">{errors.next}</div>}</div>
        </div>
        <div className="form-group"><label className="form-label">Stato</label>
          <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Annulla</button>
          {editingId && <button className="btn-danger" onClick={() => { setModalOpen(false); setDeleteModal(subscriptions.find(s => s.id === editingId)); }}>Elimina</button>}
          <button className="btn-primary" onClick={handleSave}>{editingId ? 'Salva' : 'Crea abbonamento'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Elimina abbonamento">
        <p className="confirm-text">Eliminare abbonamento di <span className="confirm-highlight">{getCustomer(deleteModal?.customerId)?.name}</span>?</p>
        <div className="form-actions"><button className="btn-secondary" onClick={() => setDeleteModal(null)}>Annulla</button><button className="btn-danger" onClick={handleDelete}>Elimina</button></div>
      </Modal>
    </main>
  );
}
