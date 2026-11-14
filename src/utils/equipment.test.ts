/**
 * Combate v3 / PR8 — equipamento, procedência dos Bits e o teto de 5%. Critérios 1–5 e 7 da story (sem lootbox: decisão do dono,
 * §2.26 — aquisição por loja direta ou fragmentos, sem sorteio).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as require_equipment from './equipment';
import {
  EQUIP_CATALOG, EQUIP_BY_ID, EQUIP_SLOTS, SLOT_ATTR, TIER_PCT, TIER_BITS, TIER_FRAGMENTS, FRAGMENTS_MAX, EMPTY_EQUIPMENT,
  sanitizeEquipment, equipAttrBonus, equipScalar, equipPriceDiscount, fragmentGain, discounted, equipBuyRefusal, applyEquipBuy,
  addFragments, spendBits, equipPrice, COMMERCE_GAIN_CAP, PRICE_STEP,
  type EquipmentState,
} from './equipment';
import {
  noteCreditBits, noteFreeBits, spendableBits, spendBitsPaidFirst, normalizeOrigin, sanitizeBitsOrigin,
} from './bitsOrigin';
import * as bitsOriginMod from './bitsOrigin';
import { combinedAttrBonus, combinedBonus, COMBAT_BONUS_CAP } from './combate/bonus';
import { combatantAt, REFERENCE_BUILDS, RULER_LEVELS } from './combate/level';
import { fight } from './combate/fight';
import { talentAttrBonus } from './talents';
import type { Combatant } from './combate/curve';

const DAY = 'Mon Oct 05 2026';
type EState = { gamePoints?: number; bitsOrigin?: import('./bitsOrigin').BitsOrigin; equipment?: EquipmentState; talentPicks?: string[] };
const full = (): EquipmentState => ({
  owned: EQUIP_CATALOG.filter((i) => i.tier === 3).map((i) => i.id),
  equipped: { nucleo: 'eq-nucleo-t3', carapaca: 'eq-carapaca-t3', rastro: 'eq-rastro-t3' },
  fragments: 0,
});

describe('1. o catálogo: 3 slots, um por atributo, 3 tiers, percentual', () => {
  it('Núcleo=ATK, Carapaça=DEF, Rastro=SPD; 9 itens; o tier só cresce', () => {
    expect(SLOT_ATTR).toEqual({ nucleo: 'atk', carapaca: 'def', rastro: 'spd' });
    expect(EQUIP_CATALOG).toHaveLength(9);
    for (const slot of EQUIP_SLOTS) {
      const t = EQUIP_CATALOG.filter((i) => i.slot === slot);
      expect(t.map((i) => i.tier)).toEqual([1, 2, 3]);
      expect(t.map((i) => i.pct)).toEqual([...TIER_PCT]);
      expect(t[0].bits).toBeLessThan(t[1].bits);
      expect(t[1].bits).toBeLessThan(t[2].bits);
    }
    expect(TIER_FRAGMENTS[0]).toBeLessThan(TIER_FRAGMENTS[2]);
  });

  it('todo item é PERCENTUAL e o equipamento sozinho cabe no teto de 5%', () => {
    for (const i of EQUIP_CATALOG) expect(i.pct).toBeGreaterThan(0), expect(i.pct).toBeLessThan(0.05);
    expect(equipScalar(full())).toBeCloseTo(0.045, 12);
    expect(equipScalar(full())).toBeLessThanOrEqual(COMBAT_BONUS_CAP);
    expect(equipAttrBonus(full())).toEqual({ atk: 0.015, def: 0.015, spd: 0.015 });
  });

  it('cada slot cai no canal do SEU atributo', () => {
    const so = (id: string, slot: string) => equipAttrBonus({ owned: [id], equipped: { [slot]: id }, fragments: 0 });
    // Ferreiro (07/10/2026): peça possuída sem registro vale o nível equivalente do tier (2/4/5 = 0,5/1,1/1,5%): nunca menos que antes.
    const near = (a: { atk: number; def: number; spd: number }, b: { atk: number; def: number; spd: number }) => { for (const k of ['atk', 'def', 'spd'] as const) expect(a[k]).toBeCloseTo(b[k], 12); };
    near(so('eq-nucleo-t2', 'nucleo'), { atk: 0.011, def: 0, spd: 0 });
    near(so('eq-carapaca-t1', 'carapaca'), { atk: 0, def: 0.005, spd: 0 });
    near(so('eq-rastro-t3', 'rastro'), { atk: 0, def: 0, spd: 0.015 });
  });

  it('sem sorteio: nenhum arquivo de equipamento/procedência lê Math.random nem chance', () => {
    for (const f of ['equipment.ts', 'bitsOrigin.ts']) {
      const src = readFileSync(`${process.cwd()}/src/utils/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      expect(src, f).not.toMatch(/Math\.random|mulberry32|\bodds\b|\bpity\b/i);
    }
  });
});

describe('2. o teto de 5% (razão das médias, HP×3) com talento + equipamento', () => {
  const N = 20;
  const L = RULER_LEVELS[Math.floor(RULER_LEVELS.length / 2)];
  const base = combatantAt(L, REFERENCE_BUILDS.balanced);
  /** Vantagem média: Σ tA / Σ tB − 1 (HP×3, mesma semente), menos o espelho. */
  function adv(a: Combatant): number {
    const run = (x: Combatant) => {
      let ta = 0, tb = 0;
      for (let s = 1; s <= N; s++) {
        const r = fight({ combatant: x, special: null }, { combatant: base, special: null }, { seed: s * 104729 + L, hpScale: 3 });
        ta += r.timeA; tb += r.timeB;
      }
      return ta / tb - 1;
    };
    return run(a) - run(base);
  }

  it('256 combinações (4 por slot × 4 estados de talento): o bônus fica ≤ 5% e a vantagem medida ≤ ~5,5%', () => {
    const opt = [undefined, 1, 2, 3] as const;
    const talents = [
      { atk: 0, def: 0, spd: 0 },
      talentAttrBonus(Array(4).fill('tal-pvp-01'), 20),
      talentAttrBonus([...Array(4).fill('tal-pvp-02'), ...Array(4).fill('tal-pvp-03')], 20),
      talentAttrBonus([...Array(4).fill('tal-pvp-01'), ...Array(4).fill('tal-pvp-02'), ...Array(4).fill('tal-pvp-03')], 20),
    ];
    let n = 0, worst = -Infinity;
    for (const a of opt) for (const b of opt) for (const c of opt) for (const t of talents) {
      const equipped: Record<string, string> = {};
      if (a) equipped.nucleo = `eq-nucleo-t${a}`;
      if (b) equipped.carapaca = `eq-carapaca-t${b}`;
      if (c) equipped.rastro = `eq-rastro-t${c}`;
      const eq = { owned: Object.values(equipped), equipped, fragments: 0 };
      const bonus = combinedAttrBonus({ talent: t, equipment: equipAttrBonus(eq) });
      expect(bonus.atk + bonus.def + bonus.spd).toBeLessThanOrEqual(COMBAT_BONUS_CAP + 1e-12);
      worst = Math.max(worst, adv(combatantAt(L, REFERENCE_BUILDS.balanced, bonus)));
      n++;
    }
    expect(n).toBe(256);
    expect(worst).toBeLessThanOrEqual(0.055);
    expect(worst).toBeGreaterThan(0.03); // o teto cheio é alcançável: não é um teto de enfeite
  });

  it('PROVA DE VERMELHO: um item PLANO de +1 ponto no L1 passa de 5% (por isso o bônus é percentual)', () => {
    const l1 = combatantAt(1, REFERENCE_BUILDS.balanced);
    const plano = { ...l1, atk: l1.atk + 1 };
    let ta = 0, tb = 0, ta0 = 0, tb0 = 0;
    for (let s = 1; s <= N; s++) {
      const r = fight({ combatant: plano, special: null }, { combatant: l1, special: null }, { seed: s * 7 + 1, hpScale: 3 });
      const z = fight({ combatant: l1, special: null }, { combatant: l1, special: null }, { seed: s * 7 + 1, hpScale: 3 });
      ta += r.timeA; tb += r.timeB; ta0 += z.timeA; tb0 += z.timeB;
    }
    expect(ta / tb - ta0 / tb0).toBeGreaterThan(0.05);
  });

  it('PROVA DE VERMELHO: sem o corte, equipamento cheio + talento cheio passa do teto', () => {
    const cru = { atk: 0.015 + 0.016, def: 0.015 + 0.016, spd: 0.015 + 0.016 };
    expect(cru.atk + cru.def + cru.spd).toBeGreaterThan(COMBAT_BONUS_CAP);
    expect(adv(combatantAt(L, REFERENCE_BUILDS.balanced, cru))).toBeGreaterThan(0.055);
  });

  it('na fenda o equipamento entra como UMA soma no canal escalar, no mesmo teto', () => {
    expect(combinedBonus({ talent: 0.03, equipment: equipScalar(full()) })).toBe(COMBAT_BONUS_CAP);
    expect(combinedBonus({ equipment: equipScalar(full()) })).toBeCloseTo(0.045, 12);
  });
});

