import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dailyGoalFor, registeredForDay, computeDailyReset } from './dailyReset';
import { FORM_REQUIREMENTS, getStageLevel } from '../types/progression';

// ===========================================================================
// GUARD DE DUPLICAÇÃO DE REGRA — "meta do dia" (`min(cadastradas, requisito)`)
//
// Dono declarado: `dailyGoalFor` (src/utils/dailyReset.ts).
//
// Este guard existe porque a regra tem DUAS partes e a segunda já divergiu:
//   (a) o TETO   = FORM_REQUIREMENTS[nível].required
//   (b) a FONTE  = atividades DO DIA DA SEMANA + tarefas
//
// O bug histórico ("notificações cobravam quem já tinha cumprido a meta",
// STATUS §2) foi corrigido só em (a). As cópias em App.tsx continuaram lendo
// `activities.length` cru — a MESMA conta a partir de uma FONTE DE DADOS
// DIFERENTE, que é exatamente a assinatura do 🔴 da rodada 4 (galho previsto ≠
// entregue) e a classe que o footgun 9 do CLAUDE.md descreve.
//
// O guard tem TRÊS camadas, de propósito:
//   1. DIFERENCIAL — prova, com números, que as duas fontes divergem. Sem isso
//      o guard de origem estaria proibindo uma forma sem provar que ela é ruim.
//   2. ACOPLAMENTO — prova que `computeDailyReset` e `dailyGoalFor` respondem o
//      MESMO número sobre o mesmo estado (é o que impede a meta anunciada de
//      divergir da meta cobrada).
//   3. ORIGEM — prova que nenhum call site reescreve a fórmula.
// Cada camada tem AUTOVERIFICAÇÃO: uma duplicação SINTÉTICA que deixa o guard
// vermelho. Sem isso um guard passa para sempre pelo motivo errado (STATUS §5).
// ===========================================================================

type Ativ = { id: string; weekDays: number[]; steps: never[]; completedToday?: boolean; lastCompletedDate?: string };

const SEG_A_SEX = [1, 2, 3, 4, 5];
const TODO_DIA = [0, 1, 2, 3, 4, 5, 6];

function ativ(id: string, weekDays: number[], feita = false, dia?: string): Ativ {
  return { id, weekDays, steps: [], completedToday: feita, lastCompletedDate: dia };
}

/** A FORMA DEFEITUOSA, escrita aqui de propósito: a cópia que existia em
 *  App.tsx. É o "duplicado sintético" que dá as duas pontas ao guard. */
function metaDuplicadaComFonteErrada(state: { evolutionStage: string; activities: unknown[]; tasks: unknown[] }): number {
  return Math.min(
    state.activities.length + state.tasks.length,
    FORM_REQUIREMENTS[getStageLevel(state.evolutionStage)].required,
  );
}

// ---------------------------------------------------------------------------
// 1. DIFERENCIAL — as duas fontes NÃO dão o mesmo número
// ---------------------------------------------------------------------------
describe('a duplicação não era cosmética: as duas fontes divergem', () => {
  // Jogador rookie (requisito 4) com rotina de semana: 3 atividades seg–sex e
  // 1 atividade de todo dia. Nenhuma tarefa avulsa.
  const save = {
    evolutionStage: 'rookie',
    activities: [
      ativ('academia', SEG_A_SEX),
      ativ('estudo', SEG_A_SEX),
      ativ('trabalho', SEG_A_SEX),
      ativ('remedio', TODO_DIA),
    ],
    tasks: [] as unknown[],
  };

  const SABADO = 6;
  const QUARTA = 3;

  it('no SÁBADO a cópia cobra o dobro da meta real', () => {
    expect(registeredForDay(save, SABADO)).toBe(1);   // só o remédio vale no sábado
    expect(dailyGoalFor(save, SABADO)).toBe(1);       // meta real
    expect(metaDuplicadaComFonteErrada(save)).toBe(4); // o que a cópia dizia
  });

  it('numa QUARTA as duas concordam — por isso o defeito era invisível no dia a dia', () => {
    expect(dailyGoalFor(save, QUARTA)).toBe(4);
    expect(metaDuplicadaComFonteErrada(save)).toBe(4);
  });

  it('AUTOVERIFICAÇÃO: o instrumento enxerga a diferença (não é sempre igual)', () => {
    const iguais = [0, 1, 2, 3, 4, 5, 6].map(d => dailyGoalFor(save, d) === metaDuplicadaComFonteErrada(save));
    expect(iguais).toContain(false); // divergiu em algum dia
    expect(iguais).toContain(true);  // e concordou em outro — logo, não é um teste trivial
  });
});

