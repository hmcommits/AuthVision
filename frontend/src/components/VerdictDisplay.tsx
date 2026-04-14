import { useState, useEffect } from 'react';
import type { ForensicReport } from '../types/forensics';
import { VerdictStatus } from '../types/forensics';

interface VerdictDisplayProps {
  report: ForensicReport | null;
  isAnalyzing: boolean;
}

const verdictConfig = {
  [VerdictStatus.VERIFIED]: {
    label: 'Verified Authentic',
    colorClass: 'text-emerald-400',
    borderClass: 'border-emerald-500/40',
    glowClass: 'shadow-[0_0_32px_4px_rgba(52,211,153,0.18)]',
    bgClass: 'bg-emerald-950/30',
    barClass: 'bg-emerald-400',
    badgeBg: 'bg-emerald-900/60 border-emerald-500/50',
    dot: 'bg-emerald-400',
  },
  [VerdictStatus.SUSPICIOUS]: {
    label: 'Suspicious — Review Required',
    colorClass: 'text-amber-400',
    borderClass: 'border-amber-500/40',
    glowClass: 'shadow-[0_0_32px_4px_rgba(251,191,36,0.18)]',
    bgClass: 'bg-amber-950/30',
    barClass: 'bg-amber-400',
    badgeBg: 'bg-amber-900/60 border-amber-500/50',
    dot: 'bg-amber-400',
  },
  [VerdictStatus.UNVERIFIED]: {
    label: 'Unverified — Inconclusive',
    colorClass: 'text-slate-400',
    borderClass: 'border-slate-500/40',
    glowClass: 'shadow-[0_0_24px_2px_rgba(148,163,184,0.10)]',
    bgClass: 'bg-slate-800/40',
    barClass: 'bg-slate-400',
    badgeBg: 'bg-slate-700/60 border-slate-500/50',
    dot: 'bg-slate-400',
  },
};

