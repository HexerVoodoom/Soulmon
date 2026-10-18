import { describe, it, expect } from 'vitest';
import { fakeKV } from './_claKv.testkit.js';
import {
  estacaoDoDia, arvoreDe, frutoDe, avaliarCrescimento, plantar, regar, proteger, colher, vistaDoPlantio,
  PLANTIO_DIAS, ARVORE_TIER_MAX,
} from './_claPlantio.js';
import { diaDeNum, numDia } from './_coop.js';

const env = () => ({ DIGIAPP_SAVES: fakeKV() });
const A = 'saveA', B = 'saveB', C = 'saveC';
const grupo = (members = [A, B]) => ({ id: 'g1', members, desde: {} });
const dia = (base, n) => diaDeNum(numDia(base) + n);

describe('plantio: calendário', () => {
  it('estação e espécie por mês (hemisfério sul)', () => {
    const cas = { '2026-09-01': 'girassol', '2026-11-30': 'girassol', '2026-12-01': 'melancia', '2027-02-28': 'melancia',
      '2026-03-01': 'abobora', '2026-05-31': 'abobora', '2026-06-01': 'pinheiro', '2026-08-31': 'pinheiro' };
    for (const [d, esp] of Object.entries(cas)) expect(estacaoDoDia(d).especie).toBe(esp);
  });
  it('janeiro/fevereiro pertencem ao verão que começou em dezembro', () => {
    expect(estacaoDoDia('2026-12-15').key).toBe('2026-verao');
    expect(estacaoDoDia('2027-01-10').key).toBe('2026-verao');
    expect(estacaoDoDia('2027-02-28').key).toBe('2026-verao');
    expect(estacaoDoDia('2027-03-01').key).toBe('2027-outono');
  });
});

describe('plantio: uma por estação', () => {
  it('segunda tentativa na mesma estação é recusada; estação nova libera', async () => {
    const e = env(); const g = grupo();
    expect((await plantar(e, g.id, A, '2026-04-02')).ok).toBe(true);
    expect(await plantar(e, g.id, B, '2026-05-30')).toEqual({ ok: false, reason: 'already-planted' });
    expect((await plantar(e, g.id, B, '2026-06-02')).ok).toBe(true);
  });
  it('rega 1x por dia por membro; sem planta = no-plant', async () => {
    const e = env(); const g = grupo();
    expect((await regar(e, g, A, '2026-04-02')).reason).toBe('no-plant');
    await plantar(e, g.id, A, '2026-04-02');
    expect((await regar(e, g, A, '2026-04-02')).ok).toBe(true);
    expect((await regar(e, g, A, '2026-04-02')).reason).toBe('already-watered');
    expect((await regar(e, g, B, '2026-04-02')).ok).toBe(true);
    expect((await regar(e, g, A, '2026-04-03')).ok).toBe(true);
  });
  it('proteção: só 1 membro por dia', async () => {
    const e = env(); const g = grupo();
    await plantar(e, g.id, A, '2026-04-02');
    expect((await proteger(e, g, A, '2026-04-02')).ok).toBe(true);
    expect((await proteger(e, g, B, '2026-04-02')).reason).toBe('already-protected');
    expect((await proteger(e, g, B, '2026-04-03')).ok).toBe(true);
  });
});

