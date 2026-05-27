// Pagina Ordini — CRUD con SearchableSelect, DatePicker, toggle spedizione/abbonamento
import { useState } from 'react';
import { useData, fmt } from '../context/DataContext';
import Modal from '../components/Modal';
import SearchableSelect from '../components/SearchableSelect';
import DatePicker from '../components/DatePicker';
import PhoneInput from '../components/PhoneInput';

const STATUS = {
  paid:     { label:'Pagato',      cls:'badge-green' },
  pending:  { label:'In sospeso',  cls:'badge-amber' },
  shipped:  { label:'Spedito',     cls:'badge-blue'  },
  refunded: { label:'Rimborsato',  cls:'badge-red'   },
  active:   { label:'Attivo',      cls:'badge-green' },
};

const emptyItem = { productId: '', quantity: 1, unitPrice: '', unitCost: '' };
const emptyShipping = { address:'', civico:'', cap:'', country:'Italia', tracking:'', contrassegno:false, phone:{ countryCode:'IT', number:'' } };
const emptySub = { planId:'', amount:'', startDate:'' };
const emptyForm = { customerId:'', channel:'', status:'paid', date:'', items:[{ ...emptyItem }], shipping:false, shippingData:emptyShipping, subscription:false, subData:emptySub };

export default function Orders() {
  const { orders, customers, products, channels, subscriptions, getChannel, getCustomer, getProduct, showToast, createOrder, updateOrder, deleteOrder, createSubscription } = useData();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [shipOpen, setShipOpen] = useState(true);
  const [subOpen, setSubOpen] = useState(true);

  // Totali calcolati dagli items
  const computedTotal = form.items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (Number(i.quantity) || 1), 0);
  const computedCogs  = form.items.reduce((s, i) => s + (Number(i.unitCost)  || 0) * (Number(i.quantity) || 1), 0);

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const cust = getCustomer(o.customerId);
      const firstItem = o.orderItems?.[0];
      const prod = firstItem ? getProduct(firstItem.productId) : getProduct(o.productId);
      return o.orderNumber.toLowerCase().includes(q) ||
        (cust && cust.name.toLowerCase().includes(q)) ||
        (prod && prod.name.toLowerCase().includes(q));
    }
    return true;
  });

  const totalRev = orders.reduce((a, o) => a + o.total, 0);
  const ticket = orders.length > 0 ? Math.round(totalRev / orders.length) : 0;
  const filterCounts = { paid: orders.filter(o => o.status === 'paid').length, pending: orders.filter(o => o.status === 'pending').length, shipped: orders.filter(o => o.status === 'shipped').length, refunded: orders.filter(o => o.status === 'refunded').length };

  // Items helpers
  const updateItem = (idx, field, val) => {
    const items = form.items.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: val };
      // Auto-fill prezzo e cogs quando si seleziona un prodotto
      if (field === 'productId') {
        const p = products.find(x => x.id === val);
        if (p) { updated.unitPrice = String(p.price); updated.unitCost = String(p.cost); }
      }
      return updated;
    });
    setForm({ ...form, items });
  };
  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = 'Seleziona cliente';
    if (!form.channel) e.channel = 'Seleziona canale';
    if (!form.date) e.date = 'Data obbligatoria';
    form.items.forEach((item, idx) => {
      if (!item.productId) e[`item_${idx}_product`] = 'Seleziona prodotto';
      if (!item.unitPrice || Number(item.unitPrice) < 0) e[`item_${idx}_price`] = 'Prezzo non valido';
    });
    if (form.shipping) {
      if (!form.shippingData.address.trim()) e.shipAddress = 'Indirizzo obbligatorio';
      if (!form.shippingData.cap.trim()) e.shipCap = 'CAP obbligatorio';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    setForm({ ...emptyForm, date: iso, items: [{ ...emptyItem }] });
    setEditingId(null); setErrors({}); setShipOpen(true); setSubOpen(true); setModalOpen(true);
  };

  const openEdit = (order) => {
    const existingSub = order.subscriptionId ? subscriptions.find(s => s.id === order.subscriptionId) : null;
    const subProducts = products.filter(p => p.type === 'sub');
    const subProd = existingSub ? subProducts.find(p => p.name === existingSub.plan) : null;
    const cust = getCustomer(order.customerId);

    // Popola items da orderItems se disponibili, altrimenti fallback su productId legacy
    const items = order.orderItems?.length
      ? order.orderItems.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: String(i.unitPrice), unitCost: String(i.unitCost) }))
      : order.productId ? [{ productId: order.productId, quantity: 1, unitPrice: String(order.total), unitCost: String(order.cogs) }]
      : [{ ...emptyItem }];

    setForm({
      customerId: order.customerId, channel: order.channel, status: order.status,
      date: order._rawDate ? order._rawDate.split('T')[0] : order.date,
      items,
      shipping: !!order.shippingAddress,
      shippingData: order.shippingAddress
        ? { address:order.shippingAddress||'', civico:order.shippingCivico||'', cap:order.shippingCap||'', country:order.shippingCountry||'Italia', tracking:order.shippingTracking||'', contrassegno:order.contrassegno||false, phone: order.shippingPhone || cust?.phone || emptyShipping.phone }
        : { ...emptyShipping, phone: cust?.phone || emptyShipping.phone },
      subscription: !!order.subscriptionId,
      subData: existingSub ? { planId: subProd?.id || '', amount: String(existingSub.mrr || ''), startDate: existingSub._rawNext ? existingSub._rawNext.split('T')[0] : '' } : emptySub,
    });
    setEditingId(order.id); setErrors({}); setShipOpen(true); setSubOpen(true); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    const orderData = {
      customerId: form.customerId,
      channelId: form.channel,
      status: form.status.toUpperCase(),
      date: form.date,
      items: form.items.map(i => ({ productId: i.productId, quantity: Number(i.quantity) || 1, unitPrice: Number(i.unitPrice) || 0, unitCost: Number(i.unitCost) || 0 })),
      ...(form.shipping && { shippingData: { address:form.shippingData.address, civico:form.shippingData.civico, cap:form.shippingData.cap, country:form.shippingData.country, tracking:form.shippingData.tracking, contrassegno:form.shippingData.contrassegno, phone: form.shippingData.phone?.number ? form.shippingData.phone : undefined } }),
    };
    setModalOpen(false);
    try {
      if (editingId) {
        await updateOrder(editingId, orderData);
        showToast('Ordine aggiornato');
      } else {
        await createOrder(orderData);
        if (form.subscription && form.subData.planId) {
          const subProducts = products.filter(p => p.type === 'sub');
          const prod = subProducts.find(p => p.id === form.subData.planId);
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

  const customerOpts = customers.map((c, i) => ({ value:c.id, label:c.name, recent: i < 3 }));
  const productOpts  = products.map((p, i) => ({ value:p.id, label:`${p.name} — ${fmt(p.price)}`, recent: i < 3 }));
  const channelOpts  = channels.map(c => ({ value:c.id, label:c.name }));
  const subProducts  = products.filter(p => p.type === 'sub');
  const subOpts      = subProducts.map(p => ({ value:p.id, label:`${p.name} — ${fmt(p.price)}/mese` }));

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
          const firstItem = order.orderItems?.[0];
          const prod = firstItem ? getProduct(firstItem.productId) : getProduct(order.productId);
          const extraItems = (order.orderItems?.length || 1) - 1;
          const st = STATUS[order.status] || { label: order.status, cls: 'badge-muted' };
          const profit = order.total - order.cogs;
          return (
            <div key={order.id} className="list-row ord-row" style={{ cursor:'pointer' }} onClick={() => openEdit(order)}>
              <span className="ord-id">{order.orderNumber}</span>
              <div>
                <div className="row-name">{cust?.name || '—'}</div>
                <div className="row-meta">
                  {prod?.name || '—'}{extraItems > 0 && ` +${extraItems}`} · {order.date}
                </div>
              </div>
              <div>{ch && <span className="chan-badge" style={{ background:ch.dim, color:ch.color, borderColor:ch.bord }}><span className="chan-dot" style={{ background:ch.color }}></span>{ch.name}</span>}</div>
              <div><span className={`badge ${st.cls}`}>{st.label}</span></div>
              <div className="row-money pos">{fmt(profit)}<div className="row-meta" style={{ marginTop:'2px' }}>{fmt(order.total)} venduto</div></div>
            </div>
          );
        })}
      </div>

      {/* Modal Crea/Modifica */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifica ordine' : 'Nuovo ordine'}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cliente</label>
            <SearchableSelect options={customerOpts} value={form.customerId} onChange={v => {
              const c = customers.find(x => x.id === v);
              const hasAddr = !!(c?.address);
              if (hasAddr) setShipOpen(true);
              setForm({ ...form, customerId: v, shipping: hasAddr || form.shipping,
                shippingData: hasAddr
                  ? { ...emptyShipping, address: c.address||'', civico: c.civico||'', cap: c.cap||'', country: c.country||'Italia', phone: c.phone || emptyShipping.phone }
                  : { ...form.shippingData, phone: c?.phone || form.shippingData.phone },
              });
            }} placeholder="Seleziona cliente…" error={errors.customerId} />
            {errors.customerId && <div className="form-error">{errors.customerId}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Canale</label>
            <SearchableSelect options={channelOpts} value={form.channel} onChange={v => setForm({...form, channel:v})} placeholder="Seleziona canale…" error={errors.channel} />
            {errors.channel && <div className="form-error">{errors.channel}</div>}
          </div>
        </div>

        {/* ─── PRODOTTI / ITEMS ─── */}
        <div className="form-group">
          <label className="form-label">Prodotti</label>
          <div className="order-items-list">
            {form.items.map((item, idx) => (
              <div key={idx} className="order-item-row">
                <div className="order-item-product">
                  <SearchableSelect
                    options={productOpts}
                    value={item.productId}
                    onChange={v => updateItem(idx, 'productId', v)}
                    placeholder="Prodotto…"
                    error={errors[`item_${idx}_product`]}
                  />
                </div>
                <input
                  type="number" min="1"
                  className="form-input order-item-qty"
                  value={item.quantity}
                  onChange={e => updateItem(idx, 'quantity', e.target.value)}
                  placeholder="Qtà"
                />
                <input
                  type="number" min="0" step="0.01"
                  className={`form-input order-item-price ${errors[`item_${idx}_price`] ? 'error' : ''}`}
                  value={item.unitPrice}
                  onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                  placeholder="Prezzo €"
                />
                <input
                  type="number" min="0" step="0.01"
                  className="form-input order-item-price"
                  value={item.unitCost}
                  onChange={e => updateItem(idx, 'unitCost', e.target.value)}
                  placeholder="COGS €"
                />
                {form.items.length > 1 && (
                  <button type="button" className="order-item-remove" onClick={() => removeItem(idx)}>✕</button>
                )}
              </div>
            ))}
            <button type="button" className="order-item-add" onClick={addItem}>+ Aggiungi prodotto</button>
          </div>
          {computedTotal > 0 && (
            <div className="order-items-totals">
              <span>Totale: <strong>{fmt(computedTotal)}</strong></span>
              <span>COGS: <strong>{fmt(computedCogs)}</strong></span>
              <span>Margine: <strong style={{ color: computedTotal - computedCogs >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(computedTotal - computedCogs)}</strong></span>
            </div>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Stato</label>
            <select className="form-select" value={form.status} onChange={e => setForm({...form, status:e.target.value})}>
              {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Data</label>
            <DatePicker value={form.date} onChange={v => setForm({...form, date:v})} error={errors.date} />
            {errors.date && <div className="form-error">{errors.date}</div>}
          </div>
        </div>

        {/* ─── TOGGLE SPEDIZIONE ─── */}
        <div className="form-toggle">
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }} onClick={() => setForm({...form, shipping:!form.shipping})}>
            <div className={`form-toggle-switch ${form.shipping ? 'active' : ''}`}></div>
            <div><div className="form-toggle-label">📦 Spedizione</div><div className="form-toggle-sub">Aggiungi dati di spedizione all'ordine</div></div>
          </div>
          {form.shipping && <button type="button" onClick={e => { e.stopPropagation(); setShipOpen(o => !o); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:'4px', display:'flex', alignItems:'center' }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: shipOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.18s' }}><path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
        </div>
        {form.shipping && shipOpen && (
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
            <div className="form-group">
              <label className="form-label">Telefono spedizione</label>
              <PhoneInput value={form.shippingData.phone} onChange={phone => setForm({...form, shippingData:{...form.shippingData, phone}})} />
            </div>
            <div className="form-group"><label className="form-label">Tracking link</label><input className="form-input" value={form.shippingData.tracking} onChange={e => setForm({...form, shippingData:{...form.shippingData, tracking:e.target.value}})} placeholder="https://track.corriere.it/..." /></div>
            <div className="form-toggle" onClick={() => setForm({...form, shippingData:{...form.shippingData, contrassegno:!form.shippingData.contrassegno}})}>
              <div className={`form-toggle-switch ${form.shippingData.contrassegno ? 'active' : ''}`}></div>
              <div className="form-toggle-label">💵 Contrassegno</div>
            </div>
          </div>
        )}

        {/* ─── TOGGLE ABBONAMENTO ─── */}
        <div className="form-toggle">
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flex:1 }} onClick={() => setForm({...form, subscription:!form.subscription})}>
            <div className={`form-toggle-switch ${form.subscription ? 'active' : ''}`}></div>
            <div><div className="form-toggle-label">♻️ Abbonamento</div><div className="form-toggle-sub">Collega un piano ricorrente a questo ordine</div></div>
          </div>
          {form.subscription && <button type="button" onClick={e => { e.stopPropagation(); setSubOpen(o => !o); }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:'4px', display:'flex', alignItems:'center' }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: subOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.18s' }}><path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
        </div>
        {form.subscription && subOpen && (
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
