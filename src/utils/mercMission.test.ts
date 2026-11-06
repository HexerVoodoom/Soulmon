import { describe, it, expect } from 'vitest';
import { MERC_TAREFAS, MERC_TAREFAS_BY_ID, mercTarefaValida } from '../data/mercTarefas';
import { MERC_ORDENS, MERC_TIPO, mercPool, sortearMerc, pontosMerc, escolherMerc, concluirMerc, mercDeHoje, sanitizeMercMission, tarefaDaMissao, renovarMercPendente } from './mercMission';

const base = {
  evolutionStage: 'rookie', powerPoints: 10, harmonyPoints: 10, benevolencePoints: 10,
  attributesSinceLastEvolution: { power: 1, harmony: 1, benevolence: 1 },
} as Parameters<typeof escolherMerc>[0];
const DIA = 'Fri Oct 30 2026';

describe('Guilda dos Mercenários: regras M1–M5', () => {
  it('M2: o pool de cada Ordem só tem tarefa de um dia válida (porteiro), com benefício PT/EN, e cobre as 3 Ordens', () => {
    for (const o of MERC_ORDENS) {
      const p = mercPool(o);
      expect(p.length).toBeGreaterThan(8);
      for (const i of p) { expect(i.ordem).toBe(o); expect(mercTarefaValida(i)).toBe(true); expect(i.benefit.pt.length).toBeGreaterThan(10); expect(i.benefit.en.length).toBeGreaterThan(10); }
    }
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
    const item = MERC_TAREFAS_BY_ID[state.mercMission!.activityId]!;
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
  it('effort 1 = 3 pontos; 2 = 5', () => {
    expect([pontosMerc({ effort: 1 }), pontosMerc({ effort: 2 })]).toEqual([3, 5]);
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
  it('proposta pendente antiga (id de hábito do catálogo geral) é descartada e sorteada de novo; a cumprida fica', () => {
    const antiga = { day: DIA, ordem: 'rompente' as const, activityId: 'hidratacao-agua', done: false };
    const novo = renovarMercPendente({ ...base, mercMission: antiga });
    expect(novo.mercMission!.activityId).toBe(sortearMerc(DIA, 'rompente')!.id);
    expect(tarefaDaMissao(antiga)).toBe(sortearMerc(DIA, 'rompente'));
    expect(renovarMercPendente(novo)).toBe(novo);
    const feita = { ...base, mercMission: { ...antiga, done: true } };
    expect(renovarMercPendente(feita)).toBe(feita);
    const outra = MERC_TAREFAS.find(t => t.ordem === 'tecelao')!;
    expect(tarefaDaMissao({ ...antiga, activityId: outra.id })!.ordem).toBe('rompente');
  });
  it('concluir uma pendente antiga paga a tarefa nova uma vez só', () => {
    const s = { ...base, mercMission: { day: DIA, ordem: 'filtrador' as const, activityId: 'qualquer-habito', done: false } };
    const f = concluirMerc(s, DIA);
    expect(f.mercMission!.done).toBe(true);
    expect(f.mercMission!.activityId).toBe(sortearMerc(DIA, 'filtrador')!.id);
    expect(f.benevolencePoints).toBe(10 + pontosMerc(sortearMerc(DIA, 'filtrador')!));
  });
});
