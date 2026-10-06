/**
 * Combate v3 / PR7 — a árvore de talentos do USUÁRIO (o Vínculo é o level dele).
 *
 * Dono único. 1 ponto por Vínculo (`talentPointsFor`), gasto numa árvore de três caminhos (PvP, PvE,
 * Comércio) que NUNCA dá para completar: o custo dos nós pegáveis passa de `TALENT_POINTS_MAX`
 * (teste lê os dois daqui). Persistido SÓ `talentPicks: string[]` (um id por grau comprado); o
 * resto é derivado. Servidor espelha em `functions/api/_talents.js` (`talents.parity.test.js`).
 *
 * Regras que não se negociam:
 *  · O que o talento dá em COMBATE entra pelo canal único `combate/bonus.ts` (`combinedBonus`), com
 *    TETO ÚNICO de 5% somando talento+equipamento+Comércio+Renascimento. Aqui só se calcula a
 *    parcela do talento (`talentBonus`); quem soma e corta é `combinedBonus`.
 *  · O Comércio mexe só em preço e ganho de moeda GANHA, nunca em % de combate.
 *  · Dinheiro real nunca compra ponto, grau nem o %. Respec é SEMPRE pago, em moeda ganha (Bits).
 *  · Vetor inválido é DESCARTADO (volta a `[]`), nunca "corrigido": quem forja não escolhe o que sobra.
 *  · Os talentos sobrevivem à degeneração do Soulmon (o Vínculo nunca desce).
 *
 * FORA, à espera do dono (linha vermelha, NÃO implementados): `tal-pvp-05` (torcida +% / câmbio) e
 * `tal-com-05` (conveniência de câmbio). Ver `TALENTOS_PENDENTES_DO_DONO`.
 *
 * Módulo PURO: sem React, sem relógio, sem localStorage.
 */

export type TalentPath = 'pvp' | 'pve' | 'comercio';

export type TalentEffect =
  /** Soma `perRank × grau` ao canal de bônus de combate do `scope`. Só PvP no Duelo; só PvE nas lutas da fenda. */
  | { readonly kind: 'combatBonus'; readonly scope: 'pvp' | 'pve'; readonly perRank: number }
  /** Reduz o custo do respec em `perRank × grau` (Comércio: só moeda). */
  | { readonly kind: 'respecDiscount'; readonly perRank: number }
  /** O efeito depende de um gancho que ainda não existe (motor/PR8). O nó aparece, mas não se compra. */
  | { readonly kind: 'pendente' };

export interface TalentNode {
  readonly id: string;
  readonly path: TalentPath;
  /** Só visual (fileira da árvore). */
  readonly tier: 1 | 2 | 3;
  readonly maxRank: number;
  readonly effect: TalentEffect;
  readonly namePt: string;
  readonly nameEn: string;
  readonly descPt: string;
  readonly descEn: string;
}

/** Teto de pontos de talento: o Vínculo acima disto não rende ponto novo (a árvore tem de ficar maior que isto). */
export const TALENT_POINTS_MAX = 20;

/** Passo de cada grau dos nós de combate (fração; 0,004 = 0,4%). Os graus de um caminho cabem nos 5%. */
const PVP_STEP = 0.004;
const PVE_STEP = 0.006;
const RESPEC_STEP = 0.1;

const pct = (f: number, pt: boolean) => `${(f * 100).toFixed(1).replace(/\.0$/, '').replace('.', pt ? ',' : '.')}%`;
const dpt = (f: number, onde: string) => `${onde}: ${pct(f, true)} por grau, dentro do teto único de 5%.`;
const den = (f: number, where: string) => `${where}: ${pct(f, false)} per rank, inside the single 5% cap.`;
const SOON_ENGINE_PT = 'Chega com o gancho do motor.';
const SOON_ENGINE_EN = 'Arrives with the engine hook.';

