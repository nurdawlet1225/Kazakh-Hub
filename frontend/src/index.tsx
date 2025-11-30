import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n/config';
import { initErrorSuppression, setMarkFirestoreBlockedFn } from './utils/errorSuppression';
import { markFirestoreBlocked } from './utils/firebase';

// Connect error suppression to Firestore blocking detection
setMarkFirestoreBlockedFn(markFirestoreBlocked);

// Initialize error suppression for known Firebase issues
initErrorSuppression();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);