import { Suspense, lazy, type ComponentType } from 'react';

/**
 * Sobreposição que só aparece sob condição (banner, toast, folha): sai do JS de
 * entrada e carrega no primeiro uso, sem fallback visível. Mesma API do componente.
 */
export function lazyOverlay<P extends object>(load: () => Promise<{ default: ComponentType<P> }>): ComponentType<P> {
  const Inner = lazy(load);
  return function LazyOverlay(props: P) {
    return <Suspense fallback={null}><Inner {...props} /></Suspense>;
  };
}
