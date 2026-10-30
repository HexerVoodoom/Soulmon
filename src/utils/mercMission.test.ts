import { describe, it, expect } from 'vitest';
import { ACTIVITY_CATALOG } from '../data/activityCatalog';
import { MERC_ORDENS, MERC_TIPO, mercPool, sortearMerc, pontosMerc, escolherMerc, concluirMerc, mercDeHoje, ordemDaCategoria, sanitizeMercMission } from './mercMission';

const base = {
  evolutionStage: 'rookie', powerPoints: 10, harmonyPoints: 10, benevolencePoints: 10,
  attributesSinceLastEvolution: { power: 1, harmony: 1, benevolence: 1 },
} as Parameters<typeof escolherMerc>[0];
const DIA = 'Fri Oct 30 2026';

describe('Guilda dos Mercenários: regras M1–M5', () => {
  it('M2: o pool de cada Ordem só tem evidência A/B, sem optInOnly, e cobre as 3 Ordens', () => {
    for (const o of MERC_ORDENS) {
      const p = mercPool(o);
      expect(p.length).toBeGreaterThan(2);
      for (const i of p) { expect(['A', 'B']).toContain(i.evidence.level); expect(i.optInOnly).toBeFalsy(); expect(ordemDaCategoria(i.category)).toBe(o); }
    }
    expect(ACTIVITY_CATALOG.some(i => i.evidence.level === 'C')).toBeDefined();
  });
  it('sorteio determinístico por dia + Ordem (reabrir não troca) e varia entre dias', () => {
    for (const o of MERC_ORDENS) expect(sortearMerc(DIA, o)!.id).toBe(sortearMerc(DIA, o)!.id);
    const ids = new Set(Array.from({ length: 40 }, (_, d) => sortearMerc(`d${d}`, 'tecelao')!.id));
    expect(ids.size).toBeGreaterThan(1);
  });
  it('M1: 1 por dia; no dia seguinte o convite renova sem castigo', () => {
    const a = escolherMerc(base, 'rompente', DIA);
    expect(a.recusa).toBeUndefined();
    expect(escolherMerc(a.state, 'tecelao', DIA).recusa).toBe('ja-escolheu');
    expect(mercDeHoje(a.state, 'Sat Oct 31 2026')).toBeNull();
    expect(escolherMerc(a.state, 'tecelao', 'Sat Oct 31 2026').recusa).toBeUndefined();
  });
  it('M5: BB recusa', () => {
    expect(escolherMerc({ ...base, evolutionStage: 'bb' }, 'rompente', DIA).recusa).toBe('bb');
  });
  it('M4: paga só pontos do tipo (3 ou 5), pelo caminho dos atributos, uma vez só', () => {
    const { state } = escolherMerc(base, 'filtrador', DIA);
    const item = ACTIVITY_CATALOG.find(i => i.id === state.mercMission!.activityId)!;
    const pts = pontosMerc(item);
    expect([3, 5]).toContain(pts);
    const f = concluirMerc(state, DIA);
    expect(f.benevolencePoints).toBe(10 + pts);
    expect(f.powerPoints).toBe(10); expect(f.harmonyPoints).toBe(10);
    expect(f.attributesSinceLastEvolution!.benevolence).toBe(1 + pts);
    expect(f.mercMission!.done).toBe(true);
    expect(concluirMerc(f, DIA)).toBe(f);
    expect(MERC_TIPO.filtrador).toBe('benevolence');
  });
  it('effort 1 = 3 pontos; 2–3 = 5', () => {
    const lv = (e: 1 | 2 | 3) => ({ levels: [{ effort: e }] }) as unknown as Parameters<typeof pontosMerc>[0];
    expect([pontosMerc(lv(1)), pontosMerc(lv(2)), pontosMerc(lv(3))]).toEqual([3, 5, 5]);
  });
  it('sem a missão de hoje não paga nada', () => {
    expect(concluirMerc(base, DIA)).toBe(base);
    const { state } = escolherMerc(base, 'rompente', DIA);
    expect(concluirMerc(state, 'Sat Oct 31 2026')).toBe(state);
  });
  it('leitura tolerante: o estado válido passa, lixo vira ausente', () => {
    const { state } = escolherMerc(base, 'rompente', DIA);
    expect(sanitizeMercMission(state.mercMission)).toEqual(state.mercMission);
    expect(sanitizeMercMission({ day: DIA })).toBeUndefined();
  });
});
