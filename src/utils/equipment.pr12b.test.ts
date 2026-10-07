/**
 * Combate v3 / PR12b (§2.28 C) — os três nós de Comércio que estavam "em breve": mochila (`tal-com-04`), Bits do dia completo
 * (`tal-com-06`) e desconto da semana (`tal-com-07`). Linhas vermelhas travadas aqui: Comércio só mexe em preço/ganho de moeda
 * (nunca em % de combate), dentro do +25%, sem sorteio, sem pressa.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EQUIP_CATALOG, BACKPACK_BASE, MISSION_BITS_STEP, WEEKLY_DISCOUNT, COMMERCE_GAIN_CAP, PRICE_STEP, TIER_BITS,
  backpackCapacity, backpackUsed, backpackHasRoom, missionBitsGain, weeklyDiscountItem, weeklyDiscountFor,
  equipBuyRefusal, applyEquipBuy, applyEquip, equipPrice, discounted, type EquipmentState,
} from './equipment';
import { TALENT_BY_ID, isPickable, sanitizeTalentPicks, talentBonus, talentAttrBonus, talentCheerScale } from './talents';
import { TALENT_COPY } from './talentCopy';
import { computeDailyReset, restWeekKeyFor, BITS_PER_COMPLETE_DAY } from './dailyReset';
import { isoWeekKey } from './offerMoment';
import { xpForLevel } from './bond';

const rep = (id: string, n: number) => Array<string>(n).fill(id);
/** Tarefa B: a mochila/Bits de missão/desconto abrem só depois dos pré-requisitos do grafo. */
const ATE_02 = [...rep('tal-com-01', 2), ...rep('tal-com-02', 2)];
const COM06 = [...ATE_02, ...rep('tal-com-06', 3)];
const COM07 = [...ATE_02, 'tal-com-04', ...rep('tal-com-03', 2), 'tal-com-05', 'tal-com-07'];
const eqOf = (equipped: Record<string, string>, extra: string[] = []): EquipmentState => ({ owned: [...Object.values(equipped), ...extra], equipped, fragments: 0 });
const T1 = { nucleo: 'eq-nucleo-t1', carapaca: 'eq-carapaca-t1', rastro: 'eq-rastro-t1' };

describe('1. os três nós agora têm efeito e são pegáveis', () => {
  it('tal-com-04/06/07 saíram de "pendente" e são de Comércio', () => {
    for (const [id, kind, rank] of [['tal-com-04', 'backpack', 3], ['tal-com-06', 'missionBits', 3], ['tal-com-07', 'weeklyDiscount', 1]] as const) {
      const n = TALENT_BY_ID.get(id)!;
      expect(n.path).toBe('comercio');
      expect(n.effect.kind).toBe(kind);
      expect(n.maxRank).toBe(rank);
      expect(isPickable(n)).toBe(true);
    }
  });
  it('LINHA VERMELHA: nenhum nó de Comércio entra em % de combate (PvP, PvE, torcida)', () => {
    const todos = ['tal-com-01', 'tal-com-02', 'tal-com-03', 'tal-com-04', 'tal-com-05', 'tal-com-06', 'tal-com-07'].flatMap((id) => rep(id, TALENT_BY_ID.get(id)!.maxRank));
    expect(talentBonus(todos, 20, 'pve')).toBe(0);
    expect(talentBonus(todos, 20, 'pvp')).toBe(0);
    expect(talentAttrBonus(todos, 20)).toEqual({ atk: 0, def: 0, spd: 0 });
    expect(talentCheerScale(todos, 20)).toBe(1);
  });
});

