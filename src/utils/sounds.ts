import { readFlag, writeFlag } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import { tocarNa } from './audioBus';
import { CATEGORIA_DO_SOM, OFFSET_POR_SOM_DB, db2lin } from './loudness';

/** Ganho-base dos sons de combate (o mesmo `beep` de 0,12) × a calibração medida do som. */
const GANHO_BASE_COMBATE = 0.12;
const GANHO_ATTACK = GANHO_BASE_COMBATE * db2lin(OFFSET_POR_SOM_DB.playAttack);
const GANHO_SPECIAL = GANHO_BASE_COMBATE * db2lin(OFFSET_POR_SOM_DB.playSpecial);
const GANHO_VICTORY = GANHO_BASE_COMBATE * db2lin(OFFSET_POR_SOM_DB.playVictory);
import { assetPronto, prepararAssets, tocarBuffer, type NomeDeAsset } from './sonsAssets';
import { aoGestoSonoro } from './trilha';

const MUTED_KEY = STORAGE_KEYS.SOUND_MUTED;

export function isMuted(): boolean {
  return readFlag(MUTED_KEY);
}

export function setMuted(v: boolean): void {
  // Preferência cosmética: se não persistir, o som volta na próxima sessão.
  // Não vale gastar o aviso único do usuário.
  writeFlag(MUTED_KEY, v, { silent: true });
}

/**
 * ⚠️ **O `AudioContext`-por-chamada MORREU aqui** (run `som-01`, Fase 2, fatia
 * 2). Esta função abria um contexto novo a cada som, tocava e fechava em 2 s:
 * sem barramento, sem sub-mix, sem ducking, sem volume. Hoje ela é só o **gate
 * de mudo** — e o gate continua vindo ANTES de qualquer construção de nó, que é
 * o que `sounds.contract.test.ts` mede. Quem constrói e reaproveita o contexto
 * é `utils/audioBus.ts`; a categoria vem de `utils/loudness.ts`, dono único.
 *
 * `fn` recebe o nó de ENTRADA da categoria, nunca `ctx.destination`, e devolve
 * a duração do som em segundos — é ela que fecha os duckings D-1 e D-2.
 */
function play(
  nomeDoSom: keyof typeof CATEGORIA_DO_SOM,
  fn: (ctx: AudioContext, destino: AudioNode) => number,
): void {
  if (isMuted()) return;
  aoGestoSonoro();
  tocarNa(CATEGORIA_DO_SOM[nomeDoSom], fn);
}

/**
 * S16 (21/09/2026): os três eventos LONGOS têm um asset de IA em
 * `public/sounds/` (`utils/sonsAssets.ts`). A regra é **asset se já
 * decodificou, senão o procedural desta vez** — nunca espera, nunca fica mudo.
 * A primeira chamada dispara a carga (depois do gate de mudo e do gesto: S6,
 * zero no bundle inicial). O buffer já está no alvo da categoria, então toca a
 * ganho 1 — o procedural continua com os ganhos calibrados de sempre.
 */
function playComAsset(
  nomeDoSom: NomeDeAsset,
  procedural: (ctx: AudioContext, destino: AudioNode) => number,
): void {
  play(nomeDoSom, (ctx, destino) => {
    prepararAssets(ctx);
    const buf = assetPronto(nomeDoSom);
    return buf ? tocarBuffer(ctx, destino, buf) : procedural(ctx, destino);
  });
}

