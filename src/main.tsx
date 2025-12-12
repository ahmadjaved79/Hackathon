// src/main.tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { DashboardProvider } from './context/DashboardContext';

createRoot(document.getElementById('root')!).render(
  <DashboardProvider>
    <App />
  </DashboardProvider>
);
