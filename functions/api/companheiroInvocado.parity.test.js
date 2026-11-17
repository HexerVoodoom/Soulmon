/**
 * PARIDADE do gatilho do companheiro invocado entre o app (`companheiroInvocado.ts` + `...Linhas.ts`) e o servidor
 * (`_companheiroInvocado.js`). O servidor decide pelo SAVE ou pela tabela dos simulados, nunca pelo cliente.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_companheiroInvocado.js';
import { SIMULADOS } from './_simulados.data.js';
import * as app from '../../src/utils/companheiroInvocado';
import { escolaDoSimulado, PAPEL_POR_ELEMENTO } from '../../src/utils/companheiroInvocadoLinhas';

describe('flag e listas', () => {
  it('a flag do servidor e a do app sao a mesma (e estao LIGADAS, decisao do dono de 16/11)', () => {
    expect(srv.COMPANHEIRO_INVOCADO).toBe(app.COMPANHEIRO_INVOCADO);
    expect(srv.COMPANHEIRO_INVOCADO).toBe(true);
  });
  it('as 32 criaturas sao as mesmas', () => {
    expect([...srv.CRIATURAS_COMPANHEIRO]).toEqual([...app.CRIATURAS_COMPANHEIRO]);
  });
});

describe('simulados: elemento x linha', () => {
  const elementos = [...new Set([...Object.keys(PAPEL_POR_ELEMENTO), ...SIMULADOS.map((s) => s.element), 'desconhecido'])];
  it('o veredito do servidor e o da escola do app, em todas as combinacoes', () => {
    for (const el of elementos) {
      for (const linha of ['poder', 'harmonia', 'benevolencia', 'x']) {
        expect(srv.simuladoEvocador(el, linha)).toBe(escolaDoSimulado(el, linha) === app.ESCOLA_EVOCACAO);
      }
    }
  });
});

describe('companheiroDoLado (servidor)', () => {
  const save = (extra = {}) => ({ evolutionStage: 'champion', soulmonCompanheiro: { id: 'lobo' }, soulmonEvocacao: { champion: { evocador: true } }, ...extra });
  it('flag desligada = null sempre (a ficha de luta nao ganha campo nenhum)', () => {
    expect(srv.companheiroDoLado(save(), 'a'.repeat(64), false)).toBeNull();
    for (const sim of SIMULADOS) expect(srv.companheiroDoLado(save(), sim.id, false)).toBeNull();
  });
  it('flag do pacote (ligada) e o padrao: sem o 3o argumento o evocador invoca', () => {
    expect(srv.companheiroDoLado(save(), 'a'.repeat(64))).toEqual({ invoca: true, companheiro: 'lobo' });
    expect(srv.companheiroDoLado(save({ soulmonEvocacao: undefined }), 'a'.repeat(64))).toBeNull();
  });
  it('ligada: evocador do estagio com criatura valida invoca; o resto nao (nunca adivinha)', () => {
    const id = 'a'.repeat(64);
    expect(srv.companheiroDoLado(save(), id, true)).toEqual({ invoca: true, companheiro: 'lobo' });
    expect(srv.companheiroDoLado(save({ soulmonEvocacao: { champion: { evocador: false } } }), id, true)).toBeNull();
    expect(srv.companheiroDoLado(save({ soulmonEvocacao: undefined }), id, true)).toBeNull(); // save antigo sem o cache
    expect(srv.companheiroDoLado(save({ soulmonEvocacao: { rookie: { evocador: true } } }), id, true)).toBeNull(); // outro estagio
    expect(srv.companheiroDoLado(save({ soulmonCompanheiro: { id: 'dragao_do_cliente' } }), id, true)).toBeNull();
    expect(srv.companheiroDoLado(save({ soulmonEvocacao: { champion: { evocador: 'true' } } }), id, true)).toBeNull();
    expect(srv.companheiroDoLado(null, id, true)).toBeNull();
  });
  it('ligada: o servidor concorda com companheiroAtivo do app sobre o mesmo save', () => {
    const s = save();
    const doApp = app.eEvocador('champion', { arquetipoId: null, escolaDominante: null }) || s.soulmonEvocacao.champion.evocador;
    expect(!!srv.companheiroDoLado(s, 'b'.repeat(64), true)).toBe(doApp && app.criaturaConhecida('lobo'));
  });
  it('ligada: simulado usa a tabela (id da tabela), nao o save', () => {
    for (const sim of SIMULADOS.slice(0, 60)) {
      const r = srv.companheiroDoLado({}, sim.id, true);
      expect(!!r).toBe(escolaDoSimulado(sim.element, sim.line) === app.ESCOLA_EVOCACAO);
      if (r) expect(r).toEqual({ invoca: true });
    }
  });
});

describe('Coroa da Hexsmith equipada: o companheiro descansa (cliente e servidor iguais)', () => {
  const id = 'c'.repeat(64);
  const base = () => ({
    evolutionStage: 'champion',
    soulmonCompanheiro: { id: 'lobo' },
    soulmonEvocacao: { champion: { evocador: true } },
  });
  const hexes = {
    sem: undefined,
    naoEquipada: { owned: ['coroa:direct'], equipped: {} },
    familia: { owned: ['coroa:direct'], equipped: { coroa: 'coroa:direct' } },
    efeito: { owned: ['coroa:hot'], equipped: { coroa: 'coroa:hot' } },
    lixo: { owned: [], equipped: { coroa: 'coroa:direct' } },
    outroSlot: { owned: ['amuleto:fogo'], equipped: { amuleto: 'amuleto:fogo' } },
  };
  it('servidor e app decidem igual para cada save', () => {
    for (const [nome, hexsmith] of Object.entries(hexes)) {
      const s = { ...base(), hexsmith };
      const noServidor = srv.companheiroDoLado(s, id, true);
      const noApp = app.companheiroDoEstado(s, true);
      expect(!!noServidor, nome).toBe(noApp !== null);
      if (noServidor) expect(noServidor.companheiro, nome).toBe(noApp);
    }
  });
  it('com Coroa equipada nao invoca; desequipar volta; sem Coroa invoca', () => {
    expect(srv.companheiroDoLado({ ...base(), hexsmith: hexes.familia }, id, true)).toBeNull();
    expect(srv.companheiroDoLado({ ...base(), hexsmith: hexes.efeito }, id, true)).toBeNull();
    expect(srv.companheiroDoLado({ ...base(), hexsmith: hexes.naoEquipada }, id, true)).toEqual({ invoca: true, companheiro: 'lobo' });
    expect(srv.companheiroDoLado({ ...base(), hexsmith: hexes.outroSlot }, id, true)).toEqual({ invoca: true, companheiro: 'lobo' });
    expect(srv.companheiroDoLado(base(), id, true)).toEqual({ invoca: true, companheiro: 'lobo' });
  });
  it('nao evocador nao muda, com ou sem Coroa', () => {
    const n = { ...base(), soulmonEvocacao: { champion: { evocador: false } } };
    expect(srv.companheiroDoLado(n, id, true)).toBeNull();
    expect(srv.companheiroDoLado({ ...n, hexsmith: hexes.familia }, id, true)).toBeNull();
  });
});

describe('titulo de classe do save como fallback do cache (Maslin, 17/11/2026): servidor e app concordam', () => {
  const titulos = [
    { nome: { en: 'Verdant Warden', pt: 'Verdejante' }, origem: 'arquetipo' },
    { nome: { en: 'Beastlord Aspirant', pt: 'Aspirante a Senhor das Feras' }, origem: 'diluido' },
    { id: 'bokor', origem: 'arquetipo' },
    { nome: { en: 'Arcane Arsenal', pt: 'Arsenal Arcano' }, origem: 'arquetipo' },
    { nome: { en: 'Industrial Adept', pt: 'Adepto Industrial' }, origem: 'generico' },
    null, 'x', [],
  ];
  it('mesma tabela de nomes e mesmo veredito', () => {
    expect(srv.NOMES_ARQUETIPO_EVOCACAO).toEqual(app.NOMES_ARQUETIPO_EVOCACAO);
    expect(srv.ARQUETIPOS_EVOCACAO).toEqual([...app.ARQUETIPOS_EVOCACAO]);
    for (const t of titulos) expect(srv.tituloEEvocador(t)).toBe(app.tituloEEvocador(t));
  });
  it('save sem cache do estagio, com titulo evocador: o servidor invoca; cache dizendo nao manda', () => {
    const base = { evolutionStage: 'ultimate', soulmonCompanheiro: { id: 'slime_cristalino' }, soulmonClassTitles: { ultimate: titulos[0], mega: titulos[3] } };
    expect(srv.companheiroDoLado(base, 'a'.repeat(64), true)).toEqual({ invoca: true, companheiro: 'slime_cristalino' });
    expect(srv.companheiroDoLado({ ...base, evolutionStage: 'mega' }, 'a'.repeat(64), true)).toBeNull();
    expect(srv.companheiroDoLado({ ...base, soulmonEvocacao: { ultimate: { evocador: false } } }, 'a'.repeat(64), true)).toBeNull();
    expect(app.companheiroDoEstado(base, true)).toBe('slime_cristalino');
  });
});
