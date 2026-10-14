import { describe, expect, it } from 'vitest';
import { sleepZPlacement } from './sleepZ';
import { PET_BOX, PET_RENDER, PET_TOP_OFFSET, STAGE_HEIGHT } from './petStage';

const footY = STAGE_HEIGHT / 2 + PET_TOP_OFFSET + (PET_BOX - PET_RENDER) + PET_RENDER;
const base = { footY, spriteBox: PET_RENDER, size: 40, zoom: 1.5 };

describe('sleepZPlacement', () => {
  it('nunca sai do topo visível: no chão e no ar, e com o sprite ocupando a caixa toda (formas altas)', () => {
    for (const airLiftPx of [0, 12, 40]) {
      const p = sleepZPlacement({ ...base, airLiftPx });
      expect(p.screenTop).toBeGreaterThanOrEqual(4 - 1e-9);
    }
  });
  it('o valor antigo (acima da cabeça, 64px) caía fora da tela — regressão do bug', () => {
    const antigo = STAGE_HEIGHT / 2 + PET_TOP_OFFSET + (PET_BOX - PET_RENDER) + 16 - 32;
    expect(footY + (antigo - footY) * 1.5).toBeLessThan(0);
  });
  it('fica à direita do centro, na quina do sprite, sem passar da metade da caixa (não cobre o rosto)', () => {
    const p = sleepZPlacement(base);
    expect(p.dx).toBeGreaterThan(0);
    expect(p.dx).toBeLessThan(PET_RENDER / 2);
  });
  it('palco mais baixo ou zoom maior ainda respeitam a folga', () => {
    expect(sleepZPlacement({ ...base, zoom: 2 }).screenTop).toBeGreaterThanOrEqual(4 - 1e-9);
    expect(sleepZPlacement({ ...base, footY: 150, margin: 10 }).screenTop).toBeGreaterThanOrEqual(10 - 1e-9);
  });
});
