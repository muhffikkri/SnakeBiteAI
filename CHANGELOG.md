# Changelog - SHIELD: SnakeBiteAI v2

Dokumen ini berisi informasi mengenai riwayat rilis, fitur saat ini, dan mekanisme awal yang telah diterapkan pada proyek **SHIELD: SnakeBiteAI v2**.

---

## [2.0.0] - Initial Setup & Core CDSS Flow (2026-06-23)

### 1. Apa Saja Yang Sudah Dibuat
*   **Kerangka Dasar Web PWA**: Setup Vite, TypeScript, React 18, Tailwind CSS, dan konfigurasi PostCSS.
*   **Database IndexedDB Lokal (Dexie.js)**: Skema database offline-ready untuk menyimpan data taksonomi spesies (`species`) dan data insiden rekam medis pasien (`incidents`).
*   **Enkripsi Klien AES-256-GCM**: Implementasi modul enkripsi asimetris/simetris lokal menggunakan native browser **Web Crypto API** (tidak ada pengiriman teks polos data sensitif pasien).
*   **State Management (Zustand)**: Mengintegrasikan global state store untuk mengontrol status konektivitas, pembacaan GPS internal, mode autentikasi, status load model AI, dan antrean sync.
*   **4 Halaman Flow Terintegrasi**:
    1.  **Home Screen (Beranda)**: Hub aksi cepat, widget berbasis geo-spasial, dan tombol darurat.
    2.  **Inference (Identifikasi AI)**: Pipeline log inferensi simulasi dan seleksi taksonomi *human-in-the-loop*.
    3.  **Triage (Triase Medis)**: Formulir rekam medis gigitan ular, baseline foto luka, dan penentu tingkat keparahan dinamis.
    4.  **Dashboard & Sync**: Peta sebaran spasial interaktif dan delayed background sync log terminal.

### 2. Fitur Saat Ini
*   **🟢 Offline Ready Banner**: Menampilkan status koneksi jaringan (`online`/`offline`) secara real-time. Jika offline, banner berubah menjadi pulsing "🟢 OFFLINE READY".
*   **🚨 Tombol Darurat Instan**: Pemicu aksi satu sentuhan yang memberikan getaran kuat (300ms), membunyikan alarm audio lewat `AudioContext`, membuat rekam medis darurat otomatis dengan koordinat satelit akurasi tinggi (5 meter), dan mengarahkan pengguna ke halaman triase.
*   **📍 Geo-Awareness Widget**: Menghitung estimasi persentase kemunculan spesies ular secara real-time di sekitar lokasi pengguna berdasarkan koordinat GPS pasif dengan integrasi pembagian provinsi (DKI Jakarta, Jawa Barat, Jawa Timur, Bali).
*   **🧠 Edge Inference Pipeline Simulator**: Mensimulasikan pipeline deteksi objek YOLO26l, ekstraksi embedding ConvNeXt-Large, dan integrasi probabilitas spasial (Geospatial Fusion) menggunakan perkalian matriks biner koordinat lintang/bujur.
*   **🩺 Dynamic Severity Assessment (Triage)**: Mengkalkulasi derajat keparahan gigitan ular (Grade 0–4) secara instan berdasarkan input gejala lokal dan sistemik (ptosisi, disfagia, hematemesis, dll.) sesuai pedoman klinis WHO.
*   **⏰ Vital Signs Periodic Alarm**: Penghitung waktu mundur (timer 10 detik untuk demonstrasi) yang memicu getaran berkala dan audio alarm untuk memperingatkan petugas medis agar mengecek ulang tanda-tanda vital pasien (HR, BP, SpO2).
*   **📸 Baseline Wound Photo Logger**: Fitur mengambil/mengunggah foto luka gigitan ular yang disimpan secara lokal ke dalam IndexedDB dengan enkripsi data-at-rest.
*   **🗺️ Leaflet.js Choropleth Map**: Menampilkan visualisasi spasial 34 provinsi dengan 3 level populasi taksa ular: Tinggi (`#2E7D6F`), Sedang (`#5A9A8F`), dan Rendah (`#A8C5BC`).
*   **🔄 Delayed Background Sync Terminal**: Simulasi pengiriman data tertunda yang menampung antrean JSON lokal terenkripsi dan multipart foto luka, kemudian mengirimkannya ke endpoint `/api/v2/incidents/batch` setelah mendeteksi koneksi pulih.

### 3. Mekanisme Awal
*   **MVVM Architecture**: UI (React Components) melakukan interaksi ke State Store (Zustand) dan Database Helper (Dexie.ts). Aliran data terorganisasi rapi sehingga logika bisnis terpisah dari elemen visual.
*   **Local Cryptography**: Setiap rekam medis pasien dienkripsi sebelum ditulis ke IndexedDB menggunakan AES-GCM dengan kunci derivasi lokal dari kata sandi tersembunyi perangkat yang diperkuat PBKDF2. Foto luka disimpan dalam format Base64 terenkripsi.
*   **Geospatial Fusion**: Menggunakan perkalian probabilitas visual (output AI kamera) dengan kecocokan koordinat geografis terhadap bounding box sebaran alami spesies ular (`geo_bbox`) untuk mengeleminasi bias identifikasi ular di luar habitat aslinya.
