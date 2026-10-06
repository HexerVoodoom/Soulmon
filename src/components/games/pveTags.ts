/**
 * Selos curtos da cena de PvE (anel, esquiva e especial pessoal), PT/EN — um dono só para a Arena, a Masmorra e o
 * Pesadelo (a mesma cena, `useGroupBattle`). Só texto de tela; a regra (notas, multiplicadores) é de `utils/energia.ts`.
 */
import type { DodgeGrade, RingGrade } from '../../utils/energia';

/** Selos do anel e da esquiva (PT/EN). */
export const RING_TAG: Record<'pt' | 'en', Record<RingGrade, string>> = {
  pt: { otimo: 'ÓTIMO!', bom: 'BOM', ruim: 'FRACO' },
  en: { otimo: 'GREAT!', bom: 'GOOD', ruim: 'WEAK' },
};
export const DODGE_TAG: Record<'pt' | 'en', Partial<Record<DodgeGrade, string>>> = {
  pt: { otimo: 'Esquivou!', bom: 'Quase!' },
  en: { otimo: 'Dodged!', bom: 'Close!' },
};
/** Selo no pet quando o especial dele é pessoal (cura, escudo, buff): não há dano para mostrar. */
export const PERSONAL_TAG: Record<'pt' | 'en', Partial<Record<string, string>>> = {
  pt: { heal: 'Cura!', shield: 'Escudo!', atkBuff: 'Poder!', spdBuff: 'Ligeiro!' },
  en: { heal: 'Heal!', shield: 'Shield!', atkBuff: 'Power!', spdBuff: 'Swift!' },
};