function beep(
  ctx: AudioContext,
  destino: AudioNode,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.12,
): void {
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.connect(vol);
  vol.connect(destino);
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + startOffset;
  vol.gain.setValueAtTime(0, t);
  vol.gain.linearRampToValueAtTime(gain, t + 0.005);
  vol.gain.setValueAtTime(gain, t + duration - 0.02);
  vol.gain.linearRampToValueAtTime(0, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

/* ── WP3.5 — O SOM DE PRESENÇA (decisão D11) ─────────────────────────────
   Um sonzinho curto, de duas notas, que o pet faz ao ser TOCADO. É a única
   coisa do app que existe para dizer "tem alguém aqui" — todos os outros sons
   confirmam uma ação (comeu, limpou, evoluiu).

   A fronteira da D11 é o pacote inteiro, e ela está no CHAMADOR e aqui:
    · **só em resposta a gesto** — toque, chegada, carinho. NUNCA idle, nunca
      com `document.hidden`. Som que sai sozinho não é presença, é alarme, e
      foi o bipe que fez as escolas banirem o Tamagotchi.
    · **uma vez por sessão.** Repetido, vira ruído; e a coisa que ele
      comunica ("estou aqui") só precisa ser dita uma vez.
   O `presencaTocadaRef` do `CompanionHUD` é quem guarda a segunda regra. */
export function playPresence(): void {
  play('playPresence', (ctx, destino) => {
    beep(ctx, destino, 587, 0, 0.07, 'sine', 0.399457);
    beep(ctx, destino, 880, 0.08, 0.12, 'sine', 0.359511);
    return 0.20;
  });
}

/** Short ascending 3-note arpeggio (C–E–G) */
export function playTaskComplete(): void {
  playComAsset('playTaskComplete', (ctx, destino) => {
    beep(ctx, destino, 523, 0,    0.08, 'square', 0.112767);
    beep(ctx, destino, 659, 0.09, 0.08, 'square', 0.112767);
    beep(ctx, destino, 784, 0.18, 0.15, 'square', 0.112767);
    return 0.33;
  });
}

/** Quick 2-note munch */
export function playFeed(): void {
  play('playFeed', (ctx, destino) => {
    beep(ctx, destino, 440, 0,    0.06, 'square', 0.250427);
    beep(ctx, destino, 330, 0.07, 0.09, 'square', 0.250427);
    return 0.16;
  });
}

/** Water-drip bursts */
export function playShower(): void {
  play('playShower', (ctx, destino) => {
    const pitches = [600, 750, 520, 680, 580, 720];
    pitches.forEach((freq, i) => {
      beep(ctx, destino, freq, i * 0.09, 0.06, 'sine', 0.232594);
    });
    return (pitches.length - 1) * 0.09 + 0.06;
  });
}

/** Dramatic power-up sweep + two high notes */
export function playEvolve(): void {
  playComAsset('playEvolve', (ctx, destino) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol);
    vol.connect(destino);
    osc.type = 'square';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.55);
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(0.180585, t + 0.01);
    vol.gain.setValueAtTime(0.180585, t + 0.53);
    vol.gain.linearRampToValueAtTime(0, t + 0.56);
    osc.start(t);
    osc.stop(t + 0.56);

    beep(ctx, destino, 1047, 0.58, 0.08, 'square', 0.180585);
    beep(ctx, destino, 1319, 0.68, 0.15, 'square', 0.180585);
    return 0.83;
  });
}

/** Descending sad tones + low thud */
export function playDegenerate(): void {
  playComAsset('playDegenerate', (ctx, destino) => {
    beep(ctx, destino, 440, 0,    0.12, 'square', 0.212903);
    beep(ctx, destino, 349, 0.14, 0.12, 'square', 0.212903);
    beep(ctx, destino, 262, 0.28, 0.15, 'square', 0.212903);
    beep(ctx, destino, 147, 0.45, 0.25, 'square', 0.141935);
    return 0.70;
  });
}

/** Soft descending lullaby notes */
export function playSleep(): void {
  play('playSleep', (ctx, destino) => {
    beep(ctx, destino, 523, 0,    0.18, 'sine', 0.201414);
    beep(ctx, destino, 440, 0.21, 0.18, 'sine', 0.176237);
    beep(ctx, destino, 349, 0.44, 0.25, 'sine', 0.125884);
    return 0.69;
  });
}

/* ── O SOM DO COMBATE (PR18, pedido do dono, 06/10/2026) ──────────────────
   Três eventos novos, todos de **uma tela de combate** (Arena, Duelo, Masmorra,
   Pesadelo): o golpe básico, o ESPECIAL e a VITÓRIA. R-NOVA: a superfície nasceu
   muda e aqui o pedido é explícito — por isso entram na política (`loudness.ts`)
   e na tabela de chamadores (`cortes.contract.test.ts`).

   **A categoria vem do EVENTO (R-CAT), não do arquivo: as três são `arcade`** —
   combate é minijogo, e golpe é o evento que MAIS repete (degrau mais baixo da
   escada, e é o que o D-2 abaixa quando um som superior toca). Vencer o combate
   também é `arcade`, pelo mesmo motivo do C-11: vitória de minijogo não é
   "concluir tarefa" nem "marco".

   Procedurais (zero byte de asset), no padrão dos outros: osciladores com
   envelope de rampa, nunca `ctx.destination`. O golpe é um "soco" de square
   que cai de tom + um tique agudo; o especial sobe (carga) e estoura em duas
   notas; a vitória é um arpejo ascendente que SEGURA a última nota. Os ganhos
   saem de `0,12 × db2lin(offset)` com o offset de `OFFSET_POR_SOM_DB`. */

