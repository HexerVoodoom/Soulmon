/**
 * A MÚSICA-TEMA DO JOGO — "Stone Hall Decay" (decisão do dono, 07/10/2026,
 * `docs/REGISTRO-DE-DECISOES.md` §6.1, S17).
 *
 * O dono pediu que o tema toque assim que o jogo abre. Isso REVOGA o "nasce
 * desligada" da S2 — **só para este tema** (a trilha de duas camadas, `trilha.ts`,
 * continua nascendo desligada). O que NÃO foi revogado, e este módulo cumpre:
 * - **D11 / autoplay**: o navegador e o WebView só liberam áudio depois de um
 *   gesto, e o app nunca tenta autoplay cego. "Ligado por padrão" quer dizer
 *   *preferência* ligada; o tema começa no PRIMEIRO gesto da sessão (toque,
 *   clique ou tecla — inclusive o toque que pula a intro). `armarTemaNoPrimeiroGesto`
 *   é chamado uma vez no `main.tsx` e só instala os ouvintes; nada toca sem eles.
 * - **Mudo global, aba escondida, sono, janela de descanso**: o tema para por
 *   MOTIVO (`MotivoDePausa`, o mesmo vocabulário da trilha — `pausarTrilha`/
 *   `retomarTrilha` repassam para cá), e `document.hidden` pausa o elemento.
 * - **Barramento**: passa pelo `busTema` do `audioBus` (sob o `duckGeral`, então o
 *   D-1 do Marco o abaixa como abaixa a trilha). O nível NÃO é decidido aqui: o
 *   arquivo foi mestrado no alvo da trilha de `utils/loudness.ts` (dono único) e
 *   toca a ganho 1.
 *
 * Forma: um `<audio>` em streaming (3m40 decodificados seriam ~70 MB de PCM na
 * RAM de um celular), `preload="none"` — os ~2,4 MB só saem da rede quando o
 * primeiro gesto chega (S6: zero no bundle inicial). Formato por suporte
 * (`canPlayType`), com troca única para o outro se o primeiro falhar.
 *
 * Fim e retomada, sem corte feio: a faixa já termina num fade de ~5 s; ao acabar
 * o tema descansa `pausaEntreVoltasS` em silêncio e volta com fade-in curto.
 * Presença, não alarme: ele nunca emenda no próprio rabo como um loop seco.
 */
import { garantirBarramento } from './audioBus';
import { TEMA_DO_JOGO, type FormatoDoTema } from './sonsAssets';
import { isMuted } from './sounds';
import { readFlag, writeFlag } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

/** Mesmos motivos da trilha (`trilha.ts`): quem pausa por um não libera o outro. */
export type MotivoDePausa = 'sono' | 'descanso' | 'mudo';

const pausas = new Set<MotivoDePausa>();
const pausada = (): boolean => pausas.size > 0;

let el: HTMLAudioElement | null = null;
let fade: GainNode | null = null;
let ligadaNestaSessao = false;
let tocando = false;
let formatoIdx = 0;
let formatosTentados = 0;
let timerVolta: ReturnType<typeof setTimeout> | null = null;
let tokenParada = 0;
let cicloLigado = false;

const GESTOS = ['pointerup', 'touchend', 'keydown', 'click'] as const;
let armado = false;

/** A preferência: o tema NASCE ligado (a chave guarda o DESLIGADO). */
export function temaPreferido(): boolean {
  return !readFlag(STORAGE_KEYS.SOUND_THEME_OFF);
}

/** O formato que este motor diz tocar; WebM/Opus primeiro (menor), M4A como rede. */
export function escolherFormato(probe: Pick<HTMLAudioElement, 'canPlayType'>): number {
  const fm: readonly FormatoDoTema[] = TEMA_DO_JOGO.formatos;
  for (let i = 0; i < fm.length; i++) {
    if (probe.canPlayType(fm[i].mime) !== '') return i;
  }
  return 0;
}

