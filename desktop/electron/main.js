// Soulmon Desktop — processo principal do Electron.
// Cria uma faixa transparente, sempre no topo, encostada na barra de tarefas
// do Windows. O pet anda nessa faixa; a janela é "click-through" (cliques
// atravessam para o que estiver embaixo) exceto quando o mouse está sobre o
// pet — o renderer avisa via IPC ('set-interactive'). Clicar no pet abre uma
// janela separada com o menu de ações.
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { autoUpdater } = require('electron-updater');
// A DECISAO de quem pode navegar e de quem pode publicar token mora fora deste
// arquivo, em `navigationPolicy.js`, porque este aqui nao e importavel por
// teste nenhum (cria janela no corpo do modulo). Ver o cabecalho de la e
// `renderer/src/navigationPolicy.test.ts`. Aqui fica so a fiacao.
const { appOrigin, decideNavigation, decideWindowOpen, isTrustedAuthSender } = require('./navigationPolicy.js');

// Builds de Steam (ver `npm run dist:steam` + desktop/STEAM.md) marcam
// package.json com steamBuild:true via extraMetadata do electron-builder.
// Nessa variante o auto-update via GitHub Releases fica DESLIGADO — a
// atualização passa a ser responsabilidade do SteamPipe (senão os dois
// mecanismos brigariam pelo mesmo binário).
// A leitura da marcacao e a decisao "pode se auto-atualizar?" moram em
// `updatePolicy.js`, testadas em `renderer/src/updatePolicy.test.ts`. A
// comparacao estrita `=== true` que vivia aqui falhava para o lado PERIGOSO
// se a marcacao chegasse como string: o build de Steam se auto-atualizaria
// pelo GitHub por cima do SteamPipe. Ver o cabecalho de updatePolicy.js.
const { shouldAutoUpdate } = require('./updatePolicy.js');
const pkgEmpacotado = require('../package.json');

// Altura da faixa: 72 — a criatura a 64 (384 ÷ 6, escala inteira) rente ao
// chão e o balão AO LADO dela, não em cima (canvas Fora do app, D-F7/D-F8;
// era 180 com o pet a 96, que não é divisor inteiro de 384). O menu é uma
// janela própria (ver createMenuWindow), não precisa caber aqui.
const STRIP_HEIGHT = 72;
const PET_SIZE = 64; // mesma constante do renderer (main.ts)
// URL do app web completo — o worker próprio do Soulmon (a mesma das três
// fontes: capacitor.config.json, desktop/renderer/src/config.ts e aqui; régua
// `src/deploy/appUrl.contract.test.ts`). Trocar nas três quando o domínio
// próprio existir.
const FULL_APP_URL = process.env.SOULMON_APP_URL || 'https://soulmon.mateus-sprnd.workers.dev';
// Origem confiavel derivada da URL acima. Como `SOULMON_APP_URL` e env var,
// `appOrigin` recusa o que nao for `https:` (ou `http:` em localhost) e cai no
// default — sem isso uma env com `file:` daria origem opaca ('null') e a
// checagem aceitaria qualquer origem opaca.
const APP_ORIGIN = appOrigin(FULL_APP_URL);
// O CARD do menu mede 340×520 (canvas Fora do app, X4: 480 de altura com
// conta, cabe nos 520). A janela é o card + `MENU_SHADOW` de cada lado, que é
// onde a sombra e os cantos arredondados aparecem sobre o desktop (o body do
// menu.css tem o mesmo padding — mude os dois juntos).
const MENU_CARD = { width: 340, height: 520 };
const MENU_SHADOW = 12;
const MENU_SIZE = { width: MENU_CARD.width + 2 * MENU_SHADOW, height: MENU_CARD.height + 2 * MENU_SHADOW };

