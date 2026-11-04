import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { parseStage, isEvolution, pushEvent, purgeFeedOf, liveFeed, publicEvent, buildEvent, feedText, decideEvo, EVO_FEED_KEY, EVO_FEED_MAX, EVO_FEED_TTL_MS, EVO_FEED_COOLDOWN_MS } from './_evoFeed.js';

// Faixa de evoluções (04/11/2026): o feed global entra pelo `profile` (subiu de estágio + aparece na lista pública) e sai por `evoFeed`.
// Privacidade: só quem JÁ está na lista pública (PvP aberto, sem `publicHidden`); esconder-se tira do feed; nada de saveId na resposta.

const ALICE = 'a'.repeat(32);
const BRUNO = 'b'.repeat(32);
const PID_A = 'aa'.repeat(12);
const PID_B = 'bb'.repeat(12);

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = (id, pid, name, extra = {}) => JSON.stringify({
  id, pid, name, petName: `Sombra${name}`, stage: 'rookie', pvpEnabled: true, attrs: { power: 1, harmony: 1, benevolence: 1 }, friends: [], createdAt: Date.now(), ...extra,
});
const mundo = () => ({
  DIGIAPP_SAVES: fakeKV({
    [`profile:${ALICE}`]: perfil(ALICE, PID_A, 'Mateus'),
    [`profile:${BRUNO}`]: perfil(BRUNO, PID_B, 'Bruno'),
    [`pid:${PID_A}`]: ALICE, [`pid:${PID_B}`]: BRUNO,
    [ALICE]: JSON.stringify({ evolutionStage: 'rookie', totalXP: 99999 }),
    [BRUNO]: JSON.stringify({ evolutionStage: 'rookie', totalXP: 99999 }),
  }),
});
// IP próprio por chamada: `evoFeed` é ação pesada (20/min/IP) e este arquivo lê bastante.
let ipN = 0;
const ip = () => ({ 'CF-Connecting-IP': `10.${(ipN >> 16) & 255}.${(ipN >> 8) & 255}.${ipN++ & 255}` });
/** POST do perfil sem tocar no save: é o que um cliente forjado consegue. */
const postCru = (env, id, body) => onRequest({
  request: new Request(`https://x.dev/api/community?action=profile&id=${id}`, { method: 'POST', headers: { 'content-type': 'application/json', ...ip() }, body: JSON.stringify({ id, ...body }) }),
  env,
});
/** O caminho normal: o cloud save sobe junto do perfil, então o save confirma o estágio pedido. */
const post = (env, id, body) => {
  if (parseStage(body.stage)) env.DIGIAPP_SAVES.store.set(id, JSON.stringify({ ...JSON.parse(env.DIGIAPP_SAVES.store.get(id)), evolutionStage: body.stage }));
  return postCru(env, id, body);
};
const feed = async (env) => (await (await onRequest({ request: new Request('https://x.dev/api/community?action=evoFeed', { headers: ip() }), env })).json()).events;
const blob = (env) => JSON.parse(env.DIGIAPP_SAVES.store.get(EVO_FEED_KEY) ?? '[]');
const perfilDe = (env, id) => JSON.parse(env.DIGIAPP_SAVES.store.get(`profile:${id}`));

