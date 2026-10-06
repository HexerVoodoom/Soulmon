/**
 * Combate v3 / PR7 (D7) — só os andares ALTOS da Masmorra têm portão pelo Vínculo; o andar 1 segue livre.
 * A regra pura é de `utils/gates.ts` (testada lá); aqui se trava que a tela não deixa descer pelo botão quando fechado.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('DungeonGame — o portão dos andares altos está ligado na tela', () => {
  const src = readFileSync(fileURLToPath(new URL('./DungeonGame.tsx', import.meta.url)), 'utf8');
  it('o botão de descer depende de masmorraFloorOpen, e o texto do portão vem de gateLine', () => {
    expect(src).toMatch(/masmorraFloorOpen\(floor \+ 1/);
    expect(src).toMatch(/disabled=\{!proximoAndarAberto\}/);
    expect(src).toMatch(/gateLine\('masmorraAlto'/);
  });
  it('nextFloor recusa quando fechado (defesa além do disabled)', () => {
    expect(src).toMatch(/if \(!proximoAndarAberto\) return;/);
  });
  it('sem Provider (demo, testes) nada fecha: o portão só vale com o Vínculo do save', () => {
    expect(src).toMatch(/!gs \|\| masmorraFloorOpen/);
  });
});
