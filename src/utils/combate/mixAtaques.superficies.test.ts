import { describe, it, expect } from 'vitest';
import { pesadeloGolpe, foeStrikeForm, fxElementId, FX_FALLBACK_ELEMENT } from '../combatFx';
import { meleeImpactOf, chaveDaIdentidade } from './golpeImpacto';
import { fighterIdentity, fighterIdentityFromFx } from '../fighterIdentity';
import { ENEMY_ROSTER } from '../enemyRoster';
import { NOVOS_DATA } from '../novosSoulmonData';
// @ts-ignore
import { saveDoSimulado } from '../../../functions/api/_simulados.js';
// @ts-ignore
import { duelSide } from '../../../functions/api/_duel.js';
// @ts-ignore
import { SIMULADOS } from '../../../functions/api/_simulados.data.js';
import { SPECIAL_FAMILIES } from './specials';
import { ESCOLAS_SKILL } from '../soulProfile/ficha/types';

type T = Record<string, number>;
const novo = (): T => ({ 'ranged-corte': 0, 'ranged-splash': 0, 'melee-corte': 0, 'melee-splash': 0 });
const add = (t: T, f: string, i: string) => { t[`${f}-${i === 'corte' ? 'corte' : 'splash'}`]++; };
const fmt = (t: T) => { const n = Object.values(t).reduce((a, b) => a + b, 0); return Object.entries(t).map(([k, v]) => `${k}=${(100 * v / n).toFixed(0)}%`).join(' ') + ` (n=${n})`; };
const BASE = ['fogo','agua','terra','ar','eletricidade','arcano','sombra','luz','vileza','morte','vida','vigor','marcial','tempo','som','gravidade','espaco','fada','industrial','planta'];

describe('mix de ataques por superfície (simulados e Pesadelo)', () => {
  it('simulados e Pesadelo: as 4 combinações em 18–32%', () => {
    const out: string[] = [];
    const foe = (label: string, rows: { el: string; key: string; name?: string }[]) => {
      const t = novo();
      for (const r of rows) for (const role of ['basica', 'especial'] as const) add(t, foeStrikeForm(fxElementId(r.el), role), meleeImpactOf({ element: fxElementId(r.el), key: r.key, name: r.name }));
      out.push(`${label}: ${fmt(t)}`);
    };
    foe('Masmorra', ENEMY_ROSTER.map(e => ({ el: e.element, key: e.name, name: e.name })));
    foe('Fenda/Rift (key=el)', ENEMY_ROSTER.map(e => ({ el: e.element, key: e.element, name: e.name })));
    foe('Arena(17 base)', NOVOS_DATA.flatMap(d => [d.rookie, d.champion].map(n => ({ el: d.element, key: n, name: n }))));
    { const t = novo(); for (let i = 0; i < 400; i++) for (let r = 0; r < 2; r++) { const g = pesadeloGolpe(i); add(t, g.forma, g.impacto); } out.push(`Pesadelo (400 ondas): ${fmt(t)}`); }
    foe('Raid (key f|el)', ENEMY_ROSTER.map((e, i) => ({ el: e.element, key: `${i % 3}|${e.element}` })));
    // jogador / oponente com ficha: escola x elemento x familia
    const pl = novo(); const porEscola: Record<string, T> = {};
    for (const el of BASE) for (const esc of ESCOLAS_SKILL) for (const fam of SPECIAL_FAMILIES) {
      const id = fighterIdentityFromFx({ basica: esc, especial: esc, familia: fam, elBasica: el, elEspecial: el }, el);
      const k = chaveDaIdentidade(id);
      porEscola[esc] ??= novo();
      for (const role of ['basico', 'especial'] as const) {
        const f = id[role].forma; const i = meleeImpactOf({ element: id[role].elemento, key: k });
        add(pl, f, i); add(porEscola[esc], f, i);
      }
    }
    out.push(`JOGADOR c/ ficha (todas escolas iguais): ${fmt(pl)}`);
    for (const [e, t] of Object.entries(porEscola)) out.push(`  escola ${e}: ${fmt(t)}`);
    // sem ficha (simulados): fx sem escola
    const sm = novo();
    for (const s of SIMULADOS as any[]) {
      const fx = duelSide(saveDoSimulado(s, '2026-11-10')).fx;
      const id = fighterIdentityFromFx(fx, s.element);
      const k = chaveDaIdentidade(id);
      for (const role of ['basico', 'especial'] as const) add(sm, id[role].forma, meleeImpactOf({ element: id[role].elemento, key: k }));
    }
    out.push(`SIMULADOS (sem escola): ${fmt(sm)}`);
    const checa = (t: T) => { const n = Object.values(t).reduce((a, b) => a + b, 0); for (const [k, v] of Object.entries(t)) { expect(v / n, k).toBeGreaterThanOrEqual(0.18); expect(v / n, k).toBeLessThanOrEqual(0.32); } };
    checa(sm);
    const pe = novo(); for (let i = 0; i < 400; i++) { const g = pesadeloGolpe(i); add(pe, g.forma, g.impacto); }
    checa(pe);
    expect(out.length).toBeGreaterThan(0);
  });
});
