# Roadmap - Perubahan Selanjutnya (Future Changes)

Dokumen ini merangkum rencana pengembangan dan perubahan masa depan untuk proyek **SHIELD: SnakeBiteAI v2**.

---

## 🗺️ Peta Jalan Pengembangan (Roadmap)

### 1. Integrasi Model TensorFlow Lite (TFLite) Secara Lokal
Untuk menggantikan simulasi Edge-AI saat ini, model deteksi objek dan klasifikasi spesies ular akan diintegrasikan secara penuh di sisi klien menggunakan **TensorFlow.js (TF.js)** dengan backend **WebAssembly (WASM)** untuk memastikan performa yang cepat di perangkat Android berspesifikasi rendah (RAM < 4GB).
*   **Penyimpanan Model**: File model terkompresi (format `.tflite` atau graf terpartisi TF.js) akan diletakkan di direktori `/public/models/` agar dapat diunduh secara pasif oleh Service Worker dan disimpan dalam cache browser.
*   **Pipeline Eksekusi Lokal**:
    1.  Membaca citra dari kamera/galeri lalu melakukan transformasi ukuran (resize) menjadi tensor sesuai dimensi input model (misal: 224x224 atau 320x320).
    2.  Menjalankan klasifikasi menggunakan TF.js WASM runtime secara offline.
    3.  Menggabungkan nilai logits model visual dengan parameter spasial (Geospatial Fusion) secara dinamis sebelum menampilkan hasil prediksi akhir ke pengguna.

### 2. Pengisian Konten Realistis (Real Dataset)
Mengganti data tiruan (mock data) saat ini dengan data autentik yang merujuk pada keanekaragaman hayati Indonesia:
*   **Dataset Spesies Riil**: Mengisi database Dexie dengan informasi lengkap untuk seluruh **179 spesies ular** di Indonesia (termasuk *Elapidae*, *Viperidae*, dan *Colubridae* non-bisa).
*   **Parameter Spasial Riil**: Memasukkan parameter koordinat geografis pembatas habitat asli (`geo_bbox`) dan nilai statistik kepadatan spasial KDE (*Kernel Density Estimation*) riil hasil riset biologi/kesehatan untuk tiap-tiap provinsi.
*   **Detail Klinis**: Mengisi ciri-ciri morfologi konfirmasi riil, klasifikasi tipe bisa klinis, serta panduan spesifik penanganan pertolongan pertama (WHO guidelines) yang disesuaikan dengan jenis spesies ular tertentu.

### 3. Pemisahan Tampilan & Hak Akses Pengguna (Role Segregation)
Struktur navigasi dan antarmuka saat ini akan dipisah secara tegas berdasarkan peran pengguna (user roles) guna mempermudah penggunaan di lapangan dan administrasi di pusat:

#### A. Tampilan Pengguna Lapangan (End User / Field Worker)
*   **Fokus Utama**: Penyelamatan jiwa (Lifesaving).
*   **Alur Kerja**: Disederhanakan menjadi mode darurat langsung (Emergency Button), kamera identifikasi instan, pengisian triase gejala darurat, pemantauan vital signs berkala, dan rekam medis digital.
*   **Akses**: Tidak menampilkan dashboard peta nasional atau statistik agregat Kemenkes secara default untuk menghemat bandwidth data dan RAM.

#### B. Tampilan Pemerintah (Government / Administrator Dashboard)
*   **Fokus Utama**: Monitoring sebaran epidemiologi dan manajemen pasokan serum anti-bisa ular (SABU).
*   **Fitur**: Hanya memuat dashboard peta choropleth sebaran spasial nasional, visualisasi data statistik laporan gigitan ular, manajemen log sinkronisasi antrean data, dan pengaturan jaringan.
*   **Pembaruan Alur**: Menghapus seluruh tombol identifikasi ular via kamera dan triase medis pasien dari halaman utama atau navigasi utama dashboard pemerintah. Alur identifikasi dan triase tidak akan dapat diakses oleh akun dengan level otoritas pemerintah ini demi efisiensi kerja.
