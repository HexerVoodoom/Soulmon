/**
 * Combate v3 / PR12b (§2.28 C) — os nós de Comércio que estavam "em breve": mochila (`tal-com-04`), Bits do dia completo
 * (`tal-com-06`). O desconto da semana (`tal-com-07`) saiu (REGISTRO §121). Linhas vermelhas travadas aqui: Comércio só mexe em preço/ganho de moeda
 * (nunca em % de combate), dentro do +25%, sem sorteio, sem pressa.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EQUIP_CATALOG, BACKPACK_BASE, MISSION_BITS_STEP, COMMERCE_GAIN_CAP,
  backpackCapacity, backpackUsed, backpackHasRoom, missionBitsGain,
  equipBuyRefusal, applyEquipBuy, sanitizeEquipment, type EquipmentState,
} from './equipment';
import { TALENT_BY_ID, isPickable, sanitizeTalentPicks, talentBonus, talentAttrBonus, talentCheerScale } from './talents';
import { TALENT_COPY } from './talentCopy';
import { computeDailyReset, restWeekKeyFor, BITS_PER_COMPLETE_DAY } from './dailyReset';
import { xpForLevel } from './bond';

const rep = (id: string, n: number) => Array<string>(n).fill(id);
/** Tarefa B: a mochila/Bits de missão/desconto abrem só depois dos pré-requisitos do grafo. */
const ATE_02 = [...rep('tal-com-01', 2), ...rep('tal-com-02', 2)];
const COM06 = [...ATE_02, ...rep('tal-com-06', 3)];
const COM05 = [...ATE_02, 'tal-com-04', ...rep('tal-com-03', 2), 'tal-com-05'];
const eqOf = (equipped: Record<string, string>, extra: string[] = []): EquipmentState => ({ owned: [...Object.values(equipped), ...extra], equipped, fragments: 0 });
const T1 = { nucleo: 'eq-nucleo-t1', carapaca: 'eq-carapaca-t1', rastro: 'eq-rastro-t1' };

describe('1. os dois nós têm efeito e são pegáveis; o 07 foi aposentado', () => {
  it('tal-com-04/06 saíram de "pendente" e são de Comércio; tal-com-07 não existe mais', () => {
    for (const [id, kind, rank] of [['tal-com-04', 'backpack', 3], ['tal-com-06', 'missionBits', 3]] as const) {
      const n = TALENT_BY_ID.get(id)!;
      expect(n.path).toBe('comercio');
      expect(n.effect.kind).toBe(kind);
      expect(n.maxRank).toBe(rank);
      expect(isPickable(n)).toBe(true);
    }
    expect(TALENT_BY_ID.has('tal-com-07')).toBe(false);
  });
  it('LINHA VERMELHA: nenhum nó de Comércio entra em % de combate (PvP, PvE, torcida)', () => {
    const todos = ['tal-com-01', 'tal-com-02', 'tal-com-03', 'tal-com-04', 'tal-com-05', 'tal-com-06'].flatMap((id) => rep(id, TALENT_BY_ID.get(id)!.maxRank));
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
  it('Soulsmith: UMA peça por tipo — a mochila de peças não ocupa mais nada (o tier mais alto fica, o resto deixa de ser possuído)', () => {
    expect(backpackUsed(eqOf({ nucleo: 'eq-nucleo-t1' }))).toBe(0);
    const antigo = eqOf(T1, EQUIP_CATALOG.filter((i) => !Object.values(T1).includes(i.id)).map((i) => i.id)); // as 9 do save antigo
    expect(sanitizeEquipment(antigo).owned).toEqual(['eq-nucleo-t3', 'eq-carapaca-t3', 'eq-rastro-t3']);
    expect(backpackUsed(antigo)).toBe(0);
  });
  it('comprar o tier maior de um slot ocupado nunca é recusado por mochila (a compra legada só substitui)', () => {
    const equipment: EquipmentState = { owned: ['eq-nucleo-t1', 'eq-carapaca-t1'], equipped: { nucleo: 'eq-nucleo-t1', carapaca: 'eq-carapaca-t1' }, fragments: 99 };
    expect(equipBuyRefusal({ gamePoints: 99999, equipment }, 'eq-carapaca-t3', 'bits')).toBeUndefined();
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

describe('4. sem sorteio, sem pressa, sem dinheiro', () => {
  const ler = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8').replace(/\r\n/g, '\n');
  const sem = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  it('equipment.ts não tem Math.random nem relógio ', () => {
    expect(sem(ler('utils/equipment.ts'))).not.toMatch(/Math\s*\.\s*random|Date\s*\.\s*now|new Date\(/);
  });
  it('a copy dos nós não cobra, não apressa e não promete sorte', () => {
    for (const id of ['tal-com-04', 'tal-com-06']) {
      const c = TALENT_COPY[id];
      for (const t of [c.descPt, c.descEn, c.namePt, c.nameEn]) {
        expect(t).not.toMatch(/última chance|só hoje|corra|acaba em|expira|termina em|sorte|limited|hurry|last chance|ends in|expires|luck|R\$|\$/i);
      }
      expect(c.descPt).not.toMatch(/Chega com/);
      expect(c.descEn).not.toMatch(/Arrives with/);
    }
  });
  it('sanitizeTalentPicks aceita os novos ids e respeita o grau máximo', () => {
    expect(sanitizeTalentPicks([...ATE_02, ...rep('tal-com-04', 3), 'tal-com-06', ...rep('tal-com-03', 2), 'tal-com-05'], 20)).toHaveLength(11);
    // `tal-com-07` foi aposentado: save que o tinha só perde esse ponto (o resto do vetor fica)
    expect(sanitizeTalentPicks([...COM05, 'tal-com-07'], 20)).toEqual(COM05);
    expect(sanitizeTalentPicks([...ATE_02, ...rep('tal-com-04', 4)], 20)).toEqual([]);
  });
});
