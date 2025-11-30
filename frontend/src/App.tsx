import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import './styles/globals.css';
import './styles/theme.css';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const Upload = lazy(() => import('./pages/Upload'));
const ViewCode = lazy(() => import('./pages/ViewCode'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ChatPage = lazy(() => import('./pages/ChatPage'));

// Loading component
const PageLoader: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh' 
  }}>
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  </div>
);

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  
  // Hide header and sidebar on login/register pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  // Hide footer on chat page and view code page
  const isChatPage = location.pathname === '/chat';
  const isViewCodePage = location.pathname.startsWith('/view/');
  
  return (
    <div className="app">
      {!isAuthPage && <Header />}
      {!isAuthPage ? (
        <main className="app-main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/view/:id" element={<ViewCode />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="*" element={
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h1>{t('viewCode.404')}</h1>
                  <p>{t('viewCode.pageNotFound')}</p>
                </div>
              } />
            </Routes>
          </Suspense>
        </main>
      ) : (
        <main className="app-main-auth">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </Suspense>
        </main>
      )}
      {!isAuthPage && !isChatPage && !isViewCodePage && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

export default App;