describe('2. tal-com-04: a mochila', () => {
  it('começa em 3 e soma 1 por grau (máx. 6 = 9 peças menos 3 slots)', () => {
    expect(BACKPACK_BASE).toBe(3);
    expect([0, 1, 2, 3].map((r) => backpackCapacity(rep('tal-com-04', r)))).toEqual([3, 4, 5, 6]);
    expect(backpackCapacity(rep('tal-com-04', 40))).toBe(6); // lixo não passa do máximo
    expect(backpackCapacity(undefined)).toBe(BACKPACK_BASE);
    expect(EQUIP_CATALOG.length - 3).toBe(6);
  });
  it('a peça que cai num slot vazio nunca ocupa a mochila; a que vai para a mochila ocupa 1', () => {
    expect(backpackUsed(eqOf({ nucleo: 'eq-nucleo-t1' }))).toBe(0);
    expect(backpackUsed(eqOf({ nucleo: 'eq-nucleo-t1' }, ['eq-nucleo-t2', 'eq-nucleo-t3']))).toBe(2);
  });
  it('mochila cheia recusa a compra que iria para ela (Bits e fragmentos); a que cai no slot vazio passa; +1 espaço abre', () => {
    const equipment: EquipmentState = { owned: ['eq-nucleo-t1', 'eq-nucleo-t2', 'eq-nucleo-t3', 'eq-carapaca-t1', 'eq-carapaca-t2'], equipped: { nucleo: 'eq-nucleo-t1', carapaca: 'eq-carapaca-t1' }, fragments: 99 };
    const base = { gamePoints: 99999, equipment };
    expect(backpackUsed(equipment)).toBe(3);
    expect(equipBuyRefusal(base, 'eq-carapaca-t3', 'bits')).toBe('backpack-full');
    expect(equipBuyRefusal(base, 'eq-carapaca-t3', 'fragments')).toBe('backpack-full');
    expect(equipBuyRefusal(base, 'eq-rastro-t3', 'bits')).toBeUndefined(); // slot vazio: equipa na hora, não ocupa mochila
    expect(equipBuyRefusal({ ...base, talentPicks: ['tal-com-04'] }, 'eq-carapaca-t3', 'bits')).toBeUndefined(); // +1 espaço
  });
  it('save antigo acima da capacidade NADA perde: só não entra mais; trocar peça (equipar) é neutro', () => {
    const antigo = eqOf(T1, EQUIP_CATALOG.filter((i) => !Object.values(T1).includes(i.id)).map((i) => i.id)); // as 9: 6 na mochila
    expect(antigo.owned).toHaveLength(9);
    expect(backpackUsed(antigo)).toBe(6);
    const s = { equipment: antigo, talentPicks: [] as string[] };
    const trocou = applyEquip(s, 'eq-nucleo-t3');
    expect(trocou.equipment.owned).toHaveLength(9);
    expect(backpackUsed(trocou.equipment)).toBe(6);
  });
  it('compra recusada não debita nada', () => {
    const s = { gamePoints: 99999, equipment: eqOf(T1, ['eq-nucleo-t2', 'eq-carapaca-t2', 'eq-rastro-t2']), talentPicks: [] as string[] };
    expect(applyEquipBuy(s, 'eq-nucleo-t3', 'bits')).toEqual({ ok: false, reason: 'backpack-full' });
  });
});

describe('3. tal-com-06: Bits do dia completo (a mesma fonte, sem fonte nova)', () => {
  it('+5% por grau, até +15% (dentro do +25%); sem o nó = a base; lixo não passa do teto', () => {
    expect(MISSION_BITS_STEP).toBe(0.05);
    expect([0, 1, 2, 3].map((r) => missionBitsGain(100, rep('tal-com-06', r)))).toEqual([100, 105, 110, 115]);
    expect(missionBitsGain(100, rep('tal-com-06', 40))).toBeLessThanOrEqual(100 * (1 + COMMERCE_GAIN_CAP));
    expect(missionBitsGain(100, undefined)).toBe(100);
    expect(missionBitsGain(NaN, ['tal-com-06'])).toBe(0);
  });
  const ontem = new Date('2026-09-22T12:00:00');
  const habito = { id: 'h1', category: 'Health', emoji: '🏃', weekDays: [0, 1, 2, 3, 4, 5, 6], steps: [], completedToday: true, lastCompletedDate: ontem.toDateString() };
  const estado = (extra: Record<string, unknown>) => ({
    activities: [habito], tasks: [] as unknown[], healthPoints: 3, maxHealthPoints: 3, energyPoints: 10, perfectDays: 0, totalXP: xpForLevel(8),
    powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0, gamePoints: 500, evolutionStage: 'rookie', unlockedEvolutions: ['rookie'],
    currentBranch: 'harmony' as const, maxActivityCap: 6, lastResetDate: ontem.toDateString(),
    lastDayReport: { date: new Date('2026-09-21T12:00:00').toDateString(), saveDay: 90 }, restDaysLeft: 0, restWeekKey: restWeekKeyFor(ontem), ...extra,
  });
  const now = new Date('2026-09-23T12:00:00');
  it('o dia completo paga 100 sem o nó e 115 com 3 graus; o incompleto não paga; o Bit extra é Bit GANHO e conta no ganho grátis', () => {
    const sem = computeDailyReset(estado({}), { now }) as Record<string, any>;
    const com = computeDailyReset(estado({ talentPicks: COM06 }), { now }) as Record<string, any>;
    expect(sem.gamePoints).toBe(500 + BITS_PER_COMPLETE_DAY);
    expect(com.gamePoints).toBe(500 + 115);
    expect(com.bitsOrigin.free).toBe(115);
    expect(com.bitsOrigin.paidLeft ?? 0).toBe(0);
    const ruim = computeDailyReset(estado({ talentPicks: COM06, activities: [{ ...habito, completedToday: false, lastCompletedDate: undefined }] }), { now }) as Record<string, any>;
    expect(ruim.gamePoints).toBe(500);
  });
  it('picks inválidos para o Vínculo (graus a mais) valem zero', () => {
    const forjado = computeDailyReset(estado({ talentPicks: rep('tal-com-06', 9) }), { now }) as Record<string, any>;
    expect(forjado.gamePoints).toBe(500 + BITS_PER_COMPLETE_DAY);
  });
});