describe('3. o save: posse e slot saneados, peça a peça', () => {
  it('slot forjado (item de outro slot, não possuído, id inventado) volta vazio; fragmentos clampados', () => {
    const r = sanitizeEquipment({
      owned: ['eq-nucleo-t1', 'eq-nucleo-t1', 'eq-xxx', 7, '__proto__', 'eq-rastro-t2'],
      equipped: { nucleo: 'eq-rastro-t2', carapaca: 'eq-carapaca-t3', rastro: 'eq-rastro-t2', extra: 'eq-nucleo-t1' },
      fragments: 1e12,
    });
    expect(r.owned).toEqual(['eq-nucleo-t1', 'eq-rastro-t2']);
    expect(r.equipped).toEqual({ nucleo: 'eq-nucleo-t1', rastro: 'eq-rastro-t2' }); // nucleo forjado (item do Rastro) e carapaca (não possuída) caíram
    expect(r.fragments).toBe(FRAGMENTS_MAX);
    for (const lixo of [null, undefined, 3, 'x', [], { owned: 'eq-nucleo-t1' }, { fragments: NaN }, { fragments: -5 }]) {
      expect(sanitizeEquipment(lixo), JSON.stringify(lixo)).toEqual(expect.objectContaining({ fragments: 0 }));
      expect(equipScalar(lixo)).toBe(0);
    }
    expect(sanitizeEquipment(null)).toBe(EMPTY_EQUIPMENT);
  });
  it('um save forjado com tudo equipado vale no máximo o equipamento cheio (e o teto corta o resto)', () => {
    const forjado = { owned: EQUIP_CATALOG.map((i) => i.id), equipped: { nucleo: 'eq-nucleo-t3', carapaca: 'eq-carapaca-t3', rastro: 'eq-rastro-t3' }, fragments: 5 };
    expect(equipScalar(forjado)).toBeLessThanOrEqual(0.045 + 1e-12);
  });
});

