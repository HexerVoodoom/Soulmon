// Janela de menu do pet (frame:false + chrome falso em menu.html/menu.css).
// O menu é o APARELHO (canvas Fora do app, FORA-07..11): barra de título com a
// chama + wordmark e três botões de 44 — `settings` (configurações),
// `expand_more` (minimizar só esta janela — `minimize` não está no subset da
// fonte, R2) e `close` (o app inteiro — overlay + bandeja).
import './menu.css';
// O Z de dormir: quadro 3 de `anim-sleep-z` (64²) a 1× no canto do vidro (X3).
import sleepZ from '../../../src/assets/soulmon/fx/anim-sleep-z.png';
import { petSprite } from './sprites';
import {
  loadState, saveState, foodCount, firstFood, formatLastSync,
  type DesktopState,
} from './state';
import {
  fetchRemoteSnapshot, isAuthRequired, pushCareAction, fetchWallet,
  type RemoteSnapshot, type Wallet,
} from './cloudSync';
// As regras vêm do app, não de uma cópia — é o motivo de careRules.ts existir.
import { completeTask, type FeedRefusal, type TaskState } from '../../../src/utils/careRules';
// A fronteira de cuidado mora em `care.ts`, e não aqui, porque este módulo toca
// o DOM no topo e por isso nenhum teste consegue importá-lo — foi assim que o
// teto de carinho ficou por aparelho sem ninguém ver. Ver o cabeçalho de lá.
import {
  remoteRub, remoteFeed, localRub, localFeed, remoteShower, remoteSleep, remoteWake,
} from './care';
import { eventPhrase } from './phrases';

const state: DesktopState = loadState();

/**
 * Sessão autenticada (vinda da janela do app web) e se o servidor a exige.
 * Enquanto não sabemos, assumimos que exige — assim a UI nunca oferece o campo
 * de e-mail livre por engano.
 */
let authRequired = true;
let session: SoulmonAuthSession | null = null;
/** Feedback da sincronização, mostrado no painel de Configurações. */
let syncMessage: { text: string; error: boolean } | null = null;
/** Carteira (mesma de todas as plataformas) — só leitura, null enquanto carrega. */
let wallet: Wallet | null = null;
const persist = () => {
  saveState(state);
  window.soulmonDesktop?.notifyStateChanged();
};
const t = (pt: string, en: string) => (state.language === 'pt-BR' ? pt : en);

const content = document.getElementById('content')!;

document.getElementById('btn-settings')!.addEventListener('click', () => { panel = 'settings'; render(); });
document.getElementById('btn-minimize')!.addEventListener('click', () => window.soulmonDesktop?.minimizeMenu());
document.getElementById('btn-close')!.addEventListener('click', () => window.soulmonDesktop?.quit());

/** Os nomes acessíveis da barra de título, no idioma do usuário (o HTML é estático). */
function labelTitlebar() {
  const set = (id: string, label: string) => {
    const b = document.getElementById(id)!;
    b.setAttribute('aria-label', label);
    b.title = label;
  };
  set('btn-settings', t('Configurações', 'Settings'));
  set('btn-minimize', t('Minimizar', 'Minimize'));
  set('btn-close', t('Fechar o Soulmon', 'Close Soulmon'));
}

type Panel = 'main' | 'tasks' | 'settings';
let panel: Panel = state.syncEmail ? 'main' : 'settings';
let status = '';

/** Um glifo da Material Symbols Rounded, pelado (nunca em box — regra do dono). */
function icon(name: string, size: 18 | 20 | 24 = 20, fill = false): HTMLSpanElement {
  const i = document.createElement('span');
  i.className = `ico i${size}${fill ? ' on' : ''}`;
  i.setAttribute('aria-hidden', 'true');
  i.textContent = name;
  return i;
}

/**
 * A linha de estado em Material 18 (D-F12): `favorite` cheio/contorno em `ink`
 * (o vazio é CONTORNO — nunca vermelho, nunca um coração preto cheio), `bolt`
 * + "N/M" tabular (só o ícone com zero — 13.16), `restaurant` + "×N".
 * Meio coração conta como contorno: ainda não é um coração inteiro.
 */
