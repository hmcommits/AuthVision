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
  confidence: number; // overall 0–100
  signals: SignalData;
  fileName: string;
  fileSize: number;
  analyzedAt: Date;
  layerVersion: string;
  explanationFragments: string[];
  anomalyCoordinates: { x: number; y: number } | null;
  streamMessage?: string;
  signatureStatus?: 'Verified' | 'None' | 'Tampered';
  currentModel?: string;
  isVectorHit?: boolean;
}
