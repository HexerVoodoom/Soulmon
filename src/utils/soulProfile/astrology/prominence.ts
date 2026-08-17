// ---------------------------------------------------------------------------
// Proeminência planetária — quanto cada planeta "pesa" num mapa.
//
// É a ponte entre a CONSTELAÇÃO e os 11 elementos do class-system que não
// tinham âncora nenhuma (eletricidade/arcano/vileza/morte/vida/vigor/marcial/
// tempo/som/gravidade/espaco). A associação planeta→elemento é a da tradição
// astrológica (Marte→marcial, Saturno→tempo, Urano→eletricidade, Plutão→morte,
// Mercúrio→som…), declarada como o que é: camada SIMBÓLICA, igual ao resto da
// astrologia daqui — o cálculo é verificável, a interpretação não prediz nada.
//
// A proeminência de um corpo é determinística e sai do próprio mapa:
//   • aspectos que ele forma, pesados por tipo (conjunção > trígono > sextil)
//     e pelo aperto do orbe (aspecto exato pesa mais que um no limite);
//   • bônus por casa ANGULAR (1/4/7/10 — as casas de manifestação forte na
//     tradição), só quando as casas são confiáveis (hora conhecida).
//
// O resultado é normalizado para os 10 corpos clássicos somarem 100 — cada
// mapa redistribui o mesmo bolo, então ninguém ganha proeminência "grátis"
// por ter nascido num dia movimentado do céu.
// ---------------------------------------------------------------------------

import type { NatalChart } from './types';

export type ProminenceBody =
  | 'Sol' | 'Lua' | 'Mercúrio' | 'Vênus' | 'Marte'
  | 'Júpiter' | 'Saturno' | 'Urano' | 'Netuno' | 'Plutão';

export const PROMINENCE_BODIES: ProminenceBody[] = [
  'Sol', 'Lua', 'Mercúrio', 'Vênus', 'Marte',
  'Júpiter', 'Saturno', 'Urano', 'Netuno', 'Plutão',
];

/** Peso por tipo de aspecto. Conjunção/oposição são os aspectos "maiores"
 *  da tradição; sextil é o mais suave. */
const ASPECT_WEIGHT: Record<string, number> = {
  'conjunção': 1.0,
  'oposição': 0.9,
  'trígono': 0.75,
  'quadratura': 0.75,
  'sextil': 0.5,
};

/** Orbe máximo usado no cálculo de aspectos do mapa (chart.ts usa 4–8 por
 *  tipo; 8 como teto único mantém a escala comparável entre tipos). */
const MAX_ORB = 8;

const ANGULAR_HOUSES = new Set([1, 4, 7, 10]);
const ANGULAR_BONUS = 1.2;

/** Proeminência neutra — o fallback quando não há mapa (perfis antigos,
 *  testes): todo mundo igual, nenhum elemento ganha ou perde por ausência
 *  de dado. */
export function neutralProminence(): Record<ProminenceBody, number> {
  return Object.fromEntries(PROMINENCE_BODIES.map(b => [b, 10])) as Record<ProminenceBody, number>;
}

export function planetProminence(chart: NatalChart): Record<ProminenceBody, number> {
  const raw = Object.fromEntries(PROMINENCE_BODIES.map(b => [b, 0.5])) as Record<ProminenceBody, number>;
  // 0.5 de piso: um planeta sem aspecto nenhum continua existindo no mapa —
  // piso zero faria a normalização explodir a diferença entre "quase nada"
  // e "nada", que astrologicamente não significa tanto assim.

  for (const aspect of chart.aspects) {
    const weight = (ASPECT_WEIGHT[aspect.aspect] ?? 0.5) * (1 - Math.min(aspect.orb, MAX_ORB) / MAX_ORB);
    if (aspect.a in raw) raw[aspect.a as ProminenceBody] += weight;
    if (aspect.b in raw) raw[aspect.b as ProminenceBody] += weight;
  }

  const housesReliable = !chart.birth.timeUnknown && chart.houseSystem === 'placidus';
  if (housesReliable) {
    for (const body of chart.bodies) {
      if ((body.body as ProminenceBody) in raw && ANGULAR_HOUSES.has(body.house)) {
        raw[body.body as ProminenceBody] += ANGULAR_BONUS;
      }
    }
  }

  const total = PROMINENCE_BODIES.reduce((s, b) => s + raw[b], 0) || 1;
  return Object.fromEntries(
    PROMINENCE_BODIES.map(b => [b, Number(((raw[b] / total) * 100).toFixed(2))])
  ) as Record<ProminenceBody, number>;
}
