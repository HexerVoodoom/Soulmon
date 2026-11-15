/**
 * Orçamento de crescimento de Bits (REGISTRO §387), MODO OBSERVAÇÃO: o cálculo puro e as constantes contra as fontes do cliente.
 * A fiação no POST /api/save está em `save.bitsOrcamento.test.js`.
 */
import { describe, it, expect } from 'vitest';
import {
  BITS_ORCAMENTO_MODO, BITS_ORCAMENTO_POR_DIA, BITS_ORCAMENTO_DIAS, BITS_ORCAMENTO_TETO,
  avaliarOrcamentoDeBits, lerOrcamento, saldoGravado,
} from './_bitsOrcamento.js';
import { CASA_BITS_POR_DIA } from './_casa.js';
import { BITS_PACK_DAILY_CAP } from './_bitsPacks.js';
import { GIFT_DAILY_CAP } from './_amigos.js';
import { MINIGAME_BITS_PER_DAY } from '../../src/utils/currencies';
import { ADVANCED_BITS_FACTOR } from '../../src/utils/minigameDifficulty';
import { BITS_PER_COMPLETE_DAY } from '../../src/utils/dailyReset';
import { CHECKIN_REWARDS } from '../../src/utils/checkIns';

const DIA = 86_400_000;
const T0 = Date.UTC(2026, 10, 15, 12);
/** Grátis máximo de um dia, das constantes (Rift tier 2 = 100; desafio/praça/encontro do clã 10 + 15 + 20). */
const GRATIS_DIA = MINIGAME_BITS_PER_DAY * ADVANCED_BITS_FACTOR + BITS_PER_COMPLETE_DAY + CHECKIN_REWARDS.afternoon.bits
  + CASA_BITS_POR_DIA + 100 + 10 + 15 + 20;

describe('constantes', () => {
  it('modo é observar (o corte não está ligado)', () => {
    expect(BITS_ORCAMENTO_MODO).toBe('observar');
  });
  it('R cobre 2× o grátis máximo do dia e o teto é 15 dias', () => {
    expect(BITS_ORCAMENTO_POR_DIA).toBeGreaterThanOrEqual(2 * GRATIS_DIA);
    expect(BITS_ORCAMENTO_DIAS).toBe(15);
    expect(BITS_ORCAMENTO_TETO).toBe(22_500);
  });
});

describe('avaliarOrcamentoDeBits', () => {
  it('jogador honesto: 30 dias de todas as fontes, 12 gravações por dia, nunca excede', () => {
    let orcamento = null;
    let saldo = 500;
    for (let d = 0; d < 30; d++) {
      const creditosDoDia = BITS_PACK_DAILY_CAP + GIFT_DAILY_CAP + (d % 7 === 0 ? 5000 : 0);
      for (let i = 0; i < 12; i++) {
        const agora = T0 + d * DIA + i * 3600_000;
        const ganho = GRATIS_DIA / 12 + (i === 0 ? creditosDoDia : 0);
        const r = avaliarOrcamentoDeBits({ antes: saldo, depois: saldo + ganho, orcamento, agora, creditos: i === 0 ? creditosDoDia : 0 });
        expect(r.excedente, `dia ${d} gravação ${i}`).toBe(0);
        saldo += ganho;
        orcamento = r.orcamentoNovo;
      }
    }
  });

  it('volta após 30 dias: o dia cheio na volta não excede (a folga encheu até o teto)', () => {
    const vazio = { b: 0, t: T0 };
    const r = avaliarOrcamentoDeBits({ antes: 1000, depois: 1000 + GRATIS_DIA * 3, orcamento: vazio, agora: T0 + 30 * DIA });
    expect(r.excedente).toBe(0);
    expect(r.orcamentoNovo.b).toBe(BITS_ORCAMENTO_TETO - GRATIS_DIA * 3);
  });

  it('+50.000 de uma vez numa conta sem estado excede 50.000 − 22.500', () => {
    const r = avaliarOrcamentoDeBits({ antes: 1000, depois: 51_000, orcamento: null, agora: T0 });
    expect(r.dentro).toBe(false);
    expect(r.excedente).toBe(50_000 - BITS_ORCAMENTO_TETO);
    expect(r.orcamentoNovo).toEqual({ b: 0, t: T0 });
  });

  it('créditos do servidor somam à folga', () => {
    const r = avaliarOrcamentoDeBits({ antes: 0, depois: 6000, orcamento: { b: 0, t: T0 }, agora: T0, creditos: 6000 });
    expect(r.excedente).toBe(0);
  });

  it('gasto nunca excede e não consome a folga', () => {
    const r = avaliarOrcamentoDeBits({ antes: 90_000, depois: 10, orcamento: { b: 0, t: T0 }, agora: T0 + DIA });
    expect(r.excedente).toBe(0);
    expect(r.orcamentoNovo.b).toBe(BITS_ORCAMENTO_POR_DIA);
  });

  it('sem saldo anterior ou sem saldo novo: não mede', () => {
    expect(avaliarOrcamentoDeBits({ antes: null, depois: 99_999, orcamento: null, agora: T0 }).excedente).toBe(0);
    expect(avaliarOrcamentoDeBits({ antes: 0, depois: null, orcamento: null, agora: T0 }).excedente).toBe(0);
  });

  it('relógio do servidor para trás não gera folga negativa nem extra', () => {
    const r = avaliarOrcamentoDeBits({ antes: 0, depois: 100, orcamento: { b: 50, t: T0 }, agora: T0 - DIA });
    expect(r.excedente).toBe(50);
  });
});

describe('leitura tolerante', () => {
  it('lerOrcamento: lixo = null (conta começa cheia), teto aplicado', () => {
    for (const m of [null, undefined, {}, { ob: -1, ot: T0 }, { ob: 'x', ot: T0 }, { ob: 5, ot: 0 }, { ob: NaN, ot: T0 }]) {
      expect(lerOrcamento(m)).toBeNull();
    }
    expect(lerOrcamento({ ob: 1e9, ot: T0 })).toEqual({ b: BITS_ORCAMENTO_TETO, t: T0 });
  });
  it('saldoGravado: metadata g > gamePoints do save > null', () => {
    expect(saldoGravado({ value: '{"gamePoints":7}', metadata: { g: 9 } })).toBe(9);
    expect(saldoGravado({ value: '{"gamePoints":7}', metadata: { t: 1 } })).toBe(7);
    expect(saldoGravado({ value: '{}', metadata: null })).toBeNull();
    expect(saldoGravado({ value: 'xx', metadata: null })).toBeNull();
    expect(saldoGravado(null)).toBeNull();
  });
});
