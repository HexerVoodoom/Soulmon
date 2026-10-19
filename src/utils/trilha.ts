/**
 * A TRILHA — as duas camadas em fase, em loop, no `busTrilha`. O interruptor de combate ("Música de combate",
 * `SOUND_TRACK_ENABLED`) NASCE LIGADO desde 19/10/2026 (decisão do dono, REGISTRO §102, revoga o "nasce desligada" da
 * S2); continua só por gesto (D11): ligado é preferência, o som só sai depois do primeiro gesto da sessão.
 *
 * Existem DUAS camadas (`base` + `ritmo`, `CAMADAS_DA_TRILHA`), tocando juntas
 * num estado só: a máquina E0–E6 da S13 continua CONGELADA (a condição (2) —
 * o dono ligar a trilha por gesto numa sessão real — não é verificável aqui). Este módulo não decide
 * estado nenhum: liga, desliga, pausa. As duas peças extraídas da S13 valem
 * aqui inteiras:
 * - **E0**: `document.hidden` → o `audioBus` já suspende o contexto; ao voltar,
 *   a trilha retoma **só se o jogador a ligou por gesto nesta sessão** (o
 *   gesto é o consentimento; o retorno da aba não é autoplay). `pausarTrilha()`
 *   é o gancho do App para dormir / janela de descanso / mudo — e a pausa é
 *   por MOTIVO (`MotivoDePausa`), não um booleano: até 22/09/2026 era um só
 *   `pausada`, então desligar o mudo com o pet dormindo (`retomarTrilha()` do
 *   mudo) apagava a pausa do sono e a trilha voltava com o pet dormindo — e o
 *   sono AUTOMÁTICO nem chamava a pausa (achado S-1 da QA rodada 2). Enquanto
 *   houver QUALQUER motivo vivo, `comecar()` recusa — inclusive o `ligarTrilha()`
 *   do primeiro gesto da sessão com o pet já dormindo.
 * - **Chave própria** (`SOUND_TRACK_ENABLED`, separada do mudo global): o mudo
 *   global também cala a trilha — som nunca é o único canal de nada e o app
 *   funciona 100% mudo —, mas o inverso não vale.
 *
 * ## Faixas por superfície (11/10/2026, pedido do dono)
 * O motor toca UMA faixa por vez, escolhida pelo diretor de música (`musica.ts`) via `pedirFaixa`:
 * `loop` (as duas camadas, na Home quando o tema está desligado), `masmorra` (as mesmas camadas, em combate) e
 * `arena` (DERIVADA: as camadas a `RAZAO_DA_ARENA` + a percussão procedural de `trilhaArena.ts`). Trocar de faixa
 * é CROSSFADE (`CROSSFADE_MUSICA_S`), nunca corte; nenhuma faixa nasce tocando (S2 + D11).
 * Desde 19/10/2026 a masmorra toca o "dungeon theme" em streaming (`musicaDeCombate.ts`) e o diretor não pede mais a
 * faixa `masmorra` do loop (o tipo fica, os testes de retomada a usam); o duelo e o torneio tocam o "pvp theme" lá também.
 * Este módulo AVISA `musicaDeCombate.ts` do consentimento e das pausas (ele não importa este, sem ciclo).
 *
 * ## Retomada (auditoria de 11/10/2026)
 * Achados e conserto, cada um com teste em `trilha.retomada.test.ts`:
 *  1. voltar para a aba/APK deixava o contexto `suspended` com as fontes ligadas e ninguém mandava `resume()` —
 *     `comecar()` devolvia `true` ANTES de chegar ao `resume`. Agora a retomada é do `audioBus` (`retomarContexto`)
 *     e a trilha a chama também ao voltar;
 *  2. o `resume()` só era chamado DEPOIS do `await` da carga dos arquivos — fora da pilha do gesto, e o Safari/iOS
 *     o recusa. Agora ele sai SÍNCRONO, antes de qualquer `await`;
 *  3. `pagehide` fecha o contexto e `pageshow` (bfcache) trazia a trilha de volta presa a um contexto morto,
 *     "tocando" (fontes ligadas) em silêncio para sempre. Agora a voz guarda o contexto em que nasceu e é refeita
 *     se ele não é mais o vigente;
 *  4. `busTrilha` nascia em 0 quando o storage falhava (janela privada) e `ligarTrilha()` não conseguia persistir:
 *     tocava em silêncio. Quem toca com consentimento abre o bus.
 *
 * Loudness: o arquivo saiu do pós-processamento no alvo de MASTERIZAÇÃO (`ALVO_MASTERIZACAO_MUSICA_LUFS_S`); o
 * ganho de reprodução é a DIFERENÇA para o alvo vigente (`GANHO_MUSICA_DB`, dono `utils/loudness.ts`) — nenhum
 * número de loudness é escrito aqui. D-1 (Marco abaixa a trilha ao piso) já mora no `audioBus`.
 */
