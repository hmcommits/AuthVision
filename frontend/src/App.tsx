import { useState, useCallback } from 'react';
import UploadZone from './components/UploadZone';
import VerdictDisplay from './components/VerdictDisplay';
import { runFastScan } from './utils/nanoCore';
import type { ForensicReport } from './types/forensics';
import { VerdictStatus } from './types/forensics';

function PulseIcon() {
  return (
    <div className="relative flex items-center justify-center w-8 h-8">
      <span className="absolute inline-flex w-full h-full rounded-full bg-cyan-400 opacity-30 animate-ping" />
      <span className="relative inline-flex w-4 h-4 rounded-full bg-cyan-400" />
    </div>
  );
}

export default function App() {
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileAccepted = useCallback(async (file: File) => {
    setReport(null);
    setIsAnalyzing(true);
    try {
      const l1Result = await runFastScan(file);
      setReport(l1Result);

      // Generate a mock pHash based on file attributes
      const mockHash = `phash_${file.size}_${file.name.substring(0, 5)}`;
      const px = l1Result.anomalyCoordinates?.x || 0;
      const py = l1Result.anomalyCoordinates?.y || 0;

      const eventSource = new EventSource(`/api/v1/forensics/stream?pHash=${mockHash}&peakX=${px}&peakY=${py}`);
      
      eventSource.addEventListener('START', (msg) => {
        setReport(prev => prev ? { ...prev, streamMessage: msg.data } : null);
      });

      eventSource.addEventListener('SIGNATURE_SHIELD_RESULT', (msg) => {
        const data = JSON.parse(msg.data);
        setReport(prev => prev ? { 
            ...prev, 
            streamMessage: 'Signature Scan Complete',
            verdict: data.synthIdFound ? VerdictStatus.SIGNATURE_MATCH : prev.verdict,
            signatureStatus: data.isSignatureVerified ? 'Verified' : (data.tamperMap?.length > 0 ? 'Tampered' : 'None')
        } : null);
      });

      eventSource.addEventListener('MODEL_SWITCHED', (msg) => {
        setReport(prev => prev ? { ...prev, currentModel: msg.data } : null);
      });

      eventSource.addEventListener('REASONING_CHUNK', (msg) => {
        setReport(prev => {
            if (!prev) return null;
            return {
                ...prev,
                explanationFragments: [...prev.explanationFragments, msg.data]
            };
        });
      });

      eventSource.addEventListener('DONE', (msg) => {
          // DONE payload is now a JSON object with the aggregated verdict
          try {
            const payload = JSON.parse(msg.data);
            if (payload.verdict && payload.confidence) {
              setReport(prev => prev ? {
                ...prev,
                verdict: payload.verdict as VerdictStatus,
                confidence: payload.confidence,
              } : null);
            }
          } catch {
            // Older plain-text DONE events — no-op
          }
          eventSource.close();
          setIsAnalyzing(false);
      });

      eventSource.addEventListener('FAST_PASS', (msg) => {
          const cache = JSON.parse(msg.data);
          setReport(prev => prev ? { ...prev, verdict: cache.verdict, confidence: cache.confidence, streamMessage: 'Loaded from Edge Cache' } : null);
          eventSource.close();
          setIsAnalyzing(false);
      });

      eventSource.addEventListener('VECTOR_CACHE_HIT', (msg) => {
          const cache = JSON.parse(msg.data);
          setReport(prev => prev ? { 
              ...prev, 
              verdict: cache.verdict, 
              confidence: cache.confidence, 
              explanationFragments: cache.explanationFragments || [],
              streamMessage: 'Match via Visual Vector Cache',
              isVectorHit: true 
          } : null);
          eventSource.close();
          setIsAnalyzing(false);
      });

      eventSource.addEventListener('ERROR', (msg) => {
          setReport(prev => prev ? { ...prev, streamMessage: 'Stream Error: ' + msg.data } : null);
          eventSource.close();
          setIsAnalyzing(false);
      });

      eventSource.onerror = () => {
          eventSource.close();
          setIsAnalyzing(false);
      };

    } catch (e) {
      setIsAnalyzing(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans">
      {/* ── Header ── */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <PulseIcon />
            <span
              className="text-xl font-bold tracking-widest uppercase text-transparent bg-clip-text"
              style={{
                backgroundImage: 'linear-gradient(90deg, #67e8f9 0%, #a78bfa 100%)',
                fontFamily: "'Share Tech Mono', 'Courier New', monospace",
              }}
            >
              AuthVision
            </span>
          </div>

          {/* Status chip */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/70 border border-slate-700/50 text-xs font-mono text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            NanoCore L1 Online
          </div>
        </div>
      </header>

      {/* ── Main Grid ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-100">
            Forensic Analysis Dashboard
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Upload a digital image to run the Layer 1 NanoCore fast-scan pipeline.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left — Upload / Preview */}
          <section aria-label="Upload zone">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
              01 · Target Input
            </p>
            <UploadZone onFileAccepted={handleFileAccepted} isAnalyzing={isAnalyzing} report={report} />
          </section>

          {/* Right — Verdict */}
          <section aria-label="Verdict results">
            <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
              02 · Analysis Results
            </p>
            <VerdictDisplay report={report} isAnalyzing={isAnalyzing} />
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center text-xs font-mono text-slate-700 py-4 border-t border-slate-800/60">
        AuthVision · Hybrid Edge-Cloud Forensics · nanoCore-L1-v0.1
      </footer>
    </div>
  );
}
