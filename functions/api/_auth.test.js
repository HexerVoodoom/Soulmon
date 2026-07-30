import { describe, it, expect } from 'vitest';
import { emailToSaveId, verifyIdToken, authorizeSaveAccess } from './_auth.js';

// O saveId derivado no SERVIDOR precisa bater byte a byte com o do cliente
// (src/utils/cloudSave.ts). Se divergir, todo usuário autenticado toma 403.
// Esta cópia é intencionalmente independente da implementação testada.
async function clientEmailToSaveId(email) {
  const norm = email.trim().toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon:${norm}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

describe('auth — derivação do saveId', () => {
  it('bate exatamente com a derivação do cliente', async () => {
    for (const email of ['a@b.com', 'mateus.sprnd@gmail.com', 'x+tag@dominio.com.br']) {
      expect(await emailToSaveId(email)).toBe(await clientEmailToSaveId(email));
    }
  });

  it('tem 32 caracteres (formato aceito pelo VALID_ID do servidor)', async () => {
    const id = await emailToSaveId('alguem@exemplo.com');
    expect(id).toHaveLength(32);
    expect(id).toMatch(/^[a-zA-Z0-9_-]{8,64}$/);
  });

  it('normaliza caixa e espaços — mesmo e-mail, mesmo save', async () => {
    const a = await emailToSaveId('  Pessoa@Exemplo.COM  ');
    const b = await emailToSaveId('pessoa@exemplo.com');
    expect(a).toBe(b);
  });

  it('e-mails diferentes dão saves diferentes', async () => {
    expect(await emailToSaveId('a@b.com')).not.toBe(await emailToSaveId('c@d.com'));
  });
});

describe('auth — verificação de token', () => {
  it('rejeita lixo, token vazio e formato inválido', async () => {
    expect(await verifyIdToken(null, 'proj')).toBeNull();
    expect(await verifyIdToken('', 'proj')).toBeNull();
    expect(await verifyIdToken('nao.e.jwt.valido', 'proj')).toBeNull();
    expect(await verifyIdToken('aaa.bbb', 'proj')).toBeNull();
  });

  it('rejeita quando não há projectId configurado', async () => {
    expect(await verifyIdToken('a.b.c', undefined)).toBeNull();
  });

  it('rejeita token com alg "none" (ataque clássico de JWT)', async () => {
    const b64 = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const forged = `${b64({ alg: 'none', kid: 'x' })}.${b64({
      aud: 'proj', iss: 'https://securetoken.google.com/proj',
      exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000),
      email: 'vitima@exemplo.com', email_verified: true,
    })}.`;
    expect(await verifyIdToken(forged, 'proj')).toBeNull();
  });
});

describe('auth — autorização de acesso ao save', () => {
  const req = (headers = {}) => new Request('https://x/api/save', { headers });

  it('sem FIREBASE_PROJECT_ID passa direto (modo migração), mas marca enforced:false', async () => {
    const r = await authorizeSaveAccess(req(), {}, 'qualquercoisa');
    expect(r.ok).toBe(true);
    expect(r.enforced).toBe(false);
  });

  it('com projectId configurado e sem token, recusa', async () => {
    const r = await authorizeSaveAccess(req(), { FIREBASE_PROJECT_ID: 'proj' }, 'abc12345');
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('unauthenticated');
  });

  it('com token inválido, recusa', async () => {
    const r = await authorizeSaveAccess(
      req({ Authorization: 'Bearer lixo.lixo.lixo' }),
      { FIREBASE_PROJECT_ID: 'proj' }, 'abc12345',
    );
    expect(r.ok).toBe(false);
  });
});
