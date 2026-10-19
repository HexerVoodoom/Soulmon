/**
 * "Abrir o Mercado > Frames" a partir do Perfil (D-16, 19/10/2026): a moldura NÃO se compra no Editar perfil — a compra
 * mora só na lojinha de Background do Mercado, aba Frames. O Perfil só PEDE a navegação.
 *
 * O pedido vai por evento de janela (e não por prop) porque o `ProfileEditor` mora dentro da `SettingsPage`, que não passa
 * callback de navegação; quem escuta é o `App`, dono da navegação (`goTo` + `pendingSheet`). `ProfileEditor` aceita também
 * `onOpenFrameShop` por prop, que tem prioridade quando o pai o fornece.
 */
export const OPEN_FRAME_SHOP_EVENT = 'soulmon:open-frame-shop';

export function requestOpenFrameShop(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(OPEN_FRAME_SHOP_EVENT));
}
