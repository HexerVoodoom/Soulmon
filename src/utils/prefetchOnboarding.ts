/**
 * Pré-download no ONBOARDING (REGISTRO §510): enquanto a pessoa responde o ritual, baixa em segundo plano o que ela só
 * pediria ao abrir cada tela (chunks lazy e artes), pelo `fetch` normal — o service worker (`public/sw.js`) já guarda tudo
 * que é `/assets/*` com hash no `ASSET_CACHE` (com teto), então este módulo NÃO escreve cache nenhum, só provoca os pedidos.
 * A lista vem de `/prefetch-index.json` (gerado no build por `scripts/gerar-prefetch-index.mjs`), nunca de nomes à mão.
 *
 * Rede: Wi-Fi/ethernet = 'tudo'; qualquer outra (4G/5G, economia de dados, 2G, API ausente) = 'essencial' (código + artes de
 * prédio/NPC/moldura/UI/fundo). Troca de rede reavalia: saiu do Wi-Fi no modo 'tudo' → o resto da fila é cortado.
 * Baixa prioridade: 1–2 pedidos por vez, cada um só quando o navegador está ocioso. Falha = silêncio (sem SW, sem storage,
 * sem índice: não faz nada). Idempotente por build; cancela no `pagehide` e quando o componente sai.
 */
import { STORAGE_KEYS } from './storageKeys';
import { readLocal, writeLocal } from './safeStorage';

export type ModoPrefetch = 'tudo' | 'essencial';
export interface IndicePrefetch { v: number; built: string; essencial: [string, number][]; resto: [string, number][] }
export interface ConexaoLike {
  type?: string; effectiveType?: string; saveData?: boolean;
  addEventListener?: (t: string, f: () => void) => void;
  removeEventListener?: (t: string, f: () => void) => void;
}

/** Fração da quota estimada do armazenamento que o pré-download pode ocupar. */
export const FRACAO_QUOTA = 0.25;
/** Sem `navigator.storage.estimate()`: teto fixo em bytes. */
export const TETO_SEM_ESTIMATIVA = 150 * 1024 * 1024;
export const PARALELO = 2;

export function escolherModo(c: ConexaoLike | undefined | null): ModoPrefetch {
  if (!c) return 'essencial';
  if (c.saveData) return 'essencial';
  if (c.effectiveType && c.effectiveType !== '4g') return 'essencial';
  if (c.type === 'wifi' || c.type === 'ethernet') return 'tudo';
  return 'essencial';
}

/** A fila (na ordem) que cabe no orçamento de bytes: essenciais primeiro, o resto só no modo 'tudo'. */
export function montarFila(indice: IndicePrefetch, modo: ModoPrefetch, orcamento: number): { url: string; ess: boolean }[] {
  const fila: { url: string; ess: boolean }[] = [];
  let gasto = 0;
  const lista: [string, number, boolean][] = [
    ...indice.essencial.map(([u, t]): [string, number, boolean] => [u, t, true]),
    ...(modo === 'tudo' ? indice.resto.map(([u, t]): [string, number, boolean] => [u, t, false]) : []),
  ];
  for (const [url, tam, ess] of lista) {
    if (gasto + tam > orcamento) continue;
    gasto += tam;
    fila.push({ url, ess });
  }
  return fila;
}

/** Orçamento = FRACAO_QUOTA da quota menos o que já está em uso (nunca negativo). */
export function orcamentoDe(est: { quota?: number; usage?: number } | null | undefined): number {
  if (!est || !est.quota) return TETO_SEM_ESTIMATIVA;
  return Math.max(0, est.quota * FRACAO_QUOTA - (est.usage ?? 0));
}

const cobre = (feito: string | undefined, modo: ModoPrefetch) => feito === 'tudo' || feito === modo;

