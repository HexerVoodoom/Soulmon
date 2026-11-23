import { describe, expect, it } from 'vitest';
import { escolherModo, montarFila, orcamentoDe, iniciarPrefetchOnboarding, TETO_SEM_ESTIMATIVA, type IndicePrefetch } from './prefetchOnboarding';

const indice: IndicePrefetch = {
  v: 1, built: 'b1',
  essencial: [['/assets/a-12345678.js', 100], ['/assets/lote-12345678.webp', 100]],
  resto: [['/assets/fx-12345678.webp', 100], ['/assets/fx-22345678.webp', 100]],
};

describe('escolherModo', () => {
  it('Wi-Fi e ethernet = tudo; o resto = essencial', () => {
    expect(escolherModo({ type: 'wifi', effectiveType: '4g' })).toBe('tudo');
    expect(escolherModo({ type: 'ethernet' })).toBe('tudo');
    expect(escolherModo({ type: 'cellular', effectiveType: '4g' })).toBe('essencial');
  });
  it('economia de dados, 3g e API ausente = essencial', () => {
    expect(escolherModo({ type: 'wifi', saveData: true })).toBe('essencial');
    expect(escolherModo({ type: 'wifi', effectiveType: '3g' })).toBe('essencial');
    expect(escolherModo(undefined)).toBe('essencial');
  });
});

describe('montarFila / orcamentoDe', () => {
  it('essencial não leva o resto; tudo leva, essenciais primeiro', () => {
    expect(montarFila(indice, 'essencial', 1e9)).toHaveLength(2);
    const t = montarFila(indice, 'tudo', 1e9);
    expect(t).toHaveLength(4);
    expect(t.slice(0, 2).every(f => f.ess)).toBe(true);
  });
  it('respeita o orçamento de bytes', () => {
    expect(montarFila(indice, 'tudo', 250)).toHaveLength(2);
  });
  it('25% da quota menos o uso; sem estimativa usa o teto fixo', () => {
    expect(orcamentoDe({ quota: 1000, usage: 100 })).toBe(150);
    expect(orcamentoDe({ quota: 100, usage: 900 })).toBe(0);
    expect(orcamentoDe(null)).toBe(TETO_SEM_ESTIMATIVA);
  });
});

function mkDeps(over: Record<string, unknown> = {}) {
  const baixados: string[] = [];
  let gravado: string | null = null;
  const deps = {
    swPronto: async () => true,
    conexao: () => ({ type: 'wifi', effectiveType: '4g' }),
    estimar: async () => ({ quota: 1e9, usage: 0 }),
    ocioso: (fn: () => void) => fn(),
    temCache: async () => false,
    ler: () => gravado,
    gravar: (v: string) => { gravado = v; },
    fetchFn: async (u: string) => {
      if (u === '/prefetch-index.json') return new Response(JSON.stringify(indice), { headers: { 'content-type': 'application/json' } });
      baixados.push(u);
      return new Response('x');
    },
    ...over,
  };
  return { deps, baixados, gravado: () => gravado };
}

describe('iniciarPrefetchOnboarding', () => {
  it('Wi-Fi baixa tudo e grava; segunda chamada não repete', async () => {
    const m = mkDeps();
    await iniciarPrefetchOnboarding(m.deps).pronto;
    expect(m.baixados).toHaveLength(4);
    expect(JSON.parse(m.gravado()!)).toEqual({ b: 'b1', m: 'tudo' });
    m.baixados.length = 0;
    await iniciarPrefetchOnboarding(m.deps).pronto;
    expect(m.baixados).toHaveLength(0);
  });
  it('dados móveis baixa só o essencial', async () => {
    const m = mkDeps({ conexao: () => ({ type: 'cellular', effectiveType: '4g' }) });
    await iniciarPrefetchOnboarding(m.deps).pronto;
    expect(m.baixados).toEqual(['/assets/a-12345678.js', '/assets/lote-12345678.webp']);
    expect(JSON.parse(m.gravado()!).m).toBe('essencial');
  });
  it('sem service worker não faz nada', async () => {
    const m = mkDeps({ swPronto: async () => false });
    await iniciarPrefetchOnboarding(m.deps).pronto;
    expect(m.baixados).toHaveLength(0);
  });
  it('índice HTML (SPA fallback) é ignorado', async () => {
    const m = mkDeps({ fetchFn: async () => new Response('<html>', { headers: { 'content-type': 'text/html' } }) });
    await iniciarPrefetchOnboarding(m.deps).pronto;
    expect(m.baixados).toHaveLength(0);
  });
  it('falha de rede não grava o carimbo', async () => {
    const m = mkDeps({
      fetchFn: async (u: string) => {
        if (u === '/prefetch-index.json') return new Response(JSON.stringify(indice), { headers: { 'content-type': 'application/json' } });
        throw new Error('rede');
      },
    });
    await iniciarPrefetchOnboarding(m.deps).pronto;
    expect(m.gravado()).toBeNull();
  });
  it('pula o que já está em cache', async () => {
    const m = mkDeps({ temCache: async () => true });
    await iniciarPrefetchOnboarding(m.deps).pronto;
    expect(m.baixados).toHaveLength(0);
  });
  it('sair do Wi-Fi no meio corta o resto da fila', async () => {
    let tipo = 'wifi';
    const ouvintes: (() => void)[] = [];
    const m = mkDeps({
      conexao: () => ({ type: tipo, effectiveType: '4g', addEventListener: (_: string, f: () => void) => ouvintes.push(f), removeEventListener: () => undefined }),
    });
    const base = m.deps.fetchFn;
    m.deps.fetchFn = async (u: string) => {
      const r = await base(u);
      if (u.includes('lote')) { tipo = 'cellular'; ouvintes.forEach(f => f()); }
      return r;
    };
    await iniciarPrefetchOnboarding(m.deps).pronto;
    expect(m.baixados.some(u => u.includes('fx-'))).toBe(false);
  });
  it('cancelar antes de começar não baixa nada', async () => {
    const m = mkDeps();
    const c = iniciarPrefetchOnboarding(m.deps);
    c();
    await c.pronto;
    expect(m.baixados).toHaveLength(0);
  });
});
