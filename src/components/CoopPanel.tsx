/**
 * O antigo painel do modo cooperativo (Fase 4.3, `docs/PLANO-COOP.md`) virou a
 * Guilda (`docs/PLANO-GUILDA.md`): a tela mora em `guild/GuildSheet.tsx` e fala
 * com `/api/guild`. Este arquivo só mantém o nome para quem ainda o importa (a
 * aba de grupo da `LibraryPage`) — uma tela só, sem cópia (footgun 9).
 */
export { GuildSheet as CoopPanel } from './guild/GuildSheet';