import { definirTrilhaLigada, garantirBarramento, retomarContexto, trilhaLigada } from './audioBus';
import { carregarAsset, CAMADAS_DA_TRILHA, CROSSFADE_MUSICA_S, RAZAO_DA_ARENA, type CamadaDaTrilha } from './sonsAssets';
import {
  db2lin, GANHO_MUSICA_DB, OFFSET_MUSICA_EM_COMBATE_DB, TRIM_FAIXA_ARENA_DB, TRIM_TRILHA_POR_CAMADAS_DB,
} from './loudness';
import { isMuted } from './sounds';
import { esquecerTema, pausarTema, retomarTema } from './tema';
import {
  consentirMusicaDeCombate, esquecerMusicaDeCombate, pausarMusicaDeCombate, retomarMusicaDeCombate,
} from './musicaDeCombate';
import { sintetizarPercussaoDaArena } from './trilhaArena';
import { pausarPesadelo, retomarPesadelo } from './trilhaPesadelo';

/** As faixas que este motor sabe tocar. O DIRETOR (`musica.ts`) decide qual, por superfície. */
export type FaixaDaTrilha = 'loop' | 'masmorra' | 'arena';

/** Em combate a música desce (o golpe, que mais repete, não pode ser coberto): ver `loudness.ts`. */
const EM_COMBATE: Record<FaixaDaTrilha, boolean> = { loop: false, masmorra: true, arena: true };
const usaPercussao = (f: FaixaDaTrilha): boolean => f === 'arena';
const razaoDe = (f: FaixaDaTrilha): number => (f === 'arena' ? RAZAO_DA_ARENA : 1);

/** Uma música em andamento: as fontes, o ganho que a fade e o contexto em que nasceu. */
interface Voz {
  ctx: AudioContext;
  faixa: FaixaDaTrilha;
  fontes: AudioBufferSourceNode[];
  trim: GainNode;
}

let voz: Voz | null = null;
const saindo = new Set<Voz>();
let ligadaNestaSessao = false;
/** O que o diretor pediu. Padrão `loop` = o comportamento de antes do roteamento (nenhum diretor instalado). */
let faixaPedida: FaixaDaTrilha | null = 'loop';
let tokenCarga = 0;
/** E0 — por que a trilha está parada. Vazio = livre para tocar. */
export type MotivoDePausa = 'sono' | 'descanso' | 'mudo';
const pausas = new Set<MotivoDePausa>();
const pausada = (): boolean => pausas.size > 0;
let cicloLigado = false;
let bufferPercussao: { taxa: number; buf: AudioBuffer } | null = null;

/** Ganho (linear) final da voz: trim por nº de camadas + ganho de reprodução + combate + trim da faixa. */
function ganhoDaVoz(faixa: FaixaDaTrilha, camadas: 1 | 2): number {
  const db = TRIM_TRILHA_POR_CAMADAS_DB[camadas] + GANHO_MUSICA_DB
    + (EM_COMBATE[faixa] ? OFFSET_MUSICA_EM_COMBATE_DB : 0)
    + (faixa === 'arena' ? TRIM_FAIXA_ARENA_DB : 0);
  return db2lin(db);
}

