/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/forensics/getPixelBufferPtr
 * @returns `i32`
 */
export declare function getPixelBufferPtr(): number;
/**
 * assembly/forensics/getPeakU
 * @returns `i32`
 */
export declare function getPeakU(): number;
/**
 * assembly/forensics/getPeakV
 * @returns `i32`
 */
export declare function getPeakV(): number;
/**
 * assembly/forensics/computeSpectralAnomalyScore
 * @param width `i32`
 * @param height `i32`
 * @returns `f32`
 */
export declare function computeSpectralAnomalyScore(width: number, height: number): number;
