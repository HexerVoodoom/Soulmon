/**
 * A DEGENERAÇÃO AINDA É ALCANÇÁVEL POR NEGLIGÊNCIA REAL?
 *
 * Esta pergunta é do dono, e nasceu do efeito combinado de P1 (a perda de
 * coração passa a medir contra 60% da meta) com P2 (uma folga por semana). O
 * commit `44b7a7c3` declarou o efeito — "um mega pode fazer 4 de 6 em seis dias
 * e 0 no sétimo sem perder um coração" — mas ninguém tinha simulado duas
 * semanas seguidas para ver onde o piso realmente ficou.
 *
 * O que este arquivo é, e o que ele NÃO é:
 *
 *  - **É um retrato do balanceamento decidido**, rodado dia a dia pela virada
 *    de verdade (`computeDailyReset`), com a folga, o alívio de segunda, as
 *    carências e a degeneração todos ligados ao mesmo tempo. Se alguém mexer em
 *    qualquer uma dessas peças, o retrato muda e este arquivo conta onde.
 *  - **NÃO é dono de nenhum número.** `HEART_GOAL_RATIO` e `REST_DAYS_PER_WEEK`
 *    são decisões do dono (07-08/09/2026). Aqui eles são LIDOS, e o que se
 *    afirma são as consequências qualitativas que o produto promete: quem
 *    negligencia de verdade cai, quem cuida no mínimo combinado não cai.
 *
 * O achado que motivou o último caso está em `docs/STATUS.md`: quem abre o app
 * a cada 3 dias é perdoado para sempre (`ABSENCE_FORGIVENESS_DAYS` mais a rampa
 * de retorno), então o padrão MAIS negligente do jogo é o único imune. Isso é
 * anterior a P1/P2 e é uma decisão pendente do dono — está afirmado aqui como
 * FATO OBSERVADO, para que ninguém "corrija" a folga achando que a culpa é dela.
 */
import { describe, it, expect } from 'vitest';
import { computeDailyReset, restWeekKeyFor } from './dailyReset';

const TODO_DIA = [0, 1, 2, 3, 4, 5, 6];

/** Save veterano com 6 hábitos diários — a meta cheia de mega/ultra. */
function save(evolutionStage: string, maxHP: number, over: Record<string, unknown> = {}) {
  return {
    evolutionStage, healthPoints: maxHP, maxHealthPoints: maxHP,
    energyPoints: 0, perfectDays: 0, totalXP: 0,
    virusPoints: 0, dataPoints: 0, vaccinePoints: 0,
    attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
    unlockedEvolutions: [evolutionStage], currentBranch: 'data', lastDayWasPerfect: false,
    degeneratedByHP: false, maxActivityCap: 7, foodInventory: {}, tasks: [],
    activities: Array.from({ length: 6 }, (_, i) => ({
      id: `h${i}`, name: `h${i}`, category: 'estudo', kind: 'habit', effort: 1, steps: [],
      schedule: { kind: 'weekdays', days: TODO_DIA },
      completedToday: false, lastCompletedDate: undefined,
    })),
    // Save VETERANO: sem isto tudo aqui mediria a carência de começo de vida.
    lastDayReport: { date: 'seed', saveDay: 90 },
    restDaysLeft: 1, restWeekKey: restWeekKeyFor(new Date(2026, 8, 7)),
    ...over,
  } as Record<string, unknown>;
}

/**
 * Roda `dias` viradas às 04:00 a partir de `comeca`, marcando `feitas(dia)`
 * hábitos como concluídos no dia julgado. `pulo` = de quantos em quantos dias o
 * app é aberto (1 = todo dia).
 */
function correr(
  inicial: Record<string, unknown>,
  dias: number,
  comeca: Date,
  feitas: (diaDaSemanaJulgado: number) => number,
  pulo = 1,
) {
  let s = inicial as any;
  const trilha: Array<{ hp: number; perdeu: number; folga: boolean; estagio: string }> = [];
  for (let d = 0; d < dias; d++) {
    const agora = new Date(comeca); agora.setDate(agora.getDate() + d * pulo);
    const ontem = new Date(agora); ontem.setDate(ontem.getDate() - 1);
    const n = feitas(ontem.getDay());
    s = {
      ...s,
      activities: (s.activities as any[]).map((a, i) => i < n
        ? { ...a, completedToday: true, lastCompletedDate: ontem.toDateString() }
        : { ...a, completedToday: false, lastCompletedDate: undefined }),
      // A primeira virada também precisa de uma véspera coerente com `pulo`,
      // senão o dia 0 é lido como virada normal de 1 dia e o cenário de
      // ausência começa cobrando (e gastando a folga) antes de existir.
      lastResetDate: new Date(agora.getTime() - pulo * 86400000).toDateString(),
    };
    s = computeDailyReset(s, { now: agora });
    trilha.push({
      hp: s.healthPoints, perdeu: s.lastDayReport.heartsLost,
      folga: s.lastDayReport.restDayUsed, estagio: s.evolutionStage,
    });
  }
  return { fim: s, trilha };
}

