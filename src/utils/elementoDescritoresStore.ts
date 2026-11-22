/**
 * Tabela de descritores visuais por elemento (`elementoDescritores.data.ts`, ~50 KB) FORA do chunk de entrada
 * (orçamento de bytes, REGISTRO §380): o dado vive atrás de `import()`; este módulo é o ponteiro minúsculo que a entrada importa.
 * Antes de a carga terminar a tabela é vazia (`pistasVisuaisDoElemento` devolve só o nome); `carregarDescritoresElemento()` é
 * disparada no boot e quem GERA prompt de sprite a espera (`await`) para não perder as pistas. Nos testes o `setupFiles` registra
 * a tabela já pronta (`vitest.setup.descritores.ts`), então o código síncrono continua determinístico.
 */
import type { DescritorElemento } from './elementoDescritores.data';

let tabela: Readonly<Record<string, DescritorElemento>> = {};
let carga: Promise<void> | undefined;
const ouvintes = new Set<() => void>();

export const descritorDoElemento = (id: string): DescritorElemento | undefined => tabela[id];
export const descritoresCarregados = (): boolean => Object.keys(tabela).length > 0;

export function registrarDescritoresElemento(t: Readonly<Record<string, DescritorElemento>>): void {
  tabela = t;
  carga = Promise.resolve();
  ouvintes.forEach(f => f());
}

/** Idempotente: a 1ª chamada dispara o `import()`, as seguintes devolvem a mesma promessa. */
export function carregarDescritoresElemento(): Promise<void> {
  carga ??= import('./elementoDescritores.data')
    .then(m => registrarDescritoresElemento(m.DESCRITORES_ELEMENTO))
    .catch(() => { carga = undefined; });
  return carga;
}

/** Avisa quando a tabela chegar (o `useMemo` do App recalcula os prompts). Devolve o cancelamento. */
export function aoCarregarDescritores(f: () => void): () => void {
  ouvintes.add(f);
  return () => { ouvintes.delete(f); };
}
