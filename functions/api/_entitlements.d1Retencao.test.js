import { describe, it, expect, vi, afterEach } from 'vitest';
import { claimOrder, RETENTION_TTL_SECONDS } from './_entitlements.js';

// RETENÇÃO do vínculo de recibo no caminho D1 (`order_claims`).
//
// O TTL de 5 anos decidido para `ent:` e `ord:` é um recurso do KV: chave
// expira sozinha. BANCO NÃO APAGA LINHA SOZINHO — enquanto `env.DB` existir, a
// mesma decisão do dono não alcançava o vínculo de recibo, e os dois backends
// tinham políticas diferentes para o MESMO dado.
//
// O desenho escolhido: coluna `expires_at` na linha (o prazo vira DADO, não
// convenção) + limpeza na leitura (quem passa por ali apaga o que venceu). Sem
// job agendado, sem infra nova.
//
// O que estes casos travam:
//
//   TRAVA   toda linha nova nasce com `expires_at` = agora + o prazo de
//           política, derivado da MESMA constante que o KV usa. Sem literal
//           solto e sem duas réguas para a mesma decisão.
//   TRAVA   reivindicar de novo pelo MESMO dono RENOVA o prazo — paridade com
//           o KV, onde o segundo `put` do "restaurar compras" existe só para
//           isso. Recibo em uso é recibo vivo.
//   TRAVA   a limpeza na leitura só toca o que de fato venceu, e a linha some
//           antes de a disputa ser decidida — senão o recibo vencido ficaria
//           travado para sempre por uma linha que já devia ter morrido.
//   NÃO PODE MUDAR  a trava anti-fraude DENTRO do prazo: recibo de outra conta,
//           ainda válido, recusa. A limpeza não pode virar porta dos fundos.
//   NÃO PODE MUDAR  linha LEGADA (`expires_at` NULL, gravada antes da coluna
//           existir) nunca é apagada. Apagar é irreversível; prazo desconhecido
//           não é prazo vencido.

const CINCO_ANOS_MS = 157680000 * 1000;

/**
 * D1 falso — o mínimo de SQL que este módulo emite, com a restrição que
 * importa: `order_id` é PRIMARY KEY. Molde igual ao fake de KV dos outros
 * testes: um `Map` por trás e um despachante burro por prefixo do SQL.
 *
 * Ele ANOTA cada statement executado, porque parte do que está sob teste é
 * QUANDO a limpeza acontece — antes da disputa, não depois.
 */
function fakeD1(linhasIniciais = {}) {
  /** @type {Map<string, {save_id: string, claimed_at: number, expires_at: number|null}>} */
  const rows = new Map(Object.entries(linhasIniciais));
  const sqls = [];
  const db = {
    prepare: (sql) => ({
      bind: (...args) => ({
        async run() {
          sqls.push(sql);
          if (/^INSERT/i.test(sql)) {
            const [orderId, saveId, claimedAt, expiresAt] = args;
            if (rows.has(orderId)) throw new Error('UNIQUE constraint failed: order_claims.order_id');
            rows.set(orderId, { save_id: saveId, claimed_at: claimedAt, expires_at: expiresAt ?? null });
            return { success: true };
          }
          if (/^DELETE/i.test(sql)) {
            // DELETE ... WHERE order_id = ? AND expires_at IS NOT NULL AND expires_at <= ?
            const [orderId, agora] = args;
            const row = rows.get(orderId);
            if (row && row.expires_at !== null && row.expires_at <= agora) rows.delete(orderId);
            return { success: true };
          }
          if (/^UPDATE/i.test(sql)) {
            // UPDATE ... SET expires_at = ? WHERE order_id = ?
            const [expiresAt, orderId] = args;
            const row = rows.get(orderId);
            if (row) row.expires_at = expiresAt;
            return { success: true };
          }
          throw new Error('sql inesperado: ' + sql);
        },
        async first() {
          sqls.push(sql);
          if (!/^SELECT/i.test(sql)) throw new Error('sql inesperado: ' + sql);
          return rows.get(args[0]) ?? null;
        },
      }),
    }),
  };
  return {
    // O KV segue no env porque `claimOrder` só desvia para o D1 quando `DB`
    // existe; se o desvio quebrar, estas asserções caem em cima do KV e o
    // vermelho fica ilegível. Aqui ele é um poço seco de propósito.
    DIGIAPP_SAVES: { get: async () => null, put: async () => {} },
    DB: db,
    _rows: rows,
    _sqls: sqls,
  };
}

