import type { ForensicReport } from '../types/forensics';
import { VerdictStatus } from '../types/forensics';

// ── WASM module interface ──────────────────────────────────────────────────
interface ForensicsWasmExports {
  /** Returns the byte-offset in WASM linear memory where JS should write pixels */
  getPixelBufferPtr: () => number;
  /** Runs the 2-D DFT and returns an anomaly score in [0, 1] */
  computeSpectralAnomalyScore: (width: number, height: number) => number;
  getPeakU: () => number;
  getPeakV: () => number;
  memory: WebAssembly.Memory;
}

// Singleton — loaded once and reused
let _wasm: ForensicsWasmExports | null = null;

async function loadWasm(): Promise<ForensicsWasmExports> {
  if (_wasm) return _wasm;

  const response = await fetch('/wasm/forensics.wasm');
  if (!response.ok) throw new Error(`Failed to fetch WASM: ${response.status}`);

  const { instance } = await WebAssembly.instantiateStreaming(response, {
    env: {
      abort: (_msg: number, _file: number, line: number, col: number) => {
        console.error(`[nanoCore] WASM abort @ line ${line}:${col}`);
      },
    },
  });

  _wasm = instance.exports as unknown as ForensicsWasmExports;
  return _wasm;
}

// ── Image → grayscale pixels ───────────────────────────────────────────────
/** Sample size: 32×32 keeps the O(N⁴) DFT under ~1 ms in WASM */
const SAMPLE = 32;

async function extractGrayscalePixels(file: File): Promise<Float32Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width  = SAMPLE;
  canvas.height = SAMPLE;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, SAMPLE, SAMPLE);
  bitmap.close();

  const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE);
  const pixels = new Float32Array(SAMPLE * SAMPLE);
  for (let i = 0; i < SAMPLE * SAMPLE; i++) {
    // BT.601 luminance, normalised to [0, 1]
    pixels[i] =
      (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
  }
  return pixels;
}

// ── Core analyzeImage function ─────────────────────────────────────────────
/**
 * Draws the image to a hidden canvas, extracts grayscale pixel data,
 * passes it into the WASM FFT kernel, and returns the Spectral Anomaly Score.
 */
export async function analyzeImage(file: File): Promise<{ score: number; peakU: number; peakV: number }> {
  const [wasm, pixels] = await Promise.all([loadWasm(), extractGrayscalePixels(file)]);

  // Write pixel data into WASM linear memory
  const bytePtr  = wasm.getPixelBufferPtr();
  const wasmMem  = new Float32Array(wasm.memory.buffer);
  wasmMem.set(pixels, bytePtr / 4);   // bytePtr → f32 index

  // Execute the 2-D DFT kernel
  const rawScore = wasm.computeSpectralAnomalyScore(SAMPLE, SAMPLE);
  const score = Math.min(1.0, Math.max(0.0, rawScore));
  
  return {
    score,
    peakU: wasm.getPeakU(),
    peakV: wasm.getPeakV(),
  };
}

// ── Public API: runFastScan ────────────────────────────────────────────────
/**
 * Layer 1 NanoCore fast scan.
 * Uses the WASM DFT kernel for real spectral analysis.
 * Verdict thresholds (spectral anomaly score):
 *   ≥ 0.55 → SUSPICIOUS
 *   ≤ 0.25 → VERIFIED
 *   else   → UNVERIFIED
 */
export async function runFastScan(file: File): Promise<ForensicReport> {
  const { score: spectralAnomaly, peakU, peakV } = await analyzeImage(file);

  // Derive correlated signals from the primary spectral score
  const metadataTrust        = parseFloat((1.0 - spectralAnomaly * 0.80).toFixed(3));
  const noiseConsistency     = parseFloat((1.0 - spectralAnomaly * 0.60).toFixed(3));
  const compressionArtifact  = parseFloat((spectralAnomaly * 0.90).toFixed(3));

  // Map score to verdict
  let verdict: VerdictStatus;
  if (spectralAnomaly >= 0.55) {
    verdict = VerdictStatus.SUSPICIOUS;
  } else if (spectralAnomaly <= 0.25) {
    verdict = VerdictStatus.VERIFIED;
  } else if (spectralAnomaly > 0.30) {
    // > 30% combined anomaly score → High Suspicion (lowered threshold per spec)
    verdict = VerdictStatus.SUSPICIOUS;
  } else {
    verdict = VerdictStatus.UNVERIFIED;
  }

  const normX = parseFloat((peakU / SAMPLE).toFixed(3));
  const normY = parseFloat((peakV / SAMPLE).toFixed(3));

  return {
    verdict,
    confidence: Math.round(spectralAnomaly * 100),
    signals: {
      spectralAnomaly,
      metadataTrust,
      noiseConsistency,
      compressionArtifact,
    },
    fileName:    file.name,
    fileSize:    file.size,
    analyzedAt:  new Date(),
    layerVersion: 'nanoCore-L1-v1.0-WASM',
    // L1 NanoCore signal log — NOT Gemini prose
    explanationFragments: ['NanoCore L1 fast scan complete', `Spectral Peak detected at (${normX}, ${normY})`],
    // Layer 2 Gemini reasoning tokens — populated later via SSE
    reasoningStream: [],
    anomalyCoordinates: { x: normX, y: normY },
  };
}
