/**
 * ↩️ DESFAZER A CONCLUSÃO — a janela de 5 segundos (decisão #57).
 *
 * ⚠️ DECISÃO DO DONO #57 (22/09/2026, `docs/PERGUNTAS-DO-DONO.md`):
 * *"Marcar feita: **toast 'Desfazer' 5 s** revertendo a conclusão inteira"*.
 *
 * ## O problema que isto resolve
 *
 * Marcar um hábito era IRREVERSÍVEL por desenho — `handleToggleActivityCompletion`
 * abre com `if (activity?.completedToday …) return;`, e o comentário ao lado diz
 * *"Completed activities cannot be unchecked — only daily reset restores them"*.
 * A razão é boa (desmarcar à vontade transforma o contador de dia completo em
 * brinquedo, e o `foodInventory` em torneira), mas ela também significa que o
 * **toque errado** — o dedo no item de cima da lista, a linha vizinha, o hábito
 * homônimo — custava comida, atributo, XP de Vínculo e constância, sem volta,
 * até a meia-noite.
 *
 * A janela de 5 segundos é a saída padrão da categoria (Gmail, Todoist,
 * Things): curta o bastante para não virar um botão de "destravar o jogo", e
 * imediata o bastante para pegar o gesto errado enquanto ele ainda é um gesto
 * errado. **Passada a janela, a conclusão é imutável de novo** — a regra antiga
 * continua inteira; o que mudou foi só a borda dela.
 *
 * ## Por que é SNAPSHOT e não "aplicar o inverso"
 *
 * Porque a conclusão toca oito campos em três arquivos diferentes
 * (`withHabitCompletion` + os dois handlers do `App.tsx`): ritmo, atributos,
 * `attributesSinceLastEvolution`, comida, `activityLog`, `activityStats`, a
 * própria atividade, mais `totalXP`/`bondDaily` do Vínculo. Escrever o inverso
 * de cada um seria uma SEGUNDA regra de conclusão, e regra copiada diverge em
 * silêncio (footgun 9) — quem acrescentasse um campo à conclusão amanhã
 * deixaria o desfazer pela metade, sem nada ficar vermelho.
 *
 * O snapshot é a única forma que não pode divergir: guarda-se o valor ANTES e
 * devolve-se ele. Se a conclusão passar a escrever um campo novo, ele só
 * precisa entrar em `CAMPOS_DA_CONCLUSAO` — e há teste varrendo.
 *
 * ## O que o desfazer NÃO reverte, de propósito
 *
 * Só os campos listados. Cinco segundos são poucos, mas cabe um gesto: se a
 * pessoa marcou, deu comida ao pet e desfez, o `foodInventory` volta ao valor
 * de antes — inclusive a comida gasta. É o preço de reverter "a conclusão
 * inteira", que é o que a decisão manda, e ele cai do lado seguro (o jogador
 * fica com o estado de antes do erro, nunca com um a mais).
 *
 * `perfectDays`, `totalPerfectDays`, `healthPoints`, `evolutionStage` e as
 * moedas **não estão na lista** e por isso não podem ser tocados por este
 * caminho: a conclusão não os escreve, e desfazer não pode virar porta dos
 * fundos para mexer em progressão (linha vermelha #20 no espírito — o que não
 * é da conclusão não é do desfazer).
 *
 * Função PURA, feita para rodar dentro de um updater (footgun 6).
 */

/**
 * Os campos que UMA conclusão de hábito escreve.
 *
 * Fonte: `withHabitCompletion` (ritmo, atributos, `attributesSinceLastEvolution`,
 * Vínculo) + os dois handlers de conclusão do `App.tsx` (atividade,
 * `activityStats`, `foodInventory`, `activityLog`).
 *
 * ⚠️ Campo novo na conclusão entra AQUI. `completionUndo.test.ts` compara esta
 * lista com o que uma conclusão de verdade muda no estado e reprova se sobrar
 * alguma coisa — é o que impede o desfazer de ficar pela metade em silêncio.
 */
export const CAMPOS_DA_CONCLUSAO = [
  'activities',
  'activityStats',
  'activityLog',
  'foodInventory',
  'habitRhythms',
  'powerPoints',
  'harmonyPoints',
  'benevolencePoints',
  'attributesSinceLastEvolution',
  'totalXP',
  'bondDaily',
] as const;

export type CampoDaConclusao = typeof CAMPOS_DA_CONCLUSAO[number];

/** O que voltar. Opaco de propósito: quem guarda não precisa saber o que tem. */
export type CompletionSnapshot = Partial<Record<CampoDaConclusao, unknown>>;

/**
 * Quanto tempo o "Desfazer" fica de pé — a janela da decisão #57.
 *
 * É a duração do TOAST e o limite da reversão ao mesmo tempo, de propósito:
 * duas durações diferentes dariam um botão que some antes de expirar (promessa
 * quebrada) ou que expira antes de sumir (botão morto na tela).
 */
export const UNDO_WINDOW_MS = 5000;

/**
 * Fotografa o estado ANTES da conclusão.
 *
 * Chamado FORA do updater, do estado que o handler já tem em mãos — é o mesmo
 * lugar (e o mesmo motivo) de `habitMilestoneOf` e `queueTaskGains`: o updater
 * roda 2× no StrictMode.
 */
export function snapshotCompletion(state: object): CompletionSnapshot {
  const bruto = state as Record<string, unknown>;
  const snap: CompletionSnapshot = {};
  for (const campo of CAMPOS_DA_CONCLUSAO) snap[campo] = bruto[campo];
  return snap;
}

/**
 * Devolve o estado ao que era antes da conclusão fotografada.
 *
 * Idempotente por construção (desfazer duas vezes escreve os mesmos valores) e
 * seguro sob uma virada do dia no meio da janela: os campos são sobrescritos
 * pelos do snapshot, e a virada reescreve `activities`/`habitRhythms` na
 * abertura seguinte de qualquer jeito.
 */
export function undoCompletion<T extends object>(prev: T, snap: CompletionSnapshot): T {
  const next: Record<string, unknown> = { ...(prev as Record<string, unknown>) };
  for (const campo of CAMPOS_DA_CONCLUSAO) next[campo] = snap[campo];
  return next as T;
}
