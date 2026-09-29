import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { onRequestPost } from './generate-sprite.js';
import { onRequestGet as spriteImage } from './sprite-image.js';
import { ENT_PREFIX } from './_entitlements.js';
import { AI_LIMITS } from './_aiGuard.js';

/**
 * Dedupe multi-device + republicação da imagem (`custo-geracao-sprite.md` §5 e
 * §9, `spec-geracao-incremental.md` §2.2).
 *
 * Os dois pontos de falha que o handoff nomeia:
 *
 *  - **dois aparelhos, o MESMO `formId`** — o segundo tem que cair em cache ou
 *    em 202, **nunca** gerar de novo. É dinheiro real: uma geração duplicada é
 *    uma cobrança duplicada, e o cliente não tem como deduplicar (dois
 *    aparelhos não veem o estado um do outro).
 *  - **URL, nunca base64, no save** — o `GameState` vai para o `localStorage`
 *    (cota compartilhada com o DigiApp) e para a KV a cada save.
 *
 * O que se mede aqui é `fetch` e CONTADOR, não o texto da resposta: chamada que
 * não aconteceu é fatura que não chegou.
 */

const SAVE = 'abcdefgh12345678';
const OUTRA_CONTA = '11112222333344ff';
const FORM = 'champion-power';

function fakeEnv() {
  const store = new Map();
  const meta = new Map();
  store.set(ENT_PREFIX + SAVE, JSON.stringify({ tier: 'paid' }));
  store.set(ENT_PREFIX + OUTRA_CONTA, JSON.stringify({ tier: 'paid' }));
  const env = {
    GEMINI_API_KEY: 'k',
    DIGIAPP_SAVES: {
      get: async k => (store.has(k) ? store.get(k) : null),
      put: async (k, v, opts) => { store.set(k, v); if (opts?.metadata) meta.set(k, opts.metadata); },
      delete: async k => { store.delete(k); meta.delete(k); },
      getWithMetadata: async k => ({
        value: store.has(k) ? store.get(k) : null,
        metadata: meta.get(k) ?? null,
      }),
    },
  };
  env._store = store;
  return env;
}

const req = (body) =>
  new Request('https://soulmon.test/api/generate-sprite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'um bicho fofo', id: SAVE, formId: FORM, ...body }),
  });

const geminiOk = () => new Response(JSON.stringify({
  candidates: [{ finishReason: 'STOP', content: { parts: [{ inlineData: { mimeType: 'image/png', data: 'AAAA' } }] } }],
}), { status: 200, headers: { 'Content-Type': 'application/json' } });

const gemini500 = () => new Response('upstream boom', { status: 500 });

const ent = (env, save = SAVE) => JSON.parse(env._store.get(ENT_PREFIX + save));
const vitalicio = env => ent(env).aiLifetime?.sprite ?? 0;
const naForma = env => ent(env).aiForms?.[FORM] ?? 0;

let chamadasDeIA;
const responderCom = fn => {
  vi.stubGlobal('fetch', vi.fn(async url => { chamadasDeIA.push(String(url)); return fn(); }));
};

