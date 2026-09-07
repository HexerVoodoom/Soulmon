import { describe, it, expect } from 'vitest';
import { onRequest, onRequestOptions } from './save.js';

// `functions/api/save.js` é o endpoint que guarda o save de TODO jogador e
// não tinha nenhum teste. Os dois achados abaixo são consequência direta disso:
// o contrato de POST (o id vem do QUERY, nunca do corpo) nunca foi travado, e
// o desktop escreve mandando o id no CORPO — o que devolve 400 sempre.
//
// Escrito na rodada de sweeper. Cada `it` marcado com [BUG] FALHA hoje e
// documenta um defeito real; os demais travam o comportamento que já está certo.

const ID = 'a'.repeat(32);

/**
 * KV de mentira com o mínimo que o save.js usa.
 *
 * `getWithMetadata` e o `metadata` do `put` entraram junto com a renovação
 * preguiçosa do TTL (`SAVE_TTL_SECONDS`): o GET precisa saber QUANDO o
 * registro foi gravado para decidir se reescreve. O falso guarda metadata de
 * verdade — um falso que devolvesse metadata vazia faria a renovação disparar
 * em todo GET no teste e nunca no produto, que é o pior tipo de falso.
 */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  const ttls = new Map();
  return {
    store,
    meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({
      value: store.get(k) ?? null,
      metadata: meta.get(k) ?? null,
    }),
    put: async (k, v, opts) => {
      store.set(k, v);
      if (opts?.metadata !== undefined) meta.set(k, opts.metadata);
      if (opts?.expirationTtl !== undefined) ttls.set(k, opts.expirationTtl);
    },
    delete: async k => { store.delete(k); meta.delete(k); },
    ttls: (() => ttls)(),
  };
}

const env = (seed) => ({ DIGIAPP_SAVES: fakeKV(seed) });

const post = (url, body) => new Request(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('save.js — leitura e escrita básicas', () => {
  it('GET de save inexistente responde found:false, não 404', async () => {
    const e = env();
    const res = await onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env: e });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ found: false });
  });

  it('POST grava e GET devolve o mesmo estado', async () => {
    const e = env();
    await onRequest({ request: post(`https://x/api/save?id=${ID}`, { state: { healthPoints: 2 } }), env: e });
    const res = await onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env: e });
    const data = await res.json();
    expect(data.found).toBe(true);
    expect(data.state.healthPoints).toBe(2);
  });

  it('id inválido é recusado com 400', async () => {
    const res = await onRequest({ request: new Request('https://x/api/save?id=curto'), env: env() });
    expect(res.status).toBe(400);
  });

  it('accountTier/credits mandados pelo cliente são descartados', async () => {
    const e = env();
    await onRequest({
      request: post(`https://x/api/save?id=${ID}`, { state: { accountTier: 'paid', credits: 9999, healthPoints: 1 } }),
      env: e,
    });
    const gravado = JSON.parse(e.DIGIAPP_SAVES.store.get(ID));
    expect(gravado.accountTier).toBeUndefined();
    expect(gravado.credits).toBeUndefined();

    const data = await (await onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env: e })).json();
    expect(data.state.accountTier).toBe('demo');
    expect(data.state.credits).toBe(0);
  });
});