/** Rampa linear defensiva (o motor falso dos testes não tem automação). */
function rampa(p: AudioParam, de: number, para: number, ctx: BaseAudioContext, s: number): void {
  try {
    const t = ctx.currentTime;
    p.cancelScheduledValues?.(t);
    p.setValueAtTime?.(de, t);
    if (p.linearRampToValueAtTime) p.linearRampToValueAtTime(para, t + s);
    else p.value = para;
  } catch { p.value = para; }
}

function descartar(v: Voz): void {
  for (const f of v.fontes) {
    try { f.stop(); } catch { /* já parou */ }
    try { f.disconnect(); } catch { /* nó solto */ }
  }
  try { v.trim.disconnect(); } catch { /* nó solto */ }
  saindo.delete(v);
}

/** Tira a voz de cena: com `fadeS` > 0 ela desce em rampa e só então para (crossfade); sem, na hora. */
function parar(fadeS = 0): void {
  const v = voz;
  voz = null;
  tokenCarga++;
  if (!v) return;
  if (fadeS <= 0) { descartar(v); return; }
  saindo.add(v);
  try {
    rampa(v.trim.gain, v.trim.gain.value, 0, v.ctx, fadeS);
    const fim = v.ctx.currentTime + fadeS + 0.05;
    for (const f of v.fontes) { try { f.stop(fim); } catch { /* já parou */ } }
  } catch { /* sem automação: o descarte abaixo basta */ }
  setTimeout(() => descartar(v), fadeS * 1000 + 120);
}

function percussao(ctx: BaseAudioContext): AudioBuffer | null {
  try {
    if (bufferPercussao && bufferPercussao.taxa === ctx.sampleRate) return bufferPercussao.buf;
    const dados = sintetizarPercussaoDaArena(ctx.sampleRate);
    const buf = ctx.createBuffer(1, dados.length, ctx.sampleRate);
    buf.copyToChannel(dados, 0);
    bufferPercussao = { taxa: ctx.sampleRate, buf };
    return buf;
  } catch { return null; }
}

async function comecar(): Promise<boolean> {
  const faixa = faixaPedida;
  if (!faixa || pausada() || isMuted() || !ligadaNestaSessao) return false;
  const b = garantirBarramento();
  if (!b) return false;

  if (voz) {
    if (voz.ctx !== b.ctx || (b.ctx.state as string) === 'closed') {
      // Contexto morto (pagehide → pageshow do bfcache): a voz "toca" em silêncio. Refaz do zero.
      descartar(voz);
      voz = null;
    } else {
      // Mesma faixa → só garante o contexto vivo (voltar de aba/APK). Outra faixa do MESMO material → o ganho
      // desliza (sem recomeçar a música); material diferente → crossfade para a voz nova, abaixo.
      if (b.ctx.state === 'suspended') void b.ctx.resume?.();
      if (voz.faixa === faixa) return true;
      if (usaPercussao(voz.faixa) === usaPercussao(faixa)) {
        const g = ganhoDaVoz(faixa, Math.min(voz.fontes.length, 2) as 1 | 2);
        rampa(voz.trim.gain, voz.trim.gain.value, g, voz.ctx, CROSSFADE_MUSICA_S);
        voz.faixa = faixa;
        return true;
      }
      parar(CROSSFADE_MUSICA_S);
    }
  }

  // O `resume` sai AQUI, síncrono, ainda na pilha do gesto: depois do `await` abaixo o Safari/iOS o recusa.
  if (b.ctx.state === 'suspended') void b.ctx.resume?.();
  const meu = ++tokenCarga;
  const nomes = Object.keys(CAMADAS_DA_TRILHA) as CamadaDaTrilha[];
  const bufs = await Promise.all(nomes.map(n => carregarAsset(b.ctx, CAMADAS_DA_TRILHA[n])));
  // Só as camadas que chegaram tocam; o trim é o do NÚMERO que toca (medido, `loudness.ts`).
  const prontas = nomes.filter((_, i) => bufs[i] !== null);
  if (meu !== tokenCarga || prontas.length === 0 || voz || pausada() || !ligadaNestaSessao || faixaPedida !== faixa) return false;
  try {
    if (b.ctx.state === 'suspended') void b.ctx.resume?.();
    // Quem toca com consentimento abre o bus: com o storage falhando (janela privada) a flag não persiste e o
    // `busTrilha` nasceria em 0 — tocava em silêncio. O gesto que ligou é a verdade desta sessão.
    b.busTrilha.gain.value = 1;
    const g = b.ctx.createGain();
    const n = Math.min(prontas.length, 2) as 1 | 2;
    const alvo = ganhoDaVoz(faixa, n);
    g.gain.value = 0;
    g.connect(b.busTrilha);
    // Mesmo instante de início para todas: as camadas foram mestradas no mesmo BPM e no mesmo
    // ponto de loop, e é o início comum que as mantém em fase compasso a compasso.
    const t0 = b.ctx.currentTime + 0.02;
    const razao = razaoDe(faixa);
    const fontes: AudioBufferSourceNode[] = [];
    for (const nome of prontas) {
      const buf = bufs[nomes.indexOf(nome)] as AudioBuffer;
      const src = b.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      // O arquivo carrega 1 s de cauda (a cabeça do loop repetida) porque o codec perde a ponta;
      // o loop fecha no ponto exato do manifesto, dentro de áudio válido. Os pontos são em segundos do BUFFER:
      // a razão de reprodução não os muda.
      src.loopStart = 0;
      src.loopEnd = Math.min(CAMADAS_DA_TRILHA[nome].duracaoS, buf.duration);
      if (razao !== 1 && src.playbackRate) src.playbackRate.value = razao;
      src.connect(g);
      src.start(t0);
      fontes.push(src);
    }
    if (usaPercussao(faixa)) {
      const p = percussao(b.ctx);
      if (p) {
        const src = b.ctx.createBufferSource();
        src.buffer = p;
        src.loop = true;
        src.connect(g);
        src.start(t0);
        fontes.push(src);
      }
    }
    rampa(g.gain, 0, alvo, b.ctx, CROSSFADE_MUSICA_S);
    voz = { ctx: b.ctx, faixa, fontes, trim: g };
    return true;
  } catch {
    parar();
    return false;
  }
}