export const TALENT_TREE: readonly TalentNode[] = [
  // ── PvP ──────────────────────────────────────────────────────────────────
  { id: 'tal-pvp-01', path: 'pvp', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pvp', perRank: PVP_STEP },
    namePt: 'Ponta de lança', nameEn: 'Spearpoint', descPt: dpt(PVP_STEP, 'Mais dano no Duelo'), descEn: den(PVP_STEP, 'More damage in the Duel') },
  { id: 'tal-pvp-02', path: 'pvp', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pvp', perRank: PVP_STEP },
    namePt: 'Braçadeira', nameEn: 'Bracer', descPt: dpt(PVP_STEP, 'Mais firmeza no Duelo'), descEn: den(PVP_STEP, 'More steadiness in the Duel') },
  { id: 'tal-pvp-03', path: 'pvp', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pvp', perRank: PVP_STEP },
    namePt: 'Investida', nameEn: 'Charge', descPt: dpt(PVP_STEP, 'Mais ímpeto no Duelo'), descEn: den(PVP_STEP, 'More drive in the Duel') },
  { id: 'tal-pvp-04', path: 'pvp', tier: 2, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Faísca inicial', nameEn: 'Starting spark',
    descPt: `A luta começa com parte da energia do especial. ${SOON_ENGINE_PT}`, descEn: `The fight starts with part of the special energy. ${SOON_ENGINE_EN}` },
  { id: 'tal-pvp-06', path: 'pvp', tier: 2, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Brasa abafada', nameEn: 'Smothered ember',
    descPt: `Menos dano de efeito contínuo. ${SOON_ENGINE_PT}`, descEn: `Less damage from over-time effects. ${SOON_ENGINE_EN}` },
  { id: 'tal-pvp-07', path: 'pvp', tier: 3, maxRank: 1, effect: { kind: 'pendente' },
    namePt: 'Coroa do duelista', nameEn: "Duelist's crown", descPt: `+1 turno de reforço. ${SOON_ENGINE_PT}`, descEn: `+1 buff turn. ${SOON_ENGINE_EN}` },
  // ── PvE ──────────────────────────────────────────────────────────────────
  { id: 'tal-pve-01', path: 'pve', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pve', perRank: PVE_STEP },
    namePt: 'Garra da fenda', nameEn: 'Rift claw',
    descPt: dpt(PVE_STEP, 'Mais dano na Arena, na Masmorra e no Pesadelo'), descEn: den(PVE_STEP, 'More damage in the Arena, Dungeon and Nightmare') },
  { id: 'tal-pve-02', path: 'pve', tier: 1, maxRank: 4, effect: { kind: 'combatBonus', scope: 'pve', perRank: PVE_STEP },
    namePt: 'Muro da fenda', nameEn: 'Rift wall',
    descPt: dpt(PVE_STEP, 'Mais firmeza na Arena, na Masmorra e no Pesadelo'), descEn: den(PVE_STEP, 'More steadiness in the Arena, Dungeon and Nightmare') },
  { id: 'tal-pve-03', path: 'pve', tier: 2, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Gota subindo', nameEn: 'Rising droplet', descPt: `Mais cura recebida. ${SOON_ENGINE_PT}`, descEn: `More healing received. ${SOON_ENGINE_EN}` },
  { id: 'tal-pve-04', path: 'pve', tier: 2, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Agulha de bússola', nameEn: 'Compass needle', descPt: 'Mais Bits da fenda. Chega com o gancho da economia.', descEn: 'More rift Bits. Arrives with the economy hook.' },
  { id: 'tal-pve-05', path: 'pve', tier: 2, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Lua com olho', nameEn: 'Eyed moon', descPt: `Mais força contra o Pesadelo. ${SOON_ENGINE_PT}`, descEn: `More strength against the Nightmare. ${SOON_ENGINE_EN}` },
  { id: 'tal-pve-06', path: 'pve', tier: 2, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Arco de luz', nameEn: 'Arc of light', descPt: `Escudo do especial mais forte. ${SOON_ENGINE_PT}`, descEn: `Stronger special shield. ${SOON_ENGINE_EN}` },
  { id: 'tal-pve-07', path: 'pve', tier: 3, maxRank: 1, effect: { kind: 'pendente' },
    namePt: 'Arco coroado', nameEn: 'Crowned arc', descPt: `Começa a luta com um escudo leve. ${SOON_ENGINE_PT}`, descEn: `Starts the fight with a light shield. ${SOON_ENGINE_EN}` },
  // ── Comércio (só preço e ganho de moeda GANHA; nunca % de combate) ──────
  { id: 'tal-com-01', path: 'comercio', tier: 1, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Etiqueta', nameEn: 'Price tag', descPt: 'Equipamento mais barato. Chega com o equipamento.', descEn: 'Cheaper equipment. Arrives with equipment.' },
  { id: 'tal-com-02', path: 'comercio', tier: 1, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Fragmentos', nameEn: 'Fragments', descPt: 'Mais fragmentos. Chega com o equipamento.', descEn: 'More fragments. Arrives with equipment.' },
  { id: 'tal-com-03', path: 'comercio', tier: 1, maxRank: 4, effect: { kind: 'respecDiscount', perRank: RESPEC_STEP },
    namePt: 'Ampulheta de moeda', nameEn: 'Coin hourglass',
    descPt: `Refazer a árvore custa ${Math.round(RESPEC_STEP * 100)}% menos por grau. É preço, não combate.`,
    descEn: `Rebuilding the tree costs ${Math.round(RESPEC_STEP * 100)}% less per rank. It is price, not combat.` },
  { id: 'tal-com-04', path: 'comercio', tier: 2, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Bolsa com alça', nameEn: 'Strapped pouch', descPt: '+1 espaço na mochila. Chega com o equipamento.', descEn: '+1 pack slot. Arrives with equipment.' },
  { id: 'tal-com-06', path: 'comercio', tier: 2, maxRank: 3, effect: { kind: 'pendente' },
    namePt: 'Pergaminho enrolado', nameEn: 'Rolled scroll', descPt: 'Mais Bits nas missões. Chega com o gancho da economia.', descEn: 'More Bits from missions. Arrives with the economy hook.' },
  { id: 'tal-com-07', path: 'comercio', tier: 3, maxRank: 1, effect: { kind: 'pendente' },
    namePt: 'Moeda coroada', nameEn: 'Crowned coin', descPt: 'Desconto rotativo fixo. Chega com o equipamento.', descEn: 'A fixed rotating discount. Arrives with equipment.' },
];

/** Os dois talentos que tocam linha vermelha. NÃO existem na árvore até o dono decidir. */
export const TALENTOS_PENDENTES_DO_DONO: readonly { id: string; motivo: string }[] = [
  { id: 'tal-pvp-05', motivo: 'câmbio pago / torcida fora da régua: encosta em "Créditos não compram atributo"' },
  { id: 'tal-com-05', motivo: 'torcida fora da régua de ±25%: encosta no teto de +25% dos Créditos' },
];

export const TALENT_BY_ID: ReadonlyMap<string, TalentNode> = new Map(TALENT_TREE.map((n) => [n.id, n]));

/** Só os nós com efeito ligado se compram. */
export function isPickable(node: TalentNode): boolean {
  return node.effect.kind !== 'pendente';
}

/** O custo (em pontos) de tudo o que dá para comprar hoje: grau a grau, 1 ponto cada. */
export function pickableTreeCost(): number {
  return TALENT_TREE.filter(isPickable).reduce((s, n) => s + n.maxRank, 0);
}

/** O custo de TODA a árvore (nós ainda sem efeito incluídos). */
export function fullTreeCost(): number {
  return TALENT_TREE.reduce((s, n) => s + n.maxRank, 0);
}

function levelOf(n: unknown): number {
  return typeof n === 'number' && Number.isFinite(n) ? Math.max(1, Math.floor(n)) : 1;
}

/** 1 ponto por Vínculo, até `TALENT_POINTS_MAX`. */
export function talentPointsFor(bondLevel: unknown): number {
  return Math.min(TALENT_POINTS_MAX, levelOf(bondLevel));
}

/** Graus comprados por nó. */
export function ranksOf(picks: readonly string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of picks) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

/**
 * O vetor é VÁLIDO para este Vínculo? Todos são strings de nós pegáveis, nenhum passa do grau
 * máximo e o total não passa dos pontos do level.
 */
export function isValidPicks(raw: unknown, bondLevel: unknown): raw is string[] {
  if (!Array.isArray(raw)) return false;
  if (raw.length > talentPointsFor(bondLevel)) return false;
  const counts = new Map<string, number>();
  for (const id of raw) {
    if (typeof id !== 'string') return false;
    const node = TALENT_BY_ID.get(id);
    if (!node || !isPickable(node)) return false;
    const c = (counts.get(id) ?? 0) + 1;
    if (c > node.maxRank) return false;
    counts.set(id, c);
  }
  return true;
}

/** Vetor inválido é DESCARTADO (`[]`), nunca corrigido. */
export function sanitizeTalentPicks(raw: unknown, bondLevel: unknown): string[] {
  return isValidPicks(raw, bondLevel) ? [...raw] : [];
}

export function pointsLeft(picks: readonly string[], bondLevel: unknown): number {
  return Math.max(0, talentPointsFor(bondLevel) - picks.length);
}

/** Dá para comprar +1 grau de `id`? */
export function canPick(picks: readonly string[], id: string, bondLevel: unknown): boolean {
  return isValidPicks([...picks, id], bondLevel);
}

/** +1 grau de `id`, ou o MESMO vetor se não der (nunca lança). */
export function pickTalent(picks: readonly string[], id: string, bondLevel: unknown): readonly string[] {
  return canPick(picks, id, bondLevel) ? [...picks, id] : picks;
}

/**
 * A parcela do TALENTO no canal de bônus de combate, para o `scope`. Vetor inválido para o Vínculo
 * vale 0. É uma FRAÇÃO (0,05 = 5%). Quem a soma com equipamento/Comércio/Renascimento e corta nos 5%
 * é `combate/bonus.ts › combinedBonus`: nenhum consumidor soma por conta própria.
 */
export function talentBonus(picks: unknown, bondLevel: unknown, scope: 'pvp' | 'pve'): number {
  if (!isValidPicks(picks, bondLevel)) return 0;
  let sum = 0;
  for (const [id, rank] of ranksOf(picks)) {
    const e = TALENT_BY_ID.get(id)!.effect;
    if (e.kind === 'combatBonus' && e.scope === scope) sum += e.perRank * rank;
  }
  return sum;
}

// ── Respec: SEMPRE pago, em moeda GANHA (Bits) ──────────────────────────────

/** Bits por ponto gasto (default da squad; o dono não fixou o valor). */
export const RESPEC_COST_PER_POINT = 25;

/** Desconto do Comércio (fração em [0, 0,6]); só quem tem o nó. */
export function respecDiscount(picks: readonly string[]): number {
  let d = 0;
  for (const [id, rank] of ranksOf(picks)) {
    const e = TALENT_BY_ID.get(id)?.effect;
    if (e?.kind === 'respecDiscount') d += e.perRank * rank;
  }
  return Math.min(0.6, d);
}

/** Custo em Bits de refazer a árvore. 0 só quando não há nada a refazer (nunca de graça com picks). */
export function respecCost(picks: readonly string[]): number {
  if (picks.length === 0) return 0;
  return Math.max(1, Math.ceil(picks.length * RESPEC_COST_PER_POINT * (1 - respecDiscount(picks))));
}

export interface RespecState {
  talentPicks?: string[];
  gamePoints: number;
}

export type RespecResult<T> = { ok: true; state: T; cost: number } | { ok: false; reason: 'nothing' | 'no-bits'; cost: number };

/** Refaz a árvore pagando em Bits. Sem Bits suficientes, nada muda. Os Bits nunca ficam negativos. */
export function applyRespec<T extends RespecState>(state: T): RespecResult<T> {
  const picks = Array.isArray(state.talentPicks) ? state.talentPicks : [];
  const cost = respecCost(picks);
  if (picks.length === 0) return { ok: false, reason: 'nothing', cost: 0 };
  const bits = typeof state.gamePoints === 'number' && Number.isFinite(state.gamePoints) ? state.gamePoints : 0;
  if (bits < cost) return { ok: false, reason: 'no-bits', cost };
  return { ok: true, cost, state: { ...state, talentPicks: [], gamePoints: bits - cost } };
}
