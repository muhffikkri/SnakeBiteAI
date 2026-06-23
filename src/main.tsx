import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { seedSpeciesDatabase } from './db/db.ts';

// Seed the species local matrix on startup
seedSpeciesDatabase().catch(err => {
  console.error('Error seeding species database:', err);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
