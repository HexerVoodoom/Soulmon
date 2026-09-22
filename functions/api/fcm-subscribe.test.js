/**
 * `/api/fcm-subscribe` — a rota IRMÃ do Web Push, que ficou para trás.
 *
 * Achado na sessão de QA de 09/09/2026. As duas rotas escrevem no MESMO
 * namespace de KV (`push:` e `fcm:`) e são drenadas pelo MESMO cron três vezes
 * por dia. Em 08/09/2026 `subscribe.js` ganhou teto por IP, teto de apelido,
 * lista fechada de idioma, validação de chave e escrita-só-quando-muda. Esta
 * não ganhou NADA — e ninguém percebeu, porque a regra não morava em lugar
 * nenhum. Footgun 9 no formato mais caro que ele tem.
 *
 * O que estava aberto, concretamente:
 *
 *  1. **Sem teto por IP.** `POST` anônimo → uma linha de KV com TTL de UM ANO,
 *     e cada linha vira alvo de entrega 3×/dia. Um laço de shell com tokens
 *     aleatórios define a nossa conta de KV e de cota de FCM.
 *  2. **Sem validação de token.** `{"token": []}` PASSAVA — `[]` é truthy, e
 *     o `TextEncoder` coage para string sem reclamar. A linha entrava, e o FCM
 *     devolvia `INVALID_ARGUMENT` — que não era caso de remoção. Um ano de
 *     tentativas 3×/dia por uma linha que nunca pode dar certo.
 *  3. **`petName` e `language` crus.** O apelido vai para o TÍTULO da
 *     notificação e é guardado por um ano; o campo do app corta em 24.
 *  4. **Escrevia sempre.** O app reenvia o token a cada abertura.
 *
 * Este arquivo vigia as quatro. A que fecha o buraco do outro lado — remover a
 * linha torta na SAÍDA — mora em `workers/push-scheduler.test.js`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { onRequestPost, onRequestDelete, onRequestOptions } from './fcm-subscribe.js';
import { ehTokenFcm, LIMITE_INSCRICAO } from './_pushIdentity.js';

/** Comprimento e alfabeto de um token de registro real do FCM. */
const TOKEN = `dQw4w9WgXcQ:APA91b${'H'.padEnd(140, 'x')}`;

function fakeKV() {
  const store = new Map();
  const gravacoes = [];
  const remocoes = [];
  return {
    store, gravacoes, remocoes,
    get: async k => store.get(k) ?? null,
    put: async (k, v, o) => { gravacoes.push({ k, v, o }); store.set(k, v); },
    delete: async k => { remocoes.push(k); store.delete(k); },
  };
}

function req(body, { method = 'POST', ip = '203.0.113.7', cru = null } = {}) {
  return new Request('https://x.dev/api/fcm-subscribe', {
    method,
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: cru ?? JSON.stringify(body),
  });
}

/** O balde do teto vive no ISOLATE e é compartilhado entre os casos deste
 *  arquivo. IP próprio por caso: sem isso, a ORDEM dos testes decidiria quem
 *  leva 429 — teste que depende de ordem é teste que mente depois. */
let n = 0;
const ipNovo = () => `192.0.2.${(n = (n + 1) % 250) + 1}`;

/** A ÚLTIMA gravação de inscrição (`fcm:*`). Desde o índice inverso `pushidx:`
 *  (22/09/2026) uma inscrição com `saveId` gera uma 2ª escrita, a do índice —
 *  que não é o registro e não pode ser lida como se fosse. */
const gravado = env => JSON.parse(env.PUSH_SUBSCRIPTIONS.gravacoes.filter(g => g.k.startsWith('fcm:')).at(-1).v);

describe('POST — o que é recusado ANTES de tocar o KV', () => {
  let env;
  beforeEach(() => { env = { PUSH_SUBSCRIPTIONS: fakeKV() }; });

  it('JSON inválido é 400 e não grava nada', async () => {
    const r = await onRequestPost({ request: req(null, { cru: '{nao e json', ip: ipNovo() }), env });
    expect(r.status).toBe(400);
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toEqual([]);
  });

  it('🔴 `{"token": []}` NÃO entra mais — o caso que passava por ser truthy', async () => {
    const r = await onRequestPost({ request: req({ token: [] }, { ip: ipNovo() }), env });
    expect(r.status).toBe(400);
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toEqual([]);
  });

  it('token de forma errada é 400 — objeto, número, curto, longo, alfabeto errado', async () => {
    for (const token of [
      {}, 42, true, 'curto', 'x'.repeat(513),
      `${TOKEN} com espaco`, `${TOKEN}<script>`,
    ]) {
      const r = await onRequestPost({ request: req({ token }, { ip: ipNovo() }), env });
      expect(r.status, `token ${String(token).slice(0, 30)} deveria ser recusado`).toBe(400);
    }
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toEqual([]);
  });

  it('sem token é 400', async () => {
    const r = await onRequestPost({ request: req({ petName: 'Bicho' }, { ip: ipNovo() }), env });
    expect(r.status).toBe(400);
  });

  it('o token de forma REAL é aceito — senão os casos acima seriam vácuo', async () => {
    const r = await onRequestPost({ request: req({ token: TOKEN }, { ip: ipNovo() }), env });
    expect(r.status).toBe(201);
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(1);
  });
});

