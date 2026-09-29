/**
 * P2 — o dia de folga da semana.
 *
 * O que estes testes protegem:
 *
 *  1. **A folga é gasta sozinha, sobre um dia que já terminou.** Quem precisou
 *     de folga não abriu o app; uma folga que precisa ser declarada de antemão
 *     é mais um item de planejamento, que é a fricção que a auditoria de carga
 *     diária mandou tirar.
 *  2. **É UMA por semana, sem acúmulo.** Saldo que empilha é saldo a
 *     administrar, e administrar saldo é trabalho.
 *  3. **A folga não compra dia completo.** Não ganha, não perde — o formato do
 *     Pokémon Sleep. Se esta cair, o alívio virou atalho de evolução.
 *  4. **Save antigo nunca começa devendo**: sem os campos, a folga daquela
 *     semana estava inteira.
 *  5. **A pessoa é AVISADA** de que a folga foi usada. Perdão que ninguém soube
 *     que recebeu não acalma ninguém — e, pior, na semana seguinte ela é
 *     cobrada sem entender por que desta vez doeu.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { computeDailyReset, restWeekKeyFor, REST_DAYS_PER_WEEK } from './dailyReset';

const TODO_DIA = [0, 1, 2, 3, 4, 5, 6];

/**
 * Um save veterano de rookie com 4 hábitos diários, na virada de um dia em que
 * ele não fez NADA — ou seja, uma perda de coração garantida se a folga não
 * entrar. `saveDay` alto para escapar da carência de começo de vida.
 */
function virada(over: Record<string, unknown> = {}, agora = new Date('2026-09-09T03:00:00')) {
  const ontem = new Date(agora.getTime() - 86400000);
  const prev = {
    evolutionStage: 'rookie',
    maxHealthPoints: 3,
    healthPoints: 3,
    perfectDays: 0,
    totalPerfectDays: 0,
    energyPoints: 0,
    unlockedEvolutions: [] as string[],
    currentBranch: 'harmony',
    maxActivityCap: 6,
    evolutionLocked: true,
    lastResetDate: ontem.toDateString(),
    activities: Array.from({ length: 4 }, (_, i) => ({
      id: `a${i}`, weekDays: TODO_DIA, steps: [], completedToday: false,
    })),
    tasks: [] as unknown[],
    completedTasks: [] as unknown[],
    activityLog: [] as string[],
    lastDayReport: { date: 'seed', saveDay: 90 },
    ...over,
  };
  return computeDailyReset(prev as never, { now: agora }) as any;
}

/** A semana à qual pertence o dia julgado pela virada padrão (terça, 08/09). */
const SEMANA_DE_ONTEM = restWeekKeyFor(new Date('2026-09-08T12:00:00'));

describe('a folga absorve a perda, uma vez por semana', () => {
  it('save antigo (sem os campos) tem a folga inteira — nunca herda dívida', () => {
    const d = virada();
    expect(d.lastDayReport.heartsLost).toBe(0);
    expect(d.healthPoints).toBe(3);
    expect(d.lastDayReport.restDayUsed).toBe(true);
  });

  it('gasta a folga: o contador cai para zero na mesma virada', () => {
    const d = virada();
    expect(d.restDaysLeft).toBe(0);
    expect(d.restWeekKey).toBe(restWeekKeyFor(new Date('2026-09-09T03:00:00')));
  });

  it('o SEGUNDO dia ruim da mesma semana cobra normalmente', () => {
    // É o ponto inteiro do "uma por semana": sem isto a folga vira imunidade.
    const d = virada({ restDaysLeft: 0, restWeekKey: SEMANA_DE_ONTEM });
    expect(d.lastDayReport.heartsLost).toBeGreaterThan(0);
    expect(d.lastDayReport.restDayUsed).toBe(false);
  });

  it('não acumula: quem passou a semana inteira sem usar continua com UMA', () => {
    const d = virada({ restDaysLeft: 5, restWeekKey: SEMANA_DE_ONTEM });
    expect(d.lastDayReport.heartsLost).toBe(0);
    // Gastou a que tinha e a virada não guardou saldo acima do teto.
    expect(d.restDaysLeft).toBeLessThanOrEqual(REST_DAYS_PER_WEEK);
  });

  it('dia bom não gasta folga — ela não se perde sozinha', () => {
    const cumpriu = virada({
      restDaysLeft: 1,
      restWeekKey: SEMANA_DE_ONTEM,
      activities: Array.from({ length: 4 }, (_, i) => ({
        id: `a${i}`, weekDays: TODO_DIA, steps: [],
        completedToday: true,
        lastCompletedDate: new Date('2026-09-08T03:00:00').toDateString(),
      })),
    });
    expect(cumpriu.lastDayReport.heartsLost).toBe(0);
    expect(cumpriu.lastDayReport.restDayUsed).toBe(false);
    expect(cumpriu.restDaysLeft).toBe(1);
  });
});

