import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core';

/** Cor de fundo de cada tema = `--sm-bg` (src/index.css). A faixa do topo
 *  (barra de status / chrome do PWA) pinta com ela para parecer continuação
 *  da tela, não um recorte. Se o `--sm-bg` mudar, mude aqui (teste cobre). */
export const STATUS_BAR_BG = { light: '#f3f9f8', dark: '#0e2323' } as const;

/**
 * Sincroniza a faixa do sistema com o tema resolvido:
 *  · `meta theme-color` (PWA/Chrome): UMA tag sem `media`, para o tema do app
 *    mandar mesmo quando difere do tema do SO.
 *  · APK: `SystemBars.setStyle` (core do Capacitor 8, já no APK instalado),
 *    ícones claros no tema escuro e escuros no claro. Feature detect: se o
 *    plugin faltar, não faz nada (o APK antigo segue como estava).
 */
export function applyStatusBarTheme(theme: 'light' | 'dark'): void {
  if (typeof document === 'undefined') return;
  const color = STATUS_BAR_BG[theme];
  const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
  const [first, ...rest] = metas;
  rest.forEach((m) => m.remove());
  const meta = first ?? document.head.appendChild(Object.assign(document.createElement('meta'), { name: 'theme-color' }));
  meta.removeAttribute('media');
  meta.content = color;

  try {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('SystemBars')) {
      // Style.Dark = "conteúdo claro sobre fundo escuro".
      void SystemBars.setStyle({
        style: theme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
        bar: SystemBarType.StatusBar,
      }).catch(() => {});
    }
  } catch {
    /* cosmético: nunca derruba o app */
  }
}
