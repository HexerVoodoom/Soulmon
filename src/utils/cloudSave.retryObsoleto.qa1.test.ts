import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cloudSaveComRetry, __resetRetryBudgets } from './cloudSave';

// QA1 (rodada 6) — retry com estado VELHO sobrescreve o save novo.
//
// POST1 (S1) cai com 5xx e espera o backoff (2 s … 30 s). Nesse intervalo o
// jogador age, o debounce dispara POST2 (S2) e ele PASSA. Quando o backoff de
// S1 vence, o retry reenviava S1 — e o `put` cego do servidor trocava S2 por
// S1: a nuvem voltava no tempo (o aparelho novo/reinstalação carregava o save
// antigo). Agora um retry só reenvia se NENHUMA chamada mais nova para o mesmo
// `saveId` começou depois dele.

const ID = 'b'.repeat(32);
const memoria = new Map<string, string>();

beforeEach(() => {
  memoria.clear();
  __resetRetryBudgets();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memoria.get(k) ?? null,
    setItem: (k: string, v: string) => { memoria.set(k, v); },
    removeItem: (k: string) => { memoria.delete(k); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('cloudSaveComRetry — superado por uma chamada mais nova', () => {
  it('o retry do estado velho NÃO reenvia depois que o estado novo foi salvo', async () => {
    const corpos: string[] = [];
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      corpos.push(String(init.body));
      // 1ª requisição (S1) cai; as seguintes passam.
      return ++n === 1 ? new Response('{}', { status: 503 }) : new Response('{"ok":true}', { status: 200 });
    }));

    let liberaS1!: () => void;
    const esperaS1 = new Promise<void>(r => { liberaS1 = r; });
    const chamadaS1 = cloudSaveComRetry(ID, { v: 'S1' }, { esperar: () => esperaS1 });

    // Deixa o POST de S1 falhar e entrar na espera do backoff.
    await new Promise(r => setTimeout(r, 0));
    expect(corpos).toHaveLength(1);

    // O jogador age: S2 sai e passa.
    const r2 = await cloudSaveComRetry(ID, { v: 'S2' }, { esperar: async () => {} });
    expect(r2.ok).toBe(true);

    // O backoff de S1 vence agora.
    liberaS1();
    await chamadaS1;

    // O servidor recebeu S1 (falhou) e S2 — e NUNCA S1 de novo por cima.
    expect(corpos.map(c => JSON.parse(c).state.v)).toEqual(['S1', 'S2']);
  });

  it('sem chamada mais nova, o retry continua funcionando', async () => {
    let n = 0;
    const f = vi.fn(async () => (++n === 1 ? new Response('{}', { status: 503 }) : new Response('{"ok":true}', { status: 200 })));
    vi.stubGlobal('fetch', f);
    const r = await cloudSaveComRetry(ID, { v: 'S1' }, { esperar: async () => {} });
    expect(r.ok).toBe(true);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('saves de ids diferentes não se superam', async () => {
    let n = 0;
    const f = vi.fn(async () => (++n === 1 ? new Response('{}', { status: 503 }) : new Response('{"ok":true}', { status: 200 })));
    vi.stubGlobal('fetch', f);
    let libera!: () => void;
    const espera = new Promise<void>(r => { libera = r; });
    const a = cloudSaveComRetry(ID, { v: 'A' }, { esperar: () => espera });
    await new Promise(r => setTimeout(r, 0));
    await cloudSaveComRetry('c'.repeat(32), { v: 'OUTRO' }, { esperar: async () => {} });
    libera();
    const ra = await a;
    expect(ra.ok).toBe(true); // o retry de A aconteceu
  });
});
