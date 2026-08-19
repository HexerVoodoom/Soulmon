/**
 * O MOTOR DE EXECUÇÃO DAS TAREFAS PONTUAIS
 * ========================================
 *
 * Aqui mora o contrato de EXECUÇÃO do `types/taskModel.ts` (o de CONSTÂNCIA, dos
 * hábitos, vive em outro lugar). Tudo neste arquivo existe para atacar um único
 * problema, e vale escrever o diagnóstico por extenso porque ele é o que
 * justifica cada linha:
 *
 *   **A pilha de tarefas atrasadas é a causa nº1 documentada de abandono da
 *   categoria.** E o padrão de uso dominante do mercado inteiro não é uso
 *   estável — é a FALÊNCIA PERIÓDICA: o usuário deixa acumular, a lista vira um
 *   monumento de culpa vermelho, ele apaga tudo e recomeça do zero. Todo
 *   histórico, todo contexto e toda prova de que ele já fez alguma coisa vão
 *   junto. Depois de duas ou três falências, ele apaga o app também.
 *
 * As funções abaixo existem para IMPEDIR isso. Não escondendo a pilha (o
 * Todoist esconde e ela volta maior), não pintando-a de vermelho e cobrando (o
 * Habitica cobra e as pessoas relatam administrar o app em vez dos hábitos),
 * mas dando à tarefa velha quatro saídas que hoje ela não tem:
 *
 *   1. `someday`  — o Someday do Things 3: uma lista deliberadamente INERTE.
 *                   Não conta na meta, não envelhece, não assombra. Permissão
 *                   formal para não fazer nada.
 *   2. `dropped`  — o Won't Do do TickTick: estado terminal COM volta atrás.
 *                   Não é deletar (perde o contexto) nem concluir (é mentira).
 *   3. `shrink`   — encolher: a tarefa difícil demais vira menor, em vez de
 *                   ficar para sempre.
 *   4. `triageQueue` — o Smart Schedule do Todoist com ergonomia de jogo:
 *                   200 itens vermelhos viram uma decisão de um clique.
 *
 * E o aging (`isHaunted`) é a peça mais Soulmon do plano: em vez de esconder ou
 * culpar, a tarefa parada fica ASSOMBRADA e concluí-la dá bônus de alívio. A
 * pilha de culpa vira um loop de jogo com recompensa própria.
 *
 * Estilo: funções PURAS, como `careRules.ts` e `dailyReset.ts`. Sem React, sem
 * localStorage, `now: Date` SEMPRE por parâmetro (senão o teste não consegue
 * viajar no tempo e a regra vira não-testável — que é como regras divergem em
 * silêncio, footgun 9 do CLAUDE.md). Genéricas em `<T extends TriageTask>` pelo
 * mesmo motivo de `completeTask`: quem chama passa a `Task` inteira do
 * `GameStateContext` e recebe a `Task` inteira de volta, sem perder campo.
 */

import {
  Effort,
  normalizeEffort,
  TaskStatus,
  POSTPONE_NUDGE_AT,
  HAUNTED_AFTER_DAYS,
  MAX_DAILY_FOCUS,
  OVERCOMMIT_EFFORT,
  HABIT_WEIGHT,
  type Schedule,
} from '../types/taskModel';
import { habitCountsOn } from './habitRhythm';
import type { HabitRhythm } from './habitRhythm';

// Reexportado de propósito: quem consome o motor de tarefas não deveria ter que
// importar de dois módulos para somar a carga de um dia. `taskModel` continua
// sendo o DONO da constante — isto é só a porta.
export { HABIT_WEIGHT, MAX_DAILY_FOCUS, OVERCOMMIT_EFFORT, POSTPONE_NUDGE_AT, HAUNTED_AFTER_DAYS };

/** Peso de um hábito na meta do dia. Ver `HABIT_WEIGHT` em `types/taskModel.ts`. */
export function habitWeight(): number {
  return HABIT_WEIGHT;
}

