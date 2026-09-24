import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { viewBack, type ViewType } from '../navigation';

/**
 * Botão físico de VOLTAR do Android (`@capacitor/app`, evento `backButton`).
 *
 * O grafo é `viewBack` (`navigation.ts`) — o MESMO do voltar da tela e do
 * `popstate`; aqui só se decide o que fazer com a resposta:
 *  - há para onde voltar (área → Mapa → Home, página do menu → Home):
 *    chama `goBack`, que é o voltar da tela;
 *  - Home (`viewBack` = `null`): devolve ao SISTEMA — `minimizeApp()`, que é
 *    o comportamento padrão do Android 12+ (mandar a tarefa para trás), e
 *    `exitApp()` se o minimizar falhar. Registrar o listener DESLIGA o padrão
 *    do Capacitor, então sem este ramo o voltar na Home travaria o app.
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
      if (viewBack(getView()) !== null) {
        goBack();
        return;
      }
      App.minimizeApp().catch(() => App.exitApp());
    }),
  )
    .then(h => { if (vivo) handle = h; else void h.remove(); })
    .catch(() => { /* plugin ausente num APK antigo: fica o padrão do sistema */ });

  return () => {
    vivo = false;
    void handle?.remove();
  };
}
