// CURADORIA DO BESTIÁRIO — só entradas originais, cada uma completa e coerente.
//
// ⚠️ Reescrito em 28/09/2026. Decisão do dono: "desative as criaturas geradas
// no bestiário e vamos utilizar apenas as entradas originais", junto com o
// pedido de diversidade real de grupos ("fungos, plantas, peixes, insetos,
// aracnídeos, anfíbios, répteis, monstros, humanoides, robôs, etéreos,
// mortos-vivos, extraplanetários, vermes, geológicos, elementais, cnidários,
// mamíferos, demônios, angelicais…"). Antes, as 732 entradas eram TODAS
// variantes geradas de ~42 bases (prefixo+elemento, "X Veneno", "Leão do
// Saara Venenoso", clones da ponte, 17 variantes de cada arquétipo), e o
// corpus de origem não tinha fauna real além de meia dúzia de mamíferos.
// Hoje o pool é montado por `scripts/bestiario-originais.mjs` (41 bases com
// texto curado) + `scripts/bestiario-catalogo-curado.mjs` (catálogo curado).
//
// Este arquivo trava o RESULTADO no bundle: nenhuma variante gerada, todo
// grupo pedido presente, cada criatura completa, texto original que
// corrobora o nome e nunca cita franquia.

import { describe, expect, it } from 'vitest';
import { BESTIARY_POOL } from './select';
// @ts-expect-error — módulos .mjs de build, sem tipos; são os MESMOS que
// `sync-oracle-data.mjs` importa (régua copiada mente nos dois lugares).
import { montarPool, FAMILIAS_DO_POOL } from '../../../../scripts/bestiario-originais.mjs';
// @ts-expect-error — idem
import { corroboraNomeDescricao, DESCRICAO_DE_FRANQUIA, entradaPermitida, PREFIXOS_PROCEDURAIS } from '../../../../scripts/bestiario-procedencia.mjs';
import { CLASS_ELEMENT_ORDER } from '../types';

const GRUPOS_PEDIDOS = [
  'fungo', 'planta', 'peixe', 'inseto', 'aracnideo', 'anfibio', 'reptil', 'ave', 'mamifero',
  'cnidario', 'verme', 'molusco', 'crustaceo', 'monstro', 'humanoide', 'construto', 'etereo',
  'morto_vivo', 'extraplanetario', 'geologico', 'elemental', 'demonio', 'angelical',
];

describe('só entradas originais — nenhuma criatura gerada', () => {
  it('o pool commitado é exatamente o que `montarPool` produz (sem sync esquecido)', () => {
    const esperado = (montarPool() as Array<{ nome: string }>).map(c => c.nome).sort();
    expect(BESTIARY_POOL.map(c => c.nome).sort()).toEqual(esperado);
  });

  it('nenhum nome com prefixo procedural, sufixo de elemento ou de veneno', () => {
    const prefixo = new RegExp(`^(?:${(PREFIXOS_PROCEDURAIS as string[]).join('|')})\\s`);
    const geradas = BESTIARY_POOL.filter(c =>
      prefixo.test(c.nome) || /\sde\s(?:Fogo|Água|Terra|Ar|Sombra|Luz|Vileza|Marcial|Eletricidade)$/.test(c.nome)
      || /\sVenenos[oa]$|\sVeneno$/.test(c.nome)
      || (c as any)._ponte || (c as any)._arquetipo);
    expect(geradas.map(c => c.nome)).toEqual([]);
  });

  it('toda criatura passa pela régua de procedência (sem franquia)', () => {
    const reprovadas = BESTIARY_POOL.filter(c => !entradaPermitida(c)).map(c => c.nome);
    expect(reprovadas).toEqual([]);
    const comFranquia = BESTIARY_POOL.filter(c => DESCRICAO_DE_FRANQUIA.test(`${c.nome} ${c.descricao}`)).map(c => c.nome);
    expect(comFranquia).toEqual([]);
  });
});

