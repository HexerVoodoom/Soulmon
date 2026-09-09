/**
 * `/api/subscribe` — a rota que ESCREVE em KV sem custo para quem chama.
 *
 * Ela não tinha um teste sequer até a sessão de QA de 08/09/2026, e é a rota
 * com a pior relação entre custo de chamada e custo para nós: cada linha
 * gravada vira 4 `fetch` por dia no cron, por até um ano. As três defesas que
 * existem hoje foram todas escritas depois de um achado, e nenhuma era vigiada:
 *
 *  1. **Teto por IP** — `_rateLimit.js`. É amortecedor de CUSTO, não controle
 *     de segurança (está escrito lá); mesmo assim, se ele sair, um laço de
 *     shell define a nossa conta de KV.
 *  2. **Allowlist de endpoint** — sem ela o `endpoint` era gravado como veio e
 *     o worker fazia `fetch()` nele 4×/dia por um ano, com um JWT VAPID
 *     assinado pela chave de PRODUÇÃO no cabeçalho. Ou seja: SSRF assinado.
 *  3. **Escrever só quando muda** — o cliente reenvia a inscrição a cada
 *     abertura do app, e cada reenvio custava uma escrita de KV.
 *
 * E a quarta, que entrou nesta sessão: **texto de cliente com teto**. O
 * `petName` era gravado cru e vai para o TÍTULO da notificação; o campo do app
 * tem `maxLength={24}` e o `community.js` corta apelido em 24. Duas regras para
 * o mesmo tipo de campo é o footgun 9 em miniatura.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { onRequestPost, onRequestDelete, onRequestOptions } from './subscribe.js';

/** Endpoint de um serviço de push REAL — a allowlist só aceita os conhecidos. */
const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123';
const CHAVES = { p256dh: 'BEl'.padEnd(87, 'A'), auth: 'c2VncmVkbzE2Ynl0ZQ' };

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
  return new Request('https://x.dev/api/subscribe', {
    method,
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip },
    body: cru ?? JSON.stringify(body),
  });
}

/** Cada teste parte de um IP próprio: o balde do teto vive no ISOLATE e é
 *  compartilhado entre os casos deste arquivo. Sem isso, a ordem dos testes
 *  passaria a decidir quem leva 429 — teste que depende de ordem é teste que
 *  mente depois. */
let n = 0;
const ipNovo = () => `198.51.100.${(n = (n + 1) % 250) + 1}`;

describe('POST — o que é recusado antes de tocar o KV', () => {
  let env;
  beforeEach(() => { env = { PUSH_SUBSCRIPTIONS: fakeKV() }; });

  it('JSON inválido é 400 e não grava nada', async () => {
    const r = await onRequestPost({ request: req(null, { cru: '{isso não é json', ip: ipNovo() }), env });
    expect(r.status).toBe(400);
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toEqual([]);
  });

  it('sem endpoint ou sem as duas chaves é 400', async () => {
    for (const corpo of [
      {},
      { endpoint: ENDPOINT },
      { endpoint: ENDPOINT, keys: { p256dh: CHAVES.p256dh } },
      { endpoint: ENDPOINT, keys: { auth: CHAVES.auth } },
    ]) {
      const r = await onRequestPost({ request: req(corpo, { ip: ipNovo() }), env });
      expect(r.status, JSON.stringify(corpo)).toBe(400);
    }
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toEqual([]);
  });

  it('🔴 endpoint FORA da allowlist é recusado — é o SSRF com JWT assinado', async () => {
    // O worker faria `fetch()` neste endereço 4×/dia por um ano, com o JWT
    // VAPID de produção no cabeçalho. A allowlist é a única coisa entre isso e
    // um endereço escolhido por quem chama.
    for (const mau of [
      'https://atacante.example/push',
      'http://fcm.googleapis.com/fcm/send/x',      // http, não https
      'https://fcm.googleapis.com.atacante.example/fcm/send/x',
      'https://169.254.169.254/latest/meta-data/',  // metadados da nuvem
      'file:///etc/passwd',
    ]) {
      const r = await onRequestPost({ request: req({ endpoint: mau, keys: CHAVES }, { ip: ipNovo() }), env });
      expect(r.status, mau).toBe(400);
    }
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toEqual([]);
  });

  it('chave de criptografia torta é recusada — linha que nunca receberia push', async () => {
    for (const keys of [
      { p256dh: 'curta', auth: CHAVES.auth },
      { p256dh: CHAVES.p256dh, auth: 'x' },
      { p256dh: 'A'.repeat(5000), auth: CHAVES.auth },
      { p256dh: '<script>alert(1)</script>' + 'A'.repeat(20), auth: CHAVES.auth },
      { p256dh: CHAVES.p256dh, auth: { nao: 'string' } },
    ]) {
      const r = await onRequestPost({ request: req({ endpoint: ENDPOINT, keys }, { ip: ipNovo() }), env });
      expect(r.status, JSON.stringify(keys).slice(0, 40)).toBe(400);
    }
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toEqual([]);
  });
});

