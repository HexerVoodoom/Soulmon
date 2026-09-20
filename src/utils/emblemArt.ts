// Arte pixel dos 8 EMBLEMAS de conquista (leva sprites-20260915, gpt_image_2 com
// alfa real, 64²). Fronteira de troca no molde de `sigilArt.ts`: chave = id da
// conquista (`utils/achievements.ts`). Emblema-MOEDA (`emblems` no save,
// `currencies.ts`) continua sendo NÚMERO — este mapa é de conquistas, e
// conquista nunca se compra.
//
// Onde aparece (decisão do dono, 15/09/2026): dentro do visor — slot `trophy`
// do palco, Ficha do Pet, segmento Torneio da loja. A colocação exata é do
// canvas de identidade de cada fluxo; hoje o mapa e a derivação existem, a UI
// entra com a Fase 2.
import type { AchievementId } from './achievements';

const modules = import.meta.glob('../assets/soulmon/emblems/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const EMBLEM_ART: Partial<Record<AchievementId, string>> = {};
for (const [path, url] of Object.entries(modules)) {
  const m = /\/([a-z0-9-]+)\.png$/.exec(path);
  if (m) EMBLEM_ART[m[1] as AchievementId] = url;
}

/** URL do emblema de uma conquista, ou `undefined` (sem arte → não desenha). */
export const emblemArt = (id: AchievementId): string | undefined => EMBLEM_ART[id];

/** Quantos emblemas o glob encontrou — guard de instalação (8). */
export const EMBLEM_COUNT = Object.keys(EMBLEM_ART).length;

/**
 * O emblema do MARCO de hábito por tier (canvas Rituais, achado 10 / X4,
 * decisão do lead 16/09/2026): `sprout` = `habit-7` (broto) · `sapling` =
 * `habit-21` (arvoreta) · `tree` = `habit-66` (árvore). `seed` não tem marco
 * e devolve `undefined`. A cerimônia desenha isto a 64 CSS (1× do nativo 64²)
 * no vidro, no lugar do `tierIcon` emoji.
 */
const TIER_EMBLEM: Record<string, AchievementId> = {
  sprout: 'habit-7',
  sapling: 'habit-21',
  tree: 'habit-66',
};
export const emblemFor = (tier: string): string | undefined => {
  const id = TIER_EMBLEM[tier];
  return id ? EMBLEM_ART[id] : undefined;
};
