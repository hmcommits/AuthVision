# AuthVision Architecture

## Hybrid Edge-Cloud Forensics Approach
AuthVision employs a multi-layer forensic pipeline combining Edge (Client-side) processing and Cloud (Server-side) processing for comprehensive artifact capture and analysis.

### Frontend (Edge Layer)
- **Technology:** React 19, TS, Vite, Tailwind CSS 4
- **Role:** Implements client-side extraction, memory analysis, and artifact parsing via WebGPU and SharedArrayBuffer.

### Backend (Cloud Layer)
- **Technology:** Spring Boot 4.0.4, Java 21, Virtual Threads
- **Role:** High-throughput orchestration, deeply asynchronous IO for handling parallel forensic stream ingestions from endpoints, and data persistence via MongoDB.
