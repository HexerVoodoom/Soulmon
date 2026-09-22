/**
 * QA (rodada A, 21/09/2026) — `action=grant` sob ataque: os casos que
 * `entitlements.test.js` NÃO exercita. Derivados dos critérios de aceite da
 * cortesia (decisão #12): teto, idempotência, "nunca crédito", não rebaixar
 * quem pagou, e o método/corpo errados não abrirem nada.
 *
 * Handler REAL; só o KV é de mentira — e aqui ele é ASSÍNCRONO de verdade
 * (cada operação cede o tick), porque o teto é leitura-modificação-escrita e
 * a corrida só aparece quando duas requisições intercalam.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { onRequestGet, onRequestPost } from './entitlements.js';
import { ENT_PREFIX, COURTESY_COUNT_KEY, courtesyOrderId } from './_entitlements.js';
import { resetRateLimits } from './_rateLimit.js';

const ID = 'a'.repeat(32);
const OUTRO = 'b'.repeat(32);
const KEY = 'chave-do-dono-de-teste';

/** KV que cede o event loop em cada operação — intercala duas requisições. */
function fakeKVAsync(seed = {}) {
  const store = new Map(Object.entries(seed));
  const tick = () => new Promise(r => setTimeout(r, 0));
  return {
    store,
    get: async k => { await tick(); return store.get(k) ?? null; },
    put: async (k, v) => { await tick(); store.set(k, v); },
    delete: async k => { await tick(); store.delete(k); },
  };
}

const envAdmin = (seed = {}, extra = {}) => ({
  DIGIAPP_SAVES: fakeKVAsync(seed),
  ENTITLEMENTS_ADMIN_KEY: KEY,
  ...extra,
});

const grantReq = (rawBody, { method = 'POST', auth = `Bearer ${KEY}`, ip } = {}) =>
  new Request('https://x/api/entitlements?action=grant', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: auth } : {}),
      ...(ip ? { 'CF-Connecting-IP': ip } : {}),
    },
    ...(method === 'GET' ? {} : { body: typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody) }),
  });

const grant = (e, body, opts) => onRequestPost({ request: grantReq(body, opts), env: e });
const lerEnt = (e, id = ID) => JSON.parse(e.DIGIAPP_SAVES.store.get(ENT_PREFIX + id));

afterEach(() => { resetRateLimits(); vi.unstubAllGlobals(); });

describe('grant — corrida no teto (COURTESY_MAX_ACCOUNTS=1)', () => {
  it('OBSERVADO: dois grants concorrentes de contas DIFERENTES passam os dois — o teto fura por 1', async () => {
    // O cabeçalho de `_entitlements.js` DECLARA esta limitação ("a corrida
    // pode passar do teto por 1 ou 2"). Este caso fixa o número: com KV
    // eventualmente consistente e sem transação, duas requisições que leem
    // `courtesy:count = 0` ao mesmo tempo concedem as duas. Se um dia isto
    // virar 429 para uma delas, o teste tem que ser trocado — não afrouxado.
    const e = envAdmin({}, { COURTESY_MAX_ACCOUNTS: '1' });
    const [r1, r2] = await Promise.all([grant(e, { saveId: ID }), grant(e, { saveId: OUTRO })]);
    const statuses = [r1.status, r2.status].sort();
    expect(statuses).toEqual([200, 200]);
    // Contador: as duas escreveram "1" (leram 0). Fica 1, não 2 — o teto
    // "acha" que ainda tem vaga zero, mas as duas contas estão pagas.
    expect(e.DIGIAPP_SAVES.store.get(COURTESY_COUNT_KEY)).toBe('1');
    expect(lerEnt(e, ID).tier).toBe('paid');
    expect(lerEnt(e, OUTRO).tier).toBe('paid');
    // Depois da corrida, o teto volta a valer: a terceira é recusada.
    const r3 = await grant(e, { saveId: 'c'.repeat(32) });
    expect(r3.status).toBe(429);
  });

  it('dois grants concorrentes da MESMA conta não duplicam o pedido nem o crédito', async () => {
    const e = envAdmin({}, { COURTESY_MAX_ACCOUNTS: '1' });
    await Promise.all([grant(e, { saveId: ID }), grant(e, { saveId: ID })]);
    const ent = lerEnt(e);
    expect(ent.tier).toBe('paid');
    expect(ent.credits).toBe(0);
    // Corrida na MESMA chave: a última escrita ganha; o pior caso aceitável é
    // UMA entrada. Duas seria crédito/pedido duplicado — o que `applyVerifiedPurchase`
    // promete impedir.
    expect(ent.consumedOrders.filter(o => o === courtesyOrderId(ID))).toHaveLength(1);
    expect(ent.orderDetails).toHaveLength(1);
  });
});

