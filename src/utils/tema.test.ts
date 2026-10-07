// @vitest-environment jsdom
/**
 * A MÚSICA-TEMA (S17, 07/10/2026): nasce LIGADA e só COMEÇA no primeiro gesto.
 *
 * O motor de áudio é falso (só o bastante para `comecar()` chegar a `play()`):
 * o que se mede é a ORDEM — nada antes do gesto, nada com mudo/aba escondida/
 * pausa, e a volta com respiro depois do fim — nunca som.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const estado = vi.hoisted(() => ({ muted: false, barramentos: 0, busConexoes: 0 }));

vi.mock('./audioBus', () => {
  const gain = () => ({
    gain: { value: 1, cancelScheduledValues: () => {}, setValueAtTime: () => {}, linearRampToValueAtTime: () => {} },
    connect: () => { estado.busConexoes++; }, disconnect: () => {},
  });
  const ctx = {
    state: 'running', currentTime: 0, resume: () => Promise.resolve(),
    createGain: gain,
    createMediaElementSource: () => ({ connect: () => { estado.busConexoes++; } }),
  };
  const bus = { ctx, busTema: gain() };
  return { garantirBarramento: () => { estado.barramentos++; return bus; } };
});
vi.mock('./sounds', () => ({ isMuted: () => estado.muted }));

const fakes: FakeAudio[] = [];
class FakeAudio {
  src = ''; preload = ''; loop = false; currentTime = 0; ended = false;
  tocou = 0; pausou = 0; rejeitar = false;
  suportaWebm = true;
  private ouvintes = new Map<string, Array<() => void>>();
  constructor() { fakes.push(this); }
  setAttribute() {}
  canPlayType(m: string) { return /webm/.test(m) ? (this.suportaWebm ? 'maybe' : '') : 'maybe'; }
  addEventListener(t: string, f: () => void) { this.ouvintes.set(t, [...(this.ouvintes.get(t) ?? []), f]); }
  emitir(t: string) { (this.ouvintes.get(t) ?? []).forEach(f => f()); }
  play() { this.tocou++; return this.rejeitar ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve(); }
  pause() { this.pausou++; }
}

import {
  armarTemaNoPrimeiroGesto, desligarTema, esquecerTema, ligarTema, pausarTema, retomarTema,
  temaPausado, temaPreferido, temaTocando, escolherFormato,
} from './tema';
import { TEMA_DO_JOGO } from './sonsAssets';
import { STORAGE_KEYS } from './storageKeys';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const gesto = (tipo = 'pointerup') => window.dispatchEvent(new Event(tipo));
const escondida = (v: boolean) => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: v });
  document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  esquecerTema();
  fakes.length = 0;
  estado.muted = false;
  estado.barramentos = 0;
  estado.busConexoes = 0;
  vi.stubGlobal('Audio', FakeAudio);
  escondida(false);
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('S17 — nasce ligado, mas NADA acontece antes do gesto (D11)', () => {
  it('sem chave salva a preferência é LIGADA', () => {
    expect(temaPreferido()).toBe(true);
    localStorage.setItem(STORAGE_KEYS.SOUND_THEME_OFF, 'true');
    expect(temaPreferido()).toBe(false);
  });

  it('armar só instala ouvintes: nenhum <audio>, nenhum AudioContext, nenhum download', () => {
    armarTemaNoPrimeiroGesto();
    expect(fakes.length).toBe(0);
    expect(estado.barramentos).toBe(0);
    expect(temaTocando()).toBe(false);
  });

  it.each(['pointerup', 'touchend', 'keydown', 'click'])('o primeiro %s da sessão começa o tema, uma vez só', tipo => {
    armarTemaNoPrimeiroGesto();
    gesto(tipo);
    expect(fakes.length).toBe(1);
    expect(fakes[0].tocou).toBe(1);
    expect(fakes[0].src).toBe(TEMA_DO_JOGO.formatos[0].url);
    expect(temaTocando()).toBe(true);
    gesto(tipo); gesto('click');
    expect(fakes.length).toBe(1);
    expect(fakes[0].tocou).toBe(1);
  });

  it('com o tema desligado pelo jogador, armar não instala nada e o gesto não toca', () => {
    localStorage.setItem(STORAGE_KEYS.SOUND_THEME_OFF, 'true');
    armarTemaNoPrimeiroGesto();
    gesto();
    expect(fakes.length).toBe(0);
  });

  it('o <audio> passa pelo busTema (nunca direto na saída)', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    expect(estado.busConexoes).toBeGreaterThanOrEqual(2); // elemento→fade, fade→busTema
  });
});

describe('mudo, aba escondida, sono — E0', () => {
  it('mudo global no primeiro gesto: não toca; ao desmutar (retomar "mudo") começa', () => {
    estado.muted = true;
    armarTemaNoPrimeiroGesto();
    gesto();
    expect(temaTocando()).toBe(false);
    estado.muted = false;
    retomarTema('mudo');
    expect(temaTocando()).toBe(true);
  });

  it('aba escondida pausa o elemento; ao voltar retoma', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    escondida(true);
    expect(fakes[0].pausou).toBeGreaterThan(0);
    expect(temaTocando()).toBe(false);
    escondida(false);
    expect(temaTocando()).toBe(true);
  });

  it('com a aba escondida o gesto não começa nada', () => {
    escondida(true);
    armarTemaNoPrimeiroGesto();
    gesto();
    expect(temaTocando()).toBe(false);
  });

  it('pausar por "sono" para; os motivos são independentes e só o último libera', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    pausarTema('sono'); pausarTema('descanso');
    expect(temaTocando()).toBe(false);
    expect(temaPausado()).toBe(true);
    retomarTema('sono');
    expect(temaTocando()).toBe(false);
    retomarTema('descanso');
    expect(temaTocando()).toBe(true);
  });

  it('desligar nas Configurações para, persiste e o próximo gesto não religa', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    desligarTema();
    expect(temaTocando()).toBe(false);
    expect(temaPreferido()).toBe(false);
    gesto();
    expect(temaTocando()).toBe(false);
    ligarTema();
    expect(temaTocando()).toBe(true);
    expect(temaPreferido()).toBe(true);
  });
});

describe('fim e retomada, sem corte feio', () => {
  it('ao acabar descansa a pausa declarada e só então volta (nunca emenda seco)', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    const a = fakes[0];
    a.ended = true;
    a.emitir('ended');
    expect(temaTocando()).toBe(false);
    vi.advanceTimersByTime(TEMA_DO_JOGO.pausaEntreVoltasS * 1000 - 1);
    expect(a.tocou).toBe(1);
    vi.advanceTimersByTime(2);
    expect(a.tocou).toBe(2);
    expect(a.currentTime).toBe(0);
    expect(temaTocando()).toBe(true);
  });

  it('se a volta cai com a aba escondida, espera e retoma quando ela volta', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    const a = fakes[0];
    a.ended = true; a.emitir('ended');
    escondida(true);
    vi.advanceTimersByTime(TEMA_DO_JOGO.pausaEntreVoltasS * 1000 + 10);
    expect(a.tocou).toBe(1);
    escondida(false);
    expect(a.tocou).toBe(2);
  });
});

describe('robustez do motor', () => {
  it('play() recusado: não insiste (sem autoplay cego) — rearma, e o PRÓXIMO gesto tenta de novo', async () => {
    armarTemaNoPrimeiroGesto();
    // o motor recusa o primeiro play
    const antes = Audio;
    vi.stubGlobal('Audio', class extends FakeAudio { constructor() { super(); this.rejeitar = true; } });
    gesto();
    await Promise.resolve(); await Promise.resolve();
    expect(fakes[0].tocou).toBe(1);
    expect(temaTocando()).toBe(false);
    fakes[0].rejeitar = false;
    gesto();
    expect(fakes[0].tocou).toBe(2);
    expect(temaTocando()).toBe(true);
    vi.stubGlobal('Audio', antes);
  });

  it('escolherFormato: WebM/Opus quando o motor toca, M4A quando não', () => {
    const a = new FakeAudio();
    expect(escolherFormato(a)).toBe(0);
    a.suportaWebm = false;
    expect(escolherFormato(a)).toBe(1);
  });

  it('erro de rede no 1º formato troca UMA vez para o outro; depois cala', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    const a = fakes[0];
    a.emitir('error');
    expect(a.src).toBe(TEMA_DO_JOGO.formatos[1].url);
    a.emitir('error');
    expect(a.src).toBe(TEMA_DO_JOGO.formatos[1].url);
  });
});

describe('fiação (lê o FONTE, como os outros guards de call-site)', () => {
  const raiz = join(__dirname, '..', '..');
  const ler = (...p: string[]) => readFileSync(join(raiz, ...p), 'utf8');

  it('o main.tsx arma o tema ANTES de montar o app, e só ele o arma (nenhum play() no carregamento)', () => {
    const main = ler('src', 'main.tsx');
    expect(main).toMatch(/armarTemaNoPrimeiroGesto\(\);/);
    expect(main.indexOf('armarTemaNoPrimeiroGesto();')).toBeLessThan(main.indexOf('createRoot('));
    expect(ler('src', 'utils', 'tema.ts').replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\.play\(\)[\s\S]*DOMContentLoaded/);
  });

  it('os motivos de pausa do App (sono/descanso/mudo) chegam ao tema via pausarTrilha/retomarTrilha', () => {
    const t = ler('src', 'utils', 'trilha.ts');
    expect(t).toMatch(/pausarTema\(motivo\)/);
    expect(t).toMatch(/retomarTema\(motivo\)/);
  });

  it('a intro é muda (o vídeo não briga com o tema)', () => {
    expect(ler('src', 'components', 'IntroScreen.tsx')).toMatch(/<video[\s\S]*?\bmuted\b[\s\S]*?\/>/);
  });
});