describe('o texto do cliente que vai para o TÍTULO da notificação', () => {
  let env;
  beforeEach(() => { env = { PUSH_SUBSCRIPTIONS: fakeKV() }; });

  it('apelido é cortado em 24 e normalizado — o mesmo teto do campo do app', async () => {
    await onRequestPost({
      request: req({ token: TOKEN, petName: `  Bicho   ${'M'.repeat(80)}  ` }, { ip: ipNovo() }),
      env,
    });
    const { petName } = gravado(env);
    expect(petName).toHaveLength(24);
    expect(petName.startsWith('Bicho M')).toBe(true);
  });

  it('apelido vazio ou ausente vira "Soulmon", não string vazia', async () => {
    for (const petName of [undefined, '', '   ', null]) {
      await onRequestPost({ request: req({ token: TOKEN, petName }, { ip: ipNovo() }), env });
      expect(gravado(env).petName).toBe('Soulmon');
    }
  });

  it('idioma é lista FECHADA — qualquer coisa fora de pt-BR vira en-US', async () => {
    for (const language of ['pt-BR', 'en-US', 'x'.repeat(500), 'fr', {}, 7, null]) {
      await onRequestPost({ request: req({ token: TOKEN, language }, { ip: ipNovo() }), env });
      expect(gravado(env).language).toBe(language === 'pt-BR' ? 'pt-BR' : 'en-US');
    }
  });

  it('`bornAt` torto é DESCARTADO, não corrigido — senão vira dia 1 para sempre', async () => {
    for (const bornAt of ['ontem', '2026-9-1', '2026-09-01T00:00:00Z', 99]) {
      await onRequestPost({ request: req({ token: TOKEN, bornAt }, { ip: ipNovo() }), env });
      expect(Object.keys(gravado(env))).not.toContain('bornAt');
    }
    await onRequestPost({ request: req({ token: TOKEN, bornAt: '2026-09-01' }, { ip: ipNovo() }), env });
    expect(gravado(env).bornAt).toBe('2026-09-01');
  });
});

// Decisão #23 do QA GERAL: a conta dona vai no registro, para
// `account.js:deletePushSubscriptions` conseguir apagar na exclusão.
describe('`saveId` — a ligação com a conta', () => {
  let env;
  beforeEach(() => { env = { PUSH_SUBSCRIPTIONS: fakeKV() }; });

  it('válido é gravado', async () => {
    await onRequestPost({ request: req({ token: TOKEN, saveId: 'a'.repeat(32) }, { ip: ipNovo() }), env });
    expect(gravado(env).saveId).toBe('a'.repeat(32));
  });

  it('ausente: 201 e sem o campo — cliente antigo não quebra', async () => {
    const res = await onRequestPost({ request: req({ token: TOKEN }, { ip: ipNovo() }), env });
    expect(res.status).toBe(201);
    expect('saveId' in gravado(env)).toBe(false);
  });

  it('inválido é IGNORADO, não recusado nem corrigido', async () => {
    for (const ruim of ['curto', 'a'.repeat(65), 'ent:' + 'a'.repeat(32), 42, null]) {
      env = { PUSH_SUBSCRIPTIONS: fakeKV() };
      const res = await onRequestPost({ request: req({ token: TOKEN, saveId: ruim }, { ip: ipNovo() }), env });
      expect(res.status, JSON.stringify(ruim)).toBe(201);
      expect('saveId' in gravado(env)).toBe(false);
    }
  });
});

