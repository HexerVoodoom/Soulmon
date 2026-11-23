import { describe, it, expect } from 'vitest';
import { SIMULADOS, ART_LINE_BY_ELEMENT, SIM_ELEMENTO_REVISADO } from './_simulados.data.js';
import { ART_LINE_IDS } from './_artLine.js';
import { duelSide } from './_duel.js';
import { saveDoSimulado, upsertSimulado } from './_simulados.js';
import { getProfile } from './_profile.js';
import { CLASS_ELEMENT_ORDER } from '../../src/utils/soulProfile/types';
import { STARTER_ELEMENT } from '../../src/utils/starterElements';

describe('simulados: elemento coerente com a criatura (determinístico, nunca sorteado)', () => {
  it('o elemento é o que a ARTE mostra: um id válido dos 20 do oráculo; a revisão de 09/11/2026 está registrada em SIM_ELEMENTO_REVISADO', () => {
    for (const s of SIMULADOS) expect(CLASS_ELEMENT_ORDER, s.id).toContain(s.element);
    const ids = new Set(SIMULADOS.map(s => s.id));
    for (const [id, r] of Object.entries(SIM_ELEMENTO_REVISADO)) {
      expect(ids.has(id), id).toBe(true);
      expect(CLASS_ELEMENT_ORDER).toContain(r.para);
      expect(r.para, id).not.toBe(r.de);
      expect(SIMULADOS.find(s => s.id === id).element, id).toBe(r.para);
    }
    expect(Object.keys(SIM_ELEMENTO_REVISADO)).toHaveLength(55);
  });
  it('a artLine de fallback só existe quando tem o MESMO elemento (senão vazia) e está na lista fechada', () => {
    for (const s of SIMULADOS) {
      expect(s.artLine, s.id).toBe(ART_LINE_BY_ELEMENT[s.element] ?? '');
      if (s.artLine) expect(ART_LINE_IDS.has(s.artLine)).toBe(true);
    }
  });
  it('inicial como arte => o elemento é o do inicial (terra/som/ar/vida/fogo)', () => {
    for (const [linha, el] of Object.entries(STARTER_ELEMENT)) {
      for (const s of SIMULADOS.filter(x => x.artLine === linha)) expect(s.element, s.id).toBe(el);
    }
  });
  it('ids únicos e estáveis (sim_0001..sim_0170)', () => {
    expect(SIMULADOS.map(s => s.id)).toEqual(Array.from({ length: 170 }, (_, i) => `sim_${String(i + 1).padStart(4, '0')}`));
    expect(duelSide).toBeTypeOf('function');
  });
  it('duelo: fx.elBasica do simulado é o elemento dele, em todo dia, sem mexer nos stats', () => {
    for (const s of SIMULADOS) for (const dia of ['2026-10-25', '2026-12-01']) {
      const save = saveDoSimulado(s, dia);
      const a = duelSide(save), b = duelSide(save);
      expect(a.fx.elBasica, s.id).toBe(s.element);
      expect(a).toEqual(b);
      const { soulmonSkills, ...semSkills } = save;
      expect(duelSide(semSkills).combatant).toEqual(a.combatant);
    }
  });
  it('migração: perfil/save já materializados com o elemento antigo pegam o novo no próximo tique, sem mexer em id, apelido, pontos nem pid', async () => {
    const store = new Map();
    const kv = { get: async k => (store.has(k) ? store.get(k).v : null), getWithMetadata: async k => ({ value: store.has(k) ? store.get(k).v : null, metadata: store.get(k)?.m ?? null }), put: async (k, v, o) => { store.set(k, { v, m: o?.metadata }); }, delete: async k => { store.delete(k); }, list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(n => n.startsWith(prefix)).map(name => ({ name })), list_complete: true }) };
    const env = { SOULMON_SAVES: kv };
    const dia = '2026-11-10';
    const now = new Date('2026-11-10T10:00:00Z');
    for (const [id, r] of Object.entries(SIM_ELEMENTO_REVISADO).slice(0, 6)) {
      const novo = SIMULADOS.find(s => s.id === id);
      const antigo = { ...novo, element: r.de, artLine: ART_LINE_BY_ELEMENT[r.de] ?? '' };
      await upsertSimulado(env, antigo, dia, now);
      const antes = await getProfile(env, id);
      expect(antes.element).toBe(r.de);
      expect(JSON.parse(store.get(id).v).soulmonMeta.dominantElement).toBe(r.de);
      expect((await upsertSimulado(env, antigo, dia, now)).wrote).toBe(false); // idempotente
      expect((await upsertSimulado(env, novo, dia, now)).wrote).toBe(true);
      const depois = await getProfile(env, id);
      expect(depois.element).toBe(r.para);
      expect(depois.artLine ?? '').toBe(ART_LINE_BY_ELEMENT[r.para] ?? '');
      expect(JSON.parse(store.get(id).v).soulmonMeta.dominantElement).toBe(r.para);
      for (const k of ['id', 'pid', 'name', 'petName', 'createdAt', 'lifetimePoints', 'simulated']) expect(depois[k], k).toEqual(antes[k]);
      expect((await upsertSimulado(env, novo, dia, now)).wrote).toBe(false);
    }
  });
});
