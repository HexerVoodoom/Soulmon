// ---------------------------------------------------------------------------
// MOLDURAS (R8, 04/10/2026) — o catálogo.
//
// Moldura é a borda do AVATAR (a criatura no mini-visor do ranking, na ficha, no Torneio). É
// COSMÉTICA PURA: não muda luta, ganho, XP, Bits, Emblemas nem Vínculo, e nunca pode virar vantagem
// (a mesma regra dos Emblemas — escolher ou ganhar moldura não toca na economia; há teste de contrato
// em `frames.test.ts`). O jogador escolhe QUAL usar, de qualquer origem.
//
// Quatro ORIGENS, e só a primeira depende de PvP:
//   • rank        — vem da faixa do Torneio (Madeira…Diamante por lifetime; Mestre/Grão-Mestre só
//                   enquanto o jogador ocupa o lugar na season, ver `tournamentTiers.ts`);
//   • shop        — comprada na loja com Bits (`price`); a posse mora em `GameState.ownedFrames`;
//   • achievement — dada por uma conquista (outro sistema grava o id em `ownedFrames`);
//   • event       — dada por um evento sazonal (idem).
//
// ARTE (04/10/2026): as 14 molduras do dono (blocos 38 e 39 de PROMPTS-PARA-O-DONO.md) moram em
// `assets/soulmon/molduras/<id>.png` e entram por `FRAME_ART[id]` (glob: o nome do arquivo É o id).
// Todas normalizadas no mesmo canvas — 192², a ABERTURA (lado menor) com 96 px e centrada —, então o
// componente escala qualquer uma pela mesma conta (`FRAME_ART_CANVAS`/`FRAME_ART_OPENING`). O `look`
// CSS continua como fallback de id sem arte.
//
// Moldura de avatar é PEÇA PRÓPRIA — não é "ícone dentro de box" (a regra de UI do dono vale para
// glifos de interface, que ficam pelados). Ela envolve a criatura, não um ícone.
// ---------------------------------------------------------------------------

export type FrameOrigin = 'rank' | 'shop' | 'achievement' | 'event';

export interface FrameLook {
  /** Cor do anel (CSS). */
  ring: string;
  /** Cor do segundo anel / brilho; ausente = anel simples. */
  accent?: string;
  /** Traço do anel. */
  line: 'solid' | 'double' | 'dashed' | 'dotted';
  /** Espessura em px (2 ou 3). */
  width: 2 | 3;
}

export interface AvatarFrame {
  id: string;
  namePt: string;
  nameEn: string;
  origin: FrameOrigin;
  /** `rank`: o id da faixa (`tournamentTiers.ts`) que a libera. */
  tierId?: string;
  /** `shop`: preço em Bits. */
  price?: number;
  /** `achievement`/`event`: como se consegue, em uma linha (o que a folha mostra quando está trancada). */
  howPt?: string;
  howEn?: string;
  look: FrameLook;
}

export const FRAMES: readonly AvatarFrame[] = [
  // ── rank: uma por faixa ──
  { id: 'rank-madeira', namePt: 'Moldura de Madeira', nameEn: 'Wood frame', origin: 'rank', tierId: 'madeira', look: { ring: '#8B6B4A', line: 'solid', width: 2 } },
  { id: 'rank-bronze', namePt: 'Moldura de Bronze', nameEn: 'Bronze frame', origin: 'rank', tierId: 'bronze', look: { ring: '#B0743A', line: 'solid', width: 3 } },
  { id: 'rank-prata', namePt: 'Moldura de Prata', nameEn: 'Silver frame', origin: 'rank', tierId: 'prata', look: { ring: '#B8C0C8', line: 'solid', width: 3 } },
  { id: 'rank-ouro', namePt: 'Moldura de Ouro', nameEn: 'Gold frame', origin: 'rank', tierId: 'ouro', look: { ring: '#E0B040', line: 'solid', width: 3 } },
  { id: 'rank-platina', namePt: 'Moldura de Platina', nameEn: 'Platinum frame', origin: 'rank', tierId: 'platina', look: { ring: '#9FD8D2', accent: '#E8F6F4', line: 'double', width: 3 } },
  { id: 'rank-diamante', namePt: 'Moldura de Diamante', nameEn: 'Diamond frame', origin: 'rank', tierId: 'diamante', look: { ring: '#6FC3F0', accent: '#DFF3FF', line: 'double', width: 3 } },
  { id: 'rank-mestre', namePt: 'Moldura de Mestre', nameEn: 'Master frame', origin: 'rank', tierId: 'mestre', look: { ring: '#3FB8C8', accent: '#D4F4F8', line: 'double', width: 3 } },
  { id: 'rank-grao-mestre', namePt: 'Moldura de Grão-Mestre', nameEn: 'Grandmaster frame', origin: 'rank', tierId: 'grao-mestre', look: { ring: '#F0C25A', accent: '#FFF1C9', line: 'double', width: 3 } },
  // ── loja (Bits) ──
  { id: 'loja-folhagem', namePt: 'Folhagem', nameEn: 'Foliage', origin: 'shop', price: 600, look: { ring: '#5FA05A', line: 'dashed', width: 3 } },
  { id: 'loja-cristal', namePt: 'Cristal de gelo', nameEn: 'Frost crystal', origin: 'shop', price: 900, look: { ring: '#8FD0F0', accent: '#EAF8FF', line: 'double', width: 3 } },
  { id: 'loja-brasa', namePt: 'Brasa', nameEn: 'Ember', origin: 'shop', price: 900, look: { ring: '#E07A3C', accent: '#FFD9B0', line: 'double', width: 3 } },
  // ── conquista ──
  { id: 'conquista-constancia', namePt: 'Constância', nameEn: 'Steadfast', origin: 'achievement', howPt: 'Cuidar do seu Soulmon por muitos dias.', howEn: 'Care for your Soulmon over many days.', look: { ring: '#4FA89A', line: 'solid', width: 3 } },
  // ── evento ──
  { id: 'evento-lua-colheita', namePt: 'Lua da colheita', nameEn: 'Harvest moon', origin: 'event', howPt: 'Dada no evento sazonal de outono.', howEn: 'Given during the autumn seasonal event.', look: { ring: '#D9A05B', accent: '#FFE9C2', line: 'dotted', width: 3 } },
  { id: 'evento-primeira-season', namePt: 'Primeira season', nameEn: 'First season', origin: 'event', howPt: 'Dada a quem jogou a primeira season do Torneio.', howEn: 'Given to anyone who played the first Tournament season.', look: { ring: '#A98B6A', accent: '#F3E6D2', line: 'double', width: 2 } },
];

