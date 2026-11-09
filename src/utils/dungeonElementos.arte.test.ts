import { describe, it, expect } from 'vitest';
import { ELEMENTOS_DA_MASMORRA } from './dungeonElementos';
import { dungeonWaveOf } from './dungeonAway';
import { ENEMY_ROSTER, pickEnemy } from './enemyRoster';
import { rosterSpriteOf } from './novosSoulmon';
import { COMBINADOS_ART } from './enemyRosterArt';

/**
 * Fenda Sem Fim temática (09/11/2026; dono: inimigos de "Chama Azul" pareciam a criatura de Vigor).
 * Para TODO elemento que pode aparecer na Fenda: o inimigo sorteado é DAQUELE elemento, tem arte, e a arte não é o quebra-galho de
 * `enemyRosterArt.ts` (rookie da criatura base do 1º componente) — exceto os que estão na dívida de arte declarada abaixo.
 */
const SEM_ARTE_PROPRIA = ['alto_forno', 'bencao_feerica', 'clareira', 'colosso_blindado', 'corte_feerica', 'floresta_ancestral'];

const baseRookie = (el: string) => rosterSpriteOf(ENEMY_ROSTER.find(e => e.kind === 'base' && e.element === el && e.stage === 'rookie')!);

describe('Fenda Sem Fim: a arte do inimigo é do elemento da camada', () => {
  for (const el of ELEMENTOS_DA_MASMORRA) {
    it(`elemento ${el}`, () => {
      const e = pickEnemy(Number.POSITIVE_INFINITY, () => 0.3, { element: el, stage: 'rookie' });
      expect(e.element, 'caiu no sorteio comum').toBe(el);
      const s = rosterSpriteOf(e);
      expect(s, 'sem arte').toBeTruthy();
      if (e.kind === 'combinado') {
        const base = e.elements.map(baseRookie);
        if (SEM_ARTE_PROPRIA.includes(el)) expect(base, `${el} ganhou arte própria: tire da lista`).toContain(s);
        else expect(base, `${el} usa o rookie de ${e.elements.join('/')}`).not.toContain(s);
      } else if (e.kind === 'base') {
        expect(s).toContain(`/${el}-`);
      }
    });
    it(`onda da camada de ${el} só tem esse elemento`, () => {
      const w = dungeonWaveOf(1, ELEMENTOS_DA_MASMORRA.indexOf(el) * 2 + 1, 30, 'mega');
      for (const f of w) if (f.element) expect(f.element).toBe(el);
    });
  }
  it('nenhum PNG combinado é compartilhado, salvo os da dívida de arte', () => {
    const porUrl = new Map<string, string[]>();
    for (const [k, u] of Object.entries(COMBINADOS_ART)) porUrl.set(u, [...(porUrl.get(u) ?? []), k]);
    const dup = [...porUrl.values()].filter(v => v.length > 1).flat().map(k => k.replace(/^\d+-/, '')).sort();
    expect(dup).toEqual(SEM_ARTE_PROPRIA.filter(x => dup.includes(x)).sort());
  });
});
