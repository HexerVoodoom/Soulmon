// Fiação do corvo após o login (30/09/2026): o efeito de entitlement refaz a consulta e a adoção
// não é "uma vez por sessão" (um save remoto sem corvo não pode ganhar da marca do admin).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { adoptCorvo } from './corvoAdocao';
import { isCorvo } from './corvoPet';

const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');

describe('corvo após login — fiação', () => {
  it('a consulta do entitlement escuta auth, visibilidade e usa o sync com retry', () => {
    expect(app).toContain('createEntitlementSync');
    expect(app).toContain('subscribeAuthState(() => sync.run(\'auth\'))');
    expect(app).toContain("addEventListener('visibilitychange'");
    expect(app).toContain("sync.run('mount')");
  });
  it('a auto-adoção depende de !isCorvo (re-adota se um save remoto sem corvo entrar)', () => {
    expect(app).not.toContain('corvoAdoptedRef');
    expect(app).toMatch(/if \(!isAdmin \|\| stateIsCorvo \|\| corvoAdoptingRef\.current\) return;/);
  });
  it('adoção depois do login: o save remoto sem corvo é readotado e a marca persiste', () => {
    const local = adoptCorvo({ soulmonMeta: { baseName: 'X' } } as never);
    expect(isCorvo(local as never)).toBe(true);
    const remoto = { soulmonMeta: { baseName: 'Outro' } } as never; // cloud save de outro aparelho
    expect(isCorvo(remoto)).toBe(false);
    const re = adoptCorvo(remoto);
    expect(isCorvo(re as never)).toBe(true);
    expect(adoptCorvo(re)).toBe(re); // idempotente
  });
  it('a flag continua só em memória', () => {
    expect(readFileSync(resolve(__dirname, 'entitlementSync.ts'), 'utf8')).not.toMatch(/localStorage|writeLocal/);
  });
});
