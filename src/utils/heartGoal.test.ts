/**
 * P1 — a meta que protege o CORAÇÃO é menor que a meta do dia completo.
 *
 * O que estes testes protegem, e por quê:
 *
 *  1. **As duas réguas não podem voltar a ser uma só.** Era o problema: a mesma
 *     `dailyGoal` decidia se o dia foi completo E se a criatura perdia coração,
 *     então não existia lugar nenhum entre "fiz tudo" e "regredi".
 *  2. **A excelência não foi afrouxada.** `dayWasPerfect` continua exigindo a
 *     meta inteira — princípio permanente #3 (modernizar o atrito, nunca a
 *     dificuldade). Se um dia alguém aplicar o desconto ao dia completo também,
 *     o caminho de evolução cede junto, e é isso que o teste impede.
 *  3. **O alívio não pode virar "não precisa fazer nada".** Piso de 1 e
 *     arredondamento para cima.
 *  4. **A UI promete o mesmo número que o jogo cobra** (footgun 9).
 */
import { describe, it, expect } from 'vitest';
import {
  HEART_GOAL_RATIO,
  heartGoalFromDailyGoal,
  heartGoalFor,
  dailyGoalFor,
  tasksToAvoidHeartLoss,
  rawHeartsLostFor,
  computeDailyReset,
  restWeekKeyFor,
} from './dailyReset';

describe('heartGoalFromDailyGoal', () => {
  it('a tabela da proposta, estágio a estágio', () => {
    // meta do dia → itens necessários para não perder coração
    expect(heartGoalFromDailyGoal(4)).toBe(3); // rookie: continua 3
    expect(heartGoalFromDailyGoal(5)).toBe(3); // champion/ultimate: era 4
    expect(heartGoalFromDailyGoal(6)).toBe(4); // mega/ultra: era 5
  });

  it('sem nada cadastrado, não há o que cobrar — o piso não inventa cobrança', () => {
    // `0` tem de continuar `0`: o piso de 1 aqui criaria uma falha para quem
    // não se comprometeu com nada naquele dia.
    expect(heartGoalFromDailyGoal(0)).toBe(0);
    expect(heartGoalFromDailyGoal(-3)).toBe(0);
  });

  it('meta de 1 continua exigindo 1 — o desconto nunca chega a zero', () => {
    expect(heartGoalFromDailyGoal(1)).toBe(1);
    expect(heartGoalFromDailyGoal(2)).toBe(2); // ceil(1,2)
  });

  it('nunca é maior que a meta do dia, e nunca cresce quando ela encolhe', () => {
    let anterior = 0;
    for (let meta = 0; meta <= 40; meta++) {
      const h = heartGoalFromDailyGoal(meta);
      expect(h).toBeLessThanOrEqual(Math.max(meta, 0));
      expect(h).toBeGreaterThanOrEqual(anterior);
      anterior = h;
    }
  });

  it('o botão de ajuste é a constante, e ele está no valor decidido', () => {
    // Se este número mudar, muda a linha ❤️ do CLAUDE.md junto.
    expect(HEART_GOAL_RATIO).toBe(0.6);
  });
});

const estado = (atividades: number, stage = 'mega-benevolence') => ({
  evolutionStage: stage,
  activities: Array.from({ length: atividades }, (_, i) => ({
    id: `a${i}`, name: `h${i}`, weekDays: [0, 1, 2, 3, 4, 5, 6],
  })),
  tasks: [],
  maxHealthPoints: 5,
  healthPoints: 5,
});

describe('as duas réguas', () => {
  it('`heartGoalFor` desconta; `dailyGoalFor` não', () => {
    const s = estado(6) as never;
    expect(dailyGoalFor(s, 1)).toBe(6);
    expect(heartGoalFor(s, 1)).toBe(4);
  });

  it('a UI promete exatamente o que a virada cobra', () => {
    // O número que `tasksToAvoidHeartLoss` responde tem de zerar a perda pela
    // MESMA fórmula, contra a MESMA meta. Divergir aqui é o footgun 9.
    const s = estado(6) as never;
    const n = tasksToAvoidHeartLoss(s, 1);
    expect(n).toBe(4);
    expect(rawHeartsLostFor(n, heartGoalFor(s, 1), 5)).toBe(0);
    expect(rawHeartsLostFor(n - 1, heartGoalFor(s, 1), 5)).toBeGreaterThan(0);
  });
});

/**
 * Um save VETERANO de mega, com 6 hábitos diários, na virada de terça→quarta.
 * `lastDayReport.saveDay` alto de propósito: sem ele o estado cai na carência
 * de começo de vida (`NEW_SAVE_GRACE_DAYS`), que não cobra HP — e os testes
 * abaixo mediriam a carência em vez da regra.
 */
function viradaCom(feitas: number) {
  const agora = new Date('2026-09-09T03:00:00');   // quarta, de madrugada
  const ontem = new Date('2026-09-08T12:00:00').toDateString();
  const TODO_DIA = [0, 1, 2, 3, 4, 5, 6];
  const prev = {
    evolutionStage: 'mega-benevolence',
    maxHealthPoints: 5,
    healthPoints: 5,
    perfectDays: 0,
    totalPerfectDays: 0,
    energyPoints: 6,
    unlockedEvolutions: [] as string[],
    currentBranch: 'harmony',
    maxActivityCap: 8,
    evolutionLocked: true,
    lastResetDate: ontem,
    activities: Array.from({ length: 6 }, (_, i) => ({
      id: `a${i}`, weekDays: TODO_DIA, steps: [],
      completedToday: i < feitas,
      lastCompletedDate: i < feitas ? ontem : undefined,
    })),
    tasks: [] as unknown[],
    completedTasks: [] as unknown[],
    activityLog: [] as string[],
    lastDayReport: { date: 'seed', saveDay: 90 },
    // A folga da semana (P2) já foi gasta: estes testes são sobre a RÉGUA da
    // perda, e com a folga disponível todos eles mediriam a folga. Ela tem o
    // próprio arquivo (`restDay.test.ts`).
    restDaysLeft: 0,
    restWeekKey: restWeekKeyFor(new Date('2026-09-08T12:00:00')),
  };
  return computeDailyReset(prev as never, { now: agora }) as any;
}

describe('a virada do dia', () => {
  it('mega que fez 4 de 6 NÃO perde coração — era o caso que doía', () => {
    const out = viradaCom(4);
    expect(out.lastDayReport.heartsLost).toBe(0);
  });

  it('…e o dia dele também NÃO é completo: a excelência não foi afrouxada', () => {
    // As duas asserções juntas são o ponto inteiro da P1. Se um dia esta
    // segunda cair, o desconto vazou para o caminho de evolução.
    const out = viradaCom(4);
    expect(out.lastDayReport.wasPerfect).toBe(false);
    expect(out.perfectDays).toBe(0);
  });

  it('quem faz a meta inteira continua fechando o dia completo', () => {
    const out = viradaCom(6);
    expect(out.lastDayReport.wasPerfect).toBe(true);
    expect(out.lastDayReport.heartsLost).toBe(0);
  });

  it('negligência real continua cobrando: 1 de 6 perde coração', () => {
    // O alívio não pode virar imunidade — senão o v-pet deixa de ter aposta.
    expect(viradaCom(1).lastDayReport.heartsLost).toBeGreaterThan(0);
  });
});
