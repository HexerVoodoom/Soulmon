/**
 * Combate v3 / PR7 (D7) — só os andares ALTOS da Masmorra têm portão pelo Vínculo; o andar 1 segue livre.
 * A regra pura é de `utils/gates.ts` (testada lá); aqui se trava que a tela não deixa descer pelo botão quando fechado.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('DungeonGame — o portão dos andares altos está ligado na tela', () => {
  const src = readFileSync(fileURLToPath(new URL('./DungeonGame.tsx', import.meta.url)), 'utf8');
  // Descida idle (08/10/2026): não há botão de "próximo andar"; o portão é checado ao limpar o andar e,
  // fechado, a descida TERMINA ali (sem cobrança), com o texto do portão vindo de gateLine.
  it('ao limpar o andar o portão do seguinte é consultado em masmorraFloorOpen, e o texto vem de gateLine', () => {
    expect(src).toMatch(/floorOpen\(floor \+ 1\)/);
    expect(src).toMatch(/masmorraFloorOpen\(f, bondLevelFor/);
    expect(src).toMatch(/gateLine\('masmorraAlto'/);
  });
  it('portão fechado encerra a descida (endDescent selado) em vez de entrar no andar', () => {
    // REGISTRO §31: fechado pelo Vínculo = 'sealed' (com o gateLine); além do teto do Lv = 'deep'. Nos dois, a descida termina.
    expect(src).toMatch(/if \(!floorOpen\(floor \+ 1\)\) \{ endDescent\(.*'deep' : 'sealed'\); return; \}/);
  });
  it('sem Provider (demo, testes) nada fecha: o portão só vale com o Vínculo do save', () => {
    expect(src).toMatch(/!gs \|\| masmorraFloorOpen/);
  });
});
