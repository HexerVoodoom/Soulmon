// @vitest-environment jsdom
/**
 * O CONTRATO DO BARRAMENTO — run `som-01`, Fase 2, fatia 2.
 *
 * O `sounds.visorTune.test.ts` mede O QUE cada som é. Este mede o que existe
 * **em volta** deles, e que antes desta fatia não existia: um contexto só, um
 * sub-mix por categoria, um limitador no teto S3, os dois duckings, e um ciclo
 * de vida que não vaza.
 *
 * As quatro coisas travadas aqui são as quatro que, quebradas, não ficam
 * vermelhas em lugar nenhum:
 *
 * 1. **Um contexto, não um por som.** O bug que motivou a fatia é exatamente
 *    este, e a forma de ele voltar é alguém "simplificar" `tocarNa`. Um teste
 *    que só verificasse que o som toca continuaria verde com N contextos.
 * 2. **A trilha nasce DESLIGADA, em chave PRÓPRIA** (S2). A chave separada é o
 *    ponto: pendurada no `mute` global — que devolve `false` sem a chave, ou
 *    seja, som LIGADO — a trilha nasceria tocando, que é autoplay, que a D11
 *    veta. O padrão de fábrica desligado é travado por teste porque é uma
 *    decisão de produto, não um detalhe de implementação.
 * 3. **D11, segunda linha.** Com `document.hidden`, o barramento não constrói
 *    nem toca. A asserção NORMATIVA continua no chamador
 *    (`som-presenca-d11.render.test.tsx`) — não estamos reabrindo a D11, e sim
 *    provando que o caminho novo não abriu uma porta lateral para ela.
 * 4. **Não vazar.** Contexto que vive para sempre precisa de uma saída
 *    declarada: suspende com a aba oculta, fecha no `pagehide`, e se
 *    reconstrói se estiver `closed`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';
import { TETO_DBTP, db2lin } from './loudness';
import {
  D2_PROFUNDIDADE_DB,
  barramentoAtual,
  definirTrilhaLigada,
  definirVolume,
  encerrarBarramento,
  tocarNa,
  trilhaLigada,
  volumeDe,
} from './audioBus';

/* ── Duplos ──────────────────────────────────────────────────────────────── */

type Evento = { no: string; metodo: string; valor: number; quando: number };

function instalarAudioFalso() {
  let contextos = 0;
  let fechados = 0;
  let suspensos = 0;
  let retomados = 0;
  const eventos: Evento[] = [];
  const criados: string[] = [];
  const ligacoes: Array<[string, string]> = [];
  const waveshapers: Array<{ oversample: string; curve: Float32Array | null }> = [];

  const param = (no: string) => ({
    value: 0,
    cancelScheduledValues: () => {},
    setValueAtTime: (v: number, t: number) => { eventos.push({ no, metodo: 'set', valor: v, quando: t }); },
    linearRampToValueAtTime: (v: number, t: number) => { eventos.push({ no, metodo: 'linear', valor: v, quando: t }); },
    exponentialRampToValueAtTime: () => {},
  });

  /** Cada `GainNode` ganha um apelido pela ORDEM de criação, que é a do grafo. */
  const APELIDOS = [
    'master', 'duckGeral', 'busSfx', 'busTrilha', 'duckArcade',
    'marco', 'presenca', 'degeneracao', 'sintonia', 'cuidado', 'conclusao', 'transacao', 'arcade',
  ];

  class ContextoFalso {
    currentTime = 0;
    sampleRate = 48000;
    state: AudioContextState = 'suspended';
    destination = { __no: 'destination' };
    private nGain = 0;
    constructor() { contextos++; }
    resume() { retomados++; this.state = 'running'; return Promise.resolve(); }
    suspend() { suspensos++; this.state = 'suspended'; return Promise.resolve(); }
    close() { fechados++; this.state = 'closed'; return Promise.resolve(); }
    createGain() {
      const nome = APELIDOS[this.nGain++] ?? `gain${this.nGain}`;
      criados.push(nome);
      return {
        __no: nome,
        gain: param(nome),
        connect: (d: { __no?: string }) => { ligacoes.push([nome, d.__no ?? '?']); },
      };
    }
    createWaveShaper() {
      const ws = { __no: 'limitador', oversample: '', curve: null as Float32Array | null, connect: (d: { __no?: string }) => { ligacoes.push(['limitador', d.__no ?? '?']); } };
      waveshapers.push(ws as unknown as { oversample: string; curve: Float32Array | null });
      criados.push('limitador');
      return ws;
    }
    createOscillator() {
      criados.push('oscillator');
      return { type: '', frequency: param('osc'), connect: () => {}, start: () => {}, stop: () => {} };
    }
  }

  vi.stubGlobal('AudioContext', ContextoFalso as unknown as typeof AudioContext);
  return {
    eventos, criados, ligacoes, waveshapers,
    get contextos() { return contextos; },
    get fechados() { return fechados; },
    get suspensos() { return suspensos; },
    get retomados() { return retomados; },
    de: (no: string) => eventos.filter(e => e.no === no),
    destinoDe: (no: string) => ligacoes.filter(l => l[0] === no).map(l => l[1]),
  };
}

