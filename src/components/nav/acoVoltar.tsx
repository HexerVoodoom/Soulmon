import { createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';

/**
 * VOLTAR NO MEDALHÃO (decisão do dono, 23/11/2026, Hexsmith): na moldura de AÇO (`AreaSheet moldura="aco"`) o VOLTAR das telas internas mora no
 * medalhão ESQUERDO da barra de título (e o ✕ do modal principal no DIREITO), nunca solto no corpo. A `AreaSheet` abre este contexto; o
 * `ModalSheet` com `onBack` dentro dela PUBLICA o handler (pilha: o último registrado é o nível de cima) e deixa de desenhar a própria seta.
 */
export interface AcoVoltarCtx {
  /** Handler mais recente de cada camada (por ref: lambda nova a cada render não re-renderiza ninguém). */
  fns: Map<string, () => void>;
  push: (id: string) => void;
  drop: (id: string) => void;
}

const Ctx = createContext<AcoVoltarCtx | null>(null);
export const AcoVoltarProvider = Ctx.Provider;
export const useAcoVoltar = (): AcoVoltarCtx | null => useContext(Ctx);

/** Lado da `AreaSheet`: o contexto estável + o Voltar do TOPO da pilha (ou `null` sem tela interna). */
export function useAcoVoltarPilha(): { ctx: AcoVoltarCtx; voltar: (() => void) | null } {
  const [ids, setIds] = useState<string[]>([]);
  const fns = useRef(new Map<string, () => void>()).current;
  const ctx = useMemo<AcoVoltarCtx>(() => ({
    fns,
    push: (id) => setIds((p) => (p.includes(id) ? p : [...p, id])),
    drop: (id) => { fns.delete(id); setIds((p) => p.filter((x) => x !== id)); },
  }), [fns]);
  const topo = ids[ids.length - 1];
  return { ctx, voltar: topo ? () => fns.get(topo)?.() : null };
}

/** Lado do `ModalSheet`: publica `fn` enquanto `ativo`. */
export function useAcoVoltarRegistro(ctx: AcoVoltarCtx | null, fn: (() => void) | undefined, ativo: boolean) {
  const id = useId();
  if (ctx && ativo && fn) ctx.fns.set(id, fn);
  useLayoutEffect(() => {
    if (!ctx || !ativo) return;
    ctx.push(id);
    return () => ctx.drop(id);
  }, [ctx, ativo, id]);
  useEffect(() => { if (ctx && ativo && fn) ctx.fns.set(id, fn); });
}
