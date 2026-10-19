import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { REFUGIO_SCENE_SUAVE } from '../../utils/visorScenes';

/** D-81: fundo e bolha da Respiração são vetoriais; nada de bitmap pixelado esticado. */
describe('Respiração: fundo e bolha suaves', () => {
  const src = readFileSync(new URL('./RespiracaoGame.tsx', import.meta.url), 'utf8');
  it('a cena é só degradê, sem url() de bitmap', () => {
    expect(REFUGIO_SCENE_SUAVE).not.toMatch(/url\(/);
  });
  it('o jogo não usa image-rendering pixelated nem o sprite da bolha', () => {
    expect(src).not.toMatch(/imageRendering:\s*'(pixelated|crisp-edges)'/);
    expect(src).not.toMatch(/bolhaRespiro/);
    expect(src).not.toMatch(/REFUGIO_SCENE\b/);
  });
});

describe('Oficina da Mente: nenhum fundo de jogo é bitmap pixelado (D-81)', () => {
  for (const f of ['../mente/EcoGame.tsx', '../mente/RevisaoGame.tsx', '../mente/BolhasGame.tsx', '../mente/TrocaGame.tsx']) {
    it(`${f} usa cena vetorial`, () => {
      const src = readFileSync(new URL(f, import.meta.url), 'utf8');
      expect(src).not.toMatch(/\b(ATELIE_SCENE|REFUGIO_SCENE|trocaCeuScene|trocaGrutaScene)\b(?!_SUAVE)/);
    });
  }
});