/**
 * A fatia da `Task` (src/contexts/GameStateContext.tsx) que este motor lê.
 *
 * TODOS os campos novos são opcionais, e isso não é frouxidão de tipagem: é o
 * requisito. Nenhum save existente tem `effort`, `status`, `createdAt` ou
 * `postponedCount`, e um save antigo que quebra ao abrir é pior que qualquer
 * funcionalidade que este arquivo entrega. Cada função abaixo declara o padrão
 * que aplica quando o campo não existe.
 */
export interface TriageTask {
  id: string;
  name?: string;
  completed?: boolean;
  /** `{ date: 'YYYY-MM-DD', time: 'HH:MM' }` — o formato dos `<input>` do app. */
  deadline?: { date: string; time: string };
  effort?: Effort;
  status?: TaskStatus;
  /** Quando pretendo COMEÇAR (o "When" do Things 3), não quando vence. */
  startDate?: string;
  postponedCount?: number;
  createdAt?: string;
  lastTouchedAt?: string;
  /** Dia em que a tarefa foi escolhida como foco. */
  focusDate?: string;
}

const DAY_MS = 86400000;

/** Data válida ou `null` — string vazia e lixo de save antigo caem aqui. */
function parseDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * A chave de dia do projeto é `new Date().toDateString()`, mas `startDate` e
 * `focusDate` podem ter sido gravados como ISO ou como 'YYYY-MM-DD' (é o valor
 * cru de um `<input type="date">`). Comparar string com string quebraria em
 * silêncio para metade dos casos, então normaliza-se os dois lados.
 */
/**
 * Exportada porque `utils/rituals.ts` tinha uma cópia byte-a-byte disto (junto
 * com `parseDayValue`). Duas normalizações de data idênticas em dois módulos que
 * comparam os MESMOS campos (`startDate`/`focusDate`) é o footgun 9 esperando a
 * primeira correção que só chegue num dos lados.
 */
export function sameDay(value: string | undefined, dayKey: string): boolean {
  if (!value) return false;
  if (value === dayKey) return true;
  const a = parseDayValue(value);
  const b = parseDayValue(dayKey);
  return !!a && !!b && a.toDateString() === b.toDateString();
}

/** 'YYYY-MM-DD' é lido como UTC pelo `Date` — vira o dia anterior em fuso negativo. */
export function parseDayValue(value: string): Date | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  return parseDate(value);
}

/** O instante em que a tarefa vence, ou `null` se ela não tem prazo. */
export function deadlineAt(task: TriageTask): Date | null {
  const d = task.deadline;
  if (!d?.date) return null;
  const day = parseDayValue(d.date);
  if (!day) return null;
  const [h, m] = (d.time || '23:59').split(':').map(Number);
  day.setHours(Number.isFinite(h) ? h : 23, Number.isFinite(m) ? m : 59, 0, 0);
  return day;
}

export function isOverdue(task: TriageTask, now: Date): boolean {
  const at = deadlineAt(task);
  return !!at && at.getTime() < now.getTime();
}

// ---------------------------------------------------------------------------
// Estado
// ---------------------------------------------------------------------------

/**
 * O estado da tarefa, com padrão `'open'`.
 *
 * O padrão é o que faz save antigo funcionar: nenhuma tarefa gravada antes
 * deste motor tem `status`, e todas elas são, por definição, tarefas vivas.
 */
export function taskStatus(task: TriageTask): TaskStatus {
  const s = task.status;
  return s === 'someday' || s === 'dropped' ? s : 'open';
}

/**
 * Só `'open'` está viva.
 *
 * `someday` e `dropped` NÃO entram em meta do dia, nem em contagem, nem em
 * envelhecimento — e é justamente essa inércia que dá valor às duas saídas. Uma
 * lista "algum dia" que continuasse cobrando seria só o backlog com outro nome,
 * e o usuário voltaria a evitar abrir o app.
 */
