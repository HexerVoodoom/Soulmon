/**
 * O BARRAMENTO DE ÁUDIO — run `som-01`, Fase 2, fatia 2.
 *
 * ## O que existia antes
 *
 * `sounds.ts` abria **um `AudioContext` novo a cada `play()`**, tocava e fechava
 * em 2 s. Sem barramento, sem sub-mix, sem ducking, sem volume — só um `mute`
 * booleano. Consequência: dois sons simultâneos somavam em cima um do outro sem
 * ninguém arbitrando, e não havia onde pendurar teto de true peak nem volume.
 *
 * ## O que existe agora
 *
 * O desenho medido no spike da Fase 1 (`prototyper/grafo.ts`, provado no
 * Chromium real), promovido: **UM** contexto compartilhado, sub-mix por
 * categoria, master com limitador no teto S3, e os dois duckings da spec §6.2.
 *
 *     fonte → bus da categoria → bus SFX → duckGeral → master → limitador → saída
 *                     ↑ Arcade passa antes pelo duckArcade (D-2)
 *     camadas da trilha → bus Trilha → duckGeral ↑
 *     Marco → master  (NÃO passa pelo duckGeral: ele é quem duca — D-1)
 *
 * ## As quatro restrições que este arquivo não pode quebrar
 *
 * 1. **Autoplay.** Um `AudioContext` compartilhado criado cedo demais nasce
 *    `suspended` e fica assim — tratar isso "por acidente" (esperando que algum
 *    clique futuro o destrave) é como se perde som em Safari. Aqui o contexto é
 *    criado **preguiçosamente, na primeira chamada de `tocarNa`**, que neste app
 *    só acontece dentro de um handler de gesto; e se mesmo assim ele nascer
 *    `suspended`, `resume()` é chamado **explicitamente**, a cada tentativa.
 * 2. **D11.** Nada toca com `document.hidden`. A asserção normativa continua no
 *    CHAMADOR (`som-presenca-d11.render.test.tsx`) — é lá que ela é medível,
 *    porque é lá que ela sempre morou. O guard daqui é a segunda linha: um
 *    chamador novo que esqueça a regra não consegue fazer barulho pelo
 *    barramento.
 * 3. **Mudo total.** O gate de mudo é do `sounds.ts` e vem ANTES desta função:
 *    com `SOUND_MUTED`, `tocarNa` nunca é chamada e **nenhum nó é criado** —
 *    nem o barramento. Contexto construído para "não tocar" já é plumbing
 *    vazando (`sounds.contract.test.ts`).
 * 4. **Não vazar.** O contexto de antes era descartado a cada som; este vive.
 *    Então: com a aba oculta ele é **suspenso** (não fechado — fechar obrigaria
 *    a reconstruir o grafo inteiro na volta), e em `pagehide` ele é **fechado**.
 *    O barramento também se reconstrói sozinho se o contexto em cache estiver
 *    `closed` — sem isso, um `pagehide` seguido de volta (bfcache) deixaria o
 *    app mudo para sempre, sem erro nenhum.
 *
 * ## O que NÃO foi promovido, e por quê
 *
 * - **A máquina de 7 estados E0–E6** da trilha: segue PROPOSTA NÃO VERIFICADA.
 *   O `busTrilha` existe e nasce em 0; as camadas não.
 * - **A liberação do D-1 pelo gesto que fecha a cerimônia** (spec §6.2): esse
 *   gesto não tem hook no código — `MilestoneCeremony` não notifica ninguém ao
 *   fechar. Em vez de inventar um, `duckMarco` recebe a duração do próprio som
 *   e agenda a liberação; `liberarMarco` fica exposto para quando a cerimônia
 *   ganhar o hook. Um duck sem liberação garantida silenciaria o app inteiro.
 */
