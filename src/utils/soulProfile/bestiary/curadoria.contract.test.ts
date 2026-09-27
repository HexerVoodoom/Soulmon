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
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';
import { CLASS_ELEMENT_ORDER } from '../types';

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

describe('ponte de cobertura dos 17 elementos', () => {
  // ⚠️ Achado do `soulmon-guarda-permanencia` (27/09/2026): `scoreCreature`
  // (select.ts) soma, por elemento, o share que a leitura deu — é o termo de
  // maior peso da função. `eletricidade` e `marcial` tinham ZERO criaturas no
  // pool (nem base, nem via nenhum dos 16 derivados de cada); `sombra` só 2
  // de 617. Um jogador com um desses elementos dominante nunca tinha
  // criatura nenhuma pra "cobrar" o share mais alto da própria leitura.
  //
  // Não é bug de código — é buraco de CORPUS upstream, que só se fecha de
  // verdade com um sync novo (fora desta sessão). A ponte
  // (`bestiario-ponte-elementos.mjs`) clona linhas já curadas com o elemento
  // trocado, como piso temporário — e este teste é o que impede o buraco de
  // voltar em silêncio, seja por um sync futuro que não traga o elemento, seja
  // por alguém apagar a ponte sem perceber por quê ela existe.
  const DERIVED_TO_BASE: Record<string, string[]> = Object.fromEntries(
    DERIVED_ELEMENT_PAIRS.map(d => [d.id, d.componentes as unknown as string[]]),
  );
  const baseElementos = (els: string[]) => els.flatMap(id => DERIVED_TO_BASE[id] ?? [id]);

  it('todo elemento de CLASS_ELEMENT_ORDER tem pelo menos 1 criatura alcançável', () => {
    const semCobertura = CLASS_ELEMENT_ORDER.filter(
      el => !BESTIARY_POOL.some(c => baseElementos(c.elementos).includes(el)),
    );
    expect(semCobertura).toEqual([]);
  });

  it('eletricidade/marcial/sombra têm um piso real, não só 1 criatura solitária', () => {
    for (const el of ['eletricidade', 'marcial', 'sombra']) {
      const n = BESTIARY_POOL.filter(c => baseElementos(c.elementos).includes(el)).length;
      expect(n, `${el}: ${n}`).toBeGreaterThanOrEqual(5);
    }
  });

  it('as linhas de ponte continuam nomeadas de forma única e curadas', () => {
    const pontes = BESTIARY_POOL.filter(c => (c as any)._ponte);
    // chão embaixo: a ponte existe hoje (upstream ainda não resolveu)
    expect(pontes.length).toBeGreaterThan(0);
    const nomes = pontes.map(c => c.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });
});

describe('bioma corrigido pelo modificador geográfico do nome', () => {
  it('AUTOVERIFICAÇÃO: "do Pântano"/"da Caverna"/"Costeiro" não ficam mais em "Variado"', () => {
    // Achado do soulmon-guarda-permanencia: 84 entradas com modificador
    // geográfico no nome tinham TODAS bioma "Variado" fixo, e REALM_TO_BIOMA
    // (select.ts) só pontua quando bioma contém a keyword do reino — essas
    // entradas nunca cobravam o bônus, mesmo quando o nome já dizia o bioma.
    const casos = [
      ['Pântano', 'Pântano'], ['Caverna', 'Caverna'], ['Costeiro', 'Costa'],
      ['Montanha', 'Montanha'], ['Selva', 'Selva'], ['Deserto', 'Deserto'],
      ['Subterrâneo', 'Subterrâneo'], ['Ártico', 'Ártico'],
    ] as const;
    for (const [pista, biomaEsperado] of casos) {
      const achados = BESTIARY_POOL.filter(c => c.nome.includes(pista) && /Venenos[oa]$/.test(c.nome));
      expect(achados.length, `nenhuma entrada com "${pista}" achada`).toBeGreaterThan(0);
      for (const c of achados) expect(c.bioma, c.nome).toEqual([biomaEsperado]);
    }
  });

  it('modificador AMBÍGUO (cor/gentílico) continua "Variado" — não é fato inventado', () => {
    // A fronteira do que NÃO se corrige, nomeada: "Negro"/"Pardo" são cor,
    // "Africano"/"Asiático"/"Siberiano" são flavor sem garantia de habitat
    // real. Forçar um bioma aqui seria inventar dado, não corrigir um errado.
    const ambiguos = BESTIARY_POOL.filter(c =>
      /\b(Negro|Pardo|Africano|Asiático|Siberiano|Vulcânico|Tropical|Polar)\s+Venenos[oa]$/.test(c.nome));
    expect(ambiguos.length).toBeGreaterThan(0);
    for (const c of ambiguos) expect(c.bioma, c.nome).toEqual(['Variado']);
  });
});

describe('biologia dos animais reais sem categoria óbvia', () => {
  it("AUTOVERIFICAÇÃO: Urso-d'água e Dragão-azul deixam de ter biologia vazia", () => {
    const urso = BESTIARY_POOL.find(c => c.nome.includes('Tardígrado'));
    const dragaoAzul = BESTIARY_POOL.find(c => c.nome.includes('Dragão-azul'));
    expect(urso?.biologia).toEqual(['Invertebrado']);
    expect(dragaoAzul?.biologia).toEqual(['Molusco']);
  });
});
