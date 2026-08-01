// Janela de menu do pet (frame:false + chrome falso em menu.html/menu.css).
// Título tem 3 botões: engrenagem (configurações), minimizar (só esta janela)
// e fechar (o app inteiro — overlay + bandeja).
import './menu.css';
import { petSprite } from './sprites';
import {
  loadState, saveState, feedsLeft, todayKey, newTaskId, foodCount, firstFood,
  type DesktopState,
} from './state';
import { fetchRemoteSnapshot, isAuthRequired, pushCareAction, type RemoteSnapshot } from './cloudSync';
// As regras vêm do app, não de uma cópia — é o motivo de careRules.ts existir.
import { feedFood, rubHeal, foodForCompletedTask, type CareState } from '../../../src/utils/careRules';
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
const persist = () => {
  saveState(state);
  window.soulmonDesktop?.notifyStateChanged();
};
const t = (pt: string, en: string) => (state.language === 'pt-BR' ? pt : en);

const content = document.getElementById('content')!;

document.getElementById('btn-settings')!.addEventListener('click', () => { panel = 'settings'; render(); });
document.getElementById('btn-minimize')!.addEventListener('click', () => window.soulmonDesktop?.minimizeMenu());
document.getElementById('btn-close')!.addEventListener('click', () => window.soulmonDesktop?.quit());

type Panel = 'main' | 'tasks' | 'newTask' | 'settings';
let panel: Panel = state.syncEmail ? 'main' : 'settings';
let status = '';

function heartsLabel(): string {
  const full = Math.floor(state.hearts);
  const half = state.hearts - full >= 0.5;
  return '❤️'.repeat(full) + (half ? '💗' : '') + '🖤'.repeat(Math.max(0, state.maxHearts - full - (half ? 1 : 0)));
}

function button(label: string, onClick: () => void, extraClass = ''): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = `list-btn ${extraClass}`.trim();
  b.innerHTML = label;
  b.addEventListener('click', onClick);
  return b;
}

/** Botão redondo de ícone, usado só pelas ações de cuidado (care-row). */
function careButton(icon: string, label: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'care-btn';
  b.innerHTML = `<span class="care-icon">${icon}</span><span class="care-label">${label}</span>`;
  b.addEventListener('click', onClick);
  return b;
}

function addBackHeader(title: string) {
  const header = document.createElement('div');
  header.className = 'panel-header';
  const back = document.createElement('button');
  back.className = 'back-btn';
  back.textContent = '‹';
  back.addEventListener('click', () => { panel = 'main'; render(); });
  const span = document.createElement('span');
  span.className = 'panel-title';
  span.textContent = title;
  header.append(back, span);
  content.appendChild(header);
}

function render() {
  content.innerHTML = '';
  if (panel === 'main') renderMain();
  else if (panel === 'tasks') renderTasks();
  else if (panel === 'newTask') renderNewTask();
  else renderSettings();
}

function renderMain() {
  const header = document.createElement('div');
  header.className = 'panel-header';
  header.innerHTML = `<span class="panel-title">${state.stageName}</span>` +
    `<span class="panel-stats">${heartsLabel()} · ⚡${state.energy}/${state.maxEnergy} · 🍎×${foodCount(state.foodInventory)}</span>`;
  content.appendChild(header);

  const img = document.createElement('img');
  img.className = 'pet-portrait';
  img.src = petSprite(state.stage, state.genericLine, state.demoCharacterId);
  img.alt = state.stageName;
  content.appendChild(img);

  const statusLine = document.createElement('div');
  statusLine.className = 'status-line';
  statusLine.textContent = status;
  content.appendChild(statusLine);

  // Ações de cuidado (carinho/comida/banho/sono) ficam separadas do resto
  // numa fileira de ícones própria — tarefas/config são outra categoria.
  const careRow = document.createElement('div');
  careRow.className = 'care-row';
  careRow.append(
    careButton('🫶', t('Carinho', 'Pet'), doPet),
    careButton('🍎', t('Comida', 'Feed'), doFeed),
    careButton('🚿', t('Banho', 'Bath'), doShower),
    careButton(state.sleeping ? '☀️' : '💤', state.sleeping ? t('Acordar', 'Wake') : t('Dormir', 'Sleep'), doSleepToggle),
  );
  content.appendChild(careRow);

  const pending = state.tasks.filter(task => !task.completed).length;
  content.append(
    button(`✅ ${t('Tarefas', 'Tasks')}${pending ? ` <span class="badge">${pending}</span>` : ''}`, () => { panel = 'tasks'; render(); }),
    button(`➕ ${t('Nova tarefa', 'New task')}`, () => { panel = 'newTask'; render(); }),
  );

  // Carinho e comida escrevem no save real quando há conta; tarefas ainda não
  // (as do desktop são livres, as do app vêm de atividades com agenda). Dizer
  // qual é qual evita o usuário achar que marcou a tarefa no celular também.
  const note = document.createElement('div');
  note.className = 'field-hint';
  note.textContent = state.syncEmail
    ? t('Carinho e comida valem no celular também. As tarefas daqui são só do desktop.',
      'Petting and feeding also count on your phone. Tasks here are desktop-only.')
    : t('Sem conta conectada, tudo aqui fica só no desktop.',
      'Without a connected account, everything here stays on the desktop.');
  content.appendChild(note);
}

