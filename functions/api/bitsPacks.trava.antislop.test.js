/**
 * Antislop P6 (14/11/2026, item 14 do relatório r3; REGISTRO §378): a trava `bitslock:<saveId>` (D1, `order_claims`, §373/#919)
 * só pode ser solta por QUEM a pegou.
 *
 * Antes, o `release` fazia `DELETE FROM order_claims WHERE order_id = ?`. Um worker que parasse mais de `LOCK_TTL_MS` no meio da
 * troca perdia a trava (vencida, outro worker a pega) e, ao terminar, apagava a trava DO OUTRO: uma terceira troca da mesma conta
 * passava junto com a segunda, que é exatamente a corrida que a trava existe para impedir. Agora o `DELETE` confere o
 * `claimed_at`/`expires_at` desta posse.
 */
import { describe, it, expect } from 'vitest';
import { ENT_PREFIX } from './_entitlements.js';
import { buyBitsPack, LOCK_TTL_MS } from './_bitsPacks.js';

const ID = 'b'.repeat(32);
const DIA = Date.UTC(2026, 10, 14, 12, 0, 0);

/** KV com portões: cada `get` do `ent:` espera o próximo portão aberto pelo teste (o worker "para" no meio da troca). */
function mundo() {
  const store = new Map([[ENT_PREFIX + ID, JSON.stringify({ tier: 'paid', credits: 10_000 })]]);
  const portoes = [];
  const kv = {
    store,
    get: async k => {
      if (k === ENT_PREFIX + ID && portoes.length) await portoes.shift();
      return store.get(k) ?? null;
    },
    put: async (k, v) => { store.set(k, String(v)); },
    delete: async k => { store.delete(k); },
  };
  /** D1 de mentira que respeita TODAS as condições do WHERE que o `_bitsPacks.js` usa. */
  const rows = new Map();
  const DB = {
    rows,
    prepare: sql => ({
      bind: (...a) => ({
        async run() {
          if (/^INSERT/i.test(sql)) {
            if (rows.has(a[0])) throw new Error('UNIQUE constraint failed: order_claims.order_id');
            rows.set(a[0], { save: a[1], claimed: a[2], expires: a[3] });
          } else if (/^DELETE/i.test(sql)) {
            const r = rows.get(a[0]);
            if (!r) return { success: true };
            if (/expires_at <=/.test(sql)) { if (r.expires != null && r.expires <= a[1]) rows.delete(a[0]); }
            else if (/claimed_at = \?/.test(sql)) { if (r.claimed === a[1] && (!/expires_at = \?/.test(sql) || r.expires === a[2])) rows.delete(a[0]); }
            else rows.delete(a[0]);
          }
          return { success: true };
        },
      }),
    }),
  };
  const segurar = () => { let abrir; portoes.push(new Promise(r => { abrir = r; })); return () => abrir(); };
  return { env: { SOULMON_SAVES: kv, DB }, rows, segurar };
}
const tick = () => new Promise(r => setTimeout(r, 0));

describe('item 14 · `_bitsPacks.js`: a trava só sai pela mão de quem a pegou', () => {
  it('worker lento perde a trava vencida e, ao terminar, NÃO apaga a trava do worker seguinte', async () => {
    const { env, rows, segurar } = mundo();
    const soltarA = segurar();
    const a = buyBitsPack(env, ID, 'bits-200', 'op-lento-0001', { nowMs: DIA });
    await tick();
    expect(rows.get(`bitslock:${ID}`)).toMatchObject({ claimed: DIA });
    // A ficou parado além do LOCK_TTL_MS: B pega a trava vencida e também fica no meio da troca.
    const soltarB = segurar();
    const b = buyBitsPack(env, ID, 'bits-200', 'op-depois-001', { nowMs: DIA + LOCK_TTL_MS });
    await tick();
    expect(rows.get(`bitslock:${ID}`)).toMatchObject({ claimed: DIA + LOCK_TTL_MS });
    soltarA();
    await a;
    // A terminou: a trava de B tem de continuar lá (antes: apagada, e uma 3ª troca passava junto com B).
    expect(rows.get(`bitslock:${ID}`)).toMatchObject({ claimed: DIA + LOCK_TTL_MS });
    expect((await buyBitsPack(env, ID, 'bits-200', 'op-terceira1', { nowMs: DIA + LOCK_TTL_MS + 1 })).reason).toBe('busy');
    soltarB();
    expect((await b).ok).toBe(true);
    expect(rows.size).toBe(0);
  });
});
