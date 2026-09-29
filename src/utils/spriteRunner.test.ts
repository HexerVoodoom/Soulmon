/**
 * O executor do lote: serial, com recuo, e com as duas paradas diferentes.
 */
import { describe, it, expect, vi } from 'vitest';
import { runSpriteBatch, SPRITE_RETRY_BACKOFF_MS } from './spriteRunner';
import { SpriteGenError } from './spriteGen';
import type { SpriteEntry } from './spriteLibrary';

const ok = (formId: string): SpriteEntry => ({ url: `https://cdn/${formId}.png`, formId, at: 1 });

function harness(generate: (formId: string) => Promise<SpriteEntry>) {
  const results: string[] = [];
  const failures: Array<{ formId: string; kind: string }> = [];
  const waits: number[] = [];
  return {
    results, failures, waits,
    deps: {
      generate,
      onResult: (formId: string) => { results.push(formId); },
      onFailure: (formId: string, kind: string) => { failures.push({ formId, kind }); },
      sleep: async (ms: number) => { waits.push(ms); },
    } as Parameters<typeof runSpriteBatch>[1],
  };
}

describe('serial, uma forma por vez', () => {
  it('não dispara o segundo pedido antes do primeiro terminar', async () => {
    let vivos = 0;
    let pico = 0;
    const h = harness(async formId => {
      vivos += 1; pico = Math.max(pico, vivos);
      await Promise.resolve();
      vivos -= 1;
      return ok(formId);
    });
    await runSpriteBatch(['rookie', 'champion-power', 'champion-harmony'], h.deps);
    expect(pico).toBe(1);
    expect(h.results).toEqual(['rookie', 'champion-power', 'champion-harmony']);
  });
});

describe('retentativa automática: 2, com recuo de 60 s e 10 min', () => {
  it('falha instável retenta duas vezes e depois desiste', async () => {
    const generate = vi.fn().mockRejectedValue(new SpriteGenError('error', 500, 'boom'));
    const h = harness(generate);
    await runSpriteBatch(['rookie'], h.deps);
    expect(generate).toHaveBeenCalledTimes(3);
    expect(h.waits).toEqual([...SPRITE_RETRY_BACKOFF_MS]);
    expect(h.failures).toEqual([{ formId: 'rookie', kind: 'error' }]);
  });

  it('não retenta 429, 503 nem os terminais — bater na porta que fechou só gasta', async () => {
    for (const [reason, status] of [['daily-limit', 429], ['budget', 503], ['form-cap', 409]] as const) {
      const generate = vi.fn().mockRejectedValue(new SpriteGenError(reason, status, reason));
      const h = harness(generate);
      await runSpriteBatch(['rookie'], h.deps);
      expect(generate).toHaveBeenCalledTimes(1);
      expect(h.waits).toEqual([]);
    }
  });
});

describe('as duas paradas, que não são a mesma', () => {
  it('409 `form-cap` para SÓ a forma: o resto do lote continua', async () => {
    const h = harness(async formId => {
      if (formId === 'champion-power') throw new SpriteGenError('form-cap', 409, 'sprite-form-cap');
      return ok(formId);
    });
    const out = await runSpriteBatch(['champion-power', 'champion-harmony'], h.deps);
    expect(h.results).toEqual(['champion-harmony']);
    expect(h.failures).toEqual([{ formId: 'champion-power', kind: 'form-cap' }]);
    expect(out.aborted).toBe(false);
  });

  it('402 `lifetime-cap` aborta o lote inteiro: a conta parou', async () => {
    const generate = vi.fn(async (formId: string) => {
      if (formId === 'champion-power') throw new SpriteGenError('lifetime-cap', 402, 'sprite-lifetime-cap');
      return ok(formId);
    });
    const h = harness(generate);
    const out = await runSpriteBatch(['champion-power', 'champion-harmony'], h.deps);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(out.aborted).toBe(true);
    expect(h.results).toEqual([]);
  });
});

describe('202 e offline', () => {
  it('202 repergunta no prazo do servidor e não marca falha se o outro aparelho entregar', async () => {
    let n = 0;
    const h = harness(async formId => {
      n += 1;
      if (n === 1) throw new SpriteGenError('pending', 202, 'pending', { retryAfter: 20 });
      return ok(formId);
    });
    await runSpriteBatch(['rookie'], h.deps);
    expect(h.waits).toEqual([20_000]);
    expect(h.results).toEqual(['rookie']);
    expect(h.failures).toEqual([]);
  });

  it('202 até o fim não vira erro nenhum: fica na reserva, calado', async () => {
    const h = harness(async () => { throw new SpriteGenError('pending', 202, 'pending'); });
    await runSpriteBatch(['rookie'], h.deps);
    expect(h.failures).toEqual([]);
  });

  it('rede fora (status 0) é registrada como `offline`, e offline não consome teto', async () => {
    const h = harness(async () => { throw new SpriteGenError('error', 0, 'network'); });
    await runSpriteBatch(['rookie'], h.deps);
    expect(h.failures).toEqual([{ formId: 'rookie', kind: 'offline' }]);
  });
});