function limparTimer(): void {
  if (timerVolta) { clearTimeout(timerVolta); timerVolta = null; }
}

function aoAcabar(): void {
  tocando = false;
  limparTimer();
  // A faixa já terminou em fade: descansa em silêncio e volta. `comecar` rechecha
  // tudo (mudo, pausa, aba escondida); se algo impedir, a próxima liberação retoma.
  timerVolta = setTimeout(() => { timerVolta = null; comecar(); }, TEMA_DO_JOGO.pausaEntreVoltasS * 1000);
}

function aoFalhar(): void {
  if (!el) return;
  tocando = false;
  // Troca UMA vez para o outro formato; se os dois falharem (offline, 404), cala.
  if (formatosTentados < TEMA_DO_JOGO.formatos.length - 1) {
    formatosTentados++;
    formatoIdx = (formatoIdx + 1) % TEMA_DO_JOGO.formatos.length;
    el.src = TEMA_DO_JOGO.formatos[formatoIdx].url;
    if (ligadaNestaSessao && !pausada()) comecar();
  }
}

function criarElemento(): boolean {
  if (el) return true;
  if (typeof Audio === 'undefined') return false;
  const b = garantirBarramento();
  if (!b) return false;
  try {
    const a = new Audio();
    a.preload = 'none';
    a.loop = false;
    a.setAttribute('playsinline', '');
    formatoIdx = escolherFormato(a);
    a.src = TEMA_DO_JOGO.formatos[formatoIdx].url;
    const g = b.ctx.createGain();
    g.gain.value = 0;
    const src = b.ctx.createMediaElementSource(a);
    src.connect(g);
    g.connect(b.busTema);
    a.addEventListener('ended', aoAcabar);
    a.addEventListener('error', aoFalhar);
    el = a;
    fade = g;
    return true;
  } catch {
    el = null;
    fade = null;
    return false;
  }
}

/**
 * Começa (ou retoma) — SÍNCRONO até o `play()`, de propósito: o iOS só honra o
 * gesto se o `play()` sai na mesma pilha dele. Nunca lança.
 */
function comecar(): boolean {
  if (!ligadaNestaSessao || pausada() || isMuted()) return false;
  if (typeof document !== 'undefined' && document.hidden) return false;
  if (tocando) return true;
  if (!criarElemento() || !el || !fade) return false;
  const b = garantirBarramento();
  if (!b) return false;
  tokenParada++;
  limparTimer();
  try {
    if (b.ctx.state === 'suspended') void b.ctx.resume?.();
    const recomeco = el.ended || el.currentTime === 0;
    if (el.ended) el.currentTime = 0;
    const agora = b.ctx.currentTime;
    fade.gain.cancelScheduledValues(agora);
    fade.gain.setValueAtTime(0, agora);
    fade.gain.linearRampToValueAtTime(1, agora + (recomeco ? TEMA_DO_JOGO.fadeInS : 0.4));
    const p = el.play();
    tocando = true;
    if (p && typeof p.catch === 'function') {
      p.catch(() => {
        // Gesto insuficiente para este motor: não insiste (nada de autoplay cego) —
        // rearma e o PRÓXIMO gesto tenta de novo.
        tocando = false;
        instalarOuvintes();
      });
    }
    return true;
  } catch {
    tocando = false;
    return false;
  }
}

function parar(): void {
  limparTimer();
  tocando = false;
  if (!el) return;
  const meu = ++tokenParada;
  const a = el;
  try {
    const b = garantirBarramento();
    if (b && fade) {
      const agora = b.ctx.currentTime;
      fade.gain.cancelScheduledValues(agora);
      fade.gain.setValueAtTime(fade.gain.value, agora);
      fade.gain.linearRampToValueAtTime(0, agora + 0.15);
    }
  } catch { /* sem rampa: o pause abaixo basta */ }
  setTimeout(() => { if (meu === tokenParada) { try { a.pause(); } catch { /* já parou */ } } }, 170);
}

