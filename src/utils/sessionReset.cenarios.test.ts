/**
 * Integração A → B → A no MESMO aparelho, com uma "nuvem" falsa (Map por saveId)
 * e as funções reais de login/adoção/reconciliação:
 *   · conta A com progresso sai;
 *   · conta B entra → vê save vazio/próprio, a nuvem de A segue intacta;
 *   · A entra de novo → recebe o save de A da nuvem.
 * E o CONTROLE: sem a limpeza (o comportamento de antes), B herdava e SOBRESCREVIA
 * a conta nova com o progresso de A.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn(async () => {}) }));
vi.mock('./auth', () => ({ authHeaders: async () => ({}), signOut }));
vi.mock('./accountData', () => ({ revokePushBeforeDelete: async () => ({ webPush: true, fcm: true }) }));

import { emailToSaveId, consultarContaNaNuvem, adoptCloudSave, reconcileSaveId } from './cloudSave';
import { encerrarSessao, sincronizarAntesDeSair, marcarMudancaPendente, __resetSessaoEncerrando } from './sessionReset';
import { readLocal } from './safeStorage';

const mem = new Map<string, string>();
const nuvem = new Map<string, unknown>();

beforeEach(() => {
  mem.clear(); nuvem.clear(); signOut.mockClear(); __resetSessaoEncerrando();
  vi.stubGlobal('localStorage', {
    get length() { return mem.size; },
    key: (i: number) => [...mem.keys()][i] ?? null,
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, v); },
    removeItem: (k: string) => { mem.delete(k); },
  });
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const id = new URL(url, 'http://x').searchParams.get('id')!;
    if (init?.method === 'POST') {
      nuvem.set(id, (JSON.parse(String(init.body)) as { state: unknown }).state);
      return Response.json({ ok: true });
    }
    return nuvem.has(id) ? Response.json({ found: true, state: nuvem.get(id) }) : Response.json({ found: false });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); });

const A = 'ana@exemplo.com';
const B = 'beto@exemplo.com';
const estadoA = { petName: 'Aurora', totalXP: 1234, evolutionStage: 3, spritePose: 'idle', completedTasks: [{ id: 't1' }] };
const estadoB = { petName: 'Bruno', totalXP: 7, evolutionStage: 1 };

async function entrarComoA() {
  const id = await emailToSaveId(A);
  mem.set(STORAGE_KEYS.SAVE_ID, id);
  mem.set(STORAGE_KEYS.USER_EMAIL, A);
  mem.set(STORAGE_KEYS.GAME_STATE, JSON.stringify(estadoA));
  mem.set(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  mem.set(STORAGE_KEYS.USER_NAME, 'Ana');
  mem.set(STORAGE_KEYS.LANGUAGE, 'pt-BR');
  marcarMudancaPendente();
  return id;
}

describe('A → B → A no mesmo aparelho', () => {
  it('sai de A enviando o pendente; B entra limpo; A volta e recebe o save de A', async () => {
    const idA = await entrarComoA();
    const idB = await emailToSaveId(B);

    // A sai: o pendente sobe ANTES de apagar.
    expect(await sincronizarAntesDeSair()).toEqual({ estado: 'ok' });
    expect(nuvem.get(idA)).toEqual(estadoA);
    const recarregar = vi.fn();
    await encerrarSessao({ motivo: 'logout', recarregar });
    expect(recarregar).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);

    // Instalação limpa: nada de A, só preferência do aparelho.
    expect(readLocal(STORAGE_KEYS.GAME_STATE)).toBeNull();
    expect(readLocal(STORAGE_KEYS.SAVE_ID)).toBeNull();
    expect(readLocal(STORAGE_KEYS.USER_EMAIL)).toBeNull();
    expect(readLocal(STORAGE_KEYS.ONBOARDING_COMPLETE)).toBeNull();
    expect(readLocal(STORAGE_KEYS.LANGUAGE)).toBe('pt-BR');

    // B entra: conta nova (a nuvem respondeu "não há"), nada local de A para subir.
    const consultaB = await consultarContaNaNuvem(idB);
    expect(consultaB.estado).toBe('nova');
    expect(readLocal(STORAGE_KEYS.GAME_STATE)).toBeNull();
    expect(nuvem.has(idB)).toBe(false);
    expect(nuvem.get(idA)).toEqual(estadoA); // a nuvem de A segue intacta

    // B joga e sincroniza o PRÓPRIO progresso.
    mem.set(STORAGE_KEYS.SAVE_ID, idB); mem.set(STORAGE_KEYS.USER_EMAIL, B);
    mem.set(STORAGE_KEYS.GAME_STATE, JSON.stringify(estadoB)); marcarMudancaPendente();
    expect(await sincronizarAntesDeSair()).toEqual({ estado: 'ok' });
    expect(nuvem.get(idB)).toEqual(estadoB);
    await encerrarSessao({ motivo: 'logout', recarregar: () => {} });
    expect(readLocal(STORAGE_KEYS.GAME_STATE)).toBeNull();
    expect(nuvem.get(idA)).toEqual(estadoA);

    // A volta: recebe o save de A da nuvem.
    const consultaA = await consultarContaNaNuvem(idA);
    expect(consultaA.estado).toBe('existente');
    if (consultaA.estado !== 'existente') return;
    expect(adoptCloudSave(idA, consultaA.state, A)).toBe('ok');
    expect(JSON.parse(readLocal(STORAGE_KEYS.GAME_STATE)!)).toEqual(estadoA);
    expect(readLocal(STORAGE_KEYS.SAVE_ID)).toBe(idA);
    expect(nuvem.get(idB)).toEqual(estadoB); // e a de B também
  });

  it('CONTROLE (comportamento antigo, só signOut): B herdava o save de A e a nuvem de B nascia com o progresso de A', async () => {
    const idA = await entrarComoA();
    const idB = await emailToSaveId(B);
    await sincronizarAntesDeSair();
    // "Sair" de antes: só `signOut`, estado local intacto. B entra:
    const r = await reconcileSaveId(B, JSON.parse(readLocal(STORAGE_KEYS.GAME_STATE)!));
    expect(r.estado).toBe('migrado');
    expect(nuvem.get(idB)).toEqual(estadoA); // o vazamento que o dono relatou
    expect(idA).not.toBe(idB);
  });

  it('sem rede: o save pendente NÃO é apagado por `sincronizarAntesDeSair` (quem apaga é a decisão da pessoa)', async () => {
    await entrarComoA();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    expect(await sincronizarAntesDeSair()).toEqual({ estado: 'falhou', offline: true });
    expect(JSON.parse(readLocal(STORAGE_KEYS.GAME_STATE)!)).toEqual(estadoA);
  });

  it('sair sem sync guarda a cópia de segurança com o save de A (recuperável por suporte/exportação)', async () => {
    const idA = await entrarComoA();
    await encerrarSessao({ motivo: 'logout', recarregar: () => {} });
    const copia = JSON.parse(readLocal(STORAGE_KEYS.BACKUP_RING)!).copias.at(-1); // L08-03: anel
    expect(copia.saveId).toBe(idA);
    expect(copia.state).toEqual(estadoA);
  });
});