function aoTrocarVisibilidade(): void {
  if (typeof document === 'undefined') return;
  if (document.hidden) return;
  // Voltou: o contexto pode ter ficado `suspended` com as fontes ligadas (achado 1 da auditoria) e a voz pode
  // ter ficado presa a um contexto fechado (achado 3). `comecar` cobre os dois.
  retomarContexto();
  if (ligadaNestaSessao && !pausada()) void comecar();
}

function ligarCicloDeVida(): void {
  if (cicloLigado || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  document.addEventListener('visibilitychange', aoTrocarVisibilidade);
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('pageshow', aoTrocarVisibilidade);
  }
  cicloLigado = true;
}

/**
 * Gesto do jogador (Configurações): liga a PREFERÊNCIA e dá o consentimento desta sessão. Quem decide se a trilha
 * toca agora é a faixa que o diretor pediu (`pedirFaixa`): com o tema tocando na Home, ligar a trilha não a coloca
 * por cima dele — ela entra na masmorra e na arena. Sem diretor (testes), `loop` é o padrão e toca na hora.
 */
export function ligarTrilha(): void {
  definirTrilhaLigada(true);
  ligadaNestaSessao = true;
  ligarCicloDeVida();
  consentirMusicaDeCombate(true);
  void comecar();
}

/** Gesto do jogador: desliga (persiste) e para. */
export function desligarTrilha(): void {
  definirTrilhaLigada(false);
  ligadaNestaSessao = false;
  consentirMusicaDeCombate(false);
  parar(CROSSFADE_MUSICA_S);
}

/**
 * O DIRETOR (`musica.ts`) pede a faixa da superfície atual (`null` = a trilha não toca agora). Trocar é crossfade.
 * Não dá consentimento: só toca se o jogador já ligou a trilha por gesto nesta sessão (`ligarTrilha`/`consentir`).
 */
