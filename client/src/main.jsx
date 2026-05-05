import React from 'react';
import ReactDOM from 'react-dom/client';
import { toast } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

const handleUnhandledRejection = (event) => {
  if (import.meta.env.DEV) {
    console.error('Unhandled promise rejection:', event.reason);
  }

  toast.error('An unexpected error occurred.');
};

window.addEventListener('unhandledrejection', handleUnhandledRejection);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
