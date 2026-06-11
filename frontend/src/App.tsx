import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SiteConfigProvider, useSiteConfig } from './contexts/SiteConfigContext';
import { apiService } from './utils/api';
import { initializeFirebase, isFirebaseInitialized } from './utils/firebase';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
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
const AboutPage = lazy(() => import('./pages/AboutPage'));
const FeaturesPage = lazy(() => import('./pages/FeaturesPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VibecodingPage = lazy(() => import('./pages/VibecodingPage'));

// Bridge: connect AuthContext token to apiService
const AuthBridge: React.FC = () => {
  const { getAccessToken } = useAuth();
  useEffect(() => {
    apiService.setTokenGetter(getAccessToken);
  }, [getAccessToken]);
  return null;
};

// Bridge: initialize Firebase when SiteConfig becomes available
const FirebaseBridge: React.FC = () => {
  const { config } = useSiteConfig();
  useEffect(() => {
    if (config?.firebaseConfig && !isFirebaseInitialized()) {
      initializeFirebase(config.firebaseConfig);
    }
  }, [config?.firebaseConfig]);
  return null;
};

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
  
  // Hide header and sidebar on auth pages (login, register, forgot/reset password)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
    || location.pathname === '/forgot-password' || location.pathname === '/reset-password';
  // Hide footer on chat page, view code page, profile page, and vibecoding page
  const isChatPage = location.pathname === '/chat';
  const isViewCodePage = location.pathname.startsWith('/view/');
  const isProfilePage = location.pathname.startsWith('/profile');
  const isVibecodingPage = location.pathname === '/vibecoding';
  
  return (
    <div className="app">
      {!isAuthPage && !isVibecodingPage && <Header />}
      {!isAuthPage ? (
        <main className="app-main">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/view/:id" element={<ViewCode />} />
              <Route path="/profile/:username?" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/vibecoding" element={<VibecodingPage />} />
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
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Routes>
          </Suspense>
        </main>
      )}
      {!isAuthPage && !isChatPage && !isViewCodePage && !isProfilePage && !isVibecodingPage && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SiteConfigProvider>
          <Router>
            <AuthBridge />
            <FirebaseBridge />
            <ScrollToTop />
            <AppContent />
          </Router>
        </SiteConfigProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;