import { describe, it, expect } from 'vitest';
import { fakeKV, seeded } from './_claKv.testkit.js';
import {
  MISTERIO_TETO_DIA, MISTERIO_PESOS, barraDoMisterio, sortearRecompensaMisterio,
  enviarMisterio, somarTarefa, resgatarMisterio, vistaDoMisterio, converterMisterio, MISTERIO_HONRA_CONVERSAO,
} from './_claMisterio.js';

const env = () => ({ DIGIAPP_SAVES: fakeKV() });
const A = 'saveA', B = 'saveB';
const g = { id: 'g1', members: [A, B] };
const D1 = '2026-10-18', D2 = '2026-10-19';

describe('mistério: barra', () => {
  it('derivada do total; nunca regride abaixo do piso', () => {
    expect(barraDoMisterio(0)).toEqual({ rodada: 0, bar: 0 });
    expect(barraDoMisterio(99)).toEqual({ rodada: 0, bar: 99 });
    expect(barraDoMisterio(100)).toEqual({ rodada: 1, bar: 0 });
    expect(barraDoMisterio(250)).toEqual({ rodada: 2, bar: 50 });
    expect(barraDoMisterio(30, 2)).toEqual({ rodada: 2, bar: 0 });
  });
  it('recompensa: chip raro, nenhuma comida, determinística com seed', () => {
    expect(MISTERIO_PESOS.chip / Object.values(MISTERIO_PESOS).reduce((s, n) => s + n, 0)).toBeLessThanOrEqual(0.05);
    expect(sortearRecompensaMisterio(seeded(9))).toEqual(sortearRecompensaMisterio(seeded(9)));
    const r = seeded(5);
    for (let i = 0; i < 500; i++) expect(['bits', 'decor', 'chip']).toContain(sortearRecompensaMisterio(r).kind);
  });
});

describe('mistério: envio e tarefas', () => {
  it('1 envio ativo por membro', async () => {
    const e = env();
    expect((await enviarMisterio(e, g, A)).ok).toBe(true);
    expect(await enviarMisterio(e, g, A)).toEqual({ ok: false, reason: 'already-sent' });
    expect((await enviarMisterio(e, g, B)).ok).toBe(true);
    expect((await vistaDoMisterio(e, g, A, D1)).investigating).toBe(2);
  });
  it('tarefa idempotente por id; teto diário por membro; novo dia libera', async () => {
    const e = env();
    expect(await somarTarefa(e, g, A, D1, 't-1')).toEqual({ ok: true, counted: true });
    expect(await somarTarefa(e, g, A, D1, 't-1')).toEqual({ ok: true, counted: false, reason: 'duplicate' });
    for (let i = 2; i <= MISTERIO_TETO_DIA; i++) expect((await somarTarefa(e, g, A, D1, `t-${i}`)).counted).toBe(true);
    expect(await somarTarefa(e, g, A, D1, 't-extra')).toEqual({ ok: true, counted: false, reason: 'daily-cap' });
    expect((await vistaDoMisterio(e, g, A, D1)).bar).toBe(MISTERIO_TETO_DIA);
    expect((await vistaDoMisterio(e, g, A, D1)).mine.capReached).toBe(true);
    expect((await somarTarefa(e, g, A, D2, 't-1')).reason).toBe('duplicate');
    expect((await somarTarefa(e, g, A, D2, 't-novo')).counted).toBe(true);
    expect((await somarTarefa(e, g, B, D1, 't-1')).counted).toBe(true);
    for (const bad of [undefined, '', 'a b', 'x'.repeat(65), 5, null]) expect((await somarTarefa(e, g, A, D1, bad)).ok).toBe(false);
  });
});

