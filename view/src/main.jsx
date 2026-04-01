import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import CacheSyncBootstrap from './components/CacheSyncBootstrap.jsx';
import ThemeBootstrap from './components/ThemeBootstrap.jsx';
import { initIndexedDbLocalStorageBridge } from './utils/indexedDbStorage';
import "./index.css";

await initIndexedDbLocalStorageBridge();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CacheSyncBootstrap />
    <ThemeBootstrap />
    <App />
  </React.StrictMode>
)