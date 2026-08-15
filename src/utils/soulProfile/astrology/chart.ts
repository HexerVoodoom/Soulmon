// ---------------------------------------------------------------------------
// Mapa astral — efemérides reais.
//
// Portado de `teste-personalidade/src/lib/astrology/chart.ts`. As posições vêm
// da `astronomy-engine` (VSOP87/ELP) rotacionadas para a eclíptica VERDADEIRA
// da data, que é o referencial da astrologia tropical; casas por Placidus, com
// queda explícita para Signos Inteiros acima dos círculos polares (onde
// Placidus é matematicamente indefinido).
//
// Este é o arquivo PESADO do módulo (puxa a astronomy-engine). Ele é sempre
// alcançado por import dinâmico — `utils/oracle.ts` só importa TIPOS daqui,
// que somem na compilação, então a engine não cai no bundle inicial.
//
// Única mudança em relação à origem: os avisos viraram LText (PT+EN).
// ---------------------------------------------------------------------------

import * as Astro from "astronomy-engine";
import type { LText } from "../../oracle";
import {
  Angles,
  Aspect,
  AspectName,
  BirthData,
  BodyName,
  Element,
  Modality,
  NatalChart,
  PlacedBody,
  Polarity,
  SIGNS,
  SIGN_ELEMENT,
  SIGN_MODALITY,
  SIGN_POLARITY,
  Sign,
} from "./types";

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Shortest angular separation between two longitudes, 0-180. */
function angularDistance(a: number, b: number): number {
  const d = Math.abs(norm360(a - b));
  return d > 180 ? 360 - d : d;
}

export function signOf(longitude: number): Sign {
  return SIGNS[Math.floor(norm360(longitude) / 30)];
}

export function degreeInSign(longitude: number): number {
  return norm360(longitude) % 30;
}

export function formatPosition(longitude: number): string {
  const d = degreeInSign(longitude);
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return `${deg}°${String(min).padStart(2, "0")}' ${signOf(longitude)}`;
}

/**
 * Resolves a local wall-clock time in an IANA timezone to a UTC instant.
 * Uses the runtime's tz database, so historical DST rules are honoured —
 * which matters a lot for birth charts (Brazil's horário de verão, etc).
 */
export function localToUtc(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, 0);

  // Two-pass fixed point: offsets change by at most an hour, so this converges.
  let guess = asUtc;
  for (let i = 0; i < 3; i++) {
    const offset = tzOffsetMs(new Date(guess), timeZone);
    const next = asUtc - offset;
    if (next === guess) break;
    guess = next;
  }
  return new Date(guess);
}

function tzOffsetMs(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(instant).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - instant.getTime();
}

/** Mean obliquity of the ecliptic (IAU 1980), in degrees. */
function meanObliquity(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return (
    23.439291111 -
    0.0130041667 * T -
    1.6667e-7 * T * T +
    5.02778e-7 * T * T * T
  );
}

/** Mean lunar node (Meeus, Astronomical Algorithms ch. 47), in degrees. */
function meanLunarNode(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  return norm360(
    125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + (T * T * T) / 467441 - (T * T * T * T) / 60616000
  );
}

/** Ecliptic longitude of the point on the ecliptic whose right ascension is `ra`. */
function eclipticFromRA(raDeg: number, oblDeg: number): number {
  const ra = raDeg * DEG;
  const e = oblDeg * DEG;
  return norm360(Math.atan2(Math.sin(ra), Math.cos(ra) * Math.cos(e)) * RAD);
}

/** Declination of the ecliptic point at longitude `lon`. */
function declFromEcliptic(lonDeg: number, oblDeg: number): number {
  return Math.asin(Math.sin(oblDeg * DEG) * Math.sin(lonDeg * DEG)) * RAD;
}

function midheaven(ramc: number, obl: number): number {
  return eclipticFromRA(ramc, obl);
}

function ascendant(ramc: number, obl: number, latDeg: number): number {
  const r = ramc * DEG;
  const e = obl * DEG;
  const phi = latDeg * DEG;
  return norm360(
    Math.atan2(Math.cos(r), -(Math.sin(r) * Math.cos(e) + Math.tan(phi) * Math.sin(e))) * RAD
  );
}

/**
 * Placidus intermediate cusps.
 *
 * Placidus divides each body's semi-arc into three equal parts. The MC sits at
 * RA = RAMC and the Ascendant at RA = RAMC + (90 + AD), where AD is the
 * ascensional difference of that ecliptic point. Cusps 11 and 12 split that
 * span into thirds; cusps 2 and 3 split the ASC→IC span (semi-nocturnal arc)
 * the same way. Because AD depends on the cusp's own declination, we solve the
 * relation by fixed-point iteration.
 *
 * Returns null above the polar circles, where the required arcsin has no
 * solution and Placidus is genuinely undefined.
 */
