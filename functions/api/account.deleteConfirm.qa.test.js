/**
 * QA rodada 1 (22/09/2026) — `delete-confirm` depois dos consertos de
 * `03-arquitetura-r1.md` §2 e `00-seguranca-a.md`:
 *
 *   (a) sprites (`sprite:img:*`, `sprite:lock:*`, `sprite:blob:*`) do titular
 *       são apagados; blob órfão e cache alheio não são tocados;
 *   (b) ORDEM: lápide antes de qualquer destruição, varreduras antes, save por
 *       ÚLTIMO; falha no passo reversível desfaz a lápide e devolve 500 com o
 *       token ainda válido; falha em passo irreversível é 200 + `falhou`;
 *   (c) lápide `del:done:<saveId>` (30 dias) → `save.js` responde 410 a GET e
 *       POST — outro aparelho logado não recria o save;
 *   (d) push pelo índice `pushidx:` com custo FIXO (1.500 inscrições alheias
 *       + 3 do titular em <= 40 operações e sem `list`), e fallback para a
 *       varredura só quando o índice não existe.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));

const { onRequest } = await import('./account.js');
const { onRequest: saveRoute } = await import('./save.js');
const { TOMBSTONE_TTL_SECONDS, tombstoneKey } = await import('./_accountTombstone.js');

const ID = 'a'.repeat(32);
const OTHER = 'b'.repeat(32);
const TOKEN_A = '0123456789abcdef0123456789abcdef';
const TOKEN_B = 'fedcba9876543210fedcba9876543210';
const TOKEN_ORFAO = '11111111111111111111111111111111';

/** KV que registra a ORDEM de tudo que acontece e conta operações. */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const ops = [];
  const kv = {
    store, ops,
    get: async k => { ops.push(['get', k]); return store.get(k) ?? null; },
    getWithMetadata: async k => { ops.push(['get', k]); return { value: store.get(k) ?? null, metadata: { t: Date.now() } }; },
    put: async (k, v, o) => { ops.push(['put', k]); store.set(k, typeof v === 'string' ? v : v); kv.lastOpts = o; },
    delete: async k => { ops.push(['delete', k]); store.delete(k); },
    list: async ({ prefix = '' }) => {
      ops.push(['list', prefix]);
      return { keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true, cursor: undefined };
    },
  };
  return kv;
}

const post = (qs, body) => new Request(`https://x/api/account?${qs}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}),
});

function seed() {
  return {
    [ID]: JSON.stringify({ petName: 'Bolha' }),
    [`profile:${ID}`]: JSON.stringify({ id: ID, name: 'Ana', friends: [OTHER] }),
    [`profile:${OTHER}`]: JSON.stringify({ id: OTHER, name: 'Bia', friends: [ID, 'c'.repeat(32)] }),
    [`gifts:${ID}`]: JSON.stringify({ pending: [] }),
    [`rank:2026-08:${ID}`]: JSON.stringify({ score: 10 }),
    // sprites do titular: um via nossa rota (com blob), um via provedor (sem blob), um lock
    [`sprite:img:${ID}:rookie`]: JSON.stringify({ image: `https://x/api/sprite-image?k=${TOKEN_A}`, provider: 'gemini', at: 1 }),
    [`sprite:img:${ID}:champion-virus`]: JSON.stringify({ image: 'https://cdn.higgsfield.ai/abc.png', provider: 'higgsfield', at: 2 }),
    [`sprite:lock:${ID}:mega-virus`]: '1',
    [`sprite:blob:${TOKEN_A}`]: 'PNGBYTES-A',
    // sprite de OUTRA conta e blob órfão: intocáveis
    [`sprite:img:${OTHER}:rookie`]: JSON.stringify({ image: `https://x/api/sprite-image?k=${TOKEN_B}`, provider: 'gemini', at: 3 }),
    [`sprite:blob:${TOKEN_B}`]: 'PNGBYTES-B',
    [`sprite:blob:${TOKEN_ORFAO}`]: 'PNGBYTES-ORFAO',
  };
}

async function pedirToken(e) {
  const r = await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e });
  return (await r.json()).confirmToken;
}

async function confirmar(e, confirmToken) {
  return onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });
}

