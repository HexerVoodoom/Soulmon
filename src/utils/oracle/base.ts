/**
 * Núcleo LEVE do Oráculo — o que o chunk de ENTRADA do app precisa do módulo
 * `../oracle.ts`: hash/RNG semeado, id da forma no motor do jogo, nomes de
 * estágio e a ficha dos elementos.
 *
 * Separado em 04/10/2026 (rodada 6, perf): `oracle.ts` tem as perguntas do
 * ritual, as tabelas de reino/papel/alinhamento e é consumido por chunks
 * preguiçosos; como o `App.tsx` também o importava, o Rollup mantinha no
 * `index-*.js` TODO export que um chunk preguiçoso usa (~25 KB). Código do
 * caminho crítico importa DAQUI; `oracle.ts` reexporta tudo isto.
 */
import type { AlignmentId, CreatureStage, ElementId, LText, StageId } from '../oracle';

/**
 * Id da forma no MOTOR DO JOGO ('rookie' | '{champion|ultimate|mega}-{power|
 * harmony|benevolence}' | 'ultra' — ver types/progression.ts). Único ponto que
 * traduz o vocabulário do oráculo (stage 'perfeito' + branch poder/harmonia/
 * benevolencia) pro vocabulário do jogo (nível 'ultimate' + atributo
 * power/harmony/benevolence, já usado em todo o resto do app).
 */
export function creatureFormId(form: Pick<CreatureStage, 'stage' | 'branch'>): string {
  if (form.stage === 'rookie' || form.stage === 'ultra') return form.stage;
  const level = form.stage === 'perfeito' ? 'ultimate' : form.stage; // champion/mega: 1:1
  const attrByAlignment: Record<AlignmentId, 'power' | 'harmony' | 'benevolence'> = {
    poder: 'power', harmonia: 'harmony', benevolencia: 'benevolence',
  };
  const attr = form.branch ? attrByAlignment[form.branch] : 'harmony';
  return `${level}-${attr}`;
}

/** FNV-1a 32 bits — hash estável do input p/ semear o RNG. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — RNG determinístico pequeno. */
/** Exportado para os módulos do soulProfile (ficha/bestiário) usarem o MESMO
 *  RNG semeado — segunda cópia divergiria em silêncio (footgun 9). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ELEMENT_INFO: Record<ElementId, { name: LText; emoji: string; personality: LText }> = {
  agua: { name: { pt: 'Água', en: 'Water' }, emoji: '💧', personality: { pt: 'Fluido, empático e profundo — sente antes de entender e cura pela presença.', en: 'Fluid, empathetic and deep — feels before understanding and heals through presence.' } },
  fogo: { name: { pt: 'Fogo', en: 'Fire' }, emoji: '🔥', personality: { pt: 'Ardente, apaixonado e inquieto — inspira e incendeia quem está por perto.', en: 'Burning, passionate and restless — inspires and ignites those around.' } },
  terra: { name: { pt: 'Terra', en: 'Earth' }, emoji: '⛰️', personality: { pt: 'Sólido, leal e prático — a rocha em que os outros se apoiam.', en: 'Solid, loyal and practical — the rock others lean on.' } },
  ar: { name: { pt: 'Ar', en: 'Air' }, emoji: '🌪️', personality: { pt: 'Livre, curioso e veloz — vive de ideias e nunca fica parado.', en: 'Free, curious and swift — lives on ideas and never stands still.' } },
  sombra: { name: { pt: 'Sombra', en: 'Shadow' }, emoji: '🌑', personality: { pt: 'Misterioso, estrategista e introspectivo — enxerga o que ninguém vê.', en: 'Mysterious, strategic and introspective — sees what no one else sees.' } },
  luz: { name: { pt: 'Luz', en: 'Light' }, emoji: '✨', personality: { pt: 'Radiante, otimista e inspirador — guia os outros pelo exemplo.', en: 'Radiant, optimistic and inspiring — guides others by example.' } },
  planta: { name: { pt: 'Planta', en: 'Plant' }, emoji: '🌿', personality: { pt: 'Paciente, nutridor e resiliente — cresce devagar e floresce sempre.', en: 'Patient, nurturing and resilient — grows slowly and always blooms.' } },
  industrial: { name: { pt: 'Industrial', en: 'Industrial' }, emoji: '⚙️', personality: { pt: 'Engenhoso, preciso e incansável — constrói o futuro peça por peça.', en: 'Ingenious, precise and tireless — builds the future piece by piece.' } },
};

export const STAGE_NAMES: Record<StageId, LText> = {
  rookie: { pt: 'Desperto', en: 'Awakened' },
  champion: { pt: 'Ascendente', en: 'Ascendant' },
  perfeito: { pt: 'Transcendente', en: 'Transcendent' },
  mega: { pt: 'Apoteose', en: 'Apotheosis' },
  ultra: { pt: 'Zênite', en: 'Zenith' },
};