function statusLine(): HTMLParagraphElement {
  const p = document.createElement('p');
  p.className = 'stat2';
  const full = Math.floor(state.hearts);
  const hearts = document.createElement('span');
  hearts.className = 'hh';
  hearts.setAttribute('role', 'img');
  hearts.setAttribute('aria-label', t(`${full} de ${state.maxHearts} corações`, `${full} of ${state.maxHearts} hearts`));
  for (let i = 0; i < state.maxHearts; i++) hearts.appendChild(icon('favorite', 18, i < full));
  const dot = () => { const d = document.createElement('span'); d.className = 'dot'; d.textContent = '·'; return d; };
  const num = (text: string) => { const n = document.createElement('span'); n.className = 'num'; n.textContent = text; return n; };
  p.append(hearts, dot(), icon('bolt', 18, state.energy > 0));
  if (state.energy > 0) p.appendChild(num(`${state.energy}/${state.maxEnergy}`));
  p.append(dot(), icon('restaurant', 18), num(`×${foodCount(state.foodInventory)}`));
  return p;
}

/**
 * Botão de lista com glifo pelado à esquerda (D-F13). `label` vai por
 * `textContent`: nada vindo do save ou digitado passa por HTML.
 */
function button(iconName: string, label: string, onClick: () => void, kind: 'gho' | 'out' = 'gho'): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `btn ${kind} full left`;
  const text = document.createElement('span');
  text.className = 'sp';
  text.textContent = label;
  b.append(icon(iconName, 20), text);
  b.addEventListener('click', onClick);
  return b;
}

/** Célula da fileira de cuidado: ícone 24 pelado + Rubik 12 (D-F10/D-F12). */
function careButton(iconName: string, label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'cell';
  const text = document.createElement('span');
  text.textContent = label;
  b.append(icon(iconName, 24), text);
  b.addEventListener('click', onClick);
  return b;
}

function addBackHeader(title: string) {
  const header = document.createElement('div');
  header.className = 'panel-header';
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'iconbtn';
  back.setAttribute('aria-label', t('Voltar', 'Back'));
  back.appendChild(icon('chevron_left', 24));
  back.addEventListener('click', () => { panel = 'main'; render(); });
  const h = document.createElement('h3');
  h.className = 'panel-title';
  h.textContent = title;
  header.append(back, h);
  content.appendChild(header);
}

/** O corpo de um painel (coluna com 6 de vão, 12 nas laterais). */
function body(): HTMLDivElement {
  const pb = document.createElement('div');
  pb.className = 'pb';
  content.appendChild(pb);
  return pb;
}

function render() {
  content.innerHTML = '';
  labelTitlebar();
  if (panel === 'main') renderMain();
  else if (panel === 'tasks') renderTasks();
  else renderSettings();
}

function renderMain() {
  // textContent, não innerHTML: `stageName` vem do save remoto. Com innerHTML,
  // um save com HTML no nome executaria script DENTRO do renderer — que tem
  // acesso a `soulmonDesktop.getAuth()` e poderia vazar o token da conta.
  const stg = document.createElement('p');
  stg.className = 'stg';
  stg.textContent = state.stageName;
  content.appendChild(stg);

  const pb = body();
  if (!state.sleeping) pb.appendChild(statusLine());

  // O retrato: vidro 160×136 com a criatura a 128 (÷3), acordada e dormindo
  // no MESMO box — dormir escurece por filtro (X3), com o Z pixel no canto.
  const port = document.createElement('div');
  port.className = 'port';
  const ring = document.createElement('span');
  ring.className = 'ring';
  const screen = document.createElement('span');
  screen.className = 'screen';
  const img = document.createElement('img');
  img.src = petSprite(state.stage, state.demoCharacterId);
  img.alt = state.stageName;
  img.width = 128; img.height = 128;
  if (state.sleeping) img.classList.add('sleep');
  screen.appendChild(img);
  if (state.sleeping) {
    const zz = document.createElement('span');
    zz.className = 'zz';
    zz.setAttribute('aria-hidden', 'true');
    zz.style.backgroundImage = `url("${sleepZ}")`;
    screen.appendChild(zz);
  }
  const glass = document.createElement('span');
  glass.className = 'glass';
  screen.appendChild(glass);
  ring.appendChild(screen);
  port.appendChild(ring);
  pb.appendChild(port);

  const say = document.createElement('p');
  say.className = 'say';
  say.setAttribute('aria-live', 'polite');
  say.textContent = status;
  pb.appendChild(say);

  // Ações de cuidado (carinho/comida/banho/sono): ícones pelados 24 em células
  // 56, separadas do resto — tarefas/config são outra categoria.
  const careRow = document.createElement('div');
  careRow.className = 'care';
  careRow.append(
    careButton('volunteer_activism', t('Carinho', 'Pet'), doPet),
    careButton('restaurant', t('Comida', 'Feed'), doFeed),
    careButton('shower', t('Banho', 'Bath'), doShower),
    careButton(state.sleeping ? 'wb_sunny' : 'bedtime', state.sleeping ? t('Acordar', 'Wake') : t('Dormir', 'Sleep'), doSleepToggle),
  );
  pb.appendChild(careRow);

  // "Today's tasks" SEM dígito (REGISTRO 13.17): contar o que falta na porta
  // da lista é cobrança. O chevron diz que é uma lista.
  const tasksBtn = button('task_alt', t('Tarefas de hoje', "Today's tasks"), () => { panel = 'tasks'; render(); });
  const chev = icon('chevron_right', 20);
  chev.classList.add('chev');
  tasksBtn.appendChild(chev);
  pb.appendChild(tasksBtn);

  // Carinho e comida escrevem no save real quando há conta; tarefas ainda não
  // (as do desktop são livres, as do app vêm de atividades com agenda). Dizer
  // qual é qual evita o usuário achar que marcou a tarefa no celular também.
  const note = document.createElement('p');
  note.className = 'note';
  note.textContent = state.syncEmail
    ? t('Tudo aqui vale no celular também. Criar e editar tarefas é no app.',
      'Everything here also counts on your phone. Creating and editing tasks happens in the app.')
    : t('Conecte a sua conta para cuidar do pet e marcar tarefas daqui.',
      'Connect your account to care for your pet and check off tasks from here.');
  pb.appendChild(note);
}

