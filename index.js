import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';

const container = document.getElementById('root');
const root = createRoot(container);

// StrictMode ajuda a identificar problemas no desenvolvimento
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);