// Pagina Ordini — CRUD completo con filtri e ricerca
import { useState } from 'react';
import { useData, fmt, genId } from '../context/DataContext';
import Modal from '../components/Modal';

const STATUS = {
  paid:     { label:'Pagato',      cls:'badge-green' },
  pending:  { label:'In sospeso',  cls:'badge-amber' },
  shipped:  { label:'Spedito',     cls:'badge-blue'  },
  refunded: { label:'Rimborsato',  cls:'badge-red'   },
  active:   { label:'Attivo',      cls:'badge-green' },
};

const emptyForm = { customerId:'', productId:'', channel:'', total:'', cogs:'', status:'paid', date:'' };

export default function Orders() {
  const { orders, setOrders, customers, products, channels, getChannel, getCustomer, getProduct, showToast } = useData();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // ─── FILTRI E RICERCA ───
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

  // ─── VALIDAZIONE ───
  const validate = () => {
    const e = {};
    if (!form.customerId) e.customerId = 'Seleziona cliente';
    if (!form.productId) e.productId = 'Seleziona prodotto';
    if (!form.channel) e.channel = 'Seleziona canale';
    if (!form.total || isNaN(Number(form.total)) || Number(form.total) <= 0) e.total = 'Totale non valido';
    if (!form.cogs || isNaN(Number(form.cogs)) || Number(form.cogs) < 0) e.cogs = 'COGS non valido';
    if (!form.date) e.date = 'Data obbligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── CRUD ───
  const nextOrderNum = () => '#' + (1042 + orders.length + 1);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setErrors({}); setModalOpen(true); };
  const openEdit = (order) => {
    setForm({ customerId: order.customerId, productId: order.productId, channel: order.channel, total: String(order.total), cogs: String(order.cogs), status: order.status, date: order.date });
    setEditingId(order.id); setErrors({}); setModalOpen(true);
  };

  const handleSave = () => {
    if (!validate()) return;
    if (editingId) {
      setOrders(prev => prev.map(o => o.id === editingId ? { ...o, customerId: form.customerId, productId: form.productId, channel: form.channel, total: Number(form.total), cogs: Number(form.cogs), status: form.status, date: form.date } : o));
      showToast('Ordine aggiornato');
    } else {
      setOrders(prev => [{ id: genId('o'), orderNumber: nextOrderNum(), customerId: form.customerId, productId: form.productId, channel: form.channel, total: Number(form.total), cogs: Number(form.cogs), status: form.status, date: form.date }, ...prev]);
      showToast('Ordine creato');
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    setOrders(prev => prev.filter(o => o.id !== deleteModal.id));
    setDeleteModal(null); showToast('Ordine eliminato', 'error');
  };

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
            <select className={`form-select ${errors.customerId ? 'error' : ''}`} value={form.customerId} onChange={e => setForm({...form, customerId: e.target.value})}>
              <option value="">Seleziona…</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.customerId && <div className="form-error">{errors.customerId}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Prodotto</label>
            <select className={`form-select ${errors.productId ? 'error' : ''}`} value={form.productId} onChange={e => { const p = products.find(p => p.id === e.target.value); setForm({...form, productId: e.target.value, total: p ? String(p.price) : form.total, cogs: p ? String(p.cost) : form.cogs }); }}>
              <option value="">Seleziona…</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} — {fmt(p.price)}</option>)}
            </select>
            {errors.productId && <div className="form-error">{errors.productId}</div>}
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Canale</label>
            <select className={`form-select ${errors.channel ? 'error' : ''}`} value={form.channel} onChange={e => setForm({...form, channel: e.target.value})}>
              <option value="">Seleziona…</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.channel && <div className="form-error">{errors.channel}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Stato</label>
            <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Totale (€)</label><input className={`form-input ${errors.total ? 'error' : ''}`} type="number" min="0" value={form.total} onChange={e => setForm({...form, total: e.target.value})} />{errors.total && <div className="form-error">{errors.total}</div>}</div>
          <div className="form-group"><label className="form-label">COGS (€)</label><input className={`form-input ${errors.cogs ? 'error' : ''}`} type="number" min="0" value={form.cogs} onChange={e => setForm({...form, cogs: e.target.value})} />{errors.cogs && <div className="form-error">{errors.cogs}</div>}</div>
        </div>
        <div className="form-group"><label className="form-label">Data</label><input className={`form-input ${errors.date ? 'error' : ''}`} value={form.date} onChange={e => setForm({...form, date: e.target.value})} placeholder="es. 18 mag" />{errors.date && <div className="form-error">{errors.date}</div>}</div>
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
