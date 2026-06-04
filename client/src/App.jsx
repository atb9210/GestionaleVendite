import { useState, useEffect } from 'react';
import { DataProvider, useData } from './context/DataContext';
import Layout from './components/Layout';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Products from './pages/Products';
import Subscriptions from './pages/Subscriptions';
import Expenses from './pages/Expenses';
import Purchases from './pages/Purchases';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Communications from './pages/Communications';

// Toast globale che legge dal context
function GlobalToast() {
  const { toast, hideToast } = useData();
  return <Toast message={toast.message} type={toast.type} isVisible={toast.show} onHide={hideToast} />;
}

// Loading overlay
function LoadingGate({ children }) {
  const { loading } = useData();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'14px', color:'var(--text3)' }}>Caricamento dati…</div>;
  return children;
}

// Componente principale App
function App() {
  // Stato per pagina corrente
  const openConvParam = new URLSearchParams(window.location.search).get('openConv');
  const [currentPage, setCurrentPage] = useState(openConvParam ? 'comunicazioni' : 'dashboard');
  const [openConvId, setOpenConvId] = useState(openConvParam || null);

  // Pulisce il query param dall'URL senza ricaricare
  useEffect(() => {
    if (openConvParam) window.history.replaceState({}, '', '/');
  }, []);

  // Mappa delle pagine
  const pages = {
    dashboard: <Dashboard />,
    ordini: <Orders />,
    clienti: <Customers />,
    comunicazioni: <Communications openConvId={openConvId} onConvOpened={() => setOpenConvId(null)} />,
    abbonamenti: <Subscriptions />,
    prodotti: <Products />,
    acquisti: <Purchases />,
    spese: <Expenses />,
    report: <Reports />,
    impostazioni: <Settings />,
  };

  return (
    <DataProvider>
      <LoadingGate>
        <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
          {pages[currentPage] || pages.dashboard}
        </Layout>
      </LoadingGate>
      <GlobalToast />
    </DataProvider>
  );
}

export default App;
