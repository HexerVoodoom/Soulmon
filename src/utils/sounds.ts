import { readFlag, writeFlag } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

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
 * D11 no CHOKE POINT — a segunda linha, não a única.
 *
 * A D11 diz que som só sai em resposta a GESTO: nunca idle, nunca com a aba
 * oculta. Até a Fase 3 essa regra valia por uma propriedade que ninguém
 * travava — todos os call-sites de produção eram, por acaso, gesto. O app já
 * tem caminho que roda em TIMER com a aba oculta (a virada do dia é checada a
 * cada 30 s, `useDailyReset.ts`), então bastava um `play*` novo ali para a D11
 * cair sem nada ficar vermelho. É a família do footgun 9: regra que vale por
 * fiação, não por construção.
 *
 * O guard fica ANTES de qualquer nó, ao lado do mudo, pelo mesmo motivo: som
 * que não devia sair não pode custar um `AudioContext` sequer. Não substitui a
 * asserção no chamador (`som-presenca-d11.render.test.tsx`), que prova que o
 * GESTO não soa; aqui se prova que NENHUM caminho soa.
 *
 * `typeof document` porque este módulo é importado em teste de nó puro, onde
 * `document` não existe — ausência de documento não é aba oculta.
 */
function abaOculta(): boolean {
  return typeof document !== 'undefined' && document.hidden === true;
}

function play(fn: (ctx: AudioContext) => void): void {
  if (isMuted()) return;
  if (abaOculta()) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    fn(ctx);
    setTimeout(() => ctx.close().catch(() => {}), 2000);
  } catch {
    // silently ignore — some browsers block AudioContext without user gesture
  }
}

function beep(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = 'square',
  gain = 0.12,
): void {
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();
  osc.connect(vol);
  vol.connect(ctx.destination);
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
  play(ctx => {
    beep(ctx, 587, 0, 0.07, 'sine', 0.399457);
    beep(ctx, 880, 0.08, 0.12, 'sine', 0.359511);
  });
}

/** Short ascending 3-note arpeggio (C–E–G) */
export function playTaskComplete(): void {
  play(ctx => {
    beep(ctx, 523, 0,    0.08, 'square', 0.112767);
    beep(ctx, 659, 0.09, 0.08, 'square', 0.112767);
    beep(ctx, 784, 0.18, 0.15, 'square', 0.112767);
  });
}

/** Quick 2-note munch */
export function playFeed(): void {
  play(ctx => {
    beep(ctx, 440, 0,    0.06, 'square', 0.250427);
    beep(ctx, 330, 0.07, 0.09, 'square', 0.250427);
  });
}

/** Water-drip bursts */
export function playShower(): void {
  play(ctx => {
    const pitches = [600, 750, 520, 680, 580, 720];
    pitches.forEach((freq, i) => {
      beep(ctx, freq, i * 0.09, 0.06, 'sine', 0.232594);
    });
  });
}

/** Dramatic power-up sweep + two high notes */
export function playEvolve(): void {
  play(ctx => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.connect(vol);
    vol.connect(ctx.destination);
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

    beep(ctx, 1047, 0.58, 0.08, 'square', 0.180585);
    beep(ctx, 1319, 0.68, 0.15, 'square', 0.180585);
  });
}

/** Descending sad tones + low thud */
export function playDegenerate(): void {
  play(ctx => {
    beep(ctx, 440, 0,    0.12, 'square', 0.212903);
    beep(ctx, 349, 0.14, 0.12, 'square', 0.212903);
    beep(ctx, 262, 0.28, 0.15, 'square', 0.212903);
    beep(ctx, 147, 0.45, 0.25, 'square', 0.141935);
  });
}

/** Soft descending lullaby notes */
export function playSleep(): void {
  play(ctx => {
    beep(ctx, 523, 0,    0.18, 'sine', 0.201414);
    beep(ctx, 440, 0.21, 0.18, 'sine', 0.176237);
    beep(ctx, 349, 0.44, 0.25, 'sine', 0.125884);
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
  play(ctx => {
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
    vol.connect(ctx.destination);

    const t = ctx.currentTime;
    filtro.frequency.setValueAtTime(900, t);
    filtro.frequency.exponentialRampToValueAtTime(2400, t + DUR);
    vol.gain.setValueAtTime(0, t);
    vol.gain.linearRampToValueAtTime(0.4393463, t + 0.008);
    vol.gain.setValueAtTime(0.4393463, t + DUR - 0.03);
    vol.gain.linearRampToValueAtTime(0.0001, t + DUR);

    fonte.start(t);
    fonte.stop(t + DUR);
  });
}
