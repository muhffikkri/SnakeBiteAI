import React, { useState } from 'react';
import Home from './components/Home';
import Inference from './components/Inference';
import Triage from './components/Triage';
import Dashboard from './components/Dashboard';
import { Home as HomeIcon, Camera, ClipboardList, Map, ShieldAlert } from 'lucide-react';
import { useAppStore } from './store/store';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentIncidentId, setCurrentIncidentId] = useState<string>('');
  
  const { authMode } = useAppStore();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleSetIncidentId = (id: string) => {
    setCurrentIncidentId(id);
  };

  return (
    <div className="min-h-screen bg-primaryBg font-sans select-none antialiased pb-12">
      
      {/* Dynamic Page Router */}
      <main className="transition-all duration-300">
        {currentPage === 'home' && (
          <Home onNavigate={handleNavigate} onSetIncidentId={handleSetIncidentId} />
        )}
        
        {currentPage === 'inference' && (
          <Inference onNavigate={handleNavigate} onSetIncidentId={handleSetIncidentId} />
        )}
        
        {currentPage === 'triage' && (
          <Triage incidentId={currentIncidentId} onNavigate={handleNavigate} />
        )}
        
        {currentPage === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} />
        )}
      </main>

      {/* Floating Bottom Navigation Bar (Optimized for Thumb-Zone in lower 25% of Screen) */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-charcoal border-2 border-[#F5F5F5] rounded-2xl shadow-xl flex items-center justify-around py-3 px-2 z-[99999]">
        <button
          onClick={() => handleNavigate('home')}
          className={`flex flex-col items-center space-y-0.5 focus:outline-none transition-all ${
            currentPage === 'home' ? 'text-tealLight scale-110 font-bold' : 'text-gray-400 hover:text-[#F5F5F5]'
          }`}
          aria-label="Navigasi ke Beranda"
        >
          <HomeIcon className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Home</span>
        </button>

        <button
          onClick={() => handleNavigate('inference')}
          className={`flex flex-col items-center space-y-0.5 focus:outline-none transition-all ${
            currentPage === 'inference' ? 'text-tealLight scale-110 font-bold' : 'text-gray-400 hover:text-[#F5F5F5]'
          }`}
          aria-label="Navigasi ke Identifikasi AI"
        >
          <Camera className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Edge-AI</span>
        </button>

        <button
          onClick={() => handleNavigate('triage')}
          className={`flex flex-col items-center space-y-0.5 focus:outline-none transition-all ${
            currentPage === 'triage' ? 'text-tealLight scale-110 font-bold' : 'text-gray-400 hover:text-[#F5F5F5]'
          }`}
          aria-label="Navigasi ke Triage Medis"
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Triage</span>
        </button>

        {/* Government view is locked unless SECURE mode is active */}
        <button
          onClick={() => {
            if (authMode === 'SECURE') {
              handleNavigate('dashboard');
            } else {
              alert('Akses Terbatas: Aktifkan "Secure Mode (Govt)" pada banner atas halaman utama untuk melihat peta sebaran nasional.');
            }
          }}
          className={`flex flex-col items-center space-y-0.5 focus:outline-none transition-all relative ${
            currentPage === 'dashboard' ? 'text-tealLight scale-110 font-bold' : 'text-gray-400 hover:text-[#F5F5F5]'
          } ${authMode !== 'SECURE' ? 'opacity-50' : ''}`}
          aria-label="Navigasi ke Peta Nasional"
        >
          <Map className="w-5 h-5" />
          <span className="text-[9px] uppercase tracking-wider">Map & Sync</span>
          {authMode !== 'SECURE' && (
            <span className="absolute -top-1.5 -right-1 bg-panic text-[#F5F5F5] text-[7px] px-1 rounded-full border border-charcoal">
              🔒
            </span>
          )}
        </button>
      </nav>

    </div>
  );
}
