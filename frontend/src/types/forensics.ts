export enum VerdictStatus {
  VERIFIED = 'VERIFIED',
  SUSPICIOUS = 'SUSPICIOUS',
  UNVERIFIED = 'UNVERIFIED',
}

export interface SignalData {
  spectralAnomaly: number; // 0–1 confidence score
  metadataTrust: number;   // 0–1 confidence score
  noiseConsistency: number;
  compressionArtifact: number;
}

export interface ForensicReport {
  verdict: VerdictStatus;
  confidence: number; // overall 0–100
  signals: SignalData;
  fileName: string;
  fileSize: number;
  analyzedAt: Date;
  layerVersion: string;
}
