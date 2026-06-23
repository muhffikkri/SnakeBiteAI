import { create } from 'zustand';
import { db } from '../db/db';

interface GPSData {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

interface AppState {
  currentGPS: GPSData | null;
  networkStatus: 'online' | 'offline';
  authMode: 'GUEST' | 'SECURE';
  modelLoadStatus: 'unloaded' | 'loading' | 'ready';
  pendingSyncCount: number;
  
  setGPS: (gps: GPSData | null) => void;
  setNetworkStatus: (status: 'online' | 'offline') => void;
  setAuthMode: (mode: 'GUEST' | 'SECURE') => void;
  setModelLoadStatus: (status: 'unloaded' | 'loading' | 'ready') => void;
  updatePendingSyncCount: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  currentGPS: null,
  networkStatus: navigator.onLine ? 'online' : 'offline',
  authMode: 'GUEST',
  modelLoadStatus: 'unloaded',
  pendingSyncCount: 0,

  setGPS: (gps) => set({ currentGPS: gps }),
  setNetworkStatus: (status) => set({ networkStatus: status }),
  setAuthMode: (mode) => set({ authMode: mode }),
  setModelLoadStatus: (status) => set({ modelLoadStatus: status }),
  
  updatePendingSyncCount: async () => {
    try {
      const count = await db.incidents.where('sync_status').equals('PENDING').count();
      set({ pendingSyncCount: count });
    } catch (e) {
      console.error('Failed to query pending sync count:', e);
    }
  }
}));
