import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Upload from './pages/Upload';
import ViewCode from './pages/ViewCode';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ChatPage from './pages/ChatPage';
import './styles/globals.css';
import './styles/theme.css';

const App: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Router>
      <ScrollToTop />
      <div className="app">
        <Header />
        <div className="app-body">
          <Sidebar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/view/:id" element={<ViewCode />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <h1>{t('viewCode.404')}</h1>
                  <p>{t('viewCode.pageNotFound')}</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
        <Footer />
      </div>
    </Router>
  );
};

export default App;

