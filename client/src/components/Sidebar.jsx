import { useState } from 'react';

// Definizione delle voci di navigazione
const navItems = [
  { section: 'Vendita', items: [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'ordini', label: 'Ordini', icon: '🧾' },
    { id: 'clienti', label: 'Clienti', icon: '👥' },
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
  return (
    <>
      {/* Backdrop per mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 bottom-0 w-62 bg-zinc-900 border-r border-white/7
        z-50 flex flex-col p-3.5 transition-transform duration-260
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-none
      `}>
        {/* Brand */}
        <div className="flex items-center gap-2 p-1 pb-3.5 border-b border-white/7 mb-2">
          <div className="w-7.5 h-7.5 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-indigo-500/40 border border-indigo-500/40">
            🔧
          </div>
          <span className="text-sm font-semibold tracking-tight">AutoDiag</span>
          <span className="ml-auto px-1.5 py-0.5 bg-zinc-800 border border-white/12 rounded text-[9.5px] font-semibold text-zinc-400 tracking-wider uppercase">
            PRO
          </span>
        </div>

        {/* Navigation */}
        {navItems.map((group) => (
          <div key={group.section}>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 px-3 py-3.5 pb-1.5">
              {group.section}
            </div>
            {group.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`
                  w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm font-medium
                  transition-colors text-left
                  ${currentPage === item.id 
                    ? 'bg-zinc-800 text-white shadow-inner border border-white/12' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }
                `}
              >
                <span className="text-base w-4.5 text-center opacity-75">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 bg-amber-500/12 text-amber-500 border border-amber-500/20 rounded text-[10px] font-semibold font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}

        {/* Footer */}
        <div className="mt-auto border-t border-white/7 pt-2">
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors">
            <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-[11px] font-bold">
              SM
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">Store Manager</div>
              <div className="text-[10.5px] text-zinc-500">Online</div>
            </div>
            <span className="text-zinc-500 text-sm">›</span>
          </div>
        </div>
      </aside>
    </>
  );
}