describe('a ESCRITA de KV, que é o que custa', () => {
  let env;
  beforeEach(() => { env = { PUSH_SUBSCRIPTIONS: fakeKV() }; });

  it('reenviar o MESMO token não grava de novo — o app reenvia a cada abertura', async () => {
    await onRequestPost({ request: req({ token: TOKEN, petName: 'Bicho' }, { ip: ipNovo() }), env });
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(1);
    for (let i = 0; i < 5; i++) {
      await onRequestPost({ request: req({ token: TOKEN, petName: 'Bicho' }, { ip: ipNovo() }), env });
    }
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(1);
  });

  it('mudar o apelido GRAVA — senão a economia acima seria perda de dado', async () => {
    await onRequestPost({ request: req({ token: TOKEN, petName: 'Bicho' }, { ip: ipNovo() }), env });
    await onRequestPost({ request: req({ token: TOKEN, petName: 'Outro' }, { ip: ipNovo() }), env });
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(2);
    expect(gravado(env).petName).toBe('Outro');
  });

  it('registro VELHO regrava mesmo sem mudar — senão o push morre no aniversário do TTL', async () => {
    await onRequestPost({ request: req({ token: TOKEN, petName: 'Bicho' }, { ip: ipNovo() }), env });
    const chave = env.PUSH_SUBSCRIPTIONS.gravacoes[0].k;
    const antigo = JSON.parse(env.PUSH_SUBSCRIPTIONS.store.get(chave));
    antigo.refreshedAt = Date.now() - 400 * 24 * 3600_000;
    env.PUSH_SUBSCRIPTIONS.store.set(chave, JSON.stringify(antigo));

    await onRequestPost({ request: req({ token: TOKEN, petName: 'Bicho' }, { ip: ipNovo() }), env });
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(2);
  });

  it('a chave é o HASH do token, e o token cru nunca vira caminho de KV', async () => {
    await onRequestPost({ request: req({ token: TOKEN }, { ip: ipNovo() }), env });
    const { k } = env.PUSH_SUBSCRIPTIONS.gravacoes[0];
    expect(k).toMatch(/^fcm:[0-9a-f]{32}$/);
    expect(k).not.toContain(TOKEN.slice(0, 12));
  });

  it('o TTL de um ano está na gravação — a linha não é eterna', async () => {
    await onRequestPost({ request: req({ token: TOKEN }, { ip: ipNovo() }), env });
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes[0].o.expirationTtl).toBe(60 * 60 * 24 * 365);
  });
});

describe('🔴 o teto por IP — a rota é anônima e escreve', () => {
  it(`o POST nº ${LIMITE_INSCRICAO.limit + 1} do mesmo IP na janela é 429, e não grava`, async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const ip = '198.51.100.99';
    let ultimo;
    for (let i = 0; i < LIMITE_INSCRICAO.limit + 1; i++) {
      // Token diferente por chamada: sem isso a escrita-só-quando-muda
      // esconderia a ausência do teto, e o caso ficaria verde por acidente.
      ultimo = await onRequestPost({ request: req({ token: `${TOKEN}${i}` }, { ip }), env });
    }
    expect(ultimo.status).toBe(429);
    expect(ultimo.headers.get('Retry-After')).toBeTruthy();
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes.length).toBe(LIMITE_INSCRICAO.limit);
  });

  it('o DELETE tem o teto também — apagar em laço também consulta o KV', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const ip = '198.51.100.98';
    let ultimo;
    for (let i = 0; i < LIMITE_INSCRICAO.limit + 1; i++) {
      ultimo = await onRequestDelete({
        request: req({ token: `${TOKEN}${i}` }, { method: 'DELETE', ip }),
        env,
      });
    }
    expect(ultimo.status).toBe(429);
  });
});

describe('DELETE e OPTIONS', () => {
  let env;
  beforeEach(() => { env = { PUSH_SUBSCRIPTIONS: fakeKV() }; });

  it('apaga pela MESMA chave que o POST gravou', async () => {
    await onRequestPost({ request: req({ token: TOKEN }, { ip: ipNovo() }), env });
    const chave = env.PUSH_SUBSCRIPTIONS.gravacoes[0].k;
    await onRequestDelete({ request: req({ token: TOKEN }, { method: 'DELETE', ip: ipNovo() }), env });
    expect(env.PUSH_SUBSCRIPTIONS.remocoes).toEqual([chave]);
    expect(env.PUSH_SUBSCRIPTIONS.store.has(chave)).toBe(false);
  });

  it('🔴 o DELETE aceita token de forma ERRADA — é como a linha torta velha sai', async () => {
    // Recusar aqui deixaria órfã justamente a inscrição que entrou antes de a
    // validação existir: o app manda o token que tem, e a única saída dele
    // pelo cliente é esta rota.
    const torto = 'tokenCurtoDaEraSemValidacao';
    expect(ehTokenFcm(torto)).toBe(false);
    const r = await onRequestDelete({ request: req({ token: torto }, { method: 'DELETE', ip: ipNovo() }), env });
    expect(r.status).toBe(200);
    expect(env.PUSH_SUBSCRIPTIONS.remocoes).toHaveLength(1);
  });

  it('OPTIONS responde 204 com CORS', async () => {
    const r = await onRequestOptions();
    expect(r.status).toBe(204);
    expect(r.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
