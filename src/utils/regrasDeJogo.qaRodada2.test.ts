/**
 * QA rodada 2 (22/09/2026) — `docs/reviews/2026-09-22-qa-rodada-2/07-simulacao-jogo-r2.md`.
 *
 * Este arquivo NÃO conserta nada: ele FOTOGRAFA o comportamento atual dos
 * achados que são DECISÃO do dono (`docs/PERGUNTAS-DO-DONO.md` #57–#63), para
 * que a resposta dele — quando vier — tenha um teste vermelho esperando. Cada
 * bloco tem (1) o `it` que passa hoje e descreve a regra como está escrita em
 * `02-REGRAS-DE-NEGOCIO.md`, e (2) o `it.todo` com o provisório proposto.
 *
 * Regra de quem escreveu: só se corrige onde a doc diz X e o código faz Y. Aqui
 * a doc diz o que o código faz — e a QA mediu que o resultado é ruim. Quem
 * decide é o dono, não a squad.
 */
import { describe, it, expect } from 'vitest';
import { computeDailyReset, restWeekKeyFor, degeneratedPerfectDays, NEW_SAVE_GRACE_DAYS } from './dailyReset';
import { habitCountsOn, emptyRhythm, completeHabit, dayKeyOf } from './habitRhythm';
import { applyPoopDrain, POOP_DRAIN_PERIOD_MS } from './poopDrain';
import { FORM_REQUIREMENTS } from '../types/progression';

const day = (iso: string) => new Date(iso);

// ── #57 — "3× por semana" cobra coração nos dias em que ainda falta ──────────
describe('#57 timesPerWeek: a meta de coração conta o hábito enquanto done < target (02-REGRAS §24, caso de borda 1)', () => {
  it('feito seg e qua, na quinta (2/3) o hábito ainda CONTA para a meta — é a regra escrita hoje', () => {
    let r = emptyRhythm();
    r = completeHabit(r, dayKeyOf(day('2026-09-21T12:00'))); // seg
    r = completeHabit(r, dayKeyOf(day('2026-09-23T12:00'))); // qua
    const schedule = { kind: 'timesPerWeek' as const, target: 3 };
    // terça (1/3 feito) e quinta (2/3 feito): contam → a virada cobra a falta
    expect(habitCountsOn({ schedule }, r, day('2026-09-22T12:00'))).toBe(true);
    expect(habitCountsOn({ schedule }, r, day('2026-09-24T12:00'))).toBe(true);
    // sábado, com a sexta feita (3/3): de graça
    r = completeHabit(r, dayKeyOf(day('2026-09-25T12:00'))); // sex
    expect(habitCountsOn({ schedule }, r, day('2026-09-26T12:00'))).toBe(false);
  });

  it.todo('#57 provisório proposto: a META DE CORAÇÃO não conta timesPerWeek enquanto diasRestantesNaSemana >= target − done (crédito continua); 4 semanas seg/qua/sex = 0 corações');
});

// ── #58 — o dreno de cocô e as travas que ele NÃO respeita ───────────────────
describe('#58 dreno: só três travas (02-REGRAS §8 lista MAX_HEARTS_LOST_PER_DAY, heartLossCap, ABSENCE_FORGIVENESS_DAYS)', () => {
  const t0 = day('2026-09-23T09:00').getTime();
  const base = {
    healthPoints: 3,
    poopEventsShown: [0],
    poopEventsCompleted: [] as number[],
    poopPenaltyClockAt: t0,
    lastResetDate: day('2026-09-23T07:00').toDateString(),
  };

  it('save NOVO (saveDay 1) é drenado — a carência NEW_SAVE_GRACE_DAYS só vale na virada', () => {
    const novo = { ...base, lastDayReport: { saveDay: 1 } };
    const r = applyPoopDrain(novo, { now: t0 + POOP_DRAIN_PERIOD_MS, isSleeping: false });
    expect(NEW_SAVE_GRACE_DAYS).toBeGreaterThanOrEqual(1);
    expect(r.healthPoints).toBe(2);
  });

  it('rookie em HP 0 pelo dreno fica em 0 — o piso da raiz só existe na virada', () => {
    const zero = { ...base, healthPoints: 1 };
    const r = applyPoopDrain(zero, { now: t0 + POOP_DRAIN_PERIOD_MS, isSleeping: false });
    expect(r.healthPoints).toBe(0);
  });

  it('o teto é por MECANISMO: o dreno não lê o que a virada já cobrou hoje', () => {
    // A virada de hoje já tirou 1 (lastDayReport.heartsLost = 1); o dreno cobra o seu 1 mesmo assim.
    const jaCobrado = { ...base, lastDayReport: { saveDay: 90, heartsLost: 1 } };
    const r = applyPoopDrain(jaCobrado, { now: t0 + POOP_DRAIN_PERIOD_MS, isSleeping: false });
    expect(r.healthPoints).toBe(2);
  });

  it.todo('#58 provisório proposto: applyPoopDrain lê saveDaysLived/returnGraceLeft (carência + rampa), teto do DIA compartilhado com a virada (lastDayReport.heartsLost), e rookie em 0 pelo dreno volta a 1');
});

