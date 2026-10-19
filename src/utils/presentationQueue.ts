/**
 * A FILA CENTRAL DE APRESENTAÇÃO (14/10/2026, pedido do dono por voz: "tem que ter uma ordem de prioridade para não
 * haver sobreposição"). Dono ÚNICO de duas coisas: a ORDEM em que os intersticiais da Home/App se apresentam e a
 * regra de quem está na tela. Puro: sem React, sem storage, sem `Date`. O hook `hooks/usePresentationQueue.ts` só
 * liga isto ao React; o `App.tsx` só diz quem está PRONTO (`ready`) e o que fazer ao mostrar/fechar cada um.
 * O inventário de quem dispara o quê está em `docs/FILA-DE-MODAIS.md`.
 *
 * ## As quatro regras
 *  1. **Um por vez.** `pickPresentation` devolve UM id; o resto espera.
 *  2. **Prioridade explícita** (`PRESENTATION_ORDER`, do mais urgente ao mais leve). Quando o item da tela fecha, entra
 *     o MAIS PRIORITÁRIO dos que esperam. Itens que dependem de outro (as metas só depois do resumo; a apresentação
 *     do mapa só depois do level-up) respeitam a ordem por construção — ficam mais abaixo na lista.
 *  3. **Quem está na tela NÃO é expulso.** Um item mais prioritário que fica pronto DEPOIS espera o atual fechar
 *     (antes, a cadeia era recalculada a cada render e o item novo DESMONTAVA o que a pessoa estava lendo — o
 *     resumo do dia perdia a página, o check-in perdia o que ela marcou). Única exceção: o item ocioso (`welcome`),
 *     que não é um diálogo e cede a qualquer um.
 *  4. **Item que falha não trava a fila.** Um item em `failed` (erro de render, chunk que não carregou, fechamento
 *     que lançou) é pulado até a próxima abertura do app; nada é regravado por isso.
 *
 * ## O INÍCIO DE DIA (19/10/2026, dono — REGISTRO §111; D-64)
 * A ordem do começo do dia é: (0) o Soulmon dormindo na Home — acordar é um GESTO, não um modal (`utils/dayWake.ts`);
 * (1) o pesadelo, ou o sonho no lugar (nunca os dois); (2) o resumo de ontem COM o humor; (3) "Hoje" (`dayGoals` + `checkIn`
 * fundidos num modal só). TETO de 3 modais: as celebrações (`levelUp`, `evolveTask`, `groveMilestone`) entram DEPOIS, só se
 * sobrar vaga no teto — senão ficam para a próxima abertura; convites e configuração (`catalogLevelInvite`, `restSetup`, o
 * priming de push) SAEM do início de dia: só aparecem numa abertura em que nada do início de dia/celebração foi mostrado.
 * Enquanto o Soulmon dorme à espera de ser acordado (`holdDayStart`), nada disso entra. Tudo isto é função PURA de
 * `(ready, current, failed, ctx)`: `ctx.shown` é o que já foi mostrado NESTA abertura do app (o hook o acumula).
 *
 * ## Persistência (o bug "abri de novo e vieram dois modais do mapa")
 * Esta fila NÃO guarda estado no save. Cada dono de evento marca "visto" **ao MOSTRAR**, não ao fechar
 * (`buildingIntrosSeen`, `lastCelebratedLevel`, `STORAGE_KEYS.DAILY_REPORT_SHOWN`): fechar o app no meio não faz o
 * mesmo evento voltar. Um evento que NÃO chegou à tela continua pendente e volta uma única vez — quando for mostrado,
 * ganha a marca. Os rituais que pedem uma RESPOSTA (check-in, escolha de metas) seguem pendentes até a resposta.
 */

/** O id ocioso: "nenhum intersticial na tela". Sempre pronto, nunca sticky. */
export const PRESENTATION_IDLE = 'welcome' as const;