// ---------------------------------------------------------------------------
// 2. ACOPLAMENTO — a meta ANUNCIADA é a meta COBRADA
// ---------------------------------------------------------------------------
describe('a meta que a UI anuncia é a que a virada do dia cobra', () => {
  // Sábado 15/08/2026 → a virada de domingo cobra o dia de SÁBADO (weekDay 6).
  const DOMINGO_DE_MADRUGADA = new Date('2026-08-16T04:00:00');
  const SABADO = 6;
  const sabadoStr = new Date('2026-08-15T12:00:00').toDateString();

  const save = {
    evolutionStage: 'rookie',
    maxHealthPoints: 3,
    healthPoints: 3,
    perfectDays: 0,
    energyPoints: 4,
    unlockedEvolutions: [] as string[],
    currentBranch: 'data',
    maxActivityCap: 6,
    lastResetDate: sabadoStr,
    activities: [
      ativ('academia', SEG_A_SEX),
      ativ('estudo', SEG_A_SEX),
      ativ('trabalho', SEG_A_SEX),
      ativ('remedio', TODO_DIA, true, sabadoStr), // a ÚNICA do sábado, e foi feita
    ],
    tasks: [] as unknown[],
    completedTasks: [] as unknown[],
    activityLog: [] as string[],
    // Save VETERANO: sem isto o estado cai na carência de começo de vida
    // (`NEW_SAVE_GRACE_DAYS`, utils/dailyReset.ts), que não cobra HP nas
    // primeiras viradas — e a autoverificação abaixo mediria a carência.
    lastDayReport: { date: 'seed', saveDay: 90 },
  };

  it('cumpriu a meta do sábado → a virada NÃO tira coração', () => {
    expect(dailyGoalFor(save, SABADO)).toBe(1);
    const depois = computeDailyReset(save as any, { now: DOMINGO_DE_MADRUGADA });
    expect(depois.healthPoints).toBe(3); // nada cobrado
  });

  it('e mesmo assim a fórmula duplicada anunciaria 1/4 — o dano é a cobrança falsa', () => {
    // `completedSteps` das notificações seria 1 e `totalRequired` seria 4:
    // três avisos por dia dizendo que faltam tarefas para quem não deve nada.
    expect(metaDuplicadaComFonteErrada(save)).toBeGreaterThan(dailyGoalFor(save, SABADO));
  });

  it('AUTOVERIFICAÇÃO: com a meta NÃO cumprida a virada realmente cobra', () => {
    // Sem este caso, o teste acima passaria com um computeDailyReset que nunca
    // tira coração nenhum.
    const naoFez = { ...save, activities: save.activities.map(a => ativ(a.id, a.weekDays)) };
    const depois = computeDailyReset(naoFez as any, { now: DOMINGO_DE_MADRUGADA });
    expect(depois.healthPoints).toBeLessThan(3);
  });
});

