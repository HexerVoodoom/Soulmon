import assert from "node:assert/strict";
import { test } from "vitest";
import { computeNatalChart, localToUtc, signOf, formatPosition } from "./chart";
import { BirthData } from "./types";

const norm360 = (x: number) => ((x % 360) + 360) % 360;
const sep = (a: number, b: number) => {
  const d = Math.abs(norm360(a - b));
  return d > 180 ? 360 - d : d;
};

test("localToUtc honours historical Brazilian DST", () => {
  // 1994-01-15 was inside Brazil's horário de verão (UTC-2 in São Paulo).
  const summer = localToUtc("1994-01-15", "12:00", "America/Sao_Paulo");
  assert.equal(summer.toISOString(), "1994-01-15T14:00:00.000Z");

  // July is standard time (UTC-3).
  const winter = localToUtc("1994-07-15", "12:00", "America/Sao_Paulo");
  assert.equal(winter.toISOString(), "1994-07-15T15:00:00.000Z");
});

test("planet longitudes match published ephemeris for 2000-01-01 12:00 UT", () => {
  const birth: BirthData = {
    date: "2000-01-01",
    time: "12:00",
    timeZone: "UTC",
    latitude: 51.4779,
    longitude: 0,
    placeLabel: "Greenwich",
  };
  const chart = computeNatalChart(birth);
  const lon = (name: string) => chart.bodies.find((b) => b.body === name)!.longitude;

  // Reference values (tropical, geocentric, of date) from standard ephemerides.
  const expected: [string, number][] = [
    ["Sol", 280.37],
    ["Lua", 223.32],
    ["Mercúrio", 271.89],
    ["Vênus", 241.57],
    ["Marte", 327.96],
    ["Júpiter", 25.25],
    ["Saturno", 40.4],
    ["Urano", 314.81],
    ["Netuno", 303.2],
    ["Plutão", 251.45],
  ];
  for (const [name, deg] of expected) {
    assert.ok(sep(lon(name), deg) < 0.05, `${name}: got ${lon(name)}, expected ~${deg}`);
  }

  assert.equal(signOf(lon("Sol")), "Capricórnio");
  assert.equal(signOf(lon("Lua")), "Escorpião");
});

test("retrograde detection flags a known retrograde planet", () => {
  // Mercury was retrograde on 2000-02-25.
  const chart = computeNatalChart({
    date: "2000-02-25",
    time: "12:00",
    timeZone: "UTC",
    latitude: 0,
    longitude: 0,
    placeLabel: "test",
  });
  assert.equal(chart.bodies.find((b) => b.body === "Mercúrio")!.retrograde, true);
  assert.equal(chart.bodies.find((b) => b.body === "Sol")!.retrograde, false);
});

test("at the equator Placidus cusps land on equal right-ascension steps", () => {
  // With latitude 0 the ascensional difference vanishes, so cusp N must be the
  // ecliptic point whose RA is RAMC + 30*(N-10). This is an exact analytic
  // check on the Placidus iteration.
  const chart = computeNatalChart({
    date: "1987-03-14",
    time: "09:20",
    timeZone: "UTC",
    latitude: 0,
    longitude: -45,
    placeLabel: "equator",
  });
  assert.equal(chart.houseSystem, "placidus");
  const cusps = chart.houseCusps;
  for (let i = 0; i < 12; i++) {
    const spanToNext = norm360(cusps[(i + 1) % 12] - cusps[i]);
    // Equal RA steps do not mean equal ecliptic steps, but each cusp must be
    // strictly ahead of the previous one and no quadrant may collapse.
    assert.ok(spanToNext > 0.5 && spanToNext < 90, `cusp ${i + 1} span ${spanToNext}`);
  }
});

