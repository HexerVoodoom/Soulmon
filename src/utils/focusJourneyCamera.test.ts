import { describe, expect, it } from 'vitest';
import { JOURNEY_CLOCK_MARGIN, JOURNEY_TOP_PAD, journeyCamera, petTopPx } from './focusJourneyCamera';

const SCREENS = [{ w: 390, h: 844, clock: 190 }, { w: 360, h: 640, clock: 170 }, { w: 412, h: 915, clock: 200 }, { w: 768, h: 1024, clock: 190 }];

describe('câmera da jornada', () => {
  for (const s of SCREENS) {
    it(`o Soulmon fica sempre abaixo do card do relógio em toda a trilha (${s.w}x${s.h})`, () => {
      const blocks = 6;
      for (let y = 0; y <= blocks + 1e-9; y += 0.05) {
        const cam = journeyCamera({ petY: y, blocks, screenW: s.w, screenH: s.h, clockBottom: s.clock });
        expect(petTopPx(cam, y, blocks)).toBeGreaterThanOrEqual(s.clock + JOURNEY_CLOCK_MARGIN - 0.5);
        expect(cam.vbTop).toBeGreaterThanOrEqual(-JOURNEY_TOP_PAD);
      }
    });
  }
  it('antecipa: a câmera já rola antes de o bicho encostar na margem do card', () => {
    const blocks = 6; const s = SCREENS[0];
    const reactive = (y: number) => journeyCamera({ petY: y, blocks, screenW: s.w, screenH: s.h, clockBottom: s.clock, lookahead: 0 });
    const ahead = (y: number) => journeyCamera({ petY: y, blocks, screenW: s.w, screenH: s.h, clockBottom: s.clock });
    // Em algum ponto do fim do mapa a câmera com olhar adiante já subiu e a reativa ainda não.
    const ys = Array.from({ length: 60 }, (_, i) => 5 + i * 0.0166);
    expect(ys.some(y => ahead(y).vbTop < reactive(y).vbTop - 0.01)).toBe(true);
    expect(ys.every(y => ahead(y).vbTop <= reactive(y).vbTop + 1e-9)).toBe(true);
  });
  it('no começo e no meio da trilha segue o bicho como antes (sem rolar a mais)', () => {
    const cam = journeyCamera({ petY: 0, blocks: 6, screenW: 390, screenH: 844, clockBottom: 190 });
    expect(cam.vbTop).toBe((6 - 1.2) * 200);
  });
  it('é contínua: dois passos vizinhos não dão salto de câmera', () => {
    let prev = journeyCamera({ petY: 0, blocks: 6, screenW: 390, screenH: 844, clockBottom: 190 }).vbTop;
    for (let y = 0.01; y <= 6; y += 0.01) {
      const v = journeyCamera({ petY: y, blocks: 6, screenW: 390, screenH: 844, clockBottom: 190 }).vbTop;
      expect(Math.abs(v - prev)).toBeLessThan(5);
      prev = v;
    }
  });
});