function SignalBar({
  label,
  value,
  barClass,
}: {
  label: string;
  value: number;
  barClass: string;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-xs font-mono">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function SkeletonBar() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between">
        <div className="h-3 w-28 rounded bg-slate-700/60 animate-pulse" />
        <div className="h-3 w-8 rounded bg-slate-700/60 animate-pulse" />
      </div>
      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full w-1/2 bg-slate-700/60 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export default function VerdictDisplay({ report, isAnalyzing }: VerdictDisplayProps) {
  // All hooks must be declared unconditionally at the top — Rules of Hooks
  const [displayedText, setDisplayedText] = useState('');

  // Safe configuration mapping with optional chaining to prevent TypeError
  const cfg = verdictConfig[report?.verdict || VerdictStatus.UNVERIFIED] ?? verdictConfig[VerdictStatus.UNVERIFIED];



  useEffect(() => {
    // Drive the typewriter from reasoningStream (Gemini L2 semantic text only)
    const fragments = report?.reasoningStream;
    if (!fragments || fragments.length === 0) {
      setDisplayedText('');
      return;
    }

    // For vector cache hits or when streaming is done, show full text immediately
    if (!isAnalyzing || report?.isVectorHit) {
      setDisplayedText(fragments.join(''));
      return;
    }

    const fullText = fragments.join('');

    if (fullText.length <= displayedText.length) {
      if (fullText.length < displayedText.length) setDisplayedText(fullText);
      return;
    }

    const interval = setInterval(() => {
      setDisplayedText(prev => {
        if (prev.length < fullText.length) {
          return prev + fullText.charAt(prev.length);
        }
        return prev;
      });
    }, 15);

    return () => clearInterval(interval);
  }, [report?.reasoningStream, isAnalyzing, report?.isVectorHit, displayedText.length]);

  // Idle state: no report and not currently analyzing — render as conditional JSX
  if (!report && !isAnalyzing) {
    return (
      <div id="verdict-panel" className="relative rounded-2xl border border-slate-500/40 backdrop-blur-md bg-slate-800/40 p-6 flex flex-col items-center justify-center min-h-[420px]">
        <div className="animate-pulse text-slate-400 font-mono tracking-widest uppercase">Analyzing Signal...</div>
      </div>
    );
  }

  return (
    <div
      id="verdict-panel"
      className={`
        relative rounded-2xl border backdrop-blur-md transition-all duration-500
        ${cfg?.borderClass || 'border-slate-500/40'} ${cfg?.glowClass || ''} ${cfg?.bgClass || 'bg-slate-800/40'}
        p-6 flex flex-col gap-6 min-h-[420px]
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${cfg?.dot || 'bg-slate-400'} ${report ? 'animate-pulse' : 'opacity-30'}`} />
          <h2 className="text-xs uppercase tracking-widest font-mono text-slate-400">
            Forensic Verdict
          </h2>
        </div>
        {report && (
          <div className="flex gap-2">
            <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${cfg?.badgeBg || ''} ${cfg?.colorClass || 'text-slate-400'}`}>
              L1 · nanoCore
            </span>
            {report.signatureStatus === 'Verified' && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg border bg-yellow-900/60 border-yellow-500/50 text-yellow-500 shadow-[0_0_12px_2px_rgba(234,179,8,0.2)]">
                 ★ Google SynthID Verified
              </span>
            )}
            {report.isVectorHit && (
              <span className="text-xs font-mono px-2.5 py-1 rounded-lg border bg-pink-900/60 border-pink-500/50 text-pink-400 shadow-[0_0_12px_2px_rgba(236,72,153,0.2)] tracking-wide">
                 ⚡ Instant Match (Viral Memory)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Verdict */}
      <div className="flex flex-col gap-1">
        {isAnalyzing ? (
          <>
            <div className="h-9 w-3/4 rounded-lg bg-slate-700/50 animate-pulse mb-1" />
            <div className="h-4 w-1/2 rounded bg-slate-700/40 animate-pulse" />
          </>
        ) : report ? (
          <>
            <p className={`text-3xl font-bold tracking-tight ${cfg?.colorClass || 'text-slate-400'}`}>
              {cfg?.label || 'Unverified'}
            </p>
            <p className="text-sm text-slate-500 font-mono flex items-center gap-2 flex-wrap">
              Confidence: <span className="text-slate-300">{report.confidence}%</span>
              &nbsp;·&nbsp;
              {report.analyzedAt.toLocaleTimeString()}
              {isAnalyzing && (
                <span className="ml-2 flex flex-row items-center gap-1 text-cyan-400 animate-pulse">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  Thinking...
                </span>
              )}
              {isAnalyzing && report?.currentModel?.includes('Live') && (
                <span className="ml-2 flex flex-row items-center gap-1.5 text-xs font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
                  Live Stream Active
                </span>
              )}
            </p>

            {/* Audited-by badge — shown as soon as MODEL_SWITCHED fires, regardless of reasoning */}
            {report.currentModel && (
              <span className={`self-start mt-1 px-2 py-0.5 rounded text-xs border tracking-wider ${
                report.currentModel.includes('Gemini') ? 'border-blue-500/40 text-blue-400 bg-blue-900/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]' :
                report.currentModel.includes('Claude') ? 'border-purple-500/40 text-purple-400 bg-purple-900/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]' :
                'border-green-500/40 text-green-400 bg-green-900/40 shadow-[0_0_8px_rgba(34,197,94,0.2)]'
              }`}>
                Audited by {report.currentModel}
              </span>
            )}

            {/* Live streaming console — shows Gemini tokens as they arrive */}
            {isAnalyzing && displayedText.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 max-h-32 overflow-y-auto">
                <p className="font-sans text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {displayedText}
                  <span className="animate-pulse inline-block ml-0.5 text-cyan-300">|</span>
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-2xl font-bold text-slate-600">Awaiting Input</p>
        )}
      </div>

      {/* Confidence meter */}
      {report && !isAnalyzing && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">Overall Confidence</span>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${cfg?.barClass || 'bg-slate-400'}`}
              style={{ width: `${report.confidence}%` }}
            />
          </div>
        </div>
      )}

      {/* Signal Bars */}
      <div className="flex flex-col gap-4 mt-auto">
        <h3 className="text-xs uppercase tracking-widest font-mono text-slate-500">
          Signal Analysis
        </h3>
        {isAnalyzing || !report ? (
          <>
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
            <SkeletonBar />
          </>
        ) : (
          <>
            <SignalBar label="Spectral Anomaly" value={report.signals?.spectralAnomaly || 0} barClass={cfg?.barClass || 'bg-slate-400'} />
            <SignalBar label="Metadata Trust" value={report.signals?.metadataTrust || 0} barClass={cfg?.barClass || 'bg-slate-400'} />
            <SignalBar label="Noise Consistency" value={report.signals?.noiseConsistency || 0} barClass={cfg?.barClass || 'bg-slate-400'} />
            <SignalBar label="Compression Artifact" value={report.signals?.compressionArtifact || 0} barClass={cfg?.barClass || 'bg-slate-400'} />
          </>
        )}
      </div>

      {/* Footer */}
      {report && !isAnalyzing && (
        <div className="text-xs font-mono text-slate-600 pt-2 border-t border-slate-800">
          {report.fileName} · {(report.fileSize / 1024).toFixed(1)} KB · {report.layerVersion}
        </div>
      )}

      {/* ── Gemini Reasoning Console ── always rendered once Gemini was invoked ── */}
      {report && !isAnalyzing && report.currentModel && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs uppercase tracking-widest font-mono text-slate-500 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${cfg?.dot || 'bg-slate-400'}`} />
            Gemini Reasoning
          </h3>
          <div
            id="gemini-reasoning-console"
            className="p-4 rounded-xl bg-slate-900/70 border border-slate-700/60 max-h-52 overflow-y-auto"
          >
            {/* Case 1: Gemini API error (bad key, quota, etc.) */}
            {report.geminiError && (
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-xs font-mono mt-0.5">⚠</span>
                <div>
                  <p className="text-xs font-mono text-red-400 mb-1">Gemini API Error</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{report.geminiError}</p>
                  <p className="text-xs text-slate-600 mt-1 font-mono">Check API key quota in .env → GEMINI_API_KEY</p>
                </div>
              </div>
            )}

            {/* Case 2: Reasoning text received — render as clean prose */}
            {!report.geminiError && displayedText.length > 0 && (
              displayedText.split('\n').filter(Boolean).map((para, i) => (
                <p key={i} className="text-sm text-slate-200 leading-relaxed mb-2 last:mb-0 font-sans">
                  {para}
                </p>
              ))
            )}

            {/* Case 3: Gemini was invoked but returned nothing and no error was surfaced */}
            {!report.geminiError && displayedText.length === 0 && (
              <p className="text-sm text-slate-500 italic font-sans">
                No reasoning text received from {report.currentModel}. The model may have timed out or returned an empty response.
              </p>
            )}
          </div>
        </div>
      )}

      {/* L1 NanoCore Signal Log — collapsed technical detail */}
      {report && !isAnalyzing && report.explanationFragments.length > 0 && (
        <details className="group">
          <summary className="text-xs font-mono text-slate-600 hover:text-slate-400 cursor-pointer select-none">
            ▸ NanoCore L1 log ({report.explanationFragments.length} entries)
          </summary>
          <div className="mt-1 pl-3 border-l border-slate-800 flex flex-col gap-0.5">
            {report.explanationFragments.map((entry, i) => (
              <span key={i} className="text-xs font-mono text-slate-600">{entry}</span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
