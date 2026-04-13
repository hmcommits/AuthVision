# AuthVision: Master Project Plan & Roadmap (2026)

**AuthVision** is a hybrid Edge-to-Cloud image forensics platform designed for absolute accuracy and explainability. It leverages local WebAssembly math and a "Frontier Council" of the world’s most powerful AI models to detect deepfakes in under 9 seconds.

---

## 🛠️ The Tech Stack
* **Frontend:** React 19, Tailwind CSS 4, TypeScript (Vite).
* **Edge Engine:** AssemblyScript (WASM) + SIMD-128 for 2D-FFT.
* **Backend:** Spring Boot 4.0.4 (Java 21), Project Loom (Virtual Threads).
* **Persistence:** MongoDB Atlas (pHash + TTL Indexing).
* **Intelligence:** Gemini 3.1 Pro (Primary), Claude 4.6 Opus (Specialist), Llama 4 Maverick (Emergency).
* **Signature Detection:** Google SynthID, C2PA Metadata, W-ENv4 CNN.

---

## 🛰️ Architecture: The Triple-Shield Defense



### **Shield 1: Math Shield (Local Edge)**
* **Objective:** Immediate mathematical verification.
* **Action:** Runs 2D-FFT in the browser to find "Spectral Ghosts."
* **Optimization:** Generates **Forensic Hints** (X,Y coordinates of noise spikes) to guide the cloud models.

### **Shield 2: Signature Shield (Cloud Fast-Pass)**
* **Objective:** Instant ID of known AI sources.
* **Action:** Scans for **SynthID**, **C2PA Metadata**, and **Steganographic Watermarks**.
* **Optimization:** Triggers "Reverse Forensic Audit" (RFA) if a signature is found.

### **Shield 3: Logic Shield (Deep Reasoning)**
* **Objective:** High-level physical and anatomical audit.
* **Action:** A parallel "race" between **Gemini 3.1 Pro** and **Claude 4.6 Opus**.
* **Optimization:** Tiled inference focusing on WASM-hinted areas; results streamed via **SSE**.

---

## 🗺️ Execution Roadmap

### **Phase 1: Foundation & Edge Logic (COMPLETED)**
* [x] Monorepo scaffold (React + Spring Boot).
* [x] Glassmorphic UI & Upload Zone.
* [x] WASM NanoCore (FFT Kernel) implementation.

### **Phase 2: The Alignment & Persistence (CURRENT)**
* [ ] **WASM Coordinate Hinting:** Update NanoCore to export [X,Y] anomaly maps.
* [ ] **pHash Strategy:** Implement MongoDB persistence with 7-day TTL (Auto-cleanup).
* [ ] **Type Synchronization:** Align Frontend/Backend DTOs for 2026 Forensic Data.

### **Phase 3: The Signature Shield (Next Step)**
* [ ] **Metadata Parser:** Extract C2PA and IPTC provenance data.
* [ ] **SynthID Integration:** Mock/Implement Google 2026 Signature Detection.
* [ ] **W-ENv4 CNN:** Implement server-side multi-task CNN for watermark tampering maps.

### **Phase 4: The Frontier Council (The "Brain")**
* [ ] **Parallel Orchestrator:** Java 21 Virtual Threads to "race" Gemini and Claude.
* [ ] **Forensic Prompting:** Engineer the "Supreme Court" system prompt for physical logic.
* [ ] **Reverse Forensic Audit (XAI):** Logic for explaining AI generation *even when* a watermark is found.

### **Phase 5: Real-time Streaming & Optimization**
* [ ] **SSE Implementation:** Move from REST to Server-Sent Events for "Thinking Logs."
* [ ] **Bi-directional Streaming:** Use WebSockets to inject WASM hints into active AI sessions.
* [ ] **Semantic Triage:** Implement Vector Embeddings for sub-500ms viral fake detection.

---

## 🛡️ Performance & Accuracy Guardrails
* **Accuracy:** >94.3% (GPQA Diamond Level) via Gemini 3.1 Pro.
* **Latency:** Final verdict in **6.0s**, full explanation in **9.0s**.
* **Resilience:** Failover from Gemini (Primary) to Claude (Specialist) to Llama (Emergency).
* **Data Health:** MongoDB TTL set to 604,800s (7 days) for auto-LRU purging.

---

* **Developer:** Harsh Prakash Mayekar (Computer Engineering, DMCE).
* **Innovation:** First student-led platform to combine local FFT math with Bidi-Injected LLM reasoning.