// ---------------------------------------------------------------------------
// 2b. O MODAL DE EVOLUÇÃO conta o que existe HOJE
// ---------------------------------------------------------------------------
describe('"você já tem tarefas suficientes" é sobre HOJE, não sobre o cadastro inteiro', () => {
  // Jogador que acabou de virar mega (requisito 6) e abre o app num SÁBADO.
  // Ele tem 6 atividades — todas de seg–sex — e nenhuma tarefa para hoje.
  const SABADO = 6;
  const QUARTA = 3;
  const save = {
    evolutionStage: 'mega-data',
    activities: Array.from({ length: 6 }, (_, i) => ativ(`a${i}`, SEG_A_SEX)),
    tasks: [] as unknown[],
  };

  it('no sábado o modal vê 0 cadastradas e convida a criar — não diz que já basta', () => {
    expect(registeredForDay(save, SABADO)).toBe(0);
    // A fonte crua diria 6 e o modal se calaria num dia em que não há nada.
    expect(save.activities.length + save.tasks.length).toBe(6);
  });

  it('AUTOVERIFICAÇÃO: numa quarta ele realmente vê as 6 (o filtro não zera tudo)', () => {
    expect(registeredForDay(save, QUARTA)).toBe(6);
  });

  it('tarefa avulsa JÁ CONCLUÍDA hoje continua contando como cadastrada', () => {
    // `completeTask` tira a tarefa de `tasks`; sem `tasksCompletedOn` o dia em
    // que a pessoa fez tudo ficaria idêntico ao dia em que não cadastrou nada.
    const hoje = new Date('2026-08-15T12:00:00').toDateString();
    const comFeita = { ...save, completedTasks: [{ completedAt: '2026-08-15T09:00:00' }] };
    expect(registeredForDay(comFeita as any, SABADO, hoje)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 3. ORIGEM — nenhum call site reescreve a fórmula
// ---------------------------------------------------------------------------
/** Guard que lê comentário é guard que se auto-satisfaz: o comentário que
 *  EXPLICA a forma proibida seria acusado como se fosse a forma proibida. */
function semComentarios(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

describe('guard de origem — a fórmula da meta só existe no dono', () => {
  const DONO = resolve(__dirname, 'dailyReset.ts');
  const VARRIDOS = [
    resolve(__dirname, '../App.tsx'),
    resolve(__dirname, '../hooks/useProgressTracking.ts'),
    resolve(__dirname, '../components/NotificationManager.tsx'),
    resolve(__dirname, '../contexts/GameStateContext.tsx'),
  ];

  // A forma proibida: um `Math.min(...)` cujo teto é o requisito do estágio.
  // Casa em várias linhas porque a cópia do App.tsx era formatada em três.
  const formaDuplicada = /Math\.min\(\s*[^;]{0,200}?FORM_REQUIREMENTS\[[^\]]*\]\.required/s;

  it('AUTOVERIFICAÇÃO: o guard reconhece a duplicação quando ela existe', () => {
    // Duplicação sintética nas três formatações que já apareceram no projeto.
    const umaLinha = 'const goal = Math.min(registered, FORM_REQUIREMENTS[getStageLevel(s.evolutionStage)].required);';
    const multilinha = [
      'totalRequired={Math.min(',
      '  gameState.activities.length + gameState.tasks.length,',
      '  FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required,',
      ')}',
    ].join('\n');
    const viaVariavel = 'const req = FORM_REQUIREMENTS[lvl].required;\nconst goal = Math.min(reg, req);';

    expect(formaDuplicada.test(umaLinha)).toBe(true);
    expect(formaDuplicada.test(multilinha)).toBe(true);
    // A forma correta NÃO é acusada (senão o guard seria um falso positivo
    // permanente e alguém acabaria afrouxando ele):
    expect(formaDuplicada.test('const goal = dailyGoalFor(prev, new Date().getDay());')).toBe(false);
    // LIMITE HONESTO DECLARADO: a forma `via variável intermediária` escapa da
    // regex. O guard não é uma prova; é uma rede. A camada 2 (acoplamento) é o
    // que pega a divergência de RESULTADO independentemente da formatação.
    expect(formaDuplicada.test(viaVariavel)).toBe(false);
  });

  it('AUTOVERIFICAÇÃO: o stripper de comentário não come código', () => {
    expect(semComentarios('const a = 1; // Math.min(x, FORM_REQUIREMENTS[l].required)'))
      .not.toMatch(formaDuplicada);
    expect(semComentarios('const a = Math.min(x, FORM_REQUIREMENTS[l].required);'))
      .toMatch(formaDuplicada);
    expect(semComentarios("const url = 'https://x/y'; const n = 2;")).toContain('https://x/y');
  });

  it('nenhum arquivo varrido reescreve a fórmula', () => {
    for (const arquivo of VARRIDOS) {
      const src = semComentarios(readFileSync(arquivo, 'utf8'));
      expect(`${arquivo}: ${src.match(formaDuplicada)?.[0] ?? 'limpo'}`).toBe(`${arquivo}: limpo`);
    }
  });

  it('o dono continua sendo o único a escrever a fórmula', () => {
    // Se alguém apagar a fórmula do dono, o guard acima passaria vazio — e o
    // guard inteiro viraria decoração.
    expect(semComentarios(readFileSync(DONO, 'utf8'))).toMatch(formaDuplicada);
  });

  it('quem calcula "cadastradas" no App.tsx passa pelo dono', () => {
    const app = semComentarios(readFileSync(resolve(__dirname, '../App.tsx'), 'utf8'));
    // `activities.length + tasks.length` é a FONTE ERRADA para "cadastradas do
    // dia" (ignora o dia da semana E as tarefas já concluídas, que `completeTask`
    // tira da lista). O ÚLTIMO sobrevivente era `registeredTasks` do
    // EvolveTaskModal — que perguntava "cadastro total" onde o jogador lia
    // "o que tenho para hoje", e por isso dizia "você já tem tarefas
    // suficientes" num sábado vazio para quem só cadastrou coisa de seg–sex.
    // Agora ele chama `registeredForDay`. A lista fica VAZIA e travada: qualquer
    // reintrodução da fonte crua deixa este guard vermelho.
    const usos = app.match(/activities\.length\s*\+\s*[a-zA-Z.]*tasks\.length/g) ?? [];
    expect(usos).toEqual([]);
  });

  it('AUTOVERIFICAÇÃO: o guard de "cadastradas" enxerga a fonte crua se ela voltar', () => {
    // Sem isto, o `toEqual([])` acima passaria para sempre inclusive se a regex
    // tivesse sido quebrada por alguém — um guard verde pelo motivo errado.
    const reintroduzido = 'registeredTasks={gameState.activities.length + gameState.tasks.length}';
    const usos = reintroduzido.match(/activities\.length\s*\+\s*[a-zA-Z.]*tasks\.length/g) ?? [];
    expect(usos).toEqual(['activities.length + gameState.tasks.length']);
  });

  it('o hook de progresso pergunta a meta ao dono, e não ao cadastro cru', () => {
    // BUG-1/BUG-2: o denominador que vai para o widget Android e para o humor
    // do pet era o cadastro inteiro. O guard de forma (regex de `Math.min`) não
    // pegava, porque o hook não reescrevia a fórmula — ele escrevia OUTRA coisa.
    const hook = semComentarios(
      readFileSync(resolve(__dirname, '../hooks/useProgressTracking.ts'), 'utf8'),
    );
    expect(hook).toContain('dailyGoalFor(');
    // E a soma crua não pode voltar como denominador exibido.
    expect(hook).not.toMatch(/availableActivities\.length\s*\+/);
  });
});