function renderTasks() {
  addBackHeader(t('Tarefas de hoje', "Today's tasks"));
  const pb = body();

  if (!state.syncEmail) {
    const aviso = document.createElement('p');
    aviso.className = 'task-empty';
    aviso.textContent = t(
      'Conecte a sua conta para ver as tarefas do app aqui.',
      'Connect your account to see your app tasks here.',
    );
    pb.appendChild(aviso);
    return;
  }

  const list = document.createElement('div');
  list.className = 'task-list';
  if (state.tasks.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'task-empty';
    empty.textContent = t('Nada pendente por hoje!', 'Nothing left for today!');
    list.appendChild(empty);
  }
  for (const task of state.tasks) {
    // Cada tarefa é UMA linha de 44 que é o próprio checkbox (SIS-03, `.cb` 24):
    // o alvo é a linha inteira, não o quadradinho.
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'li';
    row.setAttribute('role', 'checkbox');
    row.setAttribute('aria-checked', 'false');
    row.disabled = completing !== null;
    row.addEventListener('click', () => doCompleteTask(task.id));
    const cb = document.createElement('span');
    cb.className = 'cb';
    const name = document.createElement('span');
    name.className = 't';
    // O emoji do nome é DADO do usuário — fica.
    name.textContent = `${task.emoji} ${task.name}`;
    // Sem botão de excluir: criar, editar e apagar tarefa é no app. Aqui só
    // dá pra marcar como feita — a agenda continua sendo dona da lista.
    row.append(cb, name);
    list.appendChild(row);
  }
  pb.appendChild(list);

  const nota = document.createElement('p');
  nota.className = 'note';
  nota.textContent = t(
    'Criar e editar tarefas é no app do celular.',
    'Creating and editing tasks happens in the phone app.',
  );
  pb.appendChild(nota);
}

/* A formatação saiu daqui para `state.ts` (`formatLastSync`), que é
   importável em teste — este arquivo não é. Ela também deixou de imprimir
   "Invalid Date" quando o `lastSyncAt` do localStorage está corrompido:
   `loadState` não valida campo, e data ilegível agora vira ausência de rótulo
   em vez de um rótulo quebrado. */
function lastSyncLabel(): string {
  return formatLastSync(state.lastSyncAt, state.language === 'pt-BR');
}

