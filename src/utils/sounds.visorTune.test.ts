// @vitest-environment jsdom
/**
 * O SOM da sintonia, medido por dentro (`playVisorTune`, spec §2.3.1).
 *
 * O teste de render irmão (`components/sintonia-chiado.render.test.tsx`) mede
 * QUANDO o chiado é pedido. Este mede O QUE ele é — e as duas coisas não podem
 * morar no mesmo arquivo, porque lá o módulo de som é um duplo.
 *
 * ## Por que um `AudioContext` de mentira, e não uma escuta
 *
 * Som é difícil de testar porque o resultado é uma onda no ar. O que dá para
 * travar sem ouvir nada é o GRAFO DE ÁUDIO montado e a rampa de ganho
 * agendada — que é exatamente onde moram as três decisões que importam aqui e
 * que uma regressão silenciosa desfaria. O duplo abaixo grava chamadas em vez
 * de produzir áudio, e o `jsdom` nunca teve `AudioContext` para começo de
 * conversa.
 *
 * ## O que é travado
 *
 * 1. **O mudo é respeitado, e é o mudo do `play()`.** A restrição de projeto é
 *    que o gate de mudo e o `AudioContext` moram no `sounds.ts` e em lugar
 *    nenhum mais. Se alguém reimplementar o gate no componente, este teste
 *    continua verde — mas o teste que importa é o negativo daqui: com
 *    `SOUND_MUTED` ligado, nenhum `AudioContext` chega a ser construído. Um som
 *    que constrói o contexto e depois "não toca" já vazou plumbing.
 * 2. **A duração é a da varredura, e é EXATA.** ⚠️ Este item dizia "acima de
 *    ~0,3 s deixa de ser um estalo de sintonia" e travava `<= 0,3`. Caiu por
 *    medição (09/09/2026, run `som-01`,
 *    `squad-alpha-runs/som-01/prototyper/decisao-visortune.md` §2.5): a forma
 *    de 180 ms pedia **+36 dB** para alcançar o alvo de loudness da categoria,
 *    porque um evento de 180 ms medido na janela de 400 ms perde
 *    10·log10(400/180) = 3,47 dB por construção e um envelope que decai a zero
 *    concentra a energia nos primeiros milissegundos (crista ~22 dB). Hoje a
 *    duração é a **scanline da spec §2.3.1**: 0,400 s, com PLATÔ. O teto virou
 *    igualdade porque o número deixou de ser estético e passou a ser o da
 *    imagem que o som acompanha — som e varredura começam e terminam juntos.
 * 3. **Sem alarme, e o ganho vem da escada — nunca de analogia.** ⚠️ Este item
 *    dizia "ganho no máximo igual ao som mais tímido do arquivo
 *    (`playMenuOpen`, 0.08)". Caiu na mesma medição: `playMenuOpen` era um
 *    oscilador `square` e isto é ruído por bandpass, que descarta quase toda a
 *    energia — o mesmo dígito de ganho produz níveis a dezenas de dB de
 *    distância (medido: 26,5 dB entre este som e `playPresence`, ambos em
 *    0,05). Ganho copiado entre timbres é coincidência de dígito, não
 *    calibração. (`playMenuOpen` também não existe mais: saiu no corte da
 *    Fase 0.) O que fica travado é o que a medição de fato sustenta: o ganho é
 *    o derivado da categoria `sintonia` (−19,0 LUFS-M) e o envelope tem platô,
 *    que é a intervenção que levou o som de 0/12 a 13/13 no alvo. A banda do
 *    filtro segue inteiramente ACIMA da região grave: grave curto é impacto, e
 *    impacto assusta. A sintonia é uma coisa boa acontecendo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playVisorTune, setMuted } from './sounds';

/** Uma chamada agendada num `AudioParam`, com o valor e o instante. */
type Agendamento = { param: string; metodo: string; valor: number };

function instalarAudioFalso() {
  const agenda: Agendamento[] = [];
  const criados: string[] = [];
  let contextos = 0;
  let duracaoBuffer = 0;

  const param = (nome: string) => ({
    value: 0,
    setValueAtTime: (v: number) => agenda.push({ param: nome, metodo: 'set', valor: v }),
    linearRampToValueAtTime: (v: number) => agenda.push({ param: nome, metodo: 'linear', valor: v }),
    exponentialRampToValueAtTime: (v: number) => agenda.push({ param: nome, metodo: 'exp', valor: v }),
  });

  class ContextoFalso {
    currentTime = 0;
    sampleRate = 48000;
    destination = {};
    constructor() { contextos++; }
    createBuffer(_ch: number, length: number, taxa: number) {
      duracaoBuffer = length / taxa;
      return { getChannelData: () => new Float32Array(length) };
    }
    createBufferSource() {
      criados.push('bufferSource');
      return { buffer: null, connect: () => {}, start: () => {}, stop: () => {} };
    }
    createBiquadFilter() {
      criados.push('biquad');
      return { type: '', Q: { value: 0 }, frequency: param('frequency'), connect: () => {} };
    }
    createOscillator() {
      criados.push('oscillator');
      return { type: '', frequency: param('frequency'), connect: () => {}, start: () => {}, stop: () => {} };
    }
    createGain() {
      criados.push('gain');
      return { gain: param('gain'), connect: () => {} };
    }
    close() { return Promise.resolve(); }
  }

  vi.stubGlobal('AudioContext', ContextoFalso as unknown as typeof AudioContext);
  return {
    agenda,
    criados,
    get contextos() { return contextos; },
    get duracaoBuffer() { return duracaoBuffer; },
    de: (nome: string) => agenda.filter(a => a.param === nome),
  };
}

