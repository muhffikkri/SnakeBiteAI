import React, { useState, useEffect } from 'react';
import { db, getIncidentLog, addIncidentLog, type IncidentDetails } from '../db/db';
import { useAppStore } from '../store/store';
import { Camera, ShieldAlert, Award, Clock, Heart, Plus, Trash2, Volume2, CheckCircle2 } from 'lucide-react';

interface TriageProps {
  incidentId: string;
  onNavigate: (page: string) => void;
}

export default function Triage({ incidentId, onNavigate }: TriageProps) {
  const { currentGPS, updatePendingSyncCount } = useAppStore();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [biteLocation, setBiteLocation] = useState<string>('Tangan Kanan');
  const [biteTime, setBiteTime] = useState<string>(new Date().toISOString().substring(0, 16));
  
  // Local symptoms
  const [painScale, setPainScale] = useState<number>(5);
  const [swellingGrade, setSwellingGrade] = useState<number>(2);
  const [localEffects, setLocalEffects] = useState<string[]>([]);
  
  // Systemic symptoms
  const [systemicEffects, setSystemicEffects] = useState<string[]>([]);
  
  // Vital signs
  const [hr, setHr] = useState<number>(85);
  const [bp, setBp] = useState<string>('120/80');
  const [spo2, setSpo2] = useState<number>(98);

  // Wound photos blobs
  const [woundPhotos, setWoundPhotos] = useState<string[]>([]);
  
  // Severity output
  const [severityGrade, setSeverityGrade] = useState<number>(0);
  const [whoProtocol, setWhoProtocol] = useState<string[]>([]);
  const [alarmInterval, setAlarmInterval] = useState<number>(0);
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [alarmTimerSeconds, setAlarmTimerSeconds] = useState<number>(0);

  // Trigger haptic feedback
  const triggerHaptic = (duration: number) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration);
    }
  };

  // Symptoms choices
  const localEffectsChoices = [
    'Pendarahan Aktif', 'Nekrosis Kulit (Kulit Mati)', 'Lepuhan Cairan (Blisters)', 'Kebas/Mati Rasa Lokal'
  ];

  const neurotoxicChoices = [
    'Ptosis (Kelopak Mata Layu)', 'Sulit Menelan (Dysphagia)', 'Bicara Cadel (Dysarthria)', 'Kelemahan Otot/Kelumpuhan', 'Sesak Napas (Respiratory Failure)'
  ];

  const hemotoxicChoices = [
    'Muntah Darah (Hematemesis)', 'Gusi Berdarah', 'Memar Luas (Ecchymosis)', 'Kencing Merah (Hematuria)'
  ];

  // Load existing incident data if any
  useEffect(() => {
    const loadIncident = async () => {
      if (!incidentId) return;
      const data = await getIncidentLog(incidentId);
      if (data) {
        const { details, photos } = data;
        setBiteLocation(details.symptoms.bite_location);
        setPainScale(details.symptoms.pain_scale);
        setSwellingGrade(details.symptoms.swelling_grade);
        setLocalEffects(details.symptoms.local_effects);
        setSystemicEffects(details.symptoms.systemic_effects);
        setHr(details.symptoms.vital_signs.hr);
        setBp(details.symptoms.vital_signs.bp);
        setSpo2(details.symptoms.vital_signs.spo2);
        setWoundPhotos(photos);
      }
    };
    loadIncident();
  }, [incidentId]);

  // Calculate severity grade when inputs change
  useEffect(() => {
    let grade = 0;

    // Severity grade logic based on WHO clinical assessment rules
    const hasNeurotoxic = systemicEffects.some(e => neurotoxicChoices.includes(e));
    const hasHemotoxic = systemicEffects.some(e => hemotoxicChoices.includes(e));
    const hasSevereLocal = swellingGrade >= 3 || localEffects.includes('Nekrosis Kulit (Kulit Mati)');

    if (spo2 < 90 || systemicEffects.includes('Sesak Napas (Respiratory Failure)')) {
      grade = 4; // Life-threatening
    } else if (hasNeurotoxic || hasHemotoxic || swellingGrade === 4) {
      grade = 3; // Severe Systemic
    } else if (hasSevereLocal || localEffects.includes('Pendarahan Aktif')) {
      grade = 2; // Moderate Local/Systemic
    } else if (painScale > 4 || swellingGrade >= 1) {
      grade = 1; // Mild local
    } else {
      grade = 0; // No envenomation
    }

    setSeverityGrade(grade);

    // Build WHO aligned treatment protocol guidelines
    const protocol = [];
    protocol.push('IMOBILISASI: Lakukan imobilisasi segera pada ekstremitas yang digigit menggunakan papan/spal dan balut tekan (seperti menangani fraktur tulang). Ini memperlambat penyerapan racun.');
    protocol.push('Dilarang keras mengikat luka dengan Tourniquet / tali karena memicu nekrosis parah.');
    protocol.push('Dilarang menyedot bisa, menoreh luka, memijat, atau mengoleskan bahan kimia.');

    if (grade === 4) {
      protocol.unshift('CRITICAL (Grade 4): Segera beri ventilasi oksigen darurat & Resusitasi Jantung Paru (RJP) jika napas terhenti. Segera kirim ke ICU Rumah Sakit!');
    } else if (grade === 3) {
      protocol.unshift('DARURAT (Grade 3): Pasang akses infus IV ganda. Siapkan Anti-Bisa Ular (SABU) polivalen secepatnya dan pantau status pernapasan secara ketat.');
    } else if (grade === 2) {
      protocol.unshift('RISIKO MODERAT (Grade 2): Segera rujuk ke rumah sakit kabupaten. Pertimbangkan injeksi SABU jika gejala memburuk secara progresif.');
    } else if (grade === 1) {
      protocol.unshift('PEMANTAUAN (Grade 1): Bersihkan luka dengan antiseptik. Berikan analgesik non-NSAID (Parasetamol). Pantau pembengkakan berkala.');
    } else {
      protocol.unshift('Grade 0 (Nir-Envenomasi): Bersihkan luka. Observasi ketat di Puskesmas/RS selama minimal 6 jam untuk mengantisipasi keterlambatan timbulnya gejala.');
    }

    setWhoProtocol(protocol);

    // Set alarm intervals
    if (grade >= 3) {
      setAlarmInterval(15); // 15 min for severe cases
    } else if (grade >= 1) {
      setAlarmInterval(30); // 30 min for mild/moderate cases
    } else {
      setAlarmInterval(60); // 60 min for grade 0
    }

  }, [painScale, swellingGrade, localEffects, systemicEffects, spo2]);

  // Alarm simulation trigger
  useEffect(() => {
    let intervalId: any;
    if (alarmActive && alarmTimerSeconds > 0) {
      intervalId = setInterval(() => {
        setAlarmTimerSeconds(prev => {
          if (prev <= 1) {
            triggerAlarmFeedback();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (alarmTimerSeconds === 0 && alarmActive) {
      setAlarmActive(false);
    }
    return () => clearInterval(intervalId);
  }, [alarmActive, alarmTimerSeconds]);

  const triggerAlarmFeedback = () => {
    triggerHaptic(300);
    setTimeout(() => triggerHaptic(300), 500);

    // Play alarm sound using AudioContext
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (time: number, freq: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        gain.gain.setValueAtTime(0.3, time);
        osc.start(time);
        osc.stop(time + 0.15);
      };
      
      const now = audioCtx.currentTime;
      playBeep(now, 523.25); // C5
      playBeep(now + 0.2, 523.25);
      playBeep(now + 0.4, 659.25); // E5
    } catch (e) {
      console.log('AudioContext alarm error', e);
    }
  };

  const startSimulatedAlarm = () => {
    triggerHaptic(100);
    setAlarmTimerSeconds(10); // set 10 seconds mock timer for demo
    setAlarmActive(true);
  };

  const handleToggleLocalEffect = (effect: string) => {
    setLocalEffects(prev =>
      prev.includes(effect) ? prev.filter(x => x !== effect) : [...prev, effect]
    );
  };

  const handleToggleSystemicEffect = (effect: string) => {
    setSystemicEffects(prev =>
      prev.includes(effect) ? prev.filter(x => x !== effect) : [...prev, effect]
    );
  };

  const handleAddWoundPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          triggerHaptic(50);
          setWoundPhotos(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    triggerHaptic(50);
    setWoundPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAssessment = async () => {
    triggerHaptic(150);
    
    // Read current database state to make sure we persist species predictions from Step 2
    let existingLog = await getIncidentLog(incidentId);
    let species_prediction: IncidentDetails['species_prediction'] = {
      primary: 'Tidak Teridentifikasi',
      risk: 'NON-VENOMOUS',
      confidence: 0,
      alternatives: []
    };

    if (existingLog) {
      species_prediction = existingLog.details.species_prediction;
    }

    const updatedDetails: IncidentDetails = {
      gps_coordinates: {
        lat: currentGPS?.lat || -6.2088,
        lng: currentGPS?.lng || 106.8456,
        accuracy: currentGPS?.accuracy || 15,
        timestamp: Date.now()
      },
      species_prediction,
      severity_assessment: {
        grade: severityGrade,
        grade_history: existingLog 
          ? [...existingLog.details.severity_assessment.grade_history, { timestamp: Date.now(), grade: severityGrade }]
          : [{ timestamp: Date.now(), grade: severityGrade }],
        who_protocol: whoProtocol
      },
      symptoms: {
        bite_location: biteLocation,
        pain_scale: painScale,
        swelling_grade: swellingGrade,
        local_effects: localEffects,
        systemic_effects: systemicEffects,
        vital_signs: { hr, bp, spo2 }
      }
    };

    // Update in database (overwrite)
    await addIncidentLog(incidentId, updatedDetails, woundPhotos);
    await updatePendingSyncCount();

    // Show a success alert
    alert('Rekam Medis Triage disimpan di basis data lokal secara terenkripsi!');
    onNavigate('home');
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
          Triage Klinis WHO
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-4 flex-1 flex flex-col justify-start">
        {/* Progress steps bar */}
        <div className="flex items-center justify-between bg-white border border-charcoal/20 p-3 rounded-xl mb-4 text-xs font-bold text-gray-500 shadow-sm">
          <button 
            onClick={() => setCurrentStep(1)} 
            className={`pb-1 px-2 border-b-2 ${currentStep === 1 ? 'border-tealAccent text-tealAccent' : 'border-transparent'}`}
          >
            1. Konteks
          </button>
          <button 
            onClick={() => setCurrentStep(2)} 
            className={`pb-1 px-2 border-b-2 ${currentStep === 2 ? 'border-tealAccent text-tealAccent' : 'border-transparent'}`}
          >
            2. Luka Lokal
          </button>
          <button 
            onClick={() => setCurrentStep(3)} 
            className={`pb-1 px-2 border-b-2 ${currentStep === 3 ? 'border-tealAccent text-tealAccent' : 'border-transparent'}`}
          >
            3. Sistemik
          </button>
          <button 
            onClick={() => setCurrentStep(4)} 
            className={`pb-1 px-2 border-b-2 ${currentStep === 4 ? 'border-tealAccent text-tealAccent' : 'border-transparent'}`}
          >
            4. Protokol
          </button>
        </div>

        {/* Step 1: Context */}
        {currentStep === 1 && (
          <div className="bg-white border-2 border-charcoal rounded-xl p-4 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider border-b pb-1.5">
              1. Konteks & Waktu Gigitan
            </h2>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Lokasi Anatomi Gigitan:</label>
              <input
                type="text"
                value={biteLocation}
                onChange={e => setBiteLocation(e.target.value)}
                className="w-full p-2.5 border-2 border-charcoal rounded-lg text-sm font-medium focus:ring-2 focus:ring-tealAccent"
                placeholder="Misal: Kaki Kiri, Lengan Tangan Kanan"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 block">Waktu Gigitan Ular:</label>
              <input
                type="datetime-local"
                value={biteTime}
                onChange={e => setBiteTime(e.target.value)}
                className="w-full p-2.5 border-2 border-charcoal rounded-lg text-sm font-medium focus:ring-2 focus:ring-tealAccent"
              />
            </div>

            <div className="bg-primaryBg p-3 rounded-lg border border-charcoal/20">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Metode GPS Lokasi:</div>
              <p className="text-xs font-semibold text-charcoal mt-1">
                📍 {currentGPS ? `${currentGPS.lat.toFixed(5)}, ${currentGPS.lng.toFixed(5)} (Akurasi: ${currentGPS.accuracy}m)` : 'Tidak ada GPS'}
              </p>
            </div>

            <button
              onClick={() => { triggerHaptic(50); setCurrentStep(2); }}
              className="w-full py-3 bg-charcoal hover:bg-gray-800 text-white font-bold rounded-lg text-xs tracking-wider uppercase mt-4 flex items-center justify-center space-x-1"
            >
              <span>Lanjut ke Luka Lokal</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Step 2: Local wound signs */}
        {currentStep === 2 && (
          <div className="bg-white border-2 border-charcoal rounded-xl p-4 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider border-b pb-1.5">
              2. Asesmen Gejala Lokal
            </h2>

            {/* Pain Scale slider (VAS 1-10) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-600">Skala Nyeri (VAS 1-10):</label>
                <span className="text-sm font-bold text-panic">{painScale} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={painScale}
                onChange={e => setPainScale(Number(e.target.value))}
                className="w-full accent-panic cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-gray-400 font-semibold px-1">
                <span>Nir Nyeri</span>
                <span>Nyeri Sedang</span>
                <span>Nyeri Hebat</span>
              </div>
            </div>

            {/* Swelling Grade (0-4) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-600">Derajat Pembengkakan (Swelling):</label>
                <span className="text-sm font-bold text-tealAccent">Grade {swellingGrade}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => { triggerHaptic(50); setSwellingGrade(g); }}
                    className={`py-2 rounded-lg border text-center font-bold text-xs transition-all ${
                      swellingGrade === g
                        ? 'bg-tealAccent border-charcoal text-white font-extrabold shadow'
                        : 'border-gray-200 hover:border-charcoal'
                    }`}
                  >
                    G{g}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 italic leading-tight mt-1">
                {swellingGrade === 0 && 'G0: Tidak ada pembengkakan'}
                {swellingGrade === 1 && 'G1: Bengkak terbatas di sekitar luka gigitan'}
                {swellingGrade === 2 && 'G2: Bengkak menjalar ke separuh ekstremitas/anggota gerak'}
                {swellingGrade === 3 && 'G3: Bengkak menjalar ke seluruh ekstremitas'}
                {swellingGrade === 4 && 'G4: Bengkak meluas melewati ekstremitas ke arah tubuh utama'}
              </p>
            </div>

            {/* Local effects checklist */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 block">Efek Lokal Lainnya:</label>
              <div className="space-y-1.5">
                {localEffectsChoices.map(eff => (
                  <label
                    key={eff}
                    className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer text-xs font-medium ${
                      localEffects.includes(eff) ? 'border-charcoal bg-gray-50' : 'border-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={localEffects.includes(eff)}
                      onChange={() => handleToggleLocalEffect(eff)}
                      className="text-tealAccent focus:ring-tealAccent"
                    />
                    <span>{eff}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => { triggerHaptic(50); setCurrentStep(1); }}
                className="w-1/3 py-2.5 border border-charcoal font-bold rounded-lg text-xs bg-white text-charcoal uppercase tracking-wider"
              >
                Kembali
              </button>
              <button
                onClick={() => { triggerHaptic(50); setCurrentStep(3); }}
                className="w-2/3 py-2.5 bg-charcoal hover:bg-gray-800 text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center space-x-1"
              >
                <span>Lanjut ke Sistemik</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Systemic symptoms */}
        {currentStep === 3 && (
          <div className="bg-white border-2 border-charcoal rounded-xl p-4 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-charcoal uppercase tracking-wider border-b pb-1.5">
              3. Asesmen Gejala Sistemik & Tanda Vital
            </h2>

            {/* Neurotoxic checklist */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-panic font-extrabold uppercase tracking-wider">A. Efek Neurotoksik (Saraf):</span>
              <div className="grid grid-cols-1 gap-1.5">
                {neurotoxicChoices.map(nt => (
                  <label
                    key={nt}
                    className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer text-xs font-medium ${
                      systemicEffects.includes(nt) ? 'border-panic bg-panic/5' : 'border-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={systemicEffects.includes(nt)}
                      onChange={() => handleToggleSystemicEffect(nt)}
                      className="text-panic focus:ring-panic"
                    />
                    <span>{nt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hemotoxic checklist */}
            <div className="space-y-1.5 pt-2 border-t border-gray-100">
              <span className="text-[10px] text-amberBadge font-extrabold uppercase tracking-wider">B. Efek Hemotoksik (Darah/Pendarahan):</span>
              <div className="grid grid-cols-1 gap-1.5">
                {hemotoxicChoices.map(ht => (
                  <label
                    key={ht}
                    className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer text-xs font-medium ${
                      systemicEffects.includes(ht) ? 'border-amberBadge bg-amberBadge/5' : 'border-gray-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={systemicEffects.includes(ht)}
                      onChange={() => handleToggleSystemicEffect(ht)}
                      className="text-amberBadge focus:ring-amberBadge"
                    />
                    <span>{ht}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Vital signs */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="text-[10px] text-tealAccent font-extrabold uppercase tracking-wider">C. Tanda Vital Pasien:</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1 text-center">
                  <label className="text-[9px] text-gray-500 font-bold block">HR (bpm)</label>
                  <input
                    type="number"
                    value={hr}
                    onChange={e => setHr(Number(e.target.value))}
                    className="w-full text-center p-1.5 border border-charcoal rounded text-xs font-bold"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-[9px] text-gray-500 font-bold block">BP (mmHg)</label>
                  <input
                    type="text"
                    value={bp}
                    onChange={e => setBp(e.target.value)}
                    className="w-full text-center p-1.5 border border-charcoal rounded text-xs font-bold"
                  />
                </div>
                <div className="space-y-1 text-center">
                  <label className="text-[9px] text-gray-500 font-bold block">SpO2 (%)</label>
                  <input
                    type="number"
                    value={spo2}
                    onChange={e => setSpo2(Number(e.target.value))}
                    className="w-full text-center p-1.5 border border-charcoal rounded text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => { triggerHaptic(50); setCurrentStep(2); }}
                className="w-1/3 py-2.5 border border-charcoal font-bold rounded-lg text-xs bg-white text-charcoal uppercase tracking-wider"
              >
                Kembali
              </button>
              <button
                onClick={() => { triggerHaptic(50); setCurrentStep(4); }}
                className="w-2/3 py-2.5 bg-charcoal hover:bg-gray-800 text-white font-bold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center space-x-1"
              >
                <span>Hitung Skor WHO</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Severity score & protocols & alarms */}
        {currentStep === 4 && (
          <div className="space-y-4">
            {/* Severity Card */}
            <div className="bg-white border-2 border-charcoal rounded-xl overflow-hidden shadow-md">
              <div className="bg-charcoal text-[#F5F5F5] px-4 py-3 flex items-center justify-between border-b border-charcoal">
                <span className="text-xs font-extrabold uppercase tracking-wide">Hasil Stratifikasi Keparahan</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                  severityGrade >= 3 ? 'bg-panic' : 
                  severityGrade === 2 ? 'bg-amberBadge' : 'bg-greenBadge'
                }`}>
                  Grade {severityGrade}
                </span>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Visual indicator of severity */}
                <div className="flex items-center space-x-3 bg-primaryBg border border-charcoal/20 p-3 rounded-lg">
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                    severityGrade === 4 ? 'bg-panic animate-ping' :
                    severityGrade === 3 ? 'bg-panic' :
                    severityGrade === 2 ? 'bg-amberBadge' :
                    severityGrade === 1 ? 'bg-greenBadge' : 'bg-gray-400'
                  }`} />
                  <div>
                    <h3 className="text-sm font-bold text-charcoal uppercase">
                      {severityGrade === 0 && 'Nir-Envenomasi'}
                      {severityGrade === 1 && 'Envenomasi Ringan (Mild Local)'}
                      {severityGrade === 2 && 'Envenomasi Sedang (Moderate Local)'}
                      {severityGrade === 3 && 'Envenomasi Berat (Severe Systemic)'}
                      {severityGrade === 4 && 'Mengancam Jiwa (Life Threatening)'}
                    </h3>
                    <p className="text-[10px] text-gray-500 leading-none">Status Keparahan Berdasarkan Kriteria WHO</p>
                  </div>
                </div>

                {/* WHO Treatment Protocol */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-600 block">Protokol Penanganan Darurat:</span>
                  <div className="bg-charcoal text-white rounded-lg p-3 space-y-2 text-xs leading-relaxed font-medium">
                    {whoProtocol.map((line, idx) => {
                      const isWarning = line.includes('Dilarang') || line.includes('CRITICAL');
                      return (
                        <div key={idx} className={`p-1.5 rounded ${isWarning ? 'bg-panic/20 border border-panic/40 text-red-200' : 'text-gray-100'}`}>
                          {line}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active periodic assessment timer */}
                <div className="bg-primaryBg border border-charcoal/20 p-3 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-tealAccent" />
                    <div>
                      <span className="font-bold text-charcoal block leading-none">Alarm Re-Assessment:</span>
                      <span className="text-[10px] text-gray-500 font-semibold">Tiap {alarmInterval} menit (Klinis)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {alarmTimerSeconds > 0 ? (
                      <span className="font-mono font-bold text-panic text-base bg-white border border-charcoal px-2 py-0.5 rounded shadow-sm">
                        00:{alarmTimerSeconds.toString().padStart(2, '0')}
                      </span>
                    ) : (
                      <button
                        onClick={startSimulatedAlarm}
                        className="px-2 py-1.5 bg-tealAccent hover:bg-tealLight text-white text-[10px] font-bold rounded shadow active:scale-95 transition-all flex items-center space-x-1"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Simulasi (10s)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Periodic Wound Photography logging */}
            <div className="bg-white border-2 border-charcoal rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-1">
                  <Camera className="w-4 h-4 text-tealAccent" />
                  <span className="text-xs font-bold text-charcoal uppercase tracking-wider">Dokumentasi Klinis Luka Berkala</span>
                </div>
                <span className="text-[9px] text-gray-500 font-semibold">(Opsional)</span>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {woundPhotos.map((photo, index) => (
                  <div key={index} className="relative aspect-square border border-charcoal rounded bg-primaryBg overflow-hidden group">
                    <img src={photo} alt={`wound-${index}`} className="object-cover w-full h-full" />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-0.5 right-0.5 bg-panic text-white rounded-full p-0.5 hover:bg-red-800 transition-colors shadow"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-0 left-0 right-0 text-[8px] bg-charcoal/70 text-[#F5F5F5] py-0.5 text-center truncate">
                      Foto {index + 1}
                    </span>
                  </div>
                ))}
                
                {/* Photo add button */}
                <label className="aspect-square border-2 border-dashed border-charcoal/30 hover:border-charcoal/60 rounded flex flex-col items-center justify-center text-center cursor-pointer bg-primaryBg text-gray-500 transition-all">
                  <Plus className="w-6 h-6" />
                  <span className="text-[8px] font-bold mt-1">Tambah</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddWoundPhoto}
                    className="hidden"
                  />
                </label>
              </div>
              
              <p className="text-[9px] text-gray-400 italic text-center">
                Membantu melacak progresi pembengkakan / nekrosis visual saat serah terima di IGD.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => { triggerHaptic(50); setCurrentStep(3); }}
                className="w-1/3 py-3 border border-charcoal font-bold rounded-lg text-xs bg-white text-charcoal uppercase tracking-wider"
              >
                Kembali
              </button>
              <button
                onClick={handleSaveAssessment}
                className="w-2/3 py-3 bg-tealAccent hover:bg-tealLight text-white font-extrabold rounded-lg text-xs tracking-wider uppercase flex items-center justify-center space-x-1.5 shadow"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simpan Rekam Medis</span>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