describe('grant — corpo inválido', () => {
  const casos = [
    ['saveId ausente', {}],
    ['saveId array', { saveId: [ID] }],
    ['saveId objeto', { saveId: { toString: () => ID } }],
    ['saveId número', { saveId: 12345678 }],
    ['saveId com espaço', { saveId: `${ID} ` }],
    ['saveId com path', { saveId: '../' + 'a'.repeat(30) }],
    ['saveId gigante (65)', { saveId: 'a'.repeat(65) }],
    ['saveId null', { saveId: null }],
    ['body é array', [ID]],
    ['body é string JSON', '"' + ID + '"'],
    ['body não é JSON', '{isto nao'],
  ];
  for (const [nome, body] of casos) {
    it(`${nome} → 400 e KV intocado`, async () => {
      const e = envAdmin();
      const res = await grant(e, body);
      expect(res.status, nome).toBe(400);
      expect(e.DIGIAPP_SAVES.store.size, nome).toBe(0);
    });
  }

  it('saveId no LIMITE (8 e 64 chars) é aceito', async () => {
    for (const id of ['a'.repeat(8), 'z'.repeat(64)]) {
      const e = envAdmin();
      expect((await grant(e, { saveId: id })).status, id.length).toBe(200);
    }
  });
});

describe('grant — conta que JÁ pagou pela Play', () => {
  const pagoPelaPlay = () => ({
    tier: 'paid', credits: 42, consumedOrders: ['GPA.1'],
    orderDetails: [{ orderId: 'GPA.1', provider: 'play', productId: 'soulmon.unlock.full', purchaseToken: 'tk', grantTier: 'paid', grantCredits: 0 }],
  });

  it('não toca créditos nem tier; o pedido de cortesia é acrescentado ao histórico', async () => {
    const e = envAdmin({ [ENT_PREFIX + ID]: JSON.stringify(pagoPelaPlay()) }, { COURTESY_MAX_ACCOUNTS: '5' });
    const res = await grant(e, { saveId: ID });
    expect(res.status).toBe(200);
    const ent = lerEnt(e);
    expect(ent.tier).toBe('paid');
    expect(ent.credits, 'cortesia nunca mexe em crédito, nem para cima nem para baixo').toBe(42);
    expect(ent.consumedOrders).toEqual(['GPA.1', courtesyOrderId(ID)]);
  });

  it('OBSERVADO: o `provider` público passa de play para courtesy (o mais recente ganha)', async () => {
    // `paidProviderOf` devolve o provider do ÚLTIMO pedido pago não desfeito.
    // Uma cortesia dada por engano a quem pagou faz o painel do dono ler
    // "courtesy" — a leitura de "vínculo de quem pagou" fica contaminada. Não
    // é perda de direito (tier segue paid), é ruído de MEDIÇÃO. Fixado aqui
    // para não ser descoberto no painel.
    const e = envAdmin({ [ENT_PREFIX + ID]: JSON.stringify(pagoPelaPlay()) });
    const body = await (await grant(e, { saveId: ID })).json();
    expect(body.provider).toBe('courtesy');
  });

  it('Play reembolsada depois da cortesia: o tier é DERIVADO dos pedidos em pé — a cortesia sobrevive (provisório, pendente do dono)', async () => {
    // Era BUG-CANDIDATO fixado como "observado": `auditRefunds` fazia
    // `ent.tier = 'demo'` por pedido desfeito, sem olhar se OUTRO pedido pago
    // ainda valia. Consertado em 22/09/2026: o tier agora é
    // `paidProviderOf(ent) ? 'paid' : 'demo'` no fim do laço
    // (`_entitlements.tierDerivado.qa.test.js` trava a invariante). A
    // consequência "cortesia sobrevive a reembolso da Play" é PROVISÓRIA — se
    // o dono decidir o contrário, o pedido `courtesy:*` passa a ser anulado
    // junto, e este teste muda de expectativa (não a derivação).
    const e = envAdmin({ [ENT_PREFIX + ID]: JSON.stringify(pagoPelaPlay()) });
    await grant(e, { saveId: ID });
    const { auditRefunds, publicView } = await import('./_entitlements.js');
    const { ent } = await auditRefunds(e, ID, async o => o.provider === 'play', Date.now());
    expect(ent.orderDetails.find(o => o.provider === 'play').voided).toBe(true);
    expect(ent.orderDetails.find(o => o.provider === 'courtesy').voided).toBeUndefined();
    expect(ent.tier).toBe('paid');
    // E o provider reportado é o do pedido mais recente NÃO anulado.
    expect(publicView(ent).provider).toBe('courtesy');
  });

  it('cortesia ANTES, Play válida DEPOIS: o provider público é `play`, não `courtesy` (pedido mais recente não anulado)', async () => {
    const e = envAdmin();
    await grant(e, { saveId: ID });
    const { applyVerifiedPurchase, publicView, readEntitlement } = await import('./_entitlements.js');
    await applyVerifiedPurchase(e, ID, {
      orderId: 'GPA.7777', provider: 'play', productId: 'soulmon.unlock.full',
      purchaseToken: 'tok', grantTier: 'paid', grantCredits: 0,
    });
    const ent = await readEntitlement(e, ID);
    expect(ent.tier).toBe('paid');
    expect(publicView(ent).provider).toBe('play');
  });
});

