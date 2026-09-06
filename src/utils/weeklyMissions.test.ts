/**
 * WP4.7 — missões semanais repetíveis.
 *
 * As seis missões que existiam eram de alvo único e ACABAVAM: quem cumpriu as
 * seis não tem mais missão nenhuma pelo resto da vida do save.
 *
 * Duas travas guardadas aqui, e a primeira é uma proibição escrita do
 * CLAUDE.md: nenhuma missão premia CONTAGEM DE TAREFAS. "Faça 10 tarefas" é a
 * missão mais óbvia do mundo e é exatamente o desenho que faz a pessoa
 * cadastrar cinco triviais em vez de encarar a difícil.
 */
import { describe, it, expect } from 'vitest';
import {
  weeklyMissionsFor, weeklyMissionPool, WEEKLY_MISSION_COUNT,
  emptyWeeklyProgress, forWeek, bumpWeekly, isWeeklyDone, claimWeekly,
} from './weeklyMissions';

describe('weeklyMissions — o sorteio é da SEMANA, não da abertura', () => {
  it('a mesma semana devolve sempre as mesmas três', () => {
    // Se a lista mudasse a cada abertura, a pessoa aprenderia a reabrir o app
    // até cair uma fácil — o oposto do que missão semanal existe para fazer.
    const a = weeklyMissionsFor('2026-W37').map(m => m.id);
    const b = weeklyMissionsFor('2026-W37').map(m => m.id);
    expect(a).toEqual(b);
    expect(a).toHaveLength(WEEKLY_MISSION_COUNT);
  });

  it('semanas diferentes dão listas diferentes', () => {
    const semanas = ['2026-W37', '2026-W38', '2026-W39', '2026-W40'].map(
      w => weeklyMissionsFor(w).map(m => m.id).join(','),
    );
    expect(new Set(semanas).size).toBeGreaterThan(1);
  });

  it('não repete missão dentro da mesma semana', () => {
    for (const w of ['2026-W01', '2026-W20', '2026-W52']) {
      const ids = weeklyMissionsFor(w).map(m => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('weeklyMissions — NENHUMA premia contagem de tarefa', () => {
  it('o pool inteiro fala de cuidado e presença', () => {
    for (const m of weeklyMissionPool()) {
      const texto = `${m.descPt} ${m.descEn}`.toLowerCase();
      for (const proibido of ['tarefas', 'tasks', 'atividades', 'activities', 'hábitos', 'habits']) {
        // "Termine uma tarefa que estava te olhando" é a exceção deliberada:
        // é sobre a assombrada (alívio), não sobre quantidade — e por isso o
        // alvo dela é 1, nunca N.
        if (m.id === 'haunted-done') continue;
        expect(texto, `a missão '${m.id}' premia contagem ("${proibido}")`).not.toContain(proibido);
      }
    }
  });

  it('a exceção da assombrada tem alvo 1 — é alívio, não quantidade', () => {
    const assombrada = weeklyMissionPool().find(m => m.id === 'haunted-done')!;
    expect(assombrada.target).toBe(1);
  });

  it('a recompensa é pequena, em Emblemas, e nunca em Bits ou Créditos', () => {
    for (const m of weeklyMissionPool()) {
      expect(m.emblems).toBeGreaterThan(0);
      expect(m.emblems).toBeLessThanOrEqual(5);
      expect(Object.keys(m)).not.toContain('credits');
      expect(Object.keys(m)).not.toContain('bits');
    }
  });
});

describe('weeklyMissions — o progresso zera na semana e paga uma vez', () => {
  const m = weeklyMissionsFor('2026-W37')[0];

  it('semana nova zera; semana igual devolve a MESMA referência', () => {
    const p = emptyWeeklyProgress('2026-W37');
    expect(forWeek(p, '2026-W37')).toBe(p);
    expect(forWeek(p, '2026-W38').counts).toEqual({});
  });

  it('só paga quando terminou', () => {
    let p = emptyWeeklyProgress('2026-W37');
    expect(claimWeekly(p, m).emblems).toBe(0);
    for (let i = 0; i < m.target; i += 1) p = bumpWeekly(p, m.id);
    expect(isWeeklyDone(p, m)).toBe(true);
    expect(claimWeekly(p, m).emblems).toBe(m.emblems);
  });

  it('não paga duas vezes (o updater roda 2× no StrictMode)', () => {
    let p = emptyWeeklyProgress('2026-W37');
    for (let i = 0; i < m.target; i += 1) p = bumpWeekly(p, m.id);
    const primeiro = claimWeekly(p, m);
    const segundo = claimWeekly(primeiro.progress, m);
    expect(segundo.emblems).toBe(0);
    expect(segundo.progress).toBe(primeiro.progress);
  });
});
