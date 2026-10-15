// QA rodada 3 — corpo hostil em TODAS as rotas de escrita: nenhum corpo malformado
// pode terminar em 5xx/exceção (contrato: 4xx) nem poluir o protótipo.
import { describe, it, expect, afterEach, vi } from 'vitest';
import * as save from './save.js';
import * as account from './account.js';
import * as billing from './billing.js';
import * as chat from './chat.js';
import * as suggest from './suggest-tasks.js';
import * as sprite from './generate-sprite.js';
import * as ent from './entitlements.js';
import * as community from './community.js';
import * as guild from './guild.js';
import * as metrics from './metrics.js';
import * as crash from './crash.js';
import * as subscribe from './subscribe.js';
import * as fcm from './fcm-subscribe.js';
import * as rtdn from './rtdn.js';
import * as spriteAdmin from './sprite-admin.js';

const ID = 'abcdefgh12345678';
function kvFake() {
  const m = new Map();
  return {
    get: async k => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { m.set(k, String(v)); },
    delete: async k => { m.delete(k); },
    list: async ({ prefix = '' } = {}) => ({ keys: [...m.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
    getWithMetadata: async k => ({ value: m.has(k) ? m.get(k) : null, metadata: null }),
  };
}
const mkEnv = (extra = {}) => ({ SOULMON_SAVES: kvFake(), PUSH_SUBSCRIPTIONS: kvFake(), GROQ_API_KEY: 'k', METRICS_ADMIN_KEY: 'mk', ENTITLEMENTS_ADMIN_KEY: 'ek', ...extra });

const HOSTIS = {
  'null': 'null', 'array': '[]', 'string': '"x"', 'numero': '123', 'json quebrado': '{', 'vazio': '',
  'proto': '{"__proto__":{"polluted":"yes"},"id":"abcdefgh12345678"}',
  'id array': '{"id":["abcdefgh12345678"],"saveId":["abcdefgh12345678"]}',
  'id objeto': '{"id":{"a":1},"state":{"a":1},"message":{"a":1}}',
};

const ROTAS = [
  ['save', save.onRequest, `/api/save?id=${ID}`],
  ['account delete-request', account.onRequest, `/api/account?id=${ID}&action=delete-request`],
  ['billing', billing.onRequestPost, '/api/billing?action=verify'],
  ['chat', chat.onRequestPost, '/api/chat'],
  ['suggest-tasks', suggest.onRequestPost, '/api/suggest-tasks'],
  ['generate-sprite', sprite.onRequestPost, '/api/generate-sprite'],
  ['entitlements spend', ent.onRequestPost, '/api/entitlements?action=spend'],
  ['entitlements rebirth', ent.onRequestPost, '/api/entitlements?action=rebirth-reset'],
  ['entitlements grant', ent.onRequestPost, '/api/entitlements?action=grant'],
  ['community profile', community.onRequest, '/api/community?action=profile'],
  ['community friends', community.onRequest, '/api/community?action=friends'],
  ['community gift', community.onRequest, '/api/community?action=gift'],
  ['community match', community.onRequest, '/api/community?action=match'],
  ['community duelStart', community.onRequest, '/api/community?action=duelStart'],
  ['community coopCreate (alias)', community.onRequest, '/api/community?action=coopCreate'],
  ['community guildCreate', community.onRequest, '/api/community?action=guildCreate'],
  ['guild guildCreate', guild.onRequest, '/api/guild?action=guildCreate'],
  ['guild guildJoin', guild.onRequest, '/api/guild?action=guildJoin'],
  ['guild guildCheckin', guild.onRequest, '/api/guild?action=guildCheckin'],
  ['guild guildRename', guild.onRequest, '/api/guild?action=guildRename'],
  ['metrics', metrics.onRequest, '/api/metrics'],
  ['crash', crash.onRequest, '/api/crash'],
  ['subscribe', subscribe.onRequestPost, '/api/subscribe'],
  ['subscribe DELETE', subscribe.onRequestDelete, '/api/subscribe'],
  ['fcm-subscribe', fcm.onRequestPost, '/api/fcm-subscribe'],
  ['fcm-subscribe DELETE', fcm.onRequestDelete, '/api/fcm-subscribe'],
  ['rtdn', rtdn.onRequestPost, '/api/rtdn'],
  ['sprite-admin', spriteAdmin.onRequestPost, '/api/sprite-admin?action=release-form'],
];

afterEach(() => vi.unstubAllGlobals());

describe('QA3 corpo hostil: nenhuma rota de escrita devolve 5xx/exceção', () => {
  for (const [nome, handler, path] of ROTAS) {
    for (const [rotulo, corpo] of Object.entries(HOSTIS)) {
      for (const modo of ['aberto', 'estrito']) {
        it(`${nome} | ${rotulo} | ${modo}`, async () => {
          vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
          const env = mkEnv(modo === 'estrito' ? { FIREBASE_PROJECT_ID: 'soulmon-app' } : {});
          const method = nome.endsWith('DELETE') ? 'DELETE' : 'POST';
          const headers = { 'Content-Type': 'application/json', 'X-Metrics-Key': 'mk', Authorization: 'Bearer ek' };
          const request = new Request('https://soulmon.test' + path, { method, headers, body: corpo === '' ? undefined : corpo });
          let res;
          try { res = await handler({ request, env }); }
          catch (e) { throw new Error(`EXCECAO NAO TRATADA: ${e?.message}`); }
          expect(res.status, `${nome}/${rotulo}/${modo}`).not.toBe(500);
          expect([502, 504]).not.toContain(res.status);
          expect({}.polluted).toBeUndefined();
        });
      }
    }
  }
});