/**
 * A ORDEM. Do mais urgente ao mais leve (a posição é a prioridade):
 *  1. `welcomeTour` — a boas-vindas do primeiro uso (nada mais faz sentido antes dela);
 *  2. `triage` — a única aberta por TOQUE do usuário: ele acabou de pedir;
 *  2b. `npcLetter` — a carta de NPC, aberta por TOQUE na cartinha da Home (D-13/D-14, REGISTRO §115); gesto, como a triagem;
 *  ── INÍCIO DE DIA (D-64, REGISTRO §111), depois de acordar o Soulmon ──
 *  3. `nightmare` — o pesadelo da manhã (jogável) logo depois do despertar; NUNCA junto do sonho;
 *  4. `dream` — o sonho da manhã, no lugar do pesadelo quando não há luta;
 *  5. `dailyReport` — o resumo de ontem COM o humor (tarefas + corações + humor numa tela; depois a aventura, quando houver);
 *  6. `buildingIntro` — o NPC do prédio, SÓ na primeira entrada nele (tela cheia, sequência de falas);
 *  6b. `mapTutorial` — o tutorial do mapa (corvo e NPCs de área em `NpcSequence`), UMA vez, na 1ª abertura do Mapa;
 *  7. `catalogOnboarding` — escolher as primeiras metas (depende de já ter visto o resumo);
 *  8. `dayGoals` — "Hoje": marcar o que quer fazer HOJE E se comprometer com o foco, num modal só (REGISTRO §66 + §111);
 *  8b. `checkIn` — o compromisso sozinho, SÓ quando não há "Hoje" (`dayGoals`) pedindo/visto: os dois são UM modal;
 *  ── DEPOIS, se sobrar vaga no teto de 3 (senão, próxima abertura) ──
 *  9. `levelUp` (celebração), 10. `evolveTask` ("crie mais atividades" depois de evoluir), 11. `groveMilestone`;
 *  ── FORA do início de dia ──
 * 12. `catalogLevelInvite`, 13. `restSetup` — convite e configuração: só numa abertura sem nada do início de dia;
 * 14. `unlockToast` — balãozinho NÃO bloqueante "<Prédio> desbloqueado no <local>" (nunca sticky: qualquer modal pronto o substitui);
 * 14b. `noticeToast` — balãozinho NÃO bloqueante de um aviso acionável (refeição, Refúgio, termos, triagem, recomeço), 1× por dia cada, o mais leve de todos;
 * 15. `welcome` — ocioso (o pedido de instalar/notificar decide sozinho se tem algo a dizer; não aparece no início de dia).
 */
export const PRESENTATION_ORDER = [
  'welcomeTour',
  'triage',
  'npcLetter',
  'nightmare',
  'dream',
  'dailyReport',
  'buildingIntro',
  'mapTutorial',
  'catalogOnboarding',
  'dayGoals',
  'checkIn',
  'levelUp',
  'evolveTask',
  'groveMilestone',
  'catalogLevelInvite',
  'restSetup',
  'unlockToast',
  'noticeToast',
  PRESENTATION_IDLE,
] as const;

export type PresentationId = (typeof PRESENTATION_ORDER)[number];

/** Quem está pronto para aparecer agora. Id ausente = não pronto. */
export type PresentationReady = Partial<Record<PresentationId, boolean>>;

/** Itens que NÃO seguram a tela: o ocioso e o balão de desbloqueio (qualquer modal pronto os substitui). */
const NON_STICKY: ReadonlySet<PresentationId> = new Set<PresentationId>([PRESENTATION_IDLE, 'unlockToast', 'noticeToast']);

const NO_FAILED: ReadonlySet<PresentationId> = new Set();

/** O TETO de modais do início de dia (R2, REGISTRO §111): início de dia + celebrações, contados por TELA. */
export const START_OF_DAY_MODAL_CAP = 3;

/** O início de dia propriamente dito: entram depois de acordar, antes de qualquer celebração, e NUNCA são adiados pelo teto. */
export const DAY_START_IDS: readonly PresentationId[] = ['nightmare', 'dream', 'dailyReport', 'dayGoals', 'checkIn'];

