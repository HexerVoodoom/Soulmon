/**
 * ÍCONES E NOMES DAS RECOMPENSAS — o resolvedor ÚNICO que as telas de resultado usam (nada de `import` solto de PNG).
 * Item de mochila: a arte vem de `ITEM_ART` (chave = emoji-identidade); fragmento do Soulsmith carrega sob demanda
 * (`equipArt`). Nomes: `dungeonDrops.dropName` é o canônico; o coração da mochila é o ITEM DE CURA (a poção em forma de coração).
 */
import { useEffect, useState } from 'react';
import { ITEM_ART } from './itemArt';
import { HEART_ITEM_EMOJI, GLITCHTAMA_EMOJI } from './shop';
import { loadEquipArt } from './equipArt';
import { dropName, type DropKind } from './dungeonDrops';
import stairsIcon from '../assets/soulmon/icones-ui/masmorra-escada.png';
import energyIcon from '../assets/soulmon/icones-ui/energia.png';
import trophyGold from '../assets/icons/icon-trophy-gold.png';
import recordSeal from '../assets/soulmon/icons/icon-record-seal.png';

/**
 * O SELO DE RECORDE. PROVISÓRIO: hoje é o troféu dourado. A arte final (`icon-record-seal.png`) será gerada depois;
 * para trocar, é UMA linha: `import recordSeal from '../assets/soulmon/icons/icon-record-seal.png'` e `RECORD_SEAL_ICON = recordSeal`.
 */
export const RECORD_SEAL_ICON: string = recordSeal;
export const STAIRS_ICON: string = stairsIcon;
export const ENERGY_ICON: string = energyIcon;

export type RewardItemKind = DropKind;

export function rewardItemLabel(kind: RewardItemKind, isPt: boolean): string {
  if (kind === 'heart') return isPt ? 'Item de recuperar vida' : 'Healing item';
  return dropName(kind, isPt);
}

/** URL síncrona do ícone do item (`null` = ainda carregando / sem arte). */
export function rewardItemIconSync(kind: RewardItemKind): string | null {
  if (kind === 'heart') return ITEM_ART[HEART_ITEM_EMOJI] ?? null;
  if (kind === 'glitchtama') return ITEM_ART[GLITCHTAMA_EMOJI] ?? null;
  return null;
}

export function useRewardItemIcon(kind: RewardItemKind | undefined): string | null {
  const [frag, setFrag] = useState<string | null>(null);
  useEffect(() => {
    if (kind !== 'fragments') return undefined;
    let vivo = true;
    void loadEquipArt('fragmento').then(u => { if (vivo) setFrag(u); });
    return () => { vivo = false; };
  }, [kind]);
  if (!kind) return null;
  return kind === 'fragments' ? frag : rewardItemIconSync(kind);
}