describe('_evoFeed (puro)', () => {
  it('parseStage só aceita estágio e alinhamento de lista fechada', () => {
    expect(parseStage('champion-harmony')).toEqual({ tier: 'champion', branch: 'harmony', rank: 2 });
    expect(parseStage('ultra')).toEqual({ tier: 'ultra', branch: null, rank: 5 });
    expect(parseStage('champion-<script>')).toBeNull();
    expect(parseStage('dragon-power')).toBeNull();
    expect(parseStage(42)).toBeNull();
  });
  it('isEvolution: sobe de tier até o Champion ou mais; sem estágio anterior não conta', () => {
    expect(isEvolution('rookie', 'champion-power')).toBe(true);
    expect(isEvolution('champion-power', 'ultimate-power')).toBe(true);
    expect(isEvolution('champion-power', 'champion-harmony')).toBe(false);
    expect(isEvolution('ultimate-power', 'champion-power')).toBe(false);
    expect(isEvolution(undefined, 'champion-power')).toBe(false);
    expect(isEvolution('bb', 'rookie')).toBe(false);
  });
  it('pushEvent: mais novo primeiro, 1 por conta, poda por idade e por tamanho', () => {
    const now = 1_000_000_000_000;
    const ev = (by, tier = 'champion', at = now) => buildEvent({ by, name: by, petName: 'P', stage: `${tier}-power`, now: at });
    let f = pushEvent([], ev('a'), now);
    f = pushEvent(f, ev('a'), now);
    expect(f).toHaveLength(1);
    f = pushEvent(f, ev('a', 'ultimate'), now);
    expect(f.map(e => e.tier)).toEqual(['ultimate']);
    for (let i = 0; i < 40; i++) f = pushEvent(f, ev(`p${i}`), now);
    expect(f).toHaveLength(EVO_FEED_MAX);
    expect(pushEvent([ev('velho', 'champion', now - EVO_FEED_TTL_MS - 1)], ev('novo'), now).map(e => e.by)).toEqual(['novo']);
  });
  it('purgeFeedOf e publicEvent: some quem se escondeu; a vista não leva o `by`', () => {
    const now = Date.now();
    const f = [buildEvent({ by: 'x', name: 'X', petName: 'P', stage: 'champion-power', now }), buildEvent({ by: 'y', name: 'Y', petName: 'Q', stage: 'mega-harmony', now })];
    expect(purgeFeedOf(f, 'x').map(e => e.by)).toEqual(['y']);
    expect(JSON.stringify(publicEvent(f[0], { name: 'X', petName: 'P' }))).not.toMatch(/"by"/);
  });
  it('liveFeed: 1 por conta mesmo com blob repetido (escrita concorrente) e sem evento vencido', () => {
    const now = 1_000_000_000_000;
    const f = [{ by: 'x', at: now }, { by: 'x', at: now - 1 }, { by: 'y', at: now - EVO_FEED_TTL_MS }];
    expect(liveFeed(f, now)).toEqual([{ by: 'x', at: now }]);
  });
  it('decideEvo: exige o save, acima do pico e fora do cooldown; o pico nunca desce', () => {
    const now = 1_000_000_000_000;
    const base = { peak: 1, stage: 'champion-power', savedStage: 'champion-power', lastAt: 0, now };
    expect(decideEvo(base)).toEqual({ peak: 2, announce: true });
    expect(decideEvo({ ...base, savedStage: 'rookie' })).toEqual({ peak: 1, announce: false });
    expect(decideEvo({ ...base, savedStage: 'champion-harmony' }).announce).toBe(false);
    expect(decideEvo({ ...base, savedStage: undefined })).toEqual({ peak: 1, announce: false });
    expect(decideEvo({ ...base, peak: 2 }).announce).toBe(false);
    expect(decideEvo({ ...base, peak: 4 })).toEqual({ peak: 4, announce: false });
    expect(decideEvo({ ...base, peak: null })).toEqual({ peak: 2, announce: false });
    expect(decideEvo({ ...base, lastAt: now - EVO_FEED_COOLDOWN_MS + 1 })).toEqual({ peak: 2, announce: false });
    expect(decideEvo({ ...base, lastAt: now - EVO_FEED_COOLDOWN_MS }).announce).toBe(true);
  });
  it('feedText: palavrão e contato não publicam; bidi e controle saem, inclusive os que escondem palavrão', () => {
    for (const n of ['Caralho', 'hitler', 'Fuck You', 'Viado', 'Filho da puta', 'm3rda', 'zap 11988887777', '@joao', 'joao.com', 'Car\u200Balho', 'Caralho\u202Egnp', '\u202E']) {
      expect(feedText(n), n).toBeNull();
    }
    expect(feedText('So\u202Emb\u2066ra\u0007')).toBe('Sombra');
    expect(feedText(42)).toBeNull();
    expect(buildEvent({ by: 'x', name: 'Filho da puta', petName: 'P', stage: 'champion-power', now: 1 })).toBeNull();
    expect(buildEvent({ by: 'x', name: 'Ana', petName: 'Caralho', stage: 'champion-power', now: 1 })).toBeNull();
    expect(buildEvent({ by: 'x', name: 'Ana', petName: 'Pe\u202Et', stage: 'champion-power', now: 1 }).pet).toBe('Pet');
  });
});

