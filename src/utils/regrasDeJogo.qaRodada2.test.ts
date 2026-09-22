/**
 * QA rodada 2 (22/09/2026) — as DECISÕES DO DONO, aplicadas.
 *
 * ⚰️ Este arquivo era um FOTÓGRAFO: cada `it` descrevia o comportamento ruim
 * que a simulação
 * (`docs/reviews/2026-09-22-qa-rodada-2/07-simulacao-jogo-r2.md`) mediu, e cada
 * `it.todo` era o conserto proposto, esperando o dono. O dono respondeu em
 * 22/09/2026 (`docs/PERGUNTAS-DO-DONO.md` › "Respostas QA RODADAS 1 e 2") e
 * agora o arquivo trava o OPOSTO do que travava: as fotos viraram guards.
 *
 * Cada bloco cita a decisão literal. Se um destes testes ficar vermelho, a
 * pergunta não é "como faço passar" — é "o dono mudou de ideia?".
 */
import { describe, it, expect } from 'vitest';
import {
  computeDailyReset, restWeekKeyFor, degeneratedPerfectDays,
  NEW_SAVE_GRACE_DAYS, BITS_PER_COMPLETE_DAY, podeEvoluirDepoisDaQueda,
  heartGoalFor,
} from './dailyReset';
import {
  habitCountsOn, habitCountsForHeartsOn, isWeekClosingDay,
  emptyRhythm, completeHabit, dayKeyOf,
} from './habitRhythm';
import { applyPoopDrain, POOP_DRAIN_PERIOD_MS } from './poopDrain';
import { applySpecialItem } from './specialItemUse';
import { GLITCHTAMA_EMOJI } from './shop';
import { creditMinigameBits, MINIGAME_BITS_PER_DAY, remainingMinigameBits } from './currencies';
import { snapshotCompletion, undoCompletion, UNDO_WINDOW_MS, CAMPOS_DA_CONCLUSAO } from './completionUndo';
import { FORM_REQUIREMENTS } from '../types/progression';

const day = (iso: string) => new Date(iso);

