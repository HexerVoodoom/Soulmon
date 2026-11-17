import type { Language } from '../../utils/i18n';
import type { FanArt } from '../play/TicketFan';

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

/** O leque de convites no topo da Arena (16/11/2026): o MESMO `TicketFan` dos minijogos, com a arte do convite em pé e o teto de 7. Sem a arte, `undefined` (sem leque). */
export function conviteDueloFan(language: Language, max: number): FanArt | undefined {
  const src = conviteDueloArt(language);
  if (!src) return undefined;
  return { src, portrait: true, ratio: 96 / 144, max, unit: language === 'pt-BR' ? ['convite', 'convites'] : ['invite', 'invites'], attr: 'data-convite-fan' };
}