export function isActive(task: TriageTask): boolean {
  return taskStatus(task) === 'open';
}

// ---------------------------------------------------------------------------
// Esforço e peso
// ---------------------------------------------------------------------------

/** Esforço da tarefa, com o padrão de save antigo (1 = rápida). */
export function effortOf(task: TriageTask): Effort {
  return normalizeEffort(task.effort);
}

/**
 * Quanto a tarefa PESA na meta do dia.
 *
 * É o esforço, e não 1. Enquanto tudo valia 1, a estratégia ótima do jogador
 * era cadastrar cinco tarefas triviais em vez de encarar a difícil — o defeito
 * documentado do Karma do Todoist, e o único jeito de contornar o desenho
 * inteiro deste arquivo.
 */
export function weightOf(task: TriageTask): number {
  return effortOf(task);
}

// ---------------------------------------------------------------------------
// Envelhecimento — o aging temático
// ---------------------------------------------------------------------------

/**
 * Há quantos dias a tarefa está parada.
 *
 * Conta de `lastTouchedAt` (qualquer interação: adiar, editar, encolher) e cai
 * para `createdAt`. Sem nenhum dos dois — o caso de todo save existente — a
 * resposta é **0**: uma tarefa cuja idade o app não sabe não pode ser tratada
 * como velha. Assombrar em massa o backlog inteiro de quem só atualizou o app
 * seria entregar, na primeira abertura, exatamente a tela de culpa que este
 * arquivo existe para evitar.
 */
export function daysStale(task: TriageTask, now: Date): number {
  const ref = parseDate(task.lastTouchedAt) ?? parseDate(task.createdAt);
  if (!ref) return 0;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  return Math.max(0, Math.round((a - b) / DAY_MS));
}

/**
 * A tarefa está ASSOMBRADA: vencida ou parada há `HAUNTED_AFTER_DAYS` dias.
 *
 * Na UI ela esmaece, ganha uma partícula escura e o pet olha para ela de vez em
 * quando; concluí-la dá bônus de alívio (o pet comemora mais alto). A regra é
 * deliberadamente o oposto do vermelho de atraso do mercado: a tarefa velha
 * vira CONTEÚDO de jogo com recompensa própria, não uma acusação.
 *
 * Uma tarefa `someday` NUNCA assombra, e isso é o coração do Someday do
 * Things 3: é uma lista deliberadamente inerte, uma permissão formal para não
 * fazer nada. Se ela envelhecesse, mandar algo para lá não aliviaria coisa
 * nenhuma — só adiaria a mesma cobrança, e o usuário deixaria de usar a saída.
 * `dropped` também não assombra, pelo motivo óbvio: já foi decidida.
 */
export function isHaunted(task: TriageTask, now: Date): boolean {
  if (!isActive(task)) return false;
  return isOverdue(task, now) || daysStale(task, now) >= HAUNTED_AFTER_DAYS;
}

// ---------------------------------------------------------------------------
// Adiamento — o contador do Sunsama
// ---------------------------------------------------------------------------

/**
 * Adia a tarefa: +1 no contador, `lastTouchedAt` atualizado e, opcionalmente,
 * novo `startDate`.
 *
 * `lastTouchedAt` andar junto é intencional: adiar é uma decisão real sobre a
 * tarefa, então ela não deve assombrar por parada — ela vai assombrar pelo
 * contador, que é o sinal mais honesto. Uma tarefa que a pessoa move todo dia
 * não está esquecida; está sendo evitada, e são coisas diferentes.
 */
export function postpone<T extends TriageTask>(task: T, now: Date, startDate?: string): T {
  return {
    ...task,
    postponedCount: (task.postponedCount ?? 0) + 1,
    lastTouchedAt: now.toISOString(),
    ...(startDate !== undefined ? { startDate } : {}),
  };
}