/** Celebrações: vêm DEPOIS do início de dia, e só se sobrar vaga no teto; senão, próxima abertura. */
export const CELEBRATION_IDS: readonly PresentationId[] = ['levelUp', 'evolveTask', 'groveMilestone'];

/** Convites e configuração: SAEM do início de dia (próxima abertura ou ação). */
export const INVITE_IDS: readonly PresentationId[] = ['catalogLevelInvite', 'restSetup'];

/** Quem o Soulmon dormindo (`holdDayStart`) segura: início de dia, celebrações e convites. O que nasce de GESTO (triagem, intro de prédio, mapa) e o onboarding não. */
const HELD_WHILE_ASLEEP: ReadonlySet<PresentationId> = new Set<PresentationId>([...DAY_START_IDS, ...CELEBRATION_IDS, ...INVITE_IDS]);

/** Contexto da fila (opcional: sem ele, a regra é a de sempre — sem teto, sem espera). */
export interface PresentationContext {
  /** O que já foi mostrado NESTA abertura do app (o hook acumula). */
  shown?: ReadonlySet<PresentationId>;
  /** O Soulmon dorme à espera de ser acordado: nada do início de dia, celebração ou convite entra. */
  holdDayStart?: boolean;
}

const NO_SHOWN: ReadonlySet<PresentationId> = new Set();

export function isPresentationId(x: unknown): x is PresentationId {
  return typeof x === 'string' && (PRESENTATION_ORDER as readonly string[]).includes(x);
}

/** A posição na ordem (menor = mais urgente). Id desconhecido vai para o fim. */
export function presentationRank(id: PresentationId): number {
  return PRESENTATION_ORDER.indexOf(id);
}

/** A TELA que o id ocupa na contagem do teto: sonho e pesadelo são UMA tela; "Hoje" (`dayGoals`/`checkIn`) é UMA tela. */
export function presentationSlotOf(id: PresentationId): string {
  if (id === 'nightmare' || id === 'dream') return 'sono';
  if (id === 'dayGoals' || id === 'checkIn') return 'hoje';
  return id;
}

/** Quantos modais do início de dia + celebrações já foram mostrados (por tela, não por id). */
export function countedModals(shown: ReadonlySet<PresentationId> = NO_SHOWN): number {
  const slots = new Set<string>();
  for (const id of shown) if (DAY_START_IDS.includes(id) || CELEBRATION_IDS.includes(id)) slots.add(presentationSlotOf(id));
  return slots.size;
}

/** A pessoa está no início de dia? (o Soulmon dorme, ou já se mostrou/está pronto algo do início de dia ou celebração). O priming de push e o `welcome` ocioso esperam por isto. */
export function isDayStartActive(
  ready: PresentationReady,
  ctx: PresentationContext = {},
  failed: ReadonlySet<PresentationId> = NO_FAILED,
): boolean {
  if (ctx.holdDayStart) return true;
  const shown = ctx.shown ?? NO_SHOWN;
  for (const id of [...DAY_START_IDS, ...CELEBRATION_IDS]) {
    if (shown.has(id) || (ready[id] === true && !failed.has(id))) return true;
  }
  return false;
}

