/**
 * PARIDADE dos talentos entre o app (`src/utils/talents.ts`) e o servidor (`_talents.js`), e a
 * validacao do vetor no `save.js` (Combate v3 / PR7). Nunca confiar no cliente: invalido = descartado.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_talents.js';
import { TALENT_TREE, TALENT_POINTS_MAX, talentPointsFor, isValidPicks, sanitizeTalentPicks, talentBonus, isPickable } from '../../src/utils/talents';
import { bondLevelFor, xpForLevel } from '../../src/utils/bond';
import { onRequest } from './save.js';
import { duelSide } from './_duel.js';
import { COMBAT_BONUS_CAP } from '../../src/utils/combate/bonus';

describe('o catalogo do servidor e o do app sao o MESMO', () => {
  it('mesmos nos pegaveis, mesmo grau maximo, mesmo efeito', () => {
    const app = TALENT_TREE.filter(isPickable);
    expect(Object.keys(srv.PICKABLE).sort()).toEqual(app.map((n) => n.id).sort());
    for (const n of app) {
      const s = srv.PICKABLE[n.id];
      expect(s.maxRank, n.id).toBe(n.maxRank);
      expect(s.kind, n.id).toBe(n.effect.kind);
      expect(s.perRank, n.id).toBe(n.effect.perRank);
      if (n.effect.kind === 'combatBonus') expect(s.scope, n.id).toBe(n.effect.scope);
    }
  });
  it('mesmo teto de pontos e mesmos pontos por Vinculo', () => {
    expect(srv.TALENT_POINTS_MAX).toBe(TALENT_POINTS_MAX);
    for (const l of [1, 2, 5, 19, 20, 21, 1000, NaN, -1, null, 'x']) expect(srv.talentPointsFor(l)).toBe(talentPointsFor(l));
  });
  it('a decisao (valido/descartado) e o bonus batem em vetores gerados', () => {
    const ids = [...Object.keys(srv.PICKABLE), 'tal-pvp-04', 'lixo', 7, null];
    let s = 12345;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;
    for (let i = 0; i < 4000; i++) {
      const len = Math.floor(rnd() * 23);
      const picks = Array.from({ length: len }, () => ids[Math.floor(rnd() * ids.length)]);
      const lvl = Math.floor(rnd() * 25);
      expect(srv.isValidPicks(picks, lvl), JSON.stringify([picks, lvl])).toBe(isValidPicks(picks, lvl));
      expect(srv.sanitizeTalentPicks(picks, lvl)).toEqual(sanitizeTalentPicks(picks, lvl));
      for (const scope of ['pvp', 'pve']) expect(srv.talentBonus(picks, lvl, scope)).toBeCloseTo(talentBonus(picks, lvl, scope), 12);
    }
  });
});

const ID = 'b'.repeat(32);
function fakeKV() {
  const store = new Map(); const meta = new Map();
  return {
    store,
    get: async (k) => store.get(k) ?? null,
    getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async (k) => { store.delete(k); meta.delete(k); },
  };
}
async function salva(state) {
  const env = { DIGIAPP_SAVES: fakeKV() };
  const res = await onRequest({ request: new Request(`https://x/api/save?id=${ID}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ state }) }), env });
  expect(res.status).toBe(200);
  return JSON.parse(env.DIGIAPP_SAVES.store.get(ID));
}
const GRAUS = (id, n) => Array(n).fill(id);

describe('save.js valida talentPicks contra o Vinculo do proprio save', () => {
  it('picks validos para o Vinculo passam intactos', async () => {
    const out = await salva({ totalXP: xpForLevel(6), talentPicks: [...GRAUS('tal-pvp-01', 4), 'tal-pve-01', 'tal-pve-02'] });
    expect(out.talentPicks).toHaveLength(6);
  });
  it('1 pick a mais que os pontos do level: o vetor INTEIRO e descartado (nao corrigido)', async () => {
    const out = await salva({ totalXP: xpForLevel(5), talentPicks: [...GRAUS('tal-pvp-01', 4), 'tal-pve-01', 'tal-pve-02'] });
    expect(out.talentPicks).toEqual([]);
  });
  it('XP forjado ausente/lixo = Vinculo 1: so cabe 1 ponto', async () => {
    expect((await salva({ talentPicks: ['tal-pvp-01', 'tal-pvp-02'] })).talentPicks).toEqual([]);
    expect((await salva({ totalXP: 'muito', talentPicks: ['tal-pvp-01', 'tal-pvp-02'] })).talentPicks).toEqual([]);
    expect((await salva({ talentPicks: ['tal-pvp-01'] })).talentPicks).toEqual(['tal-pvp-01']);
  });
  it('id inventado, no sem efeito ligado, grau a mais, tipo errado: descartado', async () => {
    const xp = xpForLevel(30);
    for (const picks of [['tal-pvp-05'], ['tal-com-05'], ['tal-pvp-04'], ['x'], GRAUS('tal-pve-01', 5), [1], 'tal-pvp-01', { a: 1 }, null]) {
      expect((await salva({ totalXP: xp, talentPicks: picks })).talentPicks, JSON.stringify(picks)).toEqual([]);
    }
  });
  it('save sem o campo continua sem o campo (a contagem de campos nao muda no servidor)', async () => {
    expect('talentPicks' in (await salva({ totalXP: 5 }))).toBe(false);
  });
});

describe('o duelo usa o talento pelo canal de bonus, DENTRO do teto', () => {
  const base = { evolutionStage: 'rookie', perfectDays: 3, powerPoints: 2, harmonyPoints: 2, benevolencePoints: 2 };
  const cheio = [...GRAUS('tal-pvp-01', 4), ...GRAUS('tal-pvp-02', 4), ...GRAUS('tal-pvp-03', 4)];

  it('sem talento o bonus e 0 (como antes do PR7)', () => {
    expect(duelSide(base).combatant.bonus).toBe(0);
    expect(duelSide({ ...base, totalXP: xpForLevel(20) }).combatant.bonus).toBe(0);
  });
  it('PvP cheio no Vinculo certo vale o valor real, <= 5%', () => {
    const b = duelSide({ ...base, totalXP: xpForLevel(20), talentPicks: cheio }).combatant.bonus;
    expect(b).toBeGreaterThan(0.04);
    expect(b).toBeLessThanOrEqual(COMBAT_BONUS_CAP);
  });
  it('talento de PvE nao conta no duelo', () => {
    const b = duelSide({ ...base, totalXP: xpForLevel(20), talentPicks: [...GRAUS('tal-pve-01', 4)] }).combatant.bonus;
    expect(b).toBe(0);
  });
  it('picks forjados (acima dos pontos do Vinculo do save) valem 0, mesmo que o save.js nao tenha passado por eles', () => {
    expect(duelSide({ ...base, totalXP: 0, talentPicks: cheio }).combatant.bonus).toBe(0);
    expect(bondLevelFor(0)).toBe(1);
  });
});