describe('plantio: crescimento, atraso e colheita', () => {
  const cuidar = async (e, g, d, { regadores = g.members, protetor = g.members[0] } = {}) => {
    for (const m of regadores) await regar(e, g, m, d);
    if (protetor) await proteger(e, g, protetor, d);
  };
  it('14 dias cuidados completam; o dia seguinte já não rega', async () => {
    const e = env(); const g = grupo(); const ini = '2026-04-01';
    await plantar(e, g.id, A, ini);
    for (let i = 0; i < PLANTIO_DIAS; i++) await cuidar(e, g, dia(ini, i));
    const v = await vistaDoPlantio(e, g, A, dia(ini, PLANTIO_DIAS - 1));
    expect(v).toMatchObject({ mature: true, stage: 4, progress: 100, delayed: false });
    expect((await regar(e, g, A, dia(ini, PLANTIO_DIAS))).reason).toBe('grown');
  });
  it('dia sem proteção OU sem metade da rega = +1 dia de atraso; nunca mata nem baixa a qualidade', async () => {
    const e = env(); const g = grupo([A, B, C]); const ini = '2026-04-01';
    await plantar(e, g.id, A, ini);
    await cuidar(e, g, dia(ini, 0));                                     // ok
    await cuidar(e, g, dia(ini, 1), { protetor: null });                  // sem proteção
    await cuidar(e, g, dia(ini, 2), { regadores: [A] });                  // 1 de 3 < metade (2)
    await cuidar(e, g, dia(ini, 3), { regadores: [A, B] });               // 2 de 3 = ok
    const v = await vistaDoPlantio(e, g, A, dia(ini, 4)); // hoje (dia 4) sem nada: pendente, não atraso
    expect(v.progress).toBe(Math.round((2 / PLANTIO_DIAS) * 100));
    expect(v.delayed).toBe(true);
    expect(v.mature).toBe(false);
    expect(v.tier).toBe(1);
    const c = avaliarCrescimento({ plantedDay: ini, today: dia(ini, 4), membros: g.members.map(m => ({ save: m })), membro: { [A]: { water: [], prot: [] } } });
    expect(c.delays).toBe(4); // sem registro nenhum: todos os dias passados são atraso, e a planta continua viva
    expect(c.mature).toBe(false);
  });
  it('membro que entrou depois não conta no denominador dos dias anteriores', () => {
    const membros = [{ save: A }, { save: B, desde: '2026-04-03' }];
    const membro = { [A]: { water: ['2026-04-01'], prot: ['2026-04-01'] }, [B]: { water: [], prot: [] } };
    expect(avaliarCrescimento({ plantedDay: '2026-04-01', today: '2026-04-01', membros, membro }).cared).toBe(1);
  });
  it('colheita: só madura, 1 fruto por semana ISO por membro, volta na semana seguinte', async () => {
    const e = env(); const g = grupo(); const ini = '2026-04-01';
    await plantar(e, g.id, A, ini);
    expect((await colher(e, g, A, ini)).reason).toBe('not-grown');
    for (let i = 0; i < PLANTIO_DIAS; i++) await cuidar(e, g, dia(ini, i));
    const fim = dia(ini, PLANTIO_DIAS - 1);
    const r = await colher(e, g, A, fim);
    expect(r.ok).toBe(true);
    expect(r.fruit).toMatchObject({ especie: 'abobora', tier: 1, bits: 5 });
    expect((await colher(e, g, A, fim)).reason).toBe('already-harvested');
    expect((await colher(e, g, A, dia(fim, 1))).reason).toBe('already-harvested'); // mesma semana (ou outra, ver abaixo)
    expect((await colher(e, g, B, fim)).ok).toBe(true);
    expect((await colher(e, g, A, dia(fim, 7))).ok).toBe(true);
    expect((await vistaDoPlantio(e, g, A, dia(fim, 7))).mine.canHarvest).toBe(false);
  });
  it('vista não vaza saveId nem contagem por pessoa', async () => {
    const e = env(); const g = grupo();
    await plantar(e, g.id, A, '2026-04-01');
    await cuidar(e, g, '2026-04-01');
    const txt = JSON.stringify(await vistaDoPlantio(e, g, B, '2026-04-01'));
    expect(txt).not.toContain(A);
    expect(txt).not.toContain('"water"');
    expect(txt).not.toContain('"prot"');
  });
});

describe('plantio: árvore persiste (D-17)', () => {
  it('na virada do ano nível +1 e tier +1, com teto', () => {
    expect(arvoreDe(2026, 2026)).toEqual({ nivel: 1, tier: 1 });
    expect(arvoreDe(2026, 2027)).toEqual({ nivel: 2, tier: 2 });
    expect(arvoreDe(2026, 2028)).toEqual({ nivel: 3, tier: 3 });
    expect(arvoreDe(2026, 2035).tier).toBe(ARVORE_TIER_MAX);
    expect(frutoDe('abobora', 99).tier).toBe(ARVORE_TIER_MAX);
    expect(frutoDe('abobora', 2)).toMatchObject({ id: 'fruto-abobora-t2', bits: 10 });
  });
  it('replantar a mesma espécie no ano seguinte sobe o nível; outra espécie começa do 1', async () => {
    const e = env(); const g = grupo();
    await plantar(e, g.id, A, '2026-04-01');
    await plantar(e, g.id, A, '2026-07-01');                    // pinheiro, 1º ano
    const p27 = await plantar(e, g.id, A, '2027-04-01');        // abóbora, 2º ano
    expect(p27.planta).toMatchObject({ species: 'abobora', nivel: 2, tier: 2 });
    const pin = await plantar(e, g.id, A, '2027-07-01');
    expect(pin.planta).toMatchObject({ species: 'pinheiro', nivel: 2 });
    const gir = await plantar(e, g.id, A, '2027-10-01');
    expect(gir.planta).toMatchObject({ species: 'girassol', nivel: 1, tier: 1 });
  });
});