describe('diversidade de grupos pedida pelo dono', () => {
  it('todo grupo pedido existe, com pelo menos 6 criaturas', () => {
    for (const g of GRUPOS_PEDIDOS) {
      const n = BESTIARY_POOL.filter(c => c.familia === g).length;
      expect(n, `${g}: ${n}`).toBeGreaterThanOrEqual(6);
    }
  });

  it('toda família do pool é do vocabulário declarado', () => {
    const fora = BESTIARY_POOL.filter(c => !(FAMILIAS_DO_POOL as string[]).includes(String(c.familia))).map(c => `${c.nome}: ${c.familia}`);
    expect(fora).toEqual([]);
  });

  it('nenhum grupo domina o pool (nenhum passa de 12% das criaturas)', () => {
    const cont: Record<string, number> = {};
    for (const c of BESTIARY_POOL) cont[String(c.familia)] = (cont[String(c.familia)] ?? 0) + 1;
    const maior = Math.max(...Object.values(cont)) / BESTIARY_POOL.length;
    expect(maior, JSON.stringify(cont)).toBeLessThanOrEqual(0.12);
  });

  it('os 17 elementos têm pelo menos 8 criaturas cada (a escolha por elemento nunca fica sem opção)', () => {
    for (const el of CLASS_ELEMENT_ORDER) {
      const n = BESTIARY_POOL.filter(c => c.elementos.includes(el)).length;
      expect(n, `${el}: ${n}`).toBeGreaterThanOrEqual(8);
    }
  });
});

describe('verificação exaustiva — cada criatura completa e coerente', () => {
  const TAMANHOS_VALIDOS = new Set(['Miudo', 'Pequeno', 'Medio', 'Grande', 'Enorme', 'Colossal']);

  it('nenhuma criatura tem campo ausente', () => {
    const CAMPOS = ['nome', 'origem', 'descricao', 'elementos', 'familia', 'biologia', 'bioma', 'tamanho', 'hostilidade', 'atributos'] as const;
    for (const campo of CAMPOS) {
      const faltando = BESTIARY_POOL.filter(c => (c as any)[campo] === undefined).map(c => c.nome);
      expect(faltando, `campo "${campo}" ausente em`).toEqual([]);
    }
  });

  it('toda descrição termina em pontuação e corrobora o nome', () => {
    expect(BESTIARY_POOL.filter(c => !/[.!?]$/.test(c.descricao.trim())).map(c => c.nome)).toEqual([]);
    expect(BESTIARY_POOL.filter(c => !corroboraNomeDescricao(c.nome, c.descricao)).map(c => c.nome)).toEqual([]);
  });

  it('nenhum nome duplicado', () => {
    const nomes = BESTIARY_POOL.map(c => c.nome);
    expect([...new Set(nomes.filter((n, i) => nomes.indexOf(n) !== i))]).toEqual([]);
  });

  it('1 a 3 elementos, todos do vocabulário do class-system', () => {
    const invalidas = BESTIARY_POOL.filter(c =>
      c.elementos.length < 1 || c.elementos.length > 3 || c.elementos.some(e => !(CLASS_ELEMENT_ORDER as string[]).includes(e)),
    ).map(c => c.nome);
    expect(invalidas).toEqual([]);
  });

  it('tamanho válido, hostilidade e atributos de 1 a 10', () => {
    const invalidas = BESTIARY_POOL.filter(c =>
      !TAMANHOS_VALIDOS.has(c.tamanho) || c.hostilidade < 1 || c.hostilidade > 10
      || !c.atributos || Object.values(c.atributos).some(v => typeof v !== 'number' || v < 1 || v > 10),
    ).map(c => c.nome);
    expect(invalidas).toEqual([]);
  });

  it('todo bioma tem pelo menos uma palavra que casa com algum reino', () => {
    const PALAVRAS = ['deserto', 'árido', 'montanha', 'picos', 'colina', 'oceano', 'mar', 'costa', 'aquático',
      'pântano', 'mangue', 'brejo', 'floresta', 'selva', 'bosque', 'caverna', 'subterrâneo', 'subsolo',
      'gelo', 'ártico', 'tundra', 'neve', 'campo', 'campina', 'planície', 'pradaria', 'etéreo', 'astral',
      'cósmico', 'espiritual'];
    const sem = BESTIARY_POOL.filter(c => !c.bioma.some(b => PALAVRAS.some(p => b.toLowerCase().includes(p)))).map(c => `${c.nome}: ${c.bioma.join('/')}`);
    expect(sem).toEqual([]);
  });
});
