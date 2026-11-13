// ---------------------------------------------------------------------------
// AJUSTES DO DONO POR FORMA (REGISTRO §333, 13/11/2026): o que o dono escolheu à mão na Tabela de Soulmons e o motor não deriva.
// Chave = a chave do bestiário (`<id>-<estágio>`, a mesma do `ENEMY_ROSTER`; ultra = `<id>-ultra`).
//  - ATAQUE_TIPO_OVERRIDE: o tipo do ataque BÁSICO do inimigo. Vale antes de `foeStrikeForm` (forma) e de `meleeImpactOf`
//    (acabamento); sem linha aqui, a regra derivada de sempre. Só visual: não toca dano, RNG nem semente.
//  - FLUTUA / FLIP: bandeiras de sprite (padrão desligado). Flutua = desenhado um pouco acima do chão; flip = espelhado.
//  - ELEMENTO_FORMA_OVERRIDE / PERSONALIDADE_OVERRIDE: as trocas de linha que passaram pela validação (o resto ficou no REGISTRO §333).
// Os dados em lote vêm de `soulmonOverrides.data.ts` (gerado por `scripts/gerar-soulmon-overrides.mjs`).
// ---------------------------------------------------------------------------
import { ATAQUE_TIPO_OVERRIDE_DATA, FLIP_DATA, FLUTUA_DATA } from './soulmonOverrides.data';

export type AtaqueTipo = 'ranged_corte' | 'ranged_splash' | 'melee_corte' | 'melee_splash';

/** Como o motor representa cada tipo: a FORMA do golpe (`StrikeForm`) e o ACABAMENTO (`ImpactoMelee`; splash = `concussao`). */
export const ATAQUE_TIPO_MOTOR: Readonly<Record<AtaqueTipo, { forma: 'ranged' | 'melee'; impacto: 'corte' | 'concussao' }>> = {
  ranged_corte: { forma: 'ranged', impacto: 'corte' },
  ranged_splash: { forma: 'ranged', impacto: 'concussao' },
  melee_corte: { forma: 'melee', impacto: 'corte' },
  melee_splash: { forma: 'melee', impacto: 'concussao' },
};

export const ATAQUE_TIPO_OVERRIDE: Readonly<Record<string, AtaqueTipo>> = ATAQUE_TIPO_OVERRIDE_DATA;

/** O tipo escolhido pelo dono para o ataque básico desta forma, ou `undefined` (vale a regra derivada). */
export const ataqueTipoOverride = (formKey: string | null | undefined): AtaqueTipo | undefined =>
  (formKey && Object.prototype.hasOwnProperty.call(ATAQUE_TIPO_OVERRIDE, formKey) ? ATAQUE_TIPO_OVERRIDE[formKey] : undefined);

const FLUTUA = new Set(FLUTUA_DATA);
const FLIP = new Set(FLIP_DATA);
/** Quanto a forma que flutua sobe no combate, em fração da altura do sprite. */
export const FLUTUA_ALTURA = 0.08;
export const flutuaDe = (formKey: string | null | undefined): boolean => !!formKey && FLUTUA.has(formKey);
export const flipDe = (formKey: string | null | undefined): boolean => !!formKey && FLIP.has(formKey);

/** Elemento novo da forma (só ids validados: derivado ou curado). Os golpes NÃO mudam (seguem os da criatura base de antes). */
export const ELEMENTO_FORMA_OVERRIDE: Readonly<Record<string, string>> = {
  'tidewark-ultimate': 'armaria',
  'salsolurapoder-champion': 'sopro_do_dragao',
  'salsolurapoder-ultimate': 'sopro_do_dragao',
  'salsoluraharmonia-ultimate': 'sopro_do_dragao',
};

/** Personalidade escolhida pelo dono onde a derivada (linha da base do 1º componente) daria outra. Só rótulo (Tabela/bestiário). */
export const PERSONALIDADE_OVERRIDE: Readonly<Record<string, 'poder' | 'harmonia' | 'benevolencia'>> = {
  'tidewark-ultimate': 'benevolencia',
};
