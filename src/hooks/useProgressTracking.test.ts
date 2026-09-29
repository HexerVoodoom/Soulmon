// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { CATEGORY_ATTRIBUTES } from '../types/attributes';
import { useProgressTracking } from './useProgressTracking';

// ===========================================================================
// Este arquivo TESTAVA UMA CÓPIA.
//
// Antes ele reimplementava `computeProgress` e `computeTodayAttributes` no topo
// do próprio teste e afirmava coisas sobre a cópia — inclusive que uma atividade
// com 2 passos e 1 feito valia 50%, que é justamente o defeito (BUG-2). Ou seja:
// o teste ficava verde descrevendo o bug, enquanto o hook de verdade não era
// exercitado por linha nenhuma. É o footgun 9 do CLAUDE.md dentro do teste, o
// mesmo formato que `simulateReset` já tinha criado em `useDailyReset.test.ts`.
//
// Agora renderiza O HOOK. Nada aqui reimplementa regra: o denominador vem de
// `dailyGoalFor` (dono da meta do dia), como no app.
// ===========================================================================

const QUARTA = new Date('2026-08-12T12:00:00'); // quarta-feira
const SABADO = new Date('2026-08-15T12:00:00'); // sábado
const TODO_DIA = [0, 1, 2, 3, 4, 5, 6];
const SEG_A_SEX = [1, 2, 3, 4, 5];

type Passo = { id: string; label: string; completed: boolean };

function ativ(
  id: string,
  opts: { weekDays?: number[]; feita?: boolean; passos?: boolean[]; categoria?: keyof typeof CATEGORY_ATTRIBUTES } = {},
) {
  const passos: Passo[] = (opts.passos ?? []).map((c, i) => ({ id: `${id}-${i}`, label: `p${i}`, completed: c }));
  return {
    id,
    category: (opts.categoria ?? 'Health') as any,
    steps: passos,
    weekDays: opts.weekDays ?? TODO_DIA,
    completedToday: !!opts.feita,
    lastCompletedDate: opts.feita ? new Date().toDateString() : undefined,
  };
}

function estado(over: Partial<Parameters<typeof useProgressTracking>[0]> = {}) {
  return {
    evolutionStage: 'mega-harmony',
    activities: [],
    tasks: [],
    completedTasks: [],
    ...over,
  } as Parameters<typeof useProgressTracking>[0];
}

function ver(state: Parameters<typeof useProgressTracking>[0]) {
  return renderHook(() => useProgressTracking(state)).result.current;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(QUARTA);
});
afterEach(() => {
  vi.useRealTimers();
});