export function pedirFaixa(f: FaixaDaTrilha | null): void {
  if (faixaPedida === f) { if (f && ligadaNestaSessao && !pausada()) void comecar(); return; }
  faixaPedida = f;
  if (!f) { parar(CROSSFADE_MUSICA_S); return; }
  if (ligadaNestaSessao && !pausada()) void comecar();
}

export function faixaPedidaAgora(): FaixaDaTrilha | null {
  return faixaPedida;
}

/**
 * O jogador ABRIU uma superfície de combate (toque na Masmorra/Arena) com a trilha ligada nas Configurações: isso
 * é o gesto da S2 para esta sessão, o mesmo papel que o primeiro gesto sonoro já tinha (`aoGestoSonoro`).
 */
export function consentirNestaSessao(): void {
  if (!trilhaLigada()) return;
  ligadaNestaSessao = true;
  ligarCicloDeVida();
  consentirMusicaDeCombate(true);
}

/** Gancho do App: dormir / janela de descanso / mudo global (E0). Um motivo por chamada. */
export function pausarTrilha(motivo: MotivoDePausa = 'sono'): void {
  pausarTema(motivo); // o tema obedece aos mesmos motivos (S17)
  pausas.add(motivo);
  pausarPesadelo(motivo); // a trilha de terror do Pesadelo obedece aos mesmos motivos
  pausarMusicaDeCombate(motivo); // e as músicas de combate em streaming (dungeon/pvp theme)
  parar(); // dormir não é troca de cena: corta (a rampa de 150 ms do tema basta)
}

/** Fim de UMA pausa: só retoma se nenhum outro motivo segue vivo E o jogador
 *  tinha ligado por gesto nesta sessão. Acordar não religa a trilha de quem
 *  está no mudo; desligar o mudo não acorda a trilha de quem está dormindo. */
export function retomarTrilha(motivo: MotivoDePausa = 'sono'): void {
  retomarTema(motivo);
  pausas.delete(motivo);
  retomarPesadelo(motivo);
  retomarMusicaDeCombate(motivo);
  if (!pausada() && ligadaNestaSessao) void comecar();
}

/** E0, para teste e para a UI: a trilha está parada por algum motivo? */
export function trilhaPausada(): boolean {
  return pausada();
}

let primeiroGestoVisto = false;
/**
 * Chamado pelo `play()` de `sounds.ts` a cada gesto sonoro: no PRIMEIRO da
 * sessão, se a preferência persistida está ligada, a trilha ganha o consentimento — é o
 * "gesto explícito" da S2 numa sessão nova, sem autoplay no carregamento. (Desde 11/10/2026 o tema ligado NÃO
 * a impede: as duas convivem, uma por superfície, e quem escolhe é o diretor.)
 */
export function aoGestoSonoro(): void {
  if (primeiroGestoVisto) return;
  primeiroGestoVisto = true;
  // Não chama `ligarTrilha()`: ele GRAVA a preferência, e com o padrão LIGADO isso gravaria 'true' sem o jogador escolher.
  if (trilhaLigada() && !ligadaNestaSessao) {
    ligadaNestaSessao = true;
    ligarCicloDeVida();
    consentirMusicaDeCombate(true);
    void comecar();
  }
}

/** A preferência persistida (a trilha só TOCA depois de `ligarTrilha()`). */
export function trilhaPreferida(): boolean {
  return trilhaLigada();
}

export function trilhaTocando(): boolean {
  return voz !== null && voz.fontes.length > 0;
}

/** Quantas fontes da voz atual estão tocando (as camadas; a Arena soma a percussão). */
export function camadasTocando(): number {
  return voz ? voz.fontes.length : 0;
}

/** A faixa que está de fato soando (e não a pedida), ou `null`. */
export function faixaTocando(): FaixaDaTrilha | null {
  return voz ? voz.faixa : null;
}

/** Só para teste. */
export function esquecerTrilha(): void {
  esquecerTema();
  esquecerMusicaDeCombate();
  parar();
  for (const v of [...saindo]) descartar(v);
  ligadaNestaSessao = false;
  faixaPedida = 'loop';
  pausas.clear();
  primeiroGestoVisto = false;
  bufferPercussao = null;
}