function renderSettings() {
  addBackHeader(t('Configurações', 'Settings'));
  const pb = body();

  pb.appendChild(button(
    'translate',
    t('Idioma: Português', 'Language: English'),
    () => { state.language = state.language === 'pt-BR' ? 'en' : 'pt-BR'; persist(); render(); },
  ));

  // A criatura NÃO é escolhida aqui: cada jogador tem uma linha evolutiva única
  // gerada pelo oráculo. Ela vem do save — a conta é o controle central desta
  // tela, não um extra.
  const hint = document.createElement('p');
  hint.className = 'field-hint';

  if (authRequired && session) {
    // Logado: o e-mail vem do token assinado, não é digitável.
    const who = document.createElement('p');
    who.className = 't b';
    who.textContent = session.email;
    const syncBtn = button('sync', t('Sincronizar agora', 'Sync now'), () => syncNow(session!.email), 'out');
    hint.textContent = lastSyncLabel()
      || t('Puxe o seu progresso do celular.', 'Pull your progress from the phone.');
    pb.append(who, syncBtn, hint);
  } else if (authRequired) {
    // Sem login não há o que sincronizar: o servidor recusaria a leitura.
    // Digitar um e-mail aqui só produziria um 403 sem explicação.
    const label = document.createElement('p');
    label.className = 't b';
    label.textContent = t('Entre na sua conta', 'Sign in to your account');
    const loginBtn = button('lock', t('Entrar com e-mail', 'Sign in with email'), () => window.soulmonDesktop?.openFullApp(), 'out');
    hint.textContent = t(
      'Abre o Soulmon completo para você entrar. Depois é só voltar aqui — a criatura do celular aparece sozinha.',
      'Opens the full Soulmon so you can sign in. Then come back — your phone creature shows up automatically.',
    );
    pb.append(label, loginBtn, hint);
  } else {
    // Modo de migração (servidor sem FIREBASE_PROJECT_ID): ainda aceita e-mail
    // digitado, porque é assim que o app web funciona hoje.
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.className = 'inp';
    emailInput.placeholder = t('voce@email.com', 'you@example.com');
    emailInput.setAttribute('aria-label', t('E-mail da sua conta Soulmon', 'Your Soulmon account email'));
    emailInput.value = state.syncEmail ?? '';
    const syncBtn = button('sync', t('Sincronizar agora', 'Sync now'), () => syncNow(emailInput.value), 'out');
    hint.textContent = lastSyncLabel()
      || t('Use o mesmo e-mail do celular para ver a sua criatura aqui.', 'Use the same email as the phone to see your creature here.');
    pb.append(emailInput, syncBtn, hint);
  }

  // O resultado da última sincronização tem prioridade sobre o texto padrão.
  // Erro é tinta `ink` 500, nunca vermelho (o overlay não tem `danger`).
  if (syncMessage) {
    hint.textContent = syncMessage.text;
    hint.className = syncMessage.error ? 'field-hint error' : 'field-hint';
    hint.setAttribute('role', syncMessage.error ? 'alert' : 'status');
  }

  if (wallet) {
    // A carteira numa linha: "Account · Full ·" + `diamond` em `credit-ink` + N
    // (a terceira moeda com o glifo próprio — Loja D-L11).
    const line = document.createElement('p');
    line.className = 'acct';
    const b = document.createElement('b');
    b.textContent = t('Conta', 'Account');
    const dot = () => { const d = document.createElement('span'); d.textContent = '·'; return d; };
    const tier = document.createElement('span');
    tier.textContent = wallet.tier === 'paid' ? t('Completa', 'Full') : 'Demo';
    const n = document.createElement('span');
    n.className = 'n num';
    n.textContent = String(wallet.credits);
    line.append(b, dot(), tier, dot(), icon('diamond', 18, true), n);
    const hint2 = document.createElement('p');
    hint2.className = 'note';
    hint2.textContent = t(
      'Mesmo saldo do celular. Compras só no app da loja.',
      'Same balance as your phone. Purchases happen in the store app.',
    );
    pb.append(line, hint2);
  }

  pb.appendChild(button('arrow_forward', t('Abrir Soulmon completo', 'Open full Soulmon'), () => window.soulmonDesktop?.openFullApp()));
}