/** @type {BrowserWindow | null} */
let overlayWin = null;
/** @type {BrowserWindow | null} */
let menuWin = null;
/** @type {BrowserWindow | null} */
let fullAppWin = null;
/** @type {Tray | null} */
let tray = null;
/**
 * ID token do Firebase capturado da janela do app completo (ver
 * auth-preload.js). Guardado só em memória: expira em ~1h e é reemitido pelo
 * SDK dentro daquela janela, que reenvia por IPC. Nunca vai pra disco.
 * @type {{ token: string, email: string, exp: number } | null}
 */
let authSession = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (overlayWin) overlayWin.showInactive();
  });

  app.whenReady().then(() => {
    createOverlay();
    createTray();
    screen.on('display-metrics-changed', positionOverlay);
    screen.on('display-added', positionOverlay);
    screen.on('display-removed', positionOverlay);

    // Primeiro lançamento: abre o menu sozinho. Sem isso o app "não faz nada"
    // ao abrir — o pet aparece numa faixa fina da barra de tarefas e o usuário
    // não tem como adivinhar que precisa clicar nele. Na Steam isso é pior
    // ainda: clicou em "Jogar" e nenhuma janela apareceu.
    if (isFirstRun()) setTimeout(() => createMenuWindow(), 1200);

    if (shouldAutoUpdate({ isPackaged: app.isPackaged, pkg: pkgEmpacotado })) {
      checkForUpdates();
      setInterval(checkForUpdates, 4 * 60 * 60 * 1000); // a cada 4h
    }
  });
}

/**
 * É a primeira vez que este app roda nesta máquina?
 *
 * Marca com um arquivo em `userData` (e não no localStorage) porque quem
 * decide é o processo principal, antes de qualquer janela existir. Erro de
 * escrita = trata como "não é primeira vez": abrir o menu à toa toda vez
 * incomodaria mais do que não abrir.
 */
function isFirstRun() {
  try {
    const marker = path.join(app.getPath('userData'), 'first-run-done');
    if (fs.existsSync(marker)) return false;
    fs.writeFileSync(marker, new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}

function checkForUpdates() {
  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // Sem internet ou sem release publicado ainda — silencioso, tenta de novo depois.
  });
}

// Baixa sozinho e instala na próxima vez que o app fechar — nunca precisa
// baixar/rodar o instalador de novo manualmente a partir do GitHub. (Só na
// build normal — na build de Steam isso nunca é chamado, ver shouldAutoUpdate.)
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.on('update-downloaded', () => {
  if (overlayWin) overlayWin.webContents.send('update-ready');
});

function positionOverlay() {
  if (!overlayWin) return;
  // workArea exclui a barra de tarefas → o rodapé da janela encosta no topo
  // da barra, e o pet "anda em cima" dela como se fosse o chão.
  const wa = screen.getPrimaryDisplay().workArea;
  overlayWin.setBounds({
    x: wa.x,
    y: wa.y + wa.height - STRIP_HEIGHT,
    width: wa.width,
    height: STRIP_HEIGHT,
  });
}

