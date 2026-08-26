import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RETENTION_TTL_SECONDS, ENT_PREFIX, ORDER_PREFIX,
  readEntitlement, writeEntitlement, applyVerifiedPurchase, grantAdReward, claimOrder,
} from './_entitlements.js';
import { guardAiRequest, AI_LIMITS } from './_aiGuard.js';

// RETENÇÃO de `ent:` e `ord:` — item 3.1 do GUIA-DO-DONO.
//
// Até aqui os dois registros eram gravados SEM TTL: na prática, para sempre. O
// dono decidiu 5 anos. Estes casos travam as três coisas que a decisão implica,
// e as duas que ela NÃO pode quebrar:
//
//   TRAVA   `ent:` e `ord:` nascem com o TTL de política, e não com um literal
//           solto que ninguém consegue rastrear até a decisão que o gerou.
//   TRAVA   o TTL é RENOVADO a cada escrita — a pergunta que ele responde é
//           "essa conta ainda existe?", não "quando ela nasceu?". Mesmo
//           precedente do save (`save.js`), e o motivo pelo qual o teto
//           vitalício de IA não vira um teto de 5 anos para quem joga.
//   TRAVA   o `ord:` renova também quando o MESMO dono reivindica de novo —
//           que é o que "restaurar compras" faz. Recibo em uso é recibo vivo.
//   NÃO PODE MUDAR  `ord:` sobrevive à exclusão de conta (recibo, trava
//           anti-fraude e restauração de compra dependem dele).
//   NÃO PODE MUDAR  o teto vitalício de 26 gerações continua valendo INTEIRO
//           dentro da janela — TTL não é desconto de cota.

/** KV falso que ANOTA o TTL de cada `put`. É o TTL que está sob teste. */
function fakeEnv(initial = {}) {
  const store = new Map(Object.entries(initial));
  /** @type {Array<{ key: string, ttl: number|undefined }>} */
  const puts = [];
  return {
    DIGIAPP_SAVES: {
      get: async (k) => (store.has(k) ? store.get(k) : null),
      put: async (k, v, opts) => { store.set(k, v); puts.push({ key: k, ttl: opts?.expirationTtl }); },
      delete: async (k) => { store.delete(k); },
    },
    _store: store,
    _puts: puts,
    /** TTL do último `put` naquela chave (undefined = gravou SEM TTL). */
    _ttlDe: (k) => [...puts].reverse().find(p => p.key === k)?.ttl,
    _quantosPuts: (k) => puts.filter(p => p.key === k).length,
  };
}

/**
 * O prazo, escrito à mão AQUI de propósito. Se o teste importasse só a
 * constante do módulo, um `undefined` casaria com o `undefined` de um `put`
 * sem TTL e o vermelho viraria verde por acidente. O literal é a régua.
 */
const CINCO_ANOS = 157680000;

const SAVE = 'abcdefgh1234';
const ORDER = 'play:GPA.9999';

describe('retenção — o número de política', () => {
  it('a constante é 5 anos em segundos, exportada e nomeada', () => {
    // 5 anos: cobre o prazo do CDC para vício/fato do produto e o prazo fiscal
    // usual de guarda, e depois o dado some sozinho. Se este número mudar, é
    // porque a DECISÃO mudou — não porque alguém arredondou um literal.
    expect(RETENTION_TTL_SECONDS).toBe(CINCO_ANOS);
    expect(CINCO_ANOS).toBe(5 * 365 * 24 * 60 * 60);
  });
});

describe('retenção — `ent:`', () => {
  let env;
  beforeEach(() => { env = fakeEnv(); });

  it('nasce com o TTL de 5 anos, e não sem TTL nenhum', async () => {
    await writeEntitlement(env, SAVE, await readEntitlement(env, SAVE));
    expect(env._ttlDe(ENT_PREFIX + SAVE)).toBe(CINCO_ANOS);
  });

  it('a compra verificada grava com TTL', async () => {
    await applyVerifiedPurchase(env, SAVE, { orderId: 'o1', grantTier: 'paid', grantCredits: 60 });
    expect(env._ttlDe(ENT_PREFIX + SAVE)).toBe(CINCO_ANOS);
  });

  it('o crédito de anúncio grava com TTL', async () => {
    await grantAdReward(env, SAVE);
    expect(env._ttlDe(ENT_PREFIX + SAVE)).toBe(CINCO_ANOS);
  });

  it('RENOVA a cada escrita — a janela conta do último uso, não do nascimento', async () => {
    await writeEntitlement(env, SAVE, await readEntitlement(env, SAVE));
    await writeEntitlement(env, SAVE, await readEntitlement(env, SAVE));
    await writeEntitlement(env, SAVE, await readEntitlement(env, SAVE));
    expect(env._quantosPuts(ENT_PREFIX + SAVE)).toBe(3);
    // TODAS as escritas carregam o TTL cheio. Uma que gravasse sem ele
    // (ou com um resto do prazo) faria a conta viva expirar no meio do uso.
    for (const p of env._puts.filter(p => p.key === ENT_PREFIX + SAVE)) {
      expect(p.ttl).toBe(CINCO_ANOS);
    }
  });
});

