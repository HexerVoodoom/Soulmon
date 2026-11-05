// §232 — a régua de ±3pp do elemento combinado, modo a modo, com PROVA VERMELHA: a mesma medida, com a vantagem por "melhor de k"
// (a política reprovada, P2), tem de sair da régua. Sem isso a régua verde não prova nada. Duelo/Torneio é neutro por §177 e Masmorra
// não tem vantagem elemental: o elemento lá só escolhe arte (`combatFx`), então não há taxa a mudar.
import { appendFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { arenaElementsFor, countersElement, simulateArenaRunV3, type ArenaRunConfig } from './arena';
import { combatantAt, REFERENCE_BUILDS } from './combate/level';
import { specialOf } from './combate/specials';
import { simulatePvp } from './combate/duel';
import { mulberry32 } from './combate/rng';
import { m3ElementMult } from './match3Combat';
import { escolherElemento } from './elementoCombinado';
import { ELEMENTOS_CURADOS, curatedComponents } from './elementosCurados';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { CLASS_ELEMENT_ORDER } from './soulProfile/types';
import POOL_JSON from './soulProfile/bestiary/pool.json';

vi.setConfig({ testTimeout: 300_000 });

const POOL = (POOL_JSON as { criaturas: unknown[] }).criaturas as never[];
/** `GATE_OUT=arquivo` grava os números medidos. */
const relatar = (...a: unknown[]) => { if (process.env.GATE_OUT) appendFileSync(process.env.GATE_OUT, a.join(' ') + String.fromCharCode(10)); };
const RUNS = 3000;
const REGUA = 3;
const BASES = [...CLASS_ELEMENT_ORDER] as string[];
const COM_CURADO = BASES.filter(b => ELEMENTOS_CURADOS.some(e => e.componentes.includes(b)));
const comps = (id: string): readonly string[] => curatedComponents(id) ?? DERIVED_ELEMENT_PAIRS.find(p => p.id === id)?.componentes ?? [id];
const elementoDe = (rng: () => number, k: number) => {
  const base = COM_CURADO[Math.floor(rng() * COM_CURADO.length)];
  return { base, id: escolherElemento(base, k, rng()).id };
};
const melhorContra = (foe: string, base: string, id: string) => comps(id).find(c => countersElement(c, foe) && !countersElement(foe, c)) ?? base;
const ident = (id: string) => ({ basico: { elemento: id }, especial: { elemento: id } });

/** Taxa de vitória na Arena, em %. `politica` = 'p0' o caminho real (base nº 1); 'p2' a sabotagem. */
function arena(k: number, nivel: number, politica: 'p0' | 'p2'): number {
  const rng = mulberry32(4100 + k);
  let w = 0;
  for (let i = 0; i < RUNS; i++) {
    const { base, id } = elementoDe(rng, k);
    const foe = BASES[Math.floor(rng() * BASES.length)];
    const ataque = politica === 'p0' ? base : melhorContra(foe, base, id);
    const cfg: ArenaRunConfig = {
      level: nivel, build: REFERENCE_BUILDS.balanced, family: 'direct', area: 'area', escolaBasica: 'conjuracao', foeElement: foe,
      elements: arenaElementsFor({ basica: ataque, especial: ataque }, ident(id), { principal: base, secundario: base }),
      pool: POOL,
    };
    if (simulateArenaRunV3(cfg, 20260818 + i, 'media').won) w++;
  }
  return (100 * w) / RUNS;
}

/** Guerra (escala 0,5, §177), em %: A combinado contra B de elemento único, mesmo combatente. Empate de força: mede só o elemento. */
function guerra(k: number, politica: 'p0' | 'p2'): number {
  const rng = mulberry32(7700 + k);
  const combatant = combatantAt(30, REFERENCE_BUILDS.balanced);
  let w = 0;
  for (let i = 0; i < RUNS; i++) {
    const { base, id } = elementoDe(rng, k);
    const foe = BASES[Math.floor(rng() * BASES.length)];
    const elVantagem = politica === 'p0' ? base : melhorContra(foe, base, id);
    const fx = (el: string, v?: string) => ({ basica: 'conjuracao', especial: 'conjuracao', elBasica: el, elEspecial: el, ...(v ? { elVantagem: v } : {}) });
    const r = simulatePvp({
      me: { combatant, special: specialOf('direct'), fx: fx(id, elVantagem) },
      opp: { combatant, special: specialOf('direct'), fx: fx(foe) },
      seed: 9000 + i, elementScale: 0.5,
    } as never);
    if ((r as unknown as { winner: string }).winner === 'me') w++;
  }
  return (100 * w) / RUNS;
}

/** Combina 3: multiplicador médio do dano do jogador contra um inimigo e do inimigo contra o jogador, em pontos percentuais de 1. */
function combina3(k: number, politica: 'p0' | 'p2'): number {
  const rng = mulberry32(5500 + k);
  let soma = 0;
  for (let i = 0; i < RUNS; i++) {
    const { base, id } = elementoDe(rng, k);
    const foe = BASES[Math.floor(rng() * BASES.length)];
    const defesa = politica === 'p0' ? base : (comps(id).find(c => countersElement(c, foe)) ?? base);
    soma += m3ElementMult(foe, defesa);
  }
  return (100 * soma) / RUNS;
}

describe('§232 régua ±3pp por modo', () => {
  it('Arena: k=2,3,4 ficam a ±3pp de k=1, nos níveis de Rookie e de Ultra; P2 sai da régua', () => {
    for (const nivel of [6, 40]) {
      const controle = arena(1, nivel, 'p0');
      const reais = [2, 3, 4].map(k => arena(k, nivel, 'p0'));
      const sab = [2, 3, 4].map(k => arena(k, nivel, 'p2'));
      relatar('arena', nivel, controle.toFixed(1), reais.map(x => x.toFixed(1)), 'P2', sab.map(x => x.toFixed(1)));
      for (const r of reais) expect(Math.abs(r - controle)).toBeLessThanOrEqual(REGUA);
      expect(Math.max(...sab) - controle).toBeGreaterThan(REGUA); // prova vermelha
    }
  });

  it('Guerra: k=2,3,4 ficam a ±3pp de k=1; P2 sai da régua', () => {
    const controle = guerra(1, 'p0');
    const reais = [2, 3, 4].map(k => guerra(k, 'p0'));
    const sab = [2, 3, 4].map(k => guerra(k, 'p2'));
    relatar('guerra', controle.toFixed(1), reais.map(x => x.toFixed(1)), 'P2', sab.map(x => x.toFixed(1)));
    for (const r of reais) expect(Math.abs(r - controle)).toBeLessThanOrEqual(REGUA);
    expect(Math.max(...sab) - controle).toBeGreaterThan(REGUA);
  });

  it('Combina 3: o dano recebido médio fica a ±3pp; a defesa por melhor de k é detectada', () => {
    const controle = combina3(1, 'p0');
    const reais = [2, 3, 4].map(k => combina3(k, 'p0'));
    const sab = [2, 3, 4].map(k => combina3(k, 'p2'));
    relatar('combina3', controle.toFixed(2), reais.map(x => x.toFixed(2)), 'P2', sab.map(x => x.toFixed(2)));
    for (const r of reais) expect(Math.abs(r - controle)).toBeLessThanOrEqual(REGUA);
    expect(Math.min(...sab)).toBeLessThan(Math.min(controle, ...reais)); // a medida enxerga a sabotagem
  });
});
