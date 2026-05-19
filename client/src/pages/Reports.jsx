// Pagina Report con analytics (basata su mockup dashboard.html)
export default function Reports() {
  // Canali
  const CHANNELS = {
    fb:     { label:'Facebook',  color:'#1877f2', dim:'rgba(24,119,242,0.12)', bord:'rgba(24,119,242,0.3)' },
    google: { label:'Google',    color:'#34a853', dim:'rgba(52,168,83,0.12)',  bord:'rgba(52,168,83,0.3)'  },
    ig:     { label:'Instagram', color:'#e1306c', dim:'rgba(225,48,108,0.12)', bord:'rgba(225,48,108,0.3)' },
    direct: { label:'Diretto',   color:'#818cf8', dim:'rgba(129,140,248,0.15)',bord:'rgba(129,140,248,0.3)'},
  };

  // Dati ROAS (da template)
  const roasData = [
    { ch:'fb',     spend:340, rev:1220, orders:3 },
    { ch:'google', spend:180, rev:520,  orders:2 },
    { ch:'ig',     spend:0,   rev:150,  orders:1 },
    { ch:'direct', spend:0,   rev:200,  orders:1 },
  ];

  // Top prodotti (aggregati da ordini template)
  const topProducts = [
    { name:'OBD Scanner Pro Kit',  count:3, rev:1350, profit:765  },
    { name:'Abbonamento Pro',      count:2, rev:400,  profit:340  },
    { name:'Licenza Autel MS906',  count:1, rev:320,  profit:180  },
    { name:'Diagnosi Full Check',  count:2, rev:300,  profit:230  },
    { name:'OBD Base + 2 cavi',    count:1, rev:250,  profit:160  },
  ];

  const fmt = n => '€ ' + n.toLocaleString('it-IT');
  const maxProfit = topProducts[0].profit;

  return (
    <main className="page">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-h1">Report</h1>
          <div className="page-sub">Analisi performance · maggio 2025</div>
        </div>
        <button className="btn-secondary">⬇ Esporta CSV</button>
      </div>

      {/* Chart section */}
      <div className="big-chart">
        <div className="big-chart-head">
          <div>
            <div className="big-chart-title">Andamento profit</div>
            <div className="big-chart-sub">Ultimi 30 giorni · € 3.240 totale</div>
          </div>
          <span className="badge badge-green">▲ +18%</span>
        </div>
        <svg className="chart-canvas" viewBox="0 0 600 160" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M8,120 L28,130 L48,110 L68,125 L88,95 L108,105 L128,115 L148,100 L168,85 L188,108 L208,115 L228,105 L248,90 L268,75 L288,100 L308,95 L328,85 L348,70 L368,78 L388,72 L408,60 L428,68 L448,50 L468,58 L488,45 L508,52 L528,38 L548,45 L568,35 L588,20 L588,160 L8,160 Z" fill="url(#rg)"/>
          <path d="M8,120 L28,130 L48,110 L68,125 L88,95 L108,105 L128,115 L148,100 L168,85 L188,108 L208,115 L228,105 L248,90 L268,75 L288,100 L308,95 L328,85 L348,70 L368,78 L388,72 L408,60 L428,68 L448,50 L468,58 L488,45 L508,52 L528,38 L548,45 L568,35 L588,20" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* ROAS per canale */}
      <div className="section-head"><span className="section-title">ROAS per canale</span></div>
      <div className="table-card">
        {roasData.map((d) => {
          const c = CHANNELS[d.ch];
          const roas = d.spend > 0 ? (d.rev / d.spend).toFixed(1) + 'x' : '∞';
          const roasCls = d.spend === 0 ? 'badge-muted' : (d.rev / d.spend >= 3 ? 'badge-green' : (d.rev / d.spend >= 2 ? 'badge-amber' : 'badge-red'));
          return (
            <div key={d.ch} className="list-row" style={{ gridTemplateColumns: 'auto 1fr auto auto auto', gap: '12px' }}>
              <span className="chan-badge" style={{ background: c.dim, color: c.color, borderColor: c.bord }}>
                <span className="chan-dot" style={{ background: c.color }}></span>
                {c.label}
              </span>
              <div className="row-meta">{d.orders} ordini</div>
              <div className="row-money" style={{ textAlign: 'right', minWidth: '70px' }}>
                {fmt(d.spend)}
                <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: '2px' }}>spend</div>
              </div>
              <div className="row-money pos" style={{ textAlign: 'right', minWidth: '70px' }}>
                {fmt(d.rev)}
                <div style={{ fontSize: '10.5px', color: 'var(--text3)', marginTop: '2px' }}>ricavo</div>
              </div>
              <span className={`badge ${roasCls}`}>{roas}</span>
            </div>
          );
        })}
      </div>

      {/* Top prodotti per profit */}
      <div className="section-head"><span className="section-title">Top prodotti per profit</span></div>
      <div className="table-card">
        {topProducts.map((product, i) => {
          const pct = (product.profit / maxProfit * 100).toFixed(0);
          return (
            <div key={product.name} className="service-row">
              <div className="service-rank">#{i + 1}</div>
              <div className="service-info">
                <div className="s-name">{product.name}</div>
                <div className="s-count">{product.count} vendite · ricavo {fmt(product.rev)}</div>
              </div>
              <div>
                <div className="service-bar-track">
                  <div className="service-bar-fill" style={{ width: `${pct}%` }}></div>
                </div>
              </div>
              <div className="service-revenue">{fmt(product.profit)}</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
