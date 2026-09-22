// Overlay do pet: anda numa faixa rente à barra de tarefas e solta frases.
// A janela inteira é click-through; só o pet é interativo (ver
// set-interactive no main.js do Electron). Clicar no pet abre a janela de
// menu (ver menu.ts/menu.html) num processo separado.
import './style.css';
import { petSprite, facesLeft } from './sprites';
import { loadState, type DesktopState } from './state';
import { idlePhrase } from './phrases';
// Glifos pixel a 1× (32) no lugar dos emoji do sistema (canvas Fora do app,
// D-F10): carinho e banho vêm do HUD do app; comida e sono são da SQUAD-ARTE
// rodada 2 (R2-5), só do desktop, em `desktop/renderer/assets/`. O ícone
// Material fica só como reserva para um emoji sem arte.
import glyphAffection from '../../../src/assets/soulmon/hud/glyph-affection.png';
import glyphBath from '../../../src/assets/soulmon/hud/glyph-bath.png';
import glyphFood from '../assets/glyph-food-32.png';
import glyphSleep from '../assets/glyph-sleep-32.png';
import sleepZ from '../../../src/assets/soulmon/fx/anim-sleep-z.png';
const EFFECT_ART: Record<string, string> = {
  '💗': glyphAffection, '🫧': glyphBath,
  '🍎': glyphFood, '🍖': glyphFood, '💤': glyphSleep,
};

let state: DesktopState = loadState();
const t = (pt: string, en: string) => (state.language === 'pt-BR' ? pt : en);

// ---------------------------------------------------------------- DOM base
const stage = document.getElementById('stage')!;

const pet = document.createElement('div');
pet.id = 'pet';
pet.dataset.hit = '1';
pet.innerHTML = `<img id="pet-img" alt="" draggable="false" /><div id="pet-fx"></div><div id="pet-zzz" aria-hidden="true"></div>`;
pet.querySelector<HTMLDivElement>('#pet-zzz')!.style.backgroundImage = `url("${sleepZ}")`;
stage.appendChild(pet);

const bubble = document.createElement('div');
bubble.id = 'bubble';
stage.appendChild(bubble);

const petImg = pet.querySelector<HTMLImageElement>('#pet-img')!;
const petFx = pet.querySelector<HTMLDivElement>('#pet-fx')!;

// ------------------------------------------------------------- caminhada
// 64 = 384 ÷ 6: escala inteira (P2 (a)); a mesma criatura do widget (X2).
// Espelha `PET_SIZE` de desktop/electron/main.js — a faixa tem 72 de altura.
const PET_SIZE = 64;
const SPEED = 28; // px/s
let x = Math.random() * Math.max(1, window.innerWidth - PET_SIZE);
let dir: -1 | 1 = Math.random() < 0.5 ? -1 : 1;
let walking = true;
let behaviorUntil = 0;
let lastTs = performance.now();

function applyPetVisual() {
  petImg.src = petSprite(state.stage, state.demoCharacterId);
  petImg.alt = state.stageName;
  pet.classList.toggle('sleeping', state.sleeping);
}

function tick(ts: number) {
  const dt = Math.min(0.1, (ts - lastTs) / 1000);
  lastTs = ts;

  if (ts > behaviorUntil) {
    // Alterna andar/pausar com durações aleatórias; às vezes vira de lado.
    walking = Math.random() < 0.65;
    if (walking && Math.random() < 0.4) dir = dir === 1 ? -1 : 1;
    behaviorUntil = ts + 2000 + Math.random() * 5000;
  }

  if (walking && !state.sleeping) {
    x += dir * SPEED * dt;
    const max = window.innerWidth - PET_SIZE;
    if (x <= 0) { x = 0; dir = 1; }
    if (x >= max) { x = max; dir = -1; }
  }

  pet.style.transform = `translateX(${x}px)`;
  // A maioria dos sprites do jogo olha para a DIREITA; os de
  // LEFT_FACING_STAGES são a exceção. Espelha só quando a direção do
  // movimento discorda da orientação natural do sprite.
  const natural: -1 | 1 = facesLeft(state.stage) ? -1 : 1;
  petImg.style.transform = dir === natural ? '' : 'scaleX(-1)';
  pet.classList.toggle('walking', walking && !state.sleeping);

  positionBubble();
  requestAnimationFrame(tick);
}