describe('a semana vira', () => {
  it('a folga volta na segunda, mesmo tendo sido gasta na semana passada', () => {
    // Virada de domingo→segunda: o domingo é julgado com a folga da semana
    // VELHA (gasta), e a semana nova já começa com a dela.
    const segunda = new Date('2026-09-14T03:00:00');
    const semanaVelha = restWeekKeyFor(new Date('2026-09-13T12:00:00')); // domingo
    const d = virada({ restDaysLeft: 0, restWeekKey: semanaVelha }, segunda);
    expect(d.lastDayReport.heartsLost).toBeGreaterThan(0); // o domingo cobrou
    expect(d.restDaysLeft).toBe(REST_DAYS_PER_WEEK);       // e a semana nova tem a dela
  });

  it('não dá DUAS folgas na virada de segunda', () => {
    // O risco da ordem invertida: recarregar antes de cobrar faria o domingo
    // ser perdoado pela folga da semana nova, e a semana nova ainda começaria
    // cheia — duas folgas pelo preço de uma.
    const segunda = new Date('2026-09-14T03:00:00');
    const semanaVelha = restWeekKeyFor(new Date('2026-09-13T12:00:00'));
    const d = virada({ restDaysLeft: 0, restWeekKey: semanaVelha }, segunda);
    expect(d.lastDayReport.restDayUsed).toBe(false);
  });
});

describe('o que a folga NÃO faz', () => {
  it('não vira dia completo, e não adianta a evolução', () => {
    const d = virada();
    expect(d.lastDayReport.restDayUsed).toBe(true);
    expect(d.lastDayReport.wasPerfect).toBe(false);
    expect(d.perfectDays).toBe(0);
  });

  it('a UI é avisada — a folga não é gasta em silêncio', () => {
    const d = virada();
    expect(d.lastDayReport).toHaveProperty('restDayUsed', true);
    expect(d.lastDayReport).toHaveProperty('restDaysLeft', 0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
describe('a chave da semana sobrevive ao horário de verão', () => {
  /**
   * `restWeekKeyFor` andava para trás com `getTime() - n * 86400000`, que
   * subtrai blocos de 24 h EXATAS. Na virada do horário de verão a hora local
   * anda 1 h, então às 23h30 de domingo o resultado caía no domingo anterior e
   * a chave virava a da semana passada — dando uma folga extra de graça, uma
   * vez por ano, em todo fuso com DST. O Brasil não tem mais DST: por isso o
   * bug era invisível na máquina de quem escreveu a regra.
   *
   * Este teste roda o ano inteiro, em quatro horários por dia, num processo
   * filho por fuso — `TZ` só é lido na inicialização do processo, então não dá
   * para trocar de fuso dentro do teste.
   */
  const FUSOS = ['America/New_York', 'Europe/London', 'Australia/Sydney', 'America/Santiago'];

  const filho = `
    ${restWeekKeyFor.toString()}
    let ruins = [];
    for (let i = 0; i < 400; i++) {
      for (const h of [0, 1, 4, 12, 23]) {
        const d = new Date(2026, 0, 1, h, 30, 0);
        d.setDate(d.getDate() + i);
        const esperada = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
        const esperadaK = esperada.getFullYear() + '-'
          + String(esperada.getMonth() + 1).padStart(2, '0') + '-'
          + String(esperada.getDate()).padStart(2, '0');
        const k = restWeekKeyFor(d);
        if (k !== esperadaK) ruins.push(d.toString() + ' -> ' + k + ' (esperado ' + esperadaK + ')');
      }
    }
    console.log(JSON.stringify(ruins.slice(0, 5)));
  `;

  for (const tz of FUSOS) {
    it(`${tz}: a segunda-feira da semana é sempre uma segunda-feira`, () => {
      const saida = execFileSync(process.execPath, ['-e', filho], {
        env: { ...process.env, TZ: tz },
        encoding: 'utf8',
      });
      expect(JSON.parse(saida.trim())).toEqual([]);
    });
  }

  it('a âncora continua sendo a SEGUNDA, e a semana inteira dá a mesma chave', () => {
    // Domingo 13/09/2026 pertence à semana da segunda 07/09 — e não à do dia 14.
    expect(restWeekKeyFor(new Date(2026, 8, 13, 23, 30))).toBe('2026-09-07');
    expect(restWeekKeyFor(new Date(2026, 8, 7, 0, 1))).toBe('2026-09-07');
    expect(restWeekKeyFor(new Date(2026, 8, 14, 4, 0))).toBe('2026-09-14');
  });
});
