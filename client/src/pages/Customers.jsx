// Pagina Clienti — CRUD con phone input + indirizzo opzionale
import { useState } from 'react';
import { useData, fmt, genId } from '../context/DataContext';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import PhoneInput from '../components/PhoneInput';

const emptyForm = { name:'', city:'', firstChannel:'', phone:{ countryCode:'IT', number:'' }, address:'', civico:'', cap:'', country:'Italia' };

export default function Customers() {
  const { customers, channels, getChannel, subscriptions, showToast, createCustomer, updateCustomer, deleteCustomer } = useData();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').slice(0,2);
  const avgLtv = customers.length > 0 ? Math.round(customers.reduce((a, c) => a + c.ltv, 0) / customers.length) : 0;
  const subIds = new Set(subscriptions.map(s => s.customerId));

  const filtered = customers.filter(c => {
    if (filter === 'top_ltv') { if (c.ltv < avgLtv) return false; }
    else if (filter === 'subscription') { if (!subIds.has(c.id)) return false; }
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q);
    }
    return true;
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nome obbligatorio';
    if (!form.city.trim()) e.city = 'Città obbligatoria';
    if (!form.firstChannel) e.firstChannel = 'Seleziona canale';
    if (!form.phone.number.trim()) e.phone = 'Telefono obbligatorio';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setErrors({}); setModalOpen(true); };
  const openEdit = (c) => {
    setForm({ name:c.name, city:c.city, firstChannel:c.firstChannel, phone:c.phone || { countryCode:'IT', number:'' }, address:c.address || '', civico:c.civico || '', cap:c.cap || '', country:c.country || 'Italia' });
    setEditingId(c.id); setErrors({}); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    const data = { name:form.name.trim(), city:form.city.trim(), firstChannel:form.firstChannel, phone:form.phone, address:form.address.trim(), civico:form.civico.trim(), cap:form.cap.trim(), country:form.country.trim() };
    setModalOpen(false);
    try {
      if (editingId) {
        await updateCustomer(editingId, data);
        showToast('Cliente aggiornato');
      } else {
        await createCustomer(data);
        showToast('Cliente creato');
      }
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const handleDelete = async () => {
    setDeleteModal(null);
    try {
      await deleteCustomer(deleteModal.id);
      showToast('Cliente eliminato', 'error');
    } catch (e) { showToast(e.message || 'Errore eliminazione', 'error'); }
  };

  // SearchableSelect options for channels
  const channelOptions = channels.map(c => ({ value:c.id, label:c.name }));

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-h1">Clienti</h1>
          <div className="page-sub">{customers.length} totali · LTV medio {fmt(avgLtv)}</div>
        </div>
        <button className="btn-primary" onClick={openCreate}><span className="plus">+</span> Cliente</button>
      </div>

      <div className="stat-strip">
        <div className="stat-card"><span className="stat-icon">👥</span><div className="stat-val">{customers.length}</div><div className="stat-lbl">Totali</div></div>
        <div className="stat-card"><span className="stat-icon">💎</span><div className="stat-val">{fmt(avgLtv)}</div><div className="stat-lbl">LTV medio</div></div>
        <div className="stat-card"><span className="stat-icon">♻️</span><div className="stat-val">{subIds.size}</div><div className="stat-lbl">Con abbonamento</div></div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'active' : ''}`}>Tutti <span className="chip-count">{customers.length}</span></button>
          <button onClick={() => setFilter('top_ltv')} className={`chip ${filter === 'top_ltv' ? 'active' : ''}`}>Top LTV</button>
          <button onClick={() => setFilter('subscription')} className={`chip ${filter === 'subscription' ? 'active' : ''}`}>Con abbonamento <span className="chip-count">{subIds.size}</span></button>
        </div>
        <input type="text" placeholder="Cerca cliente, città…" value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      <div className="table-card">
        {filtered.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--text3)', fontSize:'13px' }}>Nessun cliente trovato</div>}
        {filtered.map((customer) => {
          const ch = getChannel(customer.firstChannel);
          return (
            <div key={customer.id} className="list-row" style={{ gridTemplateColumns:'36px 1fr auto auto', cursor:'pointer' }} onClick={() => openEdit(customer)}>
              <div className="avatar" style={{ width:'32px', height:'32px', fontSize:'11px', boxShadow:'none', background:'linear-gradient(135deg,#6366f1,#a855f7)' }}>{getInitials(customer.name)}</div>
              <div>
                <div className="row-name">{customer.name}</div>
                <div className="row-meta">{customer.city} · {customer.orders} ordini · primo da {ch?.name || '—'}</div>
              </div>
              <div style={{ textAlign:'right' }}><div className="row-money">{fmt(customer.ltv)}</div><div style={{ fontSize:'10.5px', color:'var(--text3)', marginTop:'2px' }}>LTV</div></div>
              <div className="row-meta" style={{ fontFamily:'var(--mono)' }}>{customer.last}</div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifica cliente' : 'Nuovo cliente'}>
        <div className="form-group"><label className="form-label">Nome completo</label><input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="es. Marco Ferrari" />{errors.name && <div className="form-error">{errors.name}</div>}</div>

        <div className="form-group">
          <label className="form-label">Telefono *</label>
          <PhoneInput value={form.phone} onChange={phone => setForm({...form, phone})} error={errors.phone} />
          {errors.phone && <div className="form-error">{errors.phone}</div>}
        </div>

        <div className="form-row">
          <div className="form-group"><label className="form-label">Città *</label><input className={`form-input ${errors.city ? 'error' : ''}`} value={form.city} onChange={e => setForm({...form, city:e.target.value})} placeholder="es. Milano" />{errors.city && <div className="form-error">{errors.city}</div>}</div>
          <div className="form-group"><label className="form-label">Primo canale *</label>
            <SearchableSelect options={channelOptions} value={form.firstChannel} onChange={v => setForm({...form, firstChannel:v})} placeholder="Seleziona canale…" error={errors.firstChannel} />
            {errors.firstChannel && <div className="form-error">{errors.firstChannel}</div>}
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">📍 Indirizzo (opzionale)</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Indirizzo</label><input className="form-input" value={form.address} onChange={e => setForm({...form, address:e.target.value})} placeholder="es. Via Roma" /></div>
            <div className="form-group"><label className="form-label">Civico</label><input className="form-input" value={form.civico} onChange={e => setForm({...form, civico:e.target.value})} placeholder="es. 10" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">CAP</label><input className="form-input" value={form.cap} onChange={e => setForm({...form, cap:e.target.value})} placeholder="es. 20100" /></div>
            <div className="form-group"><label className="form-label">Paese</label><input className="form-input" value={form.country} onChange={e => setForm({...form, country:e.target.value})} placeholder="Italia" /></div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Annulla</button>
          {editingId && <button className="btn-danger" onClick={() => { setModalOpen(false); setDeleteModal(customers.find(c => c.id === editingId)); }}>Elimina</button>}
          <button className="btn-primary" onClick={handleSave}>{editingId ? 'Salva' : 'Crea cliente'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Elimina cliente">
        <p className="confirm-text">Eliminare <span className="confirm-highlight">{deleteModal?.name}</span>? I suoi ordini resteranno nel sistema.</p>
        <div className="form-actions"><button className="btn-secondary" onClick={() => setDeleteModal(null)}>Annulla</button><button className="btn-danger" onClick={handleDelete}>Elimina</button></div>
      </Modal>
    </main>
  );
}
