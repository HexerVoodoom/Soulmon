import { Suspense, lazy, type ComponentProps, type ComponentType } from 'react';

/**
 * Sobreposição que só aparece sob condição (banner, toast, folha): sai do JS de
 * entrada e carrega no primeiro uso, sem fallback visível. Mesma API do componente.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyOverlay<C extends ComponentType<any>>(load: () => Promise<{ default: C }>): ComponentType<ComponentProps<C>> {
  const Inner = lazy(load);
  return function LazyOverlay(props: ComponentProps<C>) {
    return <Suspense fallback={null}><Inner {...props} /></Suspense>;
  };
}
