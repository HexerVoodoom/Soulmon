/**
 * Dono, 06/11/2026: "Na Guilda dos Mercenários as tarefas duram dias, 3 vezes por semana. Tem que ser
 * tarefa pontual, o usuário fazer naquele dia só." Aqui: (1) a causa, medida em amostras reais do
 * catálogo de hábitos que a Guilda sorteava; (2) o catálogo próprio nunca cai na mesma regra; (3) o
 * porteiro recusa o que o gerador (ou um save) trouxer fora da regra; (4) PT/EN completos e sem promessa de saúde.
 */
import { describe, it, expect } from 'vitest';
import { ACTIVITY_CATALOG } from './activityCatalog';
import { MERC_TAREFAS, mercTarefaProblemas, mercTarefaValida, mercTextoForaDaRegra, type MercTarefa } from './mercTarefas';

describe('causa: os alvos do catálogo de hábitos que a Guilda sorteava eram de frequência', () => {
  const alvos = ACTIVITY_CATALOG.filter(i => (i.evidence.level === 'A' || i.evidence.level === 'B') && !i.optInOnly)
    .flatMap(i => [i.levels[0].target.pt, i.levels[0].target.en]);
  it('a maioria das amostras reais do nível 1 fala em vezes por semana ou hábito (o porteiro as recusaria)', () => {
    const fora = alvos.filter(mercTextoForaDaRegra);
    console.log(`amostras reais: ${alvos.length} alvos PT/EN, ${fora.length} recusados pelo porteiro; ex.: ${fora.slice(0, 4).join(' | ')}`);
    expect(fora.length).toBeGreaterThan(alvos.length / 3);
  });
});

describe('catálogo da Guilda: tarefa de um dia, uma vez', () => {
  it('tem as 3 Ordens, ids únicos e com prefixo da Ordem', () => {
    expect(new Set(MERC_TAREFAS.map(t => t.id)).size).toBe(MERC_TAREFAS.length);
    for (const o of ['filtrador', 'tecelao', 'rompente'] as const) expect(MERC_TAREFAS.filter(t => t.ordem === o).length).toBeGreaterThanOrEqual(10);
    for (const t of MERC_TAREFAS) expect(t.id[0]).toBe({ filtrador: 'f', tecelao: 't', rompente: 'r' }[t.ordem]);
  });
  it.each(MERC_TAREFAS.map(t => [t.id, t] as const))('%s: PT e EN completos, benefício presente, sem frequência nem saúde', (_id, t) => {
    expect(mercTarefaProblemas(t)).toEqual([]);
    for (const tx of [t.name, t.target, t.benefit]) { expect(tx.pt.length).toBeGreaterThan(3); expect(tx.en.length).toBeGreaterThan(3); expect(tx.pt).not.toBe(tx.en); }
    expect([1, 2]).toContain(t.effort);
  });
});

describe('porteiro do gerador', () => {
  const ok = MERC_TAREFAS[0];
  it('recusa frequência e hábito, PT e EN', () => {
    for (const x of ['Caminhe 3x por semana', 'Treine 2 vezes por semana', 'Beba água todo dia', 'Faça isso diariamente', 'Crie o hábito de ler', 'Walk 3 times a week', 'Do it every day', 'Keep a daily streak', 'Sempre que puder', 'Mantenha a rotina']) {
      expect(mercTextoForaDaRegra(x), x).toBe(true);
    }
  });
  it('recusa promessa de saúde ou conduta terapêutica, PT e EN', () => {
    for (const x of ['Ajuda contra a ansiedade', 'Melhora a saúde do coração', 'Trata a depressão', 'Reduz o estresse', 'Good for your health', 'Treats anxiety', 'A therapy exercise', 'Melhora o sono']) {
      expect(mercTextoForaDaRegra(x), x).toBe(true);
    }
  });
  it('aceita tarefa de um dia', () => {
    for (const x of ['Escreva três linhas sobre o que aconteceu hoje.', 'Take a photo of something beautiful you saw today.']) expect(mercTextoForaDaRegra(x), x).toBe(false);
  });
  it('recusa tarefa sem benefício, com benefício só em um idioma, ou com texto fora da regra', () => {
    expect(mercTarefaValida(ok)).toBe(true);
    expect(mercTarefaValida({ ...ok, benefit: { pt: 'Algo bom.', en: '' } })).toBe(false);
    expect(mercTarefaValida({ ...ok, benefit: undefined } as unknown as MercTarefa)).toBe(false);
    expect(mercTarefaValida({ ...ok, target: { pt: 'Corra 3x por semana.', en: 'Run 3 times a week.' } })).toBe(false);
    expect(mercTarefaValida({ ...ok, benefit: { pt: 'Reduz a ansiedade.', en: 'Reduces anxiety.' } })).toBe(false);
    expect(mercTarefaValida(null)).toBe(false);
  });
});