describe('4. tal-com-07: o desconto da semana (determinístico, sem sorte, sem pressa)', () => {
  const semanas = Array.from({ length: 27 }, (_, i) => `2026-W${String(10 + i).padStart(2, '0')}`);
  it('a mesma semana dá sempre a mesma peça; 9 semanas seguidas passam pelas 9 peças sem repetir', () => {
    for (const w of semanas) expect(weeklyDiscountItem(w)).toBe(weeklyDiscountItem(w));
    for (let i = 0; i + 9 <= semanas.length; i += 9) expect(new Set(semanas.slice(i, i + 9).map(weeklyDiscountItem)).size).toBe(9);
    expect(weeklyDiscountItem(semanas[0])).not.toBe(weeklyDiscountItem(semanas[1]));
  });
  it('chave inválida = nenhuma peça (nunca lança)', () => {
    for (const w of [undefined, null, '', 'x', '2026-W1', '2026-13', 7]) expect(weeklyDiscountItem(w as never)).toBeNull();
  });
  it('só a peça da semana, só com o nó, 20% em Bits; soma com a Etiqueta sem passar de 60%; fragmentos não mudam', () => {
    const w = '2026-W41';
    const id = weeklyDiscountItem(w)!;
    const item = EQUIP_CATALOG.find((i) => i.id === id)!;
    const outro = EQUIP_CATALOG.find((i) => i.id !== id)!;
    expect(weeklyDiscountFor(id, [], w)).toBe(0);
    expect(weeklyDiscountFor(id, ['tal-com-07'], w)).toBe(WEEKLY_DISCOUNT);
    expect(weeklyDiscountFor(outro.id, ['tal-com-07'], w)).toBe(0);
    expect(equipPrice(item, 'bits', ['tal-com-07'], w)).toBe(discounted(TIER_BITS[item.tier - 1], WEEKLY_DISCOUNT));
    expect(equipPrice(outro, 'bits', ['tal-com-07'], w)).toBe(TIER_BITS[outro.tier - 1]); // as outras peças não mudam
    expect(equipPrice(item, 'bits', [...rep('tal-com-01', 3), 'tal-com-07'], w)).toBe(discounted(TIER_BITS[item.tier - 1], 3 * PRICE_STEP + WEEKLY_DISCOUNT));
    expect(3 * PRICE_STEP + WEEKLY_DISCOUNT).toBeLessThanOrEqual(0.6);
    expect(equipPrice(item, 'fragments', ['tal-com-07'], w)).toBe(item.fragments);
    expect(equipPrice(item, 'bits', ['tal-com-07'])).toBe(item.bits); // sem semana, sem desconto
  });
  it('a compra cobra o preço com o desconto da semana, e só Bits GANHOS pagam', () => {
    const w = '2026-W41';
    const id = weeklyDiscountItem(w)!;
    const item = EQUIP_CATALOG.find((i) => i.id === id)!;
    const preco = discounted(item.bits, WEEKLY_DISCOUNT);
    const s = { gamePoints: 5000, talentPicks: ['tal-com-07'], weekKey: w };
    const r = applyEquipBuy(s, id, 'bits');
    expect(r.ok && r.price).toBe(preco);
    expect(r.ok && r.state.gamePoints).toBe(5000 - preco);
    const credito = { ...s, bitsOrigin: { day: 'x', free: 0, fromCredits: 5000, paidLeft: 5000 } };
    expect(equipBuyRefusal(credito, id, 'bits')).toBe('not-earned');
  });
  it('a semana ISO do dia do jogador (formato do app) alimenta a chave', () => {
    expect(weeklyDiscountItem(isoWeekKey('Mon Oct 05 2026'))).not.toBeNull();
  });
});

describe('5. sem sorteio, sem pressa, sem dinheiro', () => {
  const ler = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8').replace(/\r\n/g, '\n');
  const sem = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  it('equipment.ts não tem Math.random nem relógio (o desconto da semana vem da chave que entra por parâmetro)', () => {
    expect(sem(ler('utils/equipment.ts'))).not.toMatch(/Math\s*\.\s*random|Date\s*\.\s*now|new Date\(/);
  });
  it('a copy dos três nós não cobra, não apressa e não promete sorte', () => {
    for (const id of ['tal-com-04', 'tal-com-06', 'tal-com-07']) {
      const c = TALENT_COPY[id];
      for (const t of [c.descPt, c.descEn, c.namePt, c.nameEn]) {
        expect(t).not.toMatch(/última chance|só hoje|corra|acaba em|expira|termina em|sorte|limited|hurry|last chance|ends in|expires|luck|R\$|\$/i);
      }
      expect(c.descPt).not.toMatch(/Chega com/);
      expect(c.descEn).not.toMatch(/Arrives with/);
    }
  });
  it('sanitizeTalentPicks aceita os novos ids e respeita o grau máximo', () => {
    expect(sanitizeTalentPicks([...ATE_02, ...rep('tal-com-04', 3), 'tal-com-06', ...rep('tal-com-03', 2), 'tal-com-05', 'tal-com-07'], 20)).toHaveLength(12);
    expect(sanitizeTalentPicks([...COM07, 'tal-com-07'], 20)).toEqual([]);
    expect(sanitizeTalentPicks([...ATE_02, ...rep('tal-com-04', 4)], 20)).toEqual([]);
  });
});
