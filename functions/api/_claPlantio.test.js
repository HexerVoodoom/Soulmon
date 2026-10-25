import { describe, it, expect } from 'vitest';
import { fakeKV } from './_claKv.testkit.js';
import {
  estacaoDoDia, arvoreDe, frutoDe, avaliarCrescimento, plantar, regar, proteger, sortear, colher, vistaDoPlantio,
  PLANTIO_DIAS, ARVORE_TIER_MAX, migrarEspecie, normalizarPlanta, normalizarMembro, lerPlanta, plantioKey, arvoresKey,
} from './_claPlantio.js';
import { diaDeNum, numDia } from './_coop.js';

const env = () => ({ DIGIAPP_SAVES: fakeKV() });
const A = 'saveA', B = 'saveB', C = 'saveC';
const grupo = (members = [A, B]) => ({ id: 'g1', members, desde: {} });
const dia = (base, n) => diaDeNum(numDia(base) + n);
/** D2: o sorteio do dia, forçado ('water' | 'protect'); regar/proteger exigem ele. */
const tirar = (e, g, m, d, kind) => sortear(e, g, m, d, () => (kind === 'water' ? 0 : 1));

describe('plantio: calendário', () => {
  it('estação e espécie por mês (hemisfério sul)', () => {
    const cas = { '2026-09-01': 'cerejeira', '2026-11-30': 'cerejeira', '2026-12-01': 'cacto', '2027-02-28': 'cacto',
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
    expect((await regar(e, g, A, '2026-04-02')).reason).toBe('no-draw'); // D2: sem sorteio não rega
    await tirar(e, g, A, '2026-04-02', 'water');
    expect((await regar(e, g, A, '2026-04-02')).ok).toBe(true);
    expect((await regar(e, g, A, '2026-04-02')).reason).toBe('already-watered');
    await tirar(e, g, B, '2026-04-02', 'water');
    expect((await regar(e, g, B, '2026-04-02')).ok).toBe(true);
    await tirar(e, g, A, '2026-04-03', 'water');
    expect((await regar(e, g, A, '2026-04-03')).ok).toBe(true);
  });
  it('proteção: só 1 membro por dia', async () => {
    const e = env(); const g = grupo();
    await plantar(e, g.id, A, '2026-04-02');
    expect((await proteger(e, g, A, '2026-04-02')).reason).toBe('no-draw'); // D2: sem sorteio não protege
    await tirar(e, g, A, '2026-04-02', 'protect');
    await tirar(e, g, B, '2026-04-02', 'protect');
    expect((await proteger(e, g, A, '2026-04-02')).ok).toBe(true);
    expect((await proteger(e, g, B, '2026-04-02')).reason).toBe('already-protected');
    await tirar(e, g, B, '2026-04-03', 'protect');
    expect((await proteger(e, g, B, '2026-04-03')).ok).toBe(true);
  });
  it('D2: uma ação por dia — quem tirou "water" não protege e quem tirou "protect" não rega', async () => {
    const e = env(); const g = grupo();
    await plantar(e, g.id, A, '2026-04-02');
    await tirar(e, g, A, '2026-04-02', 'water');
    await tirar(e, g, B, '2026-04-02', 'protect');
    expect((await proteger(e, g, A, '2026-04-02')).reason).toBe('no-draw');
    expect((await regar(e, g, B, '2026-04-02')).reason).toBe('no-draw');
    expect((await regar(e, g, A, '2026-04-02')).ok).toBe(true);
    expect((await proteger(e, g, B, '2026-04-02')).ok).toBe(true);
  });
});

describe('plantio: crescimento, atraso e colheita', () => {
  const cuidar = async (e, g, d, { regadores, protetor = g.members[0] } = {}) => {
    // D2: uma ação por pessoa por dia; o protetor não rega.
    const regam = regadores ?? g.members.filter(m => m !== protetor);
    if (protetor) await tirar(e, g, protetor, d, 'protect');
    for (const m of regam) await tirar(e, g, m, d, 'water');
    for (const m of regam) await regar(e, g, m, d);
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
    await cuidar(e, g, dia(ini, 2), { regadores: [A], protetor: B });     // 1 de 3 < metade (2)
    await cuidar(e, g, dia(ini, 3), { regadores: [A, B], protetor: C });  // 2 de 3 = ok
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
    const rep1 = await colher(e, g, A, fim);          // repetir na mesma semana = mesma entrega, mesmo recibo
    expect(rep1).toMatchObject({ ok: true, repeat: true, receipt: r.receipt, fruit: r.fruit });
    expect((await colher(e, g, A, dia(fim, 1))).receipt).toBe(r.receipt);
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
    expect(gir.planta).toMatchObject({ species: 'cerejeira', nivel: 1, tier: 1 });
  });
});

describe('plantio: migração das espécies aposentadas (D-38)', () => {
  it('girassol -> cerejeira, melancia -> cacto; espécie nova e lixo passam intactos (idempotente)', () => {
    expect(migrarEspecie('girassol')).toBe('cerejeira');
    expect(migrarEspecie('melancia')).toBe('cacto');
    for (const e of ['abobora', 'pinheiro', 'cerejeira', 'cacto', 'x', undefined]) expect(migrarEspecie(e)).toBe(e);
    expect(migrarEspecie(migrarEspecie('girassol'))).toBe('cerejeira');
  });
  it('planta salva com girassol continua plantada (não some) e vira cerejeira', () => {
    const velho = { v: 1, season: '2026-primavera', species: 'girassol', plantedDay: '2026-09-02', by: 'a', nivel: 1, tier: 1 };
    const novo = normalizarPlanta(velho);
    expect(novo).toMatchObject({ species: 'cerejeira', season: '2026-primavera' });
    expect(normalizarPlanta(novo)).toEqual(novo);
  });
  it('fruto guardado como última colheita migra id e espécie, 2x dá o mesmo', () => {
    const m = normalizarMembro({ last: { week: '2026-W40', receipt: 'r', fruit: { id: 'fruto-melancia-t1', especie: 'melancia', tier: 1, bits: 5 } } });
    expect(m.last.fruit).toMatchObject({ id: 'fruto-cacto-t1', especie: 'cacto' });
    expect(normalizarMembro(m).last.fruit).toEqual(m.last.fruit);
  });
  it('KV com planta antiga: lerPlanta devolve a espécie nova; árvore antiga mantém o ano e plantar não reinicia o nível', async () => {
    const e = env();
    await e.DIGIAPP_SAVES.put(plantioKey('g1'), JSON.stringify({ v: 1, season: '2026-verao', species: 'melancia', plantedDay: '2026-12-02', by: 'a', nivel: 1, tier: 1 }));
    expect((await lerPlanta(e, 'g1')).species).toBe('cacto');
    await e.DIGIAPP_SAVES.put(arvoresKey('g1'), JSON.stringify({ melancia: 2026 }));
    const p = await plantar(e, 'g1', 'a', '2027-12-03');
    expect(p.planta).toMatchObject({ species: 'cacto', nivel: 2 });
  });
});
