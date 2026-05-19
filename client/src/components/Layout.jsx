import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout({ children, currentPage, onPageChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = {
    dashboard: 'Dashboard',
    ordini: 'Ordini',
    clienti: 'Clienti',
    abbonamenti: 'Abbonamenti',
    prodotti: 'Prodotti',
    acquisti: 'Acquisti',
    spese: 'Spese',
    report: 'Report',
    impostazioni: 'Impostazioni',
  }[currentPage] || 'Dashboard';

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white lg:pl-62">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={(page) => {
          onPageChange(page);
          setSidebarOpen(false);
        }}
      />
      
      <div className="flex flex-col flex-1 min-w-0">
        <TopNav 
          onMenuClick={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
        />
        
        <main className="flex-1 p-5 pb-12 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}