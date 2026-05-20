// Pagina Prodotti — CRUD completo con filtri e ricerca (usa DataContext)
import { useState } from 'react';
import { useData, fmt, genId } from '../context/DataContext';
import Modal from '../components/Modal';

const emptyForm = { name:'', sku:'', type:'obd', price:'', cost:'', stock:'', lowStock:'' };
const STOCK_TYPES = new Set(['obd','pc_tablet','accessory']);

export default function Products() {
  const { products, productTypes, getProductType, showToast, createProduct, updateProduct, deleteProduct } = useData();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  // ─── FILTRI E RICERCA ───
  const sottoSoglia = products.filter(p => p.stock !== null && p.lowStock && p.stock <= p.lowStock).length;

  const filteredProducts = products.filter((p) => {
    if (filter === 'low_stock') {
      if (p.stock === null || !p.lowStock || p.stock > p.lowStock) return false;
    } else if (filter !== 'all') {
      if (p.type !== filter) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const totalArticoli = products.length;
  const valoreStock = products.reduce((acc, p) => acc + (p.stock !== null ? p.stock * p.cost : 0), 0);

  // ─── VALIDAZIONE ───
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nome obbligatorio';
    if (!form.sku.trim()) e.sku = 'SKU obbligatorio';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Prezzo non valido';
    if (!form.cost || isNaN(Number(form.cost)) || Number(form.cost) < 0) e.cost = 'Costo non valido';
    if (STOCK_TYPES.has(form.type)) {
      if (form.stock !== '' && (isNaN(Number(form.stock)) || Number(form.stock) < 0)) e.stock = 'Stock non valido';
    }
    const existing = products.find(p => p.sku.toLowerCase() === form.sku.trim().toLowerCase() && p.id !== editingId);
    if (existing) e.sku = 'SKU già esistente';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── CRUD HANDLERS ───
  const openCreate = () => { setForm(emptyForm); setEditingId(null); setErrors({}); setModalOpen(true); };
  const openEdit = (product) => {
    setForm({ name:product.name, sku:product.sku, type:product.type, price:String(product.price), cost:String(product.cost), stock:product.stock !== null ? String(product.stock) : '', lowStock:product.lowStock ? String(product.lowStock) : '' });
    setEditingId(product.id); setErrors({}); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!validate()) return;
    const stockVal = form.stock !== '' ? Number(form.stock) : null;
    const lowStockVal = form.lowStock !== '' ? Number(form.lowStock) : null;
    const data = { name:form.name.trim(), sku:form.sku.trim(), typeKey:form.type, price:Number(form.price), cost:Number(form.cost), stock:stockVal, lowStock:lowStockVal };
    setModalOpen(false);
    try {
      if (editingId) {
        await updateProduct(editingId, data);
        showToast('Prodotto aggiornato');
      } else {
        await createProduct(data);
        showToast('Prodotto creato');
      }
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const handleDelete = async () => {
    setDeleteModal(null);
    try {
      await deleteProduct(deleteModal.id);
      showToast('Prodotto eliminato', 'error');
    } catch (e) { showToast(e.message || 'Errore eliminazione', 'error'); }
  };

  // ─── RENDER ───
  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1 className="page-h1">Prodotti</h1>
          <div className="page-sub">{totalArticoli} articoli · {fmt(valoreStock)} valore stock</div>
        </div>
        <button className="btn-primary" onClick={openCreate}><span className="plus">+</span> Prodotto</button>
      </div>

      <div className="stat-strip">
        <div className="stat-card"><span className="stat-icon">📦</span><div className="stat-val">{totalArticoli}</div><div className="stat-lbl">Articoli</div></div>
        <div className="stat-card"><span className="stat-icon">💼</span><div className="stat-val">{fmt(valoreStock)}</div><div className="stat-lbl">Valore stock</div></div>
        <div className="stat-card"><span className="stat-icon">⚠️</span><div className="stat-val">{sottoSoglia}</div><div className="stat-lbl">Sotto soglia</div></div>
      </div>

      <div className="filter-row">
        <div className="filter-chips">
          <button onClick={() => setFilter('all')} className={`chip ${filter === 'all' ? 'active' : ''}`}>Tutti <span className="chip-count">{products.length}</span></button>
          {productTypes.map(pt => {
            const cnt = products.filter(p => p.type === pt.key).length;
            return <button key={pt.key} onClick={() => setFilter(pt.key)} className={`chip ${filter === pt.key ? 'active' : ''}`}>{pt.label} <span className="chip-count">{cnt}</span></button>;
          })}
          <button onClick={() => setFilter('low_stock')} className={`chip ${filter === 'low_stock' ? 'active' : ''}`}>Sotto soglia <span className="chip-count">{sottoSoglia}</span></button>
        </div>
        <input type="text" placeholder="Cerca prodotto, SKU…" value={search} onChange={(e) => setSearch(e.target.value)} className="search-input" />
      </div>

      <div className="table-card">
        {filteredProducts.length === 0 && <div style={{ padding:'24px', textAlign:'center', color:'var(--text3)', fontSize:'13px' }}>Nessun prodotto trovato</div>}
        {filteredProducts.map((product) => {
          const t = getProductType(product.type);
          const margin = ((product.price - product.cost) / product.price * 100).toFixed(0);
          const isLow = product.stock !== null && product.lowStock && product.stock <= product.lowStock;
          return (
            <div key={product.id} className="prod-row" onClick={() => openEdit(product)}>
              <div className="prod-icon">{t?.icon || '📦'}</div>
              <div className="prod-info">
                <div className="prod-name">{product.name}</div>
                <div className="prod-meta">{product.sku} · {t?.label || product.type}</div>
              </div>
              {product.stock !== null ? (
                <span className={`prod-stock ${isLow ? 'low' : ''}`}>{product.stock} {isLow && '⚠'}</span>
              ) : (
                <span className="prod-stock infinite">∞</span>
              )}
              <div className="prod-prices">
                <div className="prod-price">{fmt(product.price)}</div>
                <div className="prod-margin">costo {fmt(product.cost)} · {margin}%</div>
              </div>
              <div className="prod-actions" onClick={(e) => e.stopPropagation()}>
                <button className="prod-action-btn" onClick={() => openEdit(product)} title="Modifica">✏️</button>
                <button className="prod-action-btn" onClick={() => setDeleteModal(product)} title="Elimina">🗑️</button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Modifica prodotto' : 'Nuovo prodotto'}>
        <div className="form-group">
          <label className="form-label">Nome prodotto</label>
          <input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name} onChange={(e) => setForm({...form, name:e.target.value})} placeholder="es. OBD Scanner Pro Kit" />
          {errors.name && <div className="form-error">{errors.name}</div>}
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">SKU</label>
            <input className={`form-input ${errors.sku ? 'error' : ''}`} value={form.sku} onChange={(e) => setForm({...form, sku:e.target.value})} placeholder="es. OBD-PRO-01" />
            {errors.sku && <div className="form-error">{errors.sku}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select className="form-select" value={form.type} onChange={(e) => setForm({...form, type:e.target.value})}>
              {productTypes.map(pt => <option key={pt.key} value={pt.key}>{pt.icon} {pt.label}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Prezzo vendita (€)</label>
            <input className={`form-input ${errors.price ? 'error' : ''}`} type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({...form, price:e.target.value})} placeholder="0.00" />
            {errors.price && <div className="form-error">{errors.price}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Costo (€)</label>
            <input className={`form-input ${errors.cost ? 'error' : ''}`} type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({...form, cost:e.target.value})} placeholder="0.00" />
            {errors.cost && <div className="form-error">{errors.cost}</div>}
          </div>
        </div>
        {STOCK_TYPES.has(form.type) && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Stock attuale</label>
              <input className={`form-input ${errors.stock ? 'error' : ''}`} type="number" min="0" value={form.stock} onChange={(e) => setForm({...form, stock:e.target.value})} placeholder="0" />
              {errors.stock && <div className="form-error">{errors.stock}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Soglia minima</label>
              <input className="form-input" type="number" min="0" value={form.lowStock} onChange={(e) => setForm({...form, lowStock:e.target.value})} placeholder="5" />
            </div>
          </div>
        )}
        {form.price && form.cost && Number(form.price) > 0 && (
          <div style={{ background:'var(--accent-glow)', borderRadius:'var(--r-sm)', padding:'10px 14px', marginTop:'8px', fontSize:'12px', color:'var(--accent2)' }}>
            Margine: <strong>{((Number(form.price) - Number(form.cost)) / Number(form.price) * 100).toFixed(1)}%</strong> · Profit: <strong>€ {(Number(form.price) - Number(form.cost)).toFixed(2)}</strong>
          </div>
        )}
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => setModalOpen(false)}>Annulla</button>
          <button className="btn-primary" onClick={handleSave}>{editingId ? 'Salva modifiche' : 'Crea prodotto'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Elimina prodotto">
        <p className="confirm-text">Stai per eliminare <span className="confirm-highlight">{deleteModal?.name}</span> ({deleteModal?.sku}). Questa azione non può essere annullata.</p>
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => setDeleteModal(null)}>Annulla</button>
          <button className="btn-danger" onClick={handleDelete}>Elimina</button>
        </div>
      </Modal>
    </main>
  );
}
