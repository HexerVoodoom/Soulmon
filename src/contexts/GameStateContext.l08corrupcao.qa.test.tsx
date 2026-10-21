// @vitest-environment jsdom
// L08-01 / L08-02 — save local corrompido ou atrasado NUNCA pode virar POST de estado novo sobre a nuvem.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { GameStateProvider, useGameState } from './GameStateContext';

const ID = 'deadbeefdeadbeefdeadbeefdeadbeef';
const RICO = {
  totalXP: 4200,
  activities: [{ id: 'a1', name: 'Correr', emoji: 'x', steps: [], completed: false }],
  soulmonMeta: { name: 'Fofo' }, evolutionStage: 'champion', powerPoints: 77,
  lastResetDate: new Date().toDateString(),
};

let ultimo: { totalXP?: number } | null = null;
function Mexe({ xp }: { xp?: number }) {
  const { gameState, setGameState } = useGameState();
  ultimo = gameState as any;
  useEffect(() => { setGameState(p => ({ ...p, totalXP: xp ?? p.totalXP, moodLog: [] })); }, []);
  return null;
}

interface Rede { posts: number[]; gets: number; nuvem: any; getStatus: number }
function instalaRede(r: Rede) {
  globalThis.fetch = vi.fn(async (url: any, init: any) => {
    const u = String(url);
    if (init?.method === 'POST' && u.includes('/api/save')) {
      const st = JSON.parse(init.body).state;
      r.posts.push(st.totalXP); r.nuvem = st;
      return new Response('{}', { status: 200 });
    }
    if (u.includes('/api/save')) {
      r.gets++;
      if (r.getStatus !== 200) return new Response('{}', { status: r.getStatus });
      return new Response(JSON.stringify(r.nuvem ? { found: true, state: r.nuvem } : { found: false }), { status: 200 });
    }
    return new Response('{}', { status: 200 });
  }) as any;
}
const boot = async (xp?: number) => {
  const h = render(<GameStateProvider><Mexe xp={xp} /></GameStateProvider>);
  await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
  return h;
};

beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); ultimo = null; });
afterEach(() => { vi.useRealTimers(); });

describe('L08-01 save local corrompido', () => {
  for (const [nome, cru] of [
    ['JSON truncado', JSON.stringify(RICO).slice(0, 60)],
    ['array', JSON.stringify([RICO])],
    ['string JSON', JSON.stringify(JSON.stringify(RICO))],
  ] as const) {
    it(`${nome}: nenhum POST fresh, original em quarentena, nuvem rica vira o estado`, async () => {
      localStorage.setItem('soulmon_state_v1', cru);
      localStorage.setItem('soulmon-save-id', ID);
      const r: Rede = { posts: [], gets: 0, nuvem: RICO, getStatus: 200 };
      instalaRede(r);
      await boot();
      expect(r.posts.filter(x => x !== 4200)).toEqual([]);
      const q = JSON.parse(localStorage.getItem('soulmon-save-quarantine-v1')!);
      expect(q.cru).toBe(cru);
      expect(q.formato).toBe('soulmon-save-quarantine-v1');
      expect(q.saveId).toBe(ID);
      expect(ultimo!.totalXP).toBe(4200);
      expect(JSON.parse(localStorage.getItem('soulmon_state_v1')!).totalXP).toBe(4200);
    });
  }

  it('GET devolve vazio (404): libera o POST normal', async () => {
    localStorage.setItem('soulmon_state_v1', '{"totalXP":');
    localStorage.setItem('soulmon-save-id', ID);
    const r: Rede = { posts: [], gets: 0, nuvem: null, getStatus: 200 };
    instalaRede(r);
    await boot();
    expect(r.gets).toBeGreaterThan(0);
    const h = render(<GameStateProvider><Mexe xp={10} /></GameStateProvider>);
    await act(async () => { await vi.advanceTimersByTimeAsync(4000); });
    h.unmount();
    expect(r.posts.length).toBeGreaterThan(0);
  });

  it('GET indeterminado (500): nenhum POST na sessão, mesmo com vários gestos', async () => {
    localStorage.setItem('soulmon_state_v1', JSON.stringify(RICO).slice(0, 60));
    localStorage.setItem('soulmon-save-id', ID);
    const r: Rede = { posts: [], gets: 0, nuvem: RICO, getStatus: 500 };
    instalaRede(r);
    await boot();
    await act(async () => { await vi.advanceTimersByTimeAsync(10 * 60 * 1000); });
    expect(r.posts).toEqual([]);
    expect(r.gets).toBeLessThanOrEqual(6);
    expect(localStorage.getItem('soulmon-save-quarantine-v1')).toBeTruthy();
  });

  it('GAME_STATE ausente com SAVE_ID presente: não posta fresh', async () => {
    localStorage.setItem('soulmon-save-id', ID);
    const r: Rede = { posts: [], gets: 0, nuvem: RICO, getStatus: 500 };
    instalaRede(r);
    await boot();
    expect(r.posts).toEqual([]);
  });
});

describe('L08-02 cota cheia', () => {
  it('o boot seguinte lê a nuvem e não rebaixa 5000 para 4200', async () => {
    localStorage.setItem('soulmon_state_v1', JSON.stringify(RICO));
    localStorage.setItem('soulmon-save-id', ID);
    const r: Rede = { posts: [], gets: 0, nuvem: null, getStatus: 200 };
    instalaRede(r);
    const orig = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k: string, v: string) {
      if (k === 'soulmon_state_v1') throw new DOMException('full', 'QuotaExceededError');
      return orig.call(this, k, v);
    };
    const s1 = await boot(5000);
    s1.unmount();
    Storage.prototype.setItem = orig;
    expect(JSON.parse(localStorage.getItem('soulmon_state_v1')!).totalXP).toBe(4200);
    expect(localStorage.getItem('soulmon-local-stale-v1')).toBeTruthy();
    const s2 = await boot();
    s2.unmount();
    expect(r.posts).toContain(5000);
    expect(r.posts.slice(r.posts.indexOf(5000)).filter(x => x < 5000)).toEqual([]);
    expect(JSON.parse(localStorage.getItem('soulmon_state_v1')!).totalXP).toBe(5000);
    expect(localStorage.getItem('soulmon-local-stale-v1')).toBeNull();
    expect(JSON.parse(localStorage.getItem('soulmon-save-quarantine-v1')!).cru).toContain('"totalXP":4200');
  });
});

describe('local íntegro e sem flag', () => {
  it('comportamento de hoje: sem GET no boot, POST normal', async () => {
    localStorage.setItem('soulmon_state_v1', JSON.stringify(RICO));
    localStorage.setItem('soulmon-save-id', ID);
    const r: Rede = { posts: [], gets: 0, nuvem: null, getStatus: 200 };
    instalaRede(r);
    await boot(4300);
    expect(r.gets).toBe(0);
    expect(r.posts).toEqual([4300]);
    expect(localStorage.getItem('soulmon-save-quarantine-v1')).toBeNull();
  });
});
