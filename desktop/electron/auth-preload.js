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
const { expDoJwtMs } = require('./jwtExp.js');

/**
 * Validade do ID token do Firebase por contrato do SDK: 1h. Só usada quando o
 * app não manda `expiresAt` legível E o próprio token não traz `exp` legível
 * (`jwtExp.js`, QA rodada 2 §10). Validade DESCONHECIDA é "vence em 1h",
 * nunca "nunca vence": até 22/09/2026 ela colapsava em `exp: 0` e `main.js` ›
 * `auth-get` lia zero como sessão eterna (QA rodada 1 §5).
 */
const DEFAULT_TOKEN_TTL_MS = 60 * 60 * 1000;

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
    const exp = Number(payload.expiresAt);
    ipcRenderer.send('auth-token', {
      token: payload.token,
      email: payload.email ?? '',
      // Ordem: `expiresAt` do app → `exp` do próprio JWT → 1h. NaN/ausente/0/
      // negativo NÃO viram "nunca expira".
      exp: Number.isFinite(exp) && exp > 0
        ? exp
        : (expDoJwtMs(payload.token) ?? Date.now() + DEFAULT_TOKEN_TTL_MS),
    });
  },
});
