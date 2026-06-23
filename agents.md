# AI Agent Instructions - SHIELD: SnakeBiteAI v2

You are an expert mHealth and Edge-AI system developer agent. Your goal is to construct the "SHIELD: SnakeBiteAI v2" Progressive Web Application (PWA) exactly according to the strict constraints, architecture schemas, and core specifications defined below.

## 1. Core Technical Constraints
- Approach: Mobile-First & Offline-First Native.
- Architecture: Hybrid Layered-MVVM (React 18 TypeScript + Zustand state hooks).
- Target Hardware Context: Low-resource Android fields (RAM < 4GB, unstable/no internet).
- Core Offline Data Access: 100% Client-side operation via Workbox Service Workers and local IndexedDB (Dexie.js abstraction layer).

## 2. Brand Identity & Accessibility Standards (a11y)
You MUST strictly implement the following high-contrast color codes:
- Primary Background: `#F5F5F5` (Light Grey for layout background)
- Secondary Container/Text: `#1E1E1E` (Charcoal for primary text, boundaries, and headers)
- Tertiary Accent/Panic: `#70020F` (Deep Crimson for critical triggers and High Danger indicators)
- Information Accents: `#2E7D6F` (Teal for layout highlights and maps), `#5A9A8F` (Teal Light)
- Clinical Risks badges: `#F57C00` (Amber for Moderate Risk), `#388E3C` (Green for Low Risk)

Accessibility Compliance (WCAG 2.1 AA) Rules:
- Minimum interactive touch targets MUST be at least 48 x 48 dp.
- All interactive components require semantic HTML5 landmarks and descriptive `aria-label` fields.
- Provide subtle haptic feedback triggers (vibrate 200-300ms via `navigator.vibrate`) on critical actions.

## 3. UI Flow & State Logic Mapping

### Page 1: Home Screen (Action-Focused & Geospasial Aware)
- Top Section: Persistent Connectivity Banner reading "🟢 OFFLINE READY" if internet drops. Include an Authentication Toggle to swap between Guest Mode (No login) and Secure Mode (Government dashboard active).
- Hero Area (Thumb-Zone Optimized):
  * Primary Button: Large center-aligned circular interactive icon for "📸 IDENTIFIKASI ULAR VIA EDGE-AI".
  * Emergency Button: Placed directly underneath using Tertiary Color (`#70020F`) animated with a 1 Hz pulsing glow. Label: "🚨 TOMBOL DARURAT". Clicking it captures a satelite-only hardware GPS lock, stores the data inside the `Incident_History_Log`, and triggers navigation to Page 3.
- Bottom Section Widget ("Kemungkinan Ular di Lokasi Anda"): Queries local province data based on current coordinates to render a horizontal carousel of local snake species cards featuring localized KDE confidence rates.

### Page 2: TensorFlow.js Edge Inference Mockup & Refinement
- Trigger a sequential loading state simulator matching the architecture pipeline logs: (1) "YOLO26l isolating object...", (2) "Extracting TFLite WASM embeddings...", (3) "Applying Binary Multiplicative Geospatial Fusion...".
- Primary result view must return species taxonomy cards flagged by threat levels (Neurotoxic Red / Hemotoxic Amber / Harmless Green) with recalculating traits checkpoints.

### Page 3: Triage & Periodic Wound Logging
- Implement a step-by-step modular questionnaire recording bite timestamps and local/systemic reactions.
- Conclude with clear WHO handling practices (Immobilization highlighted, Red alert banning Tourniquets).
- Provide an OPTIONAL "Ambil Foto Luka" action button to log chronological baseline blobs over time to the localized storage engine[cite: 3].

### Page 4: Government Dashboard & Delayed Sync
- Load Leaflet.js rendering localized GeoJSON choropleth layers[cite: 3]. Color codes: High (>80 taxa) uses `#2E7D6F`, Medium (40-80) uses `#5A9A8F`, Low (<40) uses `#A8C5BC`[cite: 3].
- Simulate a Node.js Express REST environment sync log to demonstrate how pending JSON batches and multipart picture logs automatically fire onto `/api/v2/incidents/batch` once network availability resets[cite: 3].