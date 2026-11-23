// Fiação do corvo (30/09/2026; revista no incidente de 18/11/2026): a auto-adoção NÃO é por admin.
// Só a conta dev do dono (saveId = hash do e-mail) recebe o corvo sozinha, e só sobre save vazio/demo:
// um Soulmon real nunca vira corvo — nem de admin, nem da própria conta dev.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { adoptCorvo } from './corvoAdocao';
import { isCorvo, isCorvoOwnerSaveId, hasRealSoulmon, shouldAutoAdoptCorvo, CORVO_OWNER_SAVE_IDS } from './corvoPet';

const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
const corvoPetSrc = readFileSync(resolve(__dirname, 'corvoPet.ts'), 'utf8');
const saveIdOf = (email: string) => createHash('sha256').update(`soulmon:${email.trim().toLowerCase()}`).digest('hex').slice(0, 32);

const DONO_DEV = saveIdOf('mateus.sprnd@gmail.com');
const OUTRO_ADMIN = '52b9c693470ddc94aa64c80a498dd01b'; // conta de jogo do dono (admin só p/ sumir do ranking)
const real = { soulmonStages: [{ stage: 'rookie', name: 'Shadow' }], soulmonMeta: { baseName: 'Shadow' } };
const vazio = { soulmonMeta: {} };
const demo = { demoCharacterId: 'luma', soulmonStages: [{ stage: 'rookie', name: 'Luma' }] };

describe('corvo — só para a conta dev do dono', () => {
  it('a conta dev é reconhecida pelo hash do e-mail (sem e-mail no bundle)', () => {
    expect(isCorvoOwnerSaveId(DONO_DEV)).toBe(true);
    expect(CORVO_OWNER_SAVE_IDS.size).toBe(1);
    expect(corvoPetSrc).not.toMatch(/@gmail|mateus/i);
  });
  it('admin com Soulmon real NÃO vira corvo', () => {
    expect(isCorvoOwnerSaveId(OUTRO_ADMIN)).toBe(false);
    expect(shouldAutoAdoptCorvo(real as never, OUTRO_ADMIN)).toBe(false);
  });
  it('estado vazio de admin que não é a conta dev NÃO adota', () => {
    expect(shouldAutoAdoptCorvo(vazio as never, OUTRO_ADMIN)).toBe(false);
    expect(shouldAutoAdoptCorvo(demo as never, OUTRO_ADMIN)).toBe(false);
  });
  it('conta dev com save vazio ou demo adota o corvo', () => {
    expect(shouldAutoAdoptCorvo(vazio as never, DONO_DEV)).toBe(true);
    expect(shouldAutoAdoptCorvo(demo as never, DONO_DEV)).toBe(true);
    const c = adoptCorvo(vazio as never);
    expect(isCorvo(c as never)).toBe(true);
    expect(shouldAutoAdoptCorvo(c as never, DONO_DEV)).toBe(false); // já é corvo: idempotente
    expect(adoptCorvo(c)).toBe(c);
  });
  it('nem a conta dev troca um Soulmon real sozinha', () => {
    expect(hasRealSoulmon(real as never)).toBe(true);
    expect(shouldAutoAdoptCorvo(real as never, DONO_DEV)).toBe(false);
  });
  it('a auto-adoção no App não depende de isAdmin e reconfere no updater', () => {
    expect(app).not.toMatch(/if \(!isAdmin \|\| stateIsCorvo/);
    expect(app).toContain('shouldAutoAdoptCorvo(gameState, saveId)');
    expect(app).toMatch(/setGameState\(prev => \(shouldAutoAdoptCorvo\(prev, alvo\) \? m\.adoptCorvo\(prev\) : prev\)\)/);
  });
  it('a consulta do entitlement escuta auth, visibilidade e usa o sync com retry', () => {
    expect(app).toContain('createEntitlementSync');
    expect(app).toContain('subscribeAuthState(() => sync.run(\'auth\'))');
    expect(app).toContain("addEventListener('visibilitychange'");
    expect(app).toContain("sync.run('mount')");
  });
  it('a flag continua só em memória', () => {
    expect(readFileSync(resolve(__dirname, 'entitlementSync.ts'), 'utf8')).not.toMatch(/localStorage|writeLocal/);
  });
});
