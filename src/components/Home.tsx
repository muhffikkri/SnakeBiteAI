import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/store';
import { db, addIncidentLog, type IncidentDetails } from '../db/db';
import { Camera, Shield, Radio, AlertTriangle } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: string) => void;
  onSetIncidentId: (id: string) => void;
}

export default function Home({ onNavigate, onSetIncidentId }: HomeProps) {
  const {
    currentGPS,
    networkStatus,
    authMode,
    setGPS,
    setNetworkStatus,
    setAuthMode,
    pendingSyncCount,
    updatePendingSyncCount
  } = useAppStore();

  const [localSpecies, setLocalSpecies] = useState<any[]>([]);
  const [gpsSimulated, setGpsSimulated] = useState(false);
  const [simulatedProvince, setSimulatedProvince] = useState('DKI Jakarta');

  // Trigger haptic feedback
  const triggerHaptic = (duration: number) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  // Check network state periodically
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updatePendingSyncCount();

    // Default simulated GPS
    if (!currentGPS) {
      setGPS({
        lat: -6.2088,
        lng: 106.8456,
        accuracy: 15,
        timestamp: Date.now()
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update local species query based on coordinates / province
  useEffect(() => {
    const queryLocalSpecies = async () => {
      // Mock province based on coordinates
      let province = 'DKI Jakarta';
      if (currentGPS) {
        if (currentGPS.lat < -8.0 && currentGPS.lng > 115.0) {
          province = 'Bali';
        } else if (currentGPS.lat < -7.0 && currentGPS.lng > 110.0) {
          province = 'Jawa Timur';
        } else if (currentGPS.lat < -6.5 && currentGPS.lng < 108.0) {
          province = 'Jawa Barat';
        }
      }
      setSimulatedProvince(province);

      // Fetch all seeded species
      const allSpecies = await db.species.toArray();
      // Calculate a confidence rating based on simulated province and species
      const list = allSpecies.map(sp => {
        let confidence = 0.12;
        // Adjust confidence depending on species and mock province
        if (sp.scientific_name.includes('sputatrix') && province.includes('Jawa')) {
          confidence = 0.85;
        } else if (sp.scientific_name.includes('fasciatus') && province.includes('Jawa')) {
          confidence = 0.64;
        } else if (sp.scientific_name.includes('rhodostoma') && province.includes('Jawa')) {
          confidence = 0.73;
        } else if (sp.scientific_name.includes('insularis') && province === 'Bali') {
          confidence = 0.91;
        } else if (sp.scientific_name.includes('pictus')) {
          confidence = 0.95; // common harmless species
        }
        return { ...sp, confidence };
      }).sort((a, b) => b.confidence - a.confidence);

      setLocalSpecies(list);
    };

    queryLocalSpecies();
  }, [currentGPS]);

  // Simulate obtaining new GPS coordinates
  const triggerGpsRefresh = () => {
    triggerHaptic(100);
    setGpsSimulated(true);
    // Randomize slightly within Indonesia bounds
    const locations = [
      { name: 'DKI Jakarta', lat: -6.2088, lng: 106.8456 },
      { name: 'Jawa Barat', lat: -6.9175, lng: 107.6191 },
      { name: 'Jawa Timur', lat: -7.2575, lng: 112.7521 },
      { name: 'Bali', lat: -8.4095, lng: 115.1889 }
    ];
    const loc = locations[Math.floor(Math.random() * locations.length)];
    
    setTimeout(() => {
      setGPS({
        lat: loc.lat + (Math.random() - 0.5) * 0.05,
        lng: loc.lng + (Math.random() - 0.5) * 0.05,
        accuracy: Math.floor(Math.random() * 15) + 5,
        timestamp: Date.now()
      });
      setGpsSimulated(false);
    }, 800);
  };

  // Emergency Button Handler
  const handleEmergencyTrigger = async () => {
    triggerHaptic(300); // 300ms strong vibration
    
    // Play alert sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch alarm
      osc.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio alert blocked or unsupported');
    }

    const newIncidentId = `inc_${Math.floor(Math.random() * 10000000)}`;
    onSetIncidentId(newIncidentId);

    // Capture satellite-only lock (simulated high accuracy)
    const lat = currentGPS?.lat || -6.2088;
    const lng = currentGPS?.lng || 106.8456;

    // Create immediate incident log entry
    const emergencyDetails: IncidentDetails = {
      gps_coordinates: {
        lat,
        lng,
        accuracy: 5, // high satellite accuracy
        timestamp: Date.now()
      },
      species_prediction: {
        primary: 'Belum Teridentifikasi (Darurat)',
        risk: 'NEUROTOXIC',
        confidence: 0,
        alternatives: []
      },
      severity_assessment: {
        grade: 4, // life-threatening by default for emergency trigger
        grade_history: [{ timestamp: Date.now(), grade: 4 }],
        who_protocol: ['Segera lakukan imobilisasi anggota tubuh terinfeksi.', 'Jangan ikat dengan tourniquet.', 'Segera evakuasi ke fasilitas pelayanan kesehatan terdekat.']
      },
      symptoms: {
        bite_location: 'Tidak ditentukan (Tombol Darurat)',
        pain_scale: 10,
        swelling_grade: 4,
        local_effects: ['Nyeri Hebat', 'Pendarahan Aktif'],
        systemic_effects: ['Sesak Napas', 'Kelemahan Otot'],
        vital_signs: {
          hr: 120,
          bp: '140/90',
          spo2: 92
        }
      }
    };

    await addIncidentLog(newIncidentId, emergencyDetails, []);
    await updatePendingSyncCount();

    // Redirect to Triage Page (Page 3)
    onNavigate('triage');
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-primaryBg text-charcoal">
      {/* Top Section Connectivity Banner */}
      <div className="w-full bg-charcoal text-[#F5F5F5] px-4 py-3 flex items-center justify-between border-b-2 border-tealAccent shadow-md">
        <div className="flex items-center space-x-2">
          {networkStatus === 'online' ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-greenBadge text-white">
              🟢 ONLINE
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-greenBadge text-white animate-pulse">
              🟢 OFFLINE READY
            </span>
          )}
          {pendingSyncCount > 0 && (
            <span className="text-xs text-amberBadge font-medium">
              ({pendingSyncCount} Tertunda)
            </span>
          )}
        </div>
        
        {/* Authentication State Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium">Mode:</span>
          <button
            onClick={() => {
              triggerHaptic(50);
              setAuthMode(authMode === 'GUEST' ? 'SECURE' : 'GUEST');
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all shadow ${
              authMode === 'SECURE'
                ? 'bg-tealAccent text-white border border-tealLight'
                : 'bg-gray-700 text-gray-300'
            }`}
            aria-label={`Toggle authentication mode. Current mode: ${authMode}`}
          >
            {authMode === 'SECURE' ? 'Secure (Govt)' : 'Guest'}
          </button>
        </div>
      </div>

      {/* Main Core Content Container */}
      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-6 flex flex-col justify-between">
        
        {/* Header App Brand */}
        <div className="text-center my-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-charcoal flex items-center justify-center">
            <span className="text-tealAccent">SHIELD</span>: SnakeBite
          </h1>
          <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mt-1">
            Edge-AI CDSS v2.0
          </p>
        </div>

        {/* Hero Area (Thumb-Zone Optimized Center Buttons) */}
        <div className="flex flex-col items-center justify-center my-6 space-y-8 flex-1">
          {/* Primary Action Camera */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => {
                triggerHaptic(100);
                onNavigate('inference');
              }}
              className="w-44 h-44 rounded-full bg-tealAccent hover:bg-tealLight active:scale-95 text-white flex flex-col items-center justify-center shadow-xl border-4 border-charcoal transition-all"
              aria-label="Identifikasi Ular Via Edge-AI"
            >
              <Camera className="w-16 h-16 mb-2" />
              <span className="text-xs font-bold uppercase tracking-wider text-center px-4 leading-tight">
                Identifikasi Ular<br/>Via Edge-AI
              </span>
            </button>
          </div>

          {/* Pulsing Emergency Action */}
          <div className="w-full px-6">
            <button
              onClick={handleEmergencyTrigger}
              className="w-full py-4 bg-panic hover:bg-red-800 text-white font-extrabold text-lg rounded-xl border-2 border-charcoal shadow-lg pulse-emergency active:scale-95 transition-all flex items-center justify-center space-x-2"
              aria-label="Tombol Darurat"
            >
              <span className="text-xl">🚨</span>
              <span>TOMBOL DARURAT</span>
            </button>
            <p className="text-[10px] text-center text-gray-500 mt-2 font-medium">
              Vibrasi 300ms + GPS Lock + Triage Instan
            </p>
          </div>
        </div>

        {/* Geo-Awareness Widget Section */}
        <div className="bg-white border-2 border-charcoal rounded-xl p-4 shadow-md mt-auto">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
            <div className="flex items-center space-x-1.5">
              <Radio className="w-4 h-4 text-tealAccent animate-pulse" />
              <h2 className="text-sm font-bold text-charcoal">
                Kemungkinan Ular di Lokasi Anda
              </h2>
            </div>
            <button
              onClick={triggerGpsRefresh}
              disabled={gpsSimulated}
              className="text-[10px] text-tealAccent hover:text-tealLight font-bold flex items-center space-x-1"
            >
              <span>📍</span>
              <span>{gpsSimulated ? 'Mencari...' : `${simulatedProvince}`}</span>
            </button>
          </div>

          {/* Horizontal carousel of local species */}
          <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-thin">
            {localSpecies.length === 0 ? (
              <div className="text-xs text-gray-500 text-center py-4 w-full">
                Mencari spesies lokal...
              </div>
            ) : (
              localSpecies.map((sp) => (
                <div
                  key={sp.taxon_id}
                  className="flex-shrink-0 w-36 bg-primaryBg border border-charcoal rounded-lg p-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded text-white ${
                        sp.venom_type === 'NEUROTOXIC' ? 'bg-panic' : 
                        sp.venom_type === 'HEMOTOXIC' ? 'bg-amberBadge' : 'bg-greenBadge'
                      }`}>
                        {sp.venom_type}
                      </span>
                      <span className="text-[9px] font-bold text-tealAccent">
                        {(sp.confidence * 100).toFixed(0)}% KDE
                      </span>
                    </div>
                    <h3 className="text-xs font-bold line-clamp-1 text-charcoal">{sp.scientific_name}</h3>
                    <p className="text-[9px] text-gray-500 line-clamp-2 leading-tight">{sp.common_name_indonesian}</p>
                  </div>
                  
                  <div className="mt-2 border-t border-gray-200 pt-1">
                    <span className="text-[8px] font-semibold text-gray-500">Ciri Utama:</span>
                    <p className="text-[8px] text-charcoal line-clamp-1 italic">{sp.morphological_traits[0]}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="text-[8px] text-gray-400 mt-2 text-center">
            Menggunakan pembacaan hardware GPS internal secara pasif (100% Offline-Ready)
          </div>
        </div>

      </div>
    </div>
  );
}