function placidusCusp(
  ramc: number,
  obl: number,
  latDeg: number,
  quadrantFraction: number,
  nocturnal: boolean
): number | null {
  const phi = latDeg * DEG;
  // Initial guess: ignore the ascensional difference entirely.
  const baseOffset = nocturnal
    ? 180 - quadrantFraction * 90
    : quadrantFraction * 90;
  let lon = eclipticFromRA(ramc + baseOffset, obl);

  for (let i = 0; i < 60; i++) {
    const decl = declFromEcliptic(lon, obl) * DEG;
    const sinAd = Math.tan(phi) * Math.tan(decl);
    if (Math.abs(sinAd) > 1) return null; // circumpolar: no rising/setting
    const ad = Math.asin(sinAd) * RAD;
    const targetRa = nocturnal
      ? ramc + 180 - quadrantFraction * (90 - ad)
      : ramc + quadrantFraction * (90 + ad);
    const next = eclipticFromRA(targetRa, obl);
    if (angularDistance(next, lon) < 1e-9) {
      lon = next;
      break;
    }
    lon = next;
  }
  return norm360(lon);
}

function computeHouseCusps(
  ramc: number,
  obl: number,
  lat: number,
  asc: number,
  mc: number
): { cusps: number[]; system: "placidus" | "whole-sign"; warning?: LText } {
  // Fractions run MC→ASC for cusps 11,12 and ASC→IC for cusps 2,3.
  const c11 = placidusCusp(ramc, obl, lat, 1 / 3, false);
  const c12 = placidusCusp(ramc, obl, lat, 2 / 3, false);
  const c2 = placidusCusp(ramc, obl, lat, 2 / 3, true);
  const c3 = placidusCusp(ramc, obl, lat, 1 / 3, true);

  if (c11 === null || c12 === null || c2 === null || c3 === null) {
    // Whole-sign fallback: house 1 starts at 0° of the Ascendant's sign.
    const start = Math.floor(norm360(asc) / 30) * 30;
    return {
      cusps: Array.from({ length: 12 }, (_, i) => norm360(start + i * 30)),
      system: "whole-sign",
      warning: {
        pt: "Local de nascimento em latitude polar: o sistema Placidus é indefinido ali, então as casas foram calculadas por Signos Inteiros (Whole Sign).",
        en: "Birthplace at polar latitude: Placidus is undefined there, so the houses fell back to Whole Sign.",
      },
    };
  }

  const cusps = [
    asc,
    c2,
    c3,
    norm360(mc + 180),
    norm360(c11 + 180),
    norm360(c12 + 180),
    norm360(asc + 180),
    norm360(c2 + 180),
    norm360(c3 + 180),
    mc,
    c11,
    c12,
  ];
  return { cusps: cusps.map(norm360), system: "placidus" };
}

function houseOf(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude);
  for (let i = 0; i < 12; i++) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    const span = norm360(end - start);
    const offset = norm360(lon - start);
    if (offset < span) return i + 1;
  }
  return 1;
}

const ASPECT_DEFS: { name: AspectName; angle: number; orb: number }[] = [
  { name: "conjunção", angle: 0, orb: 8 },
  { name: "oposição", angle: 180, orb: 8 },
  { name: "trígono", angle: 120, orb: 7 },
  { name: "quadratura", angle: 90, orb: 6 },
  { name: "sextil", angle: 60, orb: 4 },
];

function computeAspects(bodies: PlacedBody[]): Aspect[] {
  const out: Aspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const sep = angularDistance(bodies[i].longitude, bodies[j].longitude);
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(sep - def.angle);
        if (orb <= def.orb) {
          out.push({
            a: bodies[i].body,
            b: bodies[j].body,
            aspect: def.name,
            orb: Number(orb.toFixed(2)),
            exactAngle: def.angle,
          });
          break;
        }
      }
    }
  }
  return out.sort((a, b) => a.orb - b.orb);
}

const ENGINE_BODIES: { name: BodyName; body: Astro.Body }[] = [
  { name: "Sol", body: Astro.Body.Sun },
  { name: "Lua", body: Astro.Body.Moon },
  { name: "Mercúrio", body: Astro.Body.Mercury },
  { name: "Vênus", body: Astro.Body.Venus },
  { name: "Marte", body: Astro.Body.Mars },
  { name: "Júpiter", body: Astro.Body.Jupiter },
  { name: "Saturno", body: Astro.Body.Saturn },
  { name: "Urano", body: Astro.Body.Uranus },
  { name: "Netuno", body: Astro.Body.Neptune },
  { name: "Plutão", body: Astro.Body.Pluto },
];