/**
 * Chegou a hora do pet intervir (decompor / encolher / deixar pra lá).
 *
 * É o contador visível do Sunsama ("movida 7 vezes"): torna evitação crônica um
 * DADO, e não um sentimento. A diferença entre "eu sou preguiçoso" e "esta
 * tarefa foi adiada 3 vezes" é a diferença entre culpa e decisão — a primeira
 * paralisa, a segunda tem botão.
 */
export function needsPostponeNudge(task: TriageTask): boolean {
  return (task.postponedCount ?? 0) >= POSTPONE_NUDGE_AT;
}

/**
 * ENCOLHER: rebaixa o esforço em 1 (mínimo 1) e ZERA o contador de adiamentos.
 *
 * O zeramento é a metade importante. A tarefa mudou — não é mais a mesma coisa
 * que a pessoa vinha evitando —, então o histórico de adiamento dela deixou de
 * descrever alguma coisa verdadeira. Carregar o contador adiante transformaria
 * a decisão certa ("eu reduzi o escopo") numa marca permanente, e o próximo
 * adiamento já dispararia o nudge outra vez. Recomeço honesto: a proposta é
 * nova, a contagem também.
 */
export function shrink<T extends TriageTask>(task: T, now?: Date): T {
  const next = Math.max(1, effortOf(task) - 1) as Effort;
  return {
    ...task,
    effort: next,
    postponedCount: 0,
    ...(now ? { lastTouchedAt: now.toISOString() } : {}),
  };
}

// ---------------------------------------------------------------------------
// As saídas dignas
// ---------------------------------------------------------------------------

/**
 * DEIXAR PRA LÁ — o Won't Do do TickTick.
 *
 * Estado terminal COM volta atrás. Não é deletar (deletar apaga o contexto: por
 * que aquilo entrou na lista, quanto tempo ficou lá, quantas vezes foi adiado)
 * e não é concluir (concluir é mentira, e uma lista com mentira dentro deixa de
 * valer como registro). É esta função que quebra o ciclo de falência periódica:
 * com uma saída honesta item a item, ninguém precisa apagar tudo e recomeçar.
 */
export function drop<T extends TriageTask>(task: T, now: Date): T {
  return { ...task, status: 'dropped' as TaskStatus, lastTouchedAt: now.toISOString() };
}

/** A volta atrás. Sem ela, "deixar pra lá" seria um delete com passo extra. */
export function restore<T extends TriageTask>(task: T, now: Date): T {
  return { ...task, status: 'open' as TaskStatus, lastTouchedAt: now.toISOString() };
}

/**
 * ALGUM DIA — a lista inerte do Things 3.
 *
 * Zera o contador de adiamentos junto: quem move para "algum dia" não está
 * adiando mais uma vez, está tirando a tarefa do jogo. Manter a contagem faria
 * a tarefa voltar já culpada no dia em que ela fosse reativada.
 */
export function toSomeday<T extends TriageTask>(task: T, now: Date): T {
  return {
    ...task,
    status: 'someday' as TaskStatus,
    postponedCount: 0,
    focusDate: undefined,
    lastTouchedAt: now.toISOString(),
  };
}

/**
 * Traz de volta para a lista viva.
 *
 * `lastTouchedAt` é atualizado, então a tarefa NÃO volta já assombrada por
 * tempo parado — ela ficou parada porque o usuário decidiu que ficasse. Voltar
 * com a partícula escura na cara puniria o uso correto da lista inerte.
 */
export function toOpen<T extends TriageTask>(task: T, now: Date): T {
  return { ...task, status: 'open' as TaskStatus, lastTouchedAt: now.toISOString() };
}

// ---------------------------------------------------------------------------
// Foco do dia — o ritual de planejamento em 20 segundos
// ---------------------------------------------------------------------------

