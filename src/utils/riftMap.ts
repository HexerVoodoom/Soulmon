// 🗺️ O MAPA DE ANDARES DO RIFT INFINITO (pedido do dono, 16/11/2026 — REGISTRO §452).
//
// DONO ÚNICO e PURO do que o mapa mostra: um NÓ por CONJUNTO (`riftSets.ts`: 2 andares por elemento, 269 conjuntos = 538 andares, depois a
// lista dá a volta), o estado de cada nó (visitado/atual/bloqueado), o CAMINHO sinuoso entre eles (determinístico) e a regra de "voltar ao nó".
// Sem arte, sem relógio, sem `Math.random`: a tela (`components/rift/RiftMap.tsx`) e os testes leem o MESMO plano.
//
// REGRAS (decisões do dono + as que tomei onde ele não falou, marcadas com [decisão]):
//  · NÓ visitado = o 1º andar do conjunto ≤ `dungeonDepthRecord` (o recorde só sobe). Antes disso é BLOQUEADO (cinza, "?").
//  · NÓ atual = o conjunto do andar onde a descida está (`riftCurrentLayer`): a descida em andamento (`dungeonAway.layer`), senão o ponto de
//    largada (`dungeonResumeLayer` da volta, senão `startLayerFor(recorde)`). Depois do 538, a lista dá a volta: o atual cai no nó de novo.
//  · VOLTAR AO NÓ = `rewindToSet`: grava `dungeonResumeLayer` = 1º andar do conjunto (a descida recomeça dali, UMA vez: quem larga a descida
//    consome o campo). O recorde NÃO diminui; a energia gasta NÃO volta; nada é devolvido. Idempotente (mesmo nó = mesma referência).
//  · [decisão] Voltar vale para QUALQUER nó visitado, inclusive um POSTERIOR ao atual (recorde > atual): é "reposicionar", não só "recuar".
//  · [decisão] Voltar fica BLOQUEADO enquanto há descida em andamento (`dungeonAway`): o jogador a encerra pelo caminho de sempre
//    ("Retirar da Fenda") e então escolhe o nó. A luta em andamento nunca é cancelada daqui.
import { CAMADAS_POR_ELEMENTO, ELEMENTOS_DA_MASMORRA } from './dungeonElementos';
import { essenceComposition } from './elementDex';
import { DUNGEON_MAX_LAYER, sanitizeDepthRecord, startLayerFor, type DungeonAway } from './dungeonIdle';
import { RIFT_SET_COUNT, riftSetOfLayer, type RiftCount } from './riftSets';

/** O espaço vertical entre dois nós, em px (a tela posiciona por aqui; o tile do fundo tem 1920 de altura). */
export const RIFT_MAP_NODE_GAP = 132;
/** Folga acima do 1º nó e abaixo do último, em px. */
export const RIFT_MAP_PAD = 120;
/** A altura de uma repetição do fundo (px lógicos, tile 1080×1920 reduzido à largura da tela pela tela). */
export const RIFT_MAP_TILE_RATIO = 1920 / 1080;

export type RiftNodeState = 'visited' | 'current' | 'locked';

export interface RiftMapNode {
  /** 0-based: o conjunto (= `riftSetOfLayer(floors[0]).index`). */
  index: number;
  element: string;
  count: RiftCount;
  /** Os dois andares do conjunto, 1-based. */
  floors: readonly [number, number];
  /** O que o nó mostra ao lado do círculo: "1-2". */
  label: string;
  /** Os elementos base que compõem (1–4): o ícone próprio vem primeiro na tela; isto é a composição discreta de reserva. */
  components: readonly string[];
  state: RiftNodeState;
  /** x do centro do nó na largura (0..1), curva sinuosa determinística. */
  x: number;
  /** y do centro do nó em px a partir do topo do mapa. */
  y: number;
}

