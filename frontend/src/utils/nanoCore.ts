import type { ForensicReport } from '../types/forensics';
import { VerdictStatus } from '../types/forensics';

/**
 * Layer 1 — NanoCore Fast Scan
 * Simulates the math-based rapid pre-screen pipeline.
 * Returns a forensic report after a short async delay.
 */
export async function runFastScan(file: File): Promise<ForensicReport> {
  await new Promise<void>((resolve) => setTimeout(resolve, 1000));

  return {
    verdict: VerdictStatus.SUSPICIOUS,
    confidence: 67,
    signals: {
      spectralAnomaly: 0.74,
      metadataTrust: 0.41,
      noiseConsistency: 0.58,
      compressionArtifact: 0.82,
    },
    fileName: file.name,
    fileSize: file.size,
    analyzedAt: new Date(),
    layerVersion: 'nanoCore-L1-v0.1',
  };
}