describe('POST — o registro gravado', () => {
  let env;
  beforeEach(() => { env = { PUSH_SUBSCRIPTIONS: fakeKV() }; });

  const gravado = () => JSON.parse(env.PUSH_SUBSCRIPTIONS.gravacoes[0].v);

  it('a chave do KV é o HASH do endpoint — reenviar é idempotente por construção', async () => {
    await onRequestPost({ request: req({ endpoint: ENDPOINT, keys: CHAVES }, { ip: ipNovo() }), env });
    const chave = env.PUSH_SUBSCRIPTIONS.gravacoes[0].k;
    expect(chave).toMatch(/^push:[0-9a-f]{32}$/);
    // E o endpoint em si NÃO é a chave: ele é URL com segredo dentro.
    expect(chave).not.toContain('fcm.googleapis.com');
  });

  it('🔴 `petName` é cortado em 24 — o mesmo teto do resto do projeto', async () => {
    await onRequestPost({
      request: req({ endpoint: ENDPOINT, keys: CHAVES, petName: 'N'.repeat(300) }, { ip: ipNovo() }),
      env,
    });
    expect(gravado().petName).toHaveLength(24);
  });

  it('`petName` vazio ou só espaço cai no padrão, não grava string vazia', async () => {
    for (const nome of ['', '   ', undefined, null]) {
      env = { PUSH_SUBSCRIPTIONS: fakeKV() };
      await onRequestPost({ request: req({ endpoint: ENDPOINT, keys: CHAVES, petName: nome }, { ip: ipNovo() }), env });
      expect(gravado().petName).toBe('Soulmon');
    }
  });

  it('`language` só pode ser um dos dois valores', async () => {
    for (const [entrada, esperado] of [
      ['pt-BR', 'pt-BR'], ['en-US', 'en-US'], [undefined, 'en-US'],
      ['x'.repeat(500), 'en-US'], ['pt', 'en-US'],
    ]) {
      env = { PUSH_SUBSCRIPTIONS: fakeKV() };
      await onRequestPost({ request: req({ endpoint: ENDPOINT, keys: CHAVES, language: entrada }, { ip: ipNovo() }), env });
      expect(gravado().language, String(entrada).slice(0, 12)).toBe(esperado);
    }
  });

  it('`bornAt` fora do formato é DESCARTADO, não corrigido', async () => {
    // Um `bornAt` torto viraria "dia 1" para sempre na copy do push.
    for (const b of ['2026-9-8', 'ontem', '', '2026-09-08T03:00:00Z', 99]) {
      env = { PUSH_SUBSCRIPTIONS: fakeKV() };
      await onRequestPost({ request: req({ endpoint: ENDPOINT, keys: CHAVES, bornAt: b }, { ip: ipNovo() }), env });
      expect(gravado().bornAt, String(b)).toBeUndefined();
    }
    env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    await onRequestPost({ request: req({ endpoint: ENDPOINT, keys: CHAVES, bornAt: '2026-09-08' }, { ip: ipNovo() }), env });
    expect(gravado().bornAt).toBe('2026-09-08');
  });

  it('o registro NÃO carrega nada além do que o push precisa', async () => {
    await onRequestPost({
      request: req({
        endpoint: ENDPOINT, keys: CHAVES, petName: 'Nimbo', language: 'pt-BR',
        // Campos que um cliente futuro (ou um curioso) poderia mandar:
        email: 'alguem@exemplo.com', saveId: 'a'.repeat(32), tier: 'paid',
      }, { ip: ipNovo() }),
      env,
    });
    // `bornAt: undefined` não sobrevive ao `JSON.stringify`, então ele só
    // aparece na lista quando veio válido — por isso a asserção é sobre o
    // CONJUNTO PERMITIDO, e não uma lista fixa.
    const PERMITIDOS = ['bornAt', 'endpoint', 'keys', 'language', 'petName', 'refreshedAt'];
    expect(Object.keys(gravado()).filter(k => !PERMITIDOS.includes(k))).toEqual([]);
  });
});

