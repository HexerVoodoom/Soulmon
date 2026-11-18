import { registerPlugin } from '@capacitor/core';
import { soulmonDisplayName } from '../utils/petName';
import { spriteLineOf, CORVO_LINE, type CorvoCarrier } from '../utils/corvoPet';
import { resolveArtLineId, isStarterId, type StarterId } from '../utils/sprites';
import { isSafeSpriteUrl } from '../utils/spriteLibrary';
import { visibleBackground } from '../utils/backgrounds';
import { groveStageAt, type GroveLocal } from '../utils/groveLocal';
import { GROVE_STAGES, type GroveStageId } from '../utils/guildRules';
import { activitiesForWeekDay, habitWeightOf } from '../utils/dailyReset';
import { hiddenForDayKey, type DayPlan } from '../utils/dayPlan';
import { focusTasks, parseDayValue, taskStatus, type TriageTask } from '../utils/taskTriage';
import { activityDoneOn } from '../hooks/useProgressTracking';
import type { PlayerDayAnchor } from '../utils/playerDay';

/**
 * O nome que vai para `pet_name` no widget — e é o MESMO da Home.
 *
 * ⚠️ Até 22/09/2026 o `App.tsx` mandava o ESTÁGIO capitalizado ("Rookie",
 * "Champion") enquanto o app inteiro exibe `soulmonDisplayName` — a criatura
 * chamada "Pyraka" na Home aparecia como "Rookie" nos widgets A, B e D.
 * Footgun 9 (regra copiada): o nome tem dono (`utils/petName.ts`) e o bridge
 * tinha reimplementado "nome = estágio". Quem chama o bridge passa por aqui;
 * `widgetNome.contract.test.ts` trava o `App.tsx` nisso.
 */
export function widgetPetName(meta?: { baseName?: string; petName?: string } | null): string {
  return soulmonDisplayName(meta) || 'Soulmon';
}

/**
 * `pet_line` do widget: `'corvo'`, o id de um dos 5 INICIAIS (`STARTER_IDS`) ou vazio.
 * 20/10/2026 (§138): a árvore genérica do gato-coruja saiu do Android como já saíra do app web
 * (D-104); o widget mostra o sprite do PRÓPRIO jogador pela mesma regra de `getSpriteForStage`
 * (`resolveArtLineId`: linha aposentada vira o inicial de reserva). Vazio = sem linha de arte
 * que o widget conheça (linhas legadas, save sem `demoCharacterId`): o plugin REMOVE a chave e o
 * Kotlin cai num inicial por hash do estágio (`fallbackStarterFor`). Widget antigo (APK velho)
 * só aceita `'corvo'` e ignora o resto: compatível. Dono da linha: `spriteLineOf` (corvoPet).
 */
export function widgetPetLine(state: CorvoCarrier): '' | typeof CORVO_LINE | StarterId {
  const line = resolveArtLineId(spriteLineOf(state));
  if (line === CORVO_LINE) return CORVO_LINE;
  return isStarterId(line) ? line : '';
}

/**
 * O sprite PRÓPRIO que o widget copia (a criatura que o jogador vê na Home), ou `''`.
 * Só `https:` / `data:image` (asset empacotado do Vite — caminho de raiz — não é "próprio": o widget já
 * tem os iniciais e o corvo). Corvo (arte fixa) também vai vazio. O Kotlin refaz a allowlist de host.
 * Antes disto o widget mostrava o inicial por hash ("Crato") a quem tinha criatura gerada.
 */
export function widgetOwnSpriteUrl(url: string | undefined | null, isCorvoPet: boolean): string {
  if (isCorvoPet || typeof url !== 'string') return '';
  const limpa = url.trim();
  // O sprite GERADO do jogador mora no nosso Worker: `/api/sprite-image?k=<32hex>` (caminho de raiz). Era o caso comum e o
  // filtro só aceitava https, então o widget NUNCA recebia a criatura gerada (bug de 09/11/2026). Vira URL absoluta do app.
  const proprio = /^(?:https?:\/\/[^/]+)?(\/api\/sprite-image\?k=[0-9a-f]{32})$/i.exec(limpa);
  if (proprio) return WIDGET_APP_ORIGIN + proprio[1];
  return isSafeSpriteUrl(limpa) ? limpa : '';
}