async function syncNow(email: string) {
  const fail = (msg: string) => {
    syncMessage = { text: msg, error: true };
    panel = 'settings';
    render();
  };

  const trimmed = email.trim();
  if (!trimmed) {
    fail(t('Digite um e-mail primeiro.', 'Type an email first.'));
    return;
  }
  syncMessage = { text: t('Sincronizando...', 'Syncing...'), error: false };
  render();

  const result = await fetchRemoteSnapshot(trimmed);
  if (!result.ok) {
    if (result.reason === 'unauthenticated') {
      // O servidor exige login. Abrir o app completo resolve: é lá que o
      // Firebase Auth roda e devolve o token pro desktop (auth-preload.js).
      // Também corrige o estado local: se chegamos aqui, o modo é "exige".
      authRequired = true;
      session = null;
      fail(t(
        'Precisa entrar na conta. Abrindo o Soulmon completo — faça login e volte aqui.',
        'Sign-in required. Opening the full Soulmon — log in there and come back.',
      ));
      window.soulmonDesktop?.openFullApp();
      return;
    }
    fail(result.reason === 'not-found'
      ? t('Nenhum save encontrado com essa conta ainda.', 'No save found for that account yet.')
      : t('Falha de conexão — tente de novo.', 'Connection failed — try again.'));
    return;
  }

  /* ⚠️ Isto copiava os DEZ campos do snapshot à mão, e `applySnapshot` — a 10
     linhas de distância, no mesmo arquivo — copiava os mesmos dez. Duas cópias
     da mesma regra, e nenhum teste em `node` consegue importar este arquivo
     (ele toca o DOM no topo; está escrito no `CLAUDE.md`), então um campo novo
     em `RemoteSnapshot` chegaria por um caminho e não pelo outro em silêncio.
     É a forma exata do footgun 9, e o precedente é caro: foi assim que o teto
     de carinho ficou por aparelho sem ninguém ver.
     Agora existe UM copiador. `syncNow` só acrescenta o que é dele: o e-mail. */
  state.syncEmail = trimmed;
  applySnapshot(result.snapshot);
  persist();
  syncMessage = null;
  // Carteira em segundo plano: não atrasa a tela, e falhar aqui não é erro de
  // sincronização (o save já veio).
  void fetchWallet(trimmed).then(w => { if (w) { wallet = w; render(); } });
  panel = 'main';
  status = t('Sincronizado com sucesso!', 'Synced successfully!');
  render();
}

// ----------------------------------------------------------------- ações
// Cada ação também manda um "efeito" (emoji + fala) pro overlay: o pet
// visível é a faixa que anda na barra de tarefas, não esta janela.
//
// As ações de CUIDADO (carinho/comida) escrevem no save real quando há conta
// sincronizada — o desktop vira um controle remoto do celular, não um jogo
// paralelo. Sem conta, ficam locais (é o único jeito de o app fazer algo).

/**
 * Espelha o snapshot devolvido pelo servidor no estado local — **o único
 * copiador**. `syncNow` (acima) e as ações de cuidado passam as duas por aqui;
 * era duplicado nas duas até 09/09/2026.
 *
 * ⚠️ Ao acrescentar campo em `RemoteSnapshot`, acrescente aqui. A régua é
 * `desktop/renderer/src/menuSnapshot.contract.test.ts`, que lê o FONTE porque
 * este arquivo não é importável em teste de nó.
 */
function applySnapshot(s: RemoteSnapshot) {
  state.stage = s.stage;
  state.stageName = s.stageName;
  state.genericLine = s.genericLine;
  state.demoCharacterId = s.demoCharacterId;
  state.hearts = s.hearts;
  state.maxHearts = s.maxHearts;
  state.energy = s.energy;
  state.maxEnergy = s.maxEnergy;
  state.foodInventory = s.foodInventory;
  state.tasks = s.tasks;
  state.lastSyncAt = new Date().toISOString();
}

/** Erro de escrita → fala do pet, sem inventar sucesso. */
function pushFailed(reason: string) {
  status = reason === 'unauthenticated'
    ? t('Precisa entrar na conta de novo.', 'You need to sign in again.')
    : t('Não consegui falar com o servidor.', "Couldn't reach the server.");
  render();
}

