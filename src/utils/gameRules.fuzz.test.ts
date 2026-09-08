/**
 * RODADA 6 — TESTE DE PROPRIEDADE sobre as funções puras de regra.
 *
 * As outras suítes afirmam RESULTADOS para cenários escolhidos a dedo. Este
 * arquivo afirma INVARIANTES sobre milhares de estados gerados, incluindo as
 * bordas que ninguém escreve à mão (0, negativo, fracionário, ausente, tipo
 * errado, data no futuro). É um instrumento diferente de propósito: uma fixture
 * escrita por quem escreveu o código herda os mesmos pontos cegos.
 *
 * REGRA DESTE ARQUIVO: invariante que contraria a tabela do CLAUDE.md é bug do
 * teste, não do código. Onde um invariante "óbvio" NÃO vale por decisão de
 * design, o caso está escrito com o porquê em vez de removido — senão a próxima
 * rodada gasta o mesmo tempo redescobrindo.
 *
 * PRNG determinístico: o mesmo seed reproduz o mesmo estado, então uma falha
 * aqui é sempre reproduzível pelo número que a mensagem imprime.
 */
import { describe, it, expect } from 'vitest';
import {
  computeDailyReset,
  rawHeartsLostFor,
  tasksToAvoidHeartLoss,
  dailyGoalFor,
  heartGoalFor,
  daysSinceLastReset,
  MAX_HEARTS_LOST_PER_DAY,
  restWeekKeyFor,
} from './dailyReset';
import { feedFood, rubHeal, completeTask, feedsLeft, FOOD_LIMIT_PER_HOUR } from './careRules';
import { computeCarePattern, resolveBranch, careHistory } from './carePattern';
import { getTierStanding, TOURNAMENT_TIERS } from './tournamentTiers';
import { MAX_HP_BY_FORM, getStageLevel, getMaxEnergyForStage } from '../types/progression';

// ── PRNG determinístico (mulberry32) ────────────────────────────────────────
function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, a: readonly T[]): T => a[Math.floor(r() * a.length)];

const STAGES = ['rookie', 'champion-virus', 'champion-data', 'ultimate-data', 'mega-vaccine', 'ultra'] as const;
const CATS = ['saude', 'trabalho', 'estudo'] as const;

/** Estado plausível de um jogador REAL, com as bordas do domínio incluídas. */
function genState(r: () => number, now: Date): Record<string, any> {
  const evolutionStage = pick(r, STAGES);
  const maxHP = MAX_HP_BY_FORM[getStageLevel(evolutionStage)];
  const ontem = new Date(now.getTime() - 86400000).toDateString();

  const activities = Array.from({ length: Math.floor(r() * 9) }, (_, i) => ({
    id: `a${i}`, name: `a${i}`, category: pick(r, CATS), emoji: '🍎',
    steps: r() < 0.5 ? [] : Array.from({ length: 1 + Math.floor(r() * 3) },
      (_, j) => ({ id: `s${j}`, label: `s${j}`, completed: r() < 0.5 })),
    weekDays: [0, 1, 2, 3, 4, 5, 6].filter(() => r() < 0.6),
    completedToday: r() < 0.5,
    lastCompletedDate: r() < 0.85 ? ontem : 'Thu Jan 01 1970',
  }));

  const tasks = Array.from({ length: Math.floor(r() * 7) }, (_, i) => ({
    id: `t${i}`, name: `t${i}`, category: pick(r, CATS), emoji: '📝', completed: r() < 0.5,
  }));

  const completedTasks = Array.from({ length: Math.floor(r() * 6) }, (_, i) => ({
    id: `c${i}`, name: `c${i}`, category: pick(r, CATS), emoji: '✅',
    // metade de ontem (contam), metade de outro dia (não contam)
    completedAt: new Date(now.getTime() - (r() < 0.5 ? 86400000 : 86400000 * 9)).toISOString(),
  }));

  return {
    activities, tasks, completedTasks, activityStats: {},
    // `maxHP + 2` de propósito: um save que chega ACIMA do máximo do estágio
    // (queda de mega para rookie num cliente antigo, edição do localStorage,
    // save da nuvem forjado) é o único caso em que o clamp final da virada é
    // load-bearing. Sem ele aqui, apagar `Math.min(newHP, newMaxHP)` passava.
    healthPoints: pick(r, [0, 0.5, 1, 1.5, 2, 2.5, 3, maxHP, maxHP + 2]),
    maxHealthPoints: maxHP,
    energyPoints: Math.floor(r() * 9),
    perfectDays: Math.floor(r() * 15),
    totalPerfectDays: Math.floor(r() * 60),
    totalXP: 0, virusPoints: 0, dataPoints: 0, vaccinePoints: 0,
    lastResetDate: new Date(now.getTime() - 86400000 * (1 + Math.floor(r() * 5))).toDateString(),
    evolutionStage,
    unlockedEvolutions: ['rookie'],
    degeneratedByHP: false,
    currentBranch: pick(r, ['virus', 'data', 'vaccine'] as const),
    lastDayWasPerfect: false,
    maxActivityCap: 6,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
    foodInventory: {},
    petPassive: pick(r, [undefined, 'guloso', 'teimoso', 'carinhoso', 'sortudo', 'madrugador']),
    // P2 — a folga da semana. Sorteada, e com peso em ZERO: com a folga sempre
    // disponível o gerador nunca produziria o desfecho "perdeu coração" (a
    // autoverificação lá embaixo cobra exatamente isso), e os invariantes de
    // perda mediriam o nada. `undefined` no meio é o save antigo.
    restDaysLeft: pick(r, [0, 0, 0, 1, undefined]),
    restWeekKey: restWeekKeyFor(new Date(now.getTime() - 86400000)),
  };
}