describe('POST — escrever só quando muda (o custo de KV)', () => {
  let env;
  beforeEach(() => { env = { PUSH_SUBSCRIPTIONS: fakeKV() }; });

  const enviar = ip => onRequestPost({
    request: req({ endpoint: ENDPOINT, keys: CHAVES, petName: 'Nimbo' }, { ip }),
    env,
  });

  it('reenviar a MESMA inscrição não gasta uma segunda escrita', async () => {
    await enviar(ipNovo());
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(1);
    const r = await enviar(ipNovo());
    expect(r.status).toBe(201);                       // sucesso, e sem escrita
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(1);
  });

  it('🔴 mas um registro VELHO é reescrito — senão o push morre no aniversário', async () => {
    // O TTL é de um ano e só renova na escrita. Se a comparação sozinha
    // decidisse, um jogador ativo com a inscrição inalterada perderia o push
    // exatamente um ano depois, em silêncio — o pior modo de falha deste canal.
    await enviar(ipNovo());
    const chave = env.PUSH_SUBSCRIPTIONS.gravacoes[0].k;
    const velho = JSON.parse(env.PUSH_SUBSCRIPTIONS.store.get(chave));
    velho.refreshedAt = Date.now() - 40 * 24 * 60 * 60 * 1000;   // 40 dias
    env.PUSH_SUBSCRIPTIONS.store.set(chave, JSON.stringify(velho));

    await enviar(ipNovo());
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(2);
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes[1].o.expirationTtl).toBe(60 * 60 * 24 * 365);
  });

  it('mudar o nome do pet reescreve', async () => {
    await enviar(ipNovo());
    await onRequestPost({
      request: req({ endpoint: ENDPOINT, keys: CHAVES, petName: 'Outro' }, { ip: ipNovo() }),
      env,
    });
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(2);
  });
});

describe('o teto por IP existe nos DOIS métodos', () => {
  it('POST: o 11º pedido do mesmo IP no minuto leva 429', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const ip = ipNovo();
    const status = [];
    for (let i = 0; i < 12; i++) {
      const r = await onRequestPost({
        request: req({ endpoint: `${ENDPOINT}/${i}`, keys: CHAVES }, { ip }),
        env,
      });
      status.push(r.status);
    }
    expect(status.slice(0, 10).every(s => s === 201)).toBe(true);
    expect(status.slice(10)).toEqual([429, 429]);
    // E o pedido barrado não gravou: são 10 escritas, não 12.
    expect(env.PUSH_SUBSCRIPTIONS.gravacoes).toHaveLength(10);
  });

  it('DELETE também é limitado — apagar em massa também custa', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const ip = ipNovo();
    const status = [];
    for (let i = 0; i < 12; i++) {
      const r = await onRequestDelete({ request: req({ endpoint: ENDPOINT }, { method: 'DELETE', ip }), env });
      status.push(r.status);
    }
    expect(status.slice(10)).toEqual([429, 429]);
  });
});

describe('DELETE', () => {
  it('remove pela MESMA chave que o POST gravou', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    await onRequestPost({ request: req({ endpoint: ENDPOINT, keys: CHAVES }, { ip: ipNovo() }), env });
    const chave = env.PUSH_SUBSCRIPTIONS.gravacoes[0].k;

    const r = await onRequestDelete({ request: req({ endpoint: ENDPOINT }, { method: 'DELETE', ip: ipNovo() }), env });
    expect(r.status).toBe(200);
    expect(env.PUSH_SUBSCRIPTIONS.remocoes).toEqual([chave]);
    expect(env.PUSH_SUBSCRIPTIONS.store.has(chave)).toBe(false);
  });

  it('sem endpoint é 400 e não apaga nada', async () => {
    const env = { PUSH_SUBSCRIPTIONS: fakeKV() };
    const r = await onRequestDelete({ request: req({}, { method: 'DELETE', ip: ipNovo() }), env });
    expect(r.status).toBe(400);
    expect(env.PUSH_SUBSCRIPTIONS.remocoes).toEqual([]);
  });
});

describe('preflight', () => {
  it('responde 204 com os cabeçalhos de CORS', async () => {
    const r = await onRequestOptions();
    expect(r.status).toBe(204);
    expect(r.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
  });
});
