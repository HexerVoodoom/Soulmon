/**
 * A TRILHA — uma camada, em loop, no `busTrilha`. Nasce desligada (S2).
 *
 * O que existe hoje é **só E1** (`base`): S13 continua CONGELADA — o contrato
 * E0–E6 pede ≥2 camadas reais no repositório, e há uma. Este módulo não decide
 * estado nenhum: liga, desliga, pausa. As duas peças extraídas da S13 valem
 * aqui inteiras:
 * - **E0**: `document.hidden` → o `audioBus` já suspende o contexto; ao voltar,
 *   a trilha retoma **só se o jogador a ligou por gesto nesta sessão** (o
 *   gesto é o consentimento; o retorno da aba não é autoplay). `pausar()` é
 *   o gancho do App para dormir/janela de descanso.
 * - **Chave própria** (`SOUND_TRACK_ENABLED`, separada do mudo global): o mudo
 *   global também cala a trilha — som nunca é o único canal de nada e o app
 *   funciona 100% mudo —, mas o inverso não vale.
 *
 * Loudness: o arquivo saiu do pós-processamento no alvo da trilha
 * (`ALVO_TRILHA_LUFS_S`, dono `utils/loudness.ts`), então toca a ganho 1.
 * D-1 (Marco abaixa a trilha ao piso) já mora no `audioBus`.
 */
import { definirTrilhaLigada, garantirBarramento, trilhaLigada } from './audioBus';
import { carregarAsset, TRILHA_BASE } from './sonsAssets';
import { isMuted } from './sounds';

let fonte: AudioBufferSourceNode | null = null;
let ligadaNestaSessao = false;
let pausada = false;
let cicloLigado = false;

function parar(): void {
  if (!fonte) return;
  try { fonte.stop(); } catch { /* já parou */ }
  try { fonte.disconnect(); } catch { /* nó solto */ }
  fonte = null;
}

async function comecar(): Promise<boolean> {
  if (fonte || pausada || isMuted()) return fonte !== null;
  const b = garantirBarramento();
  if (!b) return false;
  const buf = await carregarAsset(b.ctx, TRILHA_BASE);
  if (!buf || fonte || pausada || !ligadaNestaSessao) return false;
  try {
    if (b.ctx.state === 'suspended') void b.ctx.resume?.();
    const src = b.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(b.busTrilha);
    src.start(b.ctx.currentTime);
    fonte = src;
    return true;
  } catch {
    return false;
  }
}

function aoTrocarVisibilidade(): void {
  if (typeof document === 'undefined') return;
  if (!document.hidden && ligadaNestaSessao && !pausada) void comecar();
}

function ligarCicloDeVida(): void {
  if (cicloLigado || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  document.addEventListener('visibilitychange', aoTrocarVisibilidade);
  cicloLigado = true;
}

/** Gesto do jogador: liga (persiste a chave) e começa a tocar. */
export function ligarTrilha(): void {
  definirTrilhaLigada(true);
  ligadaNestaSessao = true;
  ligarCicloDeVida();
  void comecar();
}

/** Gesto do jogador: desliga (persiste) e para. */
export function desligarTrilha(): void {
  definirTrilhaLigada(false);
  ligadaNestaSessao = false;
  parar();
}

/** Gancho do App: dormir / janela de descanso / mudo global (E0). */
export function pausarTrilha(): void {
  pausada = true;
  parar();
}

/** Fim da pausa: só retoma se o jogador tinha ligado por gesto nesta sessão. */
export function retomarTrilha(): void {
  pausada = false;
  if (ligadaNestaSessao) void comecar();
}

let primeiroGestoVisto = false;
/**
 * Chamado pelo `play()` de `sounds.ts` a cada gesto sonoro: no PRIMEIRO da
 * sessão, se a preferência persistida está ligada, a trilha começa — é o
 * "gesto explícito" da S2 numa sessão nova, sem autoplay no carregamento.
 */
export function aoGestoSonoro(): void {
  if (primeiroGestoVisto) return;
  primeiroGestoVisto = true;
  if (trilhaLigada() && !ligadaNestaSessao) ligarTrilha();
}

/** A preferência persistida (a trilha só TOCA depois de `ligarTrilha()`). */
export function trilhaPreferida(): boolean {
  return trilhaLigada();
}

export function trilhaTocando(): boolean {
  return fonte !== null;
}

/** Só para teste. */
export function esquecerTrilha(): void {
  parar();
  ligadaNestaSessao = false;
  pausada = false;
  primeiroGestoVisto = false;
}