function createOverlay() {
  const wa = screen.getPrimaryDisplay().workArea;
  overlayWin = new BrowserWindow({
    x: wa.x,
    y: wa.y + wa.height - STRIP_HEIGHT,
    width: wa.width,
    height: STRIP_HEIGHT,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 'screen-saver' fica acima de (quase) tudo, inclusive da própria taskbar.
  overlayWin.setAlwaysOnTop(true, 'screen-saver');
  overlayWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  // Começa deixando tudo atravessar; forward:true mantém os mousemove
  // chegando ao renderer (só funciona no Windows — nosso alvo).
  overlayWin.setIgnoreMouseEvents(true, { forward: true });

  overlayWin.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'));
  overlayWin.once('ready-to-show', () => overlayWin.showInactive());
  overlayWin.on('closed', () => { overlayWin = null; });
}

/**
 * @param {number|undefined} petCenterX Centro do pet em coordenadas do overlay
 *   (0..workArea.width), mandado pelo renderer no clique. Undefined = centraliza.
 */
function createMenuWindow(petCenterX) {
  if (menuWin) {
    positionMenuNearPet(petCenterX);
    menuWin.show();
    menuWin.focus();
    return;
  }
  menuWin = new BrowserWindow({
    width: MENU_SIZE.width,
    height: MENU_SIZE.height,
    frame: false,
    resizable: false,
    show: false,
    skipTaskbar: false,
    // Transparente pra CSS desenhar cantos arredondados + sombra própria
    // (janela quadrada por baixo ficaria visível atrás do card arredondado).
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'Soulmon',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  positionMenuNearPet(petCenterX);

  menuWin.loadFile(path.join(__dirname, '..', 'dist-renderer', 'menu.html'));
  menuWin.once('ready-to-show', () => menuWin.show());
  menuWin.on('closed', () => { menuWin = null; });
}

/** Abre a janela colada no pet: horizontalmente centrada nele, encostada
 * logo acima do sprite (em vez do canto fixo da tela). */
function positionMenuNearPet(petCenterX) {
  if (!menuWin) return;
  const wa = screen.getPrimaryDisplay().workArea;
  const centerX = wa.x + (petCenterX ?? wa.width / 2);
  const x = Math.round(
    Math.min(Math.max(centerX - MENU_SIZE.width / 2, wa.x + 8), wa.x + wa.width - MENU_SIZE.width - 8),
  );
  const petTop = wa.y + wa.height - PET_SIZE;
  const y = Math.round(Math.max(wa.y + 8, petTop - MENU_SIZE.height - 8));
  menuWin.setBounds({ x, y, width: MENU_SIZE.width, height: MENU_SIZE.height });
}

function createTray() {
  const icon = nativeImage
    .createFromPath(path.join(__dirname, 'assets', 'icon.png'))
    .resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Soulmon');
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Mostrar/ocultar pet',
      click: () => {
        if (!overlayWin) return;
        overlayWin.isVisible() ? overlayWin.hide() : overlayWin.showInactive();
      },
    },
    { label: 'Abrir menu', click: () => createMenuWindow() },
    { label: 'Abrir Soulmon completo', click: openFullApp },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() },
  ]));
  tray.on('click', () => createMenuWindow());
}

function openFullApp() {
  if (fullAppWin) {
    fullAppWin.focus();
    return;
  }
  // O app web completo (mesmo do celular). Além de ser o app inteiro, esta
  // janela é o nosso fluxo de LOGIN: o auth-preload observa o Firebase Auth
  // lá dentro e devolve o ID token por IPC (ver docs/PLANO-DESKTOP-STEAM.md,
  // fase 2c). Sem isso, quando o servidor passar a exigir token, o overlay
  // pararia de sincronizar sem ter como se autenticar.
  fullAppWin = new BrowserWindow({
    width: 480,
    height: 860,
    title: 'Soulmon',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'auth-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Partição persistente: o login sobrevive a fechar/reabrir a janela.
      partition: 'persist:soulmon-app',
    },
  });
  // F-2 da auditoria: o preload e propriedade da JANELA, nao da URL. Sem as
  // duas travas abaixo, qualquer navegacao para fora entregaria
  // `window.soulmonDesktopAuth` para a origem nova — que entao publicaria o
  // token DELA e desviaria os dados da vitima para a conta do atacante.
  // `will-redirect` junto com `will-navigate` porque redirecionamento de
  // servidor (302 para outra origem) NAO passa por `will-navigate`.
  for (const evento of ['will-navigate', 'will-redirect']) {
    fullAppWin.webContents.on(evento, (event, url) => {
      const decisao = decideNavigation(url, APP_ORIGIN);
      if (decisao.allow) return;
      event.preventDefault();
      if (decisao.openExternal) shell.openExternal(decisao.openExternal);
    });
  }
  // `target="_blank"` do app vira `window.open` aqui. Nunca abre dentro do
  // Electron: seria uma janela sem barra de endereco (e, sem handler, com
  // heranca de preload). Vai para o navegador do sistema, onde o usuario ve
  // para onde foi.
  fullAppWin.webContents.setWindowOpenHandler(({ url }) => {
    const decisao = decideWindowOpen(url);
    if (decisao.openExternal) shell.openExternal(decisao.openExternal);
    return { action: 'deny' };
  });
  fullAppWin.loadURL(FULL_APP_URL);
  fullAppWin.on('closed', () => { fullAppWin = null; });
}