describe('4. §373: o Bit que veio de Crédito TAMBÉM compra equipamento (o teto de 5% segura)', () => {
  const rico = (extra: Record<string, unknown> = {}) => ({ gamePoints: 5000, equipment: EMPTY_EQUIPMENT, ...extra });

  it('compra com Bits: debita o preço, posse e equipa na hora', () => {
    const r = applyEquipBuy(rico(), 'eq-nucleo-t1', 'bits');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.gamePoints).toBe(5000 - TIER_BITS[0]);
      expect(r.state.equipment!.owned).toEqual(['eq-nucleo-t1']);
      expect(r.state.equipment!.equipped.nucleo).toBe('eq-nucleo-t1');
    }
  });

  it('o Bit vindo de Crédito paga equipamento (antes recusava com not-earned) e é gasto PRIMEIRO; sem saldo, no-funds', () => {
    const s: EState = rico({ gamePoints: 1000, bitsOrigin: { day: DAY, free: 0, fromCredits: 700, paidLeft: 700 } });
    expect(spendableBits(s)).toBe(1000);
    expect(equipBuyRefusal(s, 'eq-nucleo-t1', 'bits')).toBeUndefined();
    const r = applyEquipBuy(s, 'eq-nucleo-t1', 'bits');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.gamePoints).toBe(600);
      expect(r.state.bitsOrigin!.paidLeft).toBe(300); // 700 pagos − 400: o pago sai primeiro
    }
    // tudo de Crédito também paga
    expect(equipBuyRefusal(rico({ gamePoints: 400, bitsOrigin: { day: DAY, free: 0, fromCredits: 400, paidLeft: 400 } }), 'eq-nucleo-t1', 'bits')).toBeUndefined();
    expect(equipBuyRefusal({ ...s, gamePoints: 399 }, 'eq-nucleo-t1', 'bits')).toBe('no-funds');
  });

  it('a guarda de procedência saiu: nenhum export de bitsOrigin gateia por Bit ganho', () => {
    for (const nome of ['earnedBits', 'spendEarnedBits', 'creditExchangeRoom', 'applyCreditExchange', 'CREDIT_BITS_CAP_RATIO']) {
      expect(nome in bitsOriginMod, nome).toBe(false);
    }
  });

  it('todo gasto gasta o Bit pago primeiro, e paidLeft nunca passa do saldo', () => {
    let s: Record<string, unknown> = { gamePoints: 1000, bitsOrigin: { day: DAY, free: 0, fromCredits: 600, paidLeft: 600 } };
    s = spendBits(s as never, 600) as never; // um cosmético de 600
    expect((s.bitsOrigin as { paidLeft: number }).paidLeft).toBe(0);
    expect(s.gamePoints).toBe(400);
    expect(equipBuyRefusal(s as never, 'eq-nucleo-t1', 'bits')).toBeUndefined();
    expect(spendBitsPaidFirst({ gamePoints: 50, bitsOrigin: { day: DAY, free: 0, fromCredits: 0, paidLeft: 900 } }, 10).bitsOrigin!.paidLeft).toBe(50);
  });

  it('recusas: desconhecido, já possuído, sem Bits, sem fragmentos; dois toques no mesmo lote não compram duas vezes', () => {
    expect(equipBuyRefusal(rico(), 'eq-nada', 'bits')).toBe('unknown');
    const a = applyEquipBuy(rico(), 'eq-nucleo-t1', 'bits');
    expect(a.ok && equipBuyRefusal(a.state, 'eq-nucleo-t1', 'bits')).toBe('already-owned');
    expect(equipBuyRefusal({ gamePoints: 399 }, 'eq-nucleo-t1', 'bits')).toBe('no-funds');
    expect(equipBuyRefusal({ gamePoints: 99999 }, 'eq-nucleo-t1', 'fragments')).toBe('no-fragments');
    const exato: EState = { gamePoints: TIER_BITS[0] };
    const p1 = applyEquipBuy(exato, 'eq-nucleo-t1', 'bits');
    expect(p1.ok).toBe(true);
    if (p1.ok) expect(p1.state.gamePoints).toBe(0);
    expect(applyEquipBuy({ gamePoints: 0, equipment: { owned: ['eq-nucleo-t1'], equipped: {}, fragments: 0 } }, 'eq-nucleo-t1', 'bits').ok).toBe(false);
  });

  it('fragmentos: compram sem tocar nos Bits; um tier maior no mesmo slot substitui o anterior', () => {
    const s: EState = { gamePoints: 7, equipment: { owned: [], equipped: {}, fragments: 10 } };
    const r = applyEquipBuy(s, 'eq-rastro-t1', 'fragments');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.gamePoints).toBe(7);
      expect(r.state.equipment!.fragments).toBe(10 - TIER_FRAGMENTS[0]);
      const r2 = applyEquipBuy({ ...r.state, equipment: { ...r.state.equipment!, fragments: 99 } } as EState, 'eq-rastro-t2', 'fragments');
      expect(r2.ok && r2.state.equipment!.equipped.rastro).toBe('eq-rastro-t1'); // slot ocupado: não troca sozinho
      // Soulsmith: uma peça por tipo — comprar um tier maior em slot ocupado deixa só o mais alto (sanitize).
      const unico = sanitizeEquipment(r2.ok ? r2.state.equipment : r.state.equipment);
      expect(unico.owned.filter((id) => id.startsWith('eq-rastro')).length).toBe(1);
      expect(unico.equipped.rastro).toBe('eq-rastro-t2');
      expect('applyUnequip' in (require_equipment ?? {})).toBe(false); // não existe desequipar
    }
  });

  it('Soulsmith: peça possuída está sempre equipada; save antigo com slot "tirado" é normalizado (idempotente, sem perder peça)', () => {
    const velho = { owned: ['eq-nucleo-t1', 'eq-nucleo-t2', 'eq-rastro-t1'], equipped: {}, fragments: 7 };
    const n = sanitizeEquipment(velho);
    expect(n.equipped).toEqual({ nucleo: 'eq-nucleo-t2', rastro: 'eq-rastro-t1' });
    expect(n.owned).toEqual(['eq-nucleo-t2', 'eq-rastro-t1']); // uma peça por tipo: fica o tier mais alto
    expect(n.fragments).toBe(7);
    expect(sanitizeEquipment(n)).toEqual(n);
    expect(sanitizeEquipment({ owned: ['eq-nucleo-t1', 'eq-nucleo-t2'], equipped: { nucleo: 'eq-nucleo-t1' } }).equipped).toEqual({ nucleo: 'eq-nucleo-t2' });
  });

  it('addFragments soma, respeita o teto e ignora lixo', () => {
    expect(addFragments({} as { equipment?: EquipmentState }, 5).equipment!.fragments).toBe(5);
    expect(addFragments({ equipment: { owned: [], equipped: {}, fragments: 998 } }, 50).equipment!.fragments).toBe(FRAGMENTS_MAX);
    const s: { equipment?: EquipmentState } = {};
    expect(addFragments(s, NaN)).toBe(s);
    expect(addFragments(s, -3)).toBe(s);
  });
});