export interface DepsPrefetch {
  fetchFn: (url: string, init?: RequestInit) => Promise<Response>;
  temCache: (url: string) => Promise<boolean>;
  conexao: () => ConexaoLike | undefined;
  estimar: () => Promise<{ quota?: number; usage?: number } | null>;
  ocioso: (fn: () => void) => void;
  swPronto: () => Promise<boolean>;
  ler: () => string | null;
  gravar: (v: string) => void;
}

function depsReais(): DepsPrefetch {
  return {
    fetchFn: (u, i) => fetch(u, i),
    temCache: async (u) => (typeof caches === 'undefined' ? false : !!(await caches.match(u))),
    conexao: () => (navigator as unknown as { connection?: ConexaoLike }).connection,
    estimar: async () => (navigator.storage?.estimate ? navigator.storage.estimate() : null),
    ocioso: (fn) => {
      const w = window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number };
      if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 3000 });
      else setTimeout(fn, 250);
    },
    swPronto: async () => {
      if (!('serviceWorker' in navigator)) return false;
      await navigator.serviceWorker.ready;
      return !!navigator.serviceWorker.controller;
    },
    ler: () => readLocal(STORAGE_KEYS.PREFETCH_ONBOARDING),
    gravar: (v) => { writeLocal(STORAGE_KEYS.PREFETCH_ONBOARDING, v); },
  };
}

/** Inicia o pré-download. Devolve `cancelar()` (com `.pronto`, promessa que resolve quando a fila acaba). Nunca lança. */
export function iniciarPrefetchOnboarding(over: Partial<DepsPrefetch> = {}): (() => void) & { pronto: Promise<void> } {
  const d = { ...depsReais(), ...over };
  let cancelado = false;
  const cancelar = () => { cancelado = true; };
  const conn = d.conexao();
  let modo: ModoPrefetch = escolherModo(conn);
  const aoTrocar = () => { modo = escolherModo(d.conexao()); };
  conn?.addEventListener?.('change', aoTrocar);
  const fim = () => { conn?.removeEventListener?.('change', aoTrocar); };

  const pronto = (async () => {
    try {
      if (!(await d.swPronto()) || cancelado) return;
      const res = await d.fetchFn('/prefetch-index.json', { cache: 'no-store' });
      if (!res.ok || (res.headers.get('content-type') ?? '').includes('text/html')) return;
      const indice = (await res.json()) as IndicePrefetch;
      if (!indice || indice.v !== 1 || !Array.isArray(indice.essencial)) return;
      let feito: { b?: string; m?: string } = {};
      try { feito = JSON.parse(d.ler() ?? '{}') ?? {}; } catch { feito = {}; }
      if (feito.b === indice.built && cobre(feito.m, modo)) return;
      const fila = montarFila(indice, 'tudo', orcamentoDe(await d.estimar()));
      const modoInicial = modo;
      let i = 0;
      let falhou = false;
      const um = async (): Promise<void> => {
        while (!cancelado) {
          const item = fila[i++];
          if (!item) return;
          if (!item.ess && modo !== 'tudo') return; // saiu do Wi-Fi: o resto da fila fica para outra vez
          if (!item.ess && modoInicial !== 'tudo') return;
          await new Promise<void>((ok) => d.ocioso(ok));
          if (cancelado) return;
          try {
            if (await d.temCache(item.url)) continue;
            const r = await d.fetchFn(item.url, { priority: 'low' } as RequestInit);
            if (r.ok) await r.blob(); else falhou = true;
          } catch { falhou = true; }
        }
      };
      await Promise.all(Array.from({ length: PARALELO }, um));
      if (!cancelado && !falhou) d.gravar(JSON.stringify({ b: indice.built, m: modoInicial === 'tudo' && modo === 'tudo' ? 'tudo' : 'essencial' }));
    } catch { /* melhor-esforço: o app não depende disto */ } finally { fim(); }
  })();

  if (typeof window !== 'undefined') window.addEventListener('pagehide', cancelar, { once: true });
  return Object.assign(() => { cancelar(); fim(); }, { pronto });
}
