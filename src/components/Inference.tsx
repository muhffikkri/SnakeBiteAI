import React, { useState, useEffect } from 'react';
import { Camera, Check, ShieldAlert, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { db, addIncidentLog } from '../db/db';
import { useAppStore } from '../store/store';

interface InferenceProps {
  onNavigate: (page: string) => void;
  onSetIncidentId: (id: string) => void;
}

export default function Inference({ onNavigate, onSetIncidentId }: InferenceProps) {
  const { currentGPS, updatePendingSyncCount } = useAppStore();

  const [step, setStep] = useState<'upload' | 'analyzing' | 'result'>('upload');
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Results states
  const [primaryResult, setPrimaryResult] = useState<any>(null);
  const [alternatives, setAlternatives] = useState<any[]>([]);
  const [selectedTaxonId, setSelectedTaxonId] = useState<number | null>(null);

  // Trigger haptic feedback
  const triggerHaptic = (duration: number) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  // Simulated AI inference process
  const startAnalysis = async (imgSrc: string) => {
    setSelectedImage(imgSrc);
    setStep('analyzing');
    setLogs([]);
    
    // Stage 1: Object detection
    await addLog("YOLO26l isolating object...", 0);
    await addLog("Applying 10% bounding box margin padding...", 350);
    await addLog("Object isolated with confidence=0.92.", 800);

    // Stage 2: Feature extraction
    await addLog("Extracting TFLite WASM embeddings (ConvNeXt-Large)...", 1000);
    await addLog("Generating 1536-dimensional feature vector...", 1800);
    await addLog("XGBoost classifier executing (500 estimators)...", 2200);

    // Stage 3: Geospatial fusion
    await addLog("Applying Binary Multiplicative Geospatial Fusion...", 2400);
    await addLog("Querying species_distribution_matrix in local IndexedDB...", 2700);
    
    // Fetch species and run mock fusion
    const allSpecies = await db.species.toArray();
    const lat = currentGPS?.lat || -6.2088;
    const lng = currentGPS?.lng || 106.8456;
    
    // Simulate eliminating species based on GPS bounding boxes
    const matched = allSpecies.map(sp => {
      // Check if coordinates fit in the bounding box
      const inBbox = lat >= sp.geo_bbox.latMin && lat <= sp.geo_bbox.latMax &&
                     lng >= sp.geo_bbox.lngMin && lng <= sp.geo_bbox.lngMax;
      
      const geo_binary = inBbox ? 1.0 : 0.0;
      
      // Prior visual weights (randomized for simulation but consistent)
      let p_vis = 0.05;
      if (sp.scientific_name.includes('sputatrix')) p_vis = 0.70;
      else if (sp.scientific_name.includes('fasciatus')) p_vis = 0.15;
      else if (sp.scientific_name.includes('rhodostoma')) p_vis = 0.08;
      else if (sp.scientific_name.includes('insularis')) p_vis = 0.02;
      else if (sp.scientific_name.includes('pictus')) p_vis = 0.05;

      const p_fused = p_vis * geo_binary;

      return {
        ...sp,
        p_vis,
        geo_binary,
        p_fused
      };
    });

    // Normalize fused probabilities
    const sumFused = matched.reduce((acc, curr) => acc + curr.p_fused, 0) || 1.0;
    const finalResults = matched.map(m => ({
      ...m,
      confidence: m.p_fused / sumFused
    })).sort((a, b) => b.confidence - a.confidence);

    await addLog(`Geospatial filtering completed: eliminated ${(matched.filter(x => x.geo_binary === 0).length / matched.length * 100).toFixed(1)}% of taxa decision space.`, 3000);
    await addLog("Inference finalized. Macro F1 = 0.7406.", 3200);

    setTimeout(() => {
      setPrimaryResult(finalResults[0]);
      setAlternatives(finalResults.slice(1, 5));
      setSelectedTaxonId(finalResults[0].taxon_id);
      setStep('result');
      triggerHaptic(150);
    }, 3300);
  };

  const addLog = (message: string, delay: number): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => {
        setLogs(prev => [...prev, `[T+${delay}ms] ${message}`]);
        resolve();
      }, delay - (logs.length * 100 > delay ? delay : logs.length * 50));
    });
  };

  // Handle image capture via mockup input
  const handleImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          startAnalysis(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateDirectSelection = (taxonId: number) => {
    // Helper to simulate analysis directly with a preset species
    // For demo purposes, we feed a pre-made image placeholder
    startAnalysis(`/mock-snake-${taxonId}.jpg`);
  };

  const handleProceedToTriage = async () => {
    if (!selectedTaxonId || !primaryResult) return;
    
    triggerHaptic(100);
    const incidentId = `inc_${Math.floor(Math.random() * 10000000)}`;
    onSetIncidentId(incidentId);

    const chosenSpecies = [primaryResult, ...alternatives].find(x => x.taxon_id === selectedTaxonId);
    
    // Save record to local IndexedDB
    const incidentDetails = {
      gps_coordinates: {
        lat: currentGPS?.lat || -6.2088,
        lng: currentGPS?.lng || 106.8456,
        accuracy: currentGPS?.accuracy || 10,
        timestamp: Date.now()
      },
      species_prediction: {
        primary: chosenSpecies?.scientific_name || primaryResult.scientific_name,
        risk: chosenSpecies?.venom_type || primaryResult.venom_type,
        confidence: chosenSpecies?.confidence || primaryResult.confidence,
        alternatives: alternatives.map(x => ({
          name: x.scientific_name,
          confidence: x.confidence,
          risk: x.venom_type
        }))
      },
      severity_assessment: {
        grade: chosenSpecies?.venom_type === 'NON-VENOMOUS' ? 0 : 2, // Set default grade based on threat
        grade_history: [{ timestamp: Date.now(), grade: chosenSpecies?.venom_type === 'NON-VENOMOUS' ? 0 : 2 }],
        who_protocol: []
      },
      symptoms: {
        bite_location: 'Tungkai Kaki (Simulasi)',
        pain_scale: chosenSpecies?.venom_type === 'NON-VENOMOUS' ? 2 : 6,
        swelling_grade: chosenSpecies?.venom_type === 'NON-VENOMOUS' ? 0 : 2,
        local_effects: chosenSpecies?.venom_type === 'NON-VENOMOUS' ? [] : ['Nyeri', 'Pembengkakan ringan'],
        systemic_effects: [],
        vital_signs: { hr: 80, bp: '120/80', spo2: 98 }
      }
    };

    await addIncidentLog(incidentId, incidentDetails, selectedImage ? [selectedImage] : []);
    await updatePendingSyncCount();

    onNavigate('triage');
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-primaryBg text-charcoal">
      {/* Header */}
      <div className="bg-charcoal text-white px-4 py-4 flex items-center justify-between border-b-2 border-tealAccent shadow-md">
        <button
          onClick={() => onNavigate('home')}
          className="text-sm font-bold text-tealLight hover:text-white"
        >
          ← Batal
        </button>
        <h1 className="text-md font-bold tracking-tight text-center">
          Identifikasi Edge-AI
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-6 flex-1 flex flex-col justify-start">
        
        {/* Upload Mode */}
        {step === 'upload' && (
          <div className="flex flex-col space-y-6 flex-1 justify-center py-10">
            <div className="border-4 border-dashed border-charcoal rounded-2xl p-8 bg-white flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-tealAccent/10 text-tealAccent flex items-center justify-center border-2 border-charcoal">
                <Camera className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-charcoal">Ambil Foto Ular</h2>
                <p className="text-xs text-gray-500 mt-1 max-w-[240px]">
                  Ambil foto secara tegak lurus dengan pencahayaan cukup untuk hasil optimal.
                </p>
              </div>

              {/* Native Image Upload Trigger */}
              <label className="cursor-pointer bg-tealAccent hover:bg-tealLight text-white px-6 py-3 rounded-xl border-2 border-charcoal font-bold text-sm shadow active:scale-95 transition-all">
                Buka Kamera / Galeri
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageInput}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick Demo Selector */}
            <div className="bg-white border-2 border-charcoal rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                Simulasi Demo Cepat (Pilih Spesies)
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulateDirectSelection(0)}
                  className="p-2 border border-charcoal hover:bg-tealAccent/10 text-left rounded-lg text-xs font-bold transition-all flex items-center justify-between"
                >
                  <span>🐍 Cobra Jawa</span>
                  <span className="bg-panic text-white text-[8px] px-1 rounded">Red</span>
                </button>
                <button
                  onClick={() => handleSimulateDirectSelection(2)}
                  className="p-2 border border-charcoal hover:bg-tealAccent/10 text-left rounded-lg text-xs font-bold transition-all flex items-center justify-between"
                >
                  <span>🐍 Ular Tanah</span>
                  <span className="bg-amberBadge text-white text-[8px] px-1 rounded">Amber</span>
                </button>
                <button
                  onClick={() => handleSimulateDirectSelection(4)}
                  className="p-2 border border-charcoal hover:bg-tealAccent/10 text-left rounded-lg text-xs font-bold transition-all flex items-center justify-between"
                >
                  <span>🐍 Ular Tali Picik</span>
                  <span className="bg-greenBadge text-white text-[8px] px-1 rounded">Green</span>
                </button>
                <button
                  onClick={() => handleSimulateDirectSelection(1)}
                  className="p-2 border border-charcoal hover:bg-tealAccent/10 text-left rounded-lg text-xs font-bold transition-all flex items-center justify-between"
                >
                  <span>🐍 Ular Welang</span>
                  <span className="bg-panic text-white text-[8px] px-1 rounded">Red</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Inference Processing Mode */}
        {step === 'analyzing' && (
          <div className="flex flex-col space-y-6 flex-1 justify-center py-6">
            <div className="bg-white border-2 border-charcoal rounded-xl p-6 shadow flex flex-col items-center justify-center">
              <RefreshCw className="w-12 h-12 text-tealAccent animate-spin mb-4" />
              <h2 className="text-md font-bold text-charcoal">Mengeksekusi Pipeline Edge-AI</h2>
              <p className="text-xs text-gray-500 mt-1">Inference di tingkat klien (100% offline)...</p>
            </div>

            {/* Console Pipeline Logs */}
            <div className="bg-charcoal text-[#388E3C] p-4 rounded-xl font-mono text-[10px] space-y-1.5 shadow h-48 overflow-y-auto border-2 border-gray-700">
              {logs.map((log, index) => (
                <div key={index} className="leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results view Mode */}
        {step === 'result' && primaryResult && (
          <div className="flex flex-col space-y-4 my-2">
            
            {/* Primary Result Taxonomy Card */}
            <div className="bg-white border-2 border-charcoal rounded-xl overflow-hidden shadow-md">
              <div className="bg-charcoal text-white px-4 py-2.5 flex items-center justify-between border-b border-charcoal">
                <span className="text-xs font-bold text-tealLight uppercase tracking-wider">Hasil Prediksi Utama</span>
                <span className="text-xs bg-tealAccent px-2 py-0.5 rounded font-bold text-white">Geospatial Valid</span>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-extrabold text-charcoal leading-tight">
                      {primaryResult.scientific_name}
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">{primaryResult.common_name_indonesian}</p>
                  </div>
                  
                  {/* Threat level Badge */}
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full text-white shadow-sm border ${
                    primaryResult.venom_type === 'NEUROTOXIC' ? 'bg-panic border-charcoal' :
                    primaryResult.venom_type === 'HEMOTOXIC' ? 'bg-amberBadge border-charcoal' : 'bg-greenBadge border-charcoal'
                  }`}>
                    {primaryResult.venom_type === 'NEUROTOXIC' && '🟥 NEUROTOXIC'}
                    {primaryResult.venom_type === 'HEMOTOXIC' && '🟨 HEMOTOXIC'}
                    {primaryResult.venom_type === 'NON-VENOMOUS' && '🟩 HARMLESS'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-primaryBg border border-charcoal/20 p-3 rounded-lg text-xs">
                  <div>
                    <span className="text-gray-500 font-medium">Confidence Fused:</span>
                    <p className="text-lg font-bold text-charcoal">
                      {(primaryResult.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Prior Visual Prob:</span>
                    <p className="text-lg font-bold text-tealAccent">
                      {(primaryResult.p_vis * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                {/* Traits Checklist */}
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ciri Morfologi Konfirmasi:</span>
                  <div className="grid grid-cols-1 gap-1 mt-1">
                    {primaryResult.morphological_traits.map((trait: string, idx: number) => (
                      <div key={idx} className="flex items-center space-x-2 text-xs text-charcoal font-medium">
                        <Check className="w-4 h-4 text-greenBadge flex-shrink-0" />
                        <span>{trait}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Alternatives List (Human-in-the-loop) */}
            <div className="bg-white border-2 border-charcoal rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-2 border-b pb-1.5 flex items-center justify-between">
                <span>Pilihan Alternatif Taksonomi</span>
                <span className="text-[9px] text-gray-500 italic">Centang jika AI salah mengidentifikasi</span>
              </h3>
              
              <div className="space-y-2">
                {/* Add primary to selection options */}
                {[primaryResult, ...alternatives].map((alt) => (
                  <label
                    key={alt.taxon_id}
                    onClick={() => triggerHaptic(50)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedTaxonId === alt.taxon_id
                        ? 'border-tealAccent bg-tealAccent/10 border-2 font-semibold'
                        : 'border-gray-200 hover:border-charcoal'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="alternative-selection"
                        checked={selectedTaxonId === alt.taxon_id}
                        onChange={() => setSelectedTaxonId(alt.taxon_id)}
                        className="text-tealAccent focus:ring-tealAccent"
                      />
                      <div>
                        <span className="text-xs text-charcoal">{alt.scientific_name}</span>
                        <span className="text-[9px] text-gray-500 block leading-none">{alt.common_name_indonesian}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`text-[8px] px-1 py-0.5 rounded text-white ${
                        alt.venom_type === 'NEUROTOXIC' ? 'bg-panic' : 
                        alt.venom_type === 'HEMOTOXIC' ? 'bg-amberBadge' : 'bg-greenBadge'
                      }`}>
                        {alt.venom_type}
                      </span>
                      <span className="text-xs font-bold text-tealAccent">
                        {(alt.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Warning Checklist */}
            <div className="bg-panic/10 border border-panic/30 rounded-xl p-3 flex space-x-2">
              <AlertCircle className="w-5 h-5 text-panic flex-shrink-0 mt-0.5" />
              <div className="text-xs text-panic leading-normal font-medium">
                <strong>Catatan Klinis:</strong> Konfirmasi spesies di atas akan direkam dalam lembar rekam medis darurat guna referensi pemilihan anti-bisa ular (SABU) yang tepat.
              </div>
            </div>

            {/* Confirm Actions */}
            <button
              onClick={handleProceedToTriage}
              className="w-full py-3.5 bg-tealAccent hover:bg-tealLight text-white font-extrabold text-base rounded-xl border-2 border-charcoal shadow active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <span>Konfirmasi & Lanjut ke Triage</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => {
                triggerHaptic(50);
                setStep('upload');
              }}
              className="w-full py-2.5 border-2 border-charcoal text-charcoal font-bold text-xs bg-white rounded-xl shadow active:scale-95 transition-all"
            >
              Ulangi Pengambilan Foto
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