// O balão fica AO LADO da criatura (D-F8): à direita, com o rabicho apontando
// para ela; perto da borda direita, passa para a esquerda.
const BUBBLE_GAP = 16;
function positionBubble() {
  if (!bubble.classList.contains('open')) return;
  const w = bubble.offsetWidth;
  const right = x + PET_SIZE + BUBBLE_GAP;
  const fitsRight = right + w <= window.innerWidth - 4;
  const left = fitsRight ? right : Math.max(4, x - BUBBLE_GAP - w);
  bubble.classList.toggle('side-right', fitsRight);
  bubble.classList.toggle('side-left', !fitsRight);
  bubble.style.left = `${left}px`;
}

// ----------------------------------------------------------------- falas
let bubbleTimer: number | undefined;
function say(text: string, ms = 6000) {
  bubble.textContent = text;
  bubble.classList.add('open');
  positionBubble();
  window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => bubble.classList.remove('open'), ms);
}

function scheduleIdleTalk() {
  const delay = 120_000 + Math.random() * 180_000; // 2–5 min
  window.setTimeout(() => {
    if (!document.hidden && !state.sleeping) say(idlePhrase(state.language));
    scheduleIdleTalk();
  }, delay);
}

// --------------------------------------------------------------- efeitos
function burst(emoji: string, count = 3) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'fx';
    el.setAttribute('aria-hidden', 'true');
    const art = EFFECT_ART[emoji];
    if (art) {
      const img = document.createElement('img');
      img.src = art; img.alt = ''; img.width = 32; img.height = 32;
      el.appendChild(img);
    } else {
      // Emoji sem glifo pixel: o ícone Material genérico, nunca o emoji do fabricante.
      const ico = document.createElement('span');
      ico.className = 'ico';
      ico.textContent = 'favorite';
      el.appendChild(ico);
    }
    // Sobe de cima da cabeça: três posições em cima do corpo de 64.
    el.style.left = `${Math.round(-8 + i * 24 + Math.random() * 8)}px`;
    el.style.animationDelay = `${i * 0.12}s`;
    petFx.appendChild(el);
    window.setTimeout(() => el.remove(), 1600);
  }
}

// ------------------------------------------------- interação / click-through
pet.addEventListener('click', () => window.soulmonDesktop?.openMenu(x + PET_SIZE / 2));

// A janela é click-through por padrão; quando o mouse passa sobre o pet
// ([data-hit]) avisamos o main process para aceitar cliques.
let lastHit = false;
document.addEventListener('mousemove', e => {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const hit = !!el?.closest('[data-hit]');
  if (hit !== lastHit) {
    lastHit = hit;
    window.soulmonDesktop?.setInteractive(hit);
  }
});
document.addEventListener('mouseleave', () => {
  if (lastHit) {
    lastHit = false;
    window.soulmonDesktop?.setInteractive(false);
  }
});

// Menu (noutra janela) mudou o estado — recarrega e atualiza o sprite na hora.
window.soulmonDesktop?.onStateChanged(() => {
  state = loadState();
  applyPetVisual();
});

// Ação feita no menu (carinho/comida/banho/tarefa) — toca a animação aqui,
// já que o pet visível é o overlay (o menu é só a janela de controle).
window.soulmonDesktop?.onEffect((emoji, phrase) => {
  burst(emoji);
  say(phrase);
});

// Atualização baixada em segundo plano — instala sozinha ao fechar o app.
window.soulmonDesktop?.onUpdateReady(() => {
  say(t('Baixei uma atualização! Já aplico da próxima vez que eu abrir.', 'I downloaded an update! I will apply it next time I start.'), 8000);
});

// ------------------------------------------------------------------- boot
applyPetVisual();
requestAnimationFrame(tick);
scheduleIdleTalk();
window.setTimeout(() => {
  say(state.syncEmail
    ? t('Oi! Clica em mim pra ver o menu.', 'Hi! Click me to see the menu.')
    : t('Oi! Clica em mim pra conectar a sua conta.', 'Hi! Click me to connect your account.'));
}, 2500);
