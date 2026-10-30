/**
 * BATTLE STAGE — layout do modo `boss` (Feira do Chefe, `docs/PLANO-FEIRA-CHEFE.md` §3/§8).
 * O campo de cada celular é o que `BattleStage` mede: viewport menos topo (48) e pé (68 + 54).
 * O modo `boss` desligado tem que dar o layout de sempre.
 */
import { describe, it, expect } from 'vitest';
import { stageLayout } from './BattleStage';

const SPRITE_TOP = 0.94;
const fieldOf = (vw: number, vh: number) => ({ w: vw, h: vh - 48 - 68 - 54 });

describe('stageLayout modo boss — 3 viewports', () => {
  for (const [vw, vh] of [[360, 640], [375, 812], [412, 915]] as const) {
    const { w, h } = fieldOf(vw, vh);
    it(`${vw}×${vh} (campo ${w}×${h}): chefe centrado, na metade de cima, dentro dos limites, escala inteira`, () => {
      const l = stageLayout(w, h, 1, true);
      expect(l.foes).toHaveLength(1);
      const f = l.foes[0];
      expect(Math.abs(f.x - w / 2)).toBeLessThanOrEqual(1);
      // o corpo (centro do sprite) fica na metade superior do campo
      expect(f.y - f.size * 0.47).toBeLessThanOrEqual(h / 2);
      // dentro da caixa: laterais, e a barra do pool + topo do sprite abaixo do topo
      expect(f.x - f.size / 2).toBeGreaterThanOrEqual(0);
      expect(f.x + f.size / 2).toBeLessThanOrEqual(w);
      expect(l.boss).toBeDefined();
      const b = l.boss!;
      expect(b.barTop).toBeGreaterThanOrEqual(0);
      expect(f.y - f.size * SPRITE_TOP).toBeGreaterThanOrEqual(b.barTop + b.barH); // a barra não encosta no sprite
      expect(b.barW).toBeLessThanOrEqual(w);
      // escala INTEIRA da arte 512 (1×, 1/2×, 1/4×) e ~60-72% da largura
      expect([128, 256, 512]).toContain(f.size);
      expect(f.size / w).toBeGreaterThanOrEqual(0.6);
      expect(f.size / w).toBeLessThanOrEqual(0.72);
      // o seu Soulmon fica pequeno embaixo à esquerda
      expect(l.me.size).toBeLessThanOrEqual(stageLayout(w, h, 1).me.size);
      expect(l.me.size).toBeLessThanOrEqual(Math.round(f.size * 0.62));
      expect(l.me.x - l.me.size / 2).toBeGreaterThanOrEqual(0);
      expect(l.me.y + l.platHalf(l.me)).toBeLessThanOrEqual(h + 1);
      expect(l.me.x).toBeLessThan(w / 2);
      expect(l.me.y).toBeGreaterThan(f.y);
    });
  }
});

describe('stageLayout sem boss — byte-idêntico ao de sempre', () => {
  it('boss omitido ou false dão o mesmo layout, sem o campo `boss`', () => {
    for (const [w, h] of [[375, 636], [412, 760], [360, 470], [800, 700]] as const) {
      for (const n of [1, 2, 3]) {
        const a = stageLayout(w, h, n);
        const b = stageLayout(w, h, n, false);
        expect(JSON.stringify(b)).toBe(JSON.stringify(a));
        expect('boss' in a).toBe(false);
      }
    }
  });

  // 30/10/2026 (dono): inimigo desceu para o chão dos cenários de câmera baixa (antes: x 263, y 267; o seu Soulmon de y 604 para 688).
  it('valores de referência (anteriores à mudança)', () => {
    const l = stageLayout(375, 636, 1);
    expect({ me: l.me, foes: l.foes, barsH: l.barsH, plateH: l.plateH }).toEqual({
      me: { x: 124, y: 688, size: 240 }, foes: [{ x: 255, y: 407, size: 158 }], barsH: 50, plateH: 14,
    });
  });
});
