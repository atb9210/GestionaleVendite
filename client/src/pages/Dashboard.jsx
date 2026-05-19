// Pagina Dashboard - placeholder per testare il layout
export default function Dashboard() {
  return (
    <div>
      {/* Header con titolo e button */}
      <div className="flex items-start justify-between gap-3 mb-4.5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight mb-0.5">Dashboard</h1>
          <p className="text-xs text-zinc-400 font-mono">Panoramica attività vendite</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold bg-gradient-to-b from-indigo-500 to-indigo-600 text-white rounded-lg shadow-lg shadow-indigo-500/25 border border-indigo-500/40 transition-transform active:translate-y-px">
          <span className="text-base leading-none">+</span> Nuovo
        </button>
      </div>

      {/* Messaggio di stato */}
      <div className="bg-zinc-900 border border-white/7 rounded-lg p-3.5 mb-5">
        <p className="text-sm text-zinc-400">
          🚀 Dashboard in costruzione. Layout testato con successo!
        </p>
      </div>

      {/* Card statistiche placeholder */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-zinc-900 border border-white/7 rounded-lg p-3.5">
          <span className="text-base block mb-1.5">🔍</span>
          <div className="font-mono text-xl font-medium tracking-tight mb-1">38</div>
          <div className="text-xs text-zinc-400 font-medium">Ordini</div>
        </div>
        <div className="bg-zinc-900 border border-white/7 rounded-lg p-3.5">
          <span className="text-base block mb-1.5">♻️</span>
          <div className="font-mono text-xl font-medium tracking-tight mb-1">12</div>
          <div className="text-xs text-zinc-400 font-medium">Abbonamenti</div>
        </div>
        <div className="bg-zinc-900 border border-white/7 rounded-lg p-3.5">
          <span className="text-base block mb-1.5">👤</span>
          <div className="font-mono text-xl font-medium tracking-tight mb-1">29</div>
          <div className="text-xs text-zinc-400 font-medium">Clienti</div>
        </div>
      </div>
    </div>
  );
}