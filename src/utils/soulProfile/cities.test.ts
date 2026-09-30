import assert from "node:assert/strict";
import { test } from "vitest";
import { CITIES, cityLabel, searchCities } from "./cities";

test("every timezone is a real IANA identifier the runtime accepts", () => {
  for (const city of CITIES) {
    assert.doesNotThrow(
      () => new Intl.DateTimeFormat("en-US", { timeZone: city.timeZone }),
      `${city.name} has an invalid timezone: ${city.timeZone}`
    );
  }
});

test("coordinates are inside valid ranges", () => {
  for (const city of CITIES) {
    assert.ok(city.latitude >= -90 && city.latitude <= 90, `${city.name} lat ${city.latitude}`);
    assert.ok(city.longitude >= -180 && city.longitude <= 180, `${city.name} lon ${city.longitude}`);
  }
});

test("Brazilian cities sit in the southern/western quadrant and carry a state", () => {
  const brazilian = CITIES.filter((c) => c.country === "BR");
  assert.ok(brazilian.length >= 27, `only ${brazilian.length} Brazilian cities`);
  for (const city of brazilian) {
    assert.ok(city.region.length === 2, `${city.name} has no state code`);
    assert.ok(city.longitude < 0, `${city.name} longitude ${city.longitude}`);
    assert.ok(city.latitude < 6 && city.latitude > -34, `${city.name} latitude ${city.latitude}`);
    assert.ok(city.timeZone.startsWith("America/"), `${city.name} tz ${city.timeZone}`);
  }
});

test("all 27 Brazilian state capitals are present", () => {
  const capitals = [
    "Rio Branco", "Maceió", "Macapá", "Manaus", "Salvador", "Fortaleza", "Brasília",
    "Vitória", "Goiânia", "São Luís", "Cuiabá", "Campo Grande", "Belo Horizonte",
    "Belém", "João Pessoa", "Curitiba", "Recife", "Teresina", "Rio de Janeiro",
    "Natal", "Porto Alegre", "Porto Velho", "Boa Vista", "Florianópolis",
    "São Paulo", "Aracaju", "Palmas",
  ];
  for (const capital of capitals) {
    assert.ok(CITIES.some((c) => c.name === capital), `missing capital: ${capital}`);
  }
});

test("city names are unique per country and region", () => {
  const keys = CITIES.map((c) => `${c.name}|${c.region}|${c.country}`);
  assert.equal(new Set(keys).size, keys.length);
});

test("search is accent- and case-insensitive", () => {
  assert.equal(searchCities("sao paulo")[0].name, "São Paulo");
  assert.equal(searchCities("SÃO PAULO")[0].name, "São Paulo");
  assert.equal(searchCities("brasilia")[0].name, "Brasília");
  assert.equal(searchCities("goiania")[0].name, "Goiânia");
});

test("exact matches outrank longer names sharing the prefix", () => {
  const results = searchCities("santos");
  assert.equal(results[0].name, "Santos");

  const saoPaulo = searchCities("são paulo");
  assert.equal(saoPaulo[0].name, "São Paulo");
});

test("search matches on state and country too", () => {
  const results = searchCities("RJ", 20);
  assert.ok(results.length > 0);
  assert.ok(results.every((c) => c.region === "RJ"), results.map((c) => c.name).join(", "));
});

test("search returns nothing for an empty query and respects the limit", () => {
  assert.deepEqual(searchCities(""), []);
  assert.deepEqual(searchCities("   "), []);
  assert.ok(searchCities("a", 3).length <= 3);
});

test("cityLabel includes the state only for Brazilian entries", () => {
  const sp = CITIES.find((c) => c.name === "São Paulo")!;
  assert.equal(cityLabel(sp), "São Paulo - SP, BR");
  const paris = CITIES.find((c) => c.name === "Paris")!;
  assert.equal(cityLabel(paris), "Paris, FR");
});

test("world cities display in English by default and in Portuguese on request", () => {
  const londres = CITIES.find((c) => c.name === "Londres")!;
  assert.equal(cityLabel(londres), "London, GB");
  assert.equal(cityLabel(londres, true), "Londres, GB");
  assert.equal(searchCities("london")[0].name, "Londres");
  assert.equal(searchCities("londres")[0].name, "Londres");
});
