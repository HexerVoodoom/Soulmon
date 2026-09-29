import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { viewBack, type ViewType } from '../navigation';
import { closeTopBackLayer } from './backStack';

/**
 * Botão físico de VOLTAR do Android (`@capacitor/app`, evento `backButton`).
 *
 * O grafo é `viewBack` (`navigation.ts`) — o MESMO do voltar da tela e do
 * `popstate`; aqui só se decide o que fazer com a resposta:
 *  - há uma camada aberta por cima da tela (folha de lote, minijogo —
 *    `backStack.ts`): fecha ela e só; o voltar volta DENTRO do jogo;
 *  - há para onde voltar (área → Mapa → Home, página do menu → Home):
 *    chama `goBack`, que é o voltar da tela;
 *  - Home (`viewBack` = `null`): NÃO FAZ NADA (decisão do dono, 29/09/2026 —
 *    o voltar fechava/minimizava o app no meio do jogo). Registrar o listener
 *    já desliga o padrão do Capacitor, então ignorar o evento basta.
 *
 * Só registra em plataforma NATIVA: na web/PWA o voltar é do navegador e cai
 * no `popstate` do `App.tsx`. Devolve a função de limpeza (para o `useEffect`).
 */
export function registerAndroidBack(
  getView: () => ViewType,
  goBack: () => void,
): () => void {
  if (!Capacitor.isNativePlatform()) return () => {};

  let vivo = true;
  let handle: { remove: () => Promise<void> | void } | undefined;

  Promise.resolve(
    App.addListener('backButton', () => {
      if (closeTopBackLayer()) return;
      if (viewBack(getView()) !== null) goBack();
    }),
  )
    .then(h => { if (vivo) handle = h; else void h.remove(); })
    .catch(() => { /* plugin ausente num APK antigo: fica o padrão do sistema */ });

  return () => {
    vivo = false;
    void handle?.remove();
  };
}
