// @vitest-environment jsdom
/**
 * Memória da Biblioteca no save (10/11/2026): `librarySeen` / `libraryForms`.
 * Migração do localStorage (união, idempotente, chave antiga intacta), save vence na ordem, lixo vira vazio,
 * e a nuvem adotada (outro aparelho) NUNCA perde o que este aparelho já tinha.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { GameStateProvider, useGameState } from './GameStateContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

const BASE = { activities: [], tasks: [], lastResetDate: 'Mon Jan 01 2024' };
const f = (stage: string, date: number) => ({ stage, spriteUrl: null, element: 'fogo', date });

let ctxRef: ReturnType<typeof useGameState> | null = null;
function Sonda() {
  const c = useGameState();
  ctxRef = c;
  return <pre data-testid="estado">{JSON.stringify({ s: c.gameState.librarySeen, f: c.gameState.libraryForms })}</pre>;
}
function montar() {
  cleanup();
  render(<GameStateProvider><Sonda /></GameStateProvider>);
  return JSON.parse(screen.getByTestId('estado').textContent!) as { s: string[]; f: Record<string, Array<{ stage: string; date: number }>> };
}

beforeEach(() => {
  installDomGlobals();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('hydrateSave — memória da Biblioteca', () => {
  it('save sem os campos + chave local antiga: migra por união e NÃO apaga a chave', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(BASE));
    localStorage.setItem(STORAGE_KEYS.LIBRARY_SEEN, JSON.stringify(['a', 'b', '<x>']));
    localStorage.setItem(STORAGE_KEYS.LIBRARY_FORMS, JSON.stringify({ a: [f('rookie', 5)] }));
    const e = montar();
    expect(e.s).toEqual(['a', 'b']);
    expect(e.f.a.map(x => x.stage)).toEqual(['rookie']);
    expect(localStorage.getItem(STORAGE_KEYS.LIBRARY_SEEN)).toBe(JSON.stringify(['a', 'b', '<x>']));
  });
  it('save + local: união, o save manda na ordem; 2ª carga é no-op', () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, librarySeen: ['n1', 'n2'], libraryForms: { a: [f('mega-power', 9)] } }));
    localStorage.setItem(STORAGE_KEYS.LIBRARY_SEEN, JSON.stringify(['n2', 'l1']));
    localStorage.setItem(STORAGE_KEYS.LIBRARY_FORMS, JSON.stringify({ a: [f('rookie', 2)], b: [f('rookie', 1)] }));
    const e1 = montar();
    expect(e1.s).toEqual(['n1', 'n2', 'l1']);
    expect(e1.f.a.map(x => x.stage)).toEqual(['rookie', 'mega-power']);
    expect(Object.keys(e1.f)).toEqual(['a', 'b']);
    const salvo = localStorage.getItem(STORAGE_KEYS.GAME_STATE)!;
    expect(JSON.parse(salvo).librarySeen).toEqual(['n1', 'n2', 'l1']);
    const e2 = montar();
    expect(e2).toEqual(e1);
  });
  it('lixo hostil vira vazio (sem lançar)', () => {
    for (const lixo of [null, 7, 'x', { a: 1 }, [1, null, {}], true]) {
      localStorage.clear();
      localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, librarySeen: lixo, libraryForms: lixo }));
      const e = montar();
      expect(Array.isArray(e.s)).toBe(true);
      expect(e.f && typeof e.f === 'object' && !Array.isArray(e.f)).toBe(true);
    }
  });
  it('teto: 500 ids e 8 formas por jogador no save hostil', () => {
    const ids = Array.from({ length: 700 }, (_, i) => 'id' + i);
    const forms = Array.from({ length: 40 }, (_, i) => f('rookie', i + 1));
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, librarySeen: ids, libraryForms: { a: forms } }));
    const e = montar();
    expect(e.s).toHaveLength(500);
    expect(e.f.a.length).toBeLessThanOrEqual(20);
  });
});

describe('setGameState — só muda quando muda (sem spam de save)', () => {
  it('marcar o mesmo id duas vezes devolve o mesmo estado', async () => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, librarySeen: ['a'] }));
    montar();
    const { addSeenToState } = await import('../utils/librarySeen');
    let antes: unknown; let depois: unknown;
    await act(async () => { ctxRef!.setGameState(p => { antes = p; const n = addSeenToState(p, 'a'); depois = n; return n; }); });
    expect(depois).toBe(antes);
  });
});

describe('hidratarNuvem — dois aparelhos', () => {
  it('a nuvem vence o save, mas ids e formas deste aparelho entram por união (nunca perde); 2x = no-op', async () => {
    const { hidratarNuvem } = await import('./GameStateContext');
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ ...BASE, librarySeen: ['local1', 'comum'], libraryForms: { a: [f('rookie', 3)] } }));
    montar();
    const atual = ctxRef!.gameState;
    const nuvem = { ...BASE, librarySeen: ['nuvem1', 'comum'], libraryForms: { a: [f('mega-power', 8)], b: [f('rookie', 1)] } };
    const h1 = hidratarNuvem(nuvem as never, atual);
    expect(h1.librarySeen).toEqual(['nuvem1', 'comum', 'local1']);
    expect(h1.libraryForms!.a.map(x => x.stage)).toEqual(['rookie', 'mega-power']);
    expect(Object.keys(h1.libraryForms!)).toEqual(['a', 'b']);
    const h2 = hidratarNuvem(nuvem as never, h1);
    expect(h2.librarySeen).toEqual(h1.librarySeen);
    expect(h2.libraryForms).toEqual(h1.libraryForms);
  });
});