/** `vpetBg` do widget: o cenário equipado que o app DESENHA (`visibleBackground`) ou `''`. */
export function widgetBgId(equipped: string | null | undefined): string {
  return visibleBackground(equipped) ?? '';
}

/** Origem do app (a mesma de `capacitor.config` › `server.url`); o Kotlin só baixa dela o caminho `/api/sprite-image`. */
export const WIDGET_APP_ORIGIN = 'https://soulmon.mateus-sprnd.workers.dev';

/**
 * `grove_stage` do widget: o id do ÚLTIMO estágio do Bosque que este aparelho
 * viu (`groveLocal`), ou vazio. Nunca contagem, nunca presença, nunca membros —
 * só o nome do lugar. O `pending` conta como visto (a memória já o registrou).
 */
export function widgetGroveStage(local: GroveLocal | null): '' | GroveStageId {
  if (!local) return '';
  const idx = Math.max(local.index, local.pending?.index ?? 0);
  const id = groveStageAt(idx);
  return id && (GROVE_STAGES as readonly string[]).includes(id) ? id : '';
}

/** Teto do nome no widget: o layout corta com reticências; isto só evita mandar um texto enorme. */
const WIDGET_TASK_NAME_MAX = 60;

export interface WidgetTaskState {
  evolutionStage: string;
  tasks: TriageTask[];
  activities: Array<{ id?: string; name?: string; steps?: Array<{ completed: boolean }>; completedToday?: boolean; lastCompletedDate?: string; weekDays?: number[] }>;
  dayPlan?: DayPlan;
  playerDayTz?: PlayerDayAnchor;
}

/**
 * `next_task` do widget (REGISTRO §221): o nome do que ainda falta hoje, ou vazio.
 *
 * Vazio com a META cumprida, mesmo com itens sobrando: a meta do dia é o combinado
 * (`dailyGoalFor`), e apontar o item 7 para quem fez os 6 da meta é a cobrança que o
 * `useProgressTracking` já tirou do widget. Ordem: foco de hoje, hábitos do dia, tarefas
 * abertas. Tarefa adiada para outro dia (`startDate` futuro) não aparece.
 */
export function widgetNextTask(state: WidgetTaskState, now: Date, done: number, goal: number): string {
  if (goal <= 0 || done >= goal) return '';
  const dayKey = now.toDateString();
  const hidden = hiddenForDayKey(state.dayPlan, dayKey, state.playerDayTz);
  const startOfTomorrow = widgetDayEndsAt(now);
  const tasks = state.tasks.filter(t => {
    if (t.completed || taskStatus(t) !== 'open' || hidden.has(String(t.id))) return false;
    const start = t.startDate ? parseDayValue(t.startDate) : null;
    return !start || start.getTime() < startOfTomorrow;
  });
  const habits = (activitiesForWeekDay(state as never, now.getDay(), dayKey) as WidgetTaskState['activities'])
    .filter(a => habitWeightOf(a as never) > 0 && !activityDoneOn({ ...a, steps: a.steps ?? [] }, dayKey));
  const next = [...focusTasks(tasks, dayKey), ...habits, ...tasks]
    .map(item => (item.name ?? '').replace(/\s+/g, ' ').trim())
    .find(Boolean);
  return next ? next.slice(0, WIDGET_TASK_NAME_MAX) : '';
}

/** Teto da lista do widget grande da Home (o Kotlin corta de novo) e do nome de cada linha. */
export const WIDGET_TASK_LIST_MAX = 12;
const WIDGET_TASK_LINE_MAX = 40;

/** Uma linha da lista do widget grande da Home: id, nome curto, feita ou não. Nunca peso, prazo ou recompensa. */
export interface WidgetTaskItem { id: string; name: string; done: boolean }

/**
 * `tasksJson` do widget grande da Home (18/11/2026): as tarefas avulsas DE HOJE, abertas primeiro (o foco do dia na
 * frente, como no `widgetNextTask`) e depois as concluídas hoje (riscadas). Mesmo filtro do `widgetNextTask`: adiada
 * para outro dia ou escondida no plano do dia não entra. Hábitos ficam de fora (o check do widget só conclui TAREFA).
 */