beforeEach(() => {
  chamadasDeIA = [];
  responderCom(geminiOk);
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('dedupe: a MESMA forma nunca é gerada duas vezes', () => {
  it('renomeio de 29/09/2026: cache gravado com o id ANTIGO da forma ainda é acerto — zero IA', async () => {
    const env = fakeEnv();
    const antigo = 'champion-' + 'vir' + 'us';
    env._store.set(`sprite:img:${SAVE}:${antigo}`, JSON.stringify({ image: 'https://x/antiga.png', provider: 'gemini', at: 1 }));
    const r = await onRequestPost({ request: req(), env });
    const body = await r.json();
    expect(body).toMatchObject({ image: 'https://x/antiga.png', cached: true });
    expect(chamadasDeIA).toHaveLength(0);
  });

  it('id ANTIGO como formId de entrada é recusado (o servidor só aceita os novos)', async () => {
    const env = fakeEnv();
    const r = await onRequestPost({ request: req({ formId: 'champion-' + 'vir' + 'us' }), env });
    expect(r.status).toBe(400);
  });

  it('o segundo pedido para a forma já gerada é acerto de cache — zero IA, zero cota', async () => {
    const env = fakeEnv();
    const primeiro = await onRequestPost({ request: req(), env });
    expect(primeiro.status).toBe(200);
    const imagem = (await primeiro.json()).image;
    expect(chamadasDeIA).toHaveLength(1);
    expect(vitalicio(env)).toBe(1);

    const segundo = await onRequestPost({ request: req(), env });
    expect(segundo.status).toBe(200);
    const corpo = await segundo.json();
    expect(corpo.cached, 'o cliente precisa saber que não houve geração').toBe(true);
    expect(corpo.image, 'e é a MESMA arte, não uma segunda').toBe(imagem);
    expect(chamadasDeIA, 'nenhuma chamada nova ao provedor').toHaveLength(1);
    expect(vitalicio(env), 'acerto de cache não consome teto vitalício').toBe(1);
    expect(naForma(env), 'nem o teto por forma').toBe(1);
  });

  it('o segundo APARELHO, com a geração em voo, toma 202 e não gera', async () => {
    const env = fakeEnv();
    // O lock que o primeiro aparelho gravou (TTL 120 s). Dois aparelhos no
    // mesmo `saveId` não veem o estado um do outro — quem decide é o servidor.
    env._store.set(`sprite:lock:${SAVE}:${FORM}`, String(Date.now()));

    const res = await onRequestPost({ request: req(), env });
    expect(res.status, '202 NÃO é erro: o visor fica na reserva e o card em GERANDO').toBe(202);
    expect(await res.json()).toEqual({ pending: true, retryAfter: 20 });
    expect(chamadasDeIA, 'o segundo aparelho não chama o provedor').toEqual([]);
    expect(vitalicio(env), 'e não consome nada do teto').toBe(0);
  });

  it('duas requisições SIMULTÂNEAS da mesma forma geram UMA vez só', async () => {
    const env = fakeEnv();
    let soltar;
    const emVoo = new Promise(r => { soltar = r; });
    vi.stubGlobal('fetch', vi.fn(async url => {
      chamadasDeIA.push(String(url));
      await emVoo;
      return geminiOk();
    }));

    const a = onRequestPost({ request: req(), env });
    // Dá uma volta no laço de eventos: o suficiente para o 1º ter gravado o
    // lock e estar preso no provedor.
    await Promise.resolve();
    await new Promise(r => setTimeout(r, 0));
    const b = await onRequestPost({ request: req(), env });

    expect(b.status).toBe(202);
    soltar();
    expect((await a).status).toBe(200);
    expect(chamadasDeIA, 'uma geração, uma cobrança').toHaveLength(1);
    expect(vitalicio(env)).toBe(1);
  });

  it('o lock é solto quando o provedor falha — a retentativa não toma 202', async () => {
    const env = fakeEnv();
    responderCom(gemini500);
    expect((await onRequestPost({ request: req(), env })).status).toBe(500);
    expect(env._store.has(`sprite:lock:${SAVE}:${FORM}`), 'lock preso trancaria a forma por 120 s').toBe(false);

    responderCom(geminiOk);
    expect((await onRequestPost({ request: req(), env })).status).toBe(200);
  });

  it('o cache é POR CONTA — a arte de um save não vaza para outro', async () => {
    const env = fakeEnv();
    await onRequestPost({ request: req(), env });
    expect(chamadasDeIA).toHaveLength(1);

    const res = await onRequestPost({ request: req({ id: OUTRA_CONTA }), env });
    expect(res.status).toBe(200);
    expect((await res.json()).cached, 'outra conta não herda o acervo').toBeUndefined();
    expect(chamadasDeIA).toHaveLength(2);
  });

  it('sem `formId` não há dedupe — a OraclePage segue gerando (e pagando)', async () => {
    const env = fakeEnv();
    await onRequestPost({ request: req({ formId: undefined }), env });
    await onRequestPost({ request: req({ formId: undefined }), env });
    expect(chamadasDeIA).toHaveLength(2);
    expect(vitalicio(env)).toBe(2);
  });

  it('`formId` inventado é 400 antes de qualquer chave e de qualquer IA', async () => {
    const env = fakeEnv();
    const res = await onRequestPost({ request: req({ formId: 'mega-fogo' }), env });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid-form-id');
    expect(chamadasDeIA).toEqual([]);
    expect([...env._store.keys()].some(k => k.startsWith('sprite:'))).toBe(false);
  });
});

describe('dedupe: a arte já paga volta mesmo com a conta no teto', () => {
  it('teto vitalício estourado ainda devolve o cache — 200, nunca 402', async () => {
    // O caso é o segundo aparelho / a reinstalação / o Steam de quem já
    // percorreu a árvore. Debitar-e-devolver daria 402 e o jogador ficaria na
    // reserva com a arte que ele PAGOU parada no servidor.
    const env = fakeEnv();
    await onRequestPost({ request: req(), env });
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({
      tier: 'paid',
      aiLifetime: { sprite: AI_LIMITS.sprite.perAccountLifetime },
      aiForms: { [FORM]: AI_LIMITS.sprite.perFormLifetime },
    }));

    const res = await onRequestPost({ request: req(), env });
    expect(res.status).toBe(200);
    expect((await res.json()).cached).toBe(true);
    expect(chamadasDeIA).toHaveLength(1);
  });

  it('forma NÃO cacheada com o teto estourado continua 402 `RESERVA-FINAL`', async () => {
    const env = fakeEnv();
    env._store.set(ENT_PREFIX + SAVE, JSON.stringify({
      tier: 'paid',
      aiLifetime: { sprite: AI_LIMITS.sprite.perAccountLifetime },
    }));
    const res = await onRequestPost({ request: req({ formId: 'ultra' }), env });
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('sprite-lifetime-cap');
    expect(chamadasDeIA).toEqual([]);
  });
});

describe('republicação: base64 nunca chega ao cliente', () => {
  it('a data URL do Gemini vira URL https, e a URL serve os bytes', async () => {
    const env = fakeEnv();
    const res = await onRequestPost({ request: req(), env });
    const { image } = await res.json();
    expect(image.startsWith('data:'), 'base64 no GameState estoura o localStorage').toBe(false);
    expect(image).toMatch(/^https:\/\/soulmon\.test\/api\/sprite-image\?k=[0-9a-f]{32}$/);

    const img = await spriteImage({ request: new Request(image), env });
    expect(img.status).toBe(200);
    expect(img.headers.get('Content-Type')).toBe('image/png');
    expect(img.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(new Uint8Array(await img.arrayBuffer())).toEqual(new Uint8Array([0, 0, 0]));
  });

  it('a URL do Higgsfield TAMBÉM é republicada — a do provedor pode expirar (27/08/2026)', async () => {
    const env = fakeEnv();
    env.HF_API_KEY = 'a';
    env.HF_SECRET = 'b';
    const url = 'https://cdn.higgsfield.ai/soul/xyz.png';
    vi.stubGlobal('fetch', vi.fn(async (u) => {
      const s = String(u);
      chamadasDeIA.push(s);
      if (s.includes('/v1/text2image/')) return Response.json({ id: 'job-1' });
      if (s.includes('/v1/job-sets/')) {
        return Response.json({ jobs: [{ status: 'completed', results: { raw: { url } } }] });
      }
      // A busca de republicação: a URL do provedor primário, ida buscar de
      // verdade — nunca mais devolvida crua ao cliente.
      if (s === url) {
        return new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/png' } });
      }
      throw new Error(`fetch inesperado em ${s}`);
    }));

    const res = await onRequestPost({ request: req(), env });
    const body = await res.json();
    expect(body.image).not.toBe(url);
    expect(body.image).toMatch(/^https:\/\/soulmon\.test\/api\/sprite-image\?k=[0-9a-f]{32}$/);

    const img = await spriteImage({
      request: new Request(body.image),
      env,
    });
    expect(new Uint8Array(await img.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('token fora do formato não lê nada do namespace dos saves', async () => {
    const env = fakeEnv();
    for (const k of ['', 'save_' + SAVE, '../save', 'zz']) {
      const res = await spriteImage({
        request: new Request(`https://soulmon.test/api/sprite-image?k=${encodeURIComponent(k)}`),
        env,
      });
      expect(res.status, `token ${JSON.stringify(k)} não pode passar`).toBe(400);
    }
  });

  it('token bem formado mas inexistente é 404, não 500', async () => {
    const res = await spriteImage({
      request: new Request('https://soulmon.test/api/sprite-image?k=' + 'a'.repeat(32)),
      env: fakeEnv(),
    });
    expect(res.status).toBe(404);
  });
});