describe('community › evoFeed', () => {
  it('quem sobe de estágio entra no feed com apelido, criatura, forma e alinhamento; a resposta não traz saveId nem pid', async () => {
    const env = mundo();
    expect(await feed(env)).toEqual([]);
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-harmony', pvpEnabled: true, publicHidden: false });
    const ev = await feed(env);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ name: 'Mateus', pet: 'Sombra', tier: 'champion', branch: 'harmony' });
    const txt = JSON.stringify(ev);
    expect(txt).not.toContain(ALICE);
    expect(txt).not.toContain(PID_A);
  });
  it('reenviar o mesmo estágio não repete o aviso', async () => {
    const env = mundo();
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-harmony', pvpEnabled: true });
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-harmony', pvpEnabled: true });
    expect(await feed(env)).toHaveLength(1);
  });
  it('quem está escondido da lista pública NÃO entra no feed', async () => {
    const env = mundo();
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power', pvpEnabled: true, publicHidden: true });
    expect(await feed(env)).toEqual([]);
  });
  it('quem se esconde DEPOIS sai do feed na hora', async () => {
    const env = mundo();
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power', pvpEnabled: true });
    await post(env, BRUNO, { name: 'Bruno', petName: 'Brasa', stage: 'champion-power', pvpEnabled: true });
    expect(await feed(env)).toHaveLength(2);
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power', pvpEnabled: true, publicHidden: true });
    const ev = await feed(env);
    expect(ev.map(e => e.name)).toEqual(['Bruno']);
  });
  it('sem PvP aberto (abaixo do gate de Vínculo) o perfil não gera aviso', async () => {
    const env = mundo();
    env.DIGIAPP_SAVES.store.set(ALICE, JSON.stringify({ evolutionStage: 'rookie', totalXP: 0 }));
    env.DIGIAPP_SAVES.store.set(`profile:${ALICE}`, perfil(ALICE, PID_A, 'Mateus', { pvpEnabled: false }));
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power', pvpEnabled: true });
    expect(await feed(env)).toEqual([]);
  });
  it('estágio malformado do cliente não vira aviso', async () => {
    const env = mundo();
    await post(env, ALICE, { name: 'Mateus', petName: 'Sombra', stage: 'champion-power<b>', pvpEnabled: true });
    expect(await feed(env)).toEqual([]);
  });

  // A PoC da auditoria (04/11/2026), como regressão.
  describe('PoC da auditoria', () => {
    const b = { name: 'Mateus', petName: 'Sombra', pvpEnabled: true };
    it('estágio forjado: o save diz rookie, o corpo diz ultra, nada entra', async () => {
      const env = mundo();
      expect((await postCru(env, ALICE, { ...b, stage: 'ultra' })).status).toBe(200);
      expect(await feed(env)).toEqual([]);
    });
    it('flip-flop de 40 voltas: nenhuma escrita no feed', async () => {
      const env = mundo();
      let escritas = 0;
      const put = env.DIGIAPP_SAVES.put;
      env.DIGIAPP_SAVES.put = async (k, v, o) => { if (k === EVO_FEED_KEY) escritas++; return put(k, v, o); };
      const combos = ['champion', 'ultimate', 'mega', 'ultra'].flatMap(t => ['-power', '-harmony', '-benevolence', ''].map(br => t + br));
      for (let i = 0; i < 40; i++) {
        await postCru(env, ALICE, { ...b, stage: 'rookie' });
        await postCru(env, ALICE, { ...b, stage: combos[i % 16] });
      }
      expect(escritas).toBe(0);
      expect(await feed(env)).toEqual([]);
    });
    it('flip-flop com o save confirmando: 1 aviso só; alternar não reanuncia nem baixa o pico', async () => {
      const env = mundo();
      await post(env, ALICE, { ...b, stage: 'champion-power' });
      for (let i = 0; i < 10; i++) {
        await post(env, ALICE, { ...b, stage: 'rookie' });
        await post(env, ALICE, { ...b, stage: i % 2 ? 'champion-harmony' : 'champion-power' });
      }
      expect(blob(env)).toHaveLength(1);
      expect(perfilDe(env, ALICE).evoPeakRank).toBe(2);
    });
    it('cooldown: subir dentro da janela não anuncia nem vira aviso atrasado; depois dela a forma seguinte anuncia e substitui', async () => {
      const env = mundo();
      await post(env, ALICE, { ...b, stage: 'champion-power' });
      await post(env, ALICE, { ...b, stage: 'ultimate-power' });
      expect((await feed(env)).map(e => e.tier)).toEqual(['champion']);
      expect(perfilDe(env, ALICE).evoPeakRank).toBe(3);
      const p = perfilDe(env, ALICE);
      env.DIGIAPP_SAVES.store.set(`profile:${ALICE}`, JSON.stringify({ ...p, evoFeedAt: Date.now() - EVO_FEED_COOLDOWN_MS - 1 }));
      await post(env, ALICE, { ...b, stage: 'ultimate-power' });
      expect((await feed(env)).map(e => e.tier)).toEqual(['champion']);
      await post(env, ALICE, { ...b, stage: 'mega-power' });
      expect((await feed(env)).map(e => e.tier)).toEqual(['mega']);
    });
    it('perfil antes do save: o aviso sai na gravação seguinte, quando o save confirma', async () => {
      const env = mundo();
      await postCru(env, ALICE, { ...b, stage: 'champion-power' });
      expect(await feed(env)).toEqual([]);
      await post(env, ALICE, { ...b, stage: 'champion-power' });
      expect(await feed(env)).toHaveLength(1);
    });
    it('quem evoluiu escondido não é anunciado ao reaparecer', async () => {
      const env = mundo();
      await post(env, ALICE, { ...b, stage: 'champion-power', publicHidden: true });
      await post(env, ALICE, { ...b, stage: 'champion-power', publicHidden: false });
      expect(await feed(env)).toEqual([]);
    });
    it('palavrão com bidi no apelido e na criatura não entra', async () => {
      const env = mundo();
      await post(env, ALICE, { name: 'Filho da puta', petName: 'Caralho\u202Egnp', pvpEnabled: true, stage: 'champion-power' });
      expect(await feed(env)).toEqual([]);
      expect(blob(env)).toEqual([]);
    });
    it('o apelido nas outras listas não muda: a régua de palavrão é só do feed', async () => {
      const env = mundo();
      await post(env, ALICE, { name: 'Filho da puta', petName: 'Sombra', pvpEnabled: true, stage: 'champion-power' });
      expect(perfilDe(env, ALICE).name).toBe('Filho da puta');
    });
    it('desligar o PvP tira do feed e do blob', async () => {
      const env = mundo();
      await post(env, ALICE, { ...b, stage: 'champion-power' });
      await post(env, ALICE, { ...b, stage: 'champion-power', pvpEnabled: false });
      expect(await feed(env)).toEqual([]);
      expect(blob(env)).toEqual([]);
    });
    it('purge que falha no KV: a leitura esconde mesmo assim', async () => {
      const env = mundo();
      await post(env, ALICE, { ...b, stage: 'champion-power' });
      const put = env.DIGIAPP_SAVES.put;
      env.DIGIAPP_SAVES.put = async (k, v, o) => { if (k === EVO_FEED_KEY) throw new Error('429'); return put(k, v, o); };
      expect((await post(env, ALICE, { ...b, stage: 'champion-power', publicHidden: true })).status).toBe(200);
      env.DIGIAPP_SAVES.put = put;
      expect(blob(env)).toHaveLength(1);
      expect(await feed(env)).toEqual([]);
    });
  });

  describe('saída', () => {
    const b = { name: 'Mateus', petName: 'Sombra', pvpEnabled: true };
    it('a leitura usa o nome e a criatura ATUAIS; perfil apagado some; nome atual com palavrão some', async () => {
      const env = mundo();
      await post(env, ALICE, { ...b, stage: 'champion-power' });
      await post(env, BRUNO, { name: 'Bruno', petName: 'Brasa', pvpEnabled: true, stage: 'champion-power' });
      await post(env, ALICE, { name: 'Novo', petName: 'Outra', pvpEnabled: true, stage: 'champion-power' });
      expect((await feed(env)).find(e => e.name === 'Novo')).toMatchObject({ pet: 'Outra' });
      env.DIGIAPP_SAVES.store.delete(`profile:${BRUNO}`);
      expect((await feed(env)).map(e => e.name)).toEqual(['Novo']);
      await post(env, ALICE, { name: 'Caralho', petName: 'Outra', pvpEnabled: true, stage: 'champion-power' });
      expect(await feed(env)).toEqual([]);
    });
    it('o blob vai ao KV com expirationTtl', async () => {
      const env = mundo();
      const opts = [];
      const put = env.DIGIAPP_SAVES.put;
      env.DIGIAPP_SAVES.put = async (k, v, o) => { if (k === EVO_FEED_KEY) opts.push(o); return put(k, v, o); };
      await post(env, ALICE, { ...b, stage: 'champion-power' });
      expect(opts).toHaveLength(1);
      expect(opts[0].expirationTtl).toBeGreaterThanOrEqual(EVO_FEED_TTL_MS / 1000);
    });
    it('evoFeed é ação pesada: o 21º acesso do mesmo IP no minuto leva 429', async () => {
      const env = mundo();
      const headers = { 'CF-Connecting-IP': '203.0.113.77' };
      let ultimo;
      for (let i = 0; i < 21; i++) ultimo = await onRequest({ request: new Request('https://x.dev/api/community?action=evoFeed', { headers }), env });
      expect(ultimo.status).toBe(429);
    });
  });

  describe('interruptor EVO_FEED_DISABLED', () => {
    const b = { name: 'Mateus', petName: 'Sombra', pvpEnabled: true };
    it('ligado: nada novo entra e a leitura responde vazio, sem apagar o blob', async () => {
      const env = mundo();
      await post(env, BRUNO, { name: 'Bruno', petName: 'Brasa', pvpEnabled: true, stage: 'champion-power' });
      env.EVO_FEED_DISABLED = '1';
      await post(env, ALICE, { ...b, stage: 'champion-power' });
      expect(await feed(env)).toEqual([]);
      expect(blob(env)).toHaveLength(1);
      delete env.EVO_FEED_DISABLED;
      expect((await feed(env)).map(e => e.name)).toEqual(['Bruno']);
    });
    it('ligado: esconder-se ainda limpa o blob', async () => {
      const env = mundo();
      await post(env, ALICE, { ...b, stage: 'champion-power' });
      env.EVO_FEED_DISABLED = '1';
      await post(env, ALICE, { ...b, stage: 'champion-power', publicHidden: true });
      expect(blob(env)).toEqual([]);
    });
  });
});
