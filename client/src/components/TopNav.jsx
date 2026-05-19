export default function TopNav({ onMenuClick, pageTitle }) {
  return (
    <nav className="topnav">
      {/* Menu button mobile */}
      <button 
        className="menu-btn"
        onClick={onMenuClick}
      >
        ☰
      </button>

      {/* Brand */}
      <div className="nav-brand">
        <div className="brand-logo">
          🔧
        </div>
        <span className="page-title">{pageTitle}</span>
        <span className="brand-env">PRO</span>
      </div>

      {/* Right actions */}
      <div className="nav-right">
        <button className="nav-icon-btn">
          🔔
        </button>
        <div className="avatar">
          SM
        </div>
      </div>
    </nav>
  );
}