/** O id pode aparecer agora? Junta o "pronto" com as regras do início de dia (espera, exclusividade, teto, convites fora). */
function eligible(id: PresentationId, ready: PresentationReady, failed: ReadonlySet<PresentationId>, ctx: PresentationContext): boolean {
  if (id === PRESENTATION_IDLE || ready[id] !== true || failed.has(id)) return false;
  const shown = ctx.shown ?? NO_SHOWN;
  if (ctx.holdDayStart && HELD_WHILE_ASLEEP.has(id)) return false;
  // quem já foi mostrado NESTA abertura não é re-adiado (o atual não é expulso por uma regra que nasce depois dele)
  const already = shown.has(id);
  // pesadelo OU sonho, nunca os dois no mesmo despertar (o pesadelo vem primeiro na ordem)
  if (id === 'dream' && !already && (ready.nightmare === true && !failed.has('nightmare') || shown.has('nightmare'))) return false;
  if (id === 'nightmare' && !already && shown.has('dream')) return false;
  // "Hoje" é UM modal: o compromisso sozinho só entra quando não há o "Hoje" completo pedindo ou já visto
  if (id === 'checkIn' && !already && (ready.dayGoals === true && !failed.has('dayGoals') || shown.has('dayGoals'))) return false;
  // celebração: só se sobrar vaga no teto de 3
  if (CELEBRATION_IDS.includes(id) && !already && countedModals(shown) >= START_OF_DAY_MODAL_CAP) return false;
  // convite/configuração: fora do início de dia
  if (INVITE_IDS.includes(id) && !already) {
    for (const d of [...DAY_START_IDS, ...CELEBRATION_IDS]) {
      if (shown.has(d) || (ready[d] === true && !failed.has(d))) return false;
    }
  }
  return true;
}

/**
 * Quem está na tela. `current` é quem estava na tela no render anterior (`PRESENTATION_IDLE`/`null` = ninguém).
 * Regra 3: se `current` ainda está pronto (e não falhou) ele PERMANECE — mesmo que apareça um mais prioritário.
 * Senão entra o mais prioritário entre os prontos; sem nenhum, o ocioso.
 */
export function pickPresentation(
  ready: PresentationReady,
  current: PresentationId | null = null,
  failed: ReadonlySet<PresentationId> = NO_FAILED,
  ctx: PresentationContext = {},
): PresentationId {
  if (current !== null && !NON_STICKY.has(current) && eligible(current, ready, failed, ctx)) return current;
  for (const id of PRESENTATION_ORDER) if (eligible(id, ready, failed, ctx)) return id;
  return PRESENTATION_IDLE;
}

/** A fila de espera inteira, na ordem em que vão entrar (o `current` primeiro). Para teste, telemetria e o doc. */
export function presentationBacklog(
  ready: PresentationReady,
  current: PresentationId | null = null,
  failed: ReadonlySet<PresentationId> = NO_FAILED,
  ctx: PresentationContext = {},
): PresentationId[] {
  const out: PresentationId[] = [];
  const first = pickPresentation(ready, current, failed, ctx);
  if (first === PRESENTATION_IDLE) return out;
  out.push(first);
  for (const id of PRESENTATION_ORDER) {
    if (id !== first && eligible(id, ready, failed, ctx)) out.push(id);
  }
  return out;
}

/** O que está PRONTO mas ficou para a próxima abertura/ação (teto de 3, convites fora, exclusividade). Para teste e telemetria. */
export function presentationDeferred(
  ready: PresentationReady,
  failed: ReadonlySet<PresentationId> = NO_FAILED,
  ctx: PresentationContext = {},
): PresentationId[] {
  return PRESENTATION_ORDER.filter(id => id !== PRESENTATION_IDLE && ready[id] === true && !failed.has(id) && !eligible(id, ready, failed, ctx));
}

/** Marca um id como falho (devolve um conjunto NOVO; já falho devolve o mesmo). */
export function withFailed(failed: ReadonlySet<PresentationId>, id: PresentationId): ReadonlySet<PresentationId> {
  if (failed.has(id)) return failed;
  const next = new Set(failed);
  next.add(id);
  return next;
}

/** Roda `fn` sem deixar um erro dele escapar (um fechamento que lança não pode travar a fila). `true` = rodou limpo. */
export function runGuarded(fn: (() => void) | undefined): boolean {
  if (!fn) return true;
  try { fn(); return true; } catch { return false; }
}

/** DEMO (portfólio): a fila fica INERTE — nenhum item entra sozinho; só toque explícito do usuário abre algo. */
export const INERT_READY: PresentationReady = Object.freeze({});
export function readyFor(demo: boolean, ready: PresentationReady): PresentationReady {
  return demo ? INERT_READY : ready;
}