/** Terça 08/09/2026, 04:00 — começa fora da segunda para o alívio não mascarar. */
const INICIO = new Date(2026, 8, 8, 4, 0, 0);

describe('duas semanas de negligência real — a criatura CAI', () => {
  it('mega que não faz NADA por 14 dias desce dois estágios', () => {
    const { fim } = correr(save('mega', 4), 14, INICIO, () => 0);
    expect(fim.evolutionStage).not.toBe('mega');
    // mega desce para ultimate, depois champion: a folga e o alívio de segunda
    // atrasam a queda, nunca a impedem.
    expect(['champion-data', 'rookie']).toContain(fim.evolutionStage);
  });

  it('a PRIMEIRA queda leva menos de uma semana, mesmo com a folga', () => {
    const { trilha } = correr(save('mega', 4), 7, INICIO, () => 0);
    const primeiraQueda = trilha.findIndex(t => t.estagio !== 'mega');
    expect(primeiraQueda).toBeGreaterThanOrEqual(0);
    expect(primeiraQueda).toBeLessThan(7);
    // E a folga foi usada exatamente UMA vez na semana.
    expect(trilha.filter(t => t.folga).length).toBe(1);
  });

  it('ultra que não faz nada por 14 dias também cai', () => {
    const { fim } = correr(save('ultra', 5), 14, INICIO, () => 0);
    expect(fim.evolutionStage).not.toBe('ultra');
  });

  it('fazer 2 de 6 todo dia (bem abaixo da meta de coração) também derruba', () => {
    const { fim } = correr(save('mega', 4), 14, INICIO, () => 2);
    expect(fim.evolutionStage).not.toBe('mega');
  });
});

describe('…e quem cumpre o mínimo combinado NÃO cai — é o desconto funcionando', () => {
  it('mega com 4 de 6 todo dia atravessa duas semanas sem perder um coração', () => {
    const { fim, trilha } = correr(save('mega', 4), 14, INICIO, () => 4);
    expect(fim.evolutionStage).toBe('mega');
    expect(fim.healthPoints).toBe(4);
    expect(trilha.every(t => t.perdeu === 0)).toBe(true);
    // E a folga NUNCA foi gasta: não havia perda para ela absorver.
    expect(trilha.some(t => t.folga)).toBe(false);
  });

  it('o caso declarado no commit: 4 de 6 em seis dias e ZERO no sétimo, duas semanas', () => {
    const { fim, trilha } = correr(save('mega', 4), 14, INICIO, wd => (wd === 0 ? 0 : 4));
    expect(fim.evolutionStage).toBe('mega');
    expect(fim.healthPoints).toBe(4);
    // Duas semanas, dois domingos zerados, duas folgas — e nenhum coração.
    expect(trilha.filter(t => t.folga).length).toBe(2);
    expect(trilha.every(t => t.perdeu === 0)).toBe(true);
  });

  it('mas DOIS dias zerados na mesma semana já custam coração — a folga é uma só', () => {
    // Sábado e domingo zerados: a folga cobre um, o outro cobra.
    const { trilha } = correr(save('mega', 4), 14, INICIO, wd => (wd === 0 || wd === 6 ? 0 : 4));
    expect(trilha.some(t => t.perdeu > 0)).toBe(true);
  });
});

describe('FATO OBSERVADO: quem quase não abre o app é imune, e isso não é culpa da folga', () => {
  it('abrir a cada 3 dias e não fazer NADA nunca custa um coração', () => {
    // `ABSENCE_FORGIVENESS_DAYS` (2) perdoa a virada de quem sumiu, e a rampa
    // de retorno cobre as seguintes: o padrão mais negligente do jogo é o único
    // que a regra não alcança. É anterior a P1/P2 e está na fila do dono.
    const { fim, trilha } = correr(save('mega', 4), 10, INICIO, () => 0, 3);
    expect(trilha.every(t => t.perdeu === 0)).toBe(true);
    expect(fim.evolutionStage).toBe('mega');
    expect(fim.healthPoints).toBe(4);
    // E a folga sequer é tocada — não há perda para ela absorver.
    expect(trilha.some(t => t.folga)).toBe(false);
  });
});
