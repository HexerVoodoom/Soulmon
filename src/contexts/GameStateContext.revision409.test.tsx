// @vitest-environment jsdom
// ADR-004 D3 no PROVEDOR: POST -> 409, o cliente relê a nuvem, guarda o local no anel (motivo
// 'conflito-409'), adota a nuvem, grava a revisão e só então volta a postar (com a base certa).
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { GameStateProvider, useGameState } from './GameStateContext';

const avisos: string[] = [];
vi.mock('sonner', () => ({
  toast: Object.assign((m: string) => { avisos.push(m); }, { warning: (m: string) => { avisos.push(m); }, error: () => {}, success: () => {} }),
}));

const ID = 'deadbeefdeadbeefdeadbeefdeadbeef';
const base = { activities: [{ id: 'a1', name: 'Correr', emoji: 'x', steps: [], completed: false }], soulmonMeta: { name: 'Fofo' }, lastResetDate: new Date().toDateString() };
const LOCAL = { ...base, totalXP: 4200 };
const NUVEM = { ...base, totalXP: 9000 };

let ultimo: { totalXP?: number } | null = null;
function Mexe() {
  const { gameState, setGameState } = useGameState();
  ultimo = gameState as any;
  useEffect(() => { setGameState(p => ({ ...p, totalXP: 4300, moodLog: [] })); }, []);
  return null;
}

type Req = { m: string; body?: any };
let reqs: Req[] = [];
let houve409 = false;
function instalaRede() {
  globalThis.fetch = vi.fn(async (url: any, init: any) => {
    const u = String(url);
    if (!u.includes('/api/save')) return new Response('{}', { status: 200 });
    if (init?.method === 'POST') {
      const body = JSON.parse(init.body);
      reqs.push({ m: 'POST', body });
      if (!houve409) { houve409 = true; return new Response(JSON.stringify({ error: 'conflict', revision: 7 }), { status: 409 }); }
      return new Response(JSON.stringify({ ok: true, revision: 8 }), { status: 200 });
    }
    reqs.push({ m: 'GET' });
    // antes do 409 a nuvem ainda está na revisão do aparelho (3); depois, a de outro aparelho (7)
    return new Response(JSON.stringify(houve409
      ? { found: true, state: NUVEM, revision: 7 }
      : { found: true, state: LOCAL, revision: 3 }), { status: 200 });
  }) as any;
}

// A reconciliação e a saída da carga degradada moram em `saveReconcileRun.ts`, carregado por `import()`
// (orçamento do JS de entrada). O carregamento a frio leva tempo REAL, que o relógio falso não avança:
// no CI lento o 1º caso terminava antes do módulo chegar. Pré-carregar torna o teste determinístico.
beforeAll(async () => { await import('../utils/saveReconcileRun'); });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] }); localStorage.clear(); ultimo = null; reqs = []; houve409 = false; avisos.length = 0;
  localStorage.setItem('soulmon_state_v1', JSON.stringify(LOCAL));
  localStorage.setItem('soulmon-save-id', ID);
  localStorage.setItem('soulmon-save-revision-v1', JSON.stringify({ saveId: ID, r: 3 }));
});
afterEach(() => { vi.useRealTimers(); });

describe('409 por revisão no provider', () => {
  it('reconcilia: anel com o local, estado = nuvem, SAVE_REVISION = 7, sem POST cego no meio', async () => {
    instalaRede();
    const h = render(<GameStateProvider><Mexe /></GameStateProvider>);
    // passos curtos com respiro real: auth/fetch têm hops assíncronos que o relógio falso não espera
    for (let i = 0; i < 8; i++) {
      await act(async () => { await vi.advanceTimersByTimeAsync(1500); await new Promise<void>(r => { setImmediate(r); }); });
    }

    const anel = JSON.parse(localStorage.getItem('soulmon-backup-ring-v1')!);
    const copia = anel.copias.find((c: any) => c.motivo === 'conflito-409');
    expect(copia, 'o local recusado tem de estar no anel').toBeTruthy();
    expect(copia.state.totalXP).toBe(4300);
    expect(copia.saveId).toBe(ID);

    expect(ultimo!.totalXP).toBe(9000);
    expect(JSON.parse(localStorage.getItem('soulmon_state_v1')!).totalXP).toBe(9000);
    expect(JSON.parse(localStorage.getItem('soulmon-save-revision-v1')!)).toEqual({ saveId: ID, r: 8 });

    // sequência: GET do boot (D2, nada a adotar), POST 409, GET da reconciliação, e só então o POST do estado adotado
    const seq = reqs.map(r => r.m);
    const i409 = seq.indexOf('POST');
    expect(seq.slice(i409, i409 + 2)).toEqual(['POST', 'GET']);
    const posts = reqs.filter(r => r.m === 'POST');
    expect(posts[0].body).toEqual(expect.objectContaining({ baseRevision: 3 }));
    expect(posts.length).toBe(2);
    expect(posts[1].body.baseRevision).toBe(7);          // pós-adoção: base = revisão adotada
    expect(posts[1].body.state.totalXP).toBe(9000);      // nunca o local recusado
    expect(avisos.filter(m => /another device|outro aparelho/.test(m)).length).toBe(1);
    h.unmount();
  });
});
