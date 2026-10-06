/**
 * COMBATE v3 — a arte dos FX de status e do círculo de cast, carregada SOB DEMANDA (PR11, run `combate-v3-01`).
 *
 * `import.meta.glob` SEM `eager`: cada PNG vira um módulo de uma linha que só baixa quando alguém pede o id.
 * Nada disso entra no chunk de entrada (orçamento de bytes: `src/deploy/orcamentoDeBytes.contract.test.ts`).
 * Só a arte que já está na `main` (decisão do dono: sem arte nova): os glifos `st-*`, as folhas de loop
 * `fx-*-loop-sheet`, o `fx-cast-circle`, mais `fx-heal` e `fx-shield` de `assets/soulmon/fx`.
 * Sem a peça (ou se o download falhar) a função devolve `undefined` e quem desenha cai no fallback em CSS —
 * nunca lança, nunca bloqueia a luta.
 */
type Loader = () => Promise<string>;

const FILES = {
  ...(import.meta.glob(
    ['../assets/soulmon/combate-v3/status/st-*.png', '../assets/soulmon/combate-v3/fx/fx-*-loop-sheet.png', '../assets/soulmon/combate-v3/fx/fx-cast-circle.png'],
    { import: 'default' },
  ) as Record<string, Loader>),
  ...(import.meta.glob(['../assets/soulmon/fx/fx-heal.png', '../assets/soulmon/fx/fx-shield.png'], { import: 'default' }) as Record<string, Loader>),
} as Record<string, Loader>;

const LOADERS = new Map<string, Loader>();
for (const [path, loader] of Object.entries(FILES)) {
  const m = /\/([^/]+)\.png$/.exec(path);
  if (m) LOADERS.set(m[1], loader);
}

const cache = new Map<string, string | undefined>();
const pending = new Map<string, Promise<string | undefined>>();

/** Os ids que existem (para os testes e o guard de instalação). */
export const COMBAT_V3_ART_IDS: readonly string[] = [...LOADERS.keys()].sort();

/** A URL já carregada, ou `undefined` (ainda não pedida, em voo, ou sem a peça). */
export function combatV3ArtNow(id: string): string | undefined {
  return cache.get(id);
}

/** Pede a peça: resolve com a URL, ou `undefined` sem a peça/com falha de rede (e nunca rejeita). */
export function loadCombatV3Art(id: string): Promise<string | undefined> {
  if (cache.has(id)) return Promise.resolve(cache.get(id));
  const hit = pending.get(id);
  if (hit) return hit;
  const loader = LOADERS.get(id);
  if (!loader) { cache.set(id, undefined); return Promise.resolve(undefined); }
  const p = loader().then(
    (url) => { cache.set(id, url); pending.delete(id); return url; },
    () => { pending.delete(id); return undefined; }, // falha de rede: não grava no cache, a próxima tentativa refaz
  );
  pending.set(id, p);
  return p;
}

/** Só para testes: esvazia o cache. */
export function resetCombatV3ArtCache(): void { cache.clear(); pending.clear(); }
