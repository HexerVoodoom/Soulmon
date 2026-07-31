// Janela de menu do pet (frame:false + chrome falso em menu.html/menu.css).
// Título tem 3 botões: engrenagem (configurações), minimizar (só esta janela)
// e fechar (o app inteiro — overlay + bandeja).
import './menu.css';
import { petSprite } from './sprites';
import {
  loadState, saveState, feedsLeft, todayKey, newTaskId,
  type DesktopState,
} from './state';
import { fetchRemoteSnapshot } from './cloudSync';
import { eventPhrase } from './phrases';

const state: DesktopState = loadState();
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
    `<span class="panel-stats">${heartsLabel()} · ⚡${state.energy}/${state.maxEnergy} · 🍎×${state.food}</span>`;
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

  // As ações acima ainda são LOCAIS (fase 2b do plano). Dizer isso é melhor do
  // que deixar o usuário achar que marcou a tarefa no celular também.
  const note = document.createElement('div');
  note.className = 'field-hint';
  note.textContent = t(
    'As ações daqui ainda ficam só no desktop — o app do celular é a fonte oficial.',
    'Actions here stay on the desktop for now — the phone app is the official source.',
  );
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

function renderSettings() {
  addBackHeader(t('Configurações', 'Settings'));

  content.appendChild(button(
    `🌐 ${t('Idioma: Português', 'Language: English')}`,
    () => { state.language = state.language === 'pt-BR' ? 'en' : 'pt-BR'; persist(); render(); },
  ));

  // A criatura NÃO é escolhida aqui: cada jogador tem uma linha evolutiva
  // única gerada pelo oráculo. Ela vem do save — por isso o e-mail é o
  // controle central desta tela, não um extra.
  const syncBox = document.createElement('div');
  syncBox.className = 'field-row';
  const label = document.createElement('div');
  label.className = 'panel-title';
  label.style.fontSize = '11px';
  label.textContent = t('E-mail da sua conta Soulmon', 'Your Soulmon account email');
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.placeholder = 'voce@email.com';
  emailInput.value = state.syncEmail ?? '';
  const syncBtn = button(`🔄 ${t('Sincronizar agora', 'Sync now')}`, () => syncNow(emailInput.value));
  const hint = document.createElement('div');
  hint.className = 'field-hint';
  hint.textContent = state.lastSyncAt
    ? t(`Última sincronização: ${new Date(state.lastSyncAt).toLocaleString('pt-BR')}`, `Last sync: ${new Date(state.lastSyncAt).toLocaleString()}`)
    : t('Use o mesmo e-mail do celular para ver a sua criatura aqui.', 'Use the same email as the phone to see your creature here.');
  syncBox.append(label, emailInput, syncBtn, hint);
  content.appendChild(syncBox);

  content.appendChild(button(`📱 ${t('Abrir Soulmon completo', 'Open full Soulmon')}`, () => window.soulmonDesktop?.openFullApp()));
}

async function syncNow(email: string) {
  const hint = content.querySelector('.field-hint') as HTMLDivElement | null;
  const fail = (msg: string) => {
    if (hint) { hint.textContent = msg; hint.className = 'field-hint error'; }
  };

  const trimmed = email.trim();
  if (!trimmed) {
    fail(t('Digite um e-mail primeiro.', 'Type an email first.'));
    return;
  }
  if (hint) { hint.textContent = t('Sincronizando...', 'Syncing...'); hint.className = 'field-hint'; }

  const result = await fetchRemoteSnapshot(trimmed);
  if (!result.ok) {
    if (result.reason === 'unauthenticated') {
      // O servidor exige login. Abrir o app completo resolve: é lá que o
      // Firebase Auth roda e devolve o token pro desktop (auth-preload.js).
      fail(t(
        'Precisa entrar na conta. Abrindo o Soulmon completo — faça login e volte aqui.',
        'Sign-in required. Opening the full Soulmon — log in there and come back.',
      ));
      window.soulmonDesktop?.openFullApp();
      return;
    }
    fail(result.reason === 'not-found'
      ? t('Nenhum save encontrado com esse e-mail ainda.', 'No save found for that email yet.')
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
  state.food = s.food;
  state.lastSyncAt = new Date().toISOString();
  persist();
  panel = 'main';
  status = t('Sincronizado com sucesso!', 'Synced successfully!');
  render();
}

// ----------------------------------------------------------------- ações
// Cada ação também manda um "efeito" (emoji + fala) pro overlay: o pet
// visível é a faixa que anda na barra de tarefas, não esta janela.
function doPet() {
  const day = todayKey();
  if (state.rubHealDay !== day && state.hearts < state.maxHearts) {
    state.hearts = Math.min(state.maxHearts, state.hearts + 0.5);
    state.rubHealDay = day;
    persist();
    status = eventPhrase('petHealed', state.language);
  } else {
    status = eventPhrase('pet', state.language);
  }
  window.soulmonDesktop?.sendEffect('💗', status);
  render();
}

function doFeed() {
  if (state.food <= 0) {
    status = eventPhrase('noFood', state.language);
    render();
    return;
  }
  if (feedsLeft(state) <= 0) {
    status = eventPhrase('full', state.language);
    render();
    return;
  }
  state.food -= 1;
  state.feedTimes.push(Date.now());
  state.energy = Math.min(state.maxEnergy, state.energy + 1);
  persist();
  status = eventPhrase('feed', state.language);
  window.soulmonDesktop?.sendEffect('🍖', status);
  render();
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
    state.food += 1;
    status = eventPhrase('taskDone', state.language);
    window.soulmonDesktop?.sendEffect('🍎', status);
  }
  persist();
  render();
}

render();