/** Roda `n` seeds e junta as violações; o expect mostra a entrada exata. */
function varrer(n: number, offset: number, fn: (s: any, now: Date, seed: number) => string[]): string[] {
  const fails: string[] = [];
    for (let seed = 0; seed < n; seed++) {
    const r = mulberry32(seed + offset);
    // Varre o ano inteiro: pega segunda-feira (alívio semanal) e todo dia da semana.
    const now = new Date(2026, Math.floor(r() * 12), 1 + Math.floor(r() * 28), 3, 0, 0);
    fails.push(...fn(genState(r, now), now, seed));
  }
  return fails;
}

// ═══════════════════════════════════════════════════════════════════════════
describe('computeDailyReset — invariantes sobre estado gerado', () => {
  it('HP fica sempre em [0, máximo do estágio RESULTANTE] e na grade de 0,5', () => {
    const fails = varrer(4000, 0, (s, now, seed) => {
      const out = computeDailyReset(s, { now });
      const maxHP = MAX_HP_BY_FORM[getStageLevel(out.evolutionStage)];
      const bad: string[] = [];
      if (!Number.isFinite(out.healthPoints)) bad.push(`seed ${seed}: HP não finito (${out.healthPoints})`);
      else {
        if (out.healthPoints < 0) bad.push(`seed ${seed}: HP ${out.healthPoints} < 0`);
        if (out.healthPoints > maxHP) bad.push(`seed ${seed}: HP ${out.healthPoints} > máx ${maxHP} de ${out.evolutionStage}`);
        // "HP aceita frações de 0.5" (CLAUDE.md) — nunca 1/3 nem 0,9999999998.
        if (Math.abs(out.healthPoints * 2 - Math.round(out.healthPoints * 2)) > 1e-9)
          bad.push(`seed ${seed}: HP fora da grade de 0,5 (${out.healthPoints})`);
      }
      if (out.maxHealthPoints !== maxHP) bad.push(`seed ${seed}: maxHealthPoints ${out.maxHealthPoints} ≠ ${maxHP}`);
      return bad;
    });
    expect(fails.slice(0, 10)).toEqual([]);
  });

  it('a perda nunca passa de MAX_HEARTS_LOST_PER_DAY e nunca é negativa', () => {
    const fails = varrer(4000, 1000, (s, now, seed) => {
      const { heartsLost } = computeDailyReset(s, { now }).lastDayReport;
      if (!Number.isFinite(heartsLost)) return [`seed ${seed}: heartsLost não finito (${heartsLost})`];
      if (heartsLost < 0) return [`seed ${seed}: heartsLost NEGATIVO (${heartsLost})`];
      if (heartsLost > MAX_HEARTS_LOST_PER_DAY) return [`seed ${seed}: heartsLost ${heartsLost} acima do teto`];
      return [];
    });
    expect(fails.slice(0, 10)).toEqual([]);
  });

  it('`totalPerfectDays` (contador vitalício das missões) só cresce', () => {
    const fails = varrer(3000, 2000, (s, now, seed) => {
      const out = computeDailyReset(s, { now });
      const delta = out.totalPerfectDays - s.totalPerfectDays;
      if (delta < 0) return [`seed ${seed}: totalPerfectDays CAIU (${s.totalPerfectDays} → ${out.totalPerfectDays})`];
      if (delta > 1) return [`seed ${seed}: totalPerfectDays subiu ${delta} numa virada só`];
      return [];
    });
    expect(fails.slice(0, 10)).toEqual([]);
  });

  it('`perfectDays` NUNCA cai numa virada sem degeneração (CLAUDE.md: "só acumulam")', () => {
    const fails = varrer(3000, 3000, (s, now, seed) => {
      const out = computeDailyReset(s, { now });
      if (out.degeneratedByHP) return [];   // a degeneração tem regra própria
      if (out.perfectDays < s.perfectDays)
        return [`seed ${seed}: perfectDays caiu ${s.perfectDays} → ${out.perfectDays} sem degenerar`];
      return [];
    });
    expect(fails.slice(0, 10)).toEqual([]);
  });

  it('MONOTONICIDADE: concluir MAIS nunca custa mais coração nem menos dia perfeito', () => {
    // A propriedade que importa para o jogador: fazer mais não pode piorar o
    // resultado. Comparada em `heartsLost` e `perfectDays`, e NÃO em HP final —
    // ver o caso "declarado" logo abaixo, que explica por quê.
    const fails = varrer(3000, 4000, (base, now, seed) => {
      const zerado = {
        ...base,
        activities: base.activities.map((a: any) => ({
          ...a, completedToday: false, steps: a.steps.map((x: any) => ({ ...x, completed: false })),
        })),
        tasks: base.tasks.map((t: any) => ({ ...t, completed: false })),
        completedTasks: [],
      };
      const cheio = {
        ...base,
        activities: base.activities.map((a: any) => ({
          ...a, completedToday: true,
          lastCompletedDate: new Date(now.getTime() - 86400000).toDateString(),
          steps: a.steps.map((x: any) => ({ ...x, completed: true })),
        })),
        tasks: base.tasks.map((t: any) => ({ ...t, completed: true })),
      };
      const a = computeDailyReset(zerado, { now });
      const b = computeDailyReset(cheio, { now });
      const bad: string[] = [];
      if (b.lastDayReport.heartsLost > a.lastDayReport.heartsLost)
        bad.push(`seed ${seed}: fazer TUDO perdeu mais coração (${b.lastDayReport.heartsLost} > ${a.lastDayReport.heartsLost})`);
      if (b.totalPerfectDays < a.totalPerfectDays)
        bad.push(`seed ${seed}: fazer TUDO deu menos dia perfeito vitalício`);
      if (b.lastDayReport.done < a.lastDayReport.done)
        bad.push(`seed ${seed}: fazer TUDO contou menos conclusões (${b.lastDayReport.done} < ${a.lastDayReport.done})`);
      return bad;
    });
    expect(fails.slice(0, 10)).toEqual([]);
  });

  it('nenhum estado gerado faz a virada LANÇAR', () => {
    const fails = varrer(4000, 5000, (s, now, seed) => {
      try { computeDailyReset(s, { now }); return []; }
      catch (e) { return [`seed ${seed}: LANÇOU ${(e as Error).message}`]; }
    });
    expect(fails.slice(0, 5)).toEqual([]);
  });

  it('o relatório do dia é internamente coerente (done ≤ total, required ≤ total)', () => {
    const fails = varrer(3000, 6000, (s, now, seed) => {
      const { done, total, required, wasPerfect, energyWasFull } = computeDailyReset(s, { now }).lastDayReport;
      const bad: string[] = [];
      if (done > total) bad.push(`seed ${seed}: relatório diz ${done} feitas de ${total} cadastradas`);
      if (required > total) bad.push(`seed ${seed}: meta ${required} acima do total cadastrado ${total}`);
      if (wasPerfect && !energyWasFull) bad.push(`seed ${seed}: dia perfeito sem energia cheia`);
      if (wasPerfect && done < required) bad.push(`seed ${seed}: dia perfeito com ${done} < meta ${required}`);
      if (wasPerfect && total === 0) bad.push(`seed ${seed}: dia perfeito sem nada cadastrado`);
      return bad;
    });
    expect(fails.slice(0, 10)).toEqual([]);
  });

  /**
   * INVARIANTE QUE **NÃO** VALE — e por quê, para ninguém "consertar" o código.
   *
   * "Fazer tudo nunca termina com MENOS HP que não fazer nada" é FALSO, de
   * propósito: quem zera o HP degenera, e a degeneração devolve o HP CHEIO do
   * estágio de baixo. Quem não fez nada pode terminar com 3 de 3 (degenerado)
   * enquanto quem fez tudo termina com 1 de 3 (intacto). O HP sozinho não é a
   * medida do resultado — o estágio é. Este caso trava o fato de que isso é
   * ESPERADO, para a monotonicidade acima não ser reescrita por engano.
   */
  it('DECLARADO: degenerar restaura HP cheio, então HP final não é comparável sozinho', () => {
    const base: any = {
      activities: [], tasks: Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false })),
      completedTasks: [], healthPoints: 1, maxHealthPoints: 3, energyPoints: 0,
      perfectDays: 0, totalPerfectDays: 0, totalXP: 0,
      virusPoints: 0, dataPoints: 0, vaccinePoints: 0,
      evolutionStage: 'champion-virus', unlockedEvolutions: ['rookie'],
      degeneratedByHP: false, currentBranch: 'virus', lastDayWasPerfect: false,
      maxActivityCap: 7, attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
      lastResetDate: new Date(2026, 7, 4).toDateString(),
      // A folga da semana (P2) JÁ foi gasta — senão ela absorve a perda, o HP
      // não zera e a degeneração que este caso existe para declarar não
      // acontece. A semana tem de ser a do dia julgado: semana que não bate é
      // lida como "folga inteira".
      restDaysLeft: 0,
      restWeekKey: restWeekKeyFor(new Date(2026, 7, 4)),
    };
    const now = new Date(2026, 7, 5, 3, 0, 0); // quarta, fora do alívio de segunda
    const nadaFeito = computeDailyReset(base, { now });
    const tudoFeito = computeDailyReset(
      { ...base, tasks: base.tasks.map((t: any) => ({ ...t, completed: true })) }, { now });

    expect(nadaFeito.degeneratedByHP).toBe(true);
    expect(nadaFeito.evolutionStage).toBe('rookie');
    expect(nadaFeito.healthPoints).toBe(3);        // HP CHEIO após cair de estágio
    expect(tudoFeito.degeneratedByHP).toBe(false);
    expect(tudoFeito.evolutionStage).toBe('champion-virus');
    expect(tudoFeito.healthPoints).toBe(1);        // menos HP, e MELHOR situação
    // O que de fato é monotônico: coração perdido.
    expect(tudoFeito.lastDayReport.heartsLost).toBeLessThanOrEqual(nadaFeito.lastDayReport.heartsLost);
  });

  /**
   * AUTOVERIFICAÇÃO DO GERADOR. Sem isto, um `genState` que produzisse sempre o
   * mesmo estado morno deixaria todos os invariantes acima verdes sem exercitar
   * nada — o modo de falha silencioso de todo teste de propriedade.
   */
  it('AUTOVERIFICAÇÃO: o gerador cobre os desfechos que os invariantes precisam ver', () => {
    const desfechos = { degenerou: 0, perdeuCoracao: 0, semPerda: 0, diaPerfeito: 0, alivioSegunda: 0, ausencia: 0 };
    varrer(2000, 0, (s, now) => {
      const out = computeDailyReset(s, { now });
      if (out.degeneratedByHP) desfechos.degenerou++;
      if (out.lastDayReport.heartsLost > 0) desfechos.perdeuCoracao++; else desfechos.semPerda++;
      if (out.lastDayReport.wasPerfect) desfechos.diaPerfeito++;
      if (out.lastDayReport.weeklyRelief) desfechos.alivioSegunda++;
      if (out.lastDayReport.welcomeBack) desfechos.ausencia++;
      return [];
    });
    for (const [nome, n] of Object.entries(desfechos)) {
      expect(n, `o gerador nunca produziu o desfecho "${nome}" — os invariantes não o exercitam`).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('a resposta "quanto falta para não perder coração?" é a mesma conta que cobra', () => {
  it('fazer `tasksToAvoidHeartLoss` itens zera a perda; fazer um a menos, não', () => {
    const fails = varrer(2000, 7000, (s, now, seed) => {
      const weekDay = new Date(now.getTime() - 86400000).getDay();
      const dayKey = new Date(now.getTime() - 86400000).toDateString();
      // P1: a régua da PERDA é a meta de coração (60% da meta do dia), não a
      // meta do dia completo — que continua sendo o que o dia completo exige.
      // Este teste existe justamente para as duas não divergirem em silêncio:
      // ele caiu na hora em que o `tasksToAvoidHeartLoss` mudou de régua, que
      // é o comportamento certo dele.
      const goal = heartGoalFor(s as any, weekDay, dayKey);
      const n = tasksToAvoidHeartLoss(s as any, weekDay, dayKey);
      const maxHP = s.maxHealthPoints;
      const bad: string[] = [];
      if (goal <= 0) return [];
      if (rawHeartsLostFor(n, goal, maxHP) !== 0)
        bad.push(`seed ${seed}: prometeu ${n} de ${goal} (maxHP ${maxHP}) e a perda NÃO zerou`);
      if (n > 0 && rawHeartsLostFor(n - 1, goal, maxHP) === 0)
        bad.push(`seed ${seed}: ${n} é maior que o necessário (${n - 1} já zerava)`);
      if (n > goal) bad.push(`seed ${seed}: pediu ${n} itens com meta ${goal}`);
      return bad;
    });
    expect(fails.slice(0, 10)).toEqual([]);
  });

  it('`daysSinceLastReset` nunca devolve menos de 1, nem NaN, para data hostil', () => {
    const now = new Date(2026, 7, 12);
    const entradas = [undefined, '', 'lixo', '???', new Date(2030, 0, 1).toDateString(),
      new Date(1970, 0, 1).toDateString(), now.toDateString()];
    for (const e of entradas) {
      const d = daysSinceLastReset(e, now);
      expect(Number.isFinite(d), `entrada ${JSON.stringify(e)} → ${d}`).toBe(true);
      expect(d, `entrada ${JSON.stringify(e)} → ${d}`).toBeGreaterThanOrEqual(1);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('careRules — invariantes de domínio', () => {
  it('comer nunca passa da energia máxima do estágio nem produz número não finito', () => {
    const fails: string[] = [];
    for (let seed = 0; seed < 3000; seed++) {
      const r = mulberry32(seed + 8000);
      const evolutionStage = pick(r, STAGES);
      const maxE = getMaxEnergyForStage(evolutionStage);
      const st: any = {
        healthPoints: 2, maxHealthPoints: 3,
        energyPoints: pick(r, [0, 1, maxE - 1, maxE, maxE + 5]),
        evolutionStage,
        foodInventory: { '🍎': 1 + Math.floor(r() * 5) },
        virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
        attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
        petPassive: pick(r, [undefined, 'guloso']),
      };
      const out = feedFood(st, '🍎', [], Date.now());
      if (out.refused) continue;                       // recusa devolve o estado intacto
      if (!Number.isFinite(out.state.energyPoints)) fails.push(`seed ${seed}: energia não finita`);
      else if (out.state.energyPoints > maxE) fails.push(`seed ${seed}: energia ${out.state.energyPoints} > máx ${maxE}`);
      if (out.state.energyPoints < st.energyPoints && st.energyPoints <= maxE)
        fails.push(`seed ${seed}: comer DIMINUIU a energia`);
      if (out.feedTimes.length > FOOD_LIMIT_PER_HOUR) fails.push(`seed ${seed}: ${out.feedTimes.length} comidas na janela`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
  });

  it('o carinho nunca ultrapassa o máximo, nunca reduz HP e respeita o teto diário', () => {
    const fails: string[] = [];
    for (let seed = 0; seed < 2000; seed++) {
      const r = mulberry32(seed + 9000);
      const maxHealthPoints = pick(r, [3, 4, 5]);
      const st: any = {
        healthPoints: pick(r, [0, 0.5, 1, 2, maxHealthPoints]),
        maxHealthPoints, energyPoints: 0, evolutionStage: 'rookie', foodInventory: {},
        virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
        attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
        petPassive: pick(r, [undefined, 'carinhoso']),
      };
      // Esfrega 10× seguidas: o teto diário tem que segurar.
      let cur = st; let rec: any = null; const dia = 'Wed Aug 12 2026';
      for (let i = 0; i < 10; i++) {
        const out = rubHeal(cur, rec, dia);
        if (out.state.healthPoints < cur.healthPoints) fails.push(`seed ${seed}: carinho REDUZIU o HP`);
        if (out.state.healthPoints > maxHealthPoints) fails.push(`seed ${seed}: HP ${out.state.healthPoints} > ${maxHealthPoints}`);
        cur = out.state; rec = out.record;
      }
      // Teto: carinhoso cura até 1,5/dia; os demais, 1 (CLAUDE.md).
      const teto = st.petPassive === 'carinhoso' ? 1.5 : 1;
      if (cur.healthPoints - st.healthPoints > teto + 1e-9)
        fails.push(`seed ${seed}: curou ${cur.healthPoints - st.healthPoints} num dia (teto ${teto})`);
    }
    expect(fails.slice(0, 10)).toEqual([]);
  });

  it('`feedsLeft` fica em [0, 5] mesmo com timestamps hostis', () => {
    const hostis: number[][] = [
      [], [NaN], [Infinity], [-Infinity], [Date.now() + 86400000],
      Array.from({ length: 50 }, () => Date.now()),
      Array.from({ length: 50 }, (_, i) => Date.now() - i * 60000),
    ];
    for (const t of hostis) {
      const v = feedsLeft(t, Date.now());
      expect(v, `entrada ${JSON.stringify(t.slice(0, 3))}`).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(FOOD_LIMIT_PER_HOUR);
    }
  });

  it('SEQUÊNCIA: 60 dias de ações aleatórias mantêm o estado no domínio', () => {
    // Bug de estado quase nunca aparece num snapshot; aparece numa sequência.
    const fails: string[] = [];
    for (let seed = 0; seed < 120; seed++) {
      const r = mulberry32(seed + 11000);
      let now = new Date(2026, 0, 5, 12, 0, 0);
      let st: any = genState(r, now);
      let feedTimes: number[] = [];
      let rubRec: any = null;
      let vitalicioAnterior = st.totalPerfectDays;

      for (let dia = 0; dia < 60; dia++) {
        for (let acao = 0; acao < 6; acao++) {
          const qual = Math.floor(r() * 4);
          try {
            if (qual === 0) {
              st = { ...st, foodInventory: { ...st.foodInventory, '🍎': 3 } };
              const f = feedFood(st, '🍎', feedTimes, now.getTime());
              st = f.state; feedTimes = f.feedTimes;
            } else if (qual === 1) {
              const h = rubHeal(st, rubRec, now.toDateString());
              st = h.state; rubRec = h.record;
            } else if (qual === 2 && st.tasks.length) {
              st = completeTask({ ...st, completedTasks: st.completedTasks ?? [], activityStats: st.activityStats ?? {} },
                st.tasks[Math.floor(r() * st.tasks.length)].id, now) ?? st;
            }
          } catch (e) {
            fails.push(`seed ${seed} dia ${dia}: ação ${qual} LANÇOU ${(e as Error).message}`);
          }
        }
        now = new Date(now.getTime() + 86400000);
        try { st = computeDailyReset(st, { now }); }
        catch (e) { fails.push(`seed ${seed} dia ${dia}: virada LANÇOU ${(e as Error).message}`); break; }

        const maxHP = MAX_HP_BY_FORM[getStageLevel(st.evolutionStage)];
        if (!Number.isFinite(st.healthPoints)) { fails.push(`seed ${seed} dia ${dia}: HP não finito`); break; }
        if (st.healthPoints < 0 || st.healthPoints > maxHP) { fails.push(`seed ${seed} dia ${dia}: HP ${st.healthPoints} fora de [0,${maxHP}]`); break; }
        if (st.energyPoints < 0) { fails.push(`seed ${seed} dia ${dia}: energia negativa`); break; }
        if (st.totalPerfectDays < vitalicioAnterior) { fails.push(`seed ${seed} dia ${dia}: totalPerfectDays caiu`); break; }
        if (st.completedTasks.length > 200) { fails.push(`seed ${seed} dia ${dia}: histórico sem teto (${st.completedTasks.length})`); break; }
        if (!Number.isFinite(st.perfectDays) || st.perfectDays < 0) { fails.push(`seed ${seed} dia ${dia}: perfectDays ${st.perfectDays}`); break; }
        vitalicioAnterior = st.totalPerfectDays;
      }
    }
    expect(fails.slice(0, 10)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('carePattern / tournamentTiers — leitura nunca lança nem sai do domínio', () => {
  it('`computeCarePattern` aguenta histórico hostil', () => {
    const now = new Date(2026, 7, 12);
    const hostis: any[] = [
      undefined, null, [], [{}], [{ completedAt: null }], [{ completedAt: 'lixo' }],
      [{ completedAt: 42 }], [{ completedAt: new Date(2030, 0, 1).toISOString() }],
      [{ completedAt: new Date(1990, 0, 1).toISOString() }],
      Array.from({ length: 500 }, () => ({ completedAt: now.toISOString() })),
    ];
    for (const h of hostis) {
      const rd = computeCarePattern(h, now);
      expect(rd.concentration).toBeGreaterThanOrEqual(0);
      expect(rd.concentration).toBeLessThanOrEqual(1);
      expect(rd.total).toBeGreaterThanOrEqual(0);
      expect(rd.activeDays).toBeGreaterThanOrEqual(0);
      expect(rd.pattern).toBeTruthy();
    }
    expect(() => careHistory({})).not.toThrow();
    expect(() => careHistory({ completedTasks: undefined, activityLog: undefined })).not.toThrow();
  });

  it('`resolveBranch` SEMPRE devolve um galho válido — nunca `undefined`', () => {
    // ACHADO da rodada 6: com `virusPoints` ausente (save sem os campos de
    // atributo), `Math.max` dava NaN, a lista de líderes ficava VAZIA e a função
    // devolvia `leaders[0]` — `undefined`, fora do próprio tipo de retorno. O
    // galho previsto na página de Evolução ficava indefinido e o save gravava
    // `currentBranch: undefined`.
    const rd = computeCarePattern([], new Date());
    const rdConf = computeCarePattern(
      Array.from({ length: 8 }, (_, i) => ({ completedAt: new Date(Date.now() - i * 86400000).toISOString() })),
      new Date());
    const pontosHostis: any[] = [
      {}, undefined,
      { virus: undefined, data: undefined, vaccine: undefined },
      { virus: NaN, data: 0, vaccine: 0 },
      { virus: null, data: null, vaccine: null },
      { virus: '5', data: 0, vaccine: 0 },
      { virus: -1, data: -1, vaccine: -1 },
      { virus: 0, data: 0, vaccine: 0 },
      { virus: Infinity, data: 1, vaccine: 1 },
      { virus: 3, data: 3, vaccine: 1 },
    ];
    for (const p of pontosHostis) {
      for (const leitura of [rd, rdConf]) {
        const b = resolveBranch(p, leitura);
        expect(['virus', 'data', 'vaccine'], `pontos ${JSON.stringify(p)} → ${String(b)}`).toContain(b);
      }
    }
  });

  it('faixa do torneio: acumular ponto NUNCA rebaixa, e o domínio se sustenta', () => {
    const fails: string[] = [];
    let idxAnterior = -1;
    const pontos = [-1e9, -1, -0.5, 0, 0.5, 1, 99, 99.9, 100, 299.9, 300, 699, 700, 1499.5, 1500, 1e6, 1e9];
    for (const p of pontos) {
      const s = getTierStanding(p);
      const idx = TOURNAMENT_TIERS.indexOf(s.tier);
      if (idx < idxAnterior) fails.push(`${p} rebaixou (faixa ${idxAnterior} → ${idx})`);
      idxAnterior = idx;
      if (!(s.progress >= 0 && s.progress <= 1)) fails.push(`${p}: progress ${s.progress}`);
      if (s.pointsToNext < 0) fails.push(`${p}: pointsToNext negativo (${s.pointsToNext})`);
    }
    for (const p of [NaN, Infinity, -Infinity]) {
      const s = getTierStanding(p);
      if (!Number.isFinite(s.progress)) fails.push(`${p}: progress ${s.progress}`);
      if (!Number.isFinite(s.pointsToNext)) fails.push(`${p}: pointsToNext ${s.pointsToNext}`);
    }
    expect(fails).toEqual([]);
  });
});
