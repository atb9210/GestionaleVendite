// Dashboard — KPIs reali dal backend analytics (con cache SWR)
import { useState, useEffect, useMemo } from 'react';
import { useData, fmt } from '../context/DataContext';
import { api } from '../lib/api';
import { dashCache } from '../lib/dashboardCache';

// Obiettivo mensile profitto netto (da spostare in Settings in futuro)
const MONTHLY_GOAL = 4000;

// Mappa key periodo → label tab
const PERIODS = [
  { key: '7d',    label: 'Ultimi 7gg' },
  { key: 'month', label: 'Questo mese' },
  { key: 'q',     label: 'Trimestre' },
  { key: 'ytd',   label: 'Anno' },
];

// Formatta range "01 mag — 20 mag 2026"
function fmtRange(from, to) {
  if (!from || !to) return '';
  const m = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  const a = new Date(from), b = new Date(to);
  return `${a.getDate()} ${m[a.getMonth()]} — ${b.getDate()} ${m[b.getMonth()]} ${b.getFullYear()}`;
}

// Render delta % con freccia + colore
function DeltaBadge({ value, suffix = 'vs periodo precedente' }) {
  if (value === null || value === undefined) return <span className="badge badge-muted">— {suffix}</span>;
  const up = value >= 0;
  return <span className={`badge ${up ? 'badge-green' : 'badge-muted'}`}>{up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}% {suffix}</span>;
}

