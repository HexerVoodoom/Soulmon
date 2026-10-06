/**
 * Combat v3 — deterministic randomness (story PR1, run combate-v3-01).
 *
 * One owner for every random draw of a fight. A fight is a pure function of
 * its seed: in PvP the SERVER draws the seed and the client only replays it,
 * so nothing here may read `Math.random`, the clock or any global state.
 *
 * Source: prototyper/spike-variancia.md (RNG row) and the executable reference
 * `cv3-sim6.mjs`. Conformance vector (locked by test): `mulberry32(42)` yields
 * 0.601104, 0.448291, 0.852466.
 */

export type Rng = () => number;

/** mulberry32: 32-bit state, uniform in [0, 1). Portable across JS runtimes. */
export function mulberry32(seed: number): Rng {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Independent stream per side (side 1 = A, side 2 = B) derived from the fight seed. */
export function sideSeed(seed: number, side: 1 | 2): number {
  return (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) + side * 0x632be59b) | 0;
}

/** Salt of the stream that draws the opening phases of both sides. */
export const PHASE_SALT = 0x51ed;

/** Standard normal by Box–Muller (two draws, left operand first). */
export function gaussian(r: Rng): number {
  return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
}

export interface VarianceConfig {
  /** AR(1) autocorrelation between consecutive hits. */
  readonly rho: number;
  /** Standard deviation of the per-hit damage multiplier. */
  readonly sigma: number;
  /** Lowest multiplier allowed (a hit never heals and never does ~0). */
  readonly floor: number;
}

/**
 * Damage variance (PR3a: sigma 8% with the normalised hit, contexto 2.15 P1; PR1 had 15% with raw hits). AR(1)
 * per hit, rho 0.9, sigma 15%. It is the variant whose upset rate is the most
 * uniform across level bands while keeping DEF×DEF P95 under 40 s.
 */
export const VARIANCE: VarianceConfig = { rho: 0.9, sigma: 0.08, floor: 0.05 };

/**
 * Per-hit damage multiplier stream, AR(1): z' = rho·z + sqrt(1−rho²)·N(0,1),
 * multiplier = max(floor, 1 + sigma·z). The first z is drawn at creation.
 */
export function ar1Multiplier(r: Rng, cfg: VarianceConfig): () => number {
  let z = gaussian(r);
  const k = Math.sqrt(1 - cfg.rho * cfg.rho);
  return () => {
    z = cfg.rho * z + k * gaussian(r);
    return Math.max(cfg.floor, 1 + cfg.sigma * z);
  };
}
