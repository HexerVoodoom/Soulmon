/**
 * Espelho MÍNIMO da forma BB no servidor (Onboarding Velado, D3/D5; plano §4/§7).
 * Pages Functions não importam de `src/`: o que o app decide em `src/utils/bbStage.ts`
 * e o servidor também precisa recusar (Duelo PvP e Guilda validam o estágio aqui) é
 * copiado e travado por `velado.parity.test.js`.
 *
 * Interruptor `ONBOARDING_VELADO` (var/secret, `1`/`true`/…): DESLIGADO por padrão. Desligado,
 * `bbRefusal` devolve sempre `null` e nada do que existia muda.
 */
import { flagOn } from './_killSwitch.js';

export const BB_STAGE = 'bb';

export const isOnboardingVelado = env => flagOn(env?.ONBOARDING_VELADO);

/**
 * Recusa MOTIVADA (padrão de `rebirthRefusal`): `'bb-locked'` quando o estágio do jogador é BB e o
 * interruptor está ligado; `null` caso contrário.
 * @param {unknown} env @param {unknown} evolutionStage
 * @returns {'bb-locked' | null}
 */
export function bbRefusal(env, evolutionStage) {
  return isOnboardingVelado(env) && evolutionStage === BB_STAGE ? 'bb-locked' : null;
}

/** Corpo de erro padrão (voz do Soulmon: sem culpa). */
export const BB_LOCKED_MESSAGE = {
  pt: 'Seu Velado ainda está pequeno demais para isto. Cresça o Vínculo e deixe-o evoluir.',
  en: 'Your Veiled one is still too small for this. Grow your Bond and let it evolve.',
};
