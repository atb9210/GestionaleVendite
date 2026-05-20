// Pagina Ordini — CRUD con SearchableSelect, DatePicker, toggle spedizione/abbonamento
import { useState } from 'react';
import { useData, fmt, genId } from '../context/DataContext';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import DatePicker from '../components/DatePicker';

const STATUS = {
  paid:     { label:'Pagato',      cls:'badge-green' },
  pending:  { label:'In sospeso',  cls:'badge-amber' },
  shipped:  { label:'Spedito',     cls:'badge-blue'  },
  refunded: { label:'Rimborsato',  cls:'badge-red'   },
  active:   { label:'Attivo',      cls:'badge-green' },
};

const emptyShipping = { address:'', civico:'', cap:'', country:'Italia', tracking:'', contrassegno:false };
const emptySub = { planId:'', amount:'', startDate:'' };
const emptyForm = { customerId:'', productId:'', channel:'', total:'', cogs:'', status:'paid', date:'', shipping:false, shippingData:emptyShipping, subscription:false, subData:emptySub };

export default function Orders() {
  const { orders, customers, products, channels, subscriptions, getChannel, getCustomer, getProduct, showToast, createOrder, updateOrder, deleteOrder, createSubscription } = useData();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const cust = getCustomer(o.customerId);
      const prod = getProduct(o.productId);
      return o.orderNumber.toLowerCase().includes(q) ||
        (cust && cust.name.toLowerCase().includes(q)) ||
        (prod && prod.name.toLowerCase().includes(q));
    }
    return true;
  });

  const totalRev = orders.reduce((a, o) => a + o.total, 0);
  const ticket = orders.length > 0 ? Math.round(totalRev / orders.length) : 0;
  const filterCounts = { paid: orders.filter(o => o.status === 'paid').length, pending: orders.filter(o => o.status === 'pending').length, shipped: orders.filter(o => o.status === 'shipped').length, refunded: orders.filter(o => o.status === 'refunded').length };

  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = 'Seleziona cliente';
    if (!form.productId) e.productId = 'Seleziona prodotto';
    if (!form.channel) e.channel = 'Seleziona canale';
    if (!form.total || isNaN(Number(form.total)) || Number(form.total) <= 0) e.total = 'Totale non valido';
    if (!form.cogs || isNaN(Number(form.cogs)) || Number(form.cogs) < 0) e.cogs = 'COGS non valido';
    if (!form.date) e.date = 'Data obbligatoria';
    if (form.shipping) {
      if (!form.shippingData.address.trim()) e.shipAddress = 'Indirizzo obbligatorio';
      if (!form.shippingData.cap.trim()) e.shipCap = 'CAP obbligatorio';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextOrderNum = () => '#' + (1042 + orders.length + 1);

  const openCreate = () => { setForm({...emptyForm, date: new Date().toISOString().split('T')[0]}); setEditingId(null); setErrors({}); setModalOpen(true); };
  const openEdit = (order) => {
    setForm({
      customerId:order.customerId, productId:order.productId, channel:order.channel,
      total:String(order.total), cogs:String(order.cogs), status:order.status,
      date: order._rawDate ? order._rawDate.split('T')[0] : order.date,
      shipping:!!order.shippingAddress, shippingData: order.shippingAddress ? { address:order.shippingAddress||'', civico:order.shippingCivico||'', cap:order.shippingCap||'', country:order.shippingCountry||'Italia', tracking:order.shippingTracking||'', contrassegno:order.contrassegno||false } : emptyShipping,
      subscription:!!order.subscriptionId, subData:emptySub,
    });
    setEditingId(order.id); setErrors({}); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    const orderData = {
      customerId:form.customerId, productId:form.productId, channelId:form.channel,
      total:Number(form.total), cogs:Number(form.cogs), status:form.status.toUpperCase(), date:form.date,
      ...(form.shipping && { shippingData: { address:form.shippingData.address, civico:form.shippingData.civico, cap:form.shippingData.cap, country:form.shippingData.country, tracking:form.shippingData.tracking, contrassegno:form.shippingData.contrassegno } }),
    };
    setModalOpen(false);
    try {
      if (editingId) {
        await updateOrder(editingId, orderData);
        showToast('Ordine aggiornato');
      } else {
        await createOrder(orderData);
        if (form.subscription && form.subData.planId) {
          const prod = getProduct(form.subData.planId);
          await createSubscription({ customerId:form.customerId, plan:prod?.name || 'Abbonamento', mrr:Number(form.subData.amount) || 0, nextDate:form.subData.startDate || form.date, status:'ACTIVE' });
        }
        showToast('Ordine creato');
      }
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const handleDelete = async () => {
    setDeleteModal(null);
    try {
      await deleteOrder(deleteModal.id);
      showToast('Ordine eliminato', 'error');
    } catch (e) { showToast(e.message || 'Errore eliminazione', 'error'); }
  };

  // Options for SearchableSelect
  const customerOpts = customers.map((c, i) => ({ value:c.id, label:c.name, recent: i < 3 }));
  const productOpts = products.map((p, i) => ({ value:p.id, label:`${p.name} — ${fmt(p.price)}`, recent: i < 3 }));
  const channelOpts = channels.map(c => ({ value:c.id, label:c.name }));
  const subProducts = products.filter(p => p.type === 'sub');
  const subOpts = subProducts.map(p => ({ value:p.id, label:`${p.name} — ${fmt(p.price)}/mese` }));

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-h1">Ordini</h1>
          <div className="page-sub">{orders.length} ordini · {fmt(totalRev)} totale · ticket medio {fmt(ticket)}</div>
        </div>
        <button className="btn-primary" onClick={openCreate}><span className="plus">+</span> Nuovo</button>
      </div>

      <div className="stat-strip">
        <div className="stat-card"><span className="stat-icon">🧾</span><div className="stat-val">{orders.length}</div><div className="stat-lbl">Totali</div></div>
        <div className="stat-card"><span className="stat-icon">💰</span><div className="stat-val">{fmt(ticket)}</div><div className="stat-lbl">Ticket medio</div></div>
        <div className="stat-card"><span className="stat-icon">⚡</span><div className="stat-val">{orders.length > 0 ? Math.round(filterCounts.paid / orders.length * 100) : 0}%</div><div className="stat-lbl">Pagati</div></div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'active' : ''}`}>Tutti <span className="chip-count">{orders.length}</span></button>
          <button onClick={() => setFilter('paid')} className={`chip ${filter === 'paid' ? 'active' : ''}`}>Pagati <span className="chip-count">{filterCounts.paid}</span></button>
          <button onClick={() => setFilter('pending')} className={`chip ${filter === 'pending' ? 'active' : ''}`}>In sospeso <span className="chip-count">{filterCounts.pending}</span></button>
          <button onClick={() => setFilter('shipped')} className={`chip ${filter === 'shipped' ? 'active' : ''}`}>Spediti <span className="chip-count">{filterCounts.shipped}</span></button>
        </div>
        <input type="text" placeholder="Cerca ordine, cliente, prodotto…" value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      <div className="table-card">
        {filtered.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--text3)', fontSize:'13px' }}>Nessun ordine trovato</div>}
        {filtered.map((order) => {
          const ch = getChannel(order.channel);
          const cust = getCustomer(order.customerId);
          const prod = getProduct(order.productId);
          const st = STATUS[order.status] || { label: order.status, cls: 'badge-muted' };
          const profit = order.total - order.cogs;
          return (
            <div key={order.id} className="list-row ord-row" style={{ cursor:'pointer' }} onClick={() => openEdit(order)}>
              <span className="ord-id">{order.orderNumber}</span>
              <div>
                <div className="row-name">{cust?.name || '—'}</div>
                <div className="row-meta">{prod?.name || '—'} · {order.date}</div>
              </div>
              <div>{ch && <span className="chan-badge" style={{ background:ch.dim, color:ch.color, borderColor:ch.bord }}><span className="chan-dot" style={{ background:ch.color }}></span>{ch.name}</span>}</div>
              <div><span className={`badge ${st.cls}`}>{st.label}</span></div>
              <div className="row-money pos">{fmt(order.total)}<div style={{ fontSize:'10.5px', color:'var(--text3)', fontWeight:400, marginTop:'2px' }}>profit {fmt(profit)}</div></div>
            </div>
          );
        })}
      </div>

      {/* Modal Crea/Modifica */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifica ordine' : 'Nuovo ordine'}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <SearchableSelect options={customerOpts} value={form.customerId} onChange={v => setForm({...form, customerId:v})} placeholder="Seleziona cliente…" error={errors.customerId} />
            {errors.customerId && <div className="form-error">{errors.customerId}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Prodotto</label>
            <SearchableSelect options={productOpts} value={form.productId} onChange={v => { const p = products.find(x => x.id === v); setForm({...form, productId:v, total: p ? String(p.price) : form.total, cogs: p ? String(p.cost) : form.cogs }); }} placeholder="Seleziona prodotto…" error={errors.productId} />
            {errors.productId && <div className="form-error">{errors.productId}</div>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Canale</label>
            <SearchableSelect options={channelOpts} value={form.channel} onChange={v => setForm({...form, channel:v})} placeholder="Seleziona canale…" error={errors.channel} />
            {errors.channel && <div className="form-error">{errors.channel}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Stato</label>
            <select className="form-select" value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
              {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Totale (€)</label><input className={`form-input ${errors.total ? 'error' : ''}`} type="number" min="0" value={form.total} onChange={e => setForm({...form, total:e.target.value})} />{errors.total && <div className="form-error">{errors.total}</div>}</div>
          <div className="form-group"><label className="form-label">COGS (€)</label><input className={`form-input ${errors.cogs ? 'error' : ''}`} type="number" min="0" value={form.cogs} onChange={e => setForm({...form, cogs:e.target.value})} />{errors.cogs && <div className="form-error">{errors.cogs}</div>}</div>
        </div>
        <div className="form-group">
          <label className="form-label">Data</label>
          <DatePicker value={form.date} onChange={v => setForm({...form, date:v})} error={errors.date} />
          {errors.date && <div className="form-error">{errors.date}</div>}
        </div>

        {/* ─── TOGGLE SPEDIZIONE ─── */}
        <div className="form-toggle" onClick={() => setForm({...form, shipping:!form.shipping})}>
          <div className={`form-toggle-switch ${form.shipping ? 'active' : ''}`}></div>
          <div><div className="form-toggle-label">📦 Spedizione</div><div className="form-toggle-sub">Aggiungi dati di spedizione all'ordine</div></div>
        </div>
        {form.shipping && (
          <div className="form-section">
            <div className="form-section-title">🚚 Dati spedizione</div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Indirizzo *</label><input className={`form-input ${errors.shipAddress ? 'error' : ''}`} value={form.shippingData.address} onChange={e => setForm({...form, shippingData:{...form.shippingData, address:e.target.value}})} placeholder="es. Via Roma" />{errors.shipAddress && <div className="form-error">{errors.shipAddress}</div>}</div>
              <div className="form-group"><label className="form-label">Civico</label><input className="form-input" value={form.shippingData.civico} onChange={e => setForm({...form, shippingData:{...form.shippingData, civico:e.target.value}})} placeholder="es. 10" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">CAP *</label><input className={`form-input ${errors.shipCap ? 'error' : ''}`} value={form.shippingData.cap} onChange={e => setForm({...form, shippingData:{...form.shippingData, cap:e.target.value}})} placeholder="es. 20100" />{errors.shipCap && <div className="form-error">{errors.shipCap}</div>}</div>
              <div className="form-group"><label className="form-label">Paese</label><input className="form-input" value={form.shippingData.country} onChange={e => setForm({...form, shippingData:{...form.shippingData, country:e.target.value}})} placeholder="Italia" /></div>
            </div>
            <div className="form-group"><label className="form-label">Tracking link</label><input className="form-input" value={form.shippingData.tracking} onChange={e => setForm({...form, shippingData:{...form.shippingData, tracking:e.target.value}})} placeholder="https://track.corriere.it/..." /></div>
            <div className="form-toggle" onClick={() => setForm({...form, shippingData:{...form.shippingData, contrassegno:!form.shippingData.contrassegno}})}>
              <div className={`form-toggle-switch ${form.shippingData.contrassegno ? 'active' : ''}`}></div>
              <div className="form-toggle-label">💵 Contrassegno</div>
            </div>
          </div>
        )}

        {/* ─── TOGGLE ABBONAMENTO ─── */}
        <div className="form-toggle" onClick={() => setForm({...form, subscription:!form.subscription})}>
          <div className={`form-toggle-switch ${form.subscription ? 'active' : ''}`}></div>
          <div><div className="form-toggle-label">♻️ Abbonamento</div><div className="form-toggle-sub">Collega un piano ricorrente a questo ordine</div></div>
        </div>
        {form.subscription && (
          <div className="form-section">
            <div className="form-section-title">♻️ Dati abbonamento</div>
            <div className="form-group">
              <label className="form-label">Piano</label>
              <SearchableSelect options={subOpts} value={form.subData.planId} onChange={v => { const p = subProducts.find(x => x.id === v); setForm({...form, subData:{...form.subData, planId:v, amount: p ? String(p.price) : form.subData.amount }}); }} placeholder="Seleziona abbonamento…" />
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Importo (€/mese)</label><input className="form-input" type="number" min="0" value={form.subData.amount} onChange={e => setForm({...form, subData:{...form.subData, amount:e.target.value}})} /></div>
              <div className="form-group"><label className="form-label">Data attivazione</label><DatePicker value={form.subData.startDate || form.date} onChange={v => setForm({...form, subData:{...form.subData, startDate:v}})} /></div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Annulla</button>
          {editingId && <button className="btn-danger" onClick={() => { setModalOpen(false); setDeleteModal(orders.find(o => o.id === editingId)); }}>Elimina</button>}
          <button className="btn-primary" onClick={handleSave}>{editingId ? 'Salva' : 'Crea ordine'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Elimina ordine">
        <p className="confirm-text">Eliminare ordine <span className="confirm-highlight">{deleteModal?.orderNumber}</span>?</p>
        <div className="form-actions"><button className="btn-secondary" onClick={() => setDeleteModal(null)}>Annulla</button><button className="btn-danger" onClick={handleDelete}>Elimina</button></div>
      </Modal>
    </main>
  );
}
