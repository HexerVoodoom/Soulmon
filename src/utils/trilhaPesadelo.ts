/**
 * A TRILHA DO PESADELO — versão TERROR da trilha do jogo (15/10/2026, pedido do dono). Toca SÓ durante o Pesadelo
 * (o convite e a luta, `NightmareBattle`) e é GERADA EM CÓDIGO: nenhum arquivo de áudio no repositório.
 *
 * ## O que é (síntese pura, determinística por semente)
 * `sintetizarTrilhaPesadelo` devolve um `Float32Array` mono em loop, sem emenda, feito só de:
 *  · DRONES graves: raiz Ré (D1) + tritono + cluster de segundas (Ré/Mib/Fá♯) em dentes de serra suavizados, com o
 *    batimento lento do desafinado (±0,1–0,3 Hz) e uma respiração de amplitude;
 *  · PAD com detuning: acorde diminuto-cluster em três vozes desafinadas por nota (coro que "azeda");
 *  · BATIDA DE CORAÇÃO (lub-dub, 45 bpm) e INFRASSOM (18 Hz, quase só sentido);
 *  · SUSSURROS: ruído filtrado (passa-banda ressonante deslizando) em rajadas silábicas esparsas;
 *  · STINGERS esparsos: sinos FM inarmônicos (tritono + segunda menor) com ataque curto e cauda longa.
 *
 * ## Por que não tem emenda
 * Toda frequência periódica é encaixada em múltiplo inteiro de `1/duracao` (cada oscilador fecha um número inteiro de
 * ciclos no loop) e todo evento (batida, sussurro, stinger) é ESCRITO COM MÓDULO: a cauda que passa do fim volta ao começo
 * somada. O último amostra e a primeira são vizinhas contínuas. Teste: `trilhaPesadelo.test.ts`.
 *
 * ## Como toca (e o que respeita)
 *  · O diretor de música (`musica.ts`) chama `pedirTrilhaPesadelo(true)` ao abrir o Pesadelo e `(false)` ao fechar
 *    (fade de saída `FADE_PESADELO_S`). O tema e as faixas de combate NÃO tocam por cima (`pausarTema('cena')` no diretor).
 *  · Só toca se o jogador JÁ liga música (tema OU trilha de combate nas Configurações) — `permitido` vem do diretor — e
 *    nunca no mudo, nem dormindo/janela de descanso (mesmos motivos de pausa de `trilha.ts`), nem com a aba oculta.
 *  · Nasce de um GESTO: abrir o Pesadelo é toque do jogador; o contexto é o compartilhado do `audioBus`
 *    (`garantirBarramento`, `resume()` síncrono) e a trilha passa pelo `busTrilha` — o MESMO volume/limitador do resto
 *    da música. Nenhum nó é criado antes disso (nem no mudo).
 *  · A LOUDNESS segue a das camadas da trilha: pico do buffer em −14,1 dBFS (como as camadas) + o ganho de reprodução
 *    de `loudness.ts` (`GANHO_MUSICA_DB`, trim de 1 camada, offset de combate). Nenhum número de loudness novo.
 *
 * ## O ENCAIXE PARA O MP3 DO DONO
 * Se existir `src/assets/audio/pesadelo-trilha.mp3` (ou `.ogg`/`.m4a`), ele toca NO LUGAR da procedural, em loop pelo
 * mesmo caminho (mesmo bus, mesmo fade, mesmo volume). Sem o arquivo: a procedural. Para trocar: solte o arquivo com
 * esse nome em `src/assets/audio/` e rode o build — nada mais. Recomendado: loop sem emenda, pico perto de −14 dBFS
 * (o ganho de reprodução é o mesmo da procedural). Se a decodificação falhar, cai na procedural.
 */
import { garantirBarramento, retomarContexto } from './audioBus';
import { db2lin, GANHO_MUSICA_DB, OFFSET_MUSICA_EM_COMBATE_DB, TRIM_TRILHA_POR_CAMADAS_DB } from './loudness';
import { isMuted } from './sounds';
import { CROSSFADE_MUSICA_S } from './sonsAssets';
import { TAXA_PESADELO, sintetizarTrilhaPesadelo } from './trilhaPesadeloSintese';

export {
  DURACAO_PESADELO_S, TAXA_PESADELO, SEMENTE_PESADELO, PICO_PESADELO, sintetizarTrilhaPesadelo, medirTrilha, paraWav16,
  type OpcoesDaTrilhaPesadelo,
} from './trilhaPesadeloSintese';

export const FADE_ENTRADA_PESADELO_S = 3;
export const FADE_SAIDA_PESADELO_S = CROSSFADE_MUSICA_S + 0.8;

/* ── o arquivo opcional do dono (encaixe) ────────────────────────────────── */

const ARQUIVOS = import.meta.glob('../assets/audio/pesadelo-trilha.{mp3,ogg,m4a}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
/** URL do MP3 do dono, se ele soltou `src/assets/audio/pesadelo-trilha.mp3` (ou .ogg/.m4a). `undefined` = procedural. */
export const ARQUIVO_DO_DONO: string | undefined = Object.values(ARQUIVOS)[0];

/* ── a reprodução ────────────────────────────────────────────────────────── */

type Motivo = 'sono' | 'descanso' | 'mudo';
interface Voz { ctx: AudioContext; src: AudioBufferSourceNode; trim: GainNode }

let voz: Voz | null = null;
let pedida = false;
let permitido = false;
let token = 0;
const pausas = new Set<Motivo>();
let cache: { taxa: number; buf: AudioBuffer } | null = null;
let ciclo = false;

const ganhoFinal = (): number =>
  db2lin(TRIM_TRILHA_POR_CAMADAS_DB[1] + GANHO_MUSICA_DB + OFFSET_MUSICA_EM_COMBATE_DB);

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
  try { v.src.stop(); } catch { /* já parou */ }
  try { v.src.disconnect(); } catch { /* nó solto */ }
  try { v.trim.disconnect(); } catch { /* nó solto */ }
}