describe('cancelamento cooperativo', () => {
  it('para no meio do lote quando o app pede', async () => {
    const generate = vi.fn(async (formId: string) => ok(formId));
    const h = harness(generate);
    let calls = 0;
    const out = await runSpriteBatch(['a', 'b', 'c'], {
      ...h.deps,
      isCancelled: () => ++calls > 2,
    });
    expect(out.aborted).toBe(true);
    expect(generate).toHaveBeenCalledTimes(2);
  });
});

describe('401 e 403: a classificacao do spriteGen manda, e o default nao', () => {
  it('401 `auth` retenta UMA vez (a renovacao do SDK), nunca a de 10 min', async () => {
    const generate = vi.fn().mockRejectedValue(new SpriteGenError('auth', 401, 'unauthorized'));
    const h = harness(generate);
    await runSpriteBatch(['rookie'], h.deps);
    // CLOUD_SAVE_POLICY.auth diz `retentavel: true` — uma retentativa pega a
    // renovacao horaria do token. A segunda, de 10 min, e so bateria: se a
    // primeira nao pegou, a sessao esta morta e so o login conserta.
    expect(generate).toHaveBeenCalledTimes(2);
    expect(h.waits).toEqual([SPRITE_RETRY_BACKOFF_MS[0]]);
    expect(h.failures).toEqual([{ formId: 'rookie', kind: 'auth' }]);
  });

  it('403 `identity` nao retenta nenhuma vez — re-login nao conserta SAVE_ID errado', async () => {
    const generate = vi.fn().mockRejectedValue(new SpriteGenError('identity', 403, 'forbidden'));
    const h = harness(generate);
    await runSpriteBatch(['rookie'], h.deps);
    expect(generate).toHaveBeenCalledTimes(1);
    expect(h.waits).toEqual([]);
    expect(h.failures).toEqual([{ formId: 'rookie', kind: 'identity' }]);
  });

  it('nem 401 nem 403 abortam o lote: nao sao teto de conta', async () => {
    for (const [reason, status] of [['auth', 401], ['identity', 403]] as const) {
      const h = harness(async formId => {
        if (formId === 'champion-power') throw new SpriteGenError(reason, status, reason);
        return ok(formId);
      });
      const out = await runSpriteBatch(['champion-power', 'champion-harmony'], h.deps);
      expect(out.aborted).toBe(false);
      expect(h.results).toEqual(['champion-harmony']);
      expect(out.failed).toEqual([{ formId: 'champion-power', kind: reason }]);
    }
  });
});

describe('o que NAO pode mudar com essa passada', () => {
  it('5xx transitorio continua com as DUAS retentativas e os dois recuos', async () => {
    const generate = vi.fn().mockRejectedValue(new SpriteGenError('error', 503, 'boom'));
    const h = harness(generate);
    await runSpriteBatch(['rookie'], h.deps);
    expect(generate).toHaveBeenCalledTimes(3);
    expect(h.waits).toEqual([...SPRITE_RETRY_BACKOFF_MS]);
  });

  it('rede fora (status 0) continua retentando e continua sendo `offline`', async () => {
    const generate = vi.fn().mockRejectedValue(new SpriteGenError('error', 0, 'network'));
    const h = harness(generate);
    await runSpriteBatch(['rookie'], h.deps);
    expect(generate).toHaveBeenCalledTimes(3);
    expect(h.failures).toEqual([{ formId: 'rookie', kind: 'offline' }]);
  });

  it('os terminais continuam terminais: 409 so a forma, 402 o lote inteiro', async () => {
    const hForm = harness(async () => { throw new SpriteGenError('form-cap', 409, 'form-cap'); });
    const outForm = await runSpriteBatch(['rookie', 'champion-harmony'], {
      ...hForm.deps,
      generate: async (formId: string) => {
        if (formId === 'rookie') throw new SpriteGenError('form-cap', 409, 'form-cap');
        return ok(formId);
      },
    });
    expect(outForm.aborted).toBe(false);
    expect(outForm.failed).toEqual([{ formId: 'rookie', kind: 'form-cap' }]);

    const hAcc = harness(async () => { throw new SpriteGenError('lifetime-cap', 402, 'lifetime-cap'); });
    const outAcc = await runSpriteBatch(['rookie', 'champion-harmony'], hAcc.deps);
    expect(outAcc.aborted).toBe(true);
    expect(outAcc.done).toEqual([]);
  });
});
