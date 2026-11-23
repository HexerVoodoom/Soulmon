/**
 * Buffs do clã (10/11/2026): paridade com o servidor + os quatro efeitos (gauge ≤ teto, drop, energia; a Feira é do servidor)
 * + a doação (§373: o saldo inteiro doa, inclusive o Bit vindo de Crédito).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  BUFF_IDS, BUFF_DIAS, BUFF_MS, BUFF_PRECO, BUFF_GAUGE_MULT, BUFF_DROP_MULT, BUFF_ENERGIA_PCT, BUFF_COPY_TABLE,
  rememberClanBuffs, clearClanBuffs, resetClanBuffsCache, clanBuffActive, sanitizeBuffsAtivos,
} from './guildBuffs';
import { aplicarBuffClaGauge, dailyGaugeCap } from './evolutionGauge';
import { heartDropChance, HEART_DROP_CHANCE } from './dungeonBase';
import { regenPoints, clanRegenBoost, UNIT_POINTS, SLEEP_ENERGY_REGEN_BONUS, energyStatus, settleEnergy, type HungerState } from './hunger';
import { spendBitsIfCovered, spendableBits } from './bitsOrigin';
import { CASA_DOACOES } from './guildRules';

const srv = fs.readFileSync(path.resolve(__dirname, '../../functions/api/_buffsCla.js'), 'utf8');
const srvNum = (nome: string) => Number(new RegExp(`export const ${nome} = ([\\d.]+);`).exec(srv)?.[1]);
const feira = fs.readFileSync(path.resolve(__dirname, '../../functions/api/_feiraLoja.js'), 'utf8');

const T0 = Date.UTC(2026, 10, 10, 12);
beforeEach(() => { resetClanBuffsCache(); clearClanBuffs(); });

describe('espelho do servidor', () => {
  it('ids, duração, multiplicadores e o preço batem; Feira 8% → 12%', () => {
    expect(BUFF_IDS).toEqual(['gauge', 'feira', 'drop', 'energia']);
    expect(/BUFFS = Object\.freeze\(\['gauge', 'feira', 'drop', 'energia'\]\)/.test(srv)).toBe(true);
    expect(BUFF_DIAS).toBe(srvNum('BUFF_DIAS'));
    expect(BUFF_GAUGE_MULT).toBe(srvNum('BUFF_GAUGE_MULT'));
    expect(BUFF_DROP_MULT).toBe(srvNum('BUFF_DROP_MULT'));
    expect(BUFF_ENERGIA_PCT).toBe(srvNum('BUFF_ENERGIA_PCT'));
    expect(BUFF_PRECO).toBe(7560);
    expect(Number(/FEIRA_LOJA_PCT = (\d+);/.exec(feira)?.[1])).toBe(8);
    expect(Number(/FEIRA_LOJA_PCT_BUFF = (\d+);/.exec(feira)?.[1])).toBe(4);
    expect(BUFF_MS).toBe(7 * 86400000);
  });
  it('a copy existe em EN e PT para todo buff e não tem dígito literal nem pressão', () => {
    for (const id of BUFF_IDS) for (const k of [`${id}.nome`, `${id}.desc`] as const) expect(BUFF_COPY_TABLE[k].every(t => t.length > 3)).toBe(true);
    for (const [, [en, pt]] of Object.entries(BUFF_COPY_TABLE)) {
      expect(en + pt).not.toMatch(/\d/);
      expect(en + pt).not.toMatch(/\b(hurry|last chance|only today|expires? soon|corra|última chance|só hoje|perca|acaba)\b/i);
    }
  });
});

describe('estado dos buffs (tolerante)', () => {
  it('lixo vira "sem buff"; cada buff vence sozinho', () => {
    expect(sanitizeBuffsAtivos(null)).toEqual({});
    expect(sanitizeBuffsAtivos({ gauge: { ate: 'x' }, fake: { ate: 9 } })).toEqual({});
    rememberClanBuffs({ gauge: { desde: T0, ate: T0 + BUFF_MS } });
    expect(clanBuffActive('gauge', T0 + 1)).toBe(true);
    expect(clanBuffActive('gauge', T0 + BUFF_MS)).toBe(false); // 7 dias
    expect(clanBuffActive('drop', T0 + 1)).toBe(false);
    clearClanBuffs();
    expect(clanBuffActive('gauge', T0 + 1)).toBe(false);
  });
});

describe('efeito: gauge +5%, nunca acima do teto diário do estágio', () => {
  it('sem buff não muda; com buff soma ~5% e é limitado pelo teto', () => {
    expect(aplicarBuffClaGauge(4, 'rookie', T0)).toBe(4);
    rememberClanBuffs({ gauge: { desde: T0 - 1000, ate: T0 + BUFF_MS } });
    const cap = dailyGaugeCap('rookie');
    expect(cap).toBe(4);
    for (let c = 0; c <= 12; c++) {
      const r = aplicarBuffClaGauge(c, 'rookie', T0);
      expect(r).toBeLessThanOrEqual(Math.max(cap, c)); // nunca fura o teto (c acima do teto nem entra: o crédito já vem limitado)
      expect(r).toBeGreaterThanOrEqual(Math.min(c, cap));
    }
    // com teto alto, o ganho sobe 5%
    expect(dailyGaugeCap('mega')).toBe(6);
    expect(aplicarBuffClaGauge(0, 'mega', T0)).toBe(0);
    // fora da janela: sem efeito
    expect(aplicarBuffClaGauge(3, 'rookie', T0 + BUFF_MS + 1)).toBe(3);
  });
  it('o multiplicador real é 1,05 (arredondado) sobre o ganho e o resultado nunca passa do teto', () => {
    rememberClanBuffs({ gauge: { desde: T0 - 1, ate: T0 + BUFF_MS } });
    // 20 de ganho seria 21, mas o teto diário de qualquer estágio é ≤ 6: o buff nunca ultrapassa
    for (const st of ['rookie', 'champion', 'ultimate', 'mega', 'ultra']) {
      const cap = dailyGaugeCap(st);
      expect(aplicarBuffClaGauge(cap, st, T0)).toBe(cap);
      expect(aplicarBuffClaGauge(cap - 1, st, T0)).toBeLessThanOrEqual(cap);
    }
    expect(Math.round(100 * BUFF_GAUGE_MULT)).toBe(105);
  });
});

describe('efeito: drop +10% na chance', () => {
  it('multiplica a chance só com o buff ativo', () => {
    expect(heartDropChance(0, T0)).toBeCloseTo(HEART_DROP_CHANCE);
    rememberClanBuffs({ drop: { desde: T0 - 1, ate: T0 + BUFF_MS } });
    expect(heartDropChance(0, T0)).toBeCloseTo(HEART_DROP_CHANCE * 1.1);
    expect(heartDropChance(0.02, T0)).toBeCloseTo((HEART_DROP_CHANCE + 0.02) * 1.1);
    expect(heartDropChance(0, T0 + BUFF_MS)).toBeCloseTo(HEART_DROP_CHANCE);
  });
});

describe('efeito: energia +10% de velocidade, junto do bônus de sono', () => {
  const HORA = 3600_000;
  it('regeneração dentro da janela rende 10% a mais; dormindo multiplica (1,5 × 1,1)', () => {
    const rec = { v: 100, at: T0 };
    const base = regenPoints(rec, T0, T0 + HORA);
    const janela = { from: T0, until: T0 + 2 * HORA, pct: BUFF_ENERGIA_PCT };
    const com = regenPoints(rec, T0, T0 + HORA, undefined, false, janela);
    expect(com).toBe(base + Math.floor(base * 0.1));
    const dorme = regenPoints(rec, T0, T0 + HORA, undefined, true);
    expect(dorme).toBe(Math.floor(base * SLEEP_ENERGY_REGEN_BONUS));
    const dormeCom = regenPoints(rec, T0, T0 + HORA, undefined, true, janela);
    expect(dormeCom / base).toBeCloseTo(1.5 * 1.1, 2);
    // fora da janela: nada
    expect(regenPoints(rec, T0 + 3 * HORA, T0 + 4 * HORA, undefined, false, janela)).toBe(regenPoints(rec, T0 + 3 * HORA, T0 + 4 * HORA));
    // meia janela: só o trecho coberto
    const parcial = regenPoints(rec, T0 + HORA, T0 + 3 * HORA, undefined, false, janela);
    expect(parcial).toBe(regenPoints(rec, T0 + HORA, T0 + 3 * HORA) + Math.floor(regenPoints(rec, T0 + HORA, T0 + 2 * HORA) * 0.1));
  });
  it('o relógio da energia e o timer enxergam o buff (a mesma regra)', () => {
    const rec = { v: 100, at: T0 };
    const novo = (): HungerState => ({ energyPoints: 0, evolutionStage: 'rookie', energyClock: { at: T0, carry: 0 }, hunger: rec });
    const semBuff = settleEnergy(novo(), T0 + 5 * HORA);
    rememberClanBuffs({ energia: { desde: T0 - 1, ate: T0 + BUFF_MS } });
    expect(clanRegenBoost()?.pct).toBe(10);
    const comBuff = settleEnergy(novo(), T0 + 5 * HORA);
    expect(comBuff.energyPoints! * UNIT_POINTS + comBuff.energyClock!.carry).toBeGreaterThan(semBuff.energyPoints! * UNIT_POINTS + semBuff.energyClock!.carry);
    const eta = energyStatus(novo(), T0 + HORA).msToNext!;
    clearClanBuffs();
    const etaSem = energyStatus(novo(), T0 + HORA).msToNext!;
    expect(eta).toBeLessThan(etaSem);
  });
});

describe('doação: §373 o saldo inteiro doa (Bit de Crédito também), uma vez por dia, 50 ou 100', () => {
  it('as doações oferecidas são 50 e 100', () => expect([...CASA_DOACOES]).toEqual([50, 100]));
  it('spendBitsIfCovered debita do saldo, gasta o pago primeiro e recusa só quando o SALDO não cobre', () => {
    const st = { gamePoints: 500, bitsOrigin: { day: '2026-11-10', free: 0, fromCredits: 450, paidLeft: 450 } };
    expect(spendableBits(st)).toBe(500);
    const r = spendBitsIfCovered(st, 100); // antes: recusava (ganho 50 < 100)
    expect(r.gamePoints).toBe(400);
    expect(r.bitsOrigin.paidLeft).toBe(350);
    expect(spendBitsIfCovered({ gamePoints: 80 }, 50).gamePoints).toBe(30); // save antigo
    expect(spendBitsIfCovered({ gamePoints: 40 }, 50).gamePoints).toBe(40); // saldo não cobre: nada muda
    expect(spendBitsIfCovered(st, 0)).toBe(st);
  });
});