describe('grant — depois do grant, o GET vê courtesy e a auditoria não revoga', () => {
  it('GET devolve provider courtesy; auditoria forçada (auditedAt=0) mantém paid e não vai à rede', async () => {
    const e = envAdmin();
    await grant(e, { saveId: ID });
    // `emptyEntitlement` nasce com auditedAt=0: a primeira leitura audita.
    expect(lerEnt(e).auditedAt ?? 0).toBe(0);
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('não era para ir à rede'); }));
    const res = await onRequestGet({ request: new Request(`https://x/api/entitlements?id=${ID}`), env: e });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ tier: 'paid', credits: 0, provider: 'courtesy' });
    expect(fetch).not.toHaveBeenCalled();
    expect(lerEnt(e).orderDetails[0].voided).toBeUndefined();
    expect(lerEnt(e).tier).toBe('paid');
  });
});

describe('grant — método e superfície', () => {
  it('GET em ?action=grant NÃO concede: cai no GET normal (400 sem id) e o KV fica intocado', async () => {
    const e = envAdmin();
    const res = await onRequestGet({ request: grantReq(null, { method: 'GET' }), env: e });
    expect(res.status).toBe(400);
    expect(e.DIGIAPP_SAVES.store.size).toBe(0);
  });

  it('sem chave no ambiente, nem a taxa nem a auth aparecem: 404 sempre, inclusive com corpo válido', async () => {
    const e = { DIGIAPP_SAVES: fakeKVAsync() };
    for (let i = 0; i < 12; i++) {
      const res = await grant(e, { saveId: ID }, { ip: '1.2.3.4' });
      expect(res.status).toBe(404);
    }
  });

  it('11ª tentativa do mesmo IP em 1 min é 429 com Retry-After — mesmo com chave errada (a sonda paga antes de saber)', async () => {
    const e = envAdmin();
    let ultimo;
    for (let i = 0; i < 11; i++) {
      ultimo = await grant(e, { saveId: ID }, { ip: '9.9.9.9', auth: 'Bearer errada' });
    }
    expect(ultimo.status).toBe(429);
    expect(ultimo.headers.get('Retry-After')).toMatch(/^\d+$/);
  });

  it('chave certa com prefixo/sufixo extra não passa (comparação exata, não `includes`)', async () => {
    for (const auth of [`Bearer ${KEY}x`, `Bearer x${KEY}`, `Bearer ${KEY.toUpperCase()}`, `bearer ${KEY}`]) {
      const e = envAdmin();
      expect((await grant(e, { saveId: ID }, { auth })).status, auth).toBe(401);
    }
  });
});