describe('(a) sprites gerados por IA saem com a conta', () => {
  it('apaga cache, lock e o blob apontado; NÃO toca blob órfão nem sprite alheio', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const token = await pedirToken(e);
    const res = await confirmar(e, token);
    expect(res.status).toBe(200);
    const body = await res.json();
    const s = e.DIGIAPP_SAVES.store;

    for (const k of [`sprite:img:${ID}:rookie`, `sprite:img:${ID}:champion-virus`, `sprite:lock:${ID}:mega-virus`, `sprite:blob:${TOKEN_A}`]) {
      expect(s.has(k), `${k} deveria ter sido apagada`).toBe(false);
    }
    expect(s.has(`sprite:img:${OTHER}:rookie`)).toBe(true);
    expect(s.has(`sprite:blob:${TOKEN_B}`)).toBe(true);
    expect(s.has(`sprite:blob:${TOKEN_ORFAO}`), 'blob órfão não tem dono conhecido — fica, e é declarado').toBe(true);

    expect(body.executado.spritesApagados).toBe(4);
    expect(body.executado.apaga).toEqual(expect.arrayContaining([
      `sprite:img:${ID}:rookie`, `sprite:lock:${ID}:mega-virus`, `sprite:blob:${TOKEN_A}`,
    ]));
    expect(body.executado.falhou).toEqual([]);
    expect(body.naoIncluido.map(n => n.what)).toEqual(expect.arrayContaining([expect.stringContaining('sprite:blob')]));
  });

  it('o inventário do delete-request já lista os sprites — pedir não é executar', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const r = await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e });
    const { plano } = await r.json();
    expect(plano.apaga).toEqual(expect.arrayContaining([`sprite:img:${ID}:rookie`, `sprite:blob:${TOKEN_A}`]));
    expect(e.DIGIAPP_SAVES.store.has(`sprite:blob:${TOKEN_A}`)).toBe(true);
  });

  it('a listagem de sprite é por prefixo COM o saveId — nunca varre `sprite:` inteiro', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    await confirmar(e, await pedirToken(e));
    const prefixosListados = e.DIGIAPP_SAVES.ops.filter(o => o[0] === 'list').map(o => o[1]);
    for (const p of prefixosListados.filter(p => p.startsWith('sprite:'))) {
      expect(p, p).toMatch(new RegExp(`^sprite:(img|lock):${ID}:$`));
    }
    // E nenhum `get` de blob alheio
    expect(e.DIGIAPP_SAVES.ops.some(o => o[0] === 'get' && o[1] === `sprite:blob:${TOKEN_B}`)).toBe(false);
  });

  it('PARIDADE: os três prefixos repetidos aqui são os de `generate-sprite.js`', () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const gen = readFileSync(join(dir, 'generate-sprite.js'), 'utf8');
    const acc = readFileSync(join(dir, 'account.js'), 'utf8');
    for (const [nome, literal] of [['CACHE_PREFIX', 'sprite:img:'], ['LOCK_PREFIX', 'sprite:lock:'], ['BLOB_PREFIX', 'sprite:blob:']]) {
      expect(gen, `${nome} em generate-sprite.js`).toContain(`const ${nome} = '${literal}';`);
      expect(acc, `${literal} em account.js`).toContain(`'${literal}'`);
    }
    // E a rota que serve o blob lê a MESMA chave.
    const img = readFileSync(join(dir, 'sprite-image.js'), 'utf8');
    expect(img).toContain('`sprite:blob:${token}`');
  });
});