ipcMain.on('set-interactive', (_e, on) => {
  if (!overlayWin) return;
  overlayWin.setIgnoreMouseEvents(!on, { forward: true });
});

ipcMain.on('open-menu', (_event, petCenterX) => createMenuWindow(petCenterX));
ipcMain.on('open-full-app', openFullApp);
// Fecha o APP inteiro (overlay + menu + tray) — não só a janela do menu.
ipcMain.on('app-quit', () => app.quit());
// Minimiza só a janela do menu (vira ícone na barra de tarefas do Windows).
ipcMain.on('menu-minimize', () => { menuWin?.minimize(); });
// Estado mudou numa janela (menu) — avisa o overlay pra recarregar e refletir
// o sprite/hearts atualizados sem precisar reiniciar o app.
ipcMain.on('state-changed', (event) => {
  for (const win of [overlayWin, menuWin]) {
    if (win && win.webContents !== event.sender) win.webContents.send('state-changed');
  }
});
// Ação feita no menu (carinho/comida/banho/tarefa) — overlay toca a animação.
ipcMain.on('pet-effect', (_event, emoji, phrase) => {
  if (overlayWin) overlayWin.webContents.send('pet-effect', emoji, phrase);
});

// ------------------------------------------------------------------ auth
// A janela do app completo manda o ID token sempre que ele muda/renova.
ipcMain.on('auth-token', (event, payload) => {
  // O `auth-preload` so expoe canal de SAIDA, entao ninguem LE o token por
  // aqui — o risco e o inverso: injetar o token de OUTRA conta e fazer o
  // overlay da vitima sincronizar para ela. Por isso a checagem e de ORIGEM,
  // nao de formato: payload perfeito de origem errada e exatamente o ataque.
  // `senderFrame` e nao `sender` porque um <iframe> de terceiro compartilha o
  // `sender` da janela mas tem URL propria.
  const senderUrl = event.senderFrame ? event.senderFrame.url : undefined;
  if (!isTrustedAuthSender(senderUrl, APP_ORIGIN)) return;
  // `exp` é normalizado AQUI também (o preload já faz, mas a defesa fica nos
  // dois lados): validade ilegível = 1h a partir de agora (contrato do SDK do
  // Firebase), NUNCA 0 — zero era lido como "sessão eterna" (QA rodada 1 §5).
  const expBruto = payload ? Number(payload.exp) : Number.NaN;
  const exp = Number.isFinite(expBruto) && expBruto > 0 ? expBruto : Date.now() + 60 * 60 * 1000;
  authSession = payload && payload.token
    ? { token: String(payload.token), email: String(payload.email ?? ''), exp }
    : null;
  for (const win of [overlayWin, menuWin]) {
    win?.webContents.send('auth-changed', authSession ? { email: authSession.email } : null);
  }
});
// Overlay/menu perguntam o token na hora de sincronizar. Devolve null se
// expirou — o renderer trata como "não autenticado" e pede login de novo.
ipcMain.handle('auth-get', () => {
  if (!authSession) return null;
  // exp é SEMPRE > 0 depois da normalização acima; sem `&&` para nenhum zero
  // passar como "nunca expira" (guard textual em authBridge.test.ts).
  if (Date.now() >= authSession.exp - 30_000) return null;
  return authSession;
});

app.on('window-all-closed', () => {
  // Overlay é o app: fechar tudo = sair (sem comportamento macOS de ficar vivo).
  app.quit();
});