function renderTasks() {
  addBackHeader(t('Tarefas de hoje', "Today's tasks"));
  const list = document.createElement('div');
  list.className = 'task-list';
  if (state.tasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'task-empty';
    empty.textContent = t('Nenhuma tarefa ainda.', 'No tasks yet.');
    list.appendChild(empty);
  }
  for (const task of state.tasks) {
    const row = document.createElement('div');
    row.className = `task-row${task.completed ? ' done' : ''}`;
    const toggle = document.createElement('button');
    toggle.className = 'task-toggle';
    toggle.textContent = task.completed ? '☑' : '☐';
    toggle.addEventListener('click', () => toggleTask(task.id));
    const name = document.createElement('span');
    name.className = 'task-name';
    name.textContent = task.name;
    const del = document.createElement('button');
    del.className = 'task-del';
    del.textContent = '✕';
    del.title = t('Excluir', 'Delete');
    del.addEventListener('click', () => {
      state.tasks = state.tasks.filter(other => other.id !== task.id);
      persist();
      render();
    });
    row.append(toggle, name, del);
    list.appendChild(row);
  }
  content.appendChild(list);
  content.appendChild(button(`➕ ${t('Nova tarefa', 'New task')}`, () => { panel = 'newTask'; render(); }));
}

function renderNewTask() {
  addBackHeader(t('Nova tarefa', 'New task'));
  const form = document.createElement('form');
  form.className = 'field-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 60;
  input.placeholder = t('O que precisa fazer?', 'What needs doing?');
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.className = 'list-btn';
  submit.textContent = t('Criar', 'Create');
  form.append(input, submit);
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    state.tasks.push({ id: newTaskId(), name, completed: false, createdAt: new Date().toISOString() });
    persist();
    panel = 'tasks';
    render();
  });
  content.appendChild(form);
  input.focus();
}

function lastSyncLabel(): string {
  if (!state.lastSyncAt) return '';
  return t(
    `Última sincronização: ${new Date(state.lastSyncAt).toLocaleString('pt-BR')}`,
    `Last sync: ${new Date(state.lastSyncAt).toLocaleString()}`,
  );
}

