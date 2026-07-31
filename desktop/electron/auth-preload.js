// Preload da janela do app web completo — ponte de LOGIN do desktop.
//
// Por que existe: quando `FIREBASE_PROJECT_ID` estiver definido no servidor,
// /api/save e /api/entitlements passam a exigir um ID token do Firebase. O
// overlay não tem SDK de auth próprio (e um fluxo de link de e-mail dentro de
// uma janela sem barra de endereço seria horrível). Então reaproveitamos o
// login que o app web já sabe fazer: esta janela loga normalmente e devolve o
// token para o processo principal, que o repassa ao overlay.
//
// Segurança: só expomos um canal de SAÍDA (`publish`). Esta ponte não permite
// que a página leia nada do Electron nem execute nada no processo principal —
// e o token vai só para a memória do main process, nunca para disco.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('soulmonDesktopAuth', {
  /** Marca de presença: o app web usa isto pra saber que roda no desktop. */
  isDesktop: true,
  /**
   * @param {{ token: string|null, email?: string|null, expiresAt?: number }} payload
   *   `null` em token = deslogou.
   */
  publish(payload) {
    if (!payload || typeof payload.token !== 'string') {
      ipcRenderer.send('auth-token', null);
      return;
    }
    ipcRenderer.send('auth-token', {
      token: payload.token,
      email: payload.email ?? '',
      exp: Number(payload.expiresAt) || 0,
    });
  },
});
