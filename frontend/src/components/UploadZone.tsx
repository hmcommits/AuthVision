import { useCallback, useState } from 'react';
import type { ForensicReport } from '../types/forensics';

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
  isAnalyzing: boolean;
  report?: ForensicReport | null;
}

export default function UploadZone({ onFileAccepted, isAnalyzing, report }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      setFileName(file.name);
      onFileAccepted(file);
    },
    [onFileAccepted]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div
      id="upload-zone"
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center
        rounded-2xl border-2 transition-all duration-300 cursor-pointer select-none
        min-h-[420px] overflow-hidden group
        ${isDragging
          ? 'border-cyan-400 shadow-[0_0_32px_4px_rgba(34,211,238,0.45)] bg-cyan-950/20'
          : 'border-cyan-700/50 shadow-[0_0_16px_2px_rgba(34,211,238,0.12)] bg-slate-900/60 hover:border-cyan-500/80 hover:shadow-[0_0_24px_4px_rgba(34,211,238,0.28)]'
        }
      `}
    >
      {/* Animated scan line */}
      {isAnalyzing && (
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
          <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[scan_1.2s_linear_infinite]" />
          <div className="absolute inset-0 bg-cyan-950/10" />
        </div>
      )}

      {preview ? (
        <div className="relative w-full h-full flex flex-col items-center justify-center p-4 gap-4">
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Forensic target"
              className="max-h-[340px] max-w-full rounded-xl object-contain ring-1 ring-cyan-700/40 shadow-xl relative"
            />
            {report?.anomalyCoordinates && (
              <div 
                className="absolute w-10 h-10 border-2 border-red-500/80 bg-red-500/20 pointer-events-none shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse transition-all duration-500"
                style={{
                  left: `calc(${report.anomalyCoordinates.x * 100}%)`,
                  top: `calc(${report.anomalyCoordinates.y * 100}%)`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className="absolute top-0 left-1/2 w-[1px] h-full bg-red-500/50 -translate-x-1/2" />
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-red-500/50 -translate-y-1/2" />
                <div className="absolute -top-5 left-1/2 text-[10px] whitespace-nowrap font-mono text-red-400 bg-slate-950 px-1 rounded -translate-x-1/2 border border-red-500/30 tracking-tight">
                  [{report.anomalyCoordinates.x.toFixed(2)}, {report.anomalyCoordinates.y.toFixed(2)}]
                </div>
              </div>
            )}
          </div>
          <span className="text-xs font-mono text-cyan-400/70 bg-slate-900/80 px-3 py-1 rounded-full truncate max-w-xs">
            {fileName}
          </span>
          {!isAnalyzing && (
            <label
              htmlFor="file-input"
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Drop a new image or click to replace
            </label>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5 px-8 text-center">
          {/* Icon */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-cyan-950/60 border border-cyan-700/40 flex items-center justify-center group-hover:border-cyan-500/60 transition-colors">
              <svg className="w-9 h-9 text-cyan-400/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-60" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400" />
          </div>

          <div>
            <p className="text-slate-200 font-semibold text-base mb-1">
              Drop image for analysis
            </p>
            <p className="text-slate-500 text-sm">
              PNG, JPG, WEBP, TIFF supported
            </p>
          </div>

          <label
            htmlFor="file-input"
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-cyan-900/40 border border-cyan-700/50 text-cyan-300 hover:bg-cyan-800/50 hover:text-cyan-200 transition-all cursor-pointer"
          >
            Browse Files
          </label>
        </div>
      )}

      <input
        id="file-input"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