export function widgetTaskList(
  state: Pick<WidgetTaskState, 'tasks' | 'dayPlan' | 'playerDayTz'> & { completedTasks?: Array<{ id?: string; name?: string; completedAt?: string }> },
  now: Date,
): WidgetTaskItem[] {
  const dayKey = now.toDateString();
  const hidden = hiddenForDayKey(state.dayPlan, dayKey, state.playerDayTz);
  const startOfTomorrow = widgetDayEndsAt(now);
  const linha = (n?: string) => (n ?? '').replace(/\s+/g, ' ').trim().slice(0, WIDGET_TASK_LINE_MAX);
  const hoje = (state.tasks ?? []).filter(t => {
    if (taskStatus(t) !== 'open' || hidden.has(String(t.id))) return false;
    const start = t.startDate ? parseDayValue(t.startDate) : null;
    return !start || start.getTime() < startOfTomorrow;
  });
  const abertas = [...focusTasks(hoje, dayKey), ...hoje].filter((t, i, a) => a.findIndex(x => x.id === t.id) === i);
  const itens: WidgetTaskItem[] = abertas
    .map(t => ({ id: String(t.id), name: linha(t.name), done: t.completed === true }))
    .sort((a, b) => Number(a.done) - Number(b.done));
  const feitasHoje = (state.completedTasks ?? [])
    .filter(c => typeof c.id === 'string' && c.completedAt && new Date(c.completedAt).toDateString() === dayKey)
    .map(c => ({ id: String(c.id), name: linha(c.name), done: true }));
  return [...itens, ...feitasHoje]
    .filter((t, i, a) => t.name && a.findIndex(x => x.id === t.id) === i)
    .slice(0, WIDGET_TASK_LIST_MAX);
}

/** A próxima meia-noite do aparelho: o mesmo dia de `useProgressTracking` (`toDateString`). */
export function widgetDayEndsAt(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
}

export interface DigiWidgetData {
  petName: string;
  currentStage: string;
  eggType: string;
  branchType: string;
  completedTasks: number;
  totalTasks: number;
  hp: number;
  healthPoints: number;
  maxHealthPoints: number;
  energyPoints: number;
  /** True while there's poop on screen that hasn't been cleaned. */
  hasPoop: boolean;
  /* ── WP2.6 — o widget passa a saber de HÁBITO ──────────────────────────
     Ele recebia só tarefas do dia, HP e energia: o motor de constância — a
     peça mais central do produto — era invisível na única superfície que a
     pessoa vê sem abrir o app. As chaves do bridge são CONGELADAS (só se
     acrescenta), então nada aqui renomeia nada.
     Todos opcionais: um app novo falando com um widget velho, ou o contrário,
     não pode quebrar. E `-1`/ausente é "não informado", que é diferente de
     zero — mostrar 0% a quem ainda não tem histórico é a mesma mentira que a
     constância dotada existe para evitar. */
  /**
   * O ritmo está firme? **Uma FAIXA, nunca o percentual.**
   *
   * ⚠️ Aqui existiam quatro campos e a auditoria de 06/09/2026 tirou três
   * (`constancyPct`, `shields`, `bondLevel`) e não substituiu um deles.
   * `shields` e `bondLevel` eram escritos e **nunca lidos** pelo renderer —
   * carga morta —, e os dois primeiros são exatamente o que a spec do dossiê
   * VETOU na tela inicial: percentual cru é linha vermelha do produto, e
   * escudo exposto na home é o `Streak saves 0` do Alma, que transforma a
   * proteção silenciosa em placar.
   *
   * A faixa fica porque o comportamento bom que o número servia — o widget ter
   * algo a dizer num dia sem tarefa — não depende do número. `undefined` =
   * sem histórico, que é diferente de "não está firme".
   */
  habitSteady?: boolean;
  /** Maior marco de hábito atingido (0 = semente … 3 = árvore). */
  habitTierMax?: number;
  /** Alguma coisa faltou 2× seguidas — o widget oferece a versão de 5 min. */
  needsIntervention?: boolean;
  /** `'corvo'`, id de inicial ou `''` (vazio = o plugin remove `pet_line`). Ver `widgetPetLine`. */
  petLine?: '' | typeof CORVO_LINE | StarterId;
  /** Sprite PRÓPRIO do jogador (https ou data:image) ou `''` (vazio = o widget volta ao inicial). Ver `widgetOwnSpriteUrl`. */
  petSpriteUrl?: string;
  /** Id do estágio do Bosque ou `''` (vazio = o plugin remove `grove_stage`). Ver `widgetGroveStage`. */
  groveStage?: '' | GroveStageId;
  /* REGISTRO §221, widget redimensionável. Opcionais: APK velho ignora; ausente = o plugin remove. */
  /** Instante (ms) em que a fome passa a contar. Ausente = sem registro de fome. Ver `hungryFrom`. */
  hungryAtMs?: number;
  /** Instante (ms) em que a fome cai abaixo de "mediano" (osso). Ausente = sem registro. Ver `starvingSince`. V-Pet: comida em 3 estados. */
  starvingAtMs?: number;
  /** Teto de energia do estagio (`maxEnergyOf`), para o raio do V-Pet (escuro/metade/cheio). */
  maxEnergyPoints?: number;
  /** O que falta hoje, ou vazio. Ver `widgetNextTask`. */
  nextTaskName?: string;
  /** Até quando `nextTaskName` e o placar do dia valem. Ver `widgetDayEndsAt`. */
  dayEndsAtMs?: number;
  /** Moldura do widget V-Pet: id de elemento base ou `''` (= casco padrão; o plugin remove a chave). Ver `utils/widgetFrames.ts`. */
  vpetFrame?: string;
  /** Z de sono do V-Pet: `true` = dormindo (Z aceso), ausente/`false` = acordado (Z apagado). Chave nova; APK antigo ignora. Só estado, nunca contagem. */
  petSleeping?: boolean;
  /** Id do cenário equipado (`bg-...`) para o fundo do LCD do V-Pet, ou `''`. O Kotlin só usa se houver miniatura `vpet_bg_<id>` no APK. */
  vpetBg?: string;
  /** Widget grande da Home: `JSON.stringify(widgetTaskList(...))`. Chave NOVA; APK antigo ignora; ausente = o plugin remove. */
  tasksJson?: string;
}