function instalarStorageEmMemoria() {
  const dados = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => { dados.set(k, String(v)); },
    removeItem: (k: string) => { dados.delete(k); },
    clear: () => dados.clear(),
    key: (i: number) => [...dados.keys()][i] ?? null,
    get length() { return dados.size; },
  });
  return dados;
}

function fixarAbaOculta(oculta: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: oculta });
}

let audio: ReturnType<typeof instalarAudioFalso>;
let armazem: Map<string, string>;

beforeEach(() => {
  armazem = instalarStorageEmMemoria();
  audio = instalarAudioFalso();
  fixarAbaOculta(false);
});
afterEach(() => {
  encerrarBarramento();
  vi.unstubAllGlobals();
});

/** Uma fonte qualquer, para o barramento ter o que ligar. */
const umaFonte = (dur = 0.2) => (ctx: AudioContext, destino: AudioNode) => {
  const osc = ctx.createOscillator();
  osc.connect(destino);
  return dur;
};

/* ── 1. Um contexto, compartilhado ───────────────────────────────────────── */

describe('UM AudioContext, não um por som', () => {
  it('três sons de categorias diferentes constroem UM contexto só', () => {
    tocarNa('cuidado', umaFonte());
    tocarNa('conclusao', umaFonte());
    tocarNa('presenca', umaFonte());
    expect(
      audio.contextos,
      'voltou o AudioContext-por-chamada: sem contexto único não há sub-mix, ducking nem volume — é o defeito que esta fatia existe para matar',
    ).toBe(1);
  });

  it('o sub-mix é montado UMA vez, não a cada som', () => {
    tocarNa('cuidado', umaFonte());
    const apos1 = audio.criados.filter(n => n !== 'oscillator').length;
    tocarNa('cuidado', umaFonte());
    const apos2 = audio.criados.filter(n => n !== 'oscillator').length;
    expect(apos2, 'o grafo foi remontado no segundo som').toBe(apos1);
  });

  it('o grafo tem a topologia da spec §6.1', () => {
    tocarNa('cuidado', umaFonte());
    expect(audio.destinoDe('busSfx')).toContain('duckGeral');
    expect(audio.destinoDe('busTrilha')).toContain('duckGeral');
    expect(audio.destinoDe('duckGeral')).toContain('master');
    expect(audio.destinoDe('duckArcade')).toContain('busSfx');
    expect(audio.destinoDe('arcade'), 'o Arcade tem de passar pelo duckArcade, senão o D-2 não alcança ninguém').toContain('duckArcade');
    expect(audio.destinoDe('cuidado')).toContain('busSfx');
  });

  it('D-1: o Marco NÃO passa pelo duckGeral — ele é quem duca', () => {
    tocarNa('cuidado', umaFonte());
    expect(
      audio.destinoDe('marco'),
      'Marco ligado ao duckGeral se abaixaria a si mesmo: o silêncio que ele pede seria o dele próprio',
    ).toEqual(['master']);
  });
});

/* ── 2. O limitador no teto S3 ───────────────────────────────────────────── */