describe('contrato de POST: `?id=` é o canônico, `body.id` é o fallback retrocompatível', () => {
  // O renderer do desktop (desktop/renderer/src/cloudSync.ts → pushCareAction)
  // faz `POST ${APP_URL}/api/save` com `{ id, state }` no CORPO e NENHUM `?id=`.
  // save.js lê `url.searchParams.get('id')`, então o id chega nulo e a resposta
  // é 400. Resultado concreto: carinho, comida e "marcar tarefa" feitos pelo
  // overlay de desktop NUNCA são gravados — a UI mostra o erro genérico de
  // rede. É a função inteira do desktop enquanto "controle remoto do app".
  //
  // CORRIGIDO nos DOIS lados: o desktop passou a mandar `?id=` (contrato
  // canônico) e o servidor passou a aceitar `body.id` como fallback, para que
  // as builds JÁ INSTALADAS (Electron/Steam, APKs antigos) voltem a gravar sem
  // depender de o usuário atualizar. O fallback não alarga a superfície: o id
  // do corpo passa pelo mesmo VALID_ID e pela mesma autorização.
  it('POST sem ?id= grava usando o id do corpo (build antiga volta a salvar)', async () => {
    const e = env();
    const res = await onRequest({
      request: post('https://x/api/save', { id: ID, state: { healthPoints: 3 } }),
      env: e,
    });
    expect(res.status).toBe(200);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(ID)).healthPoints).toBe(3);
  });

  it('id do corpo também passa pelo VALID_ID — lixo continua 400', async () => {
    const e = env();
    const res = await onRequest({
      request: post('https://x/api/save', { id: 'curto', state: { healthPoints: 3 } }),
      env: e,
    });
    expect(res.status).toBe(400);
    expect(e.DIGIAPP_SAVES.store.size).toBe(0);
  });

  it('id do query divergindo do id do corpo é recusado, não adivinhado', async () => {
    const e = env();
    const res = await onRequest({
      request: post(`https://x/api/save?id=${ID}`, { id: 'b'.repeat(32), state: { healthPoints: 3 } }),
      env: e,
    });
    expect(res.status).toBe(400);
    expect(e.DIGIAPP_SAVES.store.size).toBe(0);
  });

  it('POST sem id nenhum continua 400', async () => {
    const e = env();
    const res = await onRequest({ request: post('https://x/api/save', { state: {} }), env: e });
    expect(res.status).toBe(400);
    expect(e.DIGIAPP_SAVES.store.size).toBe(0);
  });
});

describe('POST recusa `state` que não é objeto em vez de destruir o save', () => {
  // `if (!body?.state)` só barra falsy. Um `state` numérico/booleano passa, e
  // `{ ...5 }` é `{}` — o save inteiro do jogador é substituído por um objeto
  // vazio. Um cliente com bug (ou um retry que serializou errado) apaga anos de
  // progresso sem erro nenhum. Faltam duas guardas: tipo de `state` e tamanho.
  it('state numérico apaga o save em vez de ser recusado', async () => {
    const e = env({ [ID]: JSON.stringify({ healthPoints: 3, perfectDays: 42 }) });
    const res = await onRequest({ request: post(`https://x/api/save?id=${ID}`, { state: 1 }), env: e });

    // O correto seria 400 e o save intacto:
    expect(res.status).toBe(400);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(ID)).perfectDays).toBe(42);
  });

  it('state string vira um objeto de caracteres indexados', async () => {
    const e = env({ [ID]: JSON.stringify({ perfectDays: 42 }) });
    await onRequest({ request: post(`https://x/api/save?id=${ID}`, { state: 'oi' }), env: e });
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(ID)).perfectDays).toBe(42);
  });

  it('state array também é recusado', async () => {
    const e = env({ [ID]: JSON.stringify({ perfectDays: 42 }) });
    const res = await onRequest({ request: post(`https://x/api/save?id=${ID}`, { state: [1, 2] }), env: e });
    expect(res.status).toBe(400);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(ID)).perfectDays).toBe(42);
  });

  it('state null/ausente continua 400 (o comportamento antigo não regrediu)', async () => {
    const e = env({ [ID]: JSON.stringify({ perfectDays: 42 }) });
    for (const body of [{}, { state: null }, { state: undefined }]) {
      const res = await onRequest({ request: post(`https://x/api/save?id=${ID}`, body), env: e });
      expect(res.status).toBe(400);
    }
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(ID)).perfectDays).toBe(42);
  });

  it('state acima do teto de tamanho é recusado com 413, não gravado no KV', async () => {
    // Sem teto, um cliente com bug enchia o KV (25 MB/chave) de graça.
    const e = env({ [ID]: JSON.stringify({ perfectDays: 42 }) });
    const res = await onRequest({
      request: post(`https://x/api/save?id=${ID}`, { state: { lixo: 'x'.repeat(6 * 1024 * 1024) } }),
      env: e,
    });
    expect(res.status).toBe(413);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(ID)).perfectDays).toBe(42);
  });
});

