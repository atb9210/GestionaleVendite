import { useData } from '../context/DataContext';

// Definizione delle voci di navigazione
const navItems = [
  { section: 'Vendita', items: [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'ordini', label: 'Ordini', icon: '🧾' },
    { id: 'clienti', label: 'Clienti', icon: '👥' },
    { id: 'comunicazioni', label: 'Comunicazioni', icon: '💬' },
    { id: 'abbonamenti', label: 'Abbonamenti', icon: '♻️', badge: 2 },
  ]},
  { section: 'Catalogo & Costi', items: [
    { id: 'prodotti', label: 'Prodotti', icon: '📦', badge: 1 },
    { id: 'acquisti', label: 'Acquisti', icon: '🛒' },
    { id: 'spese', label: 'Spese', icon: '💸' },
  ]},
  { section: 'Analisi', items: [
    { id: 'report', label: 'Report', icon: '📈' },
  ]},
  { section: 'Impostazioni', items: [
    { id: 'impostazioni', label: 'Impostazioni', icon: '⚙️' },
  ]},
];

export default function Sidebar({ isOpen, onClose, currentPage, onPageChange }) {
  const { conversations } = useData();
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <>
      {/* Backdrop per mobile */}
      {isOpen && (
        <div 
          className={`sb-backdrop ${isOpen ? 'show' : ''}`}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sb-brand">
          <div className="brand-logo">🔧</div>
          <span className="brand-name">AutoDiag</span>
          <span className="brand-env">PRO</span>
        </div>

        {/* Navigation */}
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="sb-section">
              {group.section}
            </div>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
                {item.id === 'comunicazioni' && unreadCount > 0 && (
                  <span className="nav-badge nav-badge-unread">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        ))}

        {/* Spacer to push footer down */}
        <div className="sb-spacer"></div>

        {/* Footer */}
        <div className="sb-footer">
          <div className="user-card">
            <div className="avatar">SM</div>
            <div className="user-card-info">
              <div className="user-card-name">Store Manager</div>
              <div className="user-card-role">Online</div>
            </div>
            <span className="user-chevron">›</span>
          </div>
        </div>
      </aside>
    </>
  );
}