describe('o limitador é a rede de segurança do teto S3', () => {
  it('existe, tem oversample 4x e clipa no teto importado da política', () => {
    tocarNa('cuidado', umaFonte());
    expect(audio.waveshapers.length, 'sem limitador o teto de −1 dBTP é uma promessa').toBe(1);
    const ws = audio.waveshapers[0];
    expect(
      ws.oversample,
      'sem oversampling o limitador mede pico de AMOSTRA: o run mediu −1,00 dBFS de amostra valendo +1,51 dBTP reais',
    ).toBe('4x');
    const pico = Math.max(...Array.from(ws.curve!));
    expect(pico).toBeCloseTo(db2lin(TETO_DBTP), 6);
  });

  it('o limitador fica ENTRE o master e a saída', () => {
    tocarNa('cuidado', umaFonte());
    expect(audio.destinoDe('master')).toEqual(['limitador']);
    expect(audio.destinoDe('limitador')).toEqual(['destination']);
  });
});

/* ── 3. Os dois duckings ─────────────────────────────────────────────────── */

describe('os duckings da §6.2', () => {
  it('D-2: classe superior abaixa o Arcade em 9 dB e o DEVOLVE', () => {
    tocarNa('cuidado', umaFonte(0.5));
    const rampas = audio.de('duckArcade').filter(e => e.metodo === 'linear');
    expect(rampas.length, 'D-2 sem ataque e liberação: um duck que não volta é um bus mudo para sempre').toBe(2);
    expect(rampas[0].valor).toBeCloseTo(db2lin(D2_PROFUNDIDADE_DB), 6);
    expect(rampas[1].valor, 'a liberação tem de voltar a 1: som que abaixa e não devolve silencia os minijogos').toBe(1);
  });

  it('D-2 NÃO dispara em `sintonia` nem em `arcade` — só as classes superiores ducam', () => {
    tocarNa('sintonia', umaFonte());
    tocarNa('arcade', umaFonte());
    expect(
      audio.de('duckArcade'),
      'a sintonia é a varredura que ANTECEDE a celebração, não a celebração: ela não tem hierarquia sobre o Arcade',
    ).toEqual([]);
  });

  it('D-1: o Marco abaixa TUDO e agenda a volta — nunca fica devendo', () => {
    tocarNa('marco', umaFonte(0.83));
    const rampas = audio.de('duckGeral').filter(e => e.metodo === 'linear');
    expect(rampas.length, 'D-1 sem liberação agendada silencia o app inteiro até o próximo reload').toBe(2);
    expect(rampas[0].valor).toBe(0);
    expect(rampas[1].valor).toBe(1);
    expect(rampas[1].quando, 'a volta tem de acontecer DEPOIS do som que a pediu').toBeGreaterThan(0.83);
  });
});

/* ── 4. Trilha: chave própria, padrão desligado ──────────────────────────── */

describe('a trilha nasce DESLIGADA, em chave própria (S2)', () => {
  it('sem chave nenhuma, a trilha está desligada', () => {
    expect(armazem.has(STORAGE_KEYS.SOUND_TRACK_ENABLED)).toBe(false);
    expect(
      trilhaLigada(),
      'trilha ligada por padrão é autoplay, e a D11 veta autoplay — o padrão de fábrica é a decisão S2',
    ).toBe(false);
  });

  it('o bus da trilha nasce em 0, mesmo com o som global ligado', () => {
    tocarNa('cuidado', umaFonte());
    expect(barramentoAtual()!.busTrilha.gain.value).toBe(0);
  });

  it('a chave da trilha é OUTRA, não o `SOUND_MUTED`', () => {
    definirTrilhaLigada(true);
    expect(STORAGE_KEYS.SOUND_TRACK_ENABLED).not.toBe(STORAGE_KEYS.SOUND_MUTED);
    expect(armazem.has(STORAGE_KEYS.SOUND_TRACK_ENABLED)).toBe(true);
    expect(
      armazem.has(STORAGE_KEYS.SOUND_MUTED),
      'ligar a trilha escreveu no mudo global: os dois estados foram fundidos, e é a fusão que a S2 proíbe',
    ).toBe(false);
    expect(trilhaLigada()).toBe(true);
  });

  it('ligar a trilha alcança o barramento já montado', () => {
    tocarNa('cuidado', umaFonte());
    definirTrilhaLigada(true);
    expect(barramentoAtual()!.busTrilha.gain.value).toBe(1);
    definirTrilhaLigada(false);
    expect(barramentoAtual()!.busTrilha.gain.value).toBe(0);
  });
});

