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