export interface SoulmonWidgetPlugin {
  updateWidgetData(data: DigiWidgetData): Promise<void>;
  /**
   * Beta12 (A1): pede ao Android que sincronize o manifesto de molduras do widget (`/widget-frames/manifest.json`, servido pelo
   * Worker). Sem argumentos de proposito: a URL e constante nativa, a web nao manda URL. Resolve de imediato; o download corre
   * em segundo plano, no maximo 1x por hora. No APK anterior o metodo nao existe (rejeita): quem chama engole o erro.
   */
  syncWidgetFrames(): Promise<void>;
  /**
   * Widget grande da Home (18/11/2026): LÊ a fila de checks do widget sem apagar (`peek`). Apagar é `ackWidgetEvents`,
   * só depois de o app aplicar e gravar. APK anterior não tem o método (rejeita): use `readWidgetEvents`, que trata isso.
   */
  peekWidgetEvents(): Promise<{ events: unknown }>;
  /** Apaga da fila os eventos já aplicados (por `eid`). Idempotente: `eid` que não está lá é ignorado. */
  ackWidgetEvents(options: { eids: string[] }): Promise<void>;
}

const SoulmonWidget = registerPlugin<SoulmonWidgetPlugin>('SoulmonWidget', {
  // No-op web implementation — widget only exists on Android
  web: {
    async updateWidgetData() {},
    async syncWidgetFrames() {},
    async peekWidgetEvents() { return { events: [] }; },
    async ackWidgetEvents() {},
  },
});

export { SoulmonWidget };

/**
 * A fila do widget, ou `null` quando ESTE APK não tem o recurso (método ausente = APK anterior ao widget da Home; a regra 5
 * de Compatibilidade: a web publicada fala com APKs velhos). `null` ≠ fila vazia: sem recurso, ninguém chama o `ack`.
 */
export async function readWidgetEvents(plugin: Pick<SoulmonWidgetPlugin, 'peekWidgetEvents'> = SoulmonWidget): Promise<unknown[] | null> {
  try {
    const r = await plugin.peekWidgetEvents();
    return Array.isArray(r?.events) ? r.events : [];
  } catch {
    return null;
  }
}

/** `ack` que nunca lança (APK sem o método, plugin ausente): o pior caso é reler os mesmos eventos, que é no-op. */
export async function ackWidgetEvents(eids: string[], plugin: Pick<SoulmonWidgetPlugin, 'ackWidgetEvents'> = SoulmonWidget): Promise<void> {
  if (eids.length === 0) return;
  try { await plugin.ackWidgetEvents({ eids }); } catch { /* sem recurso: no-op */ }
}