// ─────────────────────────────────────────────────────────────────────────────
// #41/#60 — "🌀 Glitchtama NÃO conta para conquistas: `totalPerfectDays` só por
//            dia completo real (segue contando para a missão)"
// ─────────────────────────────────────────────────────────────────────────────
describe('#41/#60 — o 🌀 saiu do vitalício das conquistas', () => {
  const comGlitch = () => ({
    healthPoints: 3, maxHealthPoints: 3,
    foodInventory: { [GLITCHTAMA_EMOJI]: 2 } as Record<string, number>,
    perfectDays: 3, totalPerfectDays: 7, missionPerfectDays: 7,
    virusPoints: 0, dataPoints: 0, vaccinePoints: 0, totalXP: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
  });

  it('dá +1 perfectDay e NÃO toca totalPerfectDays (a conquista dias-completos-30 deixa de ser farmável)', () => {
    const { state } = applySpecialItem(comGlitch(), GLITCHTAMA_EMOJI, day('2026-09-23T10:00'));
    expect(state.perfectDays).toBe(4);
    expect(state.totalPerfectDays).toBe(7);     // intacto — é o que `achievements.ts` lê
  });

  it('mas SEGUE contando para a missão (missionPerfectDays), como a decisão manda', () => {
    const { state } = applySpecialItem(comGlitch(), GLITCHTAMA_EMOJI, day('2026-09-23T10:00'));
    expect(state.missionPerfectDays).toBe(8);
  });

  it('save anterior à decisão herda o vitalício antigo na missão — a missão nunca anda para trás', () => {
    const antigo = comGlitch() as Partial<ReturnType<typeof comGlitch>>;
    delete antigo.missionPerfectDays;           // save sem o campo novo
    const { state } = applySpecialItem(antigo as ReturnType<typeof comGlitch>, GLITCHTAMA_EMOJI, day('2026-09-23T10:00'));
    expect(state.missionPerfectDays).toBe(8);   // 7 herdados + 1
  });

  it('o perfil G da simulação (90 runs, zero hábitos) não abre mais dias-completos-30', () => {
    let s = { ...comGlitch(), totalPerfectDays: 0, missionPerfectDays: 0, foodInventory: {} as Record<string, number> };
    for (let d = 0; d < 90; d++) {
      s = { ...s, foodInventory: { [GLITCHTAMA_EMOJI]: 1 }, glitchtamaUse: undefined } as typeof s;
      s = applySpecialItem(s, GLITCHTAMA_EMOJI, day('2026-01-01T10:00')).state;
    }
    expect(s.totalPerfectDays).toBe(0);         // ZERO dias completos reais
    expect(s.missionPerfectDays).toBe(90);      // a missão continua vendo os 90
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #57 — "Marcar feita: toast 'Desfazer' 5 s revertendo a conclusão inteira"
// ─────────────────────────────────────────────────────────────────────────────
describe('#57 — a janela de 5 s reverte a conclusão INTEIRA', () => {
  it('a janela é de 5 segundos (a do toast É a da reversão)', () => {
    expect(UNDO_WINDOW_MS).toBe(5000);
  });

  it('devolve comida, atributo, XP de Vínculo e constância ao valor de antes', () => {
    const antes = {
      activities: [{ id: 'h1', completedToday: false }],
      activityStats: {}, activityLog: [] as string[],
      foodInventory: { '🍎': 1 },
      habitRhythms: { h1: emptyRhythm() },
      virusPoints: 5, dataPoints: 5, vaccinePoints: 5,
      attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
      totalXP: 100, bondDaily: { day: 'x', spent: {} },
      perfectDays: 3, healthPoints: 3,      // NÃO são da conclusão
    };
    const snap = snapshotCompletion(antes);
    const depois = {
      ...antes,
      activities: [{ id: 'h1', completedToday: true }],
      activityLog: ['2026-09-23T10:00:00.000Z'],
      foodInventory: { '🍎': 2 },
      habitRhythms: { h1: completeHabit(emptyRhythm(), dayKeyOf(day('2026-09-23T10:00'))) },
      dataPoints: 8,
      totalXP: 140,
      perfectDays: 4,                        // uma mudança de FORA da conclusão
    };
    const revertido = undoCompletion(depois, snap);
    expect(revertido.foodInventory).toEqual({ '🍎': 1 });
    expect(revertido.dataPoints).toBe(5);
    expect(revertido.totalXP).toBe(100);
    expect(revertido.habitRhythms.h1.totalDone).toBe(0);
    expect(revertido.activities[0].completedToday).toBe(false);
    // O que NÃO é da conclusão não é tocado: desfazer não é porta dos fundos
    // para progressão.
    expect(revertido.perfectDays).toBe(4);
    expect(revertido.healthPoints).toBe(3);
  });

  it('é idempotente — desfazer duas vezes escreve os mesmos valores', () => {
    const antes = { foodInventory: { '🍎': 1 }, totalXP: 10 };
    const snap = snapshotCompletion(antes);
    const a = undoCompletion({ foodInventory: { '🍎': 9 }, totalXP: 99 }, snap);
    const b = undoCompletion(a, snap);
    expect(b).toEqual(a);
  });

  it('a lista de campos cobre tudo o que `withHabitCompletion` escreve', () => {
    for (const campo of ['habitRhythms', 'foodInventory', 'totalXP', 'bondDaily',
      'virusPoints', 'dataPoints', 'vaccinePoints', 'attributesSinceLastEvolution',
      'activities', 'activityStats', 'activityLog']) {
      expect(CAMPOS_DA_CONCLUSAO as readonly string[]).toContain(campo);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #57b — "'3× por semana': coração SÓ cobra se a semana fechar sem a meta"
// ─────────────────────────────────────────────────────────────────────────────
describe('#57b — timesPerWeek só custa coração quando a semana fecha sem a meta', () => {
  const schedule = { kind: 'timesPerWeek' as const, target: 3 };

  it('terça (1/3) e quinta (2/3) NÃO entram na meta de coração — o dia a dia parou de cobrar', () => {
    let r = emptyRhythm();
    r = completeHabit(r, dayKeyOf(day('2026-09-21T12:00'))); // seg
    expect(habitCountsForHeartsOn({ schedule }, r, day('2026-09-22T12:00'))).toBe(false);
    r = completeHabit(r, dayKeyOf(day('2026-09-23T12:00'))); // qua
    expect(habitCountsForHeartsOn({ schedule }, r, day('2026-09-24T12:00'))).toBe(false);
  });

  it('mas o CRÉDITO não mudou: `habitCountsOn` continua deixando o hábito contar', () => {
    const r = completeHabit(emptyRhythm(), dayKeyOf(day('2026-09-21T12:00')));
    expect(habitCountsOn({ schedule }, r, day('2026-09-22T12:00'))).toBe(true);
  });

  it('no sábado (a semana fecha) com 2/3 feitos, aí sim entra — a semana fechou sem a meta', () => {
    let r = emptyRhythm();
    r = completeHabit(r, dayKeyOf(day('2026-09-21T12:00'))); // seg
    r = completeHabit(r, dayKeyOf(day('2026-09-23T12:00'))); // qua
    expect(isWeekClosingDay(day('2026-09-26T12:00'))).toBe(true);   // sábado
    expect(habitCountsForHeartsOn({ schedule }, r, day('2026-09-26T12:00'))).toBe(true);
  });

  it('meta cumprida (seg/qua/sex): nem no sábado entra — 4 semanas, ZERO corações', () => {
    let r = emptyRhythm();
    const segundas = ['2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12'];
    for (const seg of segundas) {
      const d0 = day(seg + 'T12:00');
      for (const off of [0, 2, 4]) {
        const d = new Date(d0); d.setDate(d.getDate() + off);
        r = completeHabit(r, dayKeyOf(d));
      }
      for (let off = 0; off < 7; off++) {
        if ([0, 2, 4].includes(off)) continue;  // dias feitos: contam por serem feitos
        const d = new Date(d0); d.setDate(d.getDate() + off);
        expect(habitCountsForHeartsOn({ schedule }, r, d)).toBe(false);
      }
    }
  });

  it('a META DE CORAÇÃO da virada usa a lista nova (heartGoalFor), não a do dia completo', () => {
    const r = completeHabit(emptyRhythm(), dayKeyOf(day('2026-09-21T12:00')));
    const estado = {
      evolutionStage: 'rookie',
      activities: [{ id: 'h1', schedule }],
      habitRhythms: { h1: r },
      tasks: [] as unknown[],
    };
    const terca = day('2026-09-22T12:00');
    // Nada cadastrado PARA O CORAÇÃO nesta terça → meta 0 → nada a falhar.
    expect(heartGoalFor(estado, terca.getDay(), terca.toDateString())).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #58 — "Virada: julgar o último dia aberto"
// ─────────────────────────────────────────────────────────────────────────────
describe('#58 — a virada julga o último dia aberto, não "ontem"', () => {
  const seg = day('2026-09-21T12:00');
  const habito = (id: string, feito: boolean) => ({
    id, category: 'Health', emoji: '🏃', weekDays: [0, 1, 2, 3, 4, 5, 6], steps: [],
    completedToday: feito, lastCompletedDate: feito ? seg.toDateString() : undefined,
  });
  const estado = (feito: boolean) => ({
    activities: [0, 1, 2, 3].map(i => habito('h' + i, feito)),
    tasks: [] as unknown[],
    healthPoints: 3, maxHealthPoints: 3, energyPoints: 10, perfectDays: 0, totalXP: 0,
    virusPoints: 0, dataPoints: 0, vaccinePoints: 0, gamePoints: 0,
    evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], currentBranch: 'data' as const,
    maxActivityCap: 6,
    lastResetDate: seg.toDateString(),
    lastDayReport: { date: day('2026-09-20T12:00').toDateString(), saveDay: 90 },
    restDaysLeft: 0, restWeekKey: restWeekKeyFor(seg),
  });

  it('feito 100% na segunda, reabre na quarta → perfectDays +1 (perfis Bx/Bsx da simulação)', () => {
    const r = computeDailyReset(estado(true), { now: day('2026-09-23T12:00') }) as Record<string, any>;
    expect(r.lastDayReport.date).toBe(seg.toDateString());   // julgou a SEGUNDA
    expect(r.lastDayWasPerfect).toBe(true);
    expect(r.perfectDays).toBe(1);
    expect(r.totalPerfectDays).toBe(1);
    expect(r.lastDayReport.welcomeBack).toBe(true);          // e segue sem cobrar
    expect(r.healthPoints).toBe(3);
  });

  it('NÃO credita dia em que o jogador não fez nada (o perfil D continua em zero)', () => {
    const r = computeDailyReset(estado(false), { now: day('2026-09-23T12:00') }) as Record<string, any>;
    expect(r.lastDayWasPerfect).toBe(false);
    expect(r.perfectDays).toBe(0);
    expect(r.healthPoints).toBe(3);                          // perdão intacto
  });

  it('credita UM dia, não a semana inteira: sumir 10 dias não vira 10 dias completos', () => {
    const r = computeDailyReset(estado(true), { now: day('2026-10-01T12:00') }) as Record<string, any>;
    expect(r.perfectDays).toBe(1);
  });

  it('virada normal de 1 dia continua julgando ontem (nada mudou para quem abre todo dia)', () => {
    const r = computeDailyReset(estado(true), { now: day('2026-09-22T12:00') }) as Record<string, any>;
    expect(r.lastDayReport.date).toBe(seg.toDateString());
    expect(r.perfectDays).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #58b — "Dreno de cocô: mesmas travas da virada"
// ─────────────────────────────────────────────────────────────────────────────
describe('#58b — o dreno respeita as travas da virada', () => {
  const t0 = day('2026-09-23T09:00').getTime();
  const base = {
    healthPoints: 3,
    poopEventsShown: [0],
    poopEventsCompleted: [] as number[],
    poopPenaltyClockAt: t0,
    lastResetDate: day('2026-09-23T07:00').toDateString(),
    evolutionStage: 'champion-data',
    currentBranch: 'data',
  };
  const tick = <T extends typeof base>(s: T) =>
    applyPoopDrain(s, { now: t0 + POOP_DRAIN_PERIOD_MS, isSleeping: false });

  it('save NOVO não é drenado (NEW_SAVE_GRACE_DAYS, como na virada)', () => {
    expect(NEW_SAVE_GRACE_DAYS).toBeGreaterThanOrEqual(1);
    expect(tick({ ...base, lastDayReport: { saveDay: 1 } }).healthPoints).toBe(3);
  });

  it('quem está na rampa de retorno não é drenado (returnGraceLeft > 0)', () => {
    const r = tick({ ...base, lastDayReport: { saveDay: 90, returnGraceLeft: 2 } });
    expect(r.healthPoints).toBe(3);
  });

  it('rookie nunca fica em HP 0 pelo dreno — o piso da raiz vale aqui também', () => {
    const r = tick({
      ...base, healthPoints: 1, evolutionStage: 'rookie',
      lastDayReport: { saveDay: 90 },
    });
    expect(r.healthPoints).toBe(1);
  });

  it('mas quem TEM forma abaixo continua podendo zerar — a consequência não sumiu', () => {
    const r = tick({ ...base, healthPoints: 1, lastDayReport: { saveDay: 90 } });
    expect(r.healthPoints).toBe(0);
  });

  it('save veterano, fora de carência e fora da raiz: o dreno cobra como sempre cobrou', () => {
    expect(tick({ ...base, lastDayReport: { saveDay: 90 } }).healthPoints).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #59 — "Queda: exigir uma virada completa antes de re-evoluir"
// ─────────────────────────────────────────────────────────────────────────────
describe('#59 — cair e re-evoluir na mesma abertura é impossível', () => {
  it('o piso continua deixando perfectDays acima do requisito (a regra de §18 não mudou)', () => {
    const depois = degeneratedPerfectDays(26, 'ultimate');
    expect(depois).toBe(21);
    expect(depois).toBeGreaterThanOrEqual(FORM_REQUIREMENTS.ultimate.required);
  });

  it('…mas o botão não acende enquanto `degeneratedByHP` estiver de pé', () => {
    expect(podeEvoluirDepoisDaQueda({ degeneratedByHP: true })).toBe(false);
  });

  it('a virada SEGUINTE limpa a marca e devolve a evolução', () => {
    expect(podeEvoluirDepoisDaQueda({ degeneratedByHP: false })).toBe(true);
    expect(podeEvoluirDepoisDaQueda({})).toBe(true);
  });

  it('uma virada de verdade apaga a marca: cair hoje, poder evoluir na abertura de amanhã', () => {
    const caido = {
      activities: [] as unknown[], tasks: [] as unknown[],
      healthPoints: 3, maxHealthPoints: 3, energyPoints: 0,
      perfectDays: 21, totalXP: 0, virusPoints: 0, dataPoints: 0, vaccinePoints: 0,
      evolutionStage: 'ultimate-data', unlockedEvolutions: ['rookie', 'champion-data', 'ultimate-data'],
      currentBranch: 'data' as const, maxActivityCap: 6, degeneratedByHP: true,
      lastResetDate: day('2026-09-22T12:00').toDateString(),
      lastDayReport: { date: day('2026-09-21T12:00').toDateString(), saveDay: 90 },
      restDaysLeft: 0, restWeekKey: restWeekKeyFor(day('2026-09-22T12:00')),
    };
    expect(podeEvoluirDepoisDaQueda(caido)).toBe(false);
    const r = computeDailyReset(caido, { now: day('2026-09-23T12:00') }) as Record<string, any>;
    expect(podeEvoluirDepoisDaQueda(r)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// #61/#63 — "Bits por dia completo + teto de runs por dia"
// ─────────────────────────────────────────────────────────────────────────────
describe('#61/#63 — a economia de Bits', () => {
  const ontem = day('2026-09-22T12:00');
  const habito = (feito: boolean) => ({
    id: 'h1', category: 'Health', emoji: '🏃', weekDays: [0, 1, 2, 3, 4, 5, 6], steps: [],
    completedToday: feito, lastCompletedDate: feito ? ontem.toDateString() : undefined,
  });
  const estado = (feito: boolean) => ({
    activities: [habito(feito)], tasks: [] as unknown[],
    healthPoints: 3, maxHealthPoints: 3, energyPoints: 10, perfectDays: 0, totalXP: 0,
    virusPoints: 0, dataPoints: 0, vaccinePoints: 0, gamePoints: 500,
    evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], currentBranch: 'data' as const,
    maxActivityCap: 6,
    lastResetDate: ontem.toDateString(),
    lastDayReport: { date: day('2026-09-21T12:00').toDateString(), saveDay: 90 },
    restDaysLeft: 0, restWeekKey: restWeekKeyFor(ontem),
  });

  it('um dia completo paga BITS_PER_COMPLETE_DAY; um dia incompleto não paga nada', () => {
    const bom = computeDailyReset(estado(true), { now: day('2026-09-23T12:00') }) as Record<string, any>;
    expect(bom.lastDayWasPerfect).toBe(true);
    expect(bom.gamePoints).toBe(500 + BITS_PER_COMPLETE_DAY);

    const ruim = computeDailyReset(estado(false), { now: day('2026-09-23T12:00') }) as Record<string, any>;
    expect(ruim.gamePoints).toBe(500);
  });

  it('o perfil A (89 dias completos em 90) compra a loja inteira — 8 900 Bits', () => {
    expect(89 * BITS_PER_COMPLETE_DAY).toBe(8900);
  });

  it('o teto de minijogo para de somar ao bater, e NÃO tira nada', () => {
    const dia = 'Wed Sep 23 2026';
    const s = creditMinigameBits({ gamePoints: 0 }, 400, dia);
    expect(s.gamePoints).toBe(MINIGAME_BITS_PER_DAY);
    expect(remainingMinigameBits(s, dia)).toBe(0);
    const depois = creditMinigameBits(s, 400, dia);
    expect(depois).toBe(s);                       // mesma referência: nada mudou
    expect(depois.gamePoints).toBe(MINIGAME_BITS_PER_DAY);
  });

  it('o teto é por DIA DO JOGADOR: amanhã o minijogo volta a render', () => {
    let s = creditMinigameBits({ gamePoints: 0 }, 400, 'Wed Sep 23 2026');
    s = creditMinigameBits(s, 400, 'Thu Sep 24 2026');
    expect(s.gamePoints).toBe(2 * MINIGAME_BITS_PER_DAY);
  });

  it('vários créditos no mesmo lote não furam o teto (família de bug do X-6)', () => {
    const dia = 'Wed Sep 23 2026';
    let s = { gamePoints: 0 } as ReturnType<typeof creditMinigameBits>;
    for (let i = 0; i < 20; i++) s = creditMinigameBits(s, 50, dia);
    expect(s.gamePoints).toBe(MINIGAME_BITS_PER_DAY);
  });

  it('o grinder do perfil G deixa de comprar 4× a loja em 90 dias', () => {
    const antes = 34566;                          // medido na simulação, §2.7
    const depois = 90 * MINIGAME_BITS_PER_DAY;
    expect(antes / 8900).toBeGreaterThan(3.8);
    expect(depois / 8900).toBeLessThan(2);
  });
});
