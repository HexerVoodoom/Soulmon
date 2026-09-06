/**
 * WP2.15 — a virada passa a REGISTRAR quantos escudos gastou.
 *
 * O escudo de descanso é consumido automaticamente e **em silêncio**: é a
 * decisão de produto que separa este app do Habitica (proteção que exige
 * lembrar de ativar antes de falhar não protege ninguém). O efeito colateral é
 * que ninguém nunca soube com que frequência ele salva alguém — e é exatamente
 * esse número que a decisão D3 (baixar `REST_SHIELD_MAX` de 3 para 2) precisa.
 *
 * O silêncio continua para o JOGADOR. O que muda é que a virada anota o gasto
 * em `lastDayReport`, junto de `saveDay` e `returnGraceLeft`, que já moram ali
 * pelo mesmo motivo: é o único objeto deste arquivo que atravessa a hidratação
 * inteiro, e nenhum dos três é para a UI.
 */
import { describe, it, expect } from 'vitest';
import { computeDailyReset } from './dailyReset';
import { emptyRhythm, completeHabit } from './habitRhythm';
import { REST_SHIELD_EARN_EVERY_DAYS } from '../types/taskModel';

const QUARTA = new Date('2026-08-05T12:00:00');
const ONTEM = new Date('2026-08-04T12:00:00');

/** Um hábito devido todo dia, não concluído ontem. */
const habitoNaoFeito = (id: string) => ({
  id, category: 'health', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6],
  completedToday: false, lastCompletedDate: undefined,
});

/** Ritmo com N escudos guardados: N × 7 dias de boa constância. */
function ritmoComEscudos(n: number) {
  let r = emptyRhythm();
  const dia = new Date('2026-05-01T12:00:00');
  for (let i = 0; i < n * REST_SHIELD_EARN_EVERY_DAYS * 2; i++) {
    const d = new Date(dia.getTime() + i * 86400000);
    r = completeHabit(r, d.toISOString().slice(0, 10));
    r = { ...r, shields: Math.min(n, r.shields) };
  }
  return { ...r, shields: n };
}

const estado = (over: Record<string, unknown> = {}) => ({
  activities: [], tasks: [], healthPoints: 3, maxHealthPoints: 3, energyPoints: 10,
  perfectDays: 0, totalXP: 0, virusPoints: 0, dataPoints: 0, vaccinePoints: 0,
  evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], currentBranch: 'data' as const,
  maxActivityCap: 6,
  lastResetDate: ONTEM.toDateString(),
  lastDayReport: { date: new Date('2026-08-03T12:00:00').toDateString(), saveDay: 90 },
  ...over,
});

describe('a virada registra os escudos gastos (WP2.15)', () => {
  it('dia sem falta nenhuma não gasta escudo', () => {
    const s: any = computeDailyReset(estado() as any, { now: QUARTA } as any);
    expect(s.lastDayReport.shieldsSpent).toBe(0);
  });

  it('faltar com escudo guardado gasta UM e registra', () => {
    const prev = estado({
      activities: [habitoNaoFeito('h1')],
      habitRhythms: { h1: ritmoComEscudos(2) },
    });
    const s: any = computeDailyReset(prev as any, { now: QUARTA } as any);
    expect(s.lastDayReport.shieldsSpent).toBe(1);
    // O dia entra em `shielded[]`: para a constância ele conta como FEITO —
    // é isso que o escudo compra.
    expect(s.habitRhythms.h1.shielded).toContain(ONTEM.toDateString());
    // ⚠️ O saldo final NÃO cai necessariamente: `earnShield` roda na mesma
    // virada e pode repor o que acabou de ser gasto. Foi por isso que a
    // contagem ficou ANTES dele — medir pelo saldo esconderia o gasto.
  });

  it('dois hábitos protegidos no mesmo dia contam dois', () => {
    const prev = estado({
      activities: [habitoNaoFeito('h1'), habitoNaoFeito('h2')],
      habitRhythms: { h1: ritmoComEscudos(1), h2: ritmoComEscudos(1) },
    });
    const s: any = computeDailyReset(prev as any, { now: QUARTA } as any);
    expect(s.lastDayReport.shieldsSpent).toBe(2);
  });

  it('faltar SEM escudo não inventa gasto', () => {
    const prev = estado({
      activities: [habitoNaoFeito('h1')],
      habitRhythms: { h1: emptyRhythm() },
    });
    const s: any = computeDailyReset(prev as any, { now: QUARTA } as any);
    expect(s.lastDayReport.shieldsSpent).toBe(0);
  });

  it('o escudo protege a CONSTÂNCIA, não o coração — e isso é de propósito', () => {
    // Registro de uma fronteira que é fácil confundir: o escudo não é um
    // escudo de HP. O coração vem da meta do dia (`dailyGoalFor`), e um hábito
    // não feito é um item não feito — o escudo não desfaz isso, ele impede que
    // a FALTA vire buraco na leitura de constância. Se um dia alguém fizer o
    // escudo bloquear a perda de coração, terá criado uma peça diferente, e
    // este teste é onde a diferença aparece.
    const prev = estado({
      activities: [habitoNaoFeito('h1')],
      habitRhythms: { h1: ritmoComEscudos(1) },
    });
    const s: any = computeDailyReset(prev as any, { now: QUARTA } as any);
    expect(s.lastDayReport.shieldsSpent).toBe(1);
    expect(s.lastDayReport.heartsLost, 'o escudo passou a mexer em HP').toBeGreaterThan(0);
  });
});
