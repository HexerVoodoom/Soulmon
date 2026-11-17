import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveHexCrownArt, HEX_ART } from '.';

const png = (p: string) => { const b = readFileSync(p); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25], size: b.length }; };
const hex = (n: string) => join(__dirname, n);
const status = (n: string) => join(__dirname, '..', 'combate-v3', 'status', n);

describe('arte das Coroas novas e selos de status (§451)', () => {
  it.each(['hot', 'slow', 'silence', 'defBuff', 'atkDebuff', 'spdDebuff'])('coroa-%s: 96x96 RGBA e resolvida', (c) => {
    const i = png(hex(`coroa-${c}.png`));
    expect([i.w, i.h, i.colorType]).toEqual([96, 96, 6]);
    expect(resolveHexCrownArt(c)).not.toBe(HEX_ART.slotIcon.coroa);
  });
  it.each(['buff-def', 'debuff-atk', 'debuff-spd'])('st-%s: 64x64 RGBA', (s) => {
    const i = png(status(`st-${s}.png`));
    expect([i.w, i.h, i.colorType]).toEqual([64, 64, 6]);
  });
});
