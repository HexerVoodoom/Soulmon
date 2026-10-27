/**
 * RÓTULO DO SOULMON SEM DONO (27/10/2026, decisão do dono) — dono único. Todo inimigo da masmorra/Fenda/Calabouço que não é de
 * NPC nem de jogador aparece com UM de dois rótulos, nunca com nome próprio: estágios menores = "Soulmon selvagem"/"Wild Soulmon";
 * estágios fortes (ultimate/mega/ultra, e o chefe de andar, que é o slot mega) = "Soulmon desgarrado"/"Stray Soulmon".
 * O id/arte/chave do bestiário (`enemyRoster.ts`) NÃO mudam; só o texto exibido. Não repita a regra em tela: chame aqui.
 * NPC, Torneio, Arena e PVP seguem com os nomes deles.
 */
export const WILD_FOE_STRONG_STAGES: ReadonlySet<string> = new Set(['ultimate', 'mega', 'ultra']);

/** O inimigo é DESGARRADO (estágio forte)? Mesma regra do rótulo; `tier` como em `wildFoeLabel`. */
export function isStrayFoe(tier: string | undefined | null): boolean {
  const stage = (tier ?? '').slice((tier ?? '').lastIndexOf('-') + 1);
  return WILD_FOE_STRONG_STAGES.has(stage);
}

/** `tier` = estágio/tier puro (`champion`) OU chave `<id>-<estágio>` / `<linha>-<tier>` (pega o último trecho). */
export function wildFoeLabel(tier: string | undefined | null, isPt: boolean): string {
  return isStrayFoe(tier) ? (isPt ? 'Soulmon desgarrado' : 'Stray Soulmon') : (isPt ? 'Soulmon selvagem' : 'Wild Soulmon');
}
