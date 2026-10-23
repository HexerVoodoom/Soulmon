// A ARTE DE UM OPONENTE (D-60, 19/10/2026) — dono único.
//
// O bug: o Torneio chamava `getSpriteForStage(opp.stage)` SEM a linha de arte, e sem ela a função
// cai em `SOULMON_SPRITES` — a árvore genérica (gato-coruja), arte DESCARTADA. O jogador via Corvinho,
// Cra e Kratos todos como o mesmo bicho. Agora o perfil público carrega `artLine` (um id de lista
// fechada, `functions/api/_artLine.js`; nenhum dado pessoal) e TODO desenho de oponente passa por aqui.
//
// Perfil/oponente antigo (sem `artLine`) NÃO cai na árvore genérica: cai num dos INICIAIS atuais
// (`STARTER_SPRITES`), escolhido por hash estável da identidade — o mesmo oponente é sempre o mesmo
// bicho, e oponentes diferentes se distinguem. É um stand-in declarado, não a criatura real dele.
import { CORVO_LINE } from './corvoPet';
import { DUNGEON_LINE_SPRITES, STARTER_IDS, getLineSpriteForStage, isStarterId, isRetiredLineId } from './sprites';
import { lineIcon } from './lineIcons';
import { isSafeSpriteSrc } from './spriteLibrary';

/** O que um oponente/perfil público traz para a arte: ids de linha ou URL de sprite gerado (higienizada). */
export interface OpponentArtSource {
  /** Id da linha de arte (`spriteLineOf` do dono): inicial, linha ou o corvinho. */
  artLine?: string | null;
  /** URL do sprite próprio gerado pelo jogador (validada por `isSafeSpriteSrc`; normalizada quando vem de `/api/sprite-image`). */
  spriteUrl?: string | null;
  stage: string;
  /** Identidade estável (id público) — só semeia o stand-in dos perfis antigos. */
  id?: string;
}

/** Normaliza URLs do nosso próprio endpoint `/api/sprite-image?k=<32hex>` para caminho de raiz same-origin. */
export function normalizePublicSpriteUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const limpa = raw.replace(/[\t\n\r]/g, '').trim();
  const m = /(?:^https?:\/\/[^/]+)?(\/api\/sprite-image\?k=[0-9a-f]{32})$/i.exec(limpa);
  if (m) return m[1];
  return isSafeSpriteSrc(limpa) ? limpa : null;
}

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** `true` quando o id aponta arte que existe neste cliente. */
export const isKnownArtLine = (v: unknown): v is string =>
  typeof v === 'string' && (v === CORVO_LINE || isStarterId(v) || isRetiredLineId(v) || !!DUNGEON_LINE_SPRITES[v]);

/** A linha de arte a desenhar: a do oponente, ou (perfil antigo) um inicial atual por hash. */
export const resolveOpponentLine = (o: OpponentArtSource): string =>
  isKnownArtLine(o.artLine) ? o.artLine : STARTER_IDS[hash(o.id ?? o.stage) % STARTER_IDS.length];

/** Sprite do oponente — primeiro o sprite próprio gerado (`spriteUrl`, se seguro), senão a linha dele (NUNCA `ownSprites` do usuário logado). */
export const opponentSprite = (o: OpponentArtSource, size?: 256): string => {
  const custom = normalizePublicSpriteUrl(o.spriteUrl);
  if (custom) return custom;
  return getLineSpriteForStage(o.stage, resolveOpponentLine(o), size);
};

/** Ícone-ficha (só existe para as linhas da masmorra quando não há sprite próprio gerado; inicial, corvo e sprite próprio devolvem `undefined`). */
export const opponentIcon = (o: OpponentArtSource, size: 32 | 64): string | undefined => {
  if (normalizePublicSpriteUrl(o.spriteUrl)) return undefined;
  const line = resolveOpponentLine(o);
  if (!DUNGEON_LINE_SPRITES[line]) return undefined;
  const lvl = o.stage.toLowerCase().split('-')[0];
  const tier = (lvl === 'ultra' ? 'mega' : lvl) as 'rookie' | 'champion' | 'ultimate' | 'mega';
  return lineIcon(line, tier, size);
};