describe('(b) ORDEM — lápide antes, varreduras antes, save por último', () => {
  it('a lápide é a PRIMEIRA escrita destrutiva-adjacente e o save é o ÚLTIMO delete', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const token = await pedirToken(e);
    e.DIGIAPP_SAVES.ops.length = 0;
    await confirmar(e, token);
    const ops = e.DIGIAPP_SAVES.ops;

    const iLapide = ops.findIndex(o => o[0] === 'put' && o[1] === tombstoneKey(ID));
    const primeiroDelete = ops.findIndex(o => o[0] === 'delete');
    expect(iLapide).toBeGreaterThanOrEqual(0);
    expect(iLapide, 'lápide antes de qualquer delete').toBeLessThan(primeiroDelete);

    const deletes = ops.filter(o => o[0] === 'delete').map(o => o[1]);
    // O token de confirmação sai depois do save; o save é o último DADO a cair.
    const semToken = deletes.filter(k => k !== `del:${ID}`);
    expect(semToken.at(-1), 'save por último').toBe(ID);
    // A varredura de amigos (list profile:) vem antes de qualquer delete.
    const iScan = ops.findIndex(o => o[0] === 'list' && o[1] === 'profile:');
    expect(iScan).toBeLessThan(primeiroDelete);
    // O blob cai antes do cache que aponta para ele.
    expect(deletes.indexOf(`sprite:blob:${TOKEN_A}`)).toBeLessThan(deletes.indexOf(`sprite:img:${ID}:rookie`));

    // Lápide gravada com o TTL de 30 dias.
    expect(TOMBSTONE_TTL_SECONDS).toBe(30 * 86400);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(tombstoneKey(ID))).at).toBeGreaterThan(0);
  });

  it('varredura de amigos estoura → 500, lápide DESFEITA, nada apagado, token ainda vale', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const token = await pedirToken(e);
    const kv = e.DIGIAPP_SAVES;
    const listOriginal = kv.list;
    kv.list = async (args) => {
      if (args.prefix === 'profile:') throw new Error('too many subrequests');
      return listOriginal(args);
    };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await expect(confirmar(e, token)).rejects.toThrow('too many subrequests');

    expect(kv.store.has(ID), 'save intacto').toBe(true);
    expect(kv.store.has(`sprite:blob:${TOKEN_A}`)).toBe(true);
    expect(kv.store.has(tombstoneKey(ID)), 'lápide desfeita — a conta não foi apagada').toBe(false);
    expect(kv.store.has(`del:${ID}`), 'token continua para o retry').toBe(true);

    // Retry com o mesmo token, KV recuperado: completa.
    kv.list = listOriginal;
    const r = await confirmar(e, token);
    expect(r.status).toBe(200);
    expect(kv.store.has(ID)).toBe(false);
    expect(kv.store.has(tombstoneKey(ID))).toBe(true);
  });

  it('falha em passo IRREVERSÍVEL não lança: 200, `falhou` nomeia a chave, token fica para o retry', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const token = await pedirToken(e);
    const kv = e.DIGIAPP_SAVES;
    const deleteOriginal = kv.delete;
    kv.delete = async (k) => {
      if (k === `gifts:${ID}`) throw new Error('KV indisponível');
      return deleteOriginal(k);
    };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const r = await confirmar(e, token);
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.executado.falhou).toEqual([`gifts:${ID}`]);
    expect(kv.store.has(ID), 'o save caiu mesmo assim').toBe(false);
    expect(kv.store.has(`del:${ID}`), 'token preservado: a pessoa pode confirmar de novo').toBe(true);

    kv.delete = deleteOriginal;
    const r2 = await confirmar(e, token);
    expect((await r2.json()).executado.falhou).toEqual([]);
    expect(kv.store.has(`gifts:${ID}`)).toBe(false);
    expect(kv.store.has(`del:${ID}`)).toBe(false);
  });
});

