/**
 * NanoCore L1 — Spectral Analysis Engine
 * 2D Discrete Fourier Transform with SIMD-accelerated pixel loading
 *
 * Memory layout:
 *   JS writes f32 grayscale [0,1] pixels to getPixelBufferPtr()
 *   then calls computeSpectralAnomalyScore(width, height) which
 *   returns a score in [0.0, 1.0].
 *
 * SIMD optimization: the inner x-loop uses v128.load to load 4 f32
 *   pixels in a single 128-bit memory op, reducing load pressure
 *   before scalar trig accumulation.
 */

/** Max supported image dimension: 32×32 = 1 024 pixels */
const MAX_PIXELS: i32 = 1024;

/** Grayscale pixel buffer (stable linear-memory pointer for JS interop) */
const pixelBuf = new Float32Array(MAX_PIXELS);

/** Returns the raw byte-pointer JS must write f32 pixel data into. */
export function getPixelBufferPtr(): i32 {
  return pixelBuf.dataStart;
}

let peakU: i32 = 0;
let peakV: i32 = 0;

export function getPeakU(): i32 { return peakU; }
export function getPeakV(): i32 { return peakV; }

const TWO_PI: f32 = 6.2831853071795864769;

/**
 * Compute a forensic Spectral Anomaly Score via 2D DFT.
 *
 * Algorithm:
 *   1. For every (u,v) frequency bin, accumulate the inner product of the
 *      pixel plane with the DFT basis function using SIMD-loaded batches.
 *   2. Classify each bin as DC, low-frequency, or high-frequency by its
 *      normalised radius in the centred frequency plane.
 *   3. Return highFreqEnergy / AC_energy, scaled to [0, 1].
 *
 * Natural images concentrate energy near DC; manipulation / synthesis
 * introduces characteristic high-frequency peaks.
 *
 * @param width  Image width  (≤ 32)
 * @param height Image height (≤ 32)
 * @returns      Anomaly score in [0.0, 1.0]
 */
export function computeSpectralAnomalyScore(width: i32, height: i32): f32 {
  const pixBase: usize = usize(pixelBuf.dataStart);

  const wF: f32 = TWO_PI / f32(width);
  const hF: f32 = TWO_PI / f32(height);

  let totalEnergy: f64 = 0.0;
  let dcEnergy:    f64 = 0.0;
  let hfEnergy:    f64 = 0.0;   // high-frequency energy accumulator
  let maxMag:      f64 = 0.0;
  peakU = 0;
  peakV = 0;

  // ── Outer loops: iterate over every frequency bin (u, v) ──────────────
  for (let v: i32 = 0; v < height; v++) {
    for (let u: i32 = 0; u < width; u++) {

      let re: f32 = 0.0;
      let im: f32 = 0.0;

      const uW: f32 = wF * f32(u);
      const vH: f32 = hF * f32(v);

      // ── Inner loops: accumulate DFT basis-function product ────────────
      for (let y: i32 = 0; y < height; y++) {
        const vAngle:  f32   = vH * f32(y);
        const rowPtr:  usize = pixBase + usize(y * width) * 4;

        let x: i32 = 0;

        // ── SIMD block: 4 × f32 pixels per 128-bit load ─────────────────
        for (; x + 4 <= width; x += 4) {
          // Single 128-bit load brings in p[x..x+3]
          const pVec: v128 = v128.load(rowPtr + usize(x) * 4);

          const xf: f32 = f32(x);
          const a0: f32 = uW * (xf + 0.0) + vAngle;
          const a1: f32 = uW * (xf + 1.0) + vAngle;
          const a2: f32 = uW * (xf + 2.0) + vAngle;
          const a3: f32 = uW * (xf + 3.0) + vAngle;

          const p0: f32 = f32x4.extract_lane(pVec, 0);
          const p1: f32 = f32x4.extract_lane(pVec, 1);
          const p2: f32 = f32x4.extract_lane(pVec, 2);
          const p3: f32 = f32x4.extract_lane(pVec, 3);

          re += p0 * Mathf.cos(a0) + p1 * Mathf.cos(a1)
              + p2 * Mathf.cos(a2) + p3 * Mathf.cos(a3);
          im -= p0 * Mathf.sin(a0) + p1 * Mathf.sin(a1)
              + p2 * Mathf.sin(a2) + p3 * Mathf.sin(a3);
        }

        // ── Scalar tail (handles widths not divisible by 4) ─────────────
        for (; x < width; x++) {
          const angle: f32 = uW * f32(x) + vAngle;
          const p: f32 = load<f32>(rowPtr + usize(x) * 4);
          re += p * Mathf.cos(angle);
          im -= p * Mathf.sin(angle);
        }
      }

      // Power at this frequency bin
      const mag: f64 = f64(re * re + im * im);
      totalEnergy += mag;

      if (u === 0 && v === 0) {
        // DC component — mean intensity, not diagnostic
        dcEnergy = mag;
      } else {
        if (mag > maxMag) {
          maxMag = mag;
          peakU = u;
          peakV = v;
        }
        // ── Centred normalised frequency radius ──────────────────────────
        // Map to [−0.5, 0.5] range (centred spectrum)
        const fu: f32 = f32(u < width  >> 1 ? u : width  - u) / f32(width);
        const fv: f32 = f32(v < height >> 1 ? v : height - v) / f32(height);
        const r:  f32 = Mathf.sqrt(fu * fu + fv * fv);

        // Frequencies beyond 20% radius are considered high-frequency
        if (r > 0.20) {
          hfEnergy += mag;
        }
      }
    }
  }

  // ── Score calculation ──────────────────────────────────────────────────
  const acEnergy: f64 = totalEnergy - dcEnergy;
  if (acEnergy < 1e-10) return 0.0;

  // Natural images: HF ratio ≈ 0.04–0.18
  // Synthetic / manipulated images: HF ratio often > 0.30
  const ratio: f64 = hfEnergy / acEnergy;

  // Linear scale: 0.30 → 1.0 (clip at 1); below 0.10 → near 0
  const score: f64 = Math.min(1.0, Math.max(0.0, (ratio - 0.05) / 0.25));
  return f32(score);
}
