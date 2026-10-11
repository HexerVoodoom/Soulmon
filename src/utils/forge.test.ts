/**
 * O Soulsmith (07/10/2026): tabelas, bônus por nível, migração sem confisco, concessão por missão, aprimoramento e refazer a escolha.
 * Puro: sem React. A fiação com a tela está em `ForgeCard.render.test.tsx`; a paridade com o servidor, em `forge.parity.test.js`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  FORGE_PIECES, PIECE_BY_ID, LEVEL_PCT, PIECE_MAX_PCT, FORGE_MAX_LEVEL, FORGE_SCHEMA, OLD_LEVEL_TO_NEW, UPGRADE_COST, LEGACY_LEVEL, LEVEL_MIN_BOND, REDO_BITS, REDO_FRAGMENTS,
  sanitizeForge, pieceLevel, pieceBonus, ownedPieceBonus, PRIMARY_ATTR, ALT_ATTR, type ForgeChoice,
} from './forge';
import {
  applyUpgrade, applyRedo, applyForgeGrant, upgradeRefusal, redoRefusal, upgradeCost, redoBitsPrice, type ForgeGameState,
} from './forgeActions';
import { EQUIP_CATALOG, SLOT_ATTR, TIER_PCT, equipAttrBonus, type EquipmentState } from './equipment';
import { MATERIAL_BUILDING, QUEST_BUILDINGS, MATERIAL_CAP } from './buildingQuests';
import { BUILDING_GATES } from './gates';
import { COMBAT_BONUS_CAP, combinedAttrBonus } from './combate/bonus';
import { xpForLevel } from './bond';

const sum = (b: { atk: number; def: number; spd: number }) => b.atk + b.def + b.spd;
const eqOwn = (...ids: string[]): EquipmentState => ({ owned: ids, equipped: {}, fragments: 0 });
/** Um registro no esquema novo (`v: 2`) — sem o `v`, o registro é lido como o esquema antigo de 5 níveis. */
const F2 = (levels: Record<string, number>, picks: Record<string, ForgeChoice[]> = {}) => ({ v: FORGE_SCHEMA, levels, picks });
const mats = (m: Record<string, number>) => ({ day: 'd', visited: [], claimed: [], materials: m }) as ForgeGameState['buildingQuests'];