describe('(c) lápide → save.js responde 410 a GET e POST', () => {
  const saveReq = (method, body) => new Request(`https://x/api/save?id=${ID}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  });

  it('depois da exclusão, outro aparelho com POST 3 s depois leva 410 e NÃO recria o save', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    await confirmar(e, await pedirToken(e));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const post3s = await saveRoute({ request: saveReq('POST', { state: { petName: 'Bolha', hp: 3 } }), env: e });
    expect(post3s.status).toBe(410);
    expect(await post3s.json()).toMatchObject({ error: 'account-deleted', deletedAt: expect.any(Number) });
    expect(e.DIGIAPP_SAVES.store.has(ID), 'o save NÃO voltou').toBe(false);

    const get = await saveRoute({ request: saveReq('GET'), env: e });
    expect(get.status).toBe(410);
  });

  it('sem lápide o save funciona normalmente (o 410 é só para conta apagada)', async () => {
    const e = { DIGIAPP_SAVES: fakeKV({}) };
    const r = await saveRoute({ request: saveReq('POST', { state: { petName: 'Nova' } }), env: e });
    expect(r.status).toBe(200);
    expect(e.DIGIAPP_SAVES.store.has(ID)).toBe(true);
  });

  it('lápide expirada (KV a apagou) → mesmo e-mail cria conta nova: a porta fica aberta', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    await confirmar(e, await pedirToken(e));
    e.DIGIAPP_SAVES.store.delete(tombstoneKey(ID)); // o TTL fez isto, 30 dias depois
    const r = await saveRoute({ request: saveReq('POST', { state: { petName: 'Renascida' } }), env: e });
    expect(r.status).toBe(200);
  });
});

describe('(d) push pelo índice inverso `pushidx:` — custo fixo', () => {
  it('1.500 inscrições alheias + 3 do titular: apaga as 3 em <= 40 operações, SEM `list`', async () => {
    const pushSeed = {};
    for (let i = 0; i < 1500; i++) pushSeed[`push:alheia${String(i).padStart(4, '0')}`] = JSON.stringify({ endpoint: `e${i}`, saveId: OTHER });
    pushSeed['push:minha1'] = JSON.stringify({ endpoint: 'm1', saveId: ID });
    pushSeed['push:minha2'] = JSON.stringify({ endpoint: 'm2', saveId: ID });
    pushSeed['fcm:minha3'] = JSON.stringify({ token: 't3', saveId: ID });
    // entrada MORTA no índice (o cron já apagou a inscrição) e entrada que aponta para registro alheio
    pushSeed[`pushidx:${ID}`] = JSON.stringify({
      v: 1, updatedAt: Date.now(),
      keys: { 'push:minha1': 1, 'push:minha2': 2, 'fcm:minha3': 3, 'push:morta': 4, 'push:alheia0000': 5 },
    });
    const pushKV = fakeKV(pushSeed);
    const e = { DIGIAPP_SAVES: fakeKV(seed()), PUSH_SUBSCRIPTIONS: pushKV, FIREBASE_PROJECT_ID: 'soulmon-test' };
    const token = await pedirToken(e);
    pushKV.ops.length = 0;
    const body = await (await confirmar(e, token)).json();

    expect(body.executado.inscricoesDePushApagadas).toBe(3);
    expect(pushKV.store.has('push:minha1')).toBe(false);
    expect(pushKV.store.has('fcm:minha3')).toBe(false);
    expect(pushKV.store.has('push:alheia0000'), 'índice aponta, não prova: registro alheio fica').toBe(true);
    expect(pushKV.store.has(`pushidx:${ID}`), 'índice sai junto').toBe(false);
    expect(pushKV.store.size).toBe(1500);

    expect(pushKV.ops.length, 'custo fixo, independente das 1.500').toBeLessThanOrEqual(40);
    expect(pushKV.ops.some(o => o[0] === 'list'), 'sem varredura quando há índice').toBe(false);
  });

  it('sem índice (conta anterior ao índice que nunca reabriu o app) cai na varredura — compat', async () => {
    const pushKV = fakeKV({
      'push:aaaa': JSON.stringify({ endpoint: 'x', saveId: ID }),
      'push:cccc': JSON.stringify({ endpoint: 'y', saveId: OTHER }),
      'push:dddd': JSON.stringify({ endpoint: 'z' }),
    });
    const e = { DIGIAPP_SAVES: fakeKV(seed()), PUSH_SUBSCRIPTIONS: pushKV, FIREBASE_PROJECT_ID: 'soulmon-test' };
    const body = await (await confirmar(e, await pedirToken(e))).json();
    expect(body.executado.inscricoesDePushApagadas).toBe(1);
    expect([...pushKV.store.keys()].sort()).toEqual(['push:cccc', 'push:dddd']);
    expect(pushKV.ops.some(o => o[0] === 'list')).toBe(true);
  });

  it('índice ilegível (JSON quebrado) é tratado como inexistente — varredura, sem 500', async () => {
    const pushKV = fakeKV({
      [`pushidx:${ID}`]: '{nope',
      'push:aaaa': JSON.stringify({ endpoint: 'x', saveId: ID }),
    });
    const e = { DIGIAPP_SAVES: fakeKV(seed()), PUSH_SUBSCRIPTIONS: pushKV, FIREBASE_PROJECT_ID: 'soulmon-test' };
    const r = await confirmar(e, await pedirToken(e));
    expect(r.status).toBe(200);
    expect((await r.json()).executado.inscricoesDePushApagadas).toBe(1);
  });
});
