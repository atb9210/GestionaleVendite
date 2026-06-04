import { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import PhoneInput from '../components/PhoneInput';

const STATUSES = {
  new_lead:   { label:'Nuovo lead',  color:'#818cf8', dot:'#818cf8' },
  contacted:  { label:'Contattato',  color:'#f59e0b', dot:'#f59e0b' },
  link_sent:  { label:'Link inviato',color:'#06b6d4', dot:'#06b6d4' },
  converted:  { label:'Convertito',  color:'#22c55e', dot:'#22c55e' },
  lost:       { label:'Perso',       color:'#ef4444', dot:'#ef4444' },
};

const FOLLOWUP_OPTIONS = [
  { label:'Oggi',         getValue: () => { const d = new Date(); d.setHours(18,0,0,0); return d; } },
  { label:'Domani',       getValue: () => { const d = new Date(); d.setDate(d.getDate()+1); d.setHours(9,0,0,0); return d; } },
  { label:'3 Giorni',     getValue: () => { const d = new Date(); d.setDate(d.getDate()+3); d.setHours(9,0,0,0); return d; } },
  { label:'1 Settimana',  getValue: () => { const d = new Date(); d.setDate(d.getDate()+7); d.setHours(9,0,0,0); return d; } },
  { label:'1 Mese',       getValue: () => { const d = new Date(); d.setMonth(d.getMonth()+1); d.setHours(9,0,0,0); return d; } },
  { label:'Seleziona data', getValue: null },
  { label:'Nessun follow-up', getValue: () => null },
];

const SEQUENZE = ['—', 'Seq. Benvenuto', 'Seq. Recupero Lead', 'Seq. Post-Acquisto', 'Seq. Rinnovo'];
const ACT_ICON = { note:'📝', call:'📞', status_change:'🔄', message:'📌' };

function fmtActivityTime(tsRaw) {
  if (!tsRaw) return '';
  const d = new Date(tsRaw);
  const diffMs = Date.now() - d;
  const diffM = Math.floor(diffMs / 60000);
  if (diffM < 1) return 'adesso';
  if (diffM < 60) return `${diffM}m fa`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h fa`;
  const diffDays = Math.floor(diffH / 24);
  if (diffDays < 7) return `${diffDays}g fa`;
  const months = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function fmtFollowUp(date) {
  if (!date) return null;
  const d = new Date(date);
  const today = new Date(); today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
  const dDay = new Date(d); dDay.setHours(0,0,0,0);
  const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  const months = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  if (dDay.getTime() === today.getTime()) return `Oggi ${timeStr}`;
  if (dDay.getTime() === tomorrow.getTime()) return `Domani ${timeStr}`;
  return `${d.getDate()} ${months[d.getMonth()]} ${timeStr}`;
}

const UNCONTACTED_ID = '__uncontacted__';

export default function Communications() {
  const {
    conversations, convGroups, customers, msgTemplates, showToast,
    sendMessage: apiSendMessage, updateConversation,
    createConversation, createActivity, deleteActivity,
    whatsappStatus,
  } = useData();

  // ─── Navigazione 2 livelli ───
  const [viewLevel, setViewLevel]         = useState('groups');   // 'groups' | 'conversations'
  const [activeGroupId, setActiveGroupId] = useState(null);       // id gruppo selezionato o UNCONTACTED_ID
  const [showMoveMenu, setShowMoveMenu]         = useState(false);  // header
  const [showMovePanelMenu, setShowMovePanelMenu] = useState(false); // info panel

  // ─── Stato chat ───
  const [activeId, setActiveId]             = useState(null);
  const [filter, setFilter]                 = useState('all');
  const [search, setSearch]                 = useState('');
  const [msgInput, setMsgInput]             = useState('');
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact]         = useState({ name:'', phone:{ countryCode:'IT', number:'' } });
  const [editingName, setEditingName]       = useState(false);
  const [nameInput, setNameInput]           = useState('');
  const [showLinkCustomer, setShowLinkCustomer] = useState(false);
  const [showInfoPanel, setShowInfoPanel]   = useState(false);
  const [notes, setNotes]                   = useState('');
  const [notesSaving, setNotesSaving]       = useState(false);
  const [showCallModal, setShowCallModal]   = useState(false);
  const [callNote, setCallNote]             = useState('');
  const [callNoteSaving, setCallNoteSaving] = useState(false);

  // ─── Info panel ───
  const [editingEmail, setEditingEmail]     = useState(false);
  const [emailInput, setEmailInput]         = useState('');
  const [oppValue, setOppValue]             = useState('');
  const [oppEditing, setOppEditing]         = useState(false);
  const [followUps, setFollowUps]           = useState({});
  const [showFollowUpMenu, setShowFollowUpMenu] = useState(false);
  const [customDateTime, setCustomDateTime] = useState('');
  const [sequenza, setSequenza]             = useState({});
  const [newNoteText, setNewNoteText]       = useState('');
  const [addingNote, setAddingNote]         = useState(false);

  const nameInputRef    = useRef(null);
  const emailInputRef   = useRef(null);
  const callInitiatedRef = useRef(false);
  const messagesRef     = useRef(null);
  const prevActiveIdRef = useRef(null);
  const textareaRef     = useRef(null);
  const followUpMenuRef = useRef(null);
  const moveMenuRef      = useRef(null);
  const movePanelRef     = useRef(null);

  const active = conversations.find(c => c.id === activeId);

  // Unread mark
  useEffect(() => {
    if (!activeId) return;
    const conv = conversations.find(c => c.id === activeId);
    if (!conv?.unreadCount) return;
    updateConversation(activeId, { unreadCount: 0 });
  }, [activeId, active?.unreadCount]);

  // Reset panel quando cambia conv
  useEffect(() => {
    setNotes(active?.notes || '');
    setEmailInput(active?.email || '');
    setOppValue(active?.opportunityValue != null ? String(active.opportunityValue) : '');
    setEditingEmail(false);
    setOppEditing(false);
    setShowInfoPanel(false);
    setAddingNote(false);
    setNewNoteText('');
    setShowFollowUpMenu(false);
  }, [activeId]);

  // Nota post-chiamata
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && callInitiatedRef.current) {
        callInitiatedRef.current = false;
        setCallNote('');
        setShowCallModal(true);
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Scroll messaggi
  useEffect(() => {
    const isNew = prevActiveIdRef.current !== activeId;
    prevActiveIdRef.current = activeId;
    if (!messagesRef.current) return;
    const el = messagesRef.current;
    if (isNew) { el.scrollTop = el.scrollHeight; }
    else { el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }
  }, [activeId, active?.messages?.length]);

  // Chiudi followup menu fuori click
  useEffect(() => {
    if (!showFollowUpMenu) return;
    const h = (e) => { if (followUpMenuRef.current && !followUpMenuRef.current.contains(e.target)) setShowFollowUpMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showFollowUpMenu]);

  // Chiudi move menu header fuori click
  useEffect(() => {
    if (!showMoveMenu) return;
    const h = (e) => { if (moveMenuRef.current && !moveMenuRef.current.contains(e.target)) setShowMoveMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMoveMenu]);

  // Chiudi move menu panel fuori click
  useEffect(() => {
    if (!showMovePanelMenu) return;
    const h = (e) => { if (movePanelRef.current && !movePanelRef.current.contains(e.target)) setShowMovePanelMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showMovePanelMenu]);

  // ─── Calcoli gruppi ───
  const convsInGroup = (groupId) => {
    if (groupId === UNCONTACTED_ID) return conversations.filter(c => !c.groupId);
    return conversations.filter(c => c.groupId === groupId);
  };

  const unreadInGroup = (groupId) =>
    convsInGroup(groupId).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Gruppo corrente selezionato (oggetto o null per uncontacted)
  const activeGroup = activeGroupId === UNCONTACTED_ID
    ? { id: UNCONTACTED_ID, name: 'Non Contattato', icon: '📭', color: '#64748b' }
    : convGroups.find(g => g.id === activeGroupId);

  // ─── Conversazioni filtrate nel livello 2 ───
  const convsFiltered = (() => {
    let list = convsInGroup(activeGroupId);
    if (filter !== 'all') list = list.filter(c => c.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.contactName.toLowerCase().includes(q) || c.phone.includes(q));
    }
    return list;
  })();

  const counts = {};
  Object.keys(STATUSES).forEach(k => { counts[k] = convsFiltered.filter(c => c.status === k).length; });

  // ─── Handlers ───
  const openGroup = (groupId) => {
    setActiveGroupId(groupId);
    setViewLevel('conversations');
    setActiveId(null);
    setFilter('all');
    setSearch('');
  };

  const backToGroups = () => {
    setViewLevel('groups');
    setActiveId(null);
  };

  const moveConversation = async (convId, newGroupId) => {
    try {
      await updateConversation(convId, { groupId: newGroupId === UNCONTACTED_ID ? null : newGroupId });
      setShowMoveMenu(false);
      setShowMovePanelMenu(false);
      showToast('Spostato');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const handleTextareaInput = (e) => {
    setMsgInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };
  const resetTextarea = () => { setMsgInput(''); if (textareaRef.current) textareaRef.current.style.height = 'auto'; };

  const handleSendMessage = async () => {
    if (!msgInput.trim() || !activeId) return;
    try { await apiSendMessage(activeId, { direction: 'OUT', text: msgInput.trim(), auto: false }); resetTextarea(); }
    catch (e) { showToast(e.message || 'Errore invio', 'error'); }
  };

  const sendTemplate = async (tpl) => {
    if (!activeId) return;
    const text = tpl.text.replace('{{nome}}', active?.contactName?.split(' ')[0] || '').replace('{{link}}', 'https://autodiag.it/prev/...');
    try { await apiSendMessage(activeId, { direction: 'OUT', text, auto: true }); showToast('Template inviato'); }
    catch (e) { showToast(e.message || 'Errore invio', 'error'); }
  };

  const startEditName = () => { setNameInput(active?.contactName || ''); setEditingName(true); setTimeout(() => nameInputRef.current?.select(), 0); };
  const saveEditName = async () => {
    const t = nameInput.trim();
    if (t && t !== active?.contactName) {
      try { await updateConversation(activeId, { contactName: t }); } catch (e) { showToast(e.message || 'Errore', 'error'); }
    }
    setEditingName(false);
  };

  const startEditEmail = () => { setEmailInput(active?.email || ''); setEditingEmail(true); setTimeout(() => emailInputRef.current?.select(), 0); };
  const saveEmail = async () => {
    const val = emailInput.trim();
    if (val !== (active?.email || '')) {
      try { await updateConversation(activeId, { email: val || null }); } catch (e) { showToast(e.message || 'Errore', 'error'); }
    }
    setEditingEmail(false);
  };

  const saveOppValue = async () => {
    const val = oppValue.trim() === '' ? null : parseFloat(oppValue.replace(',', '.'));
    if (isNaN(val) && oppValue.trim() !== '') { showToast('Valore non valido', 'error'); return; }
    try { await updateConversation(activeId, { opportunityValue: val }); setOppEditing(false); }
    catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const applyFollowUp = (opt) => {
    if (opt.getValue === null) return;
    setFollowUps(p => ({ ...p, [activeId]: opt.getValue() }));
    setShowFollowUpMenu(false);
  };

  const applyCustomFollowUp = () => {
    if (!customDateTime) return;
    setFollowUps(p => ({ ...p, [activeId]: new Date(customDateTime) }));
    setCustomDateTime('');
    setShowFollowUpMenu(false);
  };

  const handleCall = () => {
    if (!active?.phone) return;
    callInitiatedRef.current = true;
    window.location.href = `tel:${active.phone}`;
  };

  const saveCallNote = async () => {
    setCallNoteSaving(true);
    try {
      await createActivity(activeId, { type: 'CALL', text: callNote.trim() || 'Chiamata effettuata' });
      showToast('Nota salvata'); setShowCallModal(false); setCallNote('');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
    finally { setCallNoteSaving(false); }
  };

  const saveNotes = async () => {
    setNotesSaving(true);
    try { await updateConversation(activeId, { notes }); showToast('Note salvate'); }
    catch (e) { showToast(e.message || 'Errore', 'error'); }
    finally { setNotesSaving(false); }
  };

  const saveNewNote = async () => {
    if (!newNoteText.trim()) return;
    try { await createActivity(activeId, { type: 'NOTE', text: newNoteText.trim() }); setNewNoteText(''); setAddingNote(false); showToast('Nota aggiunta'); }
    catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const pinMessage = async (msg) => {
    try { await createActivity(activeId, { type: 'MESSAGE', text: msg.text }); showToast('Messaggio salvato in timeline'); }
    catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const normalizePhone = (p) => {
    if (!p) return '';
    if (typeof p === 'object' && p.number) {
      const pf = { IT:'39', DE:'49', FR:'33', ES:'34', GB:'44', US:'1', CH:'41', AT:'43', BE:'32', NL:'31', PT:'351', RO:'40', AL:'355' };
      return (pf[p.countryCode] || '') + String(p.number).replace(/\D/g, '');
    }
    return String(p).replace(/\D/g, '');
  };
  const phoneMatch = (a, b) => {
    const na = normalizePhone(a), nb = normalizePhone(b);
    return na && nb && na.length >= 8 && nb.length >= 8 && na === nb;
  };

  const linkCustomer = async (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    const patch = { customerId: customerId || null, ...(customer && { contactName: customer.name }) };
    try { await updateConversation(activeId, patch); setShowLinkCustomer(false); showToast(customerId ? `Collegato a ${customer.name}` : 'Cliente scollegato'); }
    catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const changeStatus = async (newStatus) => {
    try { await updateConversation(activeId, { status: newStatus.toUpperCase() }); showToast(`Stato: ${STATUSES[newStatus].label}`); }
    catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const createContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.number.trim()) return;
    const { countryCode, number } = newContact.phone;
    const CC = { IT:'+39', DE:'+49', FR:'+33', ES:'+34', GB:'+44', US:'+1', CH:'+41', AT:'+43', BE:'+32', NL:'+31', PT:'+351', RO:'+40', AL:'+355' };
    const phone = (CC[countryCode] || '+39') + number.replace(/\s/g, '');
    const match = customers.find(c => phoneMatch(c.phone, phone));
    const contactName = match ? match.name : newContact.name.trim();
    try {
      await createConversation({ contactName, phone, status: 'NEW_LEAD', ...(match && { customerId: match.id }) });
      setShowNewContact(false);
      setNewContact({ name:'', phone:{ countryCode:'IT', number:'' } });
      showToast(match ? `Creato e collegato a ${match.name}` : 'Contatto creato');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  const getDayLabel = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const today = new Date(); const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
    if (d.toDateString() === today.toDateString()) return 'Oggi';
    if (d.toDateString() === yesterday.toDateString()) return 'Ieri';
    const m = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
    return `${d.getDate()} ${m[d.getMonth()]}`;
  };

  const lastMsg = (conv) => {
    const m = conv.messages[conv.messages.length - 1];
    if (!m) return 'Nessun messaggio';
    return (m.dir === 'out' ? 'Tu: ' : '') + (m.text.length > 35 ? m.text.slice(0,35)+'…' : m.text);
  };

  const lastTime = (conv) => conv.messages[conv.messages.length-1]?.ts?.split(' ').pop() || '';

  const followUp = followUps[activeId] || null;
  const seqValue = sequenza[activeId] || '—';

  // Tutti i gruppi in ordine + uncontacted virtuale
  const allGroupEntries = [
    { id: UNCONTACTED_ID, name: 'Non Contattato', icon: '📭', color: '#64748b', isDefault: true },
    ...convGroups,
  ];

  return (
    <main className="page comm-page">
      <div className={`comm-layout${activeId ? ' chat-open' : ''}`}>
        {/* ─── SIDEBAR ─── */}
        <div className="comm-sidebar">

          {/* ── Livello 1: lista gruppi ── */}
          {viewLevel === 'groups' && (
            <>
              <div className="comm-sidebar-header">
                <h2 className="comm-sidebar-title">💬 Chat</h2>
                <div className={`comm-wa-status comm-wa-status--${whatsappStatus}`}>
                  <span className="comm-wa-dot" />
                  <span className="comm-wa-label">{{ connected:'Online', disconnected:'Offline', need_scan:'Scansiona QR' }[whatsappStatus] || ''}</span>
                </div>
                <button className="btn-primary btn-sm" onClick={() => setShowNewContact(true)}>+</button>
              </div>
              <div className="comm-group-list">
                {allGroupEntries.map(g => {
                  const convs = convsInGroup(g.id);
                  const unread = unreadInGroup(g.id);
                  return (
                    <div key={g.id} className="comm-group-item" onClick={() => openGroup(g.id)}>
                      <div className="comm-group-icon" style={{ background: g.color ? g.color + '22' : 'var(--surface2)', color: g.color || 'var(--text2)' }}>
                        {g.icon || '📁'}
                      </div>
                      <div className="comm-group-info">
                        <div className="comm-group-name">{g.name}</div>
                        <div className="comm-group-count">{convs.length} {convs.length === 1 ? 'lead' : 'lead'}</div>
                      </div>
                      {unread > 0 && <span className="comm-unread-badge">{unread}</span>}
                      <span className="comm-group-arrow">›</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Livello 2: conversazioni nel gruppo ── */}
          {viewLevel === 'conversations' && (
            <>
              <div className="comm-sidebar-header comm-sidebar-header--sub">
                <button className="comm-back-groups-btn" onClick={backToGroups}>
                  <span>‹</span> Gruppi
                </button>
                <div className="comm-group-header-name">
                  <span>{activeGroup?.icon}</span>
                  <span>{activeGroup?.name}</span>
                </div>
                <button className="btn-primary btn-sm" onClick={() => setShowNewContact(true)}>+</button>
              </div>

              {/* Filtri status */}
              <div className="comm-filters">
                <button onClick={() => setFilter('all')} className={`comm-chip ${filter === 'all' ? 'active' : ''}`}>Tutti</button>
                {Object.entries(STATUSES).map(([k, v]) => (
                  <button key={k} onClick={() => setFilter(k)} className={`comm-chip ${filter === k ? 'active' : ''}`} style={{ '--chip-color': v.color }}>
                    {v.label} {counts[k] > 0 && <span className="comm-chip-count">{counts[k]}</span>}
                  </button>
                ))}
              </div>

              <input type="text" className="comm-search" placeholder="Cerca…" value={search} onChange={e => setSearch(e.target.value)} />

              <div className="comm-contact-list">
                {convsFiltered.map(conv => {
                  const st = STATUSES[conv.status];
                  const isActive = conv.id === activeId;
                  return (
                    <div key={conv.id} className={`comm-contact ${isActive ? 'active' : ''}`} onClick={() => setActiveId(conv.id)}>
                      <div className="comm-contact-avatar">
                        <span className="comm-status-dot" style={{ background: st?.dot }}></span>
                        {conv.contactName.split(' ').map(n => n[0]).join('')}
                        {conv.customer && <span className="comm-avatar-customer-badge">👤</span>}
                      </div>
                      <div className="comm-contact-info">
                        <div className="comm-contact-name">{conv.contactName}</div>
                        <div className="comm-contact-preview">{lastMsg(conv)}</div>
                      </div>
                      <div className="comm-contact-meta">
                        <div className="comm-contact-time">{lastTime(conv)}</div>
                        {conv.unreadCount > 0 && !isActive && <span className="comm-unread-badge">{conv.unreadCount}</span>}
                      </div>
                    </div>
                  );
                })}
                {convsFiltered.length === 0 && <div className="comm-empty-contacts">Nessun contatto</div>}
              </div>
            </>
          )}
        </div>

        {/* ─── CHAT ─── */}
        <div className="comm-chat">
          {active ? (
            <>
              <div className="comm-chat-header">
                <div className="comm-chat-header-left">
                  <button className="comm-back-btn" onClick={() => setActiveId(null)}>
                    <span className="comm-back-arrow">←</span>
                    <span className="comm-back-label">{activeGroup?.name || 'Chat'}</span>
                  </button>
                  <div className="comm-chat-header-info">
                    <div className="comm-chat-name">
                      {editingName ? (
                        <input ref={nameInputRef} className="comm-name-input" value={nameInput} onChange={e => setNameInput(e.target.value)}
                          onBlur={saveEditName}
                          onKeyDown={e => { if (e.key==='Enter'){e.preventDefault();saveEditName();} if(e.key==='Escape')setEditingName(false); }} />
                      ) : (
                        <>{active.contactName}<button className="comm-name-edit-btn" onClick={startEditName} aria-label="Rinomina">✏️</button></>
                      )}
                    </div>
                    <div className="comm-chat-phone">📱 {active.phone}</div>
                    <div className="comm-customer-link">
                      {active.customer ? (
                        <><span className="comm-customer-chip">👤 {active.customer.name}</span><button className="comm-customer-unlink" onClick={() => linkCustomer(null)}>×</button></>
                      ) : showLinkCustomer ? (
                        <select className="comm-customer-select" autoFocus onChange={e => linkCustomer(e.target.value||null)} onBlur={() => setShowLinkCustomer(false)} defaultValue="">
                          <option value="">— Seleziona cliente —</option>
                          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <button className="comm-customer-add-btn" onClick={() => setShowLinkCustomer(true)}>+ collega cliente</button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="comm-chat-header-actions">
                  <button className="comm-call-btn" onClick={handleCall} title="Chiama">📞</button>
                  <div className="comm-move-wrap" ref={moveMenuRef}>
                    <button className="comm-info-btn" onClick={() => setShowMoveMenu(p => !p)} title="Sposta gruppo" aria-label="Sposta in gruppo">→</button>
                    {showMoveMenu && (
                      <div className="comm-move-menu comm-move-menu--header" onClick={e => e.stopPropagation()}>
                        <div className="comm-move-menu-label">Sposta in</div>
                        {allGroupEntries.filter(g => g.id !== activeGroupId).map(g => (
                          <button key={g.id} className="comm-move-option" onClick={() => moveConversation(activeId, g.id)}>
                            <span>{g.icon}</span> {g.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className={`comm-info-btn${showInfoPanel?' active':''}`} onClick={() => setShowInfoPanel(p=>!p)} aria-label="Informazioni">ⓘ</button>
                  <select className="comm-status-select" value={active.status} onChange={e => changeStatus(e.target.value)} style={{ borderColor: STATUSES[active.status]?.color }}>
                    {Object.entries(STATUSES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="comm-messages" ref={messagesRef}>
                {active.messages.map((msg, i) => {
                  const dayLabel = getDayLabel(msg.createdAt);
                  const prevDayLabel = i > 0 ? getDayLabel(active.messages[i-1].createdAt) : null;
                  return (
                    <div key={msg.id} className="comm-msg-wrapper">
                      {dayLabel !== prevDayLabel && <div className="comm-day-sep"><span>{dayLabel}</span></div>}
                      <div className={`comm-bubble ${msg.dir==='out'?'out':'in'}`}>
                        <div className="comm-bubble-text">{msg.text}</div>
                        <div className="comm-bubble-meta">
                          {msg.ts}
                          {msg.auto && <span className="comm-auto-badge">🤖 auto</span>}
                          <button className="comm-pin-btn" onClick={() => pinMessage(msg)} aria-label="Salva in timeline">📌</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ─── INFO PANEL ─── */}
              <div className={`comm-info-panel${showInfoPanel?' open':''}`}>
                <div className="comm-info-panel-header">
                  <span className="comm-info-panel-title">Informazioni</span>
                  <button className="comm-info-close" onClick={() => setShowInfoPanel(false)}>✕</button>
                </div>
                <div className="comm-info-panel-body">

                  {/* Azioni rapide — sempre visibili anche quando il panel copre l'header */}
                  <div className="comm-info-actions-bar">
                    <button className="comm-info-btn" onClick={handleCall} title="Chiama" aria-label="Chiama">📞</button>
                    <div className="comm-move-wrap" ref={movePanelRef}>
                      <button className="comm-info-btn" onClick={() => setShowMovePanelMenu(p => !p)} title="Sposta gruppo" aria-label="Sposta in gruppo">→</button>
                      {showMovePanelMenu && (
                        <div className="comm-move-menu comm-move-menu--header" onClick={e => e.stopPropagation()}>
                          <div className="comm-move-menu-label">Sposta in</div>
                          {allGroupEntries.filter(g => g.id !== activeGroupId).map(g => (
                            <button key={g.id} className="comm-move-option" onClick={() => moveConversation(activeId, g.id)}>
                              <span>{g.icon}</span> {g.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="comm-info-section">
                    <div className="comm-info-section-label">Contatto</div>
                    <div className="comm-info-field">
                      <span className="comm-info-field-icon">👤</span>
                      <span className="comm-info-field-value">{active.contactName}</span>
                      <button className="comm-info-edit-btn" onClick={startEditName} aria-label="Modifica nome">✏️</button>
                    </div>
                    <div className="comm-info-field">
                      <span className="comm-info-field-icon">📱</span>
                      <span className="comm-info-field-value">{active.phone}</span>
                    </div>
                    <div className="comm-info-field">
                      <span className="comm-info-field-icon">✉️</span>
                      {editingEmail ? (
                        <input ref={emailInputRef} className="comm-info-inline-input" type="email" value={emailInput}
                          onChange={e => setEmailInput(e.target.value)} onBlur={saveEmail}
                          onKeyDown={e => { if(e.key==='Enter')saveEmail(); if(e.key==='Escape')setEditingEmail(false); }}
                          placeholder="email@esempio.it" aria-label="Email" />
                      ) : (
                        <>
                          <span className="comm-info-field-value">{active.email || <span className="comm-info-placeholder">Aggiungi email</span>}</span>
                          <button className="comm-info-edit-btn" onClick={startEditEmail} aria-label="Modifica email">✏️</button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="comm-info-section">
                    <div className="comm-info-section-label">Opportunità</div>
                    <div className="comm-info-field">
                      <span className="comm-info-field-icon">💶</span>
                      {oppEditing ? (
                        <input className="comm-info-inline-input" type="number" min="0" value={oppValue}
                          onChange={e => setOppValue(e.target.value)} onBlur={saveOppValue}
                          onKeyDown={e => { if(e.key==='Enter')saveOppValue(); if(e.key==='Escape')setOppEditing(false); }}
                          placeholder="0" aria-label="Valore opportunità" />
                      ) : (
                        <>
                          <span className="comm-info-field-value">
                            {active.opportunityValue!=null ? `€ ${Number(active.opportunityValue).toLocaleString('it-IT')}` : <span className="comm-info-placeholder">Valore opportunità</span>}
                          </span>
                          <button className="comm-info-edit-btn" onClick={() => { setOppValue(active.opportunityValue!=null?String(active.opportunityValue):''); setOppEditing(true); }} aria-label="Modifica valore">✏️</button>
                        </>
                      )}
                    </div>
                    <div className="comm-info-field comm-info-followup-wrap" ref={followUpMenuRef}>
                      <span className="comm-info-field-icon">⏰</span>
                      <button className="comm-info-followup-btn" onClick={() => setShowFollowUpMenu(p=>!p)} aria-haspopup="true" aria-expanded={showFollowUpMenu}>
                        {followUp ? fmtFollowUp(followUp) : <span className="comm-info-placeholder">Follow-up</span>}
                      </button>
                      {followUp && <button className="comm-info-edit-btn" onClick={() => setFollowUps(p=>({...p,[activeId]:null}))} aria-label="Rimuovi">×</button>}
                      {showFollowUpMenu && (
                        <div className="comm-followup-menu" role="menu">
                          {FOLLOWUP_OPTIONS.map(opt => (
                            opt.getValue !== null ? (
                              <button key={opt.label} className="comm-followup-option" role="menuitem" onClick={() => applyFollowUp(opt)}>{opt.label}</button>
                            ) : (
                              <div key="custom" className="comm-followup-custom">
                                <input type="datetime-local" className="comm-followup-dt-input" value={customDateTime} onChange={e => setCustomDateTime(e.target.value)} aria-label="Data e ora" />
                                <button className="comm-followup-option comm-followup-confirm" onClick={applyCustomFollowUp}>Conferma</button>
                              </div>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="comm-info-field">
                      <span className="comm-info-field-icon">🔁</span>
                      <select className="comm-info-seq-select" value={seqValue} onChange={e => setSequenza(p=>({...p,[activeId]:e.target.value}))} aria-label="Sequenza">
                        {SEQUENZE.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="comm-info-section">
                    <div className="comm-info-section-label">CRM</div>
                    <div className="comm-info-section-value">
                      {active.customer
                        ? <span className="comm-info-badge comm-info-badge--customer">👤 Cliente{active.customer.name?` — ${active.customer.name}`:''}</span>
                        : <span className="comm-info-badge comm-info-badge--lead">🆕 Lead</span>}
                    </div>
                    {!active.customer && (
                      <button className="comm-customer-add-btn comm-info-link-btn" onClick={() => { setShowInfoPanel(false); setShowLinkCustomer(true); }}>+ collega cliente</button>
                    )}
                  </div>

                  <div className="comm-info-section">
                    <div className="comm-info-section-label">Note</div>
                    <textarea className="comm-info-notes-ta" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Note sul contatto…" rows={4} aria-label="Note" />
                    <button className="btn-primary btn-sm comm-info-notes-save" onClick={saveNotes} disabled={notesSaving}>{notesSaving?'Salvataggio…':'Salva note'}</button>
                  </div>

                  <div className="comm-info-section">
                    <div className="comm-info-section-label-row">
                      <span className="comm-info-section-label">Timeline</span>
                      <button className="comm-timeline-add-btn" onClick={() => setAddingNote(p=>!p)} aria-label="Aggiungi nota">+</button>
                    </div>
                    {addingNote && (
                      <div className="comm-timeline-new-note">
                        <textarea className="comm-info-notes-ta" rows={2} value={newNoteText} onChange={e => setNewNoteText(e.target.value)}
                          placeholder="Aggiungi nota…" autoFocus aria-label="Nuova nota"
                          onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();saveNewNote();} if(e.key==='Escape')setAddingNote(false); }} />
                        <div className="comm-timeline-note-actions">
                          <button className="btn-secondary btn-sm" onClick={() => setAddingNote(false)}>Annulla</button>
                          <button className="btn-primary btn-sm" onClick={saveNewNote} disabled={!newNoteText.trim()}>Salva</button>
                        </div>
                      </div>
                    )}
                    <div className="comm-timeline-feed">
                      {(active.activities||[]).length === 0 && !addingNote && <div className="comm-timeline-empty">Nessuna attività</div>}
                      {(active.activities||[]).map(act => (
                        <div key={act.id} className="comm-timeline-item">
                          <span className="comm-timeline-icon">{ACT_ICON[act.type]||'•'}</span>
                          <div className="comm-timeline-content">
                            <span className="comm-timeline-text">{act.text}</span>
                            <span className="comm-timeline-time">{fmtActivityTime(act.tsRaw)}</span>
                          </div>
                          <button className="comm-timeline-del" onClick={() => deleteActivity(activeId, act.id)} aria-label="Elimina">×</button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              <div className="comm-input-area">
                <div className="comm-template-row">
                  {msgTemplates.map(tpl => <button key={tpl.id} className="comm-tpl-btn" onClick={() => sendTemplate(tpl)} title={tpl.text}>⚡ {tpl.label}</button>)}
                </div>
                <div className="comm-input-row">
                  <textarea ref={textareaRef} className="comm-msg-input" placeholder="Scrivi messaggio…" value={msgInput} rows={1}
                    onChange={handleTextareaInput}
                    onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleSendMessage();} }} />
                  <button className="comm-send-btn" onClick={handleSendMessage} disabled={!msgInput.trim()}>▶</button>
                </div>
              </div>
            </>
          ) : (
            <div className="comm-empty-chat">
              <div className="comm-empty-icon">{viewLevel === 'groups' ? '📁' : '💬'}</div>
              <div className="comm-empty-title">{viewLevel === 'groups' ? 'Seleziona un gruppo' : 'Seleziona un contatto'}</div>
              <div className="comm-empty-sub">{viewLevel === 'groups' ? 'Scegli un gruppo dalla lista a sinistra' : 'Scegli una conversazione o creane una nuova'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nota post-chiamata */}
      {showCallModal && (
        <div className="modal-backdrop" onClick={() => setShowCallModal(false)}>
          <div className="modal-content comm-call-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">📞 Nota post-chiamata</span>
              <button className="modal-close" onClick={() => setShowCallModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="comm-call-modal-sub">Come è andata la chiamata con <strong>{active?.contactName}</strong>?</p>
              <div className="form-group">
                <textarea className="form-input comm-call-note-ta" value={callNote} onChange={e => setCallNote(e.target.value)} placeholder="es. Interessato, richiamarlo tra 3 giorni…" rows={4} autoFocus />
              </div>
              <div className="form-actions">
                <button className="btn-secondary" onClick={() => setShowCallModal(false)}>Salta</button>
                <button className="btn-primary" onClick={saveCallNote} disabled={callNoteSaving}>{callNoteSaving?'Salvataggio…':'Salva nota'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuovo contatto */}
      {showNewContact && (
        <div className="modal-backdrop" onClick={() => setShowNewContact(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:'380px' }}>
            <div className="modal-header"><span className="modal-title">Nuovo contatto</span><button className="modal-close" onClick={() => setShowNewContact(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nome</label><input className="form-input" value={newContact.name} onChange={e => setNewContact({...newContact,name:e.target.value})} placeholder="es. Mario Rossi" /></div>
              <div className="form-group"><label className="form-label">Telefono WhatsApp</label><PhoneInput value={newContact.phone} onChange={phone => setNewContact({...newContact,phone})} /></div>
              <div className="form-actions"><button className="btn-secondary" onClick={() => setShowNewContact(false)}>Annulla</button><button className="btn-primary" onClick={createContact}>Crea contatto</button></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
