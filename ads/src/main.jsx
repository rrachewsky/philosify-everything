import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext';
import { AdminProvider } from '@contexts/AdminContext';
import { AgencyProvider } from '@contexts/AgencyContext';
import { initI18nLanguage } from './i18n/config';
import App from './App';
import '@styles/global.css';

// Load saved language before rendering to avoid English flash
initI18nLanguage().then(() => {
  createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <AuthProvider>
        <AdminProvider>
          <AgencyProvider>
            <App />
          </AgencyProvider>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  );
});