export interface RiftMapSave {
  dungeonDepthRecord?: number;
  dungeonAway?: Pick<DungeonAway, 'layer'> | null;
  /** O ponto de largada escolhido no mapa (1º andar de um conjunto). Opcional: ausente = `startLayerFor(recorde)`. */
  dungeonResumeLayer?: number;
}

/** Sanea o ponto de largada vindo do save/nuvem: inteiro ÍMPAR em [1, 999] (1º andar de um conjunto); o resto é "sem volta". */
export function sanitizeResumeLayer(raw: unknown): number | undefined {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
  const l = Math.floor(raw);
  if (l < 1 || l > DUNGEON_MAX_LAYER || (l - 1) % CAMADAS_POR_ELEMENTO !== 0) return undefined;
  return l;
}

/** De onde a PRÓXIMA descida larga: a volta escolhida no mapa, senão o ponto de retorno do recorde. Nunca passa do ponto de retorno. */
export function riftStartLayer(state: RiftMapSave | null | undefined): number {
  const base = startLayerFor(sanitizeDepthRecord(state?.dungeonDepthRecord));
  const resume = sanitizeResumeLayer(state?.dungeonResumeLayer);
  return resume !== undefined ? Math.min(resume, base) : base;
}

/** O andar onde o Soulmon está agora: a descida em andamento, ou o ponto de largada. */
export function riftCurrentLayer(state: RiftMapSave | null | undefined): number {
  const away = state?.dungeonAway;
  if (away && typeof away.layer === 'number' && Number.isFinite(away.layer)) return Math.min(DUNGEON_MAX_LAYER, Math.max(1, Math.floor(away.layer)));
  return riftStartLayer(state);
}

/** O 1º andar do conjunto `index` (1-based). */
export const firstFloorOfSet = (index: number): number => 1 + CAMADAS_POR_ELEMENTO * Math.max(0, Math.floor(index));

/** x do nó `index` (0..1): seno com fase por índice, dentro de uma faixa segura (nunca encosta na borda nem no número). Determinístico. */
export function riftNodeX(index: number): number {
  const i = Math.max(0, Math.floor(index));
  return 0.5 + 0.26 * Math.sin(i * 0.83 + Math.sin(i * 0.31) * 1.6);
}

/** y do nó `index` em px (o 1º nó em cima; a descida vai para baixo). */
export const riftNodeY = (index: number): number => RIFT_MAP_PAD + Math.max(0, Math.floor(index)) * RIFT_MAP_NODE_GAP;

/** A altura total do mapa em px (um ciclo de conjuntos + folgas). */
export const RIFT_MAP_HEIGHT = RIFT_MAP_PAD * 2 + (RIFT_SET_COUNT - 1) * RIFT_MAP_NODE_GAP;

/** O estado do nó `index` para o save. */
export function riftNodeState(index: number, state: RiftMapSave | null | undefined): RiftNodeState {
  const cur = riftSetOfLayer(riftCurrentLayer(state)).index;
  if (index === cur) return 'current';
  return firstFloorOfSet(index) <= sanitizeDepthRecord(state?.dungeonDepthRecord) ? 'visited' : 'locked';
}

/** O nó `index` com tudo que a tela precisa. */
export function riftMapNode(index: number, state: RiftMapSave | null | undefined): RiftMapNode {
  const i = Math.min(RIFT_SET_COUNT - 1, Math.max(0, Math.floor(index)));
  const a = firstFloorOfSet(i);
  const element = ELEMENTOS_DA_MASMORRA[i];
  const set = riftSetOfLayer(a);
  return {
    index: i, element, count: set.count, floors: [a, a + CAMADAS_POR_ELEMENTO - 1], label: `${a}-${a + CAMADAS_POR_ELEMENTO - 1}`,
    components: essenceComposition(element) ?? [element], state: riftNodeState(i, state), x: riftNodeX(i), y: riftNodeY(i),
  };
}