export default function Dashboard() {
  const { products } = useData();
  const [period, setPeriod] = useState('month');
  // Inizializza dallo store cache: se già presente → render istantaneo
  const [overview, setOverview] = useState(() => dashCache.month?.overview ?? null);
  const [channels, setChannels] = useState(() => dashCache.month?.channels ?? []);
  const [transactions, setTransactions] = useState(() => dashCache.month?.transactions ?? []);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Stale-While-Revalidate: se ho dati in cache li mostro subito,
  // poi rivalido sempre in background. Niente "schermo vuoto" tra periodi.
  useEffect(() => {
    let cancelled = false;

    // Cache hit → render istantaneo. Cache miss → mantieni i dati precedenti visibili.
    const cached = dashCache[period];
    if (cached) {
      setOverview(cached.overview);
      setChannels(cached.channels);
      setTransactions(cached.transactions);
    }

    // Revalidate (sempre, anche con cache hit)
    Promise.all([
      api.analytics.overview(period),
      api.analytics.channels(period),
      api.analytics.recentTransactions(6),
    ])
      .then(([ov, ch, tx]) => {
        if (cancelled) return;
        dashCache[period] = { overview: ov, channels: ch, transactions: tx };
        setOverview(ov);
        setChannels(ch);
        setTransactions(tx);
      })
      .catch(e => console.error('Dashboard load error:', e));

    return () => { cancelled = true; };
  }, [period]);

  // Alert scorte: prodotti con stock <= lowStock (calcolato lato client)
  const lowStockProducts = useMemo(
    () => products.filter(p => p.stock !== null && p.stock !== undefined && p.lowStock && p.stock <= p.lowStock),
    [products]
  );

  // Goal progress: solo per "month" ha senso (4000€/mese)
  const goalProgress = overview && period === 'month'
    ? Math.min(100, Math.round((overview.financial.netProfit / MONTHLY_GOAL) * 100))
    : null;

  return (
    <>
      {/* Period selector tabs */}
      <div className="subnav">
        <div className="subnav-tabs">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} className={`tab ${period === p.key ? 'active' : ''}`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="subnav-divider"></div>
        <span className="subnav-date">{overview ? fmtRange(overview.period.from, overview.period.to) : '…'}</span>
      </div>

      <main className="page">
        {/* Alert scorte in esaurimento (calcolato lato client) */}
        {!alertDismissed && lowStockProducts.length > 0 && (
          <div className="alert">
            <div className="alert-dot"></div>
            <div className="alert-body">
              <div className="alert-title">Scorte in esaurimento</div>
              <div className="alert-msg">
                {lowStockProducts.slice(0, 2).map((p, i) => (
                  <span key={p.id}>{i > 0 && ' · '}<strong>{p.name}</strong>: {p.stock} unità</span>
                ))}
                {lowStockProducts.length > 2 && ` e altri ${lowStockProducts.length - 2}`}
              </div>
            </div>
            <button className="alert-close" onClick={() => setAlertDismissed(true)}>✕</button>
          </div>
        )}

        {/* Attività */}
        <div className="section-head"><span className="section-title">Attività</span></div>
        <div className="stat-strip">
          <div className="stat-card"><span className="stat-icon">🔍</span><div className="stat-val">{overview?.activity.orders ?? '—'}</div><div className="stat-lbl">Ordini</div></div>
          <div className="stat-card"><span className="stat-icon">♻️</span><div className="stat-val">{overview?.activity.subscriptions ?? '—'}</div><div className="stat-lbl">Abbonamenti</div></div>
          <div className="stat-card"><span className="stat-icon">👤</span><div className="stat-val">{overview?.activity.newCustomers ?? '—'}</div><div className="stat-lbl">Nuovi clienti</div></div>
        </div>

        {/* Finanziari */}
        <div className="section-head" style={{ marginTop: '24px' }}>
          <span className="section-title">Finanziari</span>
          <span className="section-action">Esporta →</span>
        </div>
        <div className="kpi-grid">
          {/* Card grande: Profitto netto + goal mensile */}
          <div className="kpi-card accent-card span2">
            <div className="kpi-label" style={{ color: 'rgba(165,180,252,0.7)' }}>
              <span className="dot" style={{ background: '#818cf8', opacity: 1, boxShadow: '0 0 5px #818cf8' }}></span>
              Profitto netto
            </div>
            <div className="kpi-value xl">{overview ? fmt(overview.financial.netProfit) : '—'}</div>
            <DeltaBadge value={overview?.compare.profitDelta} />
            {period === 'month' && (
              <div className="progress-group">
                <div className="progress-row">
                  <span className="progress-label" style={{ color: 'rgba(165,180,252,0.6)' }}>Obiettivo mensile — {fmt(MONTHLY_GOAL)}</span>
                  <span className="progress-pct" style={{ color: '#fff' }}>{goalProgress ?? 0}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill fill-indigo" style={{ width: `${goalProgress ?? 0}%` }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Ricavi totali */}
          <div className="kpi-card">
            <div className="kpi-label"><span className="dot" style={{ background: 'var(--blue)', opacity: 0.8 }}></span>Ricavi totali</div>
            <div className="kpi-value">{overview ? fmt(overview.financial.totalRevenue) : '—'}</div>
            <DeltaBadge value={overview?.compare.revenueDelta} />
          </div>

          {/* Costo del venduto */}
          <div className="kpi-card">
            <div className="kpi-label"><span className="dot" style={{ background: 'var(--red)', opacity: 0.8 }}></span>Costo del venduto</div>
            <div className="kpi-value">{overview ? fmt(overview.financial.totalCogs) : '—'}</div>
            <span className="badge badge-muted">
              {overview && overview.financial.totalRevenue > 0
                ? `${((overview.financial.totalCogs / overview.financial.totalRevenue) * 100).toFixed(0)}% del ricavo`
                : '—'}
            </span>
          </div>

          {/* Spese operative */}
          <div className="kpi-card">
            <div className="kpi-label"><span className="dot" style={{ background: 'var(--amber)', opacity: 0.8 }}></span>Spese operative</div>
            <div className="kpi-value">{overview ? fmt(overview.financial.totalExpenses) : '—'}</div>
            <span className="badge badge-muted">
              {overview && overview.financial.totalRevenue > 0
                ? `${((overview.financial.totalExpenses / overview.financial.totalRevenue) * 100).toFixed(0)}% del ricavo`
                : '—'}
            </span>
          </div>

          {/* Margine */}
          <div className="kpi-card">
            <div className="kpi-label"><span className="dot" style={{ background: 'var(--green)', opacity: 0.8 }}></span>Margine</div>
            <div className="kpi-value">{overview ? `${overview.financial.margin.toFixed(1)}%` : '—'}</div>
            <span className="badge badge-muted">target 60%</span>
          </div>
        </div>

        {/* Per canale */}
        <div className="section-head"><span className="section-title">Per canale</span></div>
        <div className="table-card">
          {overview && channels.length === 0 && (
            <div style={{ padding:'24px', textAlign:'center', color:'var(--text3)', fontSize:'13px' }}>Nessun dato nel periodo selezionato</div>
          )}
          {channels.map(ch => {
            const maxRev = Math.max(...channels.map(c => c.revenue), 1);
            const pct = (ch.revenue / maxRev * 100).toFixed(0);
            return (
              <div key={ch.name} className="service-row">
                <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:ch.color, margin:'0 auto' }}></div>
                <div className="service-info">
                  <div className="s-name">{ch.name}</div>
                  <div className="s-count">{ch.orders} ordini</div>
                </div>
                <div>
                  <div className="service-bar-track">
                    <div className="service-bar-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg, ${ch.color}aa, ${ch.color})` }}></div>
                  </div>
                </div>
                <div className="service-revenue">{fmt(ch.revenue)}</div>
              </div>
            );
          })}
        </div>

        {/* Ultime transazioni (orders + expenses) */}
        <div className="section-head">
          <span className="section-title">Ultime transazioni</span>
          <span className="section-action">Tutte →</span>
        </div>
        <div className="table-card">
          {overview && transactions.length === 0 && (
            <div style={{ padding:'24px', textAlign:'center', color:'var(--text3)', fontSize:'13px' }}>Nessuna transazione</div>
          )}
          {transactions.map(tx => {
            const isIncome = tx.kind === 'income';
            return (
              <div key={tx.id} className="tx-row">
                <div className="tx-icon" style={{ background: isIncome ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)' }}>
                  {isIncome ? '🔍' : '📦'}
                </div>
                <div className="tx-info">
                  <div className="tx-name">{tx.name}</div>
                  <div className="tx-meta">{new Date(tx.date).toLocaleDateString('it-IT', { day:'2-digit', month:'short' })} · {tx.meta}</div>
                </div>
                <div className="tx-right">
                  <div className={`tx-amount ${isIncome ? 'pos' : 'neg'}`}>
                    {isIncome ? '+' : '−'}{fmt(Math.abs(tx.amount))}
                  </div>
                  <div className="tx-tag">{isIncome ? 'ENTRATA' : 'USCITA'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