function renderSettings() {
  addBackHeader(t('Configurações', 'Settings'));

  content.appendChild(button(
    `🌐 ${t('Idioma: Português', 'Language: English')}`,
    () => { state.language = state.language === 'pt-BR' ? 'en' : 'pt-BR'; persist(); render(); },
  ));

  // A criatura NÃO é escolhida aqui: cada jogador tem uma linha evolutiva única
  // gerada pelo oráculo. Ela vem do save — a conta é o controle central desta
  // tela, não um extra.
  const syncBox = document.createElement('div');
  syncBox.className = 'field-row';
  const label = document.createElement('div');
  label.className = 'panel-title';
  label.style.fontSize = '11px';
  const hint = document.createElement('div');
  hint.className = 'field-hint';

  if (authRequired && session) {
    // Logado: o e-mail vem do token assinado, não é digitável.
    label.textContent = t('Conta conectada', 'Connected account');
    const who = document.createElement('div');
    who.className = 'status-line';
    who.textContent = session.email;
    const syncBtn = button(`🔄 ${t('Sincronizar agora', 'Sync now')}`, () => syncNow(session!.email));
    hint.textContent = lastSyncLabel()
      || t('Puxe o seu progresso do celular.', 'Pull your progress from the phone.');
    syncBox.append(label, who, syncBtn, hint);
  } else if (authRequired) {
    // Sem login não há o que sincronizar: o servidor recusaria a leitura.
    // Digitar um e-mail aqui só produziria um 403 sem explicação.
    label.textContent = t('Entre na sua conta', 'Sign in to your account');
    const loginBtn = button(
      `🔐 ${t('Entrar com e-mail', 'Sign in with email')}`,
      () => window.soulmonDesktop?.openFullApp(),
    );
    hint.textContent = t(
      'Abre o Soulmon completo para você entrar. Depois é só voltar aqui — a criatura do celular aparece sozinha.',
      'Opens the full Soulmon so you can sign in. Then come back — your phone creature shows up automatically.',
    );
    syncBox.append(label, loginBtn, hint);
  } else {
    // Modo de migração (servidor sem FIREBASE_PROJECT_ID): ainda aceita e-mail
    // digitado, porque é assim que o app web funciona hoje.
    label.textContent = t('E-mail da sua conta Soulmon', 'Your Soulmon account email');
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'voce@email.com';
    emailInput.value = state.syncEmail ?? '';
    const syncBtn = button(`🔄 ${t('Sincronizar agora', 'Sync now')}`, () => syncNow(emailInput.value));
    hint.textContent = lastSyncLabel()
      || t('Use o mesmo e-mail do celular para ver a sua criatura aqui.', 'Use the same email as the phone to see your creature here.');
    syncBox.append(label, emailInput, syncBtn, hint);
  }

  // O resultado da última sincronização tem prioridade sobre o texto padrão.
  if (syncMessage) {
    hint.textContent = syncMessage.text;
    hint.className = syncMessage.error ? 'field-hint error' : 'field-hint';
  }

  content.appendChild(syncBox);
  content.appendChild(button(`📱 ${t('Abrir Soulmon completo', 'Open full Soulmon')}`, () => window.soulmonDesktop?.openFullApp()));
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

  const s = result.snapshot;
  state.syncEmail = trimmed;
  state.stage = s.stage;
  state.stageName = s.stageName;
  state.genericLine = s.genericLine;
  state.demoCharacterId = s.demoCharacterId;
  state.hearts = s.hearts;
  state.maxHearts = s.maxHearts;
  state.energy = s.energy;
  state.maxEnergy = s.maxEnergy;
  state.foodInventory = s.foodInventory;
  state.lastSyncAt = new Date().toISOString();
  persist();
  syncMessage = null;
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

/** Espelha o snapshot devolvido pelo servidor no estado local. */
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
  const day = todayKey();
  const jaCurouHoje = state.rubHealDay === day;

  if (!state.syncEmail) {
    // Sem conta: cai no comportamento local de sempre.
    if (!jaCurouHoje && state.hearts < state.maxHearts) {
      state.hearts = Math.min(state.maxHearts, state.hearts + 0.5);
      state.rubHealDay = day;
      persist();
      status = eventPhrase('petHealed', state.language);
    } else {
      status = eventPhrase('pet', state.language);
    }
    window.soulmonDesktop?.sendEffect('💗', status);
    render();
    return;
  }

  // A animação toca sempre — carinho nunca é "rejeitado" visualmente.
  status = eventPhrase('pet', state.language);
  window.soulmonDesktop?.sendEffect('💗', status);
  if (jaCurouHoje) { render(); return; }

  void pushCareAction(state.syncEmail, remote => {
    const r = rubHeal(remote as unknown as CareState, { date: day, healed: 0 }, day);
    return r.refused ? null : (r.state as unknown as Record<string, unknown>);
  }).then(res => {
    if (res.ok) {
      applySnapshot(res.snapshot);
      state.rubHealDay = day;
      persist();
      status = eventPhrase('petHealed', state.language);
      render();
    } else if (res.reason === 'refused') {
      render(); // HP já estava cheio no save real — só a animação mesmo.
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
  if (feedsLeft(state) <= 0) {
    status = eventPhrase('full', state.language);
    render();
    return;
  }

  if (!state.syncEmail) {
    const local = feedFood(state as unknown as CareState, emoji, state.feedTimes, Date.now());
    if (local.refused) {
      status = eventPhrase(local.refused === 'no-stock' ? 'noFood' : 'full', state.language);
      render();
      return;
    }
    state.foodInventory = local.state.foodInventory;
    state.energy = Math.min(state.maxEnergy, state.energy + 1);
    state.feedTimes = local.feedTimes;
    persist();
    status = eventPhrase('feed', state.language);
    window.soulmonDesktop?.sendEffect('🍖', status);
    render();
    return;
  }

  const now = Date.now();
  const before = state.feedTimes;
  void pushCareAction(state.syncEmail, remote => {
    const r = feedFood(remote as unknown as CareState, emoji, before, now);
    return r.refused ? null : (r.state as unknown as Record<string, unknown>);
  }).then(res => {
    if (res.ok) {
      applySnapshot(res.snapshot);
      state.feedTimes = [...before, now];
      persist();
      status = eventPhrase('feed', state.language);
      window.soulmonDesktop?.sendEffect('🍖', status);
      render();
    } else if (res.reason === 'refused') {
      // O save real discorda do cache (comida acabou no celular).
      status = eventPhrase('noFood', state.language);
      render();
    } else {
      pushFailed(res.reason);
    }
  });
}

function doShower() {
  status = eventPhrase('shower', state.language);
  window.soulmonDesktop?.sendEffect('🫧', status);
  render();
}

function doSleepToggle() {
  state.sleeping = !state.sleeping;
  persist();
  status = eventPhrase(state.sleeping ? 'sleep' : 'wake', state.language);
  render();
}

function toggleTask(id: string) {
  const task = state.tasks.find(other => other.id === id);
  if (!task) return;
  task.completed = !task.completed;
  if (task.completed) {
    // Tarefa do desktop não tem categoria; usa Study (🍎), a mesma comida que
    // o app dá — a regra em si vem de careRules.foodForCompletedTask.
    state.foodInventory = foodForCompletedTask(state.foodInventory, 'Study');
    status = eventPhrase('taskDone', state.language);
    window.soulmonDesktop?.sendEffect('🍎', status);
  }
  persist();
  render();
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
