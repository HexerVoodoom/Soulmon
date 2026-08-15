// ---------------------------------------------------------------------------
// Mapa astral — vocabulário.
// Portado de `teste-personalidade/src/lib/astrology/types.ts`. Única mudança:
// `warnings` virou LText (PT+EN), porque no Soulmon todo texto que chega ao
// usuário nasce nos dois idiomas.
// ---------------------------------------------------------------------------

import type { LText } from '../../oracle';

export const SIGNS = [
  "Áries", "Touro", "Gêmeos", "Câncer", "Leão", "Virgem",
  "Libra", "Escorpião", "Sagitário", "Capricórnio", "Aquário", "Peixes",
] as const;

export type Sign = (typeof SIGNS)[number];

export type Element = "fogo" | "terra" | "ar" | "água";
export type Modality = "cardinal" | "fixo" | "mutável";
export type Polarity = "diurno" | "noturno";

export const SIGN_ELEMENT: Record<Sign, Element> = {
  "Áries": "fogo", "Leão": "fogo", "Sagitário": "fogo",
  "Touro": "terra", "Virgem": "terra", "Capricórnio": "terra",
  "Gêmeos": "ar", "Libra": "ar", "Aquário": "ar",
  "Câncer": "água", "Escorpião": "água", "Peixes": "água",
};

export const SIGN_MODALITY: Record<Sign, Modality> = {
  "Áries": "cardinal", "Câncer": "cardinal", "Libra": "cardinal", "Capricórnio": "cardinal",
  "Touro": "fixo", "Leão": "fixo", "Escorpião": "fixo", "Aquário": "fixo",
  "Gêmeos": "mutável", "Virgem": "mutável", "Sagitário": "mutável", "Peixes": "mutável",
};

export const SIGN_POLARITY: Record<Sign, Polarity> = {
  "Áries": "diurno", "Gêmeos": "diurno", "Leão": "diurno", "Libra": "diurno",
  "Sagitário": "diurno", "Aquário": "diurno",
  "Touro": "noturno", "Câncer": "noturno", "Virgem": "noturno", "Escorpião": "noturno",
  "Capricórnio": "noturno", "Peixes": "noturno",
};

export type BodyName =
  | "Sol" | "Lua" | "Mercúrio" | "Vênus" | "Marte"
  | "Júpiter" | "Saturno" | "Urano" | "Netuno" | "Plutão"
  | "Nodo Norte" | "Quíron";

export interface PlacedBody {
  body: BodyName;
  /** Ecliptic longitude of date, 0-360 */
  longitude: number;
  /** Ecliptic latitude in degrees */
  latitude: number;
  sign: Sign;
  /** Degrees within the sign, 0-30 */
  degreeInSign: number;
  house: number;
  retrograde: boolean;
}

export type AspectName = "conjunção" | "oposição" | "trígono" | "quadratura" | "sextil";

export interface Aspect {
  a: BodyName;
  b: BodyName;
  aspect: AspectName;
  /** Deviation from the exact angle, in degrees */
  orb: number;
  exactAngle: number;
}

export interface Angles {
  ascendant: number;
  midheaven: number;
  descendant: number;
  imumCoeli: number;
}

export interface BirthData {
  /** Local civil date/time at the birth place, e.g. "1994-07-23" and "14:35" */
  date: string;
  time: string;
  /** IANA timezone of the birth place, e.g. "America/Sao_Paulo" */
  timeZone: string;
  latitude: number;
  longitude: number;
  placeLabel: string;
  /** True when the user did not know the birth time; chart falls back to noon
   * and houses/angles are flagged as unreliable. */
  timeUnknown?: boolean;
}

export interface NatalChart {
  birth: BirthData;
  utcDate: string;
  julianDay: number;
  bodies: PlacedBody[];
  angles: Angles;
  /** 12 cusp longitudes, index 0 = house 1 */
  houseCusps: number[];
  houseSystem: "placidus" | "whole-sign";
  aspects: Aspect[];
  distribution: {
    elements: Record<Element, number>;
    modalities: Record<Modality, number>;
    polarities: Record<Polarity, number>;
  };
  /** Sun / Moon / Ascendant — the "big three" */
  bigThree: { sun: Sign; moon: Sign; ascendant: Sign | null };
  /** Avisos de degradação do cálculo — sempre PT+EN (regra do app). */
  warnings: LText[];
}