function aoTrocarVisibilidade(): void {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    // E0: aba escondida → o elemento para na hora (o `audioBus` já suspende o contexto).
    limparTimer();
    tocando = false;
    tokenParada++;
    try { el?.pause(); } catch { /* já parou */ }
    return;
  }
  if (ligadaNestaSessao && !pausada()) comecar();
}

function ligarCicloDeVida(): void {
  if (cicloLigado || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  document.addEventListener('visibilitychange', aoTrocarVisibilidade);
  cicloLigado = true;
}

function desarmar(): void {
  if (!armado || typeof window === 'undefined') return;
  for (const g of GESTOS) window.removeEventListener(g, aoGesto, true);
  armado = false;
}

function aoGesto(): void {
  desarmar();
  if (!temaPreferido()) return;
  if (ligadaNestaSessao) comecar(); else iniciarSessao();
}

function iniciarSessao(): void {
  ligadaNestaSessao = true;
  ligarCicloDeVida();
  comecar();
}

/**
 * Chamado UMA vez no `main.tsx`. Só instala ouvintes de gesto (nada toca, nada é
 * carregado, nenhum `AudioContext` nasce): o tema começa no primeiro toque, clique
 * ou tecla da sessão. Sem preferência ligada, não instala nada.
 */
export function armarTemaNoPrimeiroGesto(): void {
  if (ligadaNestaSessao || !temaPreferido()) return;
  instalarOuvintes();
}

function instalarOuvintes(): void {
  if (armado || typeof window === 'undefined') return;
  for (const g of GESTOS) window.addEventListener(g, aoGesto, { capture: true, passive: true });
  armado = true;
}

/** A sessão já ligou o tema (o 1º gesto veio e a preferência estava ligada)? */
export function temaIniciado(): boolean {
  return ligadaNestaSessao;
}

/**
 * O gesto da TELA DE ABERTURA (07/10/2026, decisão do dono: tema DURANTE a intro).
 * Chamado de dentro do handler do toque — síncrono até o `play()`, como o iOS exige.
 * Idempotente (o ouvinte armado no `main.tsx` pode ter chegado antes, no `pointerup`)
 * e sem efeito se a preferência está desligada. Mudo/pausa/aba escondida seguem
 * valendo dentro de `comecar`.
 */
export function iniciarTemaNoGesto(): void {
  if (!temaPreferido()) return;
  desarmar();
  if (ligadaNestaSessao) comecar(); else iniciarSessao();
}

/** Gesto do jogador nas Configurações: liga (persiste) e começa. */
export function ligarTema(): void {
  writeFlag(STORAGE_KEYS.SOUND_THEME_OFF, false, { silent: true });
  desarmar();
  iniciarSessao();
}

/** Gesto do jogador: desliga (persiste) e para. */
export function desligarTema(): void {
  writeFlag(STORAGE_KEYS.SOUND_THEME_OFF, true, { silent: true });
  desarmar();
  ligadaNestaSessao = false;
  parar();
}

/** Gancho único do App (via `pausarTrilha`): sono / descanso / mudo. Um motivo por chamada. */
export function pausarTema(motivo: MotivoDePausa = 'sono'): void {
  pausas.add(motivo);
  parar();
}

/** Fim de UMA pausa: só retoma se nenhum outro motivo segue vivo e o gesto já veio. */
export function retomarTema(motivo: MotivoDePausa = 'sono'): void {
  pausas.delete(motivo);
  if (!pausada() && ligadaNestaSessao) comecar();
}

export function temaPausado(): boolean {
  return pausada();
}

export function temaTocando(): boolean {
  return tocando;
}

/** Só para teste. */
export function esquecerTema(): void {
  desarmar();
  limparTimer();
  tokenParada++;
  try { el?.pause(); } catch { /* ignorado */ }
  el = null;
  fade = null;
  ligadaNestaSessao = false;
  tocando = false;
  formatoIdx = 0;
  formatosTentados = 0;
  pausas.clear();
}