function doPet() {
  if (!state.syncEmail) {
    // Sem conta: cai no comportamento local de sempre — mas a cura, o passo e o
    // teto agora saem da regra do app (`localRub`), não de um `+ 0.5` à mão.
    const r = localRub(state, new Date());
    if (r.refused) {
      status = eventPhrase('pet', state.language);
    } else {
      state.hearts = r.hearts;
      state.rubHeal = r.rubHeal;
      persist();
      status = eventPhrase('petHealed', state.language);
    }
    window.soulmonDesktop?.sendEffect('💗', status);
    render();
    return;
  }

  // A animação toca sempre — carinho nunca é "rejeitado" visualmente.
  status = eventPhrase('pet', state.language);
  window.soulmonDesktop?.sendEffect('💗', status);
  render();

  // NÃO existe mais um pré-teste local de "já curou hoje". Ele comparava
  // `state.rubHealDay`, um contador DESTE aparelho — o teto do celular não
  // valia aqui e o do desktop não valia lá. Quem decide é `remoteRub`, sobre o
  // registro que está no save; a ida ao servidor é o preço de o teto ser um só.
  void pushCareAction(state.syncEmail, remote => remoteRub(remote, new Date()).next)
    .then(res => {
      if (res.ok) {
        applySnapshot(res.snapshot);
        persist();
        status = eventPhrase('petHealed', state.language);
        render();
      } else if (res.reason === 'refused') {
        // HP cheio no save real, ou o teto do dia já gasto (no celular ou aqui):
        // nos dois casos a animação já tocou e não há cura a mostrar.
        render();
      } else {
        pushFailed(res.reason);
      }
    });
}

function doFeed() {
  const emoji = firstFood(state.foodInventory);
  if (!emoji) {
    status = eventPhrase('noFood', state.language);
    render();
    return;
  }

  if (!state.syncEmail) {
    // Sem conta a janela de 1h só pode ser a local — não há save onde escrevê-la.
    //
    // O pré-teste de `feedsLeft` saiu junto com a energia à mão: ele decidia
    // "tá cheio" ANTES de `localFeed`, que decide a MESMA coisa (`hourly-limit`)
    // com a mesma função do app. Duas portas para a mesma recusa, e a de fora
    // sem o poda de timestamps que a de dentro faz.
    const local = localFeed(state, emoji, Date.now());
    state.feedTimes = local.feedTimes;
    if (local.refused) {
      status = eventPhrase(local.refused === 'no-stock' ? 'noFood' : 'full', state.language);
      render();
      return;
    }
    state.foodInventory = local.foodInventory;
    // A energia NÃO é recalculada aqui. Era, e era o footgun 9: `Math.min(
    // state.maxEnergy, state.energy + 1)` reescrevia o teto e o passo que
    // `feedFood` já aplica. Ver `localFeed`.
    state.energy = local.energy;
    persist();
    status = eventPhrase('feed', state.language);
    window.soulmonDesktop?.sendEffect('🍖', status);
    render();
    return;
  }

  // Com conta, a janela é a do SAVE (`careCaps.feedTimes`) — `state.feedTimes`
  // era o contador DESTE aparelho, e num overlay recém-aberto ele está vazio:
  // o teto de comidas/hora do celular simplesmente não valia aqui (D-33).
  //
  // A recusa é capturada por fora porque `pushCareAction` só sabe dizer
  // "refused"; a fala do pet precisa distinguir "acabou a comida" de "tá cheio".
  const now = Date.now();
  let motivo: FeedRefusal | undefined;
  void pushCareAction(state.syncEmail, remote => {
    const r = remoteFeed(remote, emoji, now);
    motivo = r.refused;
    return r.next;
  }).then(res => {
    if (res.ok) {
      applySnapshot(res.snapshot);
      persist();
      status = eventPhrase('feed', state.language);
      window.soulmonDesktop?.sendEffect('🍖', status);
      render();
    } else if (res.reason === 'refused') {
      // O save real discorda do cache: ou a comida acabou no celular, ou a
      // janela de 1h já está cheia lá.
      status = eventPhrase(motivo === 'hourly-limit' ? 'full' : 'noFood', state.language);
      render();
    } else {
      pushFailed(res.reason);
    }
  });
}

function doShower() {
  // A bolha toca sempre — banho, como carinho, nunca é "rejeitado" visualmente.
  status = eventPhrase('shower', state.language);
  window.soulmonDesktop?.sendEffect('🫧', status);
  render();
  if (!state.syncEmail) return; // Sem conta não há cocô: ele mora no save.

  // Até aqui o botão NÃO ESCREVIA NADA — só a fala e a bolha. O cocô do save
  // continuava sujo, com o relógio de 6h do dreno correndo e tirando 1 coração
  // por período (`utils/poopDrain.ts`). O 🚿 é o ÚNICO jeito de parar esse
  // relógio, então o jogador via o pet perder coração apertando exatamente o
  // botão que existe para impedir isso.
  void pushCareAction(state.syncEmail, remote => remoteShower(remote).next)
    .then(res => {
      if (res.ok) {
        applySnapshot(res.snapshot);
        persist();
        render();
      } else if (res.reason === 'refused') {
        // Já estava limpo no save real — a bolha já tocou, não há o que mostrar.
        render();
      } else {
        pushFailed(res.reason);
      }
    });
}