const CONTA_A = 'contaA12345';
const CONTA_B = 'contaB12345';
const ORDER = 'play:GPA.7777-8888-9999';

afterEach(() => { vi.useRealTimers(); });

/** Congela o relógio: o prazo é medido, não estimado. */
function congela(iso) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(iso));
  return Date.now();
}

describe('D1 — o recibo nasce com prazo', () => {
  it('a linha nova grava expires_at = agora + 5 anos', async () => {
    const agora = congela('2026-08-26T12:00:00Z');
    const env = fakeD1();

    expect(await claimOrder(env, CONTA_A, ORDER)).toEqual({ ok: true });

    const linha = env._rows.get(ORDER);
    expect(linha.save_id).toBe(CONTA_A);
    // O literal é a régua (mesmo motivo do teste de TTL do KV): se a asserção
    // usasse só a constante do módulo, um `undefined` casaria com o `undefined`
    // de uma coluna não gravada e o vermelho viraria verde por acidente.
    expect(linha.expires_at).toBe(agora + CINCO_ANOS_MS);
  });

  it('o prazo do D1 sai da MESMA constante do KV — um dado, uma política', async () => {
    const agora = congela('2026-08-26T12:00:00Z');
    const env = fakeD1();
    await claimOrder(env, CONTA_A, ORDER);
    expect(env._rows.get(ORDER).expires_at).toBe(agora + RETENTION_TTL_SECONDS * 1000);
  });
});

describe('D1 — reivindicar renova, como no KV', () => {
  it('o MESMO dono reivindicando de novo empurra o prazo para frente', async () => {
    congela('2026-08-26T12:00:00Z');
    const env = fakeD1();
    await claimOrder(env, CONTA_A, ORDER);
    const prazoInicial = env._rows.get(ORDER).expires_at;

    // Quatro anos depois o comprador toca em "restaurar compras". No KV isso é
    // um `put` que renova o TTL; aqui tem que ser um UPDATE que empurra a data.
    const depois = congela('2030-08-26T12:00:00Z');
    expect(await claimOrder(env, CONTA_A, ORDER)).toEqual({ ok: true });

    const linha = env._rows.get(ORDER);
    expect(linha.expires_at).toBe(depois + CINCO_ANOS_MS);
    expect(linha.expires_at).toBeGreaterThan(prazoInicial);
    // Renovar é sinal de vida, não novo nascimento: quando a linha foi criada
    // continua sendo quando a linha foi criada.
    expect(linha.claimed_at).toBeLessThan(depois);
    expect(env._rows.size).toBe(1);
  });

  it('a tentativa ALHEIA recusa e NÃO renova o prazo do dono', async () => {
    congela('2026-08-26T12:00:00Z');
    const env = fakeD1();
    await claimOrder(env, CONTA_A, ORDER);
    const prazo = env._rows.get(ORDER).expires_at;

    congela('2029-08-26T12:00:00Z');
    expect(await claimOrder(env, CONTA_B, ORDER))
      .toEqual({ ok: false, reason: 'order-in-use' });

    // Se a recusa renovasse, um estranho manteria vivo indefinidamente um
    // vínculo que ninguém exerce — o oposto do que o prazo quer.
    expect(env._rows.get(ORDER).expires_at).toBe(prazo);
    expect(env._rows.get(ORDER).save_id).toBe(CONTA_A);
  });
});

