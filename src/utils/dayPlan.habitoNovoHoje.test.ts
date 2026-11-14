/**
 * §371 (bug do dono, 14/11/2026): hábito ADICIONADO hoje não entrava na lista "Hoje" da Home; só aparecia no dia seguinte, no
 * modal "Hoje". Causa: com o plano do dia ainda de OUTRO dia (antes da reafirmação), `dayPlanView` devolvia `hideAll` e
 * escondia TUDO — inclusive quem acabou de nascer, contrariando o §66 ("quem nasce depois aparece sozinho; criar é um ato do
 * próprio dia"). E o "a cada N dias" do calendário sem histórico ancorava em 01/01/1970 (o recém-criado podia não cair hoje).
 *
 * A "lista de hoje" aqui é a MESMA régua da Home (`DailyRituals`): devido hoje (`habitCountsOn`) e não escondido pelo plano.
 */
import { describe, it, expect } from 'vitest';
import {
  dayPlanView, isHiddenByPlan, bornTodayIds, showDayPlan, dayPlanCandidates, confirmDayPlan, type DayPlan,
} from './dayPlan';
import { habitCountsOn, emptyRhythm } from './habitRhythm';
import { dailyGoalFor } from './dailyReset';
import type { Schedule } from '../types/taskModel';

const AGORA = new Date(2026, 10, 14, 15, 0, 0); // sábado, 14/11/2026, 15h (dia do jogador = local, sem âncora)
const HOJE = '2026-11-14';
const ONTEM = '2026-11-13';
const NASCEU = new Date(2026, 10, 14, 14, 55, 0).toISOString();
const todos = [0, 1, 2, 3, 4, 5, 6];

type A = { id: string; name: string; steps: never[]; weekDays: number[]; schedule: Schedule; createdAt?: string };
const antigo: A = { id: 'velho', name: 'Beber água', steps: [], weekDays: todos, schedule: { kind: 'weekdays', days: todos } };
const novo = (schedule: Schedule, weekDays: number[] = todos): A => ({ id: 'novo', name: 'Ler 10 min', steps: [], weekDays, schedule, createdAt: NASCEU });

const CASOS: Array<[string, Schedule, number[]?]> = [
  ['diário', { kind: 'weekdays', days: todos }],
  ['semanal num dia que inclui hoje (sábado)', { kind: 'weekdays', days: [2, 6] }, [2, 6]],
  ['3x por semana', { kind: 'timesPerWeek', target: 3 }],
  ['a cada 3 dias, do calendário', { kind: 'everyNDays', n: 3, from: 'schedule' }],
  ['a cada 3 dias, da conclusão', { kind: 'everyNDays', n: 3, from: 'completion' }],
];

/** A régua da Home: devido hoje e não escondido pelo plano (o App passa `bornTodayIds` das atividades + tarefas). */
function listaDeHoje(activities: A[], plan: DayPlan | undefined): string[] {
  const view = dayPlanView(plan, HOJE, true, bornTodayIds(activities, HOJE));
  return activities
    .filter(a => habitCountsOn(a, undefined, AGORA))
    .filter(a => !isHiddenByPlan(view, a.id))
    .map(a => a.id);
}

const PLANO_DE_ONTEM: DayPlan = { day: ONTEM, offered: ['velho'], picked: ['velho'], confirmed: true };
const PLANO_DE_HOJE: DayPlan = { day: HOJE, offered: ['velho'], picked: ['velho'], confirmed: true };