/** Os nós de `from` a `to` (inclusive) — a tela monta só a janela visível, nunca os 269 de uma vez. */
export function riftMapWindow(state: RiftMapSave | null | undefined, from: number, to: number): RiftMapNode[] {
  const lo = Math.max(0, Math.floor(from));
  const hi = Math.min(RIFT_SET_COUNT - 1, Math.floor(to));
  const out: RiftMapNode[] = [];
  for (let i = lo; i <= hi; i++) out.push(riftMapNode(i, state));
  return out;
}

/** O intervalo de nós que cruza a janela vertical [top, top + height] (com folga de `over` nós de cada lado). */
export function riftVisibleRange(top: number, height: number, over = 3): { from: number; to: number } {
  const first = Math.floor((top - RIFT_MAP_PAD) / RIFT_MAP_NODE_GAP);
  const last = Math.ceil((top + height - RIFT_MAP_PAD) / RIFT_MAP_NODE_GAP);
  return { from: Math.max(0, first - over), to: Math.min(RIFT_SET_COUNT - 1, last + over) };
}

/** O scrollTop que centra o nó `index` numa janela de `viewH` px. */
export const riftScrollTopFor = (index: number, viewH: number): number => Math.max(0, Math.round(riftNodeY(index) - viewH / 2));

/** O trecho tracejado do nó `index` ao seguinte, como `d` de SVG numa largura `w`: curva suave (não precisa ser reta). `undefined` no último. */
export function riftSegmentPath(index: number, w: number): string | undefined {
  const i = Math.floor(index);
  if (i < 0 || i >= RIFT_SET_COUNT - 1) return undefined;
  const x0 = riftNodeX(i) * w, y0 = riftNodeY(i), x1 = riftNodeX(i + 1) * w, y1 = riftNodeY(i + 1);
  const ym = (y0 + y1) / 2;
  const r = (n: number) => Math.round(n * 10) / 10;
  return `M ${r(x0)} ${r(y0)} C ${r(x0)} ${r(ym)}, ${r(x1)} ${r(ym)}, ${r(x1)} ${r(y1)}`;
}

/** O trecho `index → index+1` já foi percorrido (o nó de chegada é visitado/atual)? Pinta de turquesa; senão, cinza. */
export const riftSegmentReached = (index: number, state: RiftMapSave | null | undefined): boolean => riftNodeState(index + 1, state) !== 'locked';

export type RiftRewindRefusal = 'busy' | 'locked' | 'invalid';

/** Por que NÃO dá para voltar ao nó `index` agora (`undefined` = dá). */
export function riftRewindRefusal(state: RiftMapSave | null | undefined, index: number): RiftRewindRefusal | undefined {
  if (!Number.isInteger(index) || index < 0 || index >= RIFT_SET_COUNT) return 'invalid';
  if (state?.dungeonAway) return 'busy';
  if (riftNodeState(index, state) === 'locked') return 'locked';
  return undefined;
}

/**
 * VOLTAR AO NÓ: a descida passa a largar do 1º andar do conjunto `index`. Recusa (`busy`/`locked`/`invalid`) devolve a MESMA referência;
 * o mesmo nó de novo também (idempotente). NÃO mexe em recorde, energia, HP nem em descida alguma.
 */
export function rewindToSet<T extends RiftMapSave>(prev: T, index: number): T {
  if (riftRewindRefusal(prev, index)) return prev;
  const a = firstFloorOfSet(index);
  if (riftStartLayer(prev) === a) return prev;
  return { ...prev, dungeonResumeLayer: a };
}

/** A descida largou do ponto escolhido: o campo é consumido (o recorde volta a mandar na próxima). Sem campo, a mesma referência. */
export function consumeResume<T extends RiftMapSave>(prev: T): T {
  if (prev.dungeonResumeLayer === undefined) return prev;
  return { ...prev, dungeonResumeLayer: undefined };
}
