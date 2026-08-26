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
 * 2. **Curto.** "Chiado CURTO" é a palavra da spec. Acima de ~0,3 s deixa de ser
 *    um estalo de sintonia e vira estática por cima do bicho.
 * 3. **Discreto e sem alarme.** Ganho no máximo igual ao som mais tímido do
 *    arquivo (`playMenuOpen`, 0.08), e a banda do filtro inteiramente ACIMA da
 *    região grave: grave curto é impacto, e impacto assusta. A sintonia é uma
 *    coisa boa acontecendo.
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
  it('CURTO: o ruído dura no máximo 0,3 s', () => {
    playVisorTune();
    expect(audio.duracaoBuffer).toBeGreaterThan(0);
    expect(
      audio.duracaoBuffer,
      'passou de estalo de sintonia para estática por cima do bicho',
    ).toBeLessThanOrEqual(0.3);
  });

  it('DISCRETO: o pico de ganho não passa do som mais tímido do arquivo (0.08)', () => {
    playVisorTune();
    const picos = audio.de('gain').map(a => a.valor);
    expect(picos.length, 'sem envelope de ganho o ruído entra e sai no talo').toBeGreaterThan(0);
    expect(
      Math.max(...picos),
      'chiado mais alto que o clique de menu deixa de ser fundo e vira evento',
    ).toBeLessThanOrEqual(0.08);
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
