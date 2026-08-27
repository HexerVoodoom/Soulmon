import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost } from './generate-sprite.js';
import { ENT_PREFIX } from './_entitlements.js';

// D-10 da auditoria: `docs/PLANO-PRODUTO.md` afirma que o COGS de IA está
// "travado atrás de accountTier:'paid', então só quem paga gera". O servidor
// não implementava isso — a rota passava só pelo _aiGuard, que mede VOLUME e
// não DIREITO. Estes casos são a implementação da frase.
//
// O que interessa medir aqui NÃO é o corpo da resposta (ele pode dizer
// qualquer coisa): é se o provedor de IA foi CHAMADO. Por isso todo caso
// conta `fetch`. Chamada de IA que não aconteceu é fatura que não chegou.

const SAVE = 'abcdefgh12345678';

function fakeEnv({ tier, kv = true, quebrado = false } = {}) {
  const store = new Map();
  if (tier) store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier }));
  const env = { GEMINI_API_KEY: 'k' };
  if (kv) {
    env.DIGIAPP_SAVES = {
      get: async k => {
        if (quebrado) throw new Error('KV indisponível');
        return store.has(k) ? store.get(k) : null;
      },
      put: async (k, v) => { store.set(k, v); },
      delete: async k => { store.delete(k); },
      getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: null }),
    };
  }
  return env;
}

const req = (body = { prompt: 'um bicho fofo', id: SAVE }) =>
  new Request('https://soulmon.test/api/generate-sprite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

/** Resposta de imagem do Gemini — só usada quando o portão DEIXA passar. */
const geminiOk = () => new Response(JSON.stringify({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

let chamadasDeIA;

beforeEach(() => {
  chamadasDeIA = [];
  vi.stubGlobal('fetch', vi.fn(async url => {
    chamadasDeIA.push(String(url));
    return geminiOk();
  }));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('generate-sprite: só quem paga gera', () => {
  it('tier PAGO gera (o portão não pode trancar quem pagou)', async () => {
    const res = await onRequestPost({ request: req(), env: fakeEnv({ tier: 'paid' }) });
    expect(res.status).toBe(200);
    // O Gemini devolve base64, e base64 NUNCA chega ao cliente: o servidor
    // republica e responde uma URL. Data URL × 11 formas no `GameState` vai
    // para o `localStorage` e para a KV a cada save — já estourou uma vez.
    expect((await res.json()).image).toMatch(
      /^https:\/\/soulmon\.test\/api\/sprite-image\?k=[0-9a-f]{32}$/,
    );
    expect(chamadasDeIA).toHaveLength(1);
  });

  it('tier DEMO é recusado com 402 — e ANTES de qualquer chamada de IA', async () => {
    const res = await onRequestPost({ request: req(), env: fakeEnv({ tier: 'demo' }) });
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({ error: 'paid-tier-required' });
    expect(chamadasDeIA).toEqual([]);
  });

  it('conta SEM registro de entitlement é demo por definição — recusa, sem IA', async () => {
    const res = await onRequestPost({ request: req(), env: fakeEnv() });
    expect(res.status).toBe(402);
    expect(chamadasDeIA).toEqual([]);
  });

  it('o cliente NÃO decide o tier: accountTier no corpo é ignorado', async () => {
    const body = { prompt: 'p', id: SAVE, accountTier: 'paid', tier: 'paid', credits: 999 };
    const res = await onRequestPost({ request: req(body), env: fakeEnv({ tier: 'demo' }) });
    expect(res.status).toBe(402);
    expect(chamadasDeIA).toEqual([]);
  });

  // --- Tier NÃO determinável: FAIL-CLOSED, explicitamente. ---
  // O fail-open do _auth.js (`if (!projectId) return { ok: true }`) foi
  // justamente o defeito que esta auditoria achou: variável desligada virou
  // porta aberta. Numa rota que queima dinheiro real, a dúvida NEGA.

  it('sem KV ligado (tier indeterminável) recusa com 503 — não assume pago', async () => {
    const res = await onRequestPost({ request: req(), env: fakeEnv({ kv: false }) });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'tier-unavailable' });
    expect(chamadasDeIA).toEqual([]);
  });

  it('leitura de tier que EXPLODE recusa com 503 — não vira 200 nem gasta IA', async () => {
    const res = await onRequestPost({ request: req(), env: fakeEnv({ quebrado: true }) });
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'tier-unavailable' });
    expect(chamadasDeIA).toEqual([]);
  });

  it('sem saveId recusa antes de tudo (400)', async () => {
    const res = await onRequestPost({ request: req({ prompt: 'p' }), env: fakeEnv({ tier: 'paid' }) });
    expect(res.status).toBe(400);
    expect(chamadasDeIA).toEqual([]);
  });

  it('o portão de tier vem ANTES do de volume: demo não queima o teto global do dia', async () => {
    // O teto global (`ai:sprite:@all:<dia>`) é o disjuntor da fatura de quem
    // paga. Se a recusa acontecesse depois dele, uma conta demo em loop
    // esgotaria a cota diária sem gerar nada — negação de serviço grátis.
    const env = fakeEnv({ tier: 'demo' });
    const gravado = [];
    const put = env.DIGIAPP_SAVES.put;
    env.DIGIAPP_SAVES.put = async (k, v, o) => { gravado.push(k); return put(k, v, o); };
    for (let i = 0; i < 5; i++) {
      expect((await onRequestPost({ request: req(), env })).status).toBe(402);
    }
    expect(gravado.filter(k => k.startsWith('ai:'))).toEqual([]);
    expect(chamadasDeIA).toEqual([]);
  });
});
