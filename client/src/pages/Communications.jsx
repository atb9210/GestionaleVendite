// Pagina Comunicazioni — Chat-style split panel (WhatsApp-like)
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

export default function Communications() {
  const { conversations, customers, msgTemplates, showToast, sendMessage: apiSendMessage, updateConversation, createConversation, whatsappStatus } = useData();
  const [activeId, setActiveId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [msgInput, setMsgInput] = useState('');
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({ name:'', phone:{ countryCode:'IT', number:'' } });
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showLinkCustomer, setShowLinkCustomer] = useState(false);
  const nameInputRef = useRef(null);
  const messagesRef = useRef(null);
  const prevActiveIdRef = useRef(null);
  const textareaRef = useRef(null);

  const active = conversations.find(c => c.id === activeId);

  // Segna come letto quando si apre una conversazione (anche se arriva mentre è già aperta)
  useEffect(() => {
    if (!activeId) return;
    const conv = conversations.find(c => c.id === activeId);
    if (!conv?.unreadCount) return;
    updateConversation(activeId, { unreadCount: 0 });
  }, [activeId, active?.unreadCount]);

  // Scroll istantaneo quando si apre una conversazione, smooth per nuovi messaggi
  useEffect(() => {
    const isNewConv = prevActiveIdRef.current !== activeId;
    prevActiveIdRef.current = activeId;
    if (!messagesRef.current) return;
    const el = messagesRef.current;
    if (isNewConv) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [activeId, active?.messages?.length]);

  // Filtered contacts
  const filtered = conversations.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.contactName.toLowerCase().includes(q) || c.phone.includes(q);
    }
    return true;
  });

  // Status counts
  const counts = {};
  Object.keys(STATUSES).forEach(k => { counts[k] = conversations.filter(c => c.status === k).length; });

  // Auto-resize textarea
  const handleTextareaInput = (e) => {
    setMsgInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };
  const resetTextarea = () => {
    setMsgInput('');
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!msgInput.trim() || !activeId) return;
    try {
      await apiSendMessage(activeId, { direction: 'OUT', text: msgInput.trim(), auto: false });
      resetTextarea();
    } catch (e) { showToast(e.message || 'Errore invio', 'error'); }
  };

  // Send template
  const sendTemplate = async (tpl) => {
    if (!activeId) return;
    const text = tpl.text.replace('{{nome}}', active?.contactName?.split(' ')[0] || '').replace('{{link}}', 'https://autodiag.it/prev/...');
    try {
      await apiSendMessage(activeId, { direction: 'OUT', text, auto: true });
      showToast('Template inviato');
    } catch (e) { showToast(e.message || 'Errore invio', 'error'); }
  };

  // Rename contatto inline
  const startEditName = () => {
    setNameInput(active?.contactName || '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
  };
  const saveEditName = async () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== active?.contactName) {
      try {
        await updateConversation(activeId, { contactName: trimmed });
      } catch (e) { showToast(e.message || 'Errore rinomina', 'error'); }
    }
    setEditingName(false);
  };
  const cancelEditName = () => setEditingName(false);

  // Normalizza numero telefono per confronto (strips non-digits)
  const normalizePhone = (p) => {
    if (!p) return '';
    if (typeof p === 'object' && p.number) {
      const prefixes = { IT:'39', DE:'49', FR:'33', ES:'34', GB:'44', US:'1', CH:'41', AT:'43', BE:'32', NL:'31', PT:'351', RO:'40', AL:'355' };
      return (prefixes[p.countryCode] || '') + String(p.number).replace(/\D/g, '');
    }
    return String(p).replace(/\D/g, '');
  };
  const phoneMatch = (a, b) => {
    const na = normalizePhone(a), nb = normalizePhone(b);
    if (!na || !nb || na.length < 8 || nb.length < 8) return false;
    return na === nb;
  };

  // Collega / scollega cliente — auto-rename con nome cliente
  const linkCustomer = async (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    const patch = { customerId: customerId || null, ...(customer && { contactName: customer.name }) };
    try {
      await updateConversation(activeId, patch);
      setShowLinkCustomer(false);
      showToast(customerId ? `Collegato a ${customer.name}` : 'Cliente scollegato');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  // Change status
  const changeStatus = async (newStatus) => {
    try {
      await updateConversation(activeId, { status: newStatus.toUpperCase() });
      showToast(`Stato aggiornato: ${STATUSES[newStatus].label}`);
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  // Create new contact — auto-link se il numero corrisponde a un cliente
  const createContact = async () => {
    if (!newContact.name.trim() || !newContact.phone.number.trim()) return;
    const { countryCode, number } = newContact.phone;
    const COUNTRIES = { IT:'+39', DE:'+49', FR:'+33', ES:'+34', GB:'+44', US:'+1', CH:'+41', AT:'+43', BE:'+32', NL:'+31', PT:'+351', RO:'+40', AL:'+355' };
    const prefix = COUNTRIES[countryCode] || '+39';
    const phone = prefix + number.replace(/\s/g, '');
    const customerMatch = customers.find(c => phoneMatch(c.phone, phone));
    const contactName = customerMatch ? customerMatch.name : newContact.name.trim();
    try {
      await createConversation({
        contactName,
        phone,
        status: 'NEW_LEAD',
        ...(customerMatch && { customerId: customerMatch.id }),
      });
      setShowNewContact(false);
      setNewContact({ name:'', phone:{ countryCode:'IT', number:'' } });
      showToast(customerMatch ? `Contatto creato e collegato a ${customerMatch.name}` : 'Contatto creato');
    } catch (e) { showToast(e.message || 'Errore', 'error'); }
  };

  // Separatore data messaggi
  const getDayLabel = (isoDate) => {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Oggi';
    if (d.toDateString() === yesterday.toDateString()) return 'Ieri';
    const months = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  // Last message preview
  const lastMsg = (conv) => {
    const m = conv.messages[conv.messages.length - 1];
    if (!m) return 'Nessun messaggio';
    const prefix = m.dir === 'out' ? 'Tu: ' : '';
    const text = m.text.length > 35 ? m.text.slice(0, 35) + '…' : m.text;
    return prefix + text;
  };

  const lastTime = (conv) => {
    const m = conv.messages[conv.messages.length - 1];
    return m?.ts?.split(' ').pop() || '';
  };

  return (
    <main className="page comm-page">
      <div className={`comm-layout${activeId ? ' chat-open' : ''}`}>
        {/* ─── SIDEBAR CONTATTI ─── */}
        <div className="comm-sidebar">
          <div className="comm-sidebar-header">
            <h2 className="comm-sidebar-title">💬 Chat</h2>
            <div className={`comm-wa-status comm-wa-status--${whatsappStatus}`}>
              <span className="comm-wa-dot" />
              <span className="comm-wa-label">
                {{ connected: 'Online', disconnected: 'Offline', need_scan: 'Scansiona QR' }[whatsappStatus] || ''}
              </span>
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

          {/* Search */}
          <input type="text" className="comm-search" placeholder="Cerca contatto…" value={search} onChange={e => setSearch(e.target.value)} />

          {/* Contact list */}
          <div className="comm-contact-list">
            {filtered.map(conv => {
              const st = STATUSES[conv.status];
              const isActive = conv.id === activeId;
              const unread = conv.unreadCount > 0;
              return (
                <div key={conv.id} className={`comm-contact ${isActive ? 'active' : ''}`} onClick={() => setActiveId(conv.id)}>
                  <div className="comm-contact-avatar">
                    <span className="comm-status-dot" style={{ background: st.dot }}></span>
                    {conv.contactName.split(' ').map(n => n[0]).join('')}
                    {conv.customer && <span className="comm-avatar-customer-badge">👤</span>}
                  </div>
                  <div className="comm-contact-info">
                    <div className="comm-contact-name">{conv.contactName}</div>
                    <div className="comm-contact-preview">{lastMsg(conv)}</div>
                  </div>
                  <div className="comm-contact-meta">
                    <div className="comm-contact-time">{lastTime(conv)}</div>
                    {unread && !isActive && <span className="comm-unread-badge">{conv.unreadCount}</span>}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="comm-empty-contacts">Nessun contatto</div>}
          </div>
        </div>

        {/* ─── CHAT PANEL ─── */}
        <div className="comm-chat">
          {active ? (
            <>
              {/* Chat header */}
              <div className="comm-chat-header">
                <div className="comm-chat-header-left">
                  <button className="comm-back-btn" onClick={() => setActiveId(null)}>
                    <span className="comm-back-arrow">←</span>
                    <span className="comm-back-label">Chat</span>
                  </button>
                  <div className="comm-chat-header-info">
                    <div className="comm-chat-name">
                      {editingName ? (
                        <input
                          ref={nameInputRef}
                          className="comm-name-input"
                          value={nameInput}
                          onChange={e => setNameInput(e.target.value)}
                          onBlur={saveEditName}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); saveEditName(); }
                            if (e.key === 'Escape') cancelEditName();
                          }}
                        />
                      ) : (
                        <>
                          {active.contactName}
                          <button className="comm-name-edit-btn" onClick={startEditName} title="Rinomina">✏️</button>
                        </>
                      )}
                    </div>
                    <div className="comm-chat-phone">📱 {active.phone}</div>
                    <div className="comm-customer-link">
                      {active.customer ? (
                        <>
                          <span className="comm-customer-chip">👤 {active.customer.name}</span>
                          <button className="comm-customer-unlink" onClick={() => linkCustomer(null)} title="Scollega">×</button>
                        </>
                      ) : showLinkCustomer ? (
                        <select className="comm-customer-select" autoFocus
                          onChange={e => linkCustomer(e.target.value || null)}
                          onBlur={() => setShowLinkCustomer(false)}
                          defaultValue="">
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
                  <select className="comm-status-select" value={active.status} onChange={e => changeStatus(e.target.value)} style={{ borderColor: STATUSES[active.status]?.color }}>
                    {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  {active.orderId && <span className="comm-order-link">🔗 Ordine collegato</span>}
                </div>
              </div>

              {/* Messages */}
              <div className="comm-messages" ref={messagesRef}>
                {active.messages.map((msg, i) => {
                  const dayLabel = getDayLabel(msg.createdAt);
                  const prevDayLabel = i > 0 ? getDayLabel(active.messages[i - 1].createdAt) : null;
                  return (
                    <>
                      {dayLabel !== prevDayLabel && (
                        <div key={`sep-${i}`} className="comm-day-sep"><span>{dayLabel}</span></div>
                      )}
                      <div key={msg.id} className={`comm-bubble ${msg.dir === 'out' ? 'out' : 'in'}`}>
                        <div className="comm-bubble-text">{msg.text}</div>
                        <div className="comm-bubble-meta">
                          {msg.ts}
                          {msg.auto && <span className="comm-auto-badge">🤖 auto</span>}
                        </div>
                      </div>
                    </>
                  );
                })}
              </div>

              {/* Input area */}
              <div className="comm-input-area">
                <div className="comm-template-row">
                  {msgTemplates.map(tpl => (
                    <button key={tpl.id} className="comm-tpl-btn" onClick={() => sendTemplate(tpl)} title={tpl.text}>
                      ⚡ {tpl.label}
                    </button>
                  ))}
                </div>
                <div className="comm-input-row">
                  <textarea
                    ref={textareaRef}
                    className="comm-msg-input"
                    placeholder="Scrivi messaggio…"
                    value={msgInput}
                    rows={1}
                    onChange={handleTextareaInput}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                    }}
                  />
                  <button className="comm-send-btn" onClick={handleSendMessage} disabled={!msgInput.trim()}>▶</button>
                </div>
              </div>
            </>
          ) : (
            <div className="comm-empty-chat">
              <div className="comm-empty-icon">💬</div>
              <div className="comm-empty-title">Seleziona un contatto</div>
              <div className="comm-empty-sub">Scegli una conversazione dalla lista o creane una nuova</div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nuovo contatto */}
      {showNewContact && (
        <div className="modal-backdrop" onClick={() => setShowNewContact(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth:'380px' }}>
            <div className="modal-header"><span className="modal-title">Nuovo contatto</span><button className="modal-close" onClick={() => setShowNewContact(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nome</label><input className="form-input" value={newContact.name} onChange={e => setNewContact({...newContact, name:e.target.value})} placeholder="es. Mario Rossi" /></div>
              <div className="form-group"><label className="form-label">Telefono WhatsApp</label><PhoneInput value={newContact.phone} onChange={phone => setNewContact({...newContact, phone})} /></div>
              <div className="form-actions"><button className="btn-secondary" onClick={() => setShowNewContact(false)}>Annulla</button><button className="btn-primary" onClick={createContact}>Crea contatto</button></div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
