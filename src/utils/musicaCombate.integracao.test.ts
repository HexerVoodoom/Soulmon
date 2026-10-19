// @vitest-environment jsdom
/**
 * INTEGRAÇÃO "entrar no combate troca a trilha" (bug do dono, 19/10/2026: "Entrei no combate e não mudou a trilha").
 * Usa os módulos REAIS (musica → trilha → musicaDeCombate → streamMusica → tema) e o localStorage real do jsdom; só o
 * barramento Web Audio e o `<audio>` são falsos. Prova cada hipótese: chave ausente toca, chave 'false' herdada não toca.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const E = vi.hoisted(() => ({ ctx: null as null | Record<string, any> }));

vi.mock('./audioBus', async (orig) => {
  const real = await orig<typeof import('./audioBus')>();
  const novoCtx = () => ({
    state: 'running', currentTime: 0, sampleRate: 48000, resume: () => Promise.resolve(),
    createGain: () => ({
      gain: { value: 0, cancelScheduledValues() {}, setValueAtTime(v: number) { this.value = v; }, linearRampToValueAtTime() {} },
      connect() {}, disconnect() {},
    }),
    createMediaElementSource: () => ({ connect() {} }),
  });
  return {
    ...real,
    retomarContexto: () => {},
    garantirBarramento: () => {
      E.ctx ??= novoCtx();
      return { ctx: E.ctx, busTema: { gain: { value: 1 }, connect() {} }, busTrilha: { gain: { value: 1 }, connect() {} } };
    },
  };
});

const fakes: FakeAudio[] = [];
class FakeAudio {
  src = ''; preload = ''; loop = false; currentTime = 0; ended = false; tocou = 0; pausou = 0;
  constructor() { fakes.push(this); }
  setAttribute() {}
  canPlayType() { return 'maybe'; }
  addEventListener() {}
  play() { this.tocou++; return Promise.resolve(); }
  pause() { this.pausou++; }
}

import { entrarNaSuperficie, esquecerMusica, iniciarMusica } from './musica';
import { esquecerTrilha, aoGestoSonoro, desligarTrilha } from './trilha';
import { migrarPreferenciasDeSom } from './audioBus';
import { musicaDeCombateTocando } from './musicaDeCombate';
import { STORAGE_KEYS } from './storageKeys';

const tocandoArquivo = (f: string) => fakes.some(a => a.src.includes(f) && a.tocou > 0);

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  esquecerTrilha(); esquecerMusica();
  fakes.length = 0; E.ctx = null;
  vi.stubGlobal('Audio', FakeAudio);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('entrar na superfície de combate com a chave AUSENTE (aparelho novo): a música de combate toca', () => {
  it.each([
    ['masmorra', 'musica-masmorra'],
    ['duelo', 'musica-pvp'],
    ['torneio', 'musica-pvp'],
  ] as const)('%s → %s', (s, arquivo) => {
    iniciarMusica();
    const sair = entrarNaSuperficie(s);
    expect(tocandoArquivo(arquivo)).toBe(true);
    expect(musicaDeCombateTocando()).toBe(arquivo === 'musica-pvp' ? 'pvp' : 'masmorra');
    sair();
  });
});

describe('chave "false" ESCOLHIDA (marca de versão presente): a música de combate NÃO toca e a escolha é respeitada', () => {
  it('masmorra com SOUND_TRACK_ENABLED="false" + marca "1" fica muda (prova da hipótese b)', () => {
    localStorage.setItem(STORAGE_KEYS.SOUND_TRACK_ENABLED, 'false');
    localStorage.setItem(STORAGE_KEYS.SOUND_PREFS_VERSION, '1');
    iniciarMusica();
    entrarNaSuperficie('masmorra');
    expect(tocandoArquivo('musica-masmorra')).toBe(false);
    expect(musicaDeCombateTocando()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.SOUND_TRACK_ENABLED)).toBe('false');
  });
});

describe('§126: "false" HERDADO (sem marca de versão) é apagado uma vez e a música toca', () => {
  it('masmorra com "false" e sem marca toca o dungeon theme; a marca vira "1"', () => {
    localStorage.setItem(STORAGE_KEYS.SOUND_TRACK_ENABLED, 'false');
    iniciarMusica();
    expect(localStorage.getItem(STORAGE_KEYS.SOUND_TRACK_ENABLED)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.SOUND_PREFS_VERSION)).toBe('1');
    entrarNaSuperficie('masmorra');
    expect(musicaDeCombateTocando()).toBe('masmorra');
  });
  it('idempotente: depois da migração, desligar pelo interruptor vale e uma 2ª partida NÃO religa', () => {
    localStorage.setItem(STORAGE_KEYS.SOUND_TRACK_ENABLED, 'false');
    iniciarMusica();
    desligarTrilha();
    expect(localStorage.getItem(STORAGE_KEYS.SOUND_TRACK_ENABLED)).toBe('false');
    esquecerTrilha(); esquecerMusica();
    iniciarMusica(); // "recarregar o app"
    expect(localStorage.getItem(STORAGE_KEYS.SOUND_TRACK_ENABLED)).toBe('false');
    entrarNaSuperficie('masmorra');
    expect(musicaDeCombateTocando()).toBeNull();
  });
  it('chave ausente ou "true" não é tocada pela migração', () => {
    iniciarMusica();
    expect(localStorage.getItem(STORAGE_KEYS.SOUND_TRACK_ENABLED)).toBeNull();
    localStorage.removeItem(STORAGE_KEYS.SOUND_PREFS_VERSION);
    localStorage.setItem(STORAGE_KEYS.SOUND_TRACK_ENABLED, 'true');
    migrarPreferenciasDeSom();
    expect(localStorage.getItem(STORAGE_KEYS.SOUND_TRACK_ENABLED)).toBe('true');
  });
});

describe('o primeiro gesto sonoro antes de entrar não atrapalha', () => {
  it('aoGestoSonoro + masmorra toca o dungeon theme', () => {
    iniciarMusica();
    aoGestoSonoro();
    entrarNaSuperficie('masmorra');
    expect(musicaDeCombateTocando()).toBe('masmorra');
  });
});