/**
 * Marca até `MAX_DAILY_FOCUS` tarefas como foco de `dayKey`, e LIMPA o foco das
 * demais naquele dia.
 *
 * Três, e o número é a mecânica: é o Sunsama sem o custo de 20 minutos de
 * planejamento. Um limite que não limita não planeja nada — escolher significa
 * deixar de fora, e é o deixar de fora que alivia (Masicampo & Baumeister: o
 * que descarrega a tensão da tarefa inacabada é o PLANO, não a conclusão).
 *
 * O corte é por ordem de `ids`: quem chama controla a prioridade, a função não
 * decide no lugar dele. Tarefas inativas nunca entram — foco em algo que está
 * no "algum dia" seria a contradição direta da lista inerte.
 */
export function setFocus<T extends TriageTask>(tasks: T[], ids: string[], dayKey: string): T[] {
  const chosen = new Set<string>();
  for (const id of ids) {
    if (chosen.size >= MAX_DAILY_FOCUS) break;
    const t = tasks.find(x => x.id === id);
    if (t && isActive(t)) chosen.add(id);
  }
  return tasks.map(t => {
    if (chosen.has(t.id)) return { ...t, focusDate: dayKey };
    // Só limpa o foco DESTE dia: um foco gravado para outro dia (ontem, no
    // histórico) não é assunto desta chamada.
    if (sameDay(t.focusDate, dayKey)) return { ...t, focusDate: undefined };
    return t;
  });
}

/** As tarefas em foco no dia (ativas — foco de tarefa arquivada não é foco). */
export function focusTasks<T extends TriageTask>(tasks: T[], dayKey: string): T[] {
  return tasks.filter(t => isActive(t) && sameDay(t.focusDate, dayKey));
}

/**
 * As três do foco foram concluídas?
 *
 * Precisa olhar `completedTasks` também porque `completeTask` (careRules.ts)
 * REMOVE a tarefa de `tasks` ao concluir. Quem olhasse só a lista viva veria o
 * foco desaparecer e concluiria que ninguém fez nada — é o mesmo bug que já
 * negou dia perfeito a quem fez tudo (ver `tasksCompletedOn` em dailyReset.ts).
 *
 * Sem foco nenhum escolhido, a resposta é `false`: não existe selo do dia por
 * omissão, e um dia sem planejamento não pode render o mesmo que um planejado.
 */
export function focusComplete<T extends TriageTask>(
  tasks: T[],
  completedTasks: Array<{ id: string; completedAt?: string; focusDate?: string }>,
  dayKey: string,
): boolean {
  const doneIds = new Set(completedTasks.map(t => t.id));
  const stillListed = focusTasks(tasks, dayKey);
  const pending = stillListed.filter(t => !t.completed && !doneIds.has(t.id));

  // Focos já concluídos: os que ainda estão na lista marcados (a janela de 3s
  // entre o clique e a saída) MAIS os que já migraram para `completedTasks`.
  const doneFocus =
    (stillListed.length - pending.length)
    + completedTasks.filter(c => sameDay(c.focusDate, dayKey) && !stillListed.some(t => t.id === c.id)).length;

  if (pending.length + doneFocus === 0) return false;
  return pending.length === 0;
}

// ---------------------------------------------------------------------------
// Carga do dia — o medidor do Sunsama, versão leve
// ---------------------------------------------------------------------------

/** Fatia de um hábito que a carga do dia lê. */
export interface PlannedActivity {
  id?: string;
  weekDays?: number[];
  schedule?: Schedule;
}

/**
 * Soma dos PESOS planejados para o dia: tarefas ativas com `startDate` ou foco
 * no dia (cada uma pelo seu esforço) + hábitos elegíveis × `HABIT_WEIGHT`.
 *
 * Ponderado, e não contado: uma tarefa de esforço 3 pesa exatamente como três de
 * esforço 1. É a mesma correção de `weightOf` aplicada ao dia inteiro — sem
 * ela, o medidor diria "seu dia está leve" para alguém que planejou dois
 * projetos.
 */
