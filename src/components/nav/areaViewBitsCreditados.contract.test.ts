/**
 * O funil de Bits devolve o valor REALMENTE creditado (teto diario). Todo wrapper de `onEarnPoints` no AreaView tem
 * de repassar esse retorno ao jogo; um wrapper `{ props.onEarnPoints(pts); ... }` engole o numero e a tela de
 * resultado cai no `?? pedido` (mostra 50 com o teto de 150 gasto).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const fonte = readFileSync(resolve(__dirname, 'AreaView.tsx'), 'utf8');

describe('AreaView: onEarnPoints repassa o creditado', () => {
  it('o tipo da prop devolve number', () => {
    expect(fonte).toMatch(/onEarnPoints: \(points: number\) => number \| void;/);
  });
  it('nenhum wrapper chama props.onEarnPoints descartando o retorno', () => {
    const descartado = fonte.match(/(?<![=:?(\w] )(?<!const creditado = )(?<!\? )props\.onEarnPoints\(pts\);/g);
    expect(descartado).toBeNull();
  });
  it('arena, dino, barrage, match3, eco, zip e selo devolvem o creditado', () => {
    expect((fonte.match(/const creditado = (pts > 0 \? )?props\.onEarnPoints\(pts\)/g) ?? []).length).toBe(7);
    expect((fonte.match(/return creditado;/g) ?? []).length).toBe(7);
  });
});