describe('5. o Comércio: só preço e ganho de moeda, dentro do +25%', () => {
  it('Etiqueta barateia o Bit; Fragmentos soma ganho; nenhum dos dois toca combate', () => {
    const tres = ['tal-com-01', 'tal-com-01', 'tal-com-01'];
    expect(equipPriceDiscount(tres)).toBeCloseTo(3 * PRICE_STEP, 12);
    expect(equipPrice(EQUIP_BY_ID.get('eq-nucleo-t3')!, 'bits', tres)).toBe(discounted(TIER_BITS[2], 0.12));
    expect(equipPrice(EQUIP_BY_ID.get('eq-nucleo-t3')!, 'bits', [])).toBe(TIER_BITS[2]);
    expect(equipPrice(EQUIP_BY_ID.get('eq-nucleo-t3')!, 'fragments', tres)).toBe(TIER_FRAGMENTS[2]); // fragmento não tem desconto
    expect(fragmentGain(10, ['tal-com-02', 'tal-com-02', 'tal-com-02'])).toBe(11);
    expect(fragmentGain(100, ['tal-com-02', 'tal-com-02', 'tal-com-02'])).toBe(115);
    expect(fragmentGain(100, [])).toBe(100);
    // o ganho do Comércio nunca passa do +25%, nem com um vetor absurdo
    expect(fragmentGain(1000, Array(40).fill('tal-com-02'))).toBeLessThanOrEqual(1000 * (1 + COMMERCE_GAIN_CAP));
    expect(equipPriceDiscount(Array(40).fill('tal-com-01'))).toBeLessThanOrEqual(0.6);
    expect(discounted(1, 0.6)).toBe(1); // nunca de graça
  });
  it('o preço com desconto é o que a compra cobra', () => {
    const picks = ['tal-com-01', 'tal-com-01'];
    const r = applyEquipBuy({ gamePoints: 5000, talentPicks: picks }, 'eq-carapaca-t2', 'bits');
    expect(r.ok && r.price).toBe(discounted(TIER_BITS[1], 0.08));
    expect(r.ok && r.state.gamePoints).toBe(5000 - discounted(TIER_BITS[1], 0.08));
  });
});