describe('as tabelas', () => {
  it('as 9 peças são as do catálogo antigo (ids, slots, tiers) e cada uma tem UM prédio de origem diferente', () => {
    expect(FORGE_PIECES.map((p) => p.id).sort()).toEqual(EQUIP_CATALOG.map((i) => i.id).sort());
    for (const i of EQUIP_CATALOG) { expect(PIECE_BY_ID.get(i.id)!.slot).toBe(i.slot); expect(PIECE_BY_ID.get(i.id)!.tier).toBe(i.tier); }
    expect(new Set(FORGE_PIECES.map((p) => p.building)).size).toBe(9);
    for (const p of FORGE_PIECES) {
      expect(QUEST_BUILDINGS, p.building).toContain(p.building); // prédio com missão (nunca do Mercado)
      expect(BUILDING_GATES[p.building]).toBeDefined();
      expect(p.mats[0]).not.toBe(p.mats[1]);
      expect(MATERIAL_BUILDING[p.mats[0]], p.id).toBe(p.building); // o material 1 é o do prédio de origem
      expect(Object.keys(MATERIAL_BUILDING)).toContain(p.mats[1]);
    }
    expect(PRIMARY_ATTR).toEqual(SLOT_ATTR);
    for (const s of ['nucleo', 'carapaca', 'rastro'] as const) expect(ALT_ATTR[s]).not.toBe(PRIMARY_ATTR[s]);
  });

  it('custos: 1–2 materiais por nível, crescentes, cabem no teto de estoque, e há um custo para cada nível 2..máximo', () => {
    let prev = 0;
    for (let to = 2; to <= FORGE_MAX_LEVEL; to++) {
      const c = UPGRADE_COST[to];
      expect(c, `nível ${to}`).toBeDefined();
      expect(c[0]).toBeGreaterThanOrEqual(prev); prev = c[0];
      expect(c[1]).toBeGreaterThanOrEqual(0);
      expect(c[0]).toBeLessThanOrEqual(MATERIAL_CAP);
      expect(upgradeCost(FORGE_PIECES[0], to).length).toBeGreaterThanOrEqual(1);
      expect(upgradeCost(FORGE_PIECES[0], to).length).toBeLessThanOrEqual(2);
    }
    expect(UPGRADE_COST[FORGE_MAX_LEVEL][0]).toBeGreaterThan(UPGRADE_COST[2][0]); // o último nível custa mais que o primeiro
    expect(Object.keys(UPGRADE_COST)).toHaveLength(FORGE_MAX_LEVEL - 1);
    expect(LEVEL_MIN_BOND).toHaveLength(FORGE_MAX_LEVEL + 1);
    for (let i = 3; i < LEVEL_MIN_BOND.length; i++) expect(LEVEL_MIN_BOND[i]).toBeGreaterThanOrEqual(LEVEL_MIN_BOND[i - 1]);
  });

  it('são 15 níveis (eram 5): mais degraus, o MESMO teto por peça', () => {
    expect(FORGE_MAX_LEVEL).toBe(15);
    expect(LEVEL_PCT).toHaveLength(FORGE_MAX_LEVEL);
  });

  it('o TETO: uma peça no nível máximo vale no máximo 1,5% (30% do teto); três peças somam 4,5% e nenhuma passa dos 5%', () => {
    expect(LEVEL_PCT.reduce((a, b) => a + b, 0)).toBeCloseTo(PIECE_MAX_PCT, 12);
    expect(PIECE_MAX_PCT).toBeLessThanOrEqual(COMBAT_BONUS_CAP * 0.3 + 1e-12);
    for (const p of FORGE_PIECES) {
      for (let mask = 0; mask < 64; mask++) {
        const ch = Array.from({ length: FORGE_MAX_LEVEL - 1 }, (_, i): ForgeChoice => ((mask >> (i % 6)) & 1 ? 'b' : 'a'));
        expect(sum(pieceBonus(p.id, FORGE_MAX_LEVEL, ch)), p.id).toBeCloseTo(PIECE_MAX_PCT, 12);
      }
    }
    expect(3 * PIECE_MAX_PCT).toBeLessThan(COMBAT_BUS());
  });

  it('com talento por cima, o canal único corta em 5% e mantém a forma (fonte nova entra pelo combinedAttrBonus)', () => {
    const eq = { owned: ['eq-nucleo-t3', 'eq-carapaca-t3', 'eq-rastro-t3'], equipped: { nucleo: 'eq-nucleo-t3', carapaca: 'eq-carapaca-t3', rastro: 'eq-rastro-t3' }, fragments: 0 };
    const forge = F2(Object.fromEntries(eq.owned.map((i) => [i, FORGE_MAX_LEVEL])));
    const b = equipAttrBonus(eq, forge);
    expect(sum(b)).toBeCloseTo(0.045, 12);
    const todos = combinedAttrBonus({ talent: { atk: 0.03, def: 0.03, spd: 0.03 }, equipment: b });
    expect(sum(todos)).toBeLessThanOrEqual(COMBAT_BONUS_CAP + 1e-12);
  });

  it('sem sorteio: nem o módulo nem as ações usam Math.random, odds ou pity (a fonte é lida)', () => {
    for (const f of ['forge.ts', 'forgeActions.ts', 'forgeCopy.ts']) {
      const src = readFileSync(`${__dirname}/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(src, f).not.toMatch(/Math\.random|\bodds\b|\bpity\b|\bgacha\b/i);
      if (f !== 'forgeCopy.ts') expect(src, f).not.toMatch(/credits|créditos|paidLeft/i);
    }
  });
});

describe('migração sem confisco (peça comprada antes do Soulsmith)', () => {
  it('cada tier mantém ao menos o que valia (0,5/1,0/1,5%), derivado na leitura, sem gravar nada', () => {
    FORGE_PIECES.forEach((p) => {
      const b = ownedPieceBonus(p.id, undefined);
      expect(sum(b), p.id).toBeGreaterThanOrEqual(TIER_PCT[p.tier - 1] - 1e-12);
      expect(b[PRIMARY_ATTR[p.slot]], p.id).toBeGreaterThanOrEqual(TIER_PCT[p.tier - 1] - 1e-12);
      expect(pieceLevel(p.id, undefined, true)).toBe(LEGACY_LEVEL[p.tier - 1]);
    });
    expect(pieceLevel('eq-nucleo-t1', undefined, false)).toBe(0);
    expect(sanitizeForge(undefined)).toEqual({ levels: {}, picks: {} });
    // O nível equivalente carrega o MESMO bônus de antes (0,5/1,1/1,5%): LEGACY_LEVEL 5/11/15 × 0,1%.
    expect(LEGACY_LEVEL.map((l) => l * 0.001)).toEqual([0.005, 0.011, 0.015]);
  });
  it('aprimorar uma peça antiga parte do nível equivalente, com a opção A nos níveis anteriores', () => {
    const prev: ForgeGameState = { equipment: eqOwn('eq-nucleo-t2'), totalXP: xpForLevel(8), buildingQuests: mats({ fang: 20, ore: 20 }) };
    const r = applyUpgrade(prev, 'eq-nucleo-t2', 'b');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.forge!.v).toBe(FORGE_SCHEMA);
    expect(r.state.forge!.levels['eq-nucleo-t2']).toBe(LEGACY_LEVEL[1] + 1);
    expect(r.state.forge!.picks['eq-nucleo-t2']).toEqual([...Array(LEGACY_LEVEL[1] - 1).fill('a'), 'b']);
  });
  it('MIGRAÇÃO do esquema de 5 níveis: o registro sem `v` vira o nível novo de MESMO bônus, atributo por atributo', () => {
    const ANTIGO = [0.003, 0.002, 0.003, 0.003, 0.004]; // os ganhos por nível de antes de 11/10/2026
    const alt = ALT_ATTR.nucleo, main = PRIMARY_ATTR.nucleo;
    for (let old = 1; old <= 5; old++) {
      for (let mask = 0; mask < 2 ** (old - 1); mask++) {
        const picksAntigos = Array.from({ length: old - 1 }, (_, i): ForgeChoice => ((mask >> i) & 1 ? 'b' : 'a'));
        const antigo = { levels: { 'eq-nucleo-t2': old }, picks: { 'eq-nucleo-t2': picksAntigos } };
        const novo = sanitizeForge(antigo);
        expect(novo.v).toBe(FORGE_SCHEMA);
        expect(novo.levels['eq-nucleo-t2']).toBe(OLD_LEVEL_TO_NEW[old - 1]);
        const esperado = { atk: 0, def: 0, spd: 0 };
        esperado[main] += ANTIGO[0];
        for (let k = 2; k <= old; k++) esperado[picksAntigos[k - 2] === 'b' ? alt : main] += ANTIGO[k - 1];
        const got = ownedPieceBonus('eq-nucleo-t2', antigo);
        for (const a of ['atk', 'def', 'spd'] as const) expect(got[a], `${old}/${mask}/${a}`).toBeCloseTo(esperado[a], 12);
        // idempotente: higienizar o que já saiu migrado não muda nada (nem converte duas vezes)
        expect(sanitizeForge(novo)).toEqual(novo);
      }
    }
    expect(OLD_LEVEL_TO_NEW).toEqual([3, 5, 8, 11, 15]);
  });
});

describe('concessão por missão', () => {
  it('o resgate do prédio concede a peça de nível 1 (equipa se o slot está vazio) e é idempotente', () => {
    const a = applyForgeGrant<ForgeGameState>({}, 'exploracao.masmorra');
    expect(a.equipment!.owned).toEqual(['eq-nucleo-t1']);
    expect(a.equipment!.equipped.nucleo).toBe('eq-nucleo-t1');
    expect(a.forge!.levels['eq-nucleo-t1']).toBe(1);
    expect(applyForgeGrant(a, 'exploracao.masmorra')).toBe(a);
    const b = applyForgeGrant(a, 'arena.duelo'); // 2ª peça do mesmo slot: SUBSTITUI a primeira (uma peça por tipo)
    expect(b.equipment!.owned).toEqual(['eq-nucleo-t2']);
    expect(b.equipment!.equipped.nucleo).toBe('eq-nucleo-t2');
    expect(b.forge!.levels['eq-nucleo-t1']).toBeUndefined();
  });
  it('o tier maior herda nível e escolhas da peça que substitui (o aprimoramento nunca se perde); tier menor não entra', () => {
    const forjada: ForgeGameState = {
      equipment: { owned: ['eq-nucleo-t1'], equipped: { nucleo: 'eq-nucleo-t1' }, fragments: 0 },
      forge: F2({ 'eq-nucleo-t1': 3 }, { 'eq-nucleo-t1': ['b', 'a'] }),
    };
    const r = applyForgeGrant(forjada, 'arena.duelo');
    expect(r.equipment!.owned).toEqual(['eq-nucleo-t2']);
    expect(r.forge!.levels).toEqual({ 'eq-nucleo-t2': 3 });
    expect(r.forge!.picks).toEqual({ 'eq-nucleo-t2': ['b', 'a'] });
    expect(r.forge!.v).toBe(FORGE_SCHEMA);
    expect(sum(ownedPieceBonus('eq-nucleo-t2', r.forge))).toBeCloseTo(LEVEL_PCT[0] + LEVEL_PCT[1] + LEVEL_PCT[2], 12);
    expect(applyForgeGrant(r, 'exploracao.masmorra')).toBe(r); // o t1 não volta por cima do t2
    expect(applyForgeGrant(r, 'arena.duelo')).toBe(r); // idempotente
  });
  it('prédio sem peça (Salão de outro, Mercado) não concede nada; quem já tinha a peça comprada não ganha de novo', () => {
    const s: ForgeGameState = {};
    expect(applyForgeGrant(s, 'mercado.ferreiro' as never)).toBe(s);
    expect(applyForgeGrant(s, 'jogos.mente')).toBe(s);
    const antigo: ForgeGameState = { equipment: eqOwn('eq-nucleo-t1') };
    expect(applyForgeGrant(antigo, 'exploracao.masmorra')).toBe(antigo);
  });
  it('o prêmio da missão sempre chega: peça de outro tipo entra, e a de um slot cheio com tier maior substitui', () => {
    const s: ForgeGameState = { equipment: { owned: ['eq-nucleo-t2', 'eq-carapaca-t2', 'eq-rastro-t2'], equipped: { nucleo: 'eq-nucleo-t2', carapaca: 'eq-carapaca-t2', rastro: 'eq-rastro-t2' }, fragments: 0 } };
    expect(applyForgeGrant(s, 'arena.torneio').equipment!.owned).toEqual(['eq-carapaca-t2', 'eq-rastro-t2', 'eq-nucleo-t3']);
  });
});

describe('aprimorar', () => {
  const base = (): ForgeGameState => applyForgeGrant({ totalXP: xpForLevel(6), buildingQuests: mats({ ore: 5, gear: 5 }) }, 'exploracao.masmorra');
  it('debita os materiais, sobe o nível e guarda a escolha; o material nunca fica negativo', () => {
    const r = applyUpgrade(base(), 'eq-nucleo-t1', 'b');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.forge!.levels['eq-nucleo-t1']).toBe(2);
    expect(r.state.forge!.picks['eq-nucleo-t1']).toEqual(['b']);
    expect(r.state.buildingQuests!.materials.ore).toBe(5 - UPGRADE_COST[2][0]);
    expect(ownedPieceBonus('eq-nucleo-t1', r.state.forge).def).toBeCloseTo(LEVEL_PCT[1], 12);
  });
  it('recusas com motivo: materiais, Vínculo, nível máximo, escolha inválida, peça que não é sua', () => {
    expect(upgradeRefusal({ ...base(), buildingQuests: mats({}) }, 'eq-nucleo-t1')).toBe('no-materials');
    expect(upgradeRefusal({ ...base(), totalXP: 0 }, 'eq-nucleo-t1')).toBe('bond');
    expect(upgradeRefusal(base(), 'eq-rastro-t1')).toBe('not-owned');
    expect(upgradeRefusal(base(), 'eq-xxx')).toBe('unknown');
    expect(upgradeRefusal({ equipment: eqOwn('eq-nucleo-t3'), forge: F2({ 'eq-nucleo-t3': FORGE_MAX_LEVEL }) }, 'eq-nucleo-t3')).toBe('max-level');
    expect(applyUpgrade(base(), 'eq-nucleo-t1', 'x' as never)).toEqual({ ok: false, reason: 'bad-choice' });
  });
  it('idempotente sobre o prev: o 2º toque no mesmo lote vê o estado já debitado e não paga de novo', () => {
    let s: ForgeGameState = { ...base(), buildingQuests: mats({ ore: UPGRADE_COST[2][0] }) };
    const r1 = applyUpgrade(s, 'eq-nucleo-t1', 'a');
    expect(r1.ok).toBe(true);
    if (r1.ok) s = r1.state;
    const r2 = applyUpgrade(s, 'eq-nucleo-t1', 'a');
    expect(r2.ok).toBe(false);
    expect(s.buildingQuests!.materials.ore ?? 0).toBe(0);
  });
  it('percorre os níveis 2 a 15 e para no 15, com a soma máxima da peça = 1,5% e o custo TOTAL da tabela', () => {
    let s: ForgeGameState = { ...base(), totalXP: xpForLevel(12), buildingQuests: mats({ ore: 99, gear: 99 }) };
    for (let i = 0; i < FORGE_MAX_LEVEL - 1; i++) { const r = applyUpgrade(s, 'eq-nucleo-t1', i % 2 ? 'a' : 'b'); expect(r.ok, `nível ${i + 2}`).toBe(true); if (r.ok) s = r.state; }
    expect(s.forge!.levels['eq-nucleo-t1']).toBe(FORGE_MAX_LEVEL);
    expect(sum(ownedPieceBonus('eq-nucleo-t1', s.forge))).toBeCloseTo(PIECE_MAX_PCT, 12);
    const total = [0, 1].map((j) => Object.values(UPGRADE_COST).reduce((a, c) => a + c[j], 0));
    expect(s.buildingQuests!.materials.ore).toBe(99 - total[0]);
    expect(s.buildingQuests!.materials.gear).toBe(99 - total[1]);
    expect(applyUpgrade(s, 'eq-nucleo-t1', 'a')).toEqual({ ok: false, reason: 'max-level' });
  });
});

describe('refazer a escolha', () => {
  const nivel3 = (over: Partial<ForgeGameState> = {}): ForgeGameState => ({
    equipment: { owned: ['eq-nucleo-t1'], equipped: { nucleo: 'eq-nucleo-t1' }, fragments: 4 },
    forge: F2({ 'eq-nucleo-t1': 3 }, { 'eq-nucleo-t1': ['b', 'a'] }), gamePoints: 1000, totalXP: xpForLevel(6), ...over,
  });
  it('com Bits GANHOS: troca a escolha, debita o preço e não mexe nos materiais', () => {
    const r = applyRedo(nivel3({ buildingQuests: mats({ ore: 3 }) }), 'eq-nucleo-t1', 2, 'a', 'bits');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.price).toBe(REDO_BITS);
    expect(r.state.gamePoints).toBe(1000 - REDO_BITS);
    expect(r.state.forge!.picks['eq-nucleo-t1']).toEqual(['a', 'a']);
    expect(r.state.forge!.v).toBe(FORGE_SCHEMA);
    expect(r.state.buildingQuests!.materials.ore).toBe(3);
  });
  it('Bit que veio de Crédito não paga (nunca paidLeft); sem Bits, recusa neutra', () => {
    expect(redoRefusal(nivel3({ gamePoints: 1000, bitsOrigin: { day: 'd', free: 0, fromCredits: 900, paidLeft: 900 } }), 'eq-nucleo-t1', 2, 'a', 'bits')).toBe('not-earned');
    expect(redoRefusal(nivel3({ gamePoints: 10 }), 'eq-nucleo-t1', 2, 'a', 'bits')).toBe('no-funds');
  });
  it('com fragmentos; sem fragmentos recusa; repetir a mesma escolha é recusado (idempotente)', () => {
    const r = applyRedo(nivel3(), 'eq-nucleo-t1', 3, 'b', 'fragments');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.equipment!.fragments).toBe(4 - REDO_FRAGMENTS);
    expect(r.state.gamePoints).toBe(1000);
    expect(applyRedo(r.state, 'eq-nucleo-t1', 3, 'b', 'fragments')).toEqual({ ok: false, reason: 'same' });
    expect(redoRefusal(nivel3({ equipment: { owned: ['eq-nucleo-t1'], equipped: {}, fragments: 0 } }), 'eq-nucleo-t1', 3, 'b', 'fragments')).toBe('no-fragments');
  });
  it('nível inválido (1, acima do atual) e peça que não é sua são recusados', () => {
    expect(redoRefusal(nivel3(), 'eq-nucleo-t1', 1, 'b', 'bits')).toBe('bad-level');
    expect(redoRefusal(nivel3(), 'eq-nucleo-t1', 4, 'b', 'bits')).toBe('bad-level');
    expect(redoRefusal(nivel3(), 'eq-rastro-t1', 2, 'b', 'bits')).toBe('not-owned');
  });
  it('o desconto do Comércio vale no preço de refazer', () => {
    expect(redoBitsPrice('eq-nucleo-t1', [])).toBe(REDO_BITS);
    expect(redoBitsPrice('eq-nucleo-t1', ['tal-com-01', 'tal-com-01'])).toBe(Math.ceil(REDO_BITS * 0.92));
  });
});

describe('sanitizeForge', () => {
  it('lixo vira vazio, peça fora da lista cai, nível é preso em 1..15 e a escolha só é a|b, no máximo nível−1', () => {
    expect(sanitizeForge({ v: FORGE_SCHEMA, levels: { 'eq-xxx': 3, '__proto__': 2, 'eq-nucleo-t1': 99, 'eq-nucleo-t2': -4, 'eq-nucleo-t3': 'x' }, picks: { 'eq-nucleo-t1': ['b', 'z', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b'], 'eq-xxx': ['b'] } }))
      .toEqual({ v: FORGE_SCHEMA, levels: { 'eq-nucleo-t1': 15, 'eq-nucleo-t2': 1 }, picks: { 'eq-nucleo-t1': ['b', 'a', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b', 'b'] } });
    for (const lixo of [null, 3, 'x', [], undefined]) expect(sanitizeForge(lixo)).toEqual({ levels: {}, picks: {} });
  });
});

function COMBAT_BUS() { return COMBAT_BONUS_CAP; }

describe('fiação', () => {
  it('o resgate da missão do prédio é o ponto que concede a peça (App.tsx › resgatarPredio chama applyForgeGrant)', () => {
    const app = readFileSync(`${process.cwd()}/src/App.tsx`, 'utf8');
    const corpo = app.slice(app.indexOf('const resgatarPredio = useCallback'), app.indexOf('const resgatarMissao = useCallback'));
    expect(corpo).toMatch(/claimBuildingQuest\(/);
    expect(corpo).toMatch(/applyForgeGrant\(/);
  });
  it('todo consumidor do bônus de equipamento passa o `forge` (senão o nível não vale em luta)', () => {
    const src = readFileSync(`${process.cwd()}/src/contexts/useTalentBonus.ts`, 'utf8');
    expect(src).toMatch(/equipScalar\(equipment, forge\)/);
    expect(src).toMatch(/equipAttrBonus\(equipment, forge\)/);
    expect(src).toMatch(/'pve'\), equipment, forge\)/);
    const duel = readFileSync(`${process.cwd()}/functions/api/_duel.js`, 'utf8');
    expect(duel).toMatch(/equipAttrBonus\(state\.equipment, state\.forge\)/);
  });
});