import { readFlag, writeFlag, readJson, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import type { CategoriaSom } from './loudness';
import { ORDEM_DA_ESCADA, TETO_DBTP, GANHO_DE_CATEGORIA_DB, db2lin } from './loudness';

/* ── §6.2/§6.3 — os dois duckings e o piso técnico de rampa ──────────────── */

/** D-1: Marco abaixa TUDO ao piso em ≤120 ms; volta em 800 ms. */
export const D1_ATAQUE_S = 0.12;
export const D1_LIBERACAO_S = 0.8;
/** D-2: classe superior soando abaixa SÓ o Arcade em 9 dB. */
export const D2_ATAQUE_S = 0.12;
export const D2_LIBERACAO_S = 0.4;
export const D2_PROFUNDIDADE_DB = -9.0;
/** §6.3 — piso técnico: nenhuma rampa mais curta que isto (clique audível). */
export const RAMPA_MINIMA_S = 0.005;

/** As classes "superiores": soando, disparam o D-2 sobre o Arcade. */
const SUPERIORES: CategoriaSom[] = [
  'marco', 'presenca', 'degeneracao', 'cuidado', 'conclusao', 'transacao',
];

/* ── Volume por categoria e trilha (persistência) ────────────────────────── */

type Volumes = Partial<Record<CategoriaSom, number>>;

const naFaixa = (v: number) => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1);

function lerVolumes(): Volumes {
  const bruto = readJson<Volumes>(STORAGE_KEYS.SOUND_CATEGORY_VOLUMES, {});
  const limpo: Volumes = {};
  if (bruto && typeof bruto === 'object') {
    for (const c of ORDEM_DA_ESCADA) {
      const v = (bruto as Record<string, unknown>)[c];
      if (typeof v === 'number') limpo[c] = naFaixa(v);
    }
  }
  return limpo;
}

/** Volume de uma categoria, 0..1. Sem chave = **1** (o som nasce no alvo). */
export function volumeDe(cat: CategoriaSom): number {
  return lerVolumes()[cat] ?? 1;
}

export function definirVolume(cat: CategoriaSom, v: number): void {
  const volumes = lerVolumes();
  volumes[cat] = naFaixa(v);
  // Preferência cosmética: não vale gastar o aviso único do usuário se o
  // storage estiver degradado (mesma escolha do `setMuted`).
  writeJson(STORAGE_KEYS.SOUND_CATEGORY_VOLUMES, volumes, { silent: true });
  if (barramento) barramento.busCategoria[cat].gain.value = ganhoLinearDe(cat);
}

function ganhoLinearDe(cat: CategoriaSom): number {
  return db2lin(GANHO_DE_CATEGORIA_DB) * volumeDe(cat);
}

/**
 * A trilha **nasce desligada** (S2) e só toca por gesto explícito. A chave é
 * PRÓPRIA, separada do `mute` global — ver o comentário em `storageKeys.ts`.
 */
export function trilhaLigada(): boolean {
  return readFlag(STORAGE_KEYS.SOUND_TRACK_ENABLED);
}

export function definirTrilhaLigada(on: boolean): void {
  writeFlag(STORAGE_KEYS.SOUND_TRACK_ENABLED, on, { silent: true });
  if (barramento) barramento.busTrilha.gain.value = on ? 1 : 0;
}

/* ── O barramento ────────────────────────────────────────────────────────── */

interface Barramento {
  ctx: AudioContext;
  master: GainNode;
  busSfx: GainNode;
  busTrilha: GainNode;
  duckGeral: GainNode;
  duckArcade: GainNode;
  busCategoria: Record<CategoriaSom, GainNode>;
}

let barramento: Barramento | null = null;
/** O construtor com que o contexto em cache foi feito (ver `obterBarramento`). */
let ctorEmUso: unknown = null;

type ComWebkit = Window & { webkitAudioContext?: typeof AudioContext };

function construtorDeContexto(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || (window as ComWebkit).webkitAudioContext || null;
}

/** Curva de clipping duro no teto S3, para o WaveShaper com oversample 4x. */
function curvaClip(teto: number, n = 8193): Float32Array<ArrayBuffer> {
  const c = new Float32Array(new ArrayBuffer(n * 4));
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    c[i] = Math.max(-teto, Math.min(teto, x));
  }
  return c;
}

function montar(ctx: AudioContext): Barramento {
  const master = ctx.createGain();
  master.gain.value = 1;

  // O limitador é a rede de segurança do teto S3 (−1 dBTP). `createWaveShaper`
  // é checado porque nem todo motor de áudio o tem (WebKit antigo, e os duplos
  // dos testes) — sem ele o master vai direto à saída, que é o comportamento
  // de antes desta fatia, não uma regressão nova.
  if (typeof ctx.createWaveShaper === 'function') {
    const ws = ctx.createWaveShaper();
    ws.curve = curvaClip(db2lin(TETO_DBTP));
    ws.oversample = '4x';
    master.connect(ws);
    ws.connect(ctx.destination);
  } else {
    master.connect(ctx.destination);
  }

  const duckGeral = ctx.createGain();
  duckGeral.gain.value = 1;
  duckGeral.connect(master);

  const busSfx = ctx.createGain();
  busSfx.gain.value = 1;
  busSfx.connect(duckGeral);

  const busTrilha = ctx.createGain();
  busTrilha.gain.value = trilhaLigada() ? 1 : 0;
  busTrilha.connect(duckGeral);

  const duckArcade = ctx.createGain();
  duckArcade.gain.value = 1;
  duckArcade.connect(busSfx);

  const busCategoria = {} as Record<CategoriaSom, GainNode>;
  for (const c of ORDEM_DA_ESCADA) {
    const g = ctx.createGain();
    g.gain.value = ganhoLinearDe(c);
    if (c === 'marco') g.connect(master);           // D-1: Marco não se duca
    else if (c === 'arcade') g.connect(duckArcade); // D-2 age aqui
    else g.connect(busSfx);
    busCategoria[c] = g;
  }

  return { ctx, master, busSfx, busTrilha, duckGeral, duckArcade, busCategoria };
}

/** A aba dormiu: suspende o contexto em vez de fechá-lo (ver restrição 4). */
function aoTrocarVisibilidade(): void {
  if (!barramento) return;
  if (typeof document !== 'undefined' && document.hidden) {
    try { void barramento.ctx.suspend?.(); } catch { /* motor sem suspend */ }
  }
}

/** O app está sendo fechado: aí sim o contexto morre, e o cache com ele. */
function aoSair(): void {
  encerrarBarramento();
}

/**
 * Os ouvintes são registrados UMA vez na vida do módulo, nunca por contexto.
 * Registrá-los a cada reconstrução acumularia um par a mais por ciclo — o mesmo
 * vazamento que esta fatia veio matar, só que em `document` em vez de em
 * `AudioContext`. Eles são inofensivos com o barramento nulo: ambos começam
 * checando se existe barramento.
 */
let cicloLigado = false;
function ligarCicloDeVida(): void {
  if (cicloLigado) return;
  if (typeof document === 'undefined' || typeof document.addEventListener !== 'function') return;
  document.addEventListener('visibilitychange', aoTrocarVisibilidade);
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('pagehide', aoSair);
  }
  cicloLigado = true;
}

/**
 * O barramento, construído na primeira necessidade. Devolve `null` quando não
 * há motor de áudio — falhar em silêncio é o contrato de sempre deste módulo.
 *
 * ⚠️ O cache guarda **o construtor usado**. Um contexto em cache cujo construtor
 * não é mais o global vigente é um contexto órfão: no navegador isso nunca
 * acontece (o construtor é o mesmo para sempre), e é justamente por isso que a
 * checagem é barata; num ambiente que troca o motor por baixo, ela é a
 * diferença entre reconstruir e ficar mudo sem erro.
 */
function obterBarramento(): Barramento | null {
  const Ctor = construtorDeContexto();
  if (!Ctor) return null;
  if (barramento && (ctorEmUso !== Ctor || barramento.ctx.state === 'closed')) {
    barramento = null;
  }
  if (!barramento) {
    try {
      const ctx = new Ctor();
      barramento = montar(ctx);
      ctorEmUso = Ctor;
      ligarCicloDeVida();
    } catch {
      return null;
    }
  }
  return barramento;
}

/** Fecha o contexto e esquece o cache. Idempotente. */
export function encerrarBarramento(): void {
  const b = barramento;
  barramento = null;
  ctorEmUso = null;
  if (!b) return;
  try { void b.ctx.close?.(); } catch { /* já fechado */ }
}

/** Só para teste: o barramento vivo, ou `null`. Não usar em produção. */
export function barramentoAtual(): Barramento | null {
  return barramento;
}

/**
 * D-1 (§6.2): o Marco abaixa Trilha + SFX ao piso em ≤120 ms. `duracaoDoSom`
 * agenda a liberação, porque o gesto que fecha a cerimônia não tem hook (ver o
 * cabeçalho). Sem essa liberação agendada, um Marco silenciaria o app.
 */
export function duckMarco(quando: number, duracaoDoSom: number): void {
  const b = barramento;
  if (!b) return;
  const p = b.duckGeral.gain;
  p.cancelScheduledValues?.(quando);
  p.setValueAtTime(1, quando);
  p.linearRampToValueAtTime(0, quando + D1_ATAQUE_S);
  const solta = quando + Math.max(D1_ATAQUE_S, duracaoDoSom);
  p.setValueAtTime(0, solta);
  p.linearRampToValueAtTime(1, solta + D1_LIBERACAO_S);
}

/** D-1, liberação por gesto — para quando a cerimônia ganhar o hook. */
export function liberarMarco(quandoGesto: number): void {
  const b = barramento;
  if (!b) return;
  const p = b.duckGeral.gain;
  p.cancelScheduledValues?.(quandoGesto);
  p.setValueAtTime(0, quandoGesto);
  p.linearRampToValueAtTime(1, quandoGesto + D1_LIBERACAO_S);
}

/** D-2 (§6.2): classe superior soando abaixa SÓ o Arcade em 9 dB. */
function duckArcadePor(b: Barramento, cat: CategoriaSom, quando: number, duracao: number): void {
  if (!SUPERIORES.includes(cat)) return;
  const p = b.duckArcade.gain;
  const piso = db2lin(D2_PROFUNDIDADE_DB);
  p.cancelScheduledValues?.(quando);
  p.setValueAtTime(1, quando);
  p.linearRampToValueAtTime(piso, quando + D2_ATAQUE_S);
  const solta = quando + Math.max(D2_ATAQUE_S, duracao);
  p.setValueAtTime(piso, solta);
  p.linearRampToValueAtTime(1, solta + D2_LIBERACAO_S);
}

/** D11, segunda linha: aba oculta não faz barulho. */
function abaOculta(): boolean {
  return typeof document !== 'undefined' && document.hidden === true;
}

/**
 * Toca alguma coisa numa categoria. `montarFonte` recebe o contexto e o nó de
 * ENTRADA da categoria — nunca `ctx.destination`, que é o que fazia cada som
 * ignorar o mix. Devolve a duração do som em segundos (para os duckings) ou
 * nada.
 *
 * Devolve `false` quando não tocou: sem motor, aba oculta, ou erro do motor.
 */
export function tocarNa(
  cat: CategoriaSom,
  montarFonte: (ctx: AudioContext, destino: AudioNode) => number | void,
): boolean {
  if (abaOculta()) return false;
  const b = obterBarramento();
  if (!b) return false;
  try {
    // Autoplay, explicitamente: um contexto compartilhado pode ter nascido (ou
    // voltado a ficar) `suspended`. Esta chamada acontece dentro do gesto.
    if (b.ctx.state === 'suspended') void b.ctx.resume?.();
    const dur = montarFonte(b.ctx, b.busCategoria[cat]) ?? 0;
    const agora = b.ctx.currentTime;
    if (cat === 'marco') duckMarco(agora, dur);
    else duckArcadePor(b, cat, agora, dur);
    return true;
  } catch {
    // Alguns navegadores recusam áudio sem gesto: falhar em silêncio é o
    // contrato de sempre deste módulo.
    return false;
  }
}
