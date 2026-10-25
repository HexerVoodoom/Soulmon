/**
 * ACORDAR O SOULMON (19/10/2026, dono — REGISTRO §110 e §112; D-66/D-67/D-68 do refino de 19/10).
 *
 * Todo dia, na 1ª abertura, o Soulmon aparece DORMINDO na Home e a pessoa o acorda com UM toque (o botão "Acordar" que
 * já existe no deck, o mesmo do sono manual). Não é modal. Até acordar, só as ações do PET e dos JOGOS ficam paradas
 * (aviso curto + atalho "Acordar"); concluir tarefa/hábito NUNCA para e acorda o Soulmon sozinho.
 *
 * ⚠️ É estado de APRESENTAÇÃO, não de sono. Este módulo NÃO toca `isSleeping` (o sono real, que pausa o dreno de coração,
 * esconde o cocô e grava a noite na janela de descanso), nem o save, nem `rest`. "Dormindo para acordar" só muda o que a
 * Home DESENHA e libera/segura a fila do início de dia. Por isso:
 *  · o dreno do cocô (`applyPoopDrain`), o cocô (`useCareSystem`) e a janela de descanso seguem lendo o `isSleeping` REAL;
 *  · "noite sem registro é neutra" continua: acordar não registra noite nem paga nada, e não acordar não cobra nada;
 *  · nada aqui é custo, perda, contagem ou sequência — o despertar diário não é um compromisso, é a abertura do dia.
 *
 * A marca é o DIA DO JOGADOR (`playerDayKey`) em que o Soulmon foi acordado, neste aparelho (local, fora do save: é
 * apresentação, como o `DAILY_REPORT_SHOWN`). Virou o dia, a marca é de outro dia e ele volta a dormir.
 */

/** O que muda o pet de lugar quando acordado por tarefa/hábito (informativo; a regra é "concluir sempre acorda"). */
export const WAKE_ALL_ACTIONS = [
  // ── PET ── seguram até acordar
  'feed', 'shower', 'pet', 'play',
  // ── JOGOS ── seguram até acordar (Masmorra + minijogos do Salão e do Ateliê da Mente)
  'masmorra', 'dino', 'ppt', 'match3', 'barrage', 'eco', 'bolhas', 'troca', 'picross', 'revisao', 'zip', 'patches',
] as const;

export type WakeBlockedAction = (typeof WAKE_ALL_ACTIONS)[number];

/** A lista EXATA do que o aviso "acorde o Soulmon" segura (R3, REGISTRO §112). Mudar esta lista é decisão do dono. */
export const WAKE_BLOCKED_ACTIONS: readonly WakeBlockedAction[] = WAKE_ALL_ACTIONS;

/** Ações do PET (alimentar, carinho, banho, brincar). */
export const WAKE_BLOCKED_PET: readonly WakeBlockedAction[] = ['feed', 'shower', 'pet', 'play'];

/** Jogos: a Masmorra e os minijogos pagos/pontuados. O Refúgio (respiração, bolhas calmas) NÃO entra: não paga, não pontua. */
export const WAKE_BLOCKED_GAMES: readonly WakeBlockedAction[] = ['masmorra', 'dino', 'ppt', 'match3', 'barrage', 'eco', 'bolhas', 'troca', 'picross', 'revisao', 'zip', 'patches'];

/**
 * O que NUNCA para por causa do sono diário (G-01 — nada reduz nem adia o impacto de concluir tarefa/hábito; REGISTRO §96).
 * Serve de contrato: qualquer id aqui devolve `false` em `isBlockedUntilWake`, com o Soulmon dormindo ou não.
 */
export const WAKE_NEVER_BLOCKED = [
  'completeTask', 'completeHabit', 'toggleTaskStep', 'createTask', 'editTask', 'checkIn', 'navigate', 'settings', 'refuge',
] as const;

/** Verdadeiro se a ação fica parada enquanto o Soulmon dorme à espera de ser acordado. */
export function isBlockedUntilWake(action: string, pending: boolean): boolean {
  if (!pending) return false;
  return (WAKE_BLOCKED_ACTIONS as readonly string[]).includes(action);
}

export interface DayWakeInput {
  /** O jogador já passou do onboarding e do tutorial (antes disso o pet nem nasceu para dormir). */
  active: boolean;
  /** Dia do jogador de hoje (`playerDayKey`). */
  today: string;
  /** Dia do jogador em que o Soulmon foi acordado pela última vez neste aparelho (`null` = nunca). */
  wokeDay: string | null;
  /** O Soulmon nasceu HOJE: quem acabou de nascer não dorme na 1ª abertura. */
  bornToday?: boolean;
}

/** O Soulmon está "dormindo para acordar" agora? */
export function dayWakePending({ active, today, wokeDay, bornToday = false }: DayWakeInput): boolean {
  if (!active || bornToday) return false;
  return wokeDay !== today;
}

/** O pedaço do save que diz se algo foi concluído HOJE (tarefa ou hábito). Estrutural: aceita o `GameState` inteiro. */
export interface CompletionState {
  activities?: ReadonlyArray<{ completedToday?: boolean; lastCompletedDate?: string; steps?: ReadonlyArray<{ completed: boolean }> }>;
  /** Tarefa marcada que ainda está na lista (a janela de 3 s antes de sair para `completedTasks`). */
  tasks?: ReadonlyArray<{ completed?: boolean }>;
  completedTasks?: ReadonlyArray<{ completedAt?: string }>;
}

/**
 * Alguma tarefa ou hábito foi concluído HOJE? Lido do SAVE — o único lugar onde app, widget Android e overlay de desktop se
 * encontram: os dois últimos concluem sem abrir a Home e escrevem no mesmo save. Dia do APARELHO (`toDateString`), a mesma chave
 * de `completedToday/lastCompletedDate/completedAt`. Não pesa nada: a pergunta é "houve esforço hoje?", nunca "quanto".
 */
export function didCompleteToday(state: CompletionState, now: Date): boolean {
  const key = now.toDateString();
  if ((state.tasks ?? []).some(t => t?.completed)) return true;
  for (const t of state.completedTasks ?? []) {
    if (!t?.completedAt) continue;
    const d = new Date(t.completedAt);
    if (!Number.isNaN(d.getTime()) && d.toDateString() === key) return true;
  }
  for (const a of state.activities ?? []) {
    if ((a?.steps?.length ?? 0) > 0 ? a.steps!.every(st => st.completed) : (!!a?.completedToday && a.lastCompletedDate === key)) return true;
  }
  return false;
}

/**
 * Concluir QUALQUER tarefa/hábito do dia acorda o Soulmon — no app, no widget Android e no overlay de desktop. O app percebe pelo
 * SAVE (`didCompleteToday`), então não existe caminho de conclusão que dependa deste módulo (e nenhum que o consulte para bloquear).
 */
export function wakesByCompletion(pending: boolean, completedToday: boolean): boolean {
  return pending && completedToday;
}

/** O aviso curto da ação parada. Sem culpa, sem medo, sem cobrança: diz o que fazer, em 1 frase. */
export function wakeWarning(isPt: boolean): { text: string; action: string } {
  return isPt
    ? { text: 'Acorde o Soulmon primeiro.', action: 'Acordar' }
    : { text: 'Wake your Soulmon first.', action: 'Wake' };
}
