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
 * primeiro gesto chega (S6: zero no bundle inicial). A maquinaria do `<audio>`
 * (formato por suporte, troca única de formato, fade, volta) mora em
 * `streamMusica.ts` (extraída em 19/10/2026, dividida com as músicas de combate);
 * aqui ficam a preferência, o gesto e as pausas por motivo.
 *
 * Fim e retomada, sem corte feio: a faixa já termina num fade de ~5 s; ao acabar
 * o tema descansa `pausaEntreVoltasS` em silêncio e volta com fade-in curto.
 * Presença, não alarme: ele nunca emenda no próprio rabo como um loop seco.
 */
import { CROSSFADE_MUSICA_S, TEMA_DO_JOGO } from './sonsAssets';
import { criarPlayerDeStreaming, escolherFormatoDe } from './streamMusica';
import { db2lin, GANHO_MUSICA_DB, OFFSET_MUSICA_EM_COMBATE_DB } from './loudness';
import { musicaLigada, definirMusicaLigada } from './audioBus';

/** Mesmos motivos da trilha (`trilha.ts`): quem pausa por um não libera o outro. */
export type MotivoDePausa = 'sono' | 'descanso' | 'mudo';
/**
 * Mais um motivo, só do tema: `cena` = o diretor de música (`musica.ts`) pôs outra faixa no lugar dele (a música
 * de combate). É um motivo como os outros — o tema volta de onde parou quando a cena sai — mas com
 * crossfade em vez de corte, e sem nada a ver com o sono/mudo (um não libera o outro).
 */
export type MotivoDoTema = MotivoDePausa | 'cena';

const pausas = new Set<MotivoDoTema>();
const pausada = (): boolean => pausas.size > 0;

let emCombate = false;
/** Fade-in da PRÓXIMA retomada (sem recomeço): curto, e longo (crossfade) quando quem volta é a cena. */
let fadeDeRetomadaS = 0.4;
let ligadaNestaSessao = false;
let cicloLigado = false;

const GESTOS = ['pointerup', 'touchend', 'keydown', 'click'] as const;
let armado = false;

/** A preferência: a ÚNICA de música (§129, dono `audioBus.musicaLigada`); nasce ligada. */
export function temaPreferido(): boolean {
  return musicaLigada();
}

/** O formato que este motor diz tocar; WebM/Opus primeiro (menor), M4A como rede. */
export function escolherFormato(probe: Pick<HTMLAudioElement, 'canPlayType'>): number {
  return escolherFormatoDe(TEMA_DO_JOGO.formatos, probe);
}

/** O ganho de reprodução do tema (linear): `GANHO_MUSICA_DB` da política, e em combate desce `OFFSET_MUSICA_EM_COMBATE_DB`. */
function alvoDoFade(): number {
  return db2lin(GANHO_MUSICA_DB + (emCombate ? OFFSET_MUSICA_EM_COMBATE_DB : 0));
}

const player = criarPlayerDeStreaming({
  manifesto: TEMA_DO_JOGO,
  bus: b => b.busTema,
  podeTocar: () => ligadaNestaSessao && !pausada(),
  alvo: alvoDoFade,
  aoRecusarPlay: () => instalarOuvintes(),
});

/** O diretor avisa que a superfície atual é de combate (o tema continua, mais baixo, se a trilha de combate está desligada). */
export function definirTemaEmCombate(on: boolean): void {
  if (emCombate === on) return;
  emCombate = on;
  player.rampaParaAlvo(CROSSFADE_MUSICA_S);
}

/** Começa (ou retoma) — o player é SÍNCRONO até o `play()`. Nunca lança. */
function comecar(): boolean {
  const ok = player.comecar(fadeDeRetomadaS);
  if (ok) fadeDeRetomadaS = 0.4;
  return ok;
}

function parar(fadeS?: number): void {
  player.parar(fadeS);
}

function aoTrocarVisibilidade(): void {
  if (typeof document === 'undefined') return;
  if (document.hidden) {
    player.ocultar(); // E0: aba escondida → o elemento para na hora
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
  definirMusicaLigada(true);
  desarmar();
  iniciarSessao();
}

/** Gesto do jogador: desliga (persiste) e para. */
export function desligarTema(): void {
  definirMusicaLigada(false);
  desarmar();
  ligadaNestaSessao = false;
  parar();
}

/** Gancho único do App (via `pausarTrilha`): sono / descanso / mudo. Um motivo por chamada. */
export function pausarTema(motivo: MotivoDoTema = 'sono'): void {
  pausas.add(motivo);
  parar(motivo === 'cena' ? CROSSFADE_MUSICA_S : undefined); // troca de cena = crossfade; dormir/mudo = rampa curta
}

/** Fim de UMA pausa: só retoma se nenhum outro motivo segue vivo e o gesto já veio. */
export function retomarTema(motivo: MotivoDoTema = 'sono'): void {
  pausas.delete(motivo);
  if (motivo === 'cena') fadeDeRetomadaS = CROSSFADE_MUSICA_S;
  if (!pausada() && ligadaNestaSessao) comecar();
}

export function temaPausado(): boolean {
  return pausada();
}

export function temaTocando(): boolean {
  return player.tocando();
}

/** Só para teste. */
export function esquecerTema(): void {
  desarmar();
  player.esquecer();
  fadeDeRetomadaS = 0.4;
  emCombate = false;
  ligadaNestaSessao = false;
  pausas.clear();
}
