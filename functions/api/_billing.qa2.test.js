import { describe, it, expect, vi, afterEach } from 'vitest';
import { verifyPlayPurchase } from './_billing.js';

afterEach(() => vi.unstubAllGlobals());

describe('QA rodada 2: _billing entrada hostil', () => {
  it('REGRESSAO: productId herdado de Object.prototype ("constructor", "toString", "__proto__") é unknown-product e NÃO chama a Google', async () => {
    const f = vi.fn(async () => new Response('{}', { status: 404 }));
    vi.stubGlobal('fetch', f);
    const env = { GOOGLE_PLAY_SERVICE_ACCOUNT: '{}', ANDROID_PACKAGE_NAME: 'com.x.y' };
    for (const productId of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf']) {
      const r = await verifyPlayPurchase(env, { productId, purchaseToken: 't', saveId: 'abcdefgh12345678' });
      expect(r).toEqual({ ok: false, reason: 'unknown-product' });
    }
    expect(f).not.toHaveBeenCalled();
  });
});
