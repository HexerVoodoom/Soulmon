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
import { DUNGEON_LINE_SPRITES, STARTER_IDS, getSpriteForStage, isStarterId } from './sprites';
import { lineIcon } from './lineIcons';

/** O que um oponente/perfil público traz para a arte: só ids, nunca URL. */
export interface OpponentArtSource {
  /** Id da linha de arte (`spriteLineOf` do dono): inicial, linha ou o corvinho. */
  artLine?: string | null;
  stage: string;
  /** Identidade estável (id público) — só semeia o stand-in dos perfis antigos. */
  id?: string;
}

const hash = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

/** `true` quando o id aponta arte que existe neste cliente. */
export const isKnownArtLine = (v: unknown): v is string =>
  typeof v === 'string' && (v === CORVO_LINE || isStarterId(v) || !!DUNGEON_LINE_SPRITES[v]);

/** A linha de arte a desenhar: a do oponente, ou (perfil antigo) um inicial atual por hash. */
export const resolveOpponentLine = (o: OpponentArtSource): string =>
  isKnownArtLine(o.artLine) ? o.artLine : STARTER_IDS[hash(o.id ?? o.stage) % STARTER_IDS.length];

/** Sprite do oponente — NUNCA a árvore genérica. */
export const opponentSprite = (o: OpponentArtSource, size?: 256): string =>
  getSpriteForStage(o.stage, resolveOpponentLine(o), size);

/** Ícone-ficha (só existe para as linhas da masmorra; inicial e corvo devolvem `undefined`). */
export const opponentIcon = (o: OpponentArtSource, size: 32 | 64): string | undefined => {
  const line = resolveOpponentLine(o);
  if (!DUNGEON_LINE_SPRITES[line]) return undefined;
  const lvl = o.stage.toLowerCase().split('-')[0];
  const tier = (lvl === 'ultra' ? 'mega' : lvl) as 'rookie' | 'champion' | 'ultimate' | 'mega';
  return lineIcon(line, tier, size);
};
