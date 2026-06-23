# SHIELD: SnakeBiteAI v2

**SHIELD: SnakeBiteAI v2** adalah aplikasi web progresif (Progressive Web Application - PWA) berbasis *Mobile-First* & *Offline-First* yang dirancang sebagai Sistem Pendukung Keputusan Klinis (Clinical Decision Support System - CDSS) untuk penanganan gigitan ular di wilayah lapangan bersumber daya rendah (seperti daerah pelosok Indonesia dengan RAM < 4GB dan koneksi internet tidak stabil).

---

## 🌟 Fitur Utama

- **100% Offline-Ready & Client-Side Operation**: Seluruh operasi identifikasi, triase, enkripsi, dan penyimpanan data berjalan langsung di browser tanpa ketergantungan pada koneksi internet konstan.
- **Edge-AI Identifikasi Ular**: Menjalankan pipeline inferensi klasifikasi spesies ular di sisi klien secara lokal (simulasi YOLO26l + ConvNeXt-Large embeddings + Geospatial Fusion).
- **Enkripsi At-Rest (Keamanan Data Medis)**: Mengamankan data rekam medis pasien dan foto luka menggunakan enkripsi **AES-256-GCM** tingkat militer dengan kunci derivasi PBKDF2 (100.000 iterasi) secara lokal melalui native **Web Crypto API**.
- **Tombol Darurat (Emergency Button)**: Aksi cepat satu tombol untuk mengunci koordinat GPS satelit, memainkan alarm suara, memicu getaran haptic, menyimpan log darurat instan, dan masuk ke menu triase medis.
- **Triage Sesuai Protokol WHO**: Formulir bertahap untuk penilaian keparahan envenomasi secara dinamis (Grade 0–4) disertai panduan pertolongan pertama berbasis panduan Organisasi Kesehatan Dunia (WHO).
- **Peta Choropleth Kemenkes & Delayed Sync**: Visualisasi sebaran taksa spesies ular di 34 provinsi menggunakan Leaflet.js dan sinkronisasi batch tertunda (`/api/v2/incidents/batch`) secara otomatis ketika jaringan pulih.

---

## 🏗️ Arsitektur Proyek

Aplikasi ini dibangun menggunakan arsitektur **Hybrid Layered-MVVM** (Model-View-ViewModel):
- **View (UI Layer)**: React 18 (TypeScript) dengan Tailwind CSS untuk styling responsif berkinerja tinggi serta ikonografi dari Lucide React.
- **ViewModel (State Management)**: Zustand hooks untuk sinkronisasi state global yang reaktif (seperti status GPS, mode autentikasi, status jaringan, dan antrean sinkronisasi).
- **Model & Database (Data Layer)**: Dexie.js (IndexedDB wrapper) untuk penyimpanan database lokal yang cepat dan andal.
- **Security & Services**: Web Crypto API untuk manajemen enkripsi/dekripsi end-to-end secara offline.

---

## 🛠️ Persyaratan & Instalasi

Pastikan Anda telah menginstal **Node.js** di lingkungan lokal Anda.

### 1. Instalasi Dependensi
Jalankan perintah berikut di direktori proyek:
```bash
npm install
```

### 2. Jalankan Mode Pengembangan (Local Dev Server)
Jalankan perintah untuk memulai Vite server:
```bash
npm run dev
```
Buka peramban (browser) di alamat [http://localhost:5173/](http://localhost:5173/).

### 3. Kompilasi Produksi (Production Build)
Untuk melakukan kompilasi versi produksi:
```bash
npm run build
```
Hasil kompilasi akan berada di folder `/dist/`.

---

## 🛡️ Identitas Brand & Aksesibilitas (a11y)
Aplikasi ini menerapkan standar warna kontras tinggi (sesuai WCAG 2.1 AA) untuk kemudahan keterbacaan di lapangan terbuka:
- **Primary Background**: `#F5F5F5` (Abu-abu Terang)
- **Secondary Container/Text**: `#1E1E1E` (Charcoal)
- **Tertiary Accent/Panic**: `#70020F` (Crimson Gelap untuk bahaya klinis)
- **Information Accents**: `#2E7D6F` (Teal) & `#5A9A8F` (Teal Terang)
- **Interactive Targets**: Minimum ukuran tombol interaktif 48x48 dp untuk ergonomi sentuhan jempol yang optimal.
