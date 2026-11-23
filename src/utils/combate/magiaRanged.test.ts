import { describe, it, expect } from 'vitest';
import { foeStrikeForm, fxElementId } from '../combatFx';
import { meleeImpactOf, chaveDaIdentidade, RANGED_MAGIA_PCT } from './golpeImpacto';
import { fighterIdentityFromFx } from '../fighterIdentity';
import { ENEMY_ROSTER } from '../enemyRoster';
import { NOVOS_DATA } from '../novosSoulmonData';
// @ts-ignore
import { saveDoSimulado } from '../../../functions/api/_simulados.js';
// @ts-ignore
import { duelSide } from '../../../functions/api/_duel.js';
// @ts-ignore
import { SIMULADOS } from '../../../functions/api/_simulados.data.js';

/** Dos golpes À DISTÂNCIA de inimigos, selvagens e simulados, ~80% são Magic (ranged + splash); dono, 11/11/2026. Só visual. */
type Row = { el: string; key: string; name?: string };
function magiaPct(rows: Row[]) {
  let r = 0, m = 0;
  for (const x of rows) for (const role of ['basica', 'especial'] as const) {
    const el = fxElementId(x.el);
    const forma = foeStrikeForm(el, role);
    if (forma !== 'ranged') continue;
    r++; if (meleeImpactOf({ element: el, key: x.key, name: x.name, forma }) === 'concussao') m++;
  }
  return m / r;
}
const BANDA: [number, number] = [0.70, 0.86];
const dentro = (v: number) => { expect(v).toBeGreaterThanOrEqual(BANDA[0]); expect(v).toBeLessThanOrEqual(BANDA[1]); };

describe('ranged = ~80% magia (splash) em inimigos, selvagens e simulados', () => {
  it('alvo é 80%', () => expect(RANGED_MAGIA_PCT).toBe(80));
  it('Masmorra / Fenda / Raid / selvagens', () => {
    dentro(magiaPct(ENEMY_ROSTER.map(e => ({ el: e.element, key: e.name, name: e.name }))));
    dentro(magiaPct(ENEMY_ROSTER.map(e => ({ el: e.element, key: e.element, name: e.name }))));
    dentro(magiaPct(ENEMY_ROSTER.map((e, i) => ({ el: e.element, key: `${i % 3}|${e.element}` }))));
  });
  it('Arena (17 criaturas base)', () => {
    dentro(magiaPct(NOVOS_DATA.flatMap(d => [d.rookie, d.champion].map(n => ({ el: d.element, key: n, name: n })))));
  });
  it('simulados (sim_*): o fx do servidor carrega a flag e o cliente aplica só ao golpe à distância', () => {
    let r = 0, m = 0;
    for (const s of SIMULADOS as any[]) {
      const fx = duelSide(saveDoSimulado(s, '2026-11-10')).fx;
      expect(typeof (fx as any).magia).toBe('boolean');
      const id = fighterIdentityFromFx(fx, s.element);
      for (const role of ['basico', 'especial'] as const) {
        if (id[role].forma !== 'ranged') { expect(id[role].impacto).toBeUndefined(); continue; }
        r++; if (id[role].impacto === 'concussao') m++;
      }
      void chaveDaIdentidade;
    }
    dentro(m / r);
  });
  it('chefe de guilda: o especial (ranged) segue ~80% magia por elemento', () => {
    const els = ['fogo','agua','terra','ar','eletricidade','arcano','sombra','luz','vileza','morte','vida','vigor','marcial','tempo','som','gravidade','espaco','fada','industrial','planta'];
    const m = els.filter(e => meleeImpactOf({ element: e, key: `boss|${e}`, forma: 'ranged' }) === 'concussao').length / els.length;
    dentro(m);
  });
  it('jogador real (fx sem a flag): nada muda; corpo a corpo e o sorteio por elemento seguem iguais', () => {
    const id = fighterIdentityFromFx({ basica: 'longo_alcance', especial: 'longo_alcance', familia: 'direct', elBasica: 'fogo', elEspecial: 'fogo' }, 'fogo');
    expect(id.basico.impacto).toBeUndefined();
    expect(meleeImpactOf({ element: 'fogo', key: 'x' })).toBe(meleeImpactOf({ element: 'fogo', key: 'x', forma: 'melee' }));
  });
});
