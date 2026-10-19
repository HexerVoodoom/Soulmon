import { describe, expect, it } from 'vitest';
import { showerPlacement } from './showerPlacement';
import { PET_BOX, PET_RENDER, PET_TOP_OFFSET, STAGE_HEIGHT } from './petStage';

/** Mesma derivação de `PET_BOTTOM_IN_STAGE` no CompanionHUD. */
const footY = STAGE_HEIGHT / 2 + PET_TOP_OFFSET + (PET_BOX - PET_RENDER) + PET_RENDER;
const ZOOM = 1.5;
const SIZE = 26;
const base = { footY, spriteBox: PET_RENDER, size: SIZE, zoom: ZOOM };

describe('showerPlacement (D-11)', () => {
  it('o valor antigo (top -26 da caixa) caía fora da tela — regressão do bug', () => {
    const antigoNoGrupo = footY - PET_RENDER - 26;
    expect(footY + (antigoNoGrupo - footY) * ZOOM).toBeLessThan(0);
  });

  it('chuveiro inteiro dentro do palco no chão e no ar, do rookie ao ultra (a caixa do sprite é a mesma)', () => {
    for (const stage of ['rookie', 'champion', 'ultimate', 'mega', 'ultra']) {
      for (const airLiftPx of [0, 22, 40]) {
        const p = showerPlacement({ ...base, airLiftPx });
        expect(p.screenTop, `${stage}/${airLiftPx}`).toBeGreaterThanOrEqual(4 - 1e-9);
        expect(p.screenBottom, `${stage}/${airLiftPx}`).toBeLessThanOrEqual(STAGE_HEIGHT);
      }
    }
  });

  it('as gotas nascem abaixo do bocal e o chuveiro não fica a mais de uma caixa da cabeça', () => {
    const p = showerPlacement(base);
    expect(p.dropTop).toBeGreaterThan(p.top);
    expect(p.top).toBeGreaterThan(-SIZE * 2);
  });

  it('palco mais baixo ou zoom maior ainda respeitam a folga', () => {
    expect(showerPlacement({ ...base, zoom: 2 }).screenTop).toBeGreaterThanOrEqual(4 - 1e-9);
    expect(showerPlacement({ ...base, footY: 150, margin: 10 }).screenTop).toBeGreaterThanOrEqual(10 - 1e-9);
  });

  it('horizontal: nas bordas do alcance do pet, em 360x640 e 412x915, o chuveiro cabe na largura da tela', () => {
    for (const telaW of [360, 412]) {
      const alcance = telaW / 2 / ZOOM - PET_RENDER / 2 - 6; // mesma conta do CompanionHUD
      const centroNaTela = telaW / 2 + alcance * ZOOM;
      expect(centroNaTela + (SIZE * ZOOM) / 2).toBeLessThanOrEqual(telaW);
      expect(telaW / 2 - alcance * ZOOM - (SIZE * ZOOM) / 2).toBeGreaterThanOrEqual(0);
    }
  });
});