export const FRAME_IDS: ReadonlySet<string> = new Set(FRAMES.map(f => f.id));

export function frameById(id: unknown): AvatarFrame | null {
  return typeof id === 'string' ? FRAMES.find(f => f.id === id) ?? null : null;
}

/** Id de moldura bem formado para o save — o mesmo formato que o servidor aceita (`functions/api/save.js`). */
export const FRAME_ID_RE = /^[a-z0-9-]{1,40}$/;
/** Teto de molduras guardadas no save (o catálogo é pequeno; o teto protege de lixo). */
export const FRAMES_MAX_OWNED = 200;

/** Lista de posse saneada: só strings no formato, sem repetição, com teto. Lixo é descartado, nunca lança. */
export function sanitizeOwnedFrames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const v of raw) {
    if (typeof v === 'string' && FRAME_ID_RE.test(v) && !out.includes(v)) out.push(v);
    if (out.length >= FRAMES_MAX_OWNED) break;
  }
  return out;
}

/** Moldura equipada saneada: string no formato ou `null`. */
export function sanitizeEquippedFrame(raw: unknown): string | null {
  return typeof raw === 'string' && FRAME_ID_RE.test(raw) ? raw : null;
}

export interface FrameContext {
  /** Os ids guardados no save (`GameState.ownedFrames`). */
  owned: readonly string[];
  /** Id da faixa por pontos que o jogador já alcançou — as molduras de rank até ela ficam livres. */
  lifetimeTierId: string;
  /** Ids dos lugares de topo que ele OCUPA agora (Mestre/Grão-Mestre; vazio se nenhum). */
  seatIds: readonly string[];
}

/** Ordem das faixas de pontos, da menor à maior (espelha `TOURNAMENT_TIERS`; o teste confere). */
const POINT_TIER_ORDER = ['madeira', 'bronze', 'prata', 'ouro', 'platina', 'diamante'] as const;

/** A moldura pode ser usada agora? Rank: faixa alcançada (ou lugar ocupado); o resto: está em `owned`. */
export function frameAvailable(frame: AvatarFrame, ctx: FrameContext): boolean {
  if (frame.origin === 'rank') {
    const tid = frame.tierId ?? '';
    if (ctx.seatIds.includes(tid)) return true;
    const want = (POINT_TIER_ORDER as readonly string[]).indexOf(tid);
    const have = (POINT_TIER_ORDER as readonly string[]).indexOf(ctx.lifetimeTierId);
    return want >= 0 && have >= want;
  }
  return ctx.owned.includes(frame.id);
}

/**
 * A moldura a DESENHAR: a equipada se ainda estiver disponível; senão `null` (sem moldura) — um lugar de
 * Mestre perdido, ou um id que o catálogo não conhece mais, nunca quebra a tela nem esconde o avatar.
 */
export function resolveEquippedFrame(equipped: unknown, ctx: FrameContext): AvatarFrame | null {
  const f = frameById(equipped);
  return f && frameAvailable(f, ctx) ? f : null;
}

/** Quais molduras o jogador pode usar agora, na ordem do catálogo. */
export function availableFrames(ctx: FrameContext): AvatarFrame[] {
  return FRAMES.filter(f => frameAvailable(f, ctx));
}

// ── ARTE ───────────────────────────────────────────────────────────────────────────────────────────
/** Lado do canvas de cada PNG de moldura e lado (menor) da abertura nele — medidos no pipeline. */
export const FRAME_ART_CANVAS = 192;
export const FRAME_ART_OPENING = 96;

const FRAME_PNG = import.meta.glob<string>('../assets/soulmon/molduras/*.png', { eager: true, import: 'default' });
/** Id da moldura → URL da arte. Id sem arte não tem chave (o `AvatarFrame` cai no anel CSS). */
export const FRAME_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FRAME_PNG).flatMap(([path, url]) => {
    const m = /\/([a-z0-9-]+)\.png$/.exec(path);
    return m ? [[m[1], url]] : [];
  }),
);

export function frameArt(id: string): string | undefined {
  return FRAME_ART[id];
}