describe('o preflight de CORS permite o header Authorization', () => {
  // save.js exige `Authorization: Bearer <idToken>` assim que o dono ligar o
  // FIREBASE_PROJECT_ID (docs/STATUS.md §3.1), mas anuncia só `Content-Type`
  // em Access-Control-Allow-Headers. Toda chamada do MESMO domínio passa (não
  // há preflight), então o app web não sente nada — mas o overlay Electron
  // chama a URL de produção de outra origem, o que dispara preflight, e o
  // navegador bloqueia a requisição antes de ela sair. `billing.js` já anuncia
  // `Content-Type, Authorization`; save.js e entitlements.js não.
  //
  // Falha ARMADA: hoje passa despercebido porque a auth está desligada.
  it('OPTIONS anuncia Authorization', async () => {
    const res = await onRequestOptions();
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });
});

describe('TTL do save — renovado a cada acesso (decisão do dono, 07/09/2026)', () => {
  // O prazo era efeito colateral de um literal `86400 * 365` no `put`, e SÓ a
  // escrita o renovava. Quem abre o app, olha o bicho e fecha sem gerar
  // escrita envelhecia o próprio save até perdê-lo — contra o guardrail nº 1
  // ("quem volta encontra saudade, não fatura"). Estes testes travam a
  // decisão para ela não voltar a ser acidente.
  const ANO = 86400 * 365;

  it('a ESCRITA grava o prazo cheio e a data', async () => {
    const e = env();
    await onRequest({ request: post(`https://x/api/save?id=${ID}`, { state: { perfectDays: 1 } }), env: e });
    expect(e.DIGIAPP_SAVES.ttls.get(ID)).toBe(ANO);
    expect(Number(e.DIGIAPP_SAVES.meta.get(ID).t)).toBeGreaterThan(0);
  });

  it('a LEITURA de um save VELHO renova o prazo', async () => {
    const e = env({ [ID]: JSON.stringify({ perfectDays: 7 }) });
    // 40 dias atrás: passou do limiar de renovação (30 dias).
    e.DIGIAPP_SAVES.meta.set(ID, { t: Date.now() - 40 * 86400 * 1000 });
    const res = await onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env: e });
    expect(res.status).toBe(200);
    expect(e.DIGIAPP_SAVES.ttls.get(ID)).toBe(ANO);
    // E o dado não pode ter sido corrompido pela renovação.
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(ID)).perfectDays).toBe(7);
  });

  it('a LEITURA de um save RECENTE não gasta escrita', async () => {
    const e = env({ [ID]: JSON.stringify({ perfectDays: 7 }) });
    e.DIGIAPP_SAVES.meta.set(ID, { t: Date.now() - 2 * 86400 * 1000 });
    await onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env: e });
    expect(e.DIGIAPP_SAVES.ttls.has(ID)).toBe(false);
  });

  it('save SEM metadata (gravado antes desta mudança) renova na primeira leitura', async () => {
    const e = env({ [ID]: JSON.stringify({ perfectDays: 3 }) });
    await onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env: e });
    expect(e.DIGIAPP_SAVES.ttls.get(ID)).toBe(ANO);
  });

  it('falha ao renovar NÃO derruba a leitura — o jogador veio buscar o save', async () => {
    const e = env({ [ID]: JSON.stringify({ perfectDays: 9 }) });
    e.DIGIAPP_SAVES.put = async () => { throw new Error('KV fora do ar'); };
    const res = await onRequest({ request: new Request(`https://x/api/save?id=${ID}`), env: e });
    expect(res.status).toBe(200);
    expect((await res.json()).state.perfectDays).toBe(9);
  });
});