// ── #60 — a virada julga só ONTEM ────────────────────────────────────────────
describe('#60 virada: quem faz tudo na segunda e reabre na quarta não recebe o dia completo (02-REGRAS §7 + §1 "não cobra de quem sumiu")', () => {
  it('feito 100% na segunda, virada na quarta → perdoada E sem crédito (perfectDays continua 0)', () => {
    const seg = day('2026-09-21T12:00');
    const qua = day('2026-09-23T12:00');
    // Hábitos (o caso da simulação, perfis Bx/Bsx): o crédito exige
    // `lastCompletedDate === ontem`, e "ontem" na quarta é a TERÇA.
    const habito = (id: string) => ({
      id, category: 'Health', emoji: '🏃', weekDays: [0, 1, 2, 3, 4, 5, 6], steps: [],
      completedToday: true, lastCompletedDate: seg.toDateString(),
    });
    const prev = {
      activities: [0, 1, 2, 3].map(i => habito(`h${i}`)),
      tasks: [],
      healthPoints: 3, maxHealthPoints: 3, energyPoints: 10, perfectDays: 0, totalXP: 0,
      virusPoints: 0, dataPoints: 0, vaccinePoints: 0,
      evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], currentBranch: 'data' as const,
      maxActivityCap: 6,
      lastResetDate: seg.toDateString(),
      lastDayReport: { date: day('2026-09-20T12:00').toDateString(), saveDay: 90 },
      restDaysLeft: 0, restWeekKey: restWeekKeyFor(seg),
    };
    const r = computeDailyReset(prev, { now: qua }) as Record<string, any>;
    expect(r.lastDayReport.welcomeBack).toBe(true);
    expect(r.healthPoints).toBe(3);        // não cobra — correto
    expect(r.perfectDays).toBe(0);         // e não credita — o achado 2.1
    expect(r.lastDayWasPerfect).toBe(false);
    // (Com TAREFAS ainda marcadas em `tasks` o crédito acontece, porque a flag
    // `completed` não tem data — só o hábito perde o dia. Vale registrar.)
  });

  it.todo('#60 provisório proposto: a virada julga o dia de lastResetDate (o último em que a pessoa esteve) — "seg feito, qua aberto → perfectDays +1"');
});

// ── #61 — degenerar e re-evoluir no mesmo dia ────────────────────────────────
describe('#61 degeneração: o piso deixa perfectDays >= required do estágio novo (02-REGRAS §18 piso+custo)', () => {
  it('mega com 26 dias que cai para ultimate reaparece com 21 >= 5: o botão Evoluir acende na mesma abertura', () => {
    const depois = degeneratedPerfectDays(26, 'ultimate');
    expect(depois).toBe(21);
    expect(depois).toBeGreaterThanOrEqual(FORM_REQUIREMENTS.ultimate.required);
  });

  it.todo('#61 provisório proposto: canEvolve/handleEvolve exigem uma virada com dayWasPerfect depois de degeneratedByHP — "cair e evoluir na mesma virada é impossível" (degeneracao.cenarios.test.ts)');
});

// ── #62 / #63 — fora dos módulos deste guarda (specialItemUse.ts, shop/economia) ──
describe('#62 Glitchtama e #63 Bits — só registro', () => {
  it.todo('#62 (=#41): 🌀 credita perfectDays sem tocar totalPerfectDays (conquista dias-completos-30 e mission-perfect-30 leem o vitalício) — dono: specialItemUse.ts');
  it.todo('#63: Bits por dia completo OU documentar "a loja é dos minijogos" em 02-REGRAS §47 — decisão do dono; nenhum guarda é dono da curva de Bits');
});
