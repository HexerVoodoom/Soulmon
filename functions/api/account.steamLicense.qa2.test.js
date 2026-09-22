/**
 * Decisão do dono **#54** (22/09/2026, QA Rodadas 1 e 2 — `04-dados-r2` #4):
 * `ord:steam:own:<appid>:<steamid>` passa a ser APAGADO na exclusão de conta.
 *
 * Por que isto merece teste próprio: a chave carrega um **SteamID64**, que é
 * identificador de TERCEIRO, e a justificativa fiscal de 5 anos da política §8
 * não cobre licença de posse (não há transação nossa). O caminho é sutil em
 * dois pontos, e cada um tem um teste aqui:
 *
 *   1. a chave é **derivada** de `ent:<saveId>.consumedOrders` — não há
 *      varredura, então uma regressão em `steamLicenseKeysOf` não quebra nada
 *      visível: a exclusão só passa a deixar o SteamID para trás em silêncio;
 *   2. apagar a chave e deixar a MESMA string em `consumedOrders`/
 *      `orderDetails` do entitlement minimizado reteria o SteamID pelos mesmos
 *      5 anos pela porta de trás (o entitlement sobrevive à exclusão).
 *
 * O que NÃO muda: `ord:<orderId>` de Play e cortesia continua sobrevivendo — o
 * orderId deles não identifica pessoa, e é a trava "um recibo, uma conta".
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('./_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));

const { onRequest } = await import('./account.js');

const ID = 'a'.repeat(32);
const STEAM_ID = '76561198000000001';
const APP_ID = '1234567';
const STEAM_ORDER = `steam:own:${APP_ID}:${STEAM_ID}`;
const PLAY_ORDER = 'GPA.1234-5678-9012-34567';

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const ops = [];
  return {
    store, ops,
    get: async k => { ops.push(['get', k]); return store.get(k) ?? null; },
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: {} }),
    put: async (k, v) => { ops.push(['put', k]); store.set(k, v); },
    delete: async k => { ops.push(['delete', k]); store.delete(k); },
    list: async ({ prefix = '' }) => {
      ops.push(['list', prefix]);
      return { keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true };
    },
  };
}

function seed() {
  return {
    [ID]: JSON.stringify({ petName: 'Bolha' }),
    [`ent:${ID}`]: JSON.stringify({
      tier: 'paid',
      credits: 12,
      consumedOrders: [PLAY_ORDER, STEAM_ORDER],
      orderDetails: [
        { orderId: PLAY_ORDER, provider: 'play', productId: 'soulmon.unlock.full', grantTier: 'paid', grantCredits: 0 },
        { orderId: STEAM_ORDER, provider: 'steam', productId: 'soulmon.unlock.full', grantTier: 'paid', grantCredits: 0 },
      ],
      aiLifetime: { sprite: 9 },
    }),
    [`ord:${PLAY_ORDER}`]: ID,
    [`ord:${STEAM_ORDER}`]: ID,
  };
}

const post = (qs, body) => new Request(`https://x/api/account?${qs}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}),
});

const pedirToken = async e =>
  (await (await onRequest({ request: post(`action=delete-request&id=${ID}`), env: e })).json());

const confirmar = (e, confirmToken) =>
  onRequest({ request: post(`action=delete-confirm&id=${ID}`, { confirmToken }), env: e });

describe('#54 — o vínculo SteamID ↔ conta sai com a conta', () => {
  it('o inventário do delete-request lista `ord:steam:own:*` em `apaga`, e não em `sobrevive`', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const { plano } = await pedirToken(e);
    expect(plano.apaga).toContain(`ord:${STEAM_ORDER}`);
    expect(plano.sobrevive).toContain(`ord:${PLAY_ORDER}`);
    expect(plano.sobrevive).not.toContain(`ord:${STEAM_ORDER}`);
    // Pedir não é executar.
    expect(e.DIGIAPP_SAVES.store.has(`ord:${STEAM_ORDER}`)).toBe(true);
  });

  it('apaga `ord:steam:own:*` e MANTÉM `ord:<orderId>` da Play', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const res = await confirmar(e, (await pedirToken(e)).confirmToken);
    expect(res.status).toBe(200);
    const body = await res.json();
    const s = e.DIGIAPP_SAVES.store;

    expect(s.has(`ord:${STEAM_ORDER}`), 'o SteamID não pode sobreviver à exclusão').toBe(false);
    expect(s.get(`ord:${PLAY_ORDER}`), 'o recibo da Play é a trava anti-fraude e fica').toBe(ID);
    expect(body.executado.licencasSteamApagadas).toBe(1);
    expect(body.executado.falhou).toEqual([]);
  });

  it('o SteamID também sai de `consumedOrders`/`orderDetails` do entitlement minimizado', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    await confirmar(e, (await pedirToken(e)).confirmToken);
    const ent = JSON.parse(e.DIGIAPP_SAVES.store.get(`ent:${ID}`));

    expect(ent.consumedOrders).toEqual([PLAY_ORDER]);
    expect(ent.orderDetails.map(o => o.orderId)).toEqual([PLAY_ORDER]);
    // O tier pago NÃO é recalculado a partir da lista — o direito comprado fica.
    expect(ent.tier).toBe('paid');
    expect(ent.credits).toBe(12);
    // Nenhum resquício do SteamID em lugar nenhum do registro.
    expect(JSON.stringify(ent)).not.toContain(STEAM_ID);
  });

  it('conta sem Steam: nada muda, e não há chave inventada', async () => {
    const semSteam = seed();
    semSteam[`ent:${ID}`] = JSON.stringify({
      tier: 'paid', credits: 0, consumedOrders: [PLAY_ORDER],
      orderDetails: [{ orderId: PLAY_ORDER, provider: 'play', grantTier: 'paid', grantCredits: 0 }],
      aiLifetime: {},
    });
    delete semSteam[`ord:${STEAM_ORDER}`];
    const e = { DIGIAPP_SAVES: fakeKV(semSteam), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const body = await (await confirmar(e, (await pedirToken(e)).confirmToken)).json();
    expect(body.executado.licencasSteamApagadas).toBe(0);
    expect(body.executado.apaga.some(k => k.startsWith('ord:steam:'))).toBe(false);
    expect(e.DIGIAPP_SAVES.store.get(`ord:${PLAY_ORDER}`)).toBe(ID);
  });

  it('a chave é DERIVADA do entitlement — nenhuma varredura `list` por `ord:`', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    await confirmar(e, (await pedirToken(e)).confirmToken);
    expect(e.DIGIAPP_SAVES.ops.filter(([op, p]) => op === 'list' && String(p).startsWith('ord:'))).toEqual([]);
  });

  it('`NOT_INCLUDED` parou de prometer retenção do SteamID', async () => {
    const e = { DIGIAPP_SAVES: fakeKV(seed()), FIREBASE_PROJECT_ID: 'soulmon-test' };
    const { naoIncluido } = await pedirToken(e);
    const steam = naoIncluido.find(n => n.what.includes('steam:own'));
    expect(steam, 'a linha continua existindo — o que mudou é o que ela diz').toBeTruthy();
    expect(steam.what).toContain('APAGADO');
    expect(steam['pt-BR']).not.toContain('5 anos');
    expect(steam.en).not.toContain('5 years');
  });
});
