import { describe, it, expect } from 'vitest';
import { idlePose, runPose, MAX_SQUASH, REDUCED_SQUASH } from './petBounce';

const base = { t: 0, speed: 300, h: 0, vy: 0, sinceLand: 9 };

describe('petBounce', () => {
  it('nunca passa de ±8% (±2% em movimento reduzido)', () => {
    for (let i = 0; i < 400; i++) {
      for (const reduced of [false, true]) {
        const lim = reduced ? REDUCED_SQUASH : MAX_SQUASH;
        const poses = [
          runPose({ ...base, t: i / 30, reduced }),
          runPose({ ...base, t: i / 30, h: 40, vy: 660, reduced }),
          runPose({ ...base, t: i / 30, h: 10, vy: -500, reduced }),
          runPose({ ...base, t: i / 30, sinceLand: (i % 20) / 100, reduced }),
          idlePose(i / 10, reduced),
        ];
        for (const p of poses) {
          expect(Math.abs(p.sx - 1)).toBeLessThanOrEqual(lim + 1e-9);
          expect(Math.abs(p.sy - 1)).toBeLessThanOrEqual(lim + 1e-9);
        }
      }
    }
  });
  it('estica no impulso e achata no pouso', () => {
    expect(runPose({ ...base, h: 5, vy: 660 }).sy).toBeGreaterThan(1.04);
    expect(runPose({ ...base, sinceLand: 0 }).sy).toBeLessThan(0.97);
  });
  it('movimento reduzido: sem salto vertical nem inclinação; dy sempre inteiro', () => {
    const r = runPose({ ...base, t: 0.3, reduced: true });
    expect(r.dy === 0 && r.rot === 0).toBe(true);
    expect(Number.isInteger(runPose({ ...base, t: 0.37 }).dy)).toBe(true);
  });
});