describe('6. §373: Bits de pacote entram SEM teto de cliente (o teto de 1.000/dia é do servidor), e a procedência segue escrita', () => {
  it('noteCreditBits soma ao saldo e registra fromCredits/paidLeft; não há teto de 25% no cliente', () => {
    const s: EState = noteFreeBits({ gamePoints: 0 } as EState, 100, DAY); // dia só de cuidado: o teto antigo daria 25
    const r = noteCreditBits(s, 1000, DAY);
    expect(r.gamePoints).toBe(1000);
    expect(r.bitsOrigin).toEqual({ day: DAY, free: 100, fromCredits: 1000, paidLeft: 1000 });
    expect(noteCreditBits(r, 200, DAY).bitsOrigin).toEqual({ day: DAY, free: 100, fromCredits: 1200, paidLeft: 1200 });
  });

  it('quantia inválida não muda nada (devolve o MESMO objeto)', () => {
    const s: EState = { gamePoints: 10 };
    expect(noteCreditBits(s, 0, DAY)).toBe(s);
    expect(noteCreditBits(s, -5, DAY)).toBe(s);
    expect(noteCreditBits(s, NaN, DAY)).toBe(s);
  });

  it('virar o dia zera o contador do dia e MANTÉM o Bit pago no saldo (compat: paidLeft não some)', () => {
    const hoje = noteCreditBits({ gamePoints: 0 } as EState, 200, DAY);
    expect(normalizeOrigin(hoje.bitsOrigin, 'Tue Oct 06 2026')).toEqual({ day: 'Tue Oct 06 2026', free: 0, fromCredits: 0, paidLeft: 200 });
  });

  it('lixo no registro: o saneamento descarta o que não tem forma', () => {
    expect(sanitizeBitsOrigin({ day: 3 })).toBeUndefined();
    expect(sanitizeBitsOrigin(null)).toBeUndefined();
    expect(sanitizeBitsOrigin({ day: DAY, free: 1e15, fromCredits: -1, paidLeft: 'x' })).toEqual({ day: DAY, free: 1e9, fromCredits: 0, paidLeft: 0 });
  });

  it('o ganho grátis soma: Bit de minijogo conta, pacote de Crédito não', async () => {
    const { creditMinigameBits } = await import('./currencies');
    const g = creditMinigameBits({ gamePoints: 0 } as EState, 40, DAY);
    expect(g.bitsOrigin?.free).toBe(40);
    expect(noteCreditBits(g, 200, DAY).bitsOrigin!.free).toBe(40);
  });
});
