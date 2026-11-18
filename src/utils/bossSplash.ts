/**
 * Monstros dos CHEFES DOS MINIGAMES (pedido do dono, 04/11/2026): o splash do boss do Elemental Fusion e do boss ESPECIAL da
 * Chuva de Almas usa a MESMA categoria de monstro dos chefes da Feira (`data/bossRoster.ts`, tier `chefe`).
 *  · Fusion: um chefe sorteado pela SEMENTE da partida (estável na partida, muda entre partidas), sem o Arauto do Fim.
 *  · Chuva de Almas, boss especial: o Arauto do Fim (o maior; tem arte de corpo inteiro).
 */
import { BOSS_ROSTER, bossArt, bossText, type BossEntry } from '../data/bossRoster';

export const SPECIAL_BARRAGE_BOSS_ID = 'arauto-do-fim';

/**
 * SLOT DA ARTE DO SPLASH (dono, 04/11/2026): retrato 9:16 em `src/assets/soulmon/boss/<id>.webp`. Sem o arquivo, o splash cai no
 * sprite do chefe (`assets/soulmon/bosses/boss-<id>.png`) centralizado sobre o fundo de tokens.
 */
const PORTRAITS = import.meta.glob('../assets/soulmon/boss/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const BOSS_PORTRAIT: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(PORTRAITS).map(([path, url]) => [/\/([a-z-]+)\.webp$/.exec(path)![1], url]),
);

export interface SplashMonster { id: string; name: string; /** sprite (fallback) */ art: string; /** retrato 9:16, se existir */ portrait?: string }

const toMonster = (e: BossEntry, isPt: boolean, full: boolean): SplashMonster => ({
  id: e.id, portrait: BOSS_PORTRAIT[e.id], name: bossText(e, isPt).name, art: (full ? bossArt(e.id, 'corpo-inteiro') : undefined) ?? bossArt(e.id) ?? '',
});

/** Os chefes elegíveis do Fusion: tier `chefe` com arte, fora o Arauto (reservado à Chuva de Almas). */
export const FUSION_BOSS_POOL: readonly BossEntry[] = BOSS_ROSTER.filter(e => e.tier === 'chefe' && e.id !== SPECIAL_BARRAGE_BOSS_ID);

export function fusionBossMonster(seed: number, isPt: boolean): SplashMonster {
  const i = Math.abs(Math.floor(seed)) % FUSION_BOSS_POOL.length;
  return toMonster(FUSION_BOSS_POOL[i], isPt, false);
}

export function barrageSpecialMonster(isPt: boolean): SplashMonster {
  return toMonster(BOSS_ROSTER.find(e => e.id === SPECIAL_BARRAGE_BOSS_ID)!, isPt, true);
}

/**
 * ARTE DO TÍTULO "BOSS BATTLE" e ÍCONE DO FRAGMENTO (18/11/2026): entram por glob, então enquanto a sessão de arte não entrega os PNGs o
 * resultado é `undefined` e a tela cai no fallback de texto / sem ícone (nenhuma importação quebra).
 * `ui/boss-battle-title.png` (EN) e `ui/boss-battle-title-pt.png` (PT-BR; sem ele, usa o EN); `items/boss-shard.png`.
 */
const TITLE_ART = import.meta.glob('../assets/soulmon/ui/boss-battle-title*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const SHARD_ART = import.meta.glob('../assets/soulmon/items/boss-shard.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const artOf = (g: Record<string, string>, tail: string): string | undefined => Object.entries(g).find(([k]) => k.endsWith(tail))?.[1];

export const bossBattleTitleArt = (isPt: boolean): string | undefined =>
  (isPt ? artOf(TITLE_ART, '/boss-battle-title-pt.png') : undefined) ?? artOf(TITLE_ART, '/boss-battle-title.png');
export const BOSS_SHARD_ICON: string | undefined = artOf(SHARD_ART, '/boss-shard.png');

/**
 * A arte do adversário na TELA DE RESULTADO do Elemental Fusion. Boss: SEMPRE o chefe da luta (o da intro, `fusionBossMonster`), nunca o
 * inimigo do roster que o combate carrega por baixo. PvP: o sprite do jogador (nunca roster). Aventura: desgarrado de jogador, senão roster.
 */
export function resultOpponentSrc(o: { boss: SplashMonster | null; pvp?: { sprite?: string } | null; stray?: string; roster?: string }): string | undefined {
  if (o.boss) return o.boss.art || undefined;
  if (o.pvp) return o.pvp.sprite;
  return o.stray ?? o.roster;
}
