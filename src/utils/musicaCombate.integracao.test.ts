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
import { esquecerTrilha, aoGestoSonoro } from './trilha';
import { musicaLigada } from './audioBus';
import { desligarMusica } from './musica';
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
    // 19/10/2026 (REGISTRO §126, trilhas licenciadas): UMA faixa ('Stone Hall Combat') para todos os combates.
    ['masmorra', 'musica-combate'],
    ['duelo', 'musica-combate'],
    ['torneio', 'musica-combate'],
  ] as const)('%s → %s', (s, arquivo) => {
    iniciarMusica();
    const sair = entrarNaSuperficie(s);
    expect(tocandoArquivo(arquivo)).toBe(true);
    expect(musicaDeCombateTocando()).toBe('combate');
    sair();
  });
});

describe('§129: a preferência única de música (migração das chaves legadas + interruptor)', () => {
  it('desligou AS DUAS depois da §127: a música fica desligada e o combate é mudo', () => {
    localStorage.setItem(STORAGE_KEYS.SOUND_PREFS_VERSION, '1');
    localStorage.setItem(STORAGE_KEYS.SOUND_TRACK_ENABLED, 'false');
    localStorage.setItem(STORAGE_KEYS.SOUND_THEME_OFF, 'true');
    iniciarMusica();
    expect(musicaLigada()).toBe(false);
    entrarNaSuperficie('masmorra');
    expect(tocandoArquivo('musica-combate')).toBe(false);
    expect(musicaDeCombateTocando()).toBeNull();
  });
  it('só o combate "false" (tema ligado): fica LIGADA e a música de combate toca', () => {
    localStorage.setItem(STORAGE_KEYS.SOUND_PREFS_VERSION, '1');
    localStorage.setItem(STORAGE_KEYS.SOUND_TRACK_ENABLED, 'false');
    iniciarMusica();
    expect(musicaLigada()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.SOUND_TRACK_ENABLED)).toBeNull();
    entrarNaSuperficie('masmorra');
    expect(musicaDeCombateTocando()).toBe('combate');
  });
  it('idempotente: depois da migração, desligar pelo interruptor vale e uma 2ª partida NÃO religa', () => {
    iniciarMusica();
    desligarMusica();
    expect(localStorage.getItem(STORAGE_KEYS.SOUND_MUSIC_OFF)).toBe('true');
    esquecerTrilha(); esquecerMusica();
    iniciarMusica(); // "recarregar o app"
    expect(musicaLigada()).toBe(false);
    entrarNaSuperficie('masmorra');
    expect(musicaDeCombateTocando()).toBeNull();
  });
  it('Pesadelo com a música desligada = silêncio (nem tema)', () => {
    iniciarMusica();
    desligarMusica();
    entrarNaSuperficie('pesadelo');
    expect(musicaDeCombateTocando()).toBeNull();
  });
});

describe('o primeiro gesto sonoro antes de entrar não atrapalha', () => {
  it('aoGestoSonoro + masmorra toca o dungeon theme', () => {
    iniciarMusica();
    aoGestoSonoro();
    entrarNaSuperficie('masmorra');
    expect(musicaDeCombateTocando()).toBe('combate');
  });
});
