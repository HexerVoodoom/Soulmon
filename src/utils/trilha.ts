/**
 * A TRILHA — duas camadas em fase, em loop, no `busTrilha`. Nasce desligada (S2).
 *
 * Existem DUAS camadas (`base` + `ritmo`, `CAMADAS_DA_TRILHA`), tocando juntas
 * num estado só: a máquina E0–E6 da S13 continua CONGELADA (a condição (2) —
 * o dono ligar a trilha por gesto numa sessão real — não é verificável aqui). Este módulo não decide
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
import { carregarAsset, CAMADAS_DA_TRILHA, type CamadaDaTrilha } from './sonsAssets';
import { db2lin, TRIM_TRILHA_POR_CAMADAS_DB } from './loudness';
import { isMuted } from './sounds';

let fontes: AudioBufferSourceNode[] = [];
let trim: GainNode | null = null;
let ligadaNestaSessao = false;
let pausada = false;
let cicloLigado = false;

function parar(): void {
  for (const f of fontes) {
    try { f.stop(); } catch { /* já parou */ }
    try { f.disconnect(); } catch { /* nó solto */ }
  }
  fontes = [];
  if (trim) { try { trim.disconnect(); } catch { /* nó solto */ } trim = null; }
}

async function comecar(): Promise<boolean> {
  if (fontes.length || pausada || isMuted()) return fontes.length > 0;
  const b = garantirBarramento();
  if (!b) return false;
  const nomes = Object.keys(CAMADAS_DA_TRILHA) as CamadaDaTrilha[];
  const bufs = await Promise.all(nomes.map(n => carregarAsset(b.ctx, CAMADAS_DA_TRILHA[n])));
  // Só as camadas que chegaram tocam; o trim é o do NÚMERO que toca (medido, `loudness.ts`).
  const prontas = nomes.filter((_, i) => bufs[i] !== null);
  if (prontas.length === 0 || fontes.length || pausada || !ligadaNestaSessao) return false;
  try {
    if (b.ctx.state === 'suspended') void b.ctx.resume?.();
    const g = b.ctx.createGain();
    const n = Math.min(prontas.length, 2) as 1 | 2;
    g.gain.value = db2lin(TRIM_TRILHA_POR_CAMADAS_DB[n]);
    g.connect(b.busTrilha);
    // Mesmo instante de início para todas: as camadas foram mestradas no mesmo BPM e no mesmo
    // ponto de loop, e é o início comum que as mantém em fase compasso a compasso.
    const t0 = b.ctx.currentTime + 0.02;
    for (const nome of prontas) {
      const buf = bufs[nomes.indexOf(nome)] as AudioBuffer;
      const src = b.ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      // O arquivo carrega 1 s de cauda (a cabeça do loop repetida) porque o codec perde a ponta;
      // o loop fecha no ponto exato do manifesto, dentro de áudio válido.
      src.loopStart = 0;
      src.loopEnd = Math.min(CAMADAS_DA_TRILHA[nome].duracaoS, buf.duration);
      src.connect(g);
      src.start(t0);
      fontes.push(src);
    }
    trim = g;
    return true;
  } catch {
    parar();
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
  return fontes.length > 0;
}

/** Quantas camadas estão tocando agora (0, 1 ou 2). */
export function camadasTocando(): number {
  return fontes.length;
}

/** Só para teste. */
export function esquecerTrilha(): void {
  parar();
  ligadaNestaSessao = false;
  pausada = false;
  primeiroGestoVisto = false;
}
