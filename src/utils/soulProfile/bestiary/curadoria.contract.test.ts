// CURADORIA DO BESTIÁRIO — nome, tags e descrição coerentes.
//
// ⚠️ Existe porque "não ser de franquia" (a régua de `entradaPermitida`) não
// é o mesmo que "estar correto". Medido em 27/09/2026, no pool já filtrado:
// 72% das descrições (442/617) terminavam no MEIO DE UMA PALAVRA (corte duro
// em 200 caracteres), o campo `familia` vinha CORROMPIDO pelo elemento (toda
// variante "de Fogo" de um Cão/Elefante/Urso-d'água perdia a família real e
// virava "ignea"), e duas entradas tinham família fisicamente impossível — a
// Mantícora (fera terrestre) e a Welwitschia (planta do deserto) vinham como
// "aquatica". O drift do §4 de `docs/BESTIARIO-PROCEDENCIA.md` também não era
// só de franquia: o Urso-d'água tinha variantes com a descrição de "zona
// habitável" (astronomia) e de um filo de FUNGOS.
//
// Este arquivo trava o RESULTADO da curadoria (`bestiario-curadoria.mjs`) no
// bundle: nenhuma descrição truncada, nenhuma base com família ou biologia
// inconsistente entre suas variantes, e cada base curada tem corroboração
// nome↔descrição (a mesma régua da procedência, para não regredir).

import { describe, expect, it } from 'vitest';
import { BESTIARY_POOL } from './select';
// @ts-expect-error — módulos .mjs de build, sem tipos; são de propósito os
// MESMOS que `sync-oracle-data.mjs` importa (régua copiada mente nos dois).
import { chaveDeCuradoria, CURADORIA } from '../../../../scripts/bestiario-curadoria.mjs';
// @ts-expect-error — idem
import { corroboraNomeDescricao } from '../../../../scripts/bestiario-procedencia.mjs';

describe('curadoria do bestiário', () => {
  it('nenhuma descrição termina no meio de uma palavra', () => {
    const truncadas = BESTIARY_POOL
      .filter(c => !/[.!?]$/.test(c.descricao.trim()))
      .map(c => c.nome);
    expect(truncadas.slice(0, 10)).toEqual([]);
  });

  it('toda base tem UMA família e UMA biologia — nunca duas por causa do elemento', () => {
    // É o guard estrutural do bug de corrupção: se o elemento voltar a
    // sobrescrever `familia`/`biologia` de uma base já curada, este teste
    // pega ANTES de precisar nomear o caso, como a Mantícora ou o Cão de Fogo.
    const porChave = new Map<string, Set<string>>();
    for (const c of BESTIARY_POOL) {
      const k = chaveDeCuradoria(c.nome);
      const combo = `${c.familia ?? '∅'}|${JSON.stringify(c.biologia)}`;
      if (!porChave.has(k)) porChave.set(k, new Set());
      porChave.get(k)!.add(combo);
    }
    const inconsistentes = [...porChave.entries()].filter(([, s]) => s.size > 1);
    expect(inconsistentes.map(([k, s]) => `${k}: ${[...s].join(' vs ')}`)).toEqual([]);
  });

  it('todas as bases conhecidas do pool têm curadoria — nenhuma passa sem revisão', () => {
    const chaves = new Set(BESTIARY_POOL.map(c => chaveDeCuradoria(c.nome)));
    const semCuradoria = [...chaves].filter(k => !CURADORIA[k]);
    expect(semCuradoria).toEqual([]);
  });

  it('a descrição curada continua corroborando o nome (mesma régua da procedência)', () => {
    const falhas = BESTIARY_POOL
      .filter(c => !corroboraNomeDescricao(c.nome, c.descricao))
      .map(c => c.nome);
    expect(falhas.slice(0, 10)).toEqual([]);
  });

  it('AUTOVERIFICAÇÃO: a Mantícora não é mais aquática nem artrópode', () => {
    // O caso que motivou este arquivo, nomeado — para não ser esquecido.
    const manticora = BESTIARY_POOL.find(c => c.nome.includes('Manticora'));
    expect(manticora?.familia).toBe('besta');
    expect(manticora?.biologia).toEqual([]);
  });

  it('AUTOVERIFICAÇÃO: nenhum Cão/Elefante/Urso-d\'água "de Fogo" vira família ígnea', () => {
    const afetados = BESTIARY_POOL.filter(c =>
      /^(?:Titânico|Espiritual|Cristalino|Corrompido|Ancião)\s+(?:Cão|Elefante Africano|Urso-d'água)/.test(c.nome)
      && c.elementos.includes('fogo'));
    expect(afetados.length).toBeGreaterThan(0); // chão embaixo: os casos existem
    for (const c of afetados) expect(c.familia, c.nome).toBe('besta');
  });
});
