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
