import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  computeDailyReset, dailyGoalFor, registeredForDay, tasksCompletedOn, tasksToAvoidHeartLoss,
} from './dailyReset';
import { completeTask } from './careRules';

// ===========================================================================
// REGRESSÃO — duas regras que liam uma FONTE que outra regra esvazia/contradiz.
// Achados da rodada 5, ambos da mesma classe do 🔴 da rodada 4.
// ===========================================================================

const ONTEM = new Date('2026-08-13T12:00:00');
const VIRADA = new Date('2026-08-14T04:00:00');
const ontemStr = ONTEM.toDateString();

const base = {
  evolutionStage: 'rookie',
  maxHealthPoints: 3,
  healthPoints: 3,
  perfectDays: 0,
  energyPoints: 4, // cheia para rookie (requisito 4)
  unlockedEvolutions: [] as string[],
  currentBranch: 'data',
  maxActivityCap: 6,
  lastResetDate: ontemStr,
  activities: [] as any[],
  tasks: [] as any[],
  completedTasks: [] as any[],
  activityLog: [] as string[],
};

// ---------------------------------------------------------------------------
// 🔴 Quem faz TUDO por tarefa avulsa nunca ganhava um dia perfeito
// ---------------------------------------------------------------------------
describe('a virada enxerga a tarefa que `completeTask` tirou da lista', () => {
  it('AUTOVERIFICAÇÃO do mecanismo: `completeTask` REMOVE a tarefa de `tasks`', () => {
    // Este caso é o que dá sentido a todos os outros. Se um dia `completeTask`
    // passar a manter a tarefa na lista, a premissa some e o teste avisa.
    const antes = {
      tasks: [{ id: 't1', name: 'ler', category: 'study', emoji: '📚', completed: true }],
      completedTasks: [] as any[],
      activityStats: {},
      foodInventory: {},
    };
    const depois = completeTask(antes as any, 't1', ONTEM)!;
    expect(depois.tasks).toHaveLength(0);          // saiu da lista
    expect(depois.completedTasks).toHaveLength(1); // foi para o histórico
    expect(tasksCompletedOn(depois as any, ontemStr)).toBe(1);
  });

  it('3 tarefas criadas e concluídas ontem = 3 cadastradas e 3 feitas', () => {
    const save = {
      ...base,
      completedTasks: [1, 2, 3].map(i => ({ id: `t${i}`, completedAt: ONTEM.toISOString() })),
    };
    expect(registeredForDay(save, ONTEM.getDay(), ontemStr)).toBe(3);
    expect(dailyGoalFor(save, ONTEM.getDay(), ontemStr)).toBe(3);
  });

  it('e a virada concede o DIA PERFEITO (antes travava a evolução em silêncio)', () => {
    const save = {
      ...base,
      completedTasks: [1, 2, 3].map(i => ({ id: `t${i}`, completedAt: ONTEM.toISOString() })),
    };
    const depois: any = computeDailyReset(save as any, { now: VIRADA });
    // Antes: totalTasks === 0 → `dayWasPerfect` falso → perfectDays parado em 0
    // para sempre. `perfectDays` é o ÚNICO caminho para evoluir, e a tela
    // mostrava o dia em 100%.
    expect(depois.perfectDays).toBe(1);
    expect(depois.healthPoints).toBe(3);
  });

  it('CONTROLE NEGATIVO: não fazer nada continua custando um coração', () => {
    // Sem este caso, a correção acima poderia ter virado "todo dia é perfeito".
    const save = { ...base, tasks: [1, 2, 3].map(i => ({ id: `t${i}`, completed: false })) };
    const depois: any = computeDailyReset(save as any, { now: VIRADA });
    expect(depois.perfectDays).toBe(0);
    expect(depois.healthPoints).toBe(2);
  });

  it('CONTROLE NEGATIVO: tarefa concluída em OUTRO dia não conta no dia de ontem', () => {
    const anteontem = new Date('2026-08-12T12:00:00');
    const save = {
      ...base,
      completedTasks: [1, 2, 3].map(i => ({ id: `t${i}`, completedAt: anteontem.toISOString() })),
    };
    expect(tasksCompletedOn(save, ontemStr)).toBe(0);
    const depois: any = computeDailyReset(save as any, { now: VIRADA });
    expect(depois.perfectDays).toBe(0); // nada cadastrado para ontem
  });

  it('`completedAt` inválido não vira NaN nem conta', () => {
    const save = { ...base, completedTasks: [{ id: 'x', completedAt: 'lixo' }, { id: 'y' }] };
    expect(tasksCompletedOn(save as any, ontemStr)).toBe(0);
    expect(() => computeDailyReset(save as any, { now: VIRADA })).not.toThrow();
  });

  it('caso misto: atividade do dia + tarefas feitas somam na mesma meta', () => {
    const save = {
      ...base,
      activities: [{ id: 'a1', weekDays: [ONTEM.getDay()], steps: [], completedToday: true, lastCompletedDate: ontemStr }],
      completedTasks: [{ id: 't1', completedAt: ONTEM.toISOString() }],
    };
    expect(registeredForDay(save, ONTEM.getDay(), ontemStr)).toBe(2);
    const depois: any = computeDailyReset(save as any, { now: VIRADA });
    expect(depois.perfectDays).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 🟠 "complete metade" era uma promessa falsa — no pior momento do jogo
// ---------------------------------------------------------------------------
describe('o número que o banner de 1 coração promete é o número que salva', () => {
  const rookie4 = { ...base, tasks: [1, 2, 3, 4].map(i => ({ id: `t${i}`, completed: false })) };
  const HOJE = ONTEM.getDay();

  it('rookie com meta 4 e 3 corações: são 3 itens, não 2', () => {
    expect(dailyGoalFor(rookie4, HOJE)).toBe(4);
    expect(Math.ceil(4 / 2)).toBe(2);                    // o que o banner dizia
    expect(tasksToAvoidHeartLoss(rookie4, HOJE)).toBe(3); // o que a regra exige
  });

  it('PROVA pela própria virada: com 2 de 4 o coração CAI mesmo assim', () => {
    const comDuas = {
      ...rookie4,
      healthPoints: 1,
      tasks: [1, 2, 3, 4].map(i => ({ id: `t${i}`, completed: i <= 2 })),
    };
    const depois: any = computeDailyReset(comDuas as any, { now: VIRADA });
    // A TESE deste caso — com 2 de 4 o coração cai mesmo assim, e era isso que
    // o banner prometia evitar — continua sendo esta linha:
    expect(depois.lastDayReport.heartsLost).toBe(1);

    // As duas linhas abaixo mudaram junto com a regra, e o caso ficou MAIS
    // apertado, não mais frouxo. Antes afirmavam `degeneratedByHP === true` e
    // HP de volta a 3: o rookie "degenerava" para si mesmo (é a raiz da
    // árvore, `getPreviousForm` devolve o próprio estágio) e ganhava HP cheio
    // + `perfectDays = 2` de brinde. Medido na época: quem NÃO fazia nada
    // terminava melhor que quem fazia tudo.
    // Agora, na raiz, não há degeneração nenhuma — só um coração de volta,
    // para o jogador não ficar preso em HP 0.
    expect(depois.degeneratedByHP).toBe(false);
    expect(depois.healthPoints).toBe(1);
    expect(depois.perfectDays).toBe(comDuas.perfectDays ?? 0);
  });

  it('e com 3 de 4 o coração NÃO cai — o número novo é o número certo', () => {
    const comTres = {
      ...rookie4,
      healthPoints: 1,
      tasks: [1, 2, 3, 4].map(i => ({ id: `t${i}`, completed: i <= 3 })),
    };
    const depois: any = computeDailyReset(comTres as any, { now: VIRADA });
    expect(depois.lastDayReport.heartsLost).toBe(0);
    expect(depois.degeneratedByHP).toBeFalsy();
  });

  it('a fórmula bate com a virada em TODA combinação de estágio e meta', () => {
    // Guard diferencial: em vez de confiar na aritmética, roda a virada de
    // verdade para cada (maxHP, meta, feitas) e exige que `tasksToAvoidHeartLoss`
    // seja exatamente o menor `feitas` sem perda.
    for (const [stage, maxHP] of [['rookie', 3], ['mega', 4], ['ultra', 5]] as const) {
      for (const cadastradas of [1, 2, 3, 4, 5, 6]) {
        const st = {
          ...base, evolutionStage: stage, maxHealthPoints: maxHP, healthPoints: maxHP,
          energyPoints: 9, tasks: Array.from({ length: cadastradas }, (_, i) => ({ id: `t${i}`, completed: false })),
        };
        const meta = dailyGoalFor(st, HOJE);
        const previsto = tasksToAvoidHeartLoss(st, HOJE);
        const semPerda = [...Array(cadastradas + 1).keys()].filter(feitas => {
          const s = { ...st, tasks: st.tasks.map((t, i) => ({ ...t, completed: i < feitas })) };
          return (computeDailyReset(s as any, { now: VIRADA }) as any).lastDayReport.heartsLost === 0;
        });
        expect(previsto, `${stage}/${cadastradas} (meta ${meta})`).toBe(semPerda[0]);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// ORIGEM — a promessa falsa não pode voltar por outro arquivo
// ---------------------------------------------------------------------------
describe('guard de origem — ninguém volta a dividir o requisito por 2 na UI', () => {
  const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  const meio = /Math\.ceil\([\s\S]{0,150}?required\s*\/\s*2\s*\)/;

  it('AUTOVERIFICAÇÃO: o guard reconhece a forma antiga', () => {
    expect(meio.test('Math.ceil(FORM_REQUIREMENTS[getStageLevel(s)].required / 2)')).toBe(true);
    expect(meio.test('tasksToAvoidHeartLoss(gameState, hoje)')).toBe(false);
  });

  it('App.tsx não promete "metade das tarefas" em lugar nenhum', () => {
    expect(app.match(meio)?.[0] ?? 'limpo').toBe('limpo');
  });
});