describe('D1 — limpeza na leitura', () => {
  it('a linha vencida some quando alguém passa por ali', async () => {
    const agora = congela('2026-08-26T12:00:00Z');
    const env = fakeD1({
      [ORDER]: { save_id: CONTA_A, claimed_at: agora - CINCO_ANOS_MS - 1000, expires_at: agora - 1 },
    });

    await claimOrder(env, CONTA_B, ORDER);

    // Não sobrou lixo: a linha vencida foi apagada e a nova ocupou o lugar.
    expect(env._rows.size).toBe(1);
    expect(env._rows.get(ORDER).save_id).toBe(CONTA_B);
    expect(env._rows.get(ORDER).expires_at).toBe(agora + CINCO_ANOS_MS);
  });

  it('recibo vencido volta a ser reivindicável — e o dono de origem o recupera', async () => {
    // FRAUDE OU RESTAURAÇÃO: cinco anos de silêncio absoluto significam que
    // NENHUMA conta exerceu o recibo. O caminho KV já se comporta assim (a
    // chave `ord:` expira e some), e quem chega depois ainda precisa de um
    // recibo que a LOJA valide e vincule à conta na origem
    // (obfuscatedExternalAccountId / session ticket). Na prática, quem
    // reivindica de novo é o comprador voltando — restauração, não fraude.
    const agora = congela('2031-09-01T12:00:00Z');
    const env = fakeD1({
      [ORDER]: { save_id: CONTA_A, claimed_at: agora - CINCO_ANOS_MS - 1, expires_at: agora - 1 },
    });

    expect(await claimOrder(env, CONTA_A, ORDER)).toEqual({ ok: true });
    expect(env._rows.get(ORDER).save_id).toBe(CONTA_A);
    expect(env._rows.get(ORDER).expires_at).toBe(agora + CINCO_ANOS_MS);
  });

  it('DENTRO do prazo a trava anti-fraude continua inteira', async () => {
    const agora = congela('2026-08-26T12:00:00Z');
    const env = fakeD1({
      // Falta UM segundo para vencer.
      [ORDER]: { save_id: CONTA_A, claimed_at: agora, expires_at: agora + 1000 },
    });

    expect(await claimOrder(env, CONTA_B, ORDER))
      .toEqual({ ok: false, reason: 'order-in-use' });
    expect(env._rows.get(ORDER).save_id).toBe(CONTA_A);
  });

  it('a limpeza roda ANTES da disputa, não depois', async () => {
    // Ordem importa: se o DELETE viesse depois do INSERT, a linha vencida ainda
    // estaria lá na hora de decidir e o recibo ficaria travado para sempre por
    // um vínculo morto.
    const agora = congela('2026-08-26T12:00:00Z');
    const env = fakeD1({
      [ORDER]: { save_id: CONTA_A, claimed_at: agora - CINCO_ANOS_MS, expires_at: agora - 1 },
    });
    await claimOrder(env, CONTA_B, ORDER);
    expect(env._sqls[0]).toMatch(/^DELETE/i);
  });
});

describe('D1 — a linha legada não é vítima da migração', () => {
  it('expires_at NULL nunca é apagado, e continua travando', async () => {
    // Linha gravada antes de a coluna existir num banco onde o backfill da
    // migração não rodou. Prazo desconhecido não é prazo vencido — e apagar é
    // irreversível, então o desempate é a favor de manter.
    const agora = congela('2026-08-26T12:00:00Z');
    const env = fakeD1({
      [ORDER]: { save_id: CONTA_A, claimed_at: agora - CINCO_ANOS_MS * 2, expires_at: null },
    });

    expect(await claimOrder(env, CONTA_B, ORDER))
      .toEqual({ ok: false, reason: 'order-in-use' });
    expect(env._rows.get(ORDER).save_id).toBe(CONTA_A);
  });

  it('o dono da linha legada renova e ela ganha prazo', async () => {
    const agora = congela('2026-08-26T12:00:00Z');
    const env = fakeD1({
      [ORDER]: { save_id: CONTA_A, claimed_at: agora - 1000, expires_at: null },
    });

    expect(await claimOrder(env, CONTA_A, ORDER)).toEqual({ ok: true });
    expect(env._rows.get(ORDER).expires_at).toBe(agora + CINCO_ANOS_MS);
  });
});
