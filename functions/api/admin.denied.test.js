// Diagnóstico do dono: `admin_denied` com motivo curto, SEM PII (nem e-mail, nem saveId).
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { verifiedAdmin } from './_admin.js';
import { emailToSaveId } from './_auth.js';
import { ADMIN, OTHER, installJwks, token, envWith, reqWith } from './admin.testkit.js';

let ADMIN_ID, OTHER_ID;
beforeAll(async () => { await installJwks(); ADMIN_ID = await emailToSaveId(ADMIN); OTHER_ID = await emailToSaveId(OTHER); });
afterAll(() => vi.unstubAllGlobals());

async function logsOf(fn) {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  try { await fn(); return spy.mock.calls.map(c => String(c[0])); } finally { spy.mockRestore(); }
}

describe('admin_denied', () => {
  it('token verificado fora da lista → not-listed, sem PII', async () => {
    const logs = await logsOf(async () => verifiedAdmin(envWith(), reqWith(await token(OTHER)), OTHER_ID));
    expect(logs).toEqual([JSON.stringify({ event: 'admin_denied', reason: 'not-listed' })]);
    for (const l of logs) { expect(l).not.toContain(OTHER); expect(l).not.toContain(OTHER_ID); }
  });
  it('lista vazia/ausente → no-allowlist (a variável ADMIN_EMAILS não existe)', async () => {
    const logs = await logsOf(async () => verifiedAdmin(envWith({ ADMIN_EMAILS: '' }), reqWith(await token(ADMIN)), ADMIN_ID));
    expect(logs).toEqual([JSON.stringify({ event: 'admin_denied', reason: 'no-allowlist' })]);
    expect(logs.join('')).not.toContain(ADMIN);
  });
  it('admin com saveId de outra conta (UUID local pré-login) → saveid-mismatch', async () => {
    const logs = await logsOf(async () => verifiedAdmin(envWith(), reqWith(await token(ADMIN)), 'uuid-local-qualquer'));
    expect(logs).toEqual([JSON.stringify({ event: 'admin_denied', reason: 'saveid-mismatch' })]);
  });
  it('sem token / token inválido: silêncio (tráfego comum) e admin legítimo não loga negação', async () => {
    expect(await logsOf(async () => verifiedAdmin(envWith(), reqWith(''), OTHER_ID))).toEqual([]);
    expect(await logsOf(async () => verifiedAdmin(envWith(), reqWith('lixo'), OTHER_ID))).toEqual([]);
    expect(await logsOf(async () => expect((await verifiedAdmin(envWith(), reqWith(await token(ADMIN)), ADMIN_ID)).admin).toBe(true))).toEqual([]);
  });
});
