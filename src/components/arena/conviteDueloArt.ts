import type { Language } from '../../utils/i18n';

/**
 * Arte do convite de Duelo (REGISTRO §458): papiro vertical com selo de cera, "DUELO"/"DUEL". Aprovada pelo dono em 16/11/2026.
 * Pelo idioma do jogador; arquivo ausente = `undefined` (a folha só não mostra o papiro, nunca quebra).
 * `convite-duelo-96-*` (96×144) é o que a folha usa; `convite-duelo-*` (192×288) fica para telas maiores.
 */
const ARTES = import.meta.glob('../../assets/soulmon/hud/convite-duelo-*.png', { eager: true, import: 'default' }) as Record<string, string>;

export function conviteDueloArt(language: Language, grande = false): string | undefined {
  const sufixo = language === 'pt-BR' ? 'pt' : 'en';
  const nome = grande ? `convite-duelo-${sufixo}.png` : `convite-duelo-96-${sufixo}.png`;
  const achado = Object.entries(ARTES).find(([k]) => k.endsWith(`/${nome}`));
  return achado?.[1];
}
