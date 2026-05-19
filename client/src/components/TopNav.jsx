export default function TopNav({ onMenuClick, pageTitle }) {
  return (
    <nav className="sticky top-0 z-40 h-14 bg-zinc-950/85 backdrop-blur-3xl border-b border-white/7 flex items-center px-4 gap-2.5">
      {/* Menu button mobile */}
      <button 
        onClick={onMenuClick}
        className="lg:hidden w-8.5 h-8.5 rounded-lg bg-transparent border border-white/7 text-zinc-400 flex items-center justify-center cursor-pointer text-base transition-colors hover:bg-zinc-800 hover:text-white hover:border-white/12"
      >
        ☰
      </button>

      {/* Brand */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="w-7.5 h-7.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-indigo-500/25 border border-indigo-500/40">
          🔧
        </div>
        <span className="text-sm font-semibold tracking-tight">{pageTitle}</span>
        <span className="inline-flex items-center px-1.5 py-0.5 bg-zinc-800 border border-white/12 rounded text-[10px] font-semibold text-zinc-400 tracking-wider uppercase">
          PRO
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="w-8.5 h-8.5 rounded-lg bg-transparent border border-white/7 text-zinc-400 flex items-center justify-center cursor-pointer text-sm transition-colors hover:bg-zinc-800 hover:text-white hover:border-white/12">
          🔔
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[11px] font-bold cursor-pointer shadow-lg shadow-indigo-500/40 border-2 border-zinc-950">
          SM
        </div>
      </div>
    </nav>
  );
}