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

function GlobalToast() {
  const { toast, hideToast } = useData();
  return <Toast message={toast.message} type={toast.type} isVisible={toast.show} onHide={hideToast} />;
}

function LoadingGate({ children }) {
  const { loading } = useData();
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'14px', color:'var(--text3)' }}>Caricamento dati…</div>;
  return children;
}

function AppInner() {
  const { pushOpenConvId, clearPushOpenConvId } = useData();

  const openConvParam = new URLSearchParams(window.location.search).get('openConv');
  const [currentPage, setCurrentPage] = useState(openConvParam ? 'comunicazioni' : 'dashboard');
  const [openConvId, setOpenConvId] = useState(openConvParam || null);

  useEffect(() => {
    if (openConvParam) window.history.replaceState({}, '', '/');
  }, []);

  // App già aperta: arriva postMessage dal SW (foreground o risveglio da background)
  useEffect(() => {
    if (!pushOpenConvId) return;
    setOpenConvId(pushOpenConvId);
    setCurrentPage('comunicazioni');
    clearPushOpenConvId();
  }, [pushOpenConvId]);

  // Fallback visibilitychange: se l'app torna visibile con ?openConv= nell'URL
  // (caso iOS background dove navigate() era stato chiamato in precedenza)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const params = new URLSearchParams(window.location.search);
      const conv = params.get('openConv');
      if (conv) {
        setOpenConvId(conv);
        setCurrentPage('comunicazioni');
        window.history.replaceState({}, '', '/');
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

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
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {pages[currentPage] || pages.dashboard}
    </Layout>
  );
}

function App() {
  return (
    <DataProvider>
      <LoadingGate>
        <AppInner />
      </LoadingGate>
      <GlobalToast />
    </DataProvider>
  );
}

export default App;
