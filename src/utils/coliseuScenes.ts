/**
 * O COLISEU do Torneio (pedido do dono, 03/11/2026): a luta ranqueada acontece só no coliseu, com um cenário EXCLUSIVO por
 * faixa (Madeira → Diamante; Mestre e Grão-Mestre usam o do Diamante). Nenhum outro modo usa estas artes.
 * Faixa ainda sem arte cai na MAIOR faixa abaixo dela que já tem (a lista cresce conforme a arte chega).
 */
import coliseuMadeira from '../assets/soulmon/bg/coliseu-madeira.png';
import coliseuBronze from '../assets/soulmon/bg/coliseu-bronze.png';
import coliseuPrata from '../assets/soulmon/bg/coliseu-prata.png';
import coliseuOuro from '../assets/soulmon/bg/coliseu-ouro.png';
import coliseuPlatina from '../assets/soulmon/bg/coliseu-platina.png';
import coliseuDiamante from '../assets/soulmon/bg/coliseu-diamante.png';
import type { DungeonScene } from './dungeonScenes';

export const COLISEU_TIERS = ['madeira', 'bronze', 'prata', 'ouro', 'platina', 'diamante'] as const;
export type ColiseuTier = (typeof COLISEU_TIERS)[number];

const ART: Partial<Record<ColiseuTier, string>> = {
  madeira: coliseuMadeira, bronze: coliseuBronze, prata: coliseuPrata, ouro: coliseuOuro, platina: coliseuPlatina, diamante: coliseuDiamante,
};
const NAME: Record<ColiseuTier, { pt: string; en: string }> = {
  madeira: { pt: 'Coliseu de Madeira', en: 'Wooden Coliseum' },
  bronze: { pt: 'Coliseu de Bronze', en: 'Bronze Coliseum' },
  prata: { pt: 'Coliseu de Prata', en: 'Silver Coliseum' },
  ouro: { pt: 'Coliseu de Ouro', en: 'Golden Coliseum' },
  platina: { pt: 'Coliseu de Platina', en: 'Platinum Coliseum' },
  diamante: { pt: 'Coliseu de Diamante', en: 'Diamond Coliseum' },
};

/** O tier do coliseu para uma faixa do Torneio (assentos de temporada e lixo → o mais próximo). */
export function coliseuTierOf(tierId: string | null | undefined): ColiseuTier {
  if (tierId === 'mestre' || tierId === 'grao-mestre') return 'diamante';
  return (COLISEU_TIERS as readonly string[]).includes(tierId ?? '') ? (tierId as ColiseuTier) : 'madeira';
}

/** A cena do coliseu da faixa: a arte dela ou a da maior faixa abaixo que já tem arte. */
export function coliseuSceneFor(tierId: string | null | undefined): DungeonScene {
  const want = coliseuTierOf(tierId);
  let i = COLISEU_TIERS.indexOf(want);
  while (i > 0 && !ART[COLISEU_TIERS[i]]) i -= 1;
  const tier = COLISEU_TIERS[i];
  return { namePt: NAME[want].pt, nameEn: NAME[want].en, accent: '#3fd2d9', bg: `url(${ART[tier]}) center/cover` };
}