/**
 * `localStorage` de mentira, em memória.
 *
 * Não é preciosismo: neste ambiente o `localStorage` GLOBAL que chega ao teste
 * é o do Node (que pede `--localstorage-file` e não persiste nada), e não o do
 * jsdom — `setMuted(true)` seguido de `isMuted()` devolvia `false`, e o caso do
 * mudo passaria pelo motivo errado, que é a forma clássica de um guard morto.
 * Com este duplo o mudo é medido de verdade, pela API pública do módulo.
 */
function instalarStorageEmMemoria() {
  const dados = new Map<string, string>();
  const falso = {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => { dados.set(k, String(v)); },
    removeItem: (k: string) => { dados.delete(k); },
    clear: () => dados.clear(),
    key: (i: number) => [...dados.keys()][i] ?? null,
    get length() { return dados.size; },
  };
  vi.stubGlobal('localStorage', falso);
}

let audio: ReturnType<typeof instalarAudioFalso>;

beforeEach(() => {
  instalarStorageEmMemoria();
  // O estado do mudo é lido do storage; zerar pela própria API do módulo evita
  // depender do formato da chave (que é assunto do `storageKeys.ts`).
  setMuted(false);
  vi.useFakeTimers();
  audio = instalarAudioFalso();
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('o chiado da sintonia respeita o mudo, e o gate é o do `play()`', () => {
  it('com o som ligado, o chiado monta o grafo de áudio', () => {
    playVisorTune();
    expect(audio.contextos, 'som ligado e nada construído: o chiado não existe').toBe(1);
    expect(audio.criados).toContain('bufferSource');
  });

  it('MUDO: nem o AudioContext nasce', () => {
    setMuted(true);
    playVisorTune();
    expect(
      audio.contextos,
      'construir o contexto no mudo é plumbing vazando: o gate tem de vir ANTES, no `play()`',
    ).toBe(0);
  });
});

describe('o chiado é curto, discreto e nunca alarmante', () => {
  it('A DURAÇÃO É A DA VARREDURA: 0,400 s exatos, o teto da scanline', () => {
    playVisorTune();
    expect(
      audio.duracaoBuffer,
      'som e varredura têm de começar e terminar juntos; encurtar aqui reabre o buraco de -36 dB medido na Fase 1',
    ).toBeCloseTo(0.4, 6);
  });

  it('O ENVELOPE TEM PLATÔ: sustenta e cai, nunca decai a zero desde o ataque', () => {
    playVisorTune();
    const ganhos = audio.de('gain');
    const pico = Math.max(...ganhos.map(a => a.valor));
    // Ataque (linear até o pico), platô (set NO pico) e queda: são três eventos,
    // e o do meio é o que a medição provou ser a diferença entre um asset e um
    // sorteio — sem ele a dispersão entre realizações é de 2,68 LU.
    expect(
      ganhos.filter(a => a.valor === pico).length,
      'ganho que sobe e já começa a cair é o envelope de 180 ms de volta: pico alto, RMS baixo, crista de ~22 dB',
    ).toBeGreaterThanOrEqual(2);
    expect(
      ganhos.some(a => a.metodo === 'set' && a.valor === pico),
      'o platô é agendado com `setValueAtTime` no pico — sem ele não há sustentação',
    ).toBe(true);
  });

  it('O GANHO É O DA CATEGORIA `sintonia`, não uma analogia com outro timbre', () => {
    playVisorTune();
    const picos = audio.de('gain').map(a => a.valor);
    expect(picos.length, 'sem envelope de ganho o ruído entra e sai no talo').toBeGreaterThan(0);
    expect(
      Math.max(...picos),
      'o ganho sai da fórmula §6.4 da `spec-de-loudness.md` contra o alvo -19,0 LUFS-M (13/13 no motor real); ajustá-lo por analogia com outro som é o erro que esta linha registra',
    ).toBeCloseTo(0.4393463, 7);
  });

  it('SEM ALARME: a banda do filtro fica toda acima dos graves', () => {
    playVisorTune();
    const freqs = audio.de('frequency').map(a => a.valor);
    expect(freqs.length, 'ruído sem bandpass é chuvisco, não sintonia').toBeGreaterThan(0);
    expect(
      Math.min(...freqs),
      'grave curto é impacto, e impacto assusta — a sintonia é uma coisa BOA acontecendo',
    ).toBeGreaterThanOrEqual(500);
  });

  it('FECHA EM SILÊNCIO: a última rampa de ganho vai a ~zero', () => {
    playVisorTune();
    const ganhos = audio.de('gain');
    expect(
      ganhos[ganhos.length - 1].valor,
      'envelope que não fecha deixa o ruído cortado seco — clique audível no fim',
    ).toBeLessThanOrEqual(0.001);
  });
});

describe('WP3.5 (D11) — o som de presença existe e é curto', () => {
  it('`playPresence` é exportado e não lança sem AudioContext', async () => {
    // A fronteira da D11 (só em resposta a gesto, 1× por sessão) mora no
    // CHAMADOR — `CompanionHUD.handlePetClick`. Aqui só se garante que o som
    // existe e falha em silêncio onde não há áudio, como os outros.
    const { playPresence } = await import('./sounds');
    expect(typeof playPresence).toBe('function');
    expect(() => playPresence()).not.toThrow();
  });
});