function parar(fadeS = 0): void {
  const v = voz;
  voz = null;
  token++;
  if (!v) return;
  if (fadeS <= 0) { descartar(v); return; }
  try {
    rampa(v.trim.gain, v.trim.gain.value, 0, v.ctx, fadeS);
    v.src.stop(v.ctx.currentTime + fadeS + 0.05);
  } catch { /* sem automação: o descarte abaixo basta */ }
  setTimeout(() => descartar(v), fadeS * 1000 + 120);
}

function bufferProcedural(ctx: BaseAudioContext): AudioBuffer | null {
  try {
    if (cache && cache.taxa === TAXA_PESADELO) return cache.buf;
    const dados = sintetizarTrilhaPesadelo();
    const buf = ctx.createBuffer(1, dados.length, TAXA_PESADELO);
    buf.copyToChannel(dados, 0);
    cache = { taxa: TAXA_PESADELO, buf };
    return buf;
  } catch { return null; }
}

async function bufferDoDono(ctx: BaseAudioContext): Promise<AudioBuffer | null> {
  if (!ARQUIVO_DO_DONO || typeof fetch !== 'function') return null;
  try {
    const r = await fetch(ARQUIVO_DO_DONO);
    if (!r.ok) return null;
    return await ctx.decodeAudioData(await r.arrayBuffer());
  } catch { return null; }
}

/** Na dúvida, silêncio: se o estado de mudo não puder ser lido (módulo substituído, storage degradado), trata como mudo. */
const mudo = (): boolean => { try { return isMuted(); } catch { return true; } };

const podeTocar = (): boolean =>
  pedida && permitido && pausas.size === 0 && !mudo() && !(typeof document !== 'undefined' && document.hidden);

async function comecar(): Promise<void> {
  if (!podeTocar()) return;
  const b = garantirBarramento();
  if (!b) return;
  if (voz) {
    if (voz.ctx === b.ctx && (b.ctx.state as string) !== 'closed') {
      if (b.ctx.state === 'suspended') void b.ctx.resume?.();
      return; // já toca
    }
    descartar(voz); // contexto morto (pagehide → pageshow do bfcache): refaz
    voz = null;
  }
  // O `resume` sai AQUI, síncrono, ainda na pilha do gesto (o Safari/iOS recusa depois de um `await`).
  if (b.ctx.state === 'suspended') void b.ctx.resume?.();
  const meu = ++token;
  let buf = await bufferDoDono(b.ctx);
  if (!buf && !cache) await new Promise(r => setTimeout(r, 30)); // a conta (~0,5 s) cede o quadro: o convite pinta antes
  buf = buf ?? bufferProcedural(b.ctx);
  if (!buf || meu !== token || voz || !podeTocar()) return;
  try {
    if (b.ctx.state === 'suspended') void b.ctx.resume?.();
    b.busTrilha.gain.value = 1; // quem toca com consentimento abre o bus (a flag pode não persistir em janela privada)
    const g = b.ctx.createGain();
    g.gain.value = 0;
    g.connect(b.busTrilha);
    const src = b.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = buf.duration;
    src.connect(g);
    src.start(b.ctx.currentTime + 0.02);
    rampa(g.gain, 0, ganhoFinal(), b.ctx, FADE_ENTRADA_PESADELO_S);
    voz = { ctx: b.ctx, src, trim: g };
  } catch {
    parar();
  }
}

function aoVoltar(): void {
  if (typeof document === 'undefined' || document.hidden) return;
  retomarContexto();
  void comecar();
}

function ligarCiclo(): void {
  if (ciclo || typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  document.addEventListener('visibilitychange', aoVoltar);
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') window.addEventListener('pageshow', aoVoltar);
  ciclo = true;
}

/**
 * Diretor de música: o Pesadelo abriu (`on`) ou fechou. `permitirSePreferida` = o jogador tem música ligada nas
 * Configurações (tema ou trilha de combate). Abrir o Pesadelo é o gesto; a trilha entra em fade e sai em fade.
 */
export function pedirTrilhaPesadelo(on: boolean, permitirSePreferida = true): void {
  pedida = on;
  permitido = on && permitirSePreferida;
  if (!on || !permitido) { parar(FADE_SAIDA_PESADELO_S); return; }
  ligarCiclo();
  void comecar();
}

/** Gancho de `trilha.ts` (`pausarTrilha`): dormir / descanso / mudo cortam a trilha do Pesadelo também. */
export function pausarPesadelo(motivo: Motivo): void {
  pausas.add(motivo);
  parar();
}

export function retomarPesadelo(motivo: Motivo): void {
  pausas.delete(motivo);
  if (pausas.size === 0) void comecar();
}

export function trilhaPesadeloTocando(): boolean {
  return voz !== null;
}

/** Só para teste. */
export function esquecerTrilhaPesadelo(): void {
  parar();
  pedida = false;
  permitido = false;
  pausas.clear();
  cache = null;
}
