import { describe, expect, it } from 'vitest';
import { CAMADAS_DO_CICLO, elementoDaCamada } from './dungeonElementos';
import { combatSceneBgDaCamada } from './combatArt';

// Bug do dono (09/11/2026): "desci umas 3 camadas e continuo vendo mesmo elemento, mesmo cenário".
// Elemento muda a cada 2 camadas (§249); compostos sem arte própria giram entre os cenários dos componentes.
describe('cenário da Fenda entre camadas', () => {
  it('em qualquer janela de 3 camadas seguidas há mais de um cenário', () => {
    for (let l = 1; l <= CAMADAS_DO_CICLO - 3; l++) {
      const cenarios = new Set([l, l + 1, l + 2].map(x => combatSceneBgDaCamada(elementoDaCamada(x), x)));
      expect(cenarios.size, `camada ${l}`).toBeGreaterThan(1);
    }
  });
  it('todo cenário existe e a conta é determinística', () => {
    for (let l = 1; l <= CAMADAS_DO_CICLO; l++) {
      const a = combatSceneBgDaCamada(elementoDaCamada(l), l);
      expect(a).toBeTruthy();
      expect(combatSceneBgDaCamada(elementoDaCamada(l), l)).toBe(a);
    }
  });
});
