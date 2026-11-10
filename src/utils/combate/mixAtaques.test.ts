import { describe, it, expect } from 'vitest';
import { foeStrikeForm } from '../combatFx';
import { meleeImpactOf } from './golpeImpacto';
import { NOVOS_DATA } from '../novosSoulmonData';
import { ENEMY_ROSTER } from '../enemyRoster';

/** Mix {ranged,melee} × {corte,splash} dos INIMIGOS (REGISTRO §282): antes 88% ranged no elenco; meta ~25% cada. */
type Row = { el: string; n1: string; n2: string };
function mix(rows: Row[]) {
  const t: Record<string, number> = { 'ranged-corte': 0, 'ranged-splash': 0, 'melee-corte': 0, 'melee-splash': 0 };
  let n = 0;
  for (const r of rows) for (const role of ['basica', 'especial'] as const) {
    const f = foeStrikeForm(r.el, role);
    const i = meleeImpactOf({ element: r.el, key: r.n2, name: `${r.n1} ${r.n2}` });
    t[`${f}-${i === 'corte' ? 'corte' : 'splash'}`]++; n++;
  }
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / n])) as Record<string, number>;
}
const TOL: [number, number] = [0.18, 0.32];

describe('mix de ataques dos inimigos', () => {
  it('elenco da Masmorra/Fenda: as 4 combinações dentro de 18–32%', () => {
    const m = mix(ENEMY_ROSTER.map(e => ({ el: e.element, n1: e.name, n2: e.name })));
    for (const [k, v] of Object.entries(m)) { expect(v, k).toBeGreaterThanOrEqual(TOL[0]); expect(v, k).toBeLessThanOrEqual(TOL[1]); }
  });
  it('as 17 criaturas da Arena (rookie + champion): idem', () => {
    const m = mix(NOVOS_DATA.flatMap(d => [{ el: d.element, n1: d.rookie, n2: d.rookie }, { el: d.element, n1: d.champion, n2: d.champion }]));
    for (const [k, v] of Object.entries(m)) { expect(v, k).toBeGreaterThanOrEqual(TOL[0]); expect(v, k).toBeLessThanOrEqual(TOL[1]); }
  });
  it('determinístico e só para inimigo: a tabela do jogador não muda', () => {
    expect(foeStrikeForm('zzz-inventado', 'basica')).toBe(foeStrikeForm('zzz-inventado', 'basica'));
    expect(foeStrikeForm('fogo', 'especial')).toBe('melee');
    expect(foeStrikeForm('ar', 'especial')).toBe('ranged');
  });
});