/* ── 5. Volume por categoria ─────────────────────────────────────────────── */

describe('volume por categoria', () => {
  it('sem preferência gravada, cada categoria toca no alvo (ganho 1)', () => {
    expect(volumeDe('cuidado')).toBe(1);
  });

  it('a preferência persiste em chave própria e alcança o bus já montado', () => {
    tocarNa('cuidado', umaFonte());
    definirVolume('cuidado', 0.25);
    expect(volumeDe('cuidado')).toBe(0.25);
    expect(barramentoAtual()!.busCategoria.cuidado.gain.value).toBeCloseTo(0.25, 9);
    expect(barramentoAtual()!.busCategoria.conclusao.gain.value, 'mexer numa categoria mexeu na outra: não é sub-mix, é ganho global').toBeCloseTo(1, 9);
  });

  it('valor fora da faixa é higienizado, não propagado', () => {
    definirVolume('arcade', 9);
    expect(volumeDe('arcade')).toBe(1);
    definirVolume('arcade', -3);
    expect(volumeDe('arcade')).toBe(0);
  });
});

/* ── 6. Autoplay e ciclo de vida ─────────────────────────────────────────── */

describe('autoplay, D11 e não-vazamento', () => {
  it('AUTOPLAY: um contexto que nasce `suspended` é retomado EXPLICITAMENTE', () => {
    tocarNa('cuidado', umaFonte());
    expect(
      audio.retomados,
      'o contexto compartilhado nasce suspenso e ficaria assim: esperar que "algum clique futuro" o destrave é exatamente como se perde som no Safari',
    ).toBeGreaterThanOrEqual(1);
  });

  it('D11 (segunda linha): com a aba oculta nada é construído e nada toca', () => {
    fixarAbaOculta(true);
    const tocou = tocarNa('presenca', umaFonte());
    expect(tocou).toBe(false);
    expect(
      audio.contextos,
      'aba oculta construindo AudioContext é a porta lateral da D11: som que sai sozinho não é presença, é alarme',
    ).toBe(0);
  });

  it('a aba oculta SUSPENDE o contexto que já existe — não deixa o motor rodando à toa', () => {
    tocarNa('cuidado', umaFonte());
    fixarAbaOculta(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(audio.suspensos).toBeGreaterThanOrEqual(1);
  });

  it('`pagehide` FECHA o contexto: ele vive para sempre, mas não além do app', () => {
    tocarNa('cuidado', umaFonte());
    window.dispatchEvent(new Event('pagehide'));
    expect(audio.fechados, 'contexto que nunca fecha é o vazamento que o AudioContext-por-chamada não tinha').toBe(1);
    expect(barramentoAtual()).toBeNull();
  });

  it('depois de fechado, o barramento se reconstrói — nada de mudez permanente e silenciosa', () => {
    tocarNa('cuidado', umaFonte());
    window.dispatchEvent(new Event('pagehide'));
    const tocou = tocarNa('cuidado', umaFonte());
    expect(tocou, 'sem reconstrução, um pagehide seguido de volta (bfcache) deixaria o app mudo sem erro nenhum').toBe(true);
    expect(audio.contextos).toBe(2);
  });

  it('`encerrarBarramento` é idempotente', () => {
    tocarNa('cuidado', umaFonte());
    encerrarBarramento();
    encerrarBarramento();
    expect(audio.fechados).toBe(1);
  });

  it('sem motor de áudio, falha em silêncio', () => {
    vi.stubGlobal('AudioContext', undefined);
    expect(() => tocarNa('cuidado', umaFonte())).not.toThrow();
    expect(tocarNa('cuidado', umaFonte())).toBe(false);
  });
});
