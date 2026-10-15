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
 *  3. `levelUp` — o nível subiu: a celebração vem antes de tudo o que é "do dia";
 *  4. `dailyReport` — o resumo do dia, AGRUPADO (tarefas de ontem + corações num modal central, depois a aventura);
 *  5. `buildingIntro` — o NPC do prédio, SÓ na primeira entrada nele (tela cheia, sequência de falas);
 *  5b. `mapTutorial` — o tutorial do mapa (corvo e NPCs de área em `NpcSequence`), UMA vez, na 1ª abertura do Mapa;
 *  6. `catalogOnboarding` — escolher as primeiras metas (depende de já ter visto o resumo);
 *  6b. `dayGoals` — reafirmar o dia: marcar, entre o que já cadastrou, o que quer fazer HOJE (REGISTRO §66; depende do resumo e das metas);
 *  7. `checkIn` — se comprometer com as tarefas do dia (depende do resumo e das metas; só vê o que foi marcado em `dayGoals`);
 *  8. `evolveTask` — "crie mais atividades" depois de evoluir;
 *  9. `groveMilestone`, 10. `dream`, 11. `nightmare`, 12. `catalogLevelInvite`, 13. `restSetup` — avisos leves;
 * 14. `unlockToast` — balãozinho NÃO bloqueante "<Prédio> desbloqueado no <local>" (nunca sticky: qualquer modal pronto o substitui);
 * 14b. `noticeToast` — balãozinho NÃO bloqueante de um aviso acionável (refeição, Refúgio, termos, triagem, recomeço), 1× por dia cada, o mais leve de todos;
 * 15. `welcome` — ocioso (o pedido de instalar/notificar decide sozinho se tem algo a dizer).
 */
export const PRESENTATION_ORDER = [
  'welcomeTour',
  'triage',
  'levelUp',
  'dailyReport',
  'buildingIntro',
  'mapTutorial',
  'catalogOnboarding',
  'dayGoals',
  'checkIn',
  'evolveTask',
  'groveMilestone',
  'dream',
  'nightmare',
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

export function isPresentationId(x: unknown): x is PresentationId {
  return typeof x === 'string' && (PRESENTATION_ORDER as readonly string[]).includes(x);
}

/** A posição na ordem (menor = mais urgente). Id desconhecido vai para o fim. */
export function presentationRank(id: PresentationId): number {
  return PRESENTATION_ORDER.indexOf(id);
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
): PresentationId {
  const ok = (id: PresentationId) => id !== PRESENTATION_IDLE && ready[id] === true && !failed.has(id);
  if (current !== null && !NON_STICKY.has(current) && ok(current)) return current;
  for (const id of PRESENTATION_ORDER) if (ok(id)) return id;
  return PRESENTATION_IDLE;
}

/** A fila de espera inteira, na ordem em que vão entrar (o `current` primeiro). Para teste, telemetria e o doc. */
export function presentationBacklog(
  ready: PresentationReady,
  current: PresentationId | null = null,
  failed: ReadonlySet<PresentationId> = NO_FAILED,
): PresentationId[] {
  const out: PresentationId[] = [];
  const first = pickPresentation(ready, current, failed);
  if (first === PRESENTATION_IDLE) return out;
  out.push(first);
  for (const id of PRESENTATION_ORDER) {
    if (id !== PRESENTATION_IDLE && id !== first && ready[id] === true && !failed.has(id)) out.push(id);
  }
  return out;
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
