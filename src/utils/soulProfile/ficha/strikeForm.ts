// ---------------------------------------------------------------------------
// A forma do golpe por escola × papel. Dono único da TABELA (PR9 a tirou de `utils/combatFx.ts`
// para `StageSkill.forma` poder lê-la sem puxar a arte de FX para o bundle da ficha);
// `combatFx` re-exporta os mesmos nomes — quem já importava de lá não muda.
// ---------------------------------------------------------------------------
import type { EscolaId } from './types';

/** A FORMA de um golpe: investida corpo a corpo (só o corte) ou projétil (com impacto/splash). */
export type StrikeForm = 'melee' | 'ranged';
/** O papel da skill no par da ficha: básica (golpe normal) ou especial (carregada). */
export type SkillRole = 'basica' | 'especial';

/**
 * TABELA DA ESCOLA (dono único do `kind` das skills do JOGADOR, 04/10/2026): a escola da skill da ficha
 * (`StageSkill.escolaId`) × o papel dela (básica/especial) → físico ou à distância. O golpe NUNCA sai de índice
 * nem de sorteio: é sempre a skill que decide. Física = só o corte; à distância = projétil + impacto.
 * `combate_fisico` é corpo a corpo nas duas; as demais escolas atiram, menos a mordida/marca da maldição
 * (a básica ataca de perto) e a convocação da evocação (a especial vem de perto).
 * Teste que varre: `combatFx.test.ts` ("nenhuma skill sem kind").
 */
export const SCHOOL_STRIKE_FORM: Record<EscolaId, Record<SkillRole, StrikeForm>> = {
  combate_fisico: { basica: 'melee', especial: 'melee' },
  longo_alcance: { basica: 'ranged', especial: 'ranged' },
  conjuracao: { basica: 'ranged', especial: 'ranged' },
  benca: { basica: 'ranged', especial: 'ranged' },
  maldicao: { basica: 'melee', especial: 'ranged' },
  evocacao: { basica: 'ranged', especial: 'melee' },
};