// ---------------------------------------------------------------------------
// BUG-1 — o número que aparece na tela de bloqueio do celular
// ---------------------------------------------------------------------------
describe('o widget mostra a META DO DIA, não o cadastro inteiro', () => {
  // Jogador mega: requisito 6. Ele cadastrou 9 coisas para hoje porque
  // cadastrar muito é comportamento saudável e a regra que COBRA já perdoa
  // (`min(cadastradas, requisito)`).
  const noveCadastradas = (feitas: number) =>
    estado({
      activities: Array.from({ length: 9 }, (_, i) => ativ(`a${i}`, { feita: i < feitas })),
    });

  it('mega com 9 cadastradas que fez 6 vê 6/6 — e não "6/9" com "quase lá" o dia inteiro', () => {
    const r = ver(noveCadastradas(6));
    expect(r.dailyTotal).toBe(6);
    expect(r.dailyDone).toBe(6);
    expect(r.progress).toBe(100); // o widget lê ratio 1 → "dia perfeito", não "💪 quase lá"
  });

  it('quem passou da meta não vira "8/6": o excedente não é dívida nem sobra', () => {
    const r = ver(noveCadastradas(8));
    expect(r.dailyDone).toBe(6);
    expect(r.dailyTotal).toBe(6);
  });

  it('AUTOVERIFICAÇÃO: o denominador não virou uma constante 6 — meta pequena continua pequena', () => {
    // Sem este caso, um `dailyTotal = 6` fixo passaria nos dois testes acima.
    const r = ver(estado({ activities: [ativ('unica')] }));
    expect(r.dailyTotal).toBe(1);
  });

  it('sábado de quem só cadastrou seg–sex: a tela não cobra um dia que o jogo não cobra', () => {
    vi.setSystemTime(SABADO);
    const r = ver(
      estado({
        activities: [
          ativ('academia', { weekDays: SEG_A_SEX }),
          ativ('estudo', { weekDays: SEG_A_SEX }),
          ativ('remedio', { weekDays: TODO_DIA, feita: true }),
        ],
      }),
    );
    expect(r.dailyTotal).toBe(1);
    expect(r.dailyDone).toBe(1);
    expect(r.progress).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// BUG-2 — o humor do pet punia quem quebra tarefa em passos
// ---------------------------------------------------------------------------
describe('quebrar a tarefa em passos não deixa o pet triste por mais tempo', () => {
  // `getCompanionMood` (App.tsx) usa `tired` em progress <= 15 e `happy` em
  // >= 60; por isso o número abaixo é humor, não enfeite.
  const mega = (comPassos: boolean) =>
    estado({
      activities: [
        ativ('a1', { feita: true }),
        ativ('a2', { feita: true }),
        ativ('a3', { feita: true }),
        // A sexta atividade é a mesma coisa nos dois saves; só muda se o
        // jogador a escreveu em 5 passos ou como um item só.
        comPassos ? ativ('a4', { passos: [false, false, false, false, false] }) : ativ('a4'),
      ],
    });

  it('mesmo progresso com e sem passos: o app para de punir a técnica que ele oferece', () => {
    expect(ver(mega(true)).progress).toBe(ver(mega(false)).progress);
    expect(ver(mega(true)).progress).toBe(75); // 3 de 4 itens
  });

  it('atividade em passos só conta quando TODOS os passos fecham', () => {
    const meio = estado({ activities: [ativ('a', { passos: [true, true, false] })] });
    const tudo = estado({ activities: [ativ('a', { passos: [true, true, true] })] });
    expect(ver(meio).progress).toBe(0);   // antes marcava 67% "de graça"
    expect(ver(tudo).progress).toBe(100);
  });

  it('início do dia: quem quebrou em passos não começa mais fundo no vermelho', () => {
    const semPassos = estado({ activities: [ativ('a1'), ativ('a2')] });
    const comPassos = estado({ activities: [ativ('a1', { passos: [false, false, false, false, false] }), ativ('a2')] });
    expect(ver(comPassos).progress).toBe(ver(semPassos).progress);
  });

  it('AUTOVERIFICAÇÃO: progress realmente se move (não é sempre o mesmo número)', () => {
    const nenhuma = estado({ activities: [ativ('a1'), ativ('a2')] });
    const uma = estado({ activities: [ativ('a1', { feita: true }), ativ('a2')] });
    expect(ver(nenhuma).progress).toBe(0);
    expect(ver(uma).progress).toBe(50);
  });

  it('progress nunca passa de 100 nem fica negativo', () => {
    const demais = estado({ activities: Array.from({ length: 9 }, (_, i) => ativ(`a${i}`, { feita: true })) });
    expect(ver(demais).progress).toBe(100);
    expect(ver(estado()).progress).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// BUG-5 — a segunda definição de "dia perfeito" não pode voltar
// ---------------------------------------------------------------------------
describe('o hook não responde "o dia foi perfeito?"', () => {
  it('não existe `isDayPerfect` aqui — a resposta é `lastDayReport.wasPerfect`', () => {
    // A definição que morava aqui exigia `dailyDone === dailyTotal` (fazer TUDO
    // o que estava cadastrado), enquanto a regra viva exige a META. Duas
    // definições da mesma regra divergem em silêncio; esta ficou anos sem
    // consumidor, pronta para o primeiro dev que precisasse do dado na UI.
    expect(Object.keys(ver(estado()))).not.toContain('isDayPerfect');
  });
});

// ---------------------------------------------------------------------------
// Atributos do dia (sem regressão)
// ---------------------------------------------------------------------------
describe('useProgressTracking — todayAttributes', () => {
  it('sem atividades, nenhum atributo', () => {
    expect(ver(estado()).todayAttributes).toEqual({ power: 0, harmony: 0, benevolence: 0 });
  });

  it('acumula os atributos das atividades concluídas', () => {
    const r = ver(estado({ activities: [ativ('a', { passos: [true], categoria: 'Health' })] }));
    expect(r.todayAttributes).toEqual(CATEGORY_ATTRIBUTES['Health']);
  });

  it('atividade incompleta não rende atributo', () => {
    const r = ver(estado({ activities: [ativ('a', { passos: [false], categoria: 'Study' })] }));
    expect(r.todayAttributes).toEqual({ power: 0, harmony: 0, benevolence: 0 });
  });

  it('soma atributos de categorias diferentes', () => {
    const r = ver(
      estado({
        activities: [
          ativ('a', { passos: [true], categoria: 'Health' }),
          ativ('b', { passos: [true], categoria: 'Study' }),
        ],
      }),
    );
    expect(r.todayAttributes.power).toBe(CATEGORY_ATTRIBUTES.Health.power + CATEGORY_ATTRIBUTES.Study.power);
    expect(r.todayAttributes.harmony).toBe(CATEGORY_ATTRIBUTES.Health.harmony + CATEGORY_ATTRIBUTES.Study.harmony);
    expect(r.todayAttributes.benevolence).toBe(CATEGORY_ATTRIBUTES.Health.benevolence + CATEGORY_ATTRIBUTES.Study.benevolence);
  });
});
