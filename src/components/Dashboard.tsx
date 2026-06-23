import React, { useState, useEffect } from 'react';
import { db, getAllDecryptedIncidents } from '../db/db';
import { useAppStore } from '../store/store';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import { UploadCloud, Database, Wifi, ShieldCheck, RefreshCw } from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

// Simplified geographic coordinates for major Indonesian island regions (provinces/groups)
// This serves as our lightweight, 100% offline-ready Leaflet GeoJSON choropleth layer mockup
const PROVINCES_DATA = [
  {
    name: 'Sumatera',
    taxaCount: 78,
    density: 'dense', // solid border
    color: '#5A9A8F', // Medium
    coordinates: [
      [5.5, 95.3], [4.5, 98.0], [1.5, 99.0], [-1.0, 101.5], [-3.0, 102.5], [-5.5, 105.0],
      [-5.8, 104.2], [-4.0, 102.0], [-1.5, 100.0], [1.0, 97.5], [4.0, 96.0]
    ] as [number, number][]
  },
  {
    name: 'Jawa',
    taxaCount: 112,
    density: 'dense',
    color: '#2E7D6F', // High
    coordinates: [
      [-6.0, 106.0], [-6.2, 108.0], [-6.8, 111.0], [-6.9, 114.0], [-7.5, 114.5],
      [-8.5, 114.3], [-8.0, 110.0], [-7.5, 107.0], [-6.5, 105.5]
    ] as [number, number][]
  },
  {
    name: 'Kalimantan',
    taxaCount: 89,
    density: 'dense',
    color: '#2E7D6F', // High
    coordinates: [
      [2.0, 109.0], [4.0, 111.0], [4.2, 114.0], [4.0, 117.8], [2.0, 117.9],
      [-1.0, 117.0], [-3.5, 116.5], [-4.0, 114.5], [-3.0, 111.5], [-1.5, 109.5]
    ] as [number, number][]
  },
  {
    name: 'Sulawesi',
    taxaCount: 65,
    density: 'sparse', // dashed border
    color: '#5A9A8F', // Medium
    coordinates: [
      [1.5, 120.0], [1.8, 125.0], [1.0, 125.0], [0.5, 122.0], [-1.0, 121.5],
      [-0.8, 123.5], [-3.0, 124.0], [-5.5, 122.5], [-5.0, 119.5], [-2.5, 119.0],
      [-1.5, 120.0]
    ] as [number, number][]
  },
  {
    name: 'Bali & Nusa Tenggara',
    taxaCount: 52,
    density: 'dense',
    color: '#5A9A8F', // Medium
    coordinates: [
      [-8.3, 115.0], [-8.3, 116.5], [-8.5, 119.0], [-8.5, 121.0], [-8.3, 124.0],
      [-8.5, 125.0], [-10.2, 124.0], [-9.8, 120.0], [-8.9, 116.0], [-8.8, 115.0]
    ] as [number, number][]
  },
  {
    name: 'Maluku',
    taxaCount: 28,
    density: 'sparse',
    color: '#A8C5BC', // Low
    coordinates: [
      [-1.0, 127.0], [-0.5, 129.0], [-1.5, 130.5], [-3.8, 131.0], [-4.0, 129.0],
      [-3.0, 127.0]
    ] as [number, number][]
  },
  {
    name: 'Papua',
    taxaCount: 39,
    density: 'sparse',
    color: '#A8C5BC', // Low
    coordinates: [
      [-1.5, 131.0], [-0.8, 134.0], [-2.5, 137.0], [-2.6, 141.0], [-9.0, 141.0],
      [-8.0, 138.0], [-5.0, 136.0], [-4.0, 134.0]
    ] as [number, number][]
  }
];

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { networkStatus, setNetworkStatus, pendingSyncCount, updatePendingSyncCount } = useAppStore();

  const [incidents, setIncidents] = useState<any[]>([]);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);

  // Trigger haptic feedback
  const triggerHaptic = (duration: number) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  // Load all incidents from local DB
  const loadIncidents = async () => {
    const list = await getAllDecryptedIncidents();
    setIncidents(list);
    await updatePendingSyncCount();
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  // Trigger simulated sync process
  const triggerSync = async () => {
    if (incidents.filter(x => x.sync_status === 'PENDING').length === 0) {
      alert('Tidak ada antrean laporan darurat yang perlu disinkronkan.');
      return;
    }
    
    triggerHaptic(200);
    setSyncing(true);
    setSyncLogs([]);

    const logMessages = [
      "🔄 Memulai delayed background sync untuk antrean data...",
      "🌐 Mendeteksi status jaringan: ONLINE (onLine = true)",
      "🔒 Menyiapkan enkapsulasi data klinis terenkripsi AES-256-GCM...",
      `📦 Mengelompokkan ${pendingSyncCount} insiden dalam antrean batch...`,
      "📡 POST /api/v2/incidents/batch HTTP/1.1",
      "📤 Mentransmisikan payload terenkripsi (JSON)..."
    ];

    for (let i = 0; i < logMessages.length; i++) {
      await addSyncLog(logMessages[i], i * 350);
    }

    // Simulate batch photo uploading if photos are present
    const hasPhotos = incidents.some(inc => inc.photos && inc.photos.length > 0);
    if (hasPhotos) {
      await addSyncLog("📸 Multipart upload: Mentransmisikan berkas wound_photographs (BLOB)...", 2000);
    }

    // Success response simulation
    await addSyncLog("📥 HTTP/1.1 201 Created", 2500);
    await addSyncLog("✅ Server Kemenkes/BRIN: Sinkronisasi batch sukses.", 2800);

    // Update DB status to SYNCED
    setTimeout(async () => {
      const records = await db.incidents.toArray();
      for (const rec of records) {
        if (rec.sync_status === 'PENDING') {
          await db.incidents.update(rec.incident_id, { sync_status: 'SYNCED' });
        }
      }
      await loadIncidents();
      setSyncing(false);
      triggerHaptic(150);
    }, 3200);
  };

  const addSyncLog = (message: string, delay: number): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => {
        setSyncLogs(prev => [...prev, message]);
        resolve();
      }, delay - (syncLogs.length * 50));
    });
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-primaryBg text-charcoal">
      {/* Header */}
      <div className="bg-charcoal text-white px-4 py-4 flex items-center justify-between border-b-2 border-tealAccent shadow-md">
        <button
          onClick={() => onNavigate('home')}
          className="text-sm font-bold text-tealLight hover:text-white"
        >
          ← Beranda
        </button>
        <h1 className="text-md font-bold tracking-tight text-center">
          Peta Kemenkes & Sync
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-4 flex-1 flex flex-col justify-start space-y-4">
        
        {/* Map Header */}
        <div className="bg-white border-2 border-charcoal rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold text-charcoal uppercase tracking-wider">
              Peta Sebaran Populasi Taksa Ular
            </h2>
            <div className="flex items-center space-x-1.5 text-[10px] text-gray-500 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-tealAccent" />
              <span>Choropleth Indonesia</span>
            </div>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 leading-tight">
            Pembagian 34 wilayah provinsi berdasarkan tingkat keanekaragaman taksa spesies (KDE Spasial).
          </p>
        </div>

        {/* Leaflet Map Widget */}
        <div className="h-64 border-2 border-charcoal rounded-xl overflow-hidden shadow-md bg-white relative z-0">
          <MapContainer
            center={[-2.5489, 118.0149]} // Center of Indonesia
            zoom={4}
            zoomControl={false}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {PROVINCES_DATA.map((prov, idx) => (
              <Polygon
                key={idx}
                positions={prov.coordinates}
                pathOptions={{
                  fillColor: prov.color,
                  fillOpacity: 0.65,
                  color: '#1E1E1E',
                  weight: 2,
                  dashArray: prov.density === 'sparse' ? '5, 5' : undefined
                }}
              >
                <Popup>
                  <div className="font-sans text-xs p-1">
                    <h3 className="font-bold text-charcoal">{prov.name}</h3>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      Jumlah Spesies: <strong>{prov.taxaCount} taksa</strong>
                    </p>
                    <p className="text-[9px] text-tealAccent font-semibold leading-none mt-1">
                      Status Data: {prov.density === 'dense' ? 'Solid (Padat/Akurat)' : 'Dashed (Minim Koordinat)'}
                    </p>
                  </div>
                </Popup>
              </Polygon>
            ))}
          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-2 left-2 bg-white/95 border border-charcoal p-1.5 rounded text-[8px] font-bold z-[1000] space-y-1 shadow-sm leading-none">
            <div className="text-[9px] border-b pb-0.5 mb-1 text-charcoal">Tingkat Populasi</div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-2 bg-[#2E7D6F] block rounded-sm border border-charcoal" />
              <span>Tinggi (&gt;80 taksa)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-2 bg-[#5A9A8F] block rounded-sm border border-charcoal" />
              <span>Sedang (40-80 taksa)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-2 bg-[#A8C5BC] block rounded-sm border border-charcoal" />
              <span>Rendah (&lt;40 taksa)</span>
            </div>
          </div>
        </div>

        {/* Sync Queue Panel */}
        <div className="bg-white border-2 border-charcoal rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-tealAccent" />
              <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Antrean Data & Delayed Sync</span>
            </div>
            
            {networkStatus === 'online' ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-greenBadge text-white">
                <Wifi className="w-3 h-3 mr-1" />
                ONLINE
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-amberBadge text-white animate-pulse">
                🟢 OFFLINE READY
              </span>
            )}
          </div>

          {/* Sync table */}
          <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-lg">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-primaryBg text-charcoal font-bold border-b border-charcoal/20">
                <tr>
                  <th className="p-2">Pasien UUID</th>
                  <th className="p-2">Spesies Prediksi</th>
                  <th className="p-2 text-right">Status Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-gray-400 italic">
                      Tidak ada catatan insiden tersimpan.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => (
                    <tr key={inc.incident_id}>
                      <td className="p-2 font-mono text-gray-500">{inc.incident_id.substring(4, 12)}...</td>
                      <td className="p-2 text-charcoal font-bold">{inc.details.species_prediction.primary}</td>
                      <td className="p-2 text-right">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold ${
                          inc.sync_status === 'SYNCED' ? 'bg-greenBadge/10 text-greenBadge border border-greenBadge/30' :
                          inc.sync_status === 'FAILED' ? 'bg-panic/10 text-panic border border-panic/30' :
                          'bg-amberBadge/10 text-amberBadge border border-amberBadge/30 animate-pulse'
                        }`}>
                          {inc.sync_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Action triggers */}
          <div className="flex space-x-2 pt-1">
            <button
              onClick={triggerSync}
              disabled={syncing}
              className="flex-1 py-3 bg-tealAccent hover:bg-tealLight text-white font-extrabold text-xs rounded-lg border-2 border-charcoal shadow active:scale-95 transition-all flex items-center justify-center space-x-1.5"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              <span>SINKRONISASI SEKARANG</span>
            </button>
            
            <button
              onClick={() => {
                triggerHaptic(50);
                setNetworkStatus(networkStatus === 'online' ? 'offline' : 'online');
              }}
              className="px-3 py-3 border border-charcoal text-xs font-bold bg-primaryBg text-charcoal hover:bg-gray-100 rounded-lg"
              title="Simulasikan putus koneksi internet"
            >
              Simulasi {networkStatus === 'online' ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        </div>

        {/* Sync logs terminal */}
        {syncLogs.length > 0 && (
          <div className="bg-charcoal text-greenBadge p-3 rounded-xl font-mono text-[9px] space-y-1 shadow h-28 overflow-y-auto border border-gray-700">
            {syncLogs.map((log, idx) => (
              <div key={idx} className="leading-snug">
                {log}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