describe('§371 — hábito criado hoje entra na lista de hoje no mesmo dia', () => {
  for (const [nome, schedule, dias] of CASOS) {
    it(`${nome}: antes da reafirmação (plano de ontem)`, () => {
      const lista = listaDeHoje([antigo, novo(schedule, dias)], PLANO_DE_ONTEM);
      expect(lista).toContain('novo');
      // o resto segue esperando a reafirmação (o dia só começa depois dela, §66)
      expect(lista).not.toContain('velho');
    });
    it(`${nome}: depois da reafirmação (plano de hoje)`, () => {
      expect(listaDeHoje([antigo, novo(schedule, dias)], PLANO_DE_HOJE)).toEqual(['velho', 'novo']);
    });
    it(`${nome}: aparece uma vez só nas metas oferecidas pelo modal "Hoje"`, () => {
      const c = dayPlanCandidates({ activities: [antigo, novo(schedule, dias)], tasks: [] }, AGORA);
      expect(c.filter(x => x.id === 'novo')).toHaveLength(1);
    });
  }

  it('sem carimbo de nascimento (save antigo) nada muda: o plano de outro dia esconde tudo, como antes', () => {
    const { createdAt: _, ...semCarimbo } = novo({ kind: 'weekdays', days: todos });
    expect(listaDeHoje([antigo, semCarimbo as A], PLANO_DE_ONTEM)).toEqual([]);
  });

  it('nascido ONTEM não escapa do plano de outro dia (só o de hoje)', () => {
    const deOntem = { ...novo({ kind: 'weekdays', days: todos }), createdAt: new Date(2026, 10, 13, 20, 0, 0).toISOString() };
    expect(listaDeHoje([antigo, deOntem], PLANO_DE_ONTEM)).toEqual([]);
  });

  it('o "não marcado" explícito de hoje continua escondido, mesmo nascido hoje (foi escolha da pessoa)', () => {
    const plan: DayPlan = { day: HOJE, offered: ['velho', 'novo'], picked: ['velho'], confirmed: true };
    expect(listaDeHoje([antigo, novo({ kind: 'weekdays', days: todos })], plan)).toEqual(['velho']);
  });

  it('o modal "Hoje" mostrado depois: o nascido hoje entra no instantâneo JÁ MARCADO e segue na lista ao confirmar', () => {
    const acts = [antigo, novo({ kind: 'weekdays', days: todos })];
    const visto = showDayPlan(PLANO_DE_ONTEM, HOJE, dayPlanCandidates({ activities: acts, tasks: [] }, AGORA), bornTodayIds(acts, HOJE));
    expect(visto.offered).toEqual(['velho', 'novo']);
    expect(visto.picked).toEqual(['novo']);
    // confirmar com o que veio marcado (o modal abre com `initiallyPicked = plan.picked`) mais o antigo
    const confirmado = confirmDayPlan(visto, HOJE, [...visto.picked, 'velho']);
    expect(listaDeHoje(acts, confirmado)).toEqual(['velho', 'novo']);
    // reabrir o modal no mesmo dia não remarca quem a pessoa desmarcou
    const desmarcado = confirmDayPlan(visto, HOJE, ['velho']);
    expect(showDayPlan(desmarcado, HOJE, [], bornTodayIds(acts, HOJE)).picked).toEqual(['velho']);
  });

  it('"a cada N dias" do calendário: série começa no dia do nascimento (hoje, +3, +6), e não em 01/01/1970', () => {
    const h = novo({ kind: 'everyNDays', n: 3, from: 'schedule' });
    const dia = (d: number) => new Date(2026, 10, d, 12, 0, 0);
    expect([14, 15, 16, 17, 18, 19, 20].map(d => habitCountsOn(h, emptyRhythm(), dia(d)))).toEqual([true, false, false, true, false, false, true]);
    // antes de nascer, não é devido
    expect(habitCountsOn(h, emptyRhythm(), dia(13))).toBe(false);
  });
});

describe('§371 — a meta do dia não duplica nem conta duas vezes o nascido hoje', () => {
  const estado = (plan: DayPlan | undefined, acts: A[]) => ({ evolutionStage: 'mega', activities: acts, tasks: [], dayPlan: plan });
  const dk = AGORA.toDateString();
  const acts = [antigo, novo({ kind: 'weekdays', days: todos })];

  it('pesa 1 (HABIT_WEIGHT) na meta de hoje, como qualquer hábito cadastrado no dia (regra de sempre, §66)', () => {
    expect(dailyGoalFor(estado(PLANO_DE_HOJE, acts), AGORA.getDay(), dk)).toBe(2);
  });

  it('entrar no instantâneo já marcado não muda a meta (nem soma de novo)', () => {
    const visto = showDayPlan(PLANO_DE_HOJE, HOJE, dayPlanCandidates({ activities: acts, tasks: [] }, AGORA), bornTodayIds(acts, HOJE));
    expect(dailyGoalFor(estado(visto, acts), AGORA.getDay(), dk)).toBe(dailyGoalFor(estado(PLANO_DE_HOJE, acts), AGORA.getDay(), dk));
  });
});
