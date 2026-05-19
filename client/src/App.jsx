import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Renderizza la pagina corrente
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
