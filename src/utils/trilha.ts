/**
 * A TRILHA — hoje só o CONSENTIMENTO e as PAUSAS por motivo da música. O loop de 2 camadas (`trilha-base` +
 * `trilha-ritmo`) SAIU em 20/10/2026 (REGISTRO §136): nenhuma superfície o tocava (o tema e as músicas de combate em
 * streaming cobrem todas), então o motor de reprodução, os arquivos e o trim de loudness foram removidos. Ficou o que
 * tem outro dono: a preferência de música (interruptor único "Música", `audioBus.musicaLigada`, REGISTRO §129, nasce
 * LIGADA desde 19/10/2026) continua só por gesto (D11): ligado é preferência, o som só sai depois do primeiro gesto.
 *
 * - **E0**: dormir / janela de descanso / mudo pausam, por MOTIVO (`MotivoDePausa`), nunca um booleano (achado S-1 da
 *   QA rodada 2, 22/09/2026): desligar o mudo com o pet dormindo não apaga a pausa do sono. A pausa é repassada ao tema
 *   (`tema.ts`) e às músicas de combate (`musicaDeCombate.ts`, que não importa este módulo, sem ciclo).
 * - **Consentimento** (`trilhaConsentida`): o gesto do jogador (Configurações, abrir uma superfície de combate, ou o
 *   primeiro gesto sonoro da sessão com a preferência ligada) é avisado a `musicaDeCombate.ts`. O retorno da aba não é
 *   consentimento. O mudo global também cala a música; o inverso não vale.
 * - `pedirFaixa` é no-op compatível: o diretor (`musica.ts`) ainda a chama com `null`.
 */
import { definirTrilhaLigada, trilhaLigada } from './audioBus';
import { esquecerTema, pausarTema, retomarTema } from './tema';
import {
  consentirMusicaDeCombate, esquecerMusicaDeCombate, pausarMusicaDeCombate, retomarMusicaDeCombate,
} from './musicaDeCombate';

/** As faixas que o diretor pode pedir. O loop saiu: só resta `null` (nada toca por este módulo). */
export type FaixaDaTrilha = 'loop';

let ligadaNestaSessao = false;
let faixaPedida: FaixaDaTrilha | null = null;
/** E0 — por que a música está parada. Vazio = livre para tocar. */
export type MotivoDePausa = 'sono' | 'descanso' | 'mudo';
const pausas = new Set<MotivoDePausa>();
const pausada = (): boolean => pausas.size > 0;

/**
 * Gesto do jogador (Configurações): liga a PREFERÊNCIA e dá o consentimento desta sessão.
 */
export function ligarTrilha(): void {
  definirTrilhaLigada(true);
  ligadaNestaSessao = true;
  consentirMusicaDeCombate(true);
}

/** Gesto do jogador: desliga (persiste) e retira o consentimento. */
export function desligarTrilha(): void {
  definirTrilhaLigada(false);
  ligadaNestaSessao = false;
  consentirMusicaDeCombate(false);
}

/** No-op compatível (o loop saiu em 20/10/2026): guarda o pedido do diretor, nada toca por aqui. */
export function pedirFaixa(f: FaixaDaTrilha | null): void {
  faixaPedida = f;
}

export function faixaPedidaAgora(): FaixaDaTrilha | null {
  return faixaPedida;
}

/**
 * O jogador ABRIU uma superfície de combate (toque na Masmorra/Arena/Torneio/Duelo/Pesadelo) com a música ligada nas Configurações: isso
 * é o gesto da S2 para esta sessão, o mesmo papel que o primeiro gesto sonoro já tinha (`aoGestoSonoro`).
 */
export function consentirNestaSessao(): void {
  if (!trilhaLigada()) return;
  ligadaNestaSessao = true;
  consentirMusicaDeCombate(true);
}

/** Gancho do App: dormir / janela de descanso / mudo global (E0). Um motivo por chamada. */
export function pausarTrilha(motivo: MotivoDePausa = 'sono'): void {
  pausarTema(motivo); // o tema obedece aos mesmos motivos (S17)
  pausas.add(motivo);
  pausarMusicaDeCombate(motivo); // e as músicas de combate em streaming (combate/pesadelo)
}

/** Fim de UMA pausa. Acordar não religa a música de quem está no mudo; desligar o mudo não acorda a de quem está dormindo. */
export function retomarTrilha(motivo: MotivoDePausa = 'sono'): void {
  retomarTema(motivo);
  pausas.delete(motivo);
  retomarMusicaDeCombate(motivo);
}

/** E0, para teste e para a UI: a música está parada por algum motivo? */
export function trilhaPausada(): boolean {
  return pausada();
}

/** O jogador consentiu (por gesto) nesta sessão? */
export function trilhaConsentida(): boolean {
  return ligadaNestaSessao;
}

let primeiroGestoVisto = false;
/**
 * Chamado pelo `play()` de `sounds.ts` a cada gesto sonoro: no PRIMEIRO da
 * sessão, se a preferência persistida está ligada, ganha o consentimento — é o
 * "gesto explícito" da S2 numa sessão nova, sem autoplay no carregamento.
 */
export function aoGestoSonoro(): void {
  if (primeiroGestoVisto) return;
  primeiroGestoVisto = true;
  // Não chama `ligarTrilha()`: ele GRAVA a preferência, e com o padrão LIGADO isso gravaria 'true' sem o jogador escolher.
  if (trilhaLigada() && !ligadaNestaSessao) {
    ligadaNestaSessao = true;
    consentirMusicaDeCombate(true);
  }
}

/** A preferência persistida. */
export function trilhaPreferida(): boolean {
  return trilhaLigada();
}

/** Só para teste. */
export function esquecerTrilha(): void {
  esquecerTema();
  esquecerMusicaDeCombate();
  ligadaNestaSessao = false;
  faixaPedida = null;
  pausas.clear();
  primeiroGestoVisto = false;
}