describe('mistério: barra cheia, recompensa e reinício', () => {
  it('100% -> só quem enviou resgata (1x), barra reinicia e dá para enviar de novo', async () => {
    const e = env();
    await enviarMisterio(e, g, A);
    const dias = ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22'];
    for (const d of dias) for (const m of [A, B]) for (let i = 0; i < MISTERIO_TETO_DIA; i++) await somarTarefa(e, g, m, d, `${m}-${d}-${i}`);
    const v = await vistaDoMisterio(e, g, A, '2026-10-22');
    expect(v).toMatchObject({ bar: 0, round: 1, investigating: 0 });
    expect(v.mine).toMatchObject({ sent: false, rewardPending: true });
    expect((await vistaDoMisterio(e, g, B, '2026-10-22')).mine.rewardPending).toBe(false);
    expect((await resgatarMisterio(e, g, B)).reason).toBe('nothing-to-claim');
    expect(await enviarMisterio(e, g, A)).toEqual({ ok: false, reason: 'reward-pending' });
    const r = await resgatarMisterio(e, g, A, seeded(11));
    expect(r.ok).toBe(true);
    expect(r.reward.kind).toBeTruthy();
    expect(await resgatarMisterio(e, g, A)).toMatchObject({ ok: true, repeat: true, receipt: r.receipt, reward: r.reward });
    expect((await enviarMisterio(e, g, A)).ok).toBe(true);
  });
  it('idempotência por taskId vale 14 dias (marcar/desmarcar/recontar não soma)', async () => {
    const e = env();
    expect((await somarTarefa(e, g, A, '2026-10-01', 'velha')).counted).toBe(true);
    expect((await somarTarefa(e, g, A, '2026-10-14', 'velha')).reason).toBe('duplicate');
    expect((await somarTarefa(e, g, A, '2026-10-16', 'velha')).counted).toBe(true); // 15 dias depois
  });
  it('barra em 99 antes do último ponto', async () => {
    const e = env();
    for (const d of ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22']) for (let i = 0; i < MISTERIO_TETO_DIA; i++) {
      await somarTarefa(e, g, A, d, `a-${d}-${i}`);
      if (d !== '2026-10-22' || i < 9) await somarTarefa(e, g, B, d, `b-${d}-${i}`);
    }
    expect((await vistaDoMisterio(e, g, A, '2026-10-22')).bar).toBe(99);
  });
  it('vista sem pontos por pessoa', async () => {
    const e = env();
    await somarTarefa(e, g, A, D1, 'x1');
    const v = await vistaDoMisterio(e, g, B, D1);
    expect(Object.keys(v).sort()).toEqual(['bar', 'investigating', 'mine', 'round']);
    expect(JSON.stringify(v)).not.toContain(A);
  });
});

describe('mistério: encerramento (conversão da recompensa pendente)', () => {
  const pendente = async () => {
    const e = env();
    await enviarMisterio(e, g, A);
    for (const d of ['2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22']) for (const m of [A, B]) for (let i = 0; i < MISTERIO_TETO_DIA; i++) await somarTarefa(e, g, m, d, `${m}-${d}-${i}`);
    return e;
  };
  it('sem pendência não há nada a converter (e quem nunca enviou não ganha)', async () => {
    const e = await pendente();
    expect(await converterMisterio(e, g, B)).toBeNull();
    expect(await converterMisterio(env(), g, A)).toBeNull();
  });
  it('pendente vira Bits (mesma moeda) ou Honra, UMA vez; repetir devolve o MESMO recibo e valor', async () => {
    for (const sem of [1, 2, 3, 4, 5, 6, 7, 8]) {
      const e = await pendente();
      const r = await converterMisterio(e, g, A, seeded(sem));
      expect(['bits', 'honra']).toContain(r.kind);
      expect(r.receipt).toBe('g1|misc|0|saveA');
      if (r.kind === 'honra') expect(r.amount).toBe(MISTERIO_HONRA_CONVERSAO);
      else expect(r.amount).toBeGreaterThan(0);
      expect(await converterMisterio(e, g, A, seeded(99))).toEqual(r);
      expect(await converterMisterio(e, g, A)).toEqual(r);
      // o resgate antigo não paga de novo: a pendência acabou
      expect((await vistaDoMisterio(e, g, A, '2026-10-22')).mine.rewardPending).toBe(false);
      expect((await resgatarMisterio(e, g, A)).reason).toBe('nothing-to-claim');
    }
  });
  it('duas chamadas em paralelo convergem para UM só prêmio', async () => {
    const e = await pendente();
    const [x, y] = await Promise.all([converterMisterio(e, g, A, seeded(3)), converterMisterio(e, g, A, seeded(4))]);
    expect(x.receipt).toBe(y.receipt);
    expect(await converterMisterio(e, g, A)).toEqual(await converterMisterio(e, g, A));
    const ultimo = await converterMisterio(e, g, A);
    expect([x, y]).toContainEqual(ultimo);
  });
  it('quem já resgatou pelo caminho antigo NÃO recebe de novo', async () => {
    const e = await pendente();
    await resgatarMisterio(e, g, A, seeded(11));
    expect(await converterMisterio(e, g, A)).toBeNull();
  });
});
