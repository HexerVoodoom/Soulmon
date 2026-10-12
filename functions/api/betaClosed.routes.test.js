/**
 * Gate adversarial S1 (release/beta-1): com `BETA_CLOSED`, TODA rota que age em
 * nome de um saveId recusa quem não prova estar em `BETA_EMAILS` — inclusive as
 * sociais e de push, que antes só tinham `authorizeSaveAccess`. Sem login (sem
 * e-mail) é fail-closed. `account.js` (exportar/excluir) fica FORA: direito do titular.
 * Cada caso também prova que NADA foi gravado.
 */
import { describe, it, expect } from 'vitest';
import { onRequest as community } from './community.js';
import { onRequest as guild } from './guild.js';
import { onRequestGet as entGet } from './entitlements.js';
import { onRequestPost as subscribe } from './subscribe.js';
import { onRequestPost as fcm } from './fcm-subscribe.js';
import { onRequest as save } from './save.js';
import { authorizeSaveAccess } from './_auth.js';

const ID = 'a'.repeat(32);
function kv() {
  const store = new Map();
  return { store, get: async k => store.get(k) ?? null, getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }), put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); }, list: async () => ({ keys: [] }) };
}
const fechado = () => ({ DIGIAPP_SAVES: kv(), PUSH_SUBSCRIPTIONS: kv(), BETA_CLOSED: 'true', BETA_EMAILS: 'convidada@gmail.com' });
const json = (url, body) => new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '198.51.100.9' }, body: JSON.stringify(body) });
const nadaGravado = env => { expect(env.DIGIAPP_SAVES.store.size).toBe(0); expect(env.PUSH_SUBSCRIPTIONS.store.size).toBe(0); };

async function esperaFechado(res, env) {
  expect(res.status).toBe(403);
  const b = await res.json();
  expect(b.error ?? b.reason).toBe('beta-closed');
  nadaGravado(env);
}

describe('S1: BETA_CLOSED cobre todas as rotas por saveId', () => {
  it('o portão central (`authorizeSaveAccess`) recusa sem e-mail provado', async () => {
    const r = await authorizeSaveAccess(new Request('https://x'), fechado(), ID);
    expect(r).toMatchObject({ ok: false, status: 403, reason: 'beta-closed' });
    // flag desligada: segue aberto como antes
    expect((await authorizeSaveAccess(new Request('https://x'), { DIGIAPP_SAVES: kv(), BETA_EMAILS: 'x@y.z' }, ID)).ok).toBe(true);
  });

  it('community: perfil público (diretório) → 403, nenhum profile:/pid: gravado', async () => {
    const env = fechado();
    await esperaFechado(await community({ request: json(`https://x.dev/api/community?action=profile&id=${ID}`, { id: ID, name: 'Intrusa', stage: 'rookie', pvpEnabled: false }), env }), env);
  });

  it('guild: criar guilda → 403, nada gravado', async () => {
    const env = fechado();
    await esperaFechado(await guild({ request: json('https://x.dev/api/guild?action=guildCreate', { id: ID, name: 'Casa' }), env }), env);
  });

  it('entitlements: leitura do saldo → 403', async () => {
    const env = fechado();
    await esperaFechado(await entGet({ request: new Request(`https://x.dev/api/entitlements?id=${ID}`), env }), env);
  });

  it('subscribe (Web Push): com e SEM saveId → 403, nenhuma inscrição gravada', async () => {
    const body = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc123', keys: { p256dh: 'BEl'.padEnd(87, 'A'), auth: 'c2VncmVkbzE2Ynl0ZQ' } };
    let env = fechado();
    await esperaFechado(await subscribe({ request: json('https://x.dev/api/subscribe', { ...body, saveId: ID }), env }), env);
    env = fechado();
    await esperaFechado(await subscribe({ request: json('https://x.dev/api/subscribe', body), env }), env);
  });

  it('fcm-subscribe (Android): com e SEM saveId → 403, nada gravado', async () => {
    const token = `dQw4w9WgXcQ:APA91b${'H'.padEnd(140, 'x')}`;
    let env = fechado();
    await esperaFechado(await fcm({ request: json('https://x.dev/api/fcm-subscribe', { token, saveId: ID }), env }), env);
    env = fechado();
    await esperaFechado(await fcm({ request: json('https://x.dev/api/fcm-subscribe', { token }), env }), env);
  });

  it('save: GET e POST → 403 beta-closed com mensagem; nada gravado', async () => {
    const env = fechado();
    const r = await save({ request: json(`https://x/api/save?id=${ID}`, { state: { healthPoints: 2 } }), env });
    expect(r.status).toBe(403);
    expect((await r.json()).message.pt).toMatch(/teste fechado/);
    nadaGravado(env);
  });

  it('account.js (exportar/excluir) NÃO passa pelo portão do beta — direito do titular', async () => {
    const { readFileSync } = await import('node:fs');
    const fonte = readFileSync(new URL('./account.js', import.meta.url), 'utf8');
    expect(fonte).not.toMatch(/authorizeSaveAccess\(|betaGate\(/);
    const auth = readFileSync(new URL('./_auth.js', import.meta.url), 'utf8');
    const req = auth.slice(auth.indexOf('export async function requireVerifiedOwner'));
    expect(req).not.toMatch(/betaGate\(/);
  });
});
