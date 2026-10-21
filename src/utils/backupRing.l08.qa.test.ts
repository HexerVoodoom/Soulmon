import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { adoptCloudSave } from './cloudSave';
import { guardarCopiaDeSeguranca } from './sessionReset';
import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';
import { resetStorageNotice } from './safeStorage';

// L08-03 — o logout sobrescrevia a ÚNICA vaga de CONFLICT_BACKUP e destruía a
// cópia forense da adoção (até com save sem progresso). Agora o logout vai para
// o ANEL (`soulmon-backup-ring-v1`, máx. 3) e a vaga única só empurra o velho.

const RING = STORAGE_KEYS.BACKUP_RING;
const store = new Map<string, string>();
let falhasRing = 0;

beforeEach(() => {
  store.clear();
  falhasRing = 0;
  resetStorageNotice();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (k === RING && falhasRing > 0) { falhasRing--; throw new DOMException('cheio', 'QuotaExceededError'); }
      store.set(k, v);
    },
    removeItem: (k: string) => { store.delete(k); },
  });
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

const ring = () => (JSON.parse(store.get(RING) ?? '{"copias":[]}') as { formato: string; copias: Array<{ saveId: string; motivo: string; state: { totalXP?: number } }> });
const tudo = () => [...store.values()].join('\n');

function adotarComLocal(xp: number, saveIdLocal: string) {
  store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify({ soulmonMeta: { baseName: 'L' }, totalXP: xp }));
  store.set(STORAGE_KEYS.SAVE_ID, saveIdLocal);
  expect(adoptCloudSave('nuvem-' + xp, { totalXP: 1 })).toBe('ok');
}

describe('L08-03 anel de backups', () => {
  it('(a) adoção grava 9999 em CONFLICT_BACKUP; logout com progresso 10 não o apaga e vai ao anel', () => {
    adotarComLocal(9999, 'id-A');
    const adocao = store.get(RECONCILE_KEYS.CONFLICT_BACKUP)!;
    expect(JSON.parse(adocao).state.totalXP).toBe(9999);

    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify({ soulmonMeta: { baseName: 'L' }, totalXP: 10 }));
    expect(guardarCopiaDeSeguranca('logout')).toBe(true);

    expect(store.get(RECONCILE_KEYS.CONFLICT_BACKUP)).toBe(adocao);
    const r = ring();
    expect(r.formato).toBe('soulmon-backup-ring-v1');
    expect(r.copias.at(-1)!.motivo).toBe('logout');
    expect(r.copias.at(-1)!.state.totalXP).toBe(10);
    expect(tudo()).toContain('9999');
  });

  it('(b) logout com save vazio / sem onboarding não grava nada', () => {
    store.set(STORAGE_KEYS.GAME_STATE, '{}');
    expect(guardarCopiaDeSeguranca('logout')).toBe(false);
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], totalXP: 0 }));
    expect(guardarCopiaDeSeguranca('logout')).toBe(false);
    expect(store.has(RING)).toBe(false);
    expect(store.has(RECONCILE_KEYS.CONFLICT_BACKUP)).toBe(false);
  });

  it('(b2) texto cru ilegível é guardado no anel (pode ser a única cópia)', () => {
    store.set(STORAGE_KEYS.GAME_STATE, '{"totalXP": 77, trunc');
    expect(guardarCopiaDeSeguranca('logout')).toBe(true);
    expect(ring().copias.at(-1)!.state).toBe('{"totalXP": 77, trunc');
  });

  it('(c) duas adoções seguidas: a primeira cópia vai para o anel', () => {
    adotarComLocal(111, 'id-1');
    adotarComLocal(222, 'id-2');
    expect(JSON.parse(store.get(RECONCILE_KEYS.CONFLICT_BACKUP)!).state.totalXP).toBe(222);
    expect(ring().copias.map(c => c.state.totalXP)).toEqual([111]);
  });

  it('(d) o anel limita a 3 (a mais antiga sai) e é idempotente', () => {
    for (const xp of [1, 2, 3, 4, 5]) {
      store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify({ totalXP: xp }));
      guardarCopiaDeSeguranca('logout');
    }
    expect(ring().copias.map(c => c.state.totalXP)).toEqual([3, 4, 5]);
    guardarCopiaDeSeguranca('logout'); // mesma cópia de novo
    expect(ring().copias.map(c => c.state.totalXP)).toEqual([3, 4, 5]);
  });

  it('(d2) sobrevive à cota: a 1a tentativa falha, tira a mais antiga e tenta de novo; nunca lança', () => {
    for (const xp of [1, 2, 3]) {
      store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify({ totalXP: xp }));
      guardarCopiaDeSeguranca('logout');
    }
    falhasRing = 1;
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify({ totalXP: 4 }));
    expect(() => guardarCopiaDeSeguranca('logout')).not.toThrow();
    expect(ring().copias.map(c => c.state.totalXP)).toEqual([3, 4]);
  });

  it('leitura tolerante: anel ilegível não quebra o logout', () => {
    store.set(RING, '{lixo');
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify({ totalXP: 9 }));
    expect(guardarCopiaDeSeguranca('logout')).toBe(true);
    expect(ring().copias).toHaveLength(1);
  });
});