function doSleepToggle() {
  const agora = new Date();
  const deitando = !state.sleeping;
  state.sleeping = deitando;
  // A hora de deitar precisa sobreviver à noite inteira: é ela que, ao acordar,
  // fecha o registro com `wokeAt`. Ver `DesktopState.sleepStartedAt`.
  const deitouEm = deitando ? agora.toISOString() : state.sleepStartedAt;
  state.sleepStartedAt = deitando ? agora.toISOString() : null;
  persist();
  status = eventPhrase(deitando ? 'sleep' : 'wake', state.language);
  render();
  if (!state.syncEmail) return;

  // Até aqui isto era SÓ o booleano local: a cama era desenho. `rest.nights`
  // nunca recebia nada, então dormir pelo overlay não contava para a constância,
  // para a raridade do sonho nem para o pesadelo — quem fecha o app e dorme com
  // o overlay aberto simplesmente não tinha noites.
  //
  // A JANELA continua no relógio do APARELHO, de propósito: deitar cedo é um
  // gesto do mundo real, é noite ONDE A PESSOA ESTÁ. Ver `remoteSleep`.
  if (deitando) {
    void pushCareAction(state.syncEmail, remote => remoteSleep(remote, agora)).then(sonoGravado);
    return;
  }
  // Acordar sem hora de deitar (overlay atualizado no meio da noite) não
  // registra nada: noite sem registro é NEUTRA, nunca uma falha inventada.
  const inicio = deitouEm ? new Date(deitouEm) : null;
  if (!inicio || Number.isNaN(inicio.getTime())) return;
  void pushCareAction(state.syncEmail, remote => remoteWake(remote, inicio, agora)).then(sonoGravado);
}

/** O sono nunca recusa (`recordNight` não penaliza), então só há ok e erro. */
function sonoGravado(res: Awaited<ReturnType<typeof pushCareAction>>) {
  if (res.ok) {
    applySnapshot(res.snapshot);
    persist();
    render();
  } else if (res.reason !== 'refused') {
    pushFailed(res.reason);
  }
}

/** id da tarefa sendo marcada (trava a lista durante a ida ao servidor). */
let completing: string | null = null;

function doCompleteTask(id: string) {
  if (!state.syncEmail || completing) return;
  completing = id;
  render();

  void pushCareAction(state.syncEmail, remote => {
    // Mesma transição do app: sai da lista, entra no histórico, conta na
    // estatística e vira comida (utils/careRules.ts).
    const next = completeTask(remote as unknown as TaskState, id);
    return next ? (next as unknown as Record<string, unknown>) : null;
  }).then(res => {
    completing = null;
    if (res.ok) {
      applySnapshot(res.snapshot);
      persist();
      status = eventPhrase('taskDone', state.language);
      window.soulmonDesktop?.sendEffect('🍎', status);
      panel = 'main';
    } else if (res.reason === 'refused') {
      // Já tinha sido concluída no celular — só some da lista.
      state.tasks = state.tasks.filter(t => t.id !== id);
      persist();
    } else {
      pushFailed(res.reason);
      return;
    }
    render();
  });
}

// ------------------------------------------------------------------- boot
render();

(async () => {
  [authRequired, session] = await Promise.all([
    isAuthRequired(),
    window.soulmonDesktop?.getAuth() ?? Promise.resolve(null),
  ]);
  // Já logado e nunca sincronizado: puxa o save do celular sem o usuário
  // precisar pedir — é o comportamento que se espera de "mesma conta".
  if (authRequired && session && !state.lastSyncAt) {
    await syncNow(session.email);
    return;
  }
  render();
})();

// O login acontece noutra janela (o app web). Quando ele conclui, o processo
// principal avisa aqui — sem isto o usuário logaria e continuaria vendo a tela
// pedindo login até reabrir o menu.
window.soulmonDesktop?.onAuthChanged(async next => {
  session = next ? await (window.soulmonDesktop?.getAuth() ?? Promise.resolve(null)) : null;
  if (session && !state.lastSyncAt) {
    await syncNow(session.email);
    return;
  }
  render();
});
