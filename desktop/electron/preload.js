const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('soulmonDesktop', {
  /** Liga/desliga o click-through do overlay: true = mouse interage com o pet. */
  setInteractive: (on) => ipcRenderer.send('set-interactive', !!on),
  /** Abre a janela de menu perto do pet (centerX = centro do pet na tela, em px do overlay). */
  openMenu: (centerX) => ipcRenderer.send('open-menu', centerX),
  /** Minimiza só a janela do menu (não fecha o app). */
  minimizeMenu: () => ipcRenderer.send('menu-minimize'),
  openFullApp: () => ipcRenderer.send('open-full-app'),
  /** Fecha o app inteiro (overlay + menu + bandeja). */
  quit: () => ipcRenderer.send('app-quit'),
  /** Chamado quando uma atualização já foi baixada e será instalada ao sair. */
  onUpdateReady: (cb) => ipcRenderer.on('update-ready', () => cb()),
  /** Avisa que o estado (localStorage) mudou, pra outras janelas recarregarem. */
  notifyStateChanged: () => ipcRenderer.send('state-changed'),
  onStateChanged: (cb) => ipcRenderer.on('state-changed', () => cb()),
  /** Menu disparou uma ação (carinho/comida/banho/tarefa) — overlay mostra a animação. */
  sendEffect: (emoji, phrase) => ipcRenderer.send('pet-effect', emoji, phrase),
  onEffect: (cb) => ipcRenderer.on('pet-effect', (_e, emoji, phrase) => cb(emoji, phrase)),
  /**
   * Sessão autenticada capturada na janela do app completo (auth-preload.js).
   * Resolve null quando não há login ou quando o token já expirou — o
   * renderer trata isso como "precisa logar" em vez de mandar uma chamada
   * que o servidor recusaria com 403.
   */
  getAuth: () => ipcRenderer.invoke('auth-get'),
  onAuthChanged: (cb) => ipcRenderer.on('auth-changed', (_e, session) => cb(session)),
  /**
   * 410 `account-deleted` (QA rodada 2): a conta foi apagada pelo app; o
   * overlay descarta a sessão para não continuar mandando token de uma conta
   * que não existe. Canal próprio (`auth-clear`), porque `auth-token` só
   * aceita a janela do app completo como remetente.
   */
  clearAuth: () => ipcRenderer.send('auth-clear'),
});
