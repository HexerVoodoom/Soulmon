/**
 * Unidade do dono único de fim de sessão (`sessionReset.ts`): o que apaga, o que
 * mantém, a ordem, a pendência de sync e o "não ressuscita".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';

const { signOut, revoke } = vi.hoisted(() => ({
  signOut: vi.fn(async () => {}),
  revoke: vi.fn(async () => ({ webPush: true, fcm: true })),
}));
vi.mock('./auth', () => ({ authHeaders: async () => ({}), signOut }));
vi.mock('./accountData', () => ({ revokePushBeforeDelete: revoke }));

import {
  encerrarSessao, limparEstadoLocalDaConta, chavesDaConta, sessaoEncerrando, __resetSessaoEncerrando,
  marcarMudancaPendente, marcarSincronizado, temSyncPendente, sincronizarAntesDeSair,
  montarBackupLocal, SOBREVIVEM_AO_LOGOUT,
} from './sessionReset';

const mem = new Map<string, string>();
const ID = 'a'.repeat(32);

function instalarStorage(enumeravel = true) {
  const base = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
    removeItem: (k: string) => { mem.delete(k); },
  };
  vi.stubGlobal('localStorage', enumeravel
    ? { ...base, get length() { return mem.size; }, key: (i: number) => [...mem.keys()][i] ?? null }
    : base);
}

beforeEach(() => {
  mem.clear(); signOut.mockClear(); revoke.mockClear(); __resetSessaoEncerrando();
  instalarStorage();
});
afterEach(() => { vi.unstubAllGlobals(); });

function popular() {
  mem.set(STORAGE_KEYS.GAME_STATE, '{"totalXP":900}');
  mem.set(STORAGE_KEYS.SAVE_ID, ID);
  mem.set(STORAGE_KEYS.USER_EMAIL, 'a@x.com');
  mem.set(STORAGE_KEYS.LAST_CLOUD_SYNC, 'ontem');
  mem.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  mem.set(STORAGE_KEYS.USER_NAME, 'Ana');
  mem.set(STORAGE_KEYS.FCM_TOKEN, 'tok');
  mem.set(STORAGE_KEYS.AI_SETTINGS, '{"k":1}');
  mem.set(STORAGE_KEYS.SOULMON_PROFILE, '{"seed":1}');
  mem.set(STORAGE_KEYS.FOCO_SESSIONS, '[]');
  mem.set('soulmon-chat-feedback-day', 'hoje');
  mem.set('soulmon-telemetry-tier', '2');
  mem.set('soulmon_state_legado', 'x'); // prefixo do app, chave desconhecida: também sai
  mem.set(STORAGE_KEYS.LANGUAGE, 'en-US');
  mem.set(STORAGE_KEYS.SOUND_MUTED, 'true');
  mem.set('soulmon-telemetry-enabled', 'false');
  mem.set('soulmon-telemetry-id', 'f'.repeat(32));
  mem.set('chave-de-outra-lib', 'fica');
}

describe('limparEstadoLocalDaConta', () => {
  it('apaga save, identidade, flags e preferências da conta; mantém só a allowlist e chaves alheias', () => {
    popular();
    limparEstadoLocalDaConta();
    for (const k of [STORAGE_KEYS.GAME_STATE, STORAGE_KEYS.SAVE_ID, STORAGE_KEYS.USER_EMAIL, STORAGE_KEYS.LAST_CLOUD_SYNC,
      STORAGE_KEYS.ONBOARDING_COMPLETE, STORAGE_KEYS.USER_NAME, STORAGE_KEYS.FCM_TOKEN, STORAGE_KEYS.AI_SETTINGS,
      STORAGE_KEYS.SOULMON_PROFILE, STORAGE_KEYS.FOCO_SESSIONS, 'soulmon-chat-feedback-day', 'soulmon-telemetry-tier',
      'soulmon_state_legado']) {
      expect(mem.has(k), k).toBe(false);
    }
    expect([...mem.keys()].sort()).toEqual([
      'chave-de-outra-lib', STORAGE_KEYS.LANGUAGE, STORAGE_KEYS.SOUND_MUTED, 'soulmon-telemetry-enabled', 'soulmon-telemetry-id',
    ].sort());
  });

  it('funciona com storage sem enumeração (só conhece as chaves do dicionário)', () => {
    instalarStorage(false);
    popular();
    limparEstadoLocalDaConta();
    expect(mem.has(STORAGE_KEYS.GAME_STATE)).toBe(false);
    expect(mem.has(STORAGE_KEYS.SAVE_ID)).toBe(false);
    expect(mem.get(STORAGE_KEYS.LANGUAGE)).toBe('en-US');
  });

  it('o backup forense nunca é alvo', () => {
    mem.set(RECONCILE_KEYS.CONFLICT_BACKUP, '{"state":{}}');
    mem.set(RECONCILE_KEYS.PREVIOUS_SAVE_ID, ID);
    expect(chavesDaConta()).not.toContain(RECONCILE_KEYS.CONFLICT_BACKUP);
    limparEstadoLocalDaConta();
    expect(mem.has(RECONCILE_KEYS.CONFLICT_BACKUP)).toBe(true);
    expect(mem.has(RECONCILE_KEYS.PREVIOUS_SAVE_ID)).toBe(true);
  });

  it('idempotente: a segunda execução não muda nada', () => {
    popular(); limparEstadoLocalDaConta();
    const antes = [...mem.entries()];
    limparEstadoLocalDaConta();
    expect([...mem.entries()]).toEqual(antes);
  });
});

describe('encerrarSessao', () => {
  it('revoga o push ANTES do signOut, copia o save, limpa e recarrega uma vez', async () => {
    popular();
    const ordem: string[] = [];
    revoke.mockImplementationOnce(async () => { ordem.push('push'); return { webPush: true, fcm: true }; });
    signOut.mockImplementationOnce(async () => { ordem.push('signOut'); });
    const recarregar = vi.fn(() => { ordem.push('reload'); });
    await encerrarSessao({ motivo: 'logout', recarregar });
    expect(ordem).toEqual(['push', 'signOut', 'reload']);
    const copia = JSON.parse(mem.get(STORAGE_KEYS.BACKUP_RING)!).copias.at(-1); // L08-03: anel
    expect(copia.motivo).toBe('logout');
    expect(copia.state).toEqual({ totalXP: 900 });
    expect(copia.saveId).toBe(ID);
    expect(mem.has(STORAGE_KEYS.GAME_STATE)).toBe(false);
  });

  it('push que falha não impede signOut, limpeza nem reload', async () => {
    popular();
    revoke.mockRejectedValueOnce(new Error('rede'));
    const recarregar = vi.fn();
    await encerrarSessao({ motivo: 'logout', recarregar });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(mem.has(STORAGE_KEYS.SAVE_ID)).toBe(false);
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('exclusão de conta: sem cópia, sem revogar push, e `recarregar: null` não recarrega', async () => {
    popular();
    await encerrarSessao({ motivo: 'account-deleted', recarregar: null });
    expect(revoke).not.toHaveBeenCalled();
    expect(mem.has(RECONCILE_KEYS.CONFLICT_BACKUP)).toBe(false);
    expect(mem.has(STORAGE_KEYS.GAME_STATE)).toBe(false);
  });

  it('marca a sessão como encerrando (o provider não regrava o save)', async () => {
    expect(sessaoEncerrando()).toBe(false);
    await encerrarSessao({ motivo: 'logout', recarregar: () => {} });
    expect(sessaoEncerrando()).toBe(true);
  });
});

describe('pendência de sync', () => {
  it('um POST antigo que volta ok NÃO limpa a pendência de uma mutação mais nova', () => {
    const v1 = marcarMudancaPendente();
    const v2 = marcarMudancaPendente();
    marcarSincronizado(v1);
    expect(temSyncPendente()).toBe(true);
    marcarSincronizado(v2);
    expect(temSyncPendente()).toBe(false);
  });

  it('sem pendência / sem conta: nada a enviar, nenhuma chamada de rede', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f);
    expect(await sincronizarAntesDeSair()).toEqual({ estado: 'ok' });
    mem.set(STORAGE_KEYS.GAME_STATE, '{}'); mem.set(STORAGE_KEYS.SAVE_ID, ID);
    expect(await sincronizarAntesDeSair()).toEqual({ estado: 'ok' });
    expect(f).not.toHaveBeenCalled();
  });

  it('com pendência: POST ok limpa a pendência; falha de rede devolve `falhou` offline e NÃO apaga nada', async () => {
    mem.set(STORAGE_KEYS.GAME_STATE, '{"x":1}'); mem.set(STORAGE_KEYS.SAVE_ID, ID); marcarMudancaPendente();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    expect(await sincronizarAntesDeSair()).toEqual({ estado: 'falhou', offline: true });
    expect(temSyncPendente()).toBe(true);
    expect(mem.has(STORAGE_KEYS.GAME_STATE)).toBe(true);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    expect(await sincronizarAntesDeSair()).toEqual({ estado: 'ok' });
    expect(temSyncPendente()).toBe(false);
  });

  it('403 de identidade é falha não-offline (texto diferente)', async () => {
    mem.set(STORAGE_KEYS.GAME_STATE, '{"x":1}'); mem.set(STORAGE_KEYS.SAVE_ID, ID); marcarMudancaPendente();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 403 })));
    expect(await sincronizarAntesDeSair()).toEqual({ estado: 'falhou', offline: false });
  });
});

describe('backup local', () => {
  it('monta o arquivo com o save como está; sem save = null', () => {
    expect(montarBackupLocal()).toBeNull();
    mem.set(STORAGE_KEYS.GAME_STATE, '{"totalXP":5}');
    const b = montarBackupLocal(new Date('2026-10-13T12:00:00Z'))!;
    expect(b.nome).toBe('soulmon-backup-2026-10-13.json');
    expect(JSON.parse(b.json).state).toEqual({ totalXP: 5 });
  });
  it('allowlist não vaza chave de save/identidade', () => {
    for (const k of [STORAGE_KEYS.GAME_STATE, STORAGE_KEYS.SAVE_ID, STORAGE_KEYS.USER_EMAIL, STORAGE_KEYS.SYNC_PENDING]) {
      expect(SOBREVIVEM_AO_LOGOUT).not.toContain(k);
    }
  });
});

describe('logout → entrada do app (REGISTRO 49)', () => {
  it('encerrarSessao sem `recarregar` troca a entrada do history por Home sem query/hash e recarrega', async () => {
    const { vi: v } = await import('vitest');
    const replaceState = v.fn();
    const reload = v.fn();
    v.stubGlobal('location', { pathname: '/', reload });
    v.stubGlobal('history', { replaceState });
    const { encerrarSessao: enc, __resetSessaoEncerrando: reset } = await import('./sessionReset');
    reset();
    await enc({ motivo: 'logout', copiaDeSeguranca: false, revogarPush: false });
    expect(replaceState).toHaveBeenCalledWith({ smView: 'home' }, '', '/');
    expect(reload).toHaveBeenCalledTimes(1);
    v.unstubAllGlobals();
  });
});
