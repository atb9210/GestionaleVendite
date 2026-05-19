// Pagina Dashboard con KPIs e dati mock (basata su mockup dashboard.html)
import { useState } from 'react';

export default function Dashboard() {
  // Stato per periodo selezionato
  const [period, setPeriod] = useState('month');

  // Dati mock per diversi periodi
  const periodData = {
    '7d': {
      activity: [
        { icon: '🔍', label: 'Ordini', value: '12' },
        { icon: '♻️', label: 'Abbonamenti', value: '3' },
        { icon: '👤', label: 'Clienti', value: '8' },
      ],
      financial: [
        { label: 'Ricavi totali', value: '€ 1.240', change: '▲ +8%', color: 'blue' },
        { label: 'Costo del venduto', value: '€ 420', change: '34% del ricavo', color: 'red' },
        { label: 'Spese operative', value: '€ 140', change: '11% del ricavo', color: 'amber' },
        { label: 'Margine', value: '54.8%', change: 'target 60%', color: 'green' },
      ],
      profit: '€ 680',
      profitChange: '▲ +8%',
      goalProgress: 17,
      channels: [
        { name: 'Facebook', revenue: 520, orders: 6, color: '#1877f2' },
        { name: 'Google', revenue: 380, orders: 4, color: '#34a853' },
        { name: 'Instagram', revenue: 150, orders: 1, color: '#e1306c' },
        { name: 'Diretto', revenue: 190, orders: 1, color: '#818cf8' },
      ],
    },
    'month': {
      activity: [
        { icon: '🔍', label: 'Ordini', value: '38' },
        { icon: '♻️', label: 'Abbonamenti', value: '12' },
        { icon: '👤', label: 'Clienti', value: '29' },
      ],
      financial: [
        { label: 'Ricavi totali', value: '€ 5.860', change: '▲ +12%', color: 'blue' },
        { label: 'Costo del venduto', value: '€ 1.940', change: '33% del ricavo', color: 'red' },
        { label: 'Spese operative', value: '€ 680', change: '12% del ricavo', color: 'amber' },
        { label: 'Margine', value: '55.3%', change: 'target 60%', color: 'green' },
      ],
      profit: '€ 3.240',
      profitChange: '▲ +18%',
      goalProgress: 81,
      channels: [
        { name: 'Facebook', revenue: 2340, orders: 18, color: '#1877f2' },
        { name: 'Google', revenue: 1560, orders: 12, color: '#34a853' },
        { name: 'Instagram', revenue: 890, orders: 5, color: '#e1306c' },
        { name: 'Diretto', revenue: 1070, orders: 3, color: '#818cf8' },
      ],
    },
    'q': {
      activity: [
        { icon: '🔍', label: 'Ordini', value: '112' },
        { icon: '♻️', label: 'Abbonamenti', value: '35' },
        { icon: '👤', label: 'Clienti', value: '87' },
      ],
      financial: [
        { label: 'Ricavi totali', value: '€ 17.450', change: '▲ +15%', color: 'blue' },
        { label: 'Costo del venduto', value: '€ 5.820', change: '33% del ricavo', color: 'red' },
        { label: 'Spese operative', value: '€ 2.040', change: '12% del ricavo', color: 'amber' },
        { label: 'Margine', value: '55.0%', change: 'target 60%', color: 'green' },
      ],
      profit: '€ 9.590',
      profitChange: '▲ +22%',
      goalProgress: 95,
      channels: [
        { name: 'Facebook', revenue: 6890, orders: 54, color: '#1877f2' },
        { name: 'Google', revenue: 4680, orders: 36, color: '#34a853' },
        { name: 'Instagram', revenue: 2670, orders: 15, color: '#e1306c' },
        { name: 'Diretto', revenue: 3210, orders: 7, color: '#818cf8' },
      ],
    },
    'ytd': {
      activity: [
        { icon: '🔍', label: 'Ordini', value: '445' },
        { icon: '♻️', label: 'Abbonamenti', value: '142' },
        { icon: '👤', label: 'Clienti', value: '312' },
      ],
      financial: [
        { label: 'Ricavi totali', value: '€ 68.900', change: '▲ +28%', color: 'blue' },
        { label: 'Costo del venduto', value: '€ 22.950', change: '33% del ricavo', color: 'red' },
        { label: 'Spese operative', value: '€ 8.260', change: '12% del ricavo', color: 'amber' },
        { label: 'Margine', value: '54.8%', change: 'target 60%', color: 'green' },
      ],
      profit: '€ 37.690',
      profitChange: '▲ +35%',
      goalProgress: 94,
      channels: [
        { name: 'Facebook', revenue: 27560, orders: 215, color: '#1877f2' },
        { name: 'Google', revenue: 18720, orders: 144, color: '#34a853' },
        { name: 'Instagram', revenue: 10680, orders: 60, color: '#e1306c' },
        { name: 'Diretto', revenue: 11940, orders: 26, color: '#818cf8' },
      ],
    },
  };

  const data = periodData[period];

  // Dati mock per transazioni (statici per ora)
  const transactions = [
    { icon: '🔍', name: 'Diagnosi Full — Ferrari M.', meta: 'Oggi, 11:24 · Facebook Ads', amount: '+€ 150', type: 'ENTRATA', color: 'green' },
    { icon: '📦', name: 'Acquisto OBD Cables ×5', meta: 'Ieri, 09:00 · Fornitore', amount: '−€ 87', type: 'USCITA', color: 'red' },
    { icon: '⭐', name: 'Abbonamento Pro — Rossi G.', meta: '16 mag · Diretto', amount: '+€ 200', type: 'ENTRATA', color: 'green' },
    { icon: '🔍', name: 'Diagnosi Base — Bianchi F.', meta: '15 mag · Google Ads', amount: '+€ 70', type: 'ENTRATA', color: 'green' },
  ];

  return (
    <>
      {/* Period selector tabs — outside .page for full-width */}
      <div className="subnav">
        <div className="subnav-tabs">
          {[
            { key: '7d', label: 'Ultimi 7gg' },
            { key: 'month', label: 'Questo mese' },
            { key: 'q', label: 'Trimestre' },
            { key: 'ytd', label: 'Anno' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`tab ${period === p.key ? 'active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="subnav-divider"></div>
        <span className="subnav-date">01 mag — 18 mag 2025</span>
      </div>

      <main className="page">
        {/* Alert banner */}
        <div className="alert">
          <div className="alert-dot"></div>
          <div className="alert-body">
            <div className="alert-title">Scorte in esaurimento</div>
            <div className="alert-msg">OBD Scanner Pro: <strong>2 unità</strong> rimaste — soglia minima raggiunta.</div>
          </div>
          <button className="alert-close" onClick={() => {}}>✕</button>
        </div>

        {/* Sezione Attività */}
        <div className="section-head">
          <span className="section-title">Attività</span>
        </div>
        <div className="stat-strip">
          {data.activity.map((stat) => (
            <div key={stat.label} className="stat-card">
              <span className="stat-icon">{stat.icon}</span>
              <div className="stat-val">{stat.value}</div>
              <div className="stat-lbl">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Sezione Finanziari */}
        <div className="section-head" style={{ marginTop: '24px' }}>
          <span className="section-title">Finanziari</span>
          <span className="section-action">Esporta →</span>
        </div>
        <div className="kpi-grid">
          {/* Accent card — Profitto netto */}
          <div className="kpi-card accent-card span2">
            <div className="kpi-label" style={{ color: 'rgba(165,180,252,0.7)' }}>
              <span className="dot" style={{ background: '#818cf8', opacity: 1, boxShadow: '0 0 5px #818cf8' }}></span>
              Profitto netto
            </div>
            <div className="kpi-value xl">{data.profit}</div>
            <span className="badge badge-green">{data.profitChange} vs mese scorso</span>
            <div className="progress-group">
              <div className="progress-row">
                <span className="progress-label" style={{ color: 'rgba(165,180,252,0.6)' }}>Obiettivo mensile — € 4.000</span>
                <span className="progress-pct" style={{ color: '#fff' }}>{data.goalProgress}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill fill-indigo" style={{ width: `${data.goalProgress}%` }}></div>
              </div>
            </div>
          </div>

          {/* KPI cards normali */}
          {data.financial.map((kpi) => (
            <div key={kpi.label} className="kpi-card">
              <div className="kpi-label">
                <span className="dot" style={{ background: `var(--${kpi.color})`, opacity: 0.8 }}></span>
                {kpi.label}
              </div>
              <div className="kpi-value">{kpi.value}</div>
              <span className={`badge ${kpi.color === 'green' ? 'badge-green' : kpi.color === 'blue' ? 'badge-blue' : 'badge-muted'}`}>
                {kpi.change}
              </span>
            </div>
          ))}
        </div>

        {/* Sezione Canali */}
        <div className="section-head">
          <span className="section-title">Per canale</span>
        </div>
        <div className="table-card">
          {data.channels.map((channel) => {
            const maxRevenue = Math.max(...data.channels.map(c => c.revenue));
            const percentage = (channel.revenue / maxRevenue * 100).toFixed(0);
            return (
              <div key={channel.name} className="service-row">
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: channel.color, margin: '0 auto' }}></div>
                <div className="service-info">
                  <div className="s-name">{channel.name}</div>
                  <div className="s-count">{channel.orders} ordini</div>
                </div>
                <div>
                  <div className="service-bar-track">
                    <div 
                      className="service-bar-fill"
                      style={{ 
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${channel.color}aa, ${channel.color})`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="service-revenue">€ {channel.revenue.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        {/* Sezione Ultime transazioni */}
        <div className="section-head">
          <span className="section-title">Ultime transazioni</span>
          <span className="section-action">Tutte →</span>
        </div>
        <div className="table-card">
          {transactions.map((tx, i) => (
            <div key={i} className="tx-row">
              <div className="tx-icon" style={{
                background: tx.type === 'ENTRATA' ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)'
              }}>
                {tx.icon}
              </div>
              <div className="tx-info">
                <div className="tx-name">{tx.name}</div>
                <div className="tx-meta">{tx.meta}</div>
              </div>
              <div className="tx-right">
                <div className={`tx-amount ${tx.type === 'ENTRATA' ? 'pos' : 'neg'}`}>
                  {tx.amount}
                </div>
                <div className="tx-tag">{tx.type}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}