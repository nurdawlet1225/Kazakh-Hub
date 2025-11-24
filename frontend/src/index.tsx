import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n/config';
import { initErrorSuppression } from './utils/errorSuppression';

// Initialize error suppression for known Firebase issues
initErrorSuppression();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);