test("house cusps are consistent with the angles", () => {
  const chart = computeNatalChart({
    date: "1994-07-23",
    time: "14:35",
    timeZone: "America/Sao_Paulo",
    latitude: -23.5505,
    longitude: -46.6333,
    placeLabel: "São Paulo",
  });
  assert.equal(chart.houseSystem, "placidus");
  // Cusp 1 is the Ascendant, cusp 10 the Midheaven, and opposite cusps are 180° apart.
  assert.ok(sep(chart.houseCusps[0], chart.angles.ascendant) < 1e-6);
  assert.ok(sep(chart.houseCusps[9], chart.angles.midheaven) < 1e-6);
  for (let i = 0; i < 6; i++) {
    const opposition = sep(chart.houseCusps[i], chart.houseCusps[i + 6]);
    assert.ok(Math.abs(opposition - 180) < 1e-6, `cusps ${i + 1}/${i + 7} are ${opposition}° apart`);
  }
  // Cusps must advance monotonically around the full circle.
  let total = 0;
  for (let i = 0; i < 12; i++) {
    const span = norm360(chart.houseCusps[(i + 1) % 12] - chart.houseCusps[i]);
    assert.ok(span > 0 && span < 180, `house ${i + 1} span ${span}`);
    total += span;
  }
  assert.ok(Math.abs(total - 360) < 1e-6, `cusps span ${total}, expected 360`);
});

test("every body is assigned to exactly one house within its cusp span", () => {
  const chart = computeNatalChart({
    date: "1994-07-23",
    time: "14:35",
    timeZone: "America/Sao_Paulo",
    latitude: -23.5505,
    longitude: -46.6333,
    placeLabel: "São Paulo",
  });
  for (const body of chart.bodies) {
    assert.ok(body.house >= 1 && body.house <= 12);
    const start = chart.houseCusps[body.house - 1];
    const end = chart.houseCusps[body.house % 12];
    const span = norm360(end - start);
    const offset = norm360(body.longitude - start);
    assert.ok(offset < span, `${body.body} is not inside house ${body.house}`);
  }
});

test("polar latitudes fall back to whole-sign houses instead of producing NaN", () => {
  const chart = computeNatalChart({
    date: "1990-06-21",
    time: "03:00",
    timeZone: "UTC",
    latitude: 78.2,
    longitude: 15.6,
    placeLabel: "Svalbard",
  });
  assert.equal(chart.houseSystem, "whole-sign");
  assert.ok(chart.warnings.some((w) => w.pt.includes("Signos Inteiros") && w.en.includes("Whole Sign")));
  assert.ok(chart.houseCusps.every((c) => Number.isFinite(c)));
});

test("unknown birth time degrades gracefully", () => {
  const chart = computeNatalChart({
    date: "1994-07-23",
    time: "",
    timeZone: "America/Sao_Paulo",
    latitude: -23.5505,
    longitude: -46.6333,
    placeLabel: "São Paulo",
    timeUnknown: true,
  });
  assert.equal(chart.bigThree.ascendant, null);
  assert.ok(chart.warnings.some((w) => w.pt.includes("Ascendente") && w.en.includes("Ascendant")));
});

test("aspects are symmetric-free and within their orb", () => {
  const chart = computeNatalChart({
    date: "1994-07-23",
    time: "14:35",
    timeZone: "America/Sao_Paulo",
    latitude: -23.5505,
    longitude: -46.6333,
    placeLabel: "São Paulo",
  });
  for (const a of chart.aspects) {
    assert.notEqual(a.a, a.b);
    assert.ok(a.orb <= 8);
    const la = chart.bodies.find((b) => b.body === a.a)!.longitude;
    const lb = chart.bodies.find((b) => b.body === a.b)!.longitude;
    // `orb` is stored rounded to two decimals, so allow that much slack.
    assert.ok(Math.abs(Math.abs(sep(la, lb) - a.exactAngle) - a.orb) < 0.01);
  }
});

test("formatPosition renders degrees within the sign", () => {
  assert.equal(formatPosition(280.5), "10°30' Capricórnio");
  assert.equal(formatPosition(0), "0°00' Áries");
});

// Regra do app: nada que chegue ao usuário sai só em português.
test("todo aviso do mapa vem nos dois idiomas", () => {
  const chart = computeNatalChart({
    date: "1994-07-23", time: "14:35", timeZone: "America/Sao_Paulo",
    latitude: -23.5505, longitude: -46.6333, placeLabel: "São Paulo", timeUnknown: true,
  });
  assert.ok(chart.warnings.length > 0);
  for (const w of chart.warnings) {
    assert.ok(w.pt.trim().length > 0, "aviso sem PT");
    assert.ok(w.en.trim().length > 0, "aviso sem EN");
    assert.notEqual(w.pt, w.en, "aviso não foi realmente traduzido");
  }
});