export function plannedEffort(
  tasks: TriageTask[],
  activities: PlannedActivity[],
  dayKey: string,
  rhythms?: Record<string, HabitRhythm>,
): number {
  const day = parseDayValue(dayKey);

  const taskLoad = tasks
    .filter(t => isActive(t) && !t.completed)
    .filter(t => sameDay(t.startDate, dayKey) || sameDay(t.focusDate, dayKey))
    .reduce((sum, t) => sum + weightOf(t), 0);

  // A elegibilidade do hábito NÃO é decidida aqui. Antes era: este filtro lia
  // `a.weekDays` cru, que é a terceira cópia da mesma pergunta (as outras duas
  // estavam em `dailyReset` e em `rituals`), e só concordava com as outras
  // porque o CreateModal escreve `weekDays: [0..6]` para schedule flexível — um
  // detalhe de compatibilidade do widget Android, não um contrato. Dono único:
  // `habitCountsOn` (utils/habitRhythm.ts).
  const habitLoad = day
    ? activities.filter(a => habitCountsOn(a, rhythms?.[String(a.id)], day)).length * HABIT_WEIGHT
    : 0;

  return taskLoad + habitLoad;
}

/**
 * O dia está sobrecarregado?
 *
 * O app assume que a estimativa do usuário está errada PARA BAIXO (planning
 * fallacy) e fala antes que o dia fique impossível.
 *
 * ⚠️ ISTO É AVISO, NUNCA BLOQUEIO. Esta função devolve um booleano para a UI
 * dizer "isso é bastante pra um dia só — quer deixar uma pra amanhã?", e nada
 * mais: ela não impede marcar foco, não recusa criar tarefa, não reagenda nada
 * sozinha. O Motion é odiado exatamente por decidir no lugar do usuário, e um
 * medidor que virasse trava reproduziria esse defeito com outro nome. Se algum
 * dia alguém quiser usar este retorno para barrar uma ação, o correto é mudar o
 * texto do aviso — não a permissão.
 */
export function isOvercommitted(effort: number): boolean {
  return effort > OVERCOMMIT_EFFORT;
}

// ---------------------------------------------------------------------------
// "Arrumar a pilha" — a triagem em massa
// ---------------------------------------------------------------------------

/**
 * A fila do botão "Arrumar a pilha": tudo que está atrasado ou assombrado,
 * ordenado por urgência.
 *
 * É o Smart Schedule do Todoist com ergonomia de jogo — a UI apresenta o
 * resultado como fila de cartas, cada uma com quatro ações grandes (hoje / esta
 * semana / algum dia / deixar pra lá). O ponto não é reagendar rápido: é
 * transformar 200 itens vermelhos numa sequência de decisões de um clique, que
 * é a única forma conhecida de drenar um backlog sem falência. Terminar a fila é
 * trabalho real de planejamento — e planejar é o que alivia a tensão da tarefa
 * inacabada (Masicampo & Baumeister), muito mais que concluir.
 *
 * Ordem: (1) vencidas primeiro, e entre elas a que venceu há mais tempo;
 * (2) depois as assombradas por abandono, da mais parada para a menos.
 * Prazo real ganha de tempo parado porque prazo tem consequência fora do app.
 * Desempate final pelo `id`, para a fila não trocar de ordem entre renders.
 */
export function triageQueue<T extends TriageTask>(tasks: T[], now: Date): T[] {
  return tasks
    .filter(t => !t.completed && isHaunted(t, now))
    .slice()
    .sort((a, b) => {
      const da = deadlineAt(a);
      const db = deadlineAt(b);
      const oa = isOverdue(a, now);
      const ob = isOverdue(b, now);
      if (oa !== ob) return oa ? -1 : 1;
      if (oa && ob && da && db) {
        if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime();
      }
      const sa = daysStale(a, now);
      const sb = daysStale(b, now);
      if (sa !== sb) return sb - sa;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}
