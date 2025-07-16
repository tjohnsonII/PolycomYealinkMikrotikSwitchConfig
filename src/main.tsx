
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/App.css';
import App from './pages/App';

// Hide loading screen once React app is ready
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide loading screen after React has rendered
setTimeout(hideLoadingScreen, 100);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
