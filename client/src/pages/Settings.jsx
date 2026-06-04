// Pagina Impostazioni — CRUD per categorie, canali, tipi prodotto
import { useState } from 'react';
import { useData, genId } from '../context/DataContext';
import { api } from '../lib/api';
import Modal from '../components/Modal';

const COLORS = ['#1877f2','#34a853','#e1306c','#818cf8','#f59e0b','#22c55e','#25d366','#ef4444','#8b5cf6','#f97316','#06b6d4','#ec4899'];
const ICONS = ['📦','📣','💿','⛽','📄','🔌','💻','🔧','♻️','🔗','🎧','📱','🛒','✈️','🏠','📐'];

export default function Settings() {
  const { channels, expenseCategories, productTypes, suppliers, convGroups, showToast,
    createChannel, updateChannel, deleteChannel: apiDeleteChannel,
    createExpenseCategory, createProductType,
    createSupplier, updateSupplier, deleteSupplier: apiDeleteSupplier,
    createConvGroup, updateConvGroup, deleteConvGroup: apiDeleteConvGroup,
    setExpenseCategories, setProductTypes } = useData();

  const [goals, setGoals] = useState({ monthlyProfit:'€ 4.000', marginTarget:'60%', mrrTarget:'€ 3.000' });

  // ─── Modal state ───
  const [modal, setModal] = useState({ type:null, editItem:null }); // type: 'channel'|'expcat'|'prodtype'
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState(null);

  // Team (statico per ora)
  const team = [
    { initials:'SM', name:'Store Manager', email:'manager@autodiag.it', role:'Manager', color:'#6366f1,#a855f7' },
    { initials:'TU', name:'Tu (Owner)', email:'owner@autodiag.it', role:'Owner', color:'#22c55e,#16a34a' },
  ];
  const getRoleColor = (role) => role === 'Owner' ? 'badge-green' : role === 'Manager' ? 'badge-accent' : 'badge-muted';

  // ─── Channel CRUD ───
  const openChannelCreate = () => { setForm({ name:'', color:COLORS[channels.length % COLORS.length] }); setModal({ type:'channel', editItem:null }); setErrors({}); };
  const openChannelEdit = (ch) => { setForm({ name:ch.name, color:ch.color }); setModal({ type:'channel', editItem:ch }); setErrors({}); };
  const saveChannel = async () => {
    if (!form.name.trim()) { setErrors({ name:'Nome obbligatorio' }); return; }
    try {
      if (modal.editItem) {
        await updateChannel(modal.editItem.id, { name:form.name.trim(), color:form.color });
        showToast('Canale aggiornato');
      } else {
        await createChannel({ name:form.name.trim(), color:form.color });
        showToast('Canale aggiunto');
      }
      setModal({ type:null, editItem:null });
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };
  const handleDeleteChannel = async () => {
    try {
      await apiDeleteChannel(deleteModal.id);
      setDeleteModal(null); showToast('Canale rimosso', 'error');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  // ─── Expense Category CRUD ───
  const openExpCatCreate = () => { setForm({ label:'', key:'', icon:'📄', color:'#a1a1aa' }); setModal({ type:'expcat', editItem:null }); setErrors({}); };
  const openExpCatEdit = (cat) => { setForm({ label:cat.label, key:cat.key, icon:cat.icon, color:cat.color }); setModal({ type:'expcat', editItem:cat }); setErrors({}); };
  const saveExpCat = async () => {
    if (!form.label.trim()) { setErrors({ label:'Nome obbligatorio' }); return; }
    const key = form.key || form.label.trim().toLowerCase().replace(/\s+/g,'_');
    try {
      if (modal.editItem) {
        await api.expenseCategories.update(modal.editItem.id, { label:form.label.trim(), key, icon:form.icon, color:form.color });
        setExpenseCategories(await api.expenseCategories.list());
        showToast('Categoria spesa aggiornata');
      } else {
        await createExpenseCategory({ key, label:form.label.trim(), icon:form.icon, color:form.color });
        showToast('Categoria spesa aggiunta');
      }
      setModal({ type:null, editItem:null });
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };
  const deleteExpCat = async () => {
    try {
      await api.expenseCategories.delete(deleteModal.id);
      setExpenseCategories(await api.expenseCategories.list());
      setDeleteModal(null); showToast('Categoria spesa rimossa', 'error');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  // ─── Product Type CRUD ───
  const openProdTypeCreate = () => { setForm({ label:'', key:'', icon:'🔌' }); setModal({ type:'prodtype', editItem:null }); setErrors({}); };
  const openProdTypeEdit = (pt) => { setForm({ label:pt.label, key:pt.key, icon:pt.icon }); setModal({ type:'prodtype', editItem:pt }); setErrors({}); };
  const saveProdType = async () => {
    if (!form.label.trim()) { setErrors({ label:'Nome obbligatorio' }); return; }
    const key = form.key || form.label.trim().toLowerCase().replace(/[\s/]+/g,'_');
    try {
      if (modal.editItem) {
        await api.productTypes.update(modal.editItem.id, { label:form.label.trim(), key, icon:form.icon });
        setProductTypes(await api.productTypes.list());
        showToast('Tipo prodotto aggiornato');
      } else {
        await createProductType({ key, label:form.label.trim(), icon:form.icon });
        showToast('Tipo prodotto aggiunto');
      }
      setModal({ type:null, editItem:null });
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };
  const deleteProdType = async () => {
    try {
      await api.productTypes.delete(deleteModal.id);
      setProductTypes(await api.productTypes.list());
      setDeleteModal(null); showToast('Tipo prodotto rimosso', 'error');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  // ─── Supplier CRUD ───
  const openSupplierCreate = () => { setForm({ name:'', contact:'', phone:'' }); setModal({ type:'supplier', editItem:null }); setErrors({}); };
  const openSupplierEdit = (s) => { setForm({ name:s.name, contact:s.contact, phone:s.phone }); setModal({ type:'supplier', editItem:s }); setErrors({}); };
  const saveSupplier = async () => {
    if (!form.name.trim()) { setErrors({ name:'Nome obbligatorio' }); return; }
    try {
      if (modal.editItem) {
        await updateSupplier(modal.editItem.id, { name:form.name.trim(), contact:form.contact.trim(), phone:form.phone.trim() });
        showToast('Fornitore aggiornato');
      } else {
        await createSupplier({ name:form.name.trim(), contact:form.contact.trim(), phone:form.phone.trim() });
        showToast('Fornitore aggiunto');
      }
      setModal({ type:null, editItem:null });
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };
  const handleDeleteSupplier = async () => {
    try {
      await apiDeleteSupplier(deleteModal.id);
      setDeleteModal(null); showToast('Fornitore rimosso', 'error');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  // ─── ConvGroup CRUD ───
  const openGroupCreate = () => { setForm({ name:'', icon:'📁', color: COLORS[convGroups.length % COLORS.length] }); setModal({ type:'group', editItem:null }); setErrors({}); };
  const openGroupEdit = (g) => { setForm({ name:g.name, icon:g.icon||'📁', color:g.color||COLORS[0] }); setModal({ type:'group', editItem:g }); setErrors({}); };
  const saveGroup = async () => {
    if (!form.name.trim()) { setErrors({ name:'Nome obbligatorio' }); return; }
    try {
      if (modal.editItem) {
        await updateConvGroup(modal.editItem.id, { name:form.name.trim(), icon:form.icon, color:form.color });
        showToast('Gruppo aggiornato');
      } else {
        await createConvGroup({ name:form.name.trim(), icon:form.icon, color:form.color });
        showToast('Gruppo aggiunto');
      }
      setModal({ type:null, editItem:null });
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };
  const handleDeleteGroup = async () => {
    try {
      await apiDeleteConvGroup(deleteModal.id);
      setDeleteModal(null); showToast('Gruppo rimosso', 'error');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const closeModal = () => setModal({ type:null, editItem:null });

  return (
    <main className="page">
      <div className="page-header">
        <div><h1 className="page-h1">Impostazioni</h1><div className="page-sub">Configurazione business</div></div>
      </div>

      {/* Obiettivi */}
      <div className="settings-section">
        <div className="settings-section-head"><div className="settings-section-title">Obiettivi</div><div className="settings-section-sub">Target da raggiungere ogni mese</div></div>
        <div className="settings-row"><span className="settings-row-label">Profit mensile</span><input type="text" value={goals.monthlyProfit} onChange={(e) => setGoals({...goals, monthlyProfit: e.target.value})} className="settings-input" /></div>
        <div className="settings-row"><span className="settings-row-label">Margine target</span><input type="text" value={goals.marginTarget} onChange={(e) => setGoals({...goals, marginTarget: e.target.value})} className="settings-input" /></div>
        <div className="settings-row"><span className="settings-row-label">MRR target</span><input type="text" value={goals.mrrTarget} onChange={(e) => setGoals({...goals, mrrTarget: e.target.value})} className="settings-input" /></div>
      </div>

      {/* Canali di acquisizione */}
      <div className="settings-section">
        <div className="settings-section-head"><div className="settings-section-title">Canali di acquisizione</div><div className="settings-section-sub">Da dove arrivano gli ordini</div></div>
        {channels.map((channel) => (
          <div key={channel.id} className="settings-row" style={{ cursor:'pointer' }} onClick={() => openChannelEdit(channel)}>
            <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
              <span className="chan-dot" style={{ background:channel.color, width:'8px', height:'8px', borderRadius:'50%', display:'inline-block' }}></span>
              <span style={{ fontSize:'13px' }}>{channel.name}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span className="badge badge-muted">attivo</span>
              <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteModal({ ...channel, _type:'channel' }); }} title="Rimuovi">✕</button>
            </div>
          </div>
        ))}
        <div className="settings-row" style={{ justifyContent:'center' }}><button className="btn-secondary" style={{ width:'100%', justifyContent:'center' }} onClick={openChannelCreate}>+ Aggiungi canale</button></div>
      </div>

      {/* Categorie spese */}
      <div className="settings-section">
        <div className="settings-section-head"><div className="settings-section-title">Categorie spese</div><div className="settings-section-sub">Per classificare le spese operative</div></div>
        {expenseCategories.map((cat) => (
          <div key={cat.id} className="settings-row" style={{ cursor:'pointer' }} onClick={() => openExpCatEdit(cat)}>
            <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
              <span style={{ fontSize:'13px' }}>{cat.icon}</span>
              <span style={{ fontSize:'13px' }}>{cat.label}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span className="badge badge-muted">attiva</span>
              <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteModal({ ...cat, _type:'expcat' }); }} title="Rimuovi">✕</button>
            </div>
          </div>
        ))}
        <div className="settings-row" style={{ justifyContent:'center' }}><button className="btn-secondary" style={{ width:'100%', justifyContent:'center' }} onClick={openExpCatCreate}>+ Aggiungi categoria spesa</button></div>
      </div>

      {/* Categorie prodotto */}
      <div className="settings-section">
        <div className="settings-section-head"><div className="settings-section-title">Tipi prodotto</div><div className="settings-section-sub">Categorie per il catalogo prodotti</div></div>
        {productTypes.map((pt) => (
          <div key={pt.id} className="settings-row" style={{ cursor:'pointer' }} onClick={() => openProdTypeEdit(pt)}>
            <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
              <span style={{ fontSize:'13px' }}>{pt.icon}</span>
              <span style={{ fontSize:'13px' }}>{pt.label}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span className="badge badge-muted">attivo</span>
              <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteModal({ ...pt, _type:'prodtype' }); }} title="Rimuovi">✕</button>
            </div>
          </div>
        ))}
        <div className="settings-row" style={{ justifyContent:'center' }}><button className="btn-secondary" style={{ width:'100%', justifyContent:'center' }} onClick={openProdTypeCreate}>+ Aggiungi tipo prodotto</button></div>
      </div>

      {/* Fornitori */}
      <div className="settings-section">
        <div className="settings-section-head"><div className="settings-section-title">Fornitori</div><div className="settings-section-sub">Lista fornitori per acquisti</div></div>
        {suppliers.map((sup) => (
          <div key={sup.id} className="settings-row" style={{ cursor:'pointer' }} onClick={() => openSupplierEdit(sup)}>
            <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
              <span style={{ fontSize:'13px' }}>🏭</span>
              <div><span style={{ fontSize:'13px', fontWeight:500 }}>{sup.name}</span>{sup.contact && <span style={{ fontSize:'11px', color:'var(--text3)', marginLeft:'8px' }}>{sup.contact}</span>}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              <span className="badge badge-muted">attivo</span>
              <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteModal({ ...sup, _type:'supplier' }); }} title="Rimuovi">✕</button>
            </div>
          </div>
        ))}
        <div className="settings-row" style={{ justifyContent:'center' }}><button className="btn-secondary" style={{ width:'100%', justifyContent:'center' }} onClick={openSupplierCreate}>+ Aggiungi fornitore</button></div>
      </div>

      {/* Gruppi Chat */}
      <div className="settings-section">
        <div className="settings-section-head"><div className="settings-section-title">Gruppi Chat</div><div className="settings-section-sub">Pipeline e cartelle per le conversazioni</div></div>
        <div className="settings-row" style={{ pointerEvents:'none', opacity:0.55 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
            <span style={{ fontSize:'16px' }}>📭</span>
            <span style={{ fontSize:'13px' }}>Non Contattato</span>
          </div>
          <span className="badge badge-muted">default</span>
        </div>
        {convGroups.map((g) => (
          <div key={g.id} className="settings-row" style={{ cursor:g.isDefault?'default':'pointer' }} onClick={() => !g.isDefault && openGroupEdit(g)}>
            <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
              <span style={{ fontSize:'16px' }}>{g.icon||'📁'}</span>
              <span style={{ fontSize:'13px', fontWeight:500 }}>{g.name}</span>
              {g.color && <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:g.color, display:'inline-block' }}></span>}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
              {g.isDefault
                ? <span className="badge badge-muted">default</span>
                : <><span className="badge badge-muted">attivo</span>
                   <button className="btn-icon-sm" onClick={(e) => { e.stopPropagation(); setDeleteModal({ ...g, _type:'group' }); }} title="Rimuovi">✕</button></>
              }
            </div>
          </div>
        ))}
        <div className="settings-row" style={{ justifyContent:'center' }}><button className="btn-secondary" style={{ width:'100%', justifyContent:'center' }} onClick={openGroupCreate}>+ Aggiungi gruppo</button></div>
      </div>

      {/* Team & ruoli */}
      <div className="settings-section">
        <div className="settings-section-head"><div className="settings-section-title">Team &amp; ruoli</div><div className="settings-section-sub">Chi può vedere cosa</div></div>
        {team.map((member) => (
          <div key={member.email} className="settings-row">
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div className="avatar" style={{ width:'32px', height:'32px', fontSize:'11px', background:`linear-gradient(135deg,${member.color})` }}>{member.initials}</div>
              <div><div style={{ fontSize:'13px', fontWeight:500 }}>{member.name}</div><div style={{ fontSize:'11px', color:'var(--text2)' }}>{member.email}</div></div>
            </div>
            <span className={`badge ${getRoleColor(member.role)}`}>{member.role}</span>
          </div>
        ))}
        <div className="settings-row" style={{ justifyContent:'center' }}><button className="btn-secondary" style={{ width:'100%', justifyContent:'center' }}>+ Invita membro</button></div>
      </div>

      {/* ─── MODAL: Canale ─── */}
      <Modal isOpen={modal.type === 'channel'} onClose={closeModal} title={modal.editItem ? 'Modifica canale' : 'Nuovo canale'}>
        <div className="form-group"><label className="form-label">Nome</label><input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name || ''} onChange={e => setForm({...form, name:e.target.value})} placeholder="es. TikTok" />{errors.name && <div className="form-error">{errors.name}</div>}</div>
        <div className="form-group"><label className="form-label">Colore</label>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>{COLORS.map(c => <button key={c} type="button" onClick={() => setForm({...form, color:c})} style={{ width:'28px', height:'28px', borderRadius:'50%', background:c, border:form.color === c ? '2px solid var(--text)' : '2px solid transparent', cursor:'pointer' }} />)}</div>
        </div>
        <div className="form-actions"><button className="btn-secondary" onClick={closeModal}>Annulla</button><button className="btn-primary" onClick={saveChannel}>{modal.editItem ? 'Salva' : 'Aggiungi'}</button></div>
      </Modal>

      {/* ─── MODAL: Categoria spesa ─── */}
      <Modal isOpen={modal.type === 'expcat'} onClose={closeModal} title={modal.editItem ? 'Modifica categoria spesa' : 'Nuova categoria spesa'}>
        <div className="form-group"><label className="form-label">Nome</label><input className={`form-input ${errors.label ? 'error' : ''}`} value={form.label || ''} onChange={e => setForm({...form, label:e.target.value})} placeholder="es. Affitto" />{errors.label && <div className="form-error">{errors.label}</div>}</div>
        <div className="form-group"><label className="form-label">Icona</label>
          <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>{ICONS.map(ic => <button key={ic} type="button" onClick={() => setForm({...form, icon:ic})} style={{ width:'32px', height:'32px', borderRadius:'6px', background:form.icon === ic ? 'var(--accent-dim)' : 'transparent', border:form.icon === ic ? '1px solid var(--accent)' : '1px solid var(--border)', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>{ic}</button>)}</div>
        </div>
        <div className="form-group"><label className="form-label">Colore</label>
          <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>{COLORS.map(c => <button key={c} type="button" onClick={() => setForm({...form, color:c})} style={{ width:'28px', height:'28px', borderRadius:'50%', background:c, border:(form.color||'') === c ? '2px solid var(--text)' : '2px solid transparent', cursor:'pointer' }} />)}</div>
        </div>
        <div className="form-actions"><button className="btn-secondary" onClick={closeModal}>Annulla</button><button className="btn-primary" onClick={saveExpCat}>{modal.editItem ? 'Salva' : 'Aggiungi'}</button></div>
      </Modal>

      {/* ─── MODAL: Tipo prodotto ─── */}
      <Modal isOpen={modal.type === 'prodtype'} onClose={closeModal} title={modal.editItem ? 'Modifica tipo prodotto' : 'Nuovo tipo prodotto'}>
        <div className="form-group"><label className="form-label">Nome</label><input className={`form-input ${errors.label ? 'error' : ''}`} value={form.label || ''} onChange={e => setForm({...form, label:e.target.value})} placeholder="es. Tablet" />{errors.label && <div className="form-error">{errors.label}</div>}</div>
        <div className="form-group"><label className="form-label">Icona</label>
          <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>{ICONS.map(ic => <button key={ic} type="button" onClick={() => setForm({...form, icon:ic})} style={{ width:'32px', height:'32px', borderRadius:'6px', background:form.icon === ic ? 'var(--accent-dim)' : 'transparent', border:form.icon === ic ? '1px solid var(--accent)' : '1px solid var(--border)', cursor:'pointer', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center' }}>{ic}</button>)}</div>
        </div>
        <div className="form-actions"><button className="btn-secondary" onClick={closeModal}>Annulla</button><button className="btn-primary" onClick={saveProdType}>{modal.editItem ? 'Salva' : 'Aggiungi'}</button></div>
      </Modal>

      {/* ─── MODAL: Fornitore ─── */}
      <Modal isOpen={modal.type === 'supplier'} onClose={closeModal} title={modal.editItem ? 'Modifica fornitore' : 'Nuovo fornitore'}>
        <div className="form-group"><label className="form-label">Nome</label><input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name || ''} onChange={e => setForm({...form, name:e.target.value})} placeholder="es. AutoTools SRL" />{errors.name && <div className="form-error">{errors.name}</div>}</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Email / Contatto</label><input className="form-input" value={form.contact || ''} onChange={e => setForm({...form, contact:e.target.value})} placeholder="es. info@fornitore.it" /></div>
          <div className="form-group"><label className="form-label">Telefono</label><input className="form-input" value={form.phone || ''} onChange={e => setForm({...form, phone:e.target.value})} placeholder="es. +39 02 1234567" /></div>
        </div>
        <div className="form-actions"><button className="btn-secondary" onClick={closeModal}>Annulla</button><button className="btn-primary" onClick={saveSupplier}>{modal.editItem ? 'Salva' : 'Aggiungi'}</button></div>
      </Modal>

      {/* ─── MODAL: Gruppo ─── */}
      <Modal isOpen={modal.type === 'group'} onClose={closeModal} title={modal.editItem ? 'Modifica gruppo' : 'Nuovo gruppo'}>
        <div className="form-group"><label className="form-label">Nome</label><input className={`form-input ${errors.name ? 'error' : ''}`} value={form.name||''} onChange={e => setForm({...form, name:e.target.value})} placeholder="es. VIP Clienti" />{errors.name && <div className="form-error">{errors.name}</div>}</div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Icona (emoji)</label><input className="form-input" value={form.icon||''} onChange={e => setForm({...form, icon:e.target.value})} placeholder="📁" style={{ fontSize:'20px', textAlign:'center' }} maxLength={4} /></div>
          <div className="form-group"><label className="form-label">Colore</label>
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>{COLORS.map(c => <button key={c} type="button" onClick={() => setForm({...form, color:c})} style={{ width:'28px', height:'28px', borderRadius:'50%', background:c, border:(form.color||'') === c ? '2px solid var(--text)' : '2px solid transparent', cursor:'pointer' }} />)}</div>
          </div>
        </div>
        <div className="form-actions"><button className="btn-secondary" onClick={closeModal}>Annulla</button><button className="btn-primary" onClick={saveGroup}>{modal.editItem ? 'Salva' : 'Aggiungi'}</button></div>
      </Modal>

      {/* ─── MODAL: Conferma eliminazione ─── */}
      <Modal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="Conferma rimozione">
        <p className="confirm-text">Rimuovere <span className="confirm-highlight">{deleteModal?.label || deleteModal?.name}</span>?</p>
        <div className="form-actions">
          <button className="btn-secondary" onClick={() => setDeleteModal(null)}>Annulla</button>
          <button className="btn-danger" onClick={() => {
            if (deleteModal._type === 'channel') handleDeleteChannel();
            else if (deleteModal._type === 'expcat') deleteExpCat();
            else if (deleteModal._type === 'prodtype') deleteProdType();
            else if (deleteModal._type === 'supplier') handleDeleteSupplier();
            else if (deleteModal._type === 'group') handleDeleteGroup();
          }}>Rimuovi</button>
        </div>
      </Modal>
    </main>
  );
}