describe('retenção — `ord:`', () => {
  let env;
  beforeEach(() => { env = fakeEnv(); });

  it('a reivindicação grava com o TTL de 5 anos', async () => {
    expect(await claimOrder(env, SAVE, ORDER)).toEqual({ ok: true });
    expect(env._ttlDe(ORDER_PREFIX + ORDER)).toBe(CINCO_ANOS);
  });

  it('o MESMO dono reivindicando de novo RENOVA o prazo — é o "restaurar compras"', async () => {
    await claimOrder(env, SAVE, ORDER);
    expect(await claimOrder(env, SAVE, ORDER)).toEqual({ ok: true });
    expect(env._quantosPuts(ORDER_PREFIX + ORDER)).toBe(2);
    expect(env._ttlDe(ORDER_PREFIX + ORDER)).toBe(CINCO_ANOS);
    // Renovar não é reescrever o dono: o valor continua sendo a MESMA conta.
    expect(env._store.get(ORDER_PREFIX + ORDER)).toBe(SAVE);
  });

  it('[NÃO PODE MUDAR] a renovação não afrouxa a trava: outra conta segue recusada', async () => {
    await claimOrder(env, SAVE, ORDER);
    await claimOrder(env, SAVE, ORDER);
    expect(await claimOrder(env, 'outraconta99', ORDER)).toEqual({ ok: false, reason: 'order-in-use' });
    // E a tentativa alheia NÃO renovou nem reescreveu nada.
    expect(env._quantosPuts(ORDER_PREFIX + ORDER)).toBe(2);
    expect(env._store.get(ORDER_PREFIX + ORDER)).toBe(SAVE);
  });
});

describe('[NÃO PODE MUDAR] o teto vitalício dentro da janela', () => {
  it('26 gerações continuam sendo 26 — TTL não é desconto de cota', async () => {
    const env = fakeEnv();
    const save = 'abcdefgh12345678';
    const req = () => new Request('https://soulmon.test/api/generate-sprite', { method: 'POST' });
    // O teto DIÁRIO (6) barraria antes do vitalício, então semeamos o contador
    // vitalício direto no registro — é ele que está sob teste aqui.
    env._store.set(ENT_PREFIX + save, JSON.stringify({
      tier: 'paid', aiLifetime: { sprite: AI_LIMITS.sprite.perAccountLifetime - 1 },
    }));
    // A 26ª passa.
    expect((await guardAiRequest(req(), env, 'sprite', save)).ok).toBe(true);
    // A 27ª não. E o registro que a recusa consultou é um `ent:` COM TTL.
    expect(await guardAiRequest(req(), env, 'sprite', save))
      .toMatchObject({ ok: false, status: 402, reason: 'sprite-lifetime-cap' });
    expect(env._ttlDe(ENT_PREFIX + save)).toBe(CINCO_ANOS);
  });

  it('o débito de IA RENOVA a janela — quem joga não vê o teto resetar', async () => {
    const env = fakeEnv();
    const save = 'abcdefgh12345678';
    const req = () => new Request('https://soulmon.test/api/generate-sprite', { method: 'POST' });
    await guardAiRequest(req(), env, 'sprite', save, 1, 'rookie');
    const primeiro = env._quantosPuts(ENT_PREFIX + save);
    await guardAiRequest(req(), env, 'sprite', save, 1, 'rookie');
    expect(env._quantosPuts(ENT_PREFIX + save)).toBe(primeiro + 1);
    for (const p of env._puts.filter(p => p.key === ENT_PREFIX + save)) {
      expect(p.ttl).toBe(CINCO_ANOS);
    }
  });
});

// A exclusão de conta é uma rota, não uma função de módulo — precisa do dublê
// de auth. Fica em bloco próprio, com o `vi.mock` no topo do arquivo por
// exigência do hoisting do vitest (ver `account.test.js`).
const authVerdict = { value: { ok: true, email: 'quem@exemplo.com' } };
vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => authVerdict.value,
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
const { onRequest: accountRoute } = await import('./account.js');

describe('[NÃO PODE MUDAR] exclusão de conta e o `ord:`', () => {
  const ID = 'a'.repeat(32);
  const ORD = 'GPA.1234';

  function contaSeeded() {
    const env = fakeEnv({
      [ID]: JSON.stringify({ petName: 'Bolha' }),
      [ORDER_PREFIX + ORD]: ID,
      [ENT_PREFIX + ID]: JSON.stringify({
        tier: 'paid', credits: 40, consumedOrders: [ORD],
        orderDetails: [{ orderId: ORD, purchaseToken: 'tok-9876' }],
        aiLifetime: { sprite: 3 },
      }),
    });
    env.DIGIAPP_SAVES.list = async ({ prefix = '' }) => ({
      keys: [...env._store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })),
      list_complete: true,
    });
    env.FIREBASE_PROJECT_ID = 'soulmon-test';
    return env;
  }

  const post = (qs, body) => new Request(`https://x/api/account?${qs}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}),
  });

  it('o `ord:` SOBREVIVE inteiro à exclusão — recibo, trava e restauração dependem dele', async () => {
    const env = contaSeeded();
    const { confirmToken } = await (await accountRoute({ request: post(`action=delete-request&id=${ID}`), env })).json();
    const res = await accountRoute({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env });
    expect(res.status).toBe(200);
    expect(env._store.has(ID)).toBe(false);                    // o save foi
    expect(env._store.get(ORDER_PREFIX + ORD)).toBe(ID);       // o recibo ficou
    // E a exclusão não tocou na chave: nada de reescrever nem encurtar prazo.
    expect(env._quantosPuts(ORDER_PREFIX + ORD)).toBe(0);
  });

  it('o `ent:` MINIMIZADO pela exclusão também nasce com o TTL — não fica imortal', async () => {
    const env = contaSeeded();
    const { confirmToken } = await (await accountRoute({ request: post(`action=delete-request&id=${ID}`), env })).json();
    await accountRoute({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env });
    const ent = JSON.parse(env._store.get(ENT_PREFIX + ID));
    expect(ent.tier).toBe('paid');               // o direito pago sobrevive
    expect(ent.aiLifetime).toEqual({});          // o USO some, como já era
    expect(env._ttlDe(ENT_PREFIX + ID)).toBe(CINCO_ANOS);
  });
});