/** Weight given to each placement when converting the chart into flat tags. */
const BODY_WEIGHT: Record<BodyName, number> = {
  "Sol": 3, "Lua": 3,
  "Mercúrio": 2, "Vênus": 2, "Marte": 2,
  "Júpiter": 1.5, "Saturno": 1.5,
  "Urano": 1, "Netuno": 1, "Plutão": 1,
  "Nodo Norte": 1, "Quíron": 1,
};

function geocentricEcliptic(body: Astro.Body, time: Astro.AstroTime, rot: Astro.RotationMatrix) {
  const vec = Astro.GeoVector(body, time, true);
  const sph = Astro.SphereFromVector(Astro.RotateVector(rot, vec));
  return { longitude: norm360(sph.lon), latitude: sph.lat };
}

export function computeNatalChart(birth: BirthData): NatalChart {
  const warnings: LText[] = [];
  const time = birth.timeUnknown ? "12:00" : birth.time;
  if (birth.timeUnknown) {
    warnings.push({
      pt: "Horário de nascimento desconhecido: usamos 12:00 local. A posição da Lua pode variar até ~6°, e Ascendente, Meio-do-Céu e casas não são confiáveis.",
      en: "Birth time unknown: we used local noon. The Moon can be off by ~6°, and Ascendant, Midheaven and houses are not reliable.",
    });
  }

  const utc = localToUtc(birth.date, time, birth.timeZone);
  const t = Astro.MakeTime(utc);
  const jd = t.tt + 2451545.0;
  const obl = meanObliquity(jd);
  const rot = Astro.Rotation_EQJ_ECT(t);

  const bodiesRaw = ENGINE_BODIES.map(({ name, body }) => {
    const now = geocentricEcliptic(body, t, rot);
    // Sample slightly later to detect apparent retrograde motion.
    const later = geocentricEcliptic(body, Astro.MakeTime(new Date(utc.getTime() + 6 * 3600_000)), rot);
    let delta = later.longitude - now.longitude;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return { name, ...now, retrograde: delta < 0 };
  });

  const nodeLon = meanLunarNode(jd);
  bodiesRaw.push({ name: "Nodo Norte", longitude: nodeLon, latitude: 0, retrograde: true });

  // RAMC: apparent sidereal time at Greenwich (hours) → degrees, plus geographic longitude.
  const gast = Astro.SiderealTime(t); // hours
  const ramc = norm360(gast * 15 + birth.longitude);

  const mc = midheaven(ramc, obl);
  const asc = ascendant(ramc, obl, birth.latitude);
  const { cusps, system, warning } = computeHouseCusps(ramc, obl, birth.latitude, asc, mc);
  if (warning) warnings.push(warning);

  const bodies: PlacedBody[] = bodiesRaw.map((b) => ({
    body: b.name,
    longitude: b.longitude,
    latitude: b.latitude,
    sign: signOf(b.longitude),
    degreeInSign: degreeInSign(b.longitude),
    house: houseOf(b.longitude, cusps),
    retrograde: b.retrograde,
  }));

  const angles: Angles = {
    ascendant: asc,
    midheaven: mc,
    descendant: norm360(asc + 180),
    imumCoeli: norm360(mc + 180),
  };

  const elements: Record<Element, number> = { fogo: 0, terra: 0, ar: 0, "água": 0 };
  const modalities: Record<Modality, number> = { cardinal: 0, fixo: 0, "mutável": 0 };
  const polarities: Record<Polarity, number> = { diurno: 0, noturno: 0 };

  for (const b of bodies) {
    const w = BODY_WEIGHT[b.body] ?? 1;
    elements[SIGN_ELEMENT[b.sign]] += w;
    modalities[SIGN_MODALITY[b.sign]] += w;
    polarities[SIGN_POLARITY[b.sign]] += w;
  }

  if (!birth.timeUnknown) {
    const ascSign = signOf(asc);
    const w = 3;
    elements[SIGN_ELEMENT[ascSign]] += w;
    modalities[SIGN_MODALITY[ascSign]] += w;
    polarities[SIGN_POLARITY[ascSign]] += w;
  }

  const aspects = computeAspects(bodies);

  return {
    birth,
    utcDate: utc.toISOString(),
    julianDay: jd,
    bodies,
    angles,
    houseCusps: cusps,
    houseSystem: system,
    aspects,
    distribution: { elements, modalities, polarities },
    bigThree: {
      sun: signOf(bodies.find((b) => b.body === "Sol")!.longitude),
      moon: signOf(bodies.find((b) => b.body === "Lua")!.longitude),
      ascendant: birth.timeUnknown ? null : signOf(asc),
    },
    warnings,
  };
}
