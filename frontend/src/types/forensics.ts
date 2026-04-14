export enum VerdictStatus {
  VERIFIED = 'VERIFIED',
  SUSPICIOUS = 'SUSPICIOUS',
  UNVERIFIED = 'UNVERIFIED',
  SIGNATURE_MATCH = 'SIGNATURE_MATCH',
}

export interface SignalData {
  spectralAnomaly: number; // 0–1 confidence score
  metadataTrust: number;   // 0–1 confidence score
  noiseConsistency: number;
  compressionArtifact: number;
}

export interface TamperCoordinate {
  x: number;
  y: number;
  prob: number;
}

export interface SignatureShieldData {
  synthIdFound: boolean;
  watermarkDetected: string | null;
  metadataTrust: number;
  c2paVerified: boolean;
  isSignatureVerified: boolean;
  tamperMap: TamperCoordinate[];
}

export interface ForensicReport {
  verdict: VerdictStatus;
  confidence: number;
  signals: SignalData;
  fileName: string;
  fileSize: number;
  analyzedAt: Date;
  layerVersion: string;
  /** Layer 1 NanoCore signal log entries (not AI prose) */
  explanationFragments: string[];
  /** Layer 2 Gemini semantic reasoning text — tokens appended as they stream in */
  reasoningStream: string[];
  anomalyCoordinates: { x: number; y: number } | null;
  streamMessage?: string;
  signatureStatus?: 'Verified' | 'None' | 'Tampered';
  currentModel?: string;
  isVectorHit?: boolean;
  /** Set when Gemini returns an API-level error (quota, bad key, etc.) */
  geminiError?: string;
}
