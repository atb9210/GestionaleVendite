import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function Layout({ children, currentPage, onPageChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pageTitle = {
    dashboard: 'Dashboard',
    ordini: 'Ordini',
    clienti: 'Clienti',
    comunicazioni: 'Comunicazioni',
    abbonamenti: 'Abbonamenti',
    prodotti: 'Prodotti',
    acquisti: 'Acquisti',
    spese: 'Spese',
    report: 'Report',
    impostazioni: 'Impostazioni',
  }[currentPage] || 'Dashboard';

  return (
    <div className="layout">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={(page) => {
          onPageChange(page);
          setSidebarOpen(false);
        }}
      />
      
      <div className="main-area">
        <TopNav 
          onMenuClick={() => setSidebarOpen(true)}
          pageTitle={pageTitle}
        />
        {children}
      </div>
    </div>
  );
}