/** Golpe básico: um soco curto (square que cai de tom) com um tique agudo. */
export function playAttack(): void {
  play('playAttack', (ctx, destino) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol);
    vol.connect(destino);
    osc.type = 'square';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.1);
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(GANHO_ATTACK, t + 0.005);
    vol.gain.setValueAtTime(GANHO_ATTACK, t + 0.08);
    vol.gain.linearRampToValueAtTime(0, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.12);
    beep(ctx, destino, 880, 0, 0.03, 'square', GANHO_ATTACK * 0.6);
    return 0.12;
  });
}

/** Especial: sobe (a carga que vira ataque) e estoura em duas notas. */
export function playSpecial(): void {
  play('playSpecial', (ctx, destino) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol);
    vol.connect(destino);
    osc.type = 'sawtooth';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.3);
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(GANHO_SPECIAL, t + 0.01);
    vol.gain.setValueAtTime(GANHO_SPECIAL, t + 0.28);
    vol.gain.linearRampToValueAtTime(0, t + 0.32);
    osc.start(t);
    osc.stop(t + 0.32);
    beep(ctx, destino, 1175, 0.33, 0.1, 'square', GANHO_SPECIAL);
    beep(ctx, destino, 1568, 0.43, 0.22, 'square', GANHO_SPECIAL);
    return 0.65;
  });
}

/** Vitória: arpejo ascendente (C–E–G–C) que segura a última nota, com a oitava em seno por baixo. */
export function playVictory(): void {
  play('playVictory', (ctx, destino) => {
    beep(ctx, destino, 523, 0, 0.1, 'square', GANHO_VICTORY);
    beep(ctx, destino, 659, 0.11, 0.1, 'square', GANHO_VICTORY);
    beep(ctx, destino, 784, 0.22, 0.1, 'square', GANHO_VICTORY);
    beep(ctx, destino, 1047, 0.33, 0.45, 'square', GANHO_VICTORY);
    beep(ctx, destino, 523, 0.33, 0.45, 'sine', GANHO_VICTORY * 0.8);
    return 0.78;
  });
}

/**
 * O CHIADO DA SINTONIA — o terceiro terço da sintonia do Visor
 * (spec §2.3.1: "scanline de 400 ms + fade de 120 ms reserva→próprio + o
 * chiado curto que a ocasião A já usa").
 *
 * ⚠️ DIVERGÊNCIA doc↔código nº 10 do projeto (a 9ª está registrada em
 * `spriteGen.contract.test.ts`). A spec afirma que a ocasião A **já usa** o
 * chiado. Não usava: não existia som de sintonia nenhum no código, em
 * call-site nenhum, e a própria spec se contradiz — a tabela do §2.1 dá
 * "nada" na coluna de fora do visor para a ocasião A, enquanto a prosa do
 * §2.3 pede o chiado. O chiado nasceu nos DOIS call-sites de uma vez.
 *
 * **Por que ruído filtrado e não `beep`.** Os outros sons são osciladores — a
 * linguagem certa para nota, arpejo e sweep. Chiado não tem altura: é banda de
 * ruído. Um oscilador imitando estática só consegue soar como alarme, e a
 * sintonia é uma coisa BOA acontecendo (o Visor achou o rosto próprio do
 * bicho). Bandpass que SOBE de 900 Hz para 2,4 kHz — a mesma curva de um
 * rádio saindo do meio da faixa e travando na estação. Sem graves: grave
 * curto é impacto, e impacto assusta — por isso o ataque continua suave
 * (~8 ms) e a queda no fim nunca vira corte seco.
 *
 * **A duração é a da varredura, e é teto.** 400 ms = a scanline da spec
 * §2.3.1, não um número escolhido à parte. O envelope tem PLATÔ (abre em
 * ~8 ms, sustenta até ~30 ms do fim, cai): som e imagem começam e terminam
 * juntos, e o "travar na estação" coincide com o fim da varredura em vez de
 * acontecer antes dela. Não acompanhar o fade de 120 ms é deliberado.
 *
 * ⚠️ **DUAS AFIRMAÇÕES DESTE BLOCO CAÍRAM POR MEDIÇÃO (09/09/2026, run
 * `som-01`, `squad-alpha-runs/som-01/prototyper/decisao-visortune.md`):**
 *
 * 1. Este bloco dizia **180 ms**, sem nunca argumentar o número — só
 *    "curto". Medido em 12 realizações no motor real: nessa forma o som
 *    pedia **+36 dB** para alcançar o alvo de loudness, e o gate está certo
 *    ao dizer que |offset| > 20 dB não é calibração, é fonte errada. A causa
 *    é geométrica, não de nível: um evento de 180 ms medido numa janela de
 *    400 ms perde 10·log10(400/180) = 3,47 dB por construção, e um envelope
 *    que decai exponencialmente a zero concentra a energia nos primeiros
 *    milissegundos — pico alto, RMS baixo, ou seja, crista alta (~22 dB).
 *    Duas correções de engenharia foram testadas e **falharam** (0/12 cada):
 *    normalizar o buffer de ruído e alargar o bandpass. O que resolve é
 *    envelope + duração: 12/12, e a dispersão entre realizações cai de
 *    2,68 para 0,18 LU. Este som é `Math.random()`: sem platô ele não é um
 *    asset, é um sorteio.
 * 2. Este bloco dizia que o ganho 0,05 era "metade do som mais discreto do
 *    arquivo, o `playMenuOpen`". **A analogia é inválida**: `playMenuOpen`
 *    é um oscilador `square` e isto é ruído por bandpass, que descarta quase
 *    toda a energia — ganho idêntico produz níveis a dezenas de dB de
 *    distância (medido: 26,5 dB entre este som e `playPresence`, ambos em
 *    0,05). Ganho copiado entre timbres diferentes é coincidência de dígito,
 *    não calibração. (`playMenuOpen` também não existe mais: saiu no corte
 *    da Fase 0.) O ganho e o `Q` de hoje vêm da `spec-de-loudness.md`, dono
 *    único `som-engenheiro-audio` — **não os ajuste por analogia**.
 *
 * Com o bandpass mais largo, quem carrega a leitura "sintonizando" é o
 * MOVIMENTO da frequência central, não a estreiteza da banda. O sweep
 * 900→2400 percorrendo os 400 ms inteiros é obrigatório: sem ele isto vira
 * chuvisco parado.
 *
 * Categoria: **`sintonia`**, categoria PRÓPRIA — não `arcade`, que era
 * herança de material de teste (lacuna L-7, fechada em 09/09/2026). O
 * critério da escada é REPETIÇÃO, não importância, e este som dispara 0–2
 * vezes por sessão: repete menos que Cuidado e não pode estar dois degraus
 * abaixo dela. Também não é Marco — Marco exige silêncio antes, sem teto de
 * duração e ducking de tudo, e isto é a varredura que ANTECEDE a celebração,
 * não a celebração.
 *
 * O gate de mudo e o AudioContext são os do `play()`; aqui não nasce plumbing
 * nenhum. O corte por movimento reduzido NÃO mora aqui — mora no call-site,
 * porque quem sabe se a varredura correspondente existiu é quem varre. Veja o
 * raciocínio em `EvolutionPath.tsx`/`CompanionHUD.tsx`.
 */
export function playVisorTune(): void {
  play('playVisorTune', (ctx, destino) => {
    const DUR = 0.4;
    const taxa = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, Math.ceil(taxa * DUR), taxa);
    const canal = buffer.getChannelData(0);
    for (let i = 0; i < canal.length; i++) canal[i] = Math.random() * 2 - 1;
    // Normalização de pico do sorteio: sem ela, cada realização do
    // `Math.random()` entrega um nível diferente e o som deixa de ser um asset.
    let pico = 0;
    for (let i = 0; i < canal.length; i++) pico = Math.max(pico, Math.abs(canal[i]));
    if (pico > 0) for (let i = 0; i < canal.length; i++) canal[i] /= pico;

    const fonte = ctx.createBufferSource();
    fonte.buffer = buffer;

    // Bandpass largo: quem lê "sintonizando" é o MOVIMENTO da central, não a
    // estreiteza da banda (`Q = 3` → `0.7`, medido em M-3).
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.Q.value = 0.7;

    const vol = ctx.createGain();
    fonte.connect(filtro);
    filtro.connect(vol);
    vol.connect(destino);

    const t = ctx.currentTime;
    filtro.frequency.setValueAtTime(900, t);
    filtro.frequency.exponentialRampToValueAtTime(2400, t + DUR);
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(0.4393463, t + 0.008);
    vol.gain.setValueAtTime(0.4393463, t + DUR - 0.03);
    vol.gain.linearRampToValueAtTime(0.0001, t + DUR);

    fonte.start(t);
    fonte.stop(t + DUR);
    return DUR;
  });
}
