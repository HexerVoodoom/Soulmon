// @vitest-environment jsdom
/**
 * AS MÚSICAS DE COMBATE em streaming (19/10/2026): Stone Hall Combat / Stone Hall Nightmare. Sem consentimento (D11) nada toca; troca de
 * faixa é crossfade; pausas por motivo; mudo; o alvo do fade vem de `loudness.ts`. Mede decisões, nunca som.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const E = vi.hoisted(() => ({
  muted: false,
  ctxAtual: null as null | Record<string, any>,
  rampas: [] as Array<{ de: number; para: number }>,
}));

vi.mock('./audioBus', async (orig) => {
  const real = await orig<typeof import('./audioBus')>(); // a preferência de música (§129) é a REAL, no localStorage

  const novoCtx = () => {
    const c: Record<string, any> = {
      state: 'running', currentTime: 0, resume: () => Promise.resolve(),
      createGain: () => ({
        gain: {
          value: 0,
          cancelScheduledValues() {},
          setValueAtTime(v: number) { this.value = v; },
          linearRampToValueAtTime(v: number) { E.rampas.push({ de: this.value, para: v }); },
        },
        connect() {}, disconnect() {},
      }),
      createMediaElementSource: () => ({ connect() {} }),
    };
    return c;
  };
  return {
    ...real,
    garantirBarramento: () => {
      if (!E.ctxAtual || E.ctxAtual.state === 'closed') E.ctxAtual = novoCtx();
      return { ctx: E.ctxAtual, busTema: { gain: { value: 1 }, connect() {} }, busTrilha: { gain: { value: 1 }, connect() {} } };
    },
  };
});
vi.mock('./sounds', () => ({ isMuted: () => E.muted }));

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

import {
  consentirMusicaDeCombate, esquecerMusicaDeCombate, musicaDeCombatePedida, musicaDeCombateTocando, pausarMusicaDeCombate,
  pedirMusicaDeCombate, retomarMusicaDeCombate,
} from './musicaDeCombate';
import { CROSSFADE_MUSICA_S } from './sonsAssets';
import { db2lin, GANHO_MUSICA_DB, OFFSET_MUSICA_EM_COMBATE_DB, TRIM_MUSICAS_DE_COMBATE_DB } from './loudness';

const doArquivo = (f: string) => fakes.find(a => a.src.includes(f));

beforeEach(() => {
  vi.useFakeTimers();
  esquecerMusicaDeCombate();
  fakes.length = 0; E.ctxAtual = null; E.rampas.length = 0; E.muted = false;
  vi.stubGlobal('Audio', FakeAudio);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('D11: sem consentimento nada toca', () => {
  it('pedida mas sem `consentirMusicaDeCombate(true)`: nenhum <audio> nasce e nada toca', () => {
    pedirMusicaDeCombate('combate');
    expect(musicaDeCombatePedida()).toBe('combate');
    expect(fakes.length).toBe(0);
    expect(musicaDeCombateTocando()).toBeNull();
  });
});

describe('a faixa pedida toca, e trocar é crossfade', () => {
  it('consentida + pedida combate toca o Stone Hall Combat', () => {
    consentirMusicaDeCombate(true);
    pedirMusicaDeCombate('combate');
    expect(fakes.length).toBe(1);
    expect(fakes[0].src).toMatch(/\/sounds\/musica-combate\.(webm|m4a)$/);
    expect(fakes[0].tocou).toBe(1);
    expect(musicaDeCombateTocando()).toBe('combate');
  });

  it('consentir DEPOIS de pedir também toca (o gesto vem por último)', () => {
    pedirMusicaDeCombate('pesadelo');
    consentirMusicaDeCombate(true);
    expect(musicaDeCombateTocando()).toBe('pesadelo');
  });

  it('trocar para pesadelo esmaece o combate (pausa só ao fim do crossfade) e toca o pesadelo', () => {
    consentirMusicaDeCombate(true);
    pedirMusicaDeCombate('combate');
    const m = doArquivo('musica-combate')!;
    pedirMusicaDeCombate('pesadelo');
    expect(musicaDeCombateTocando()).toBe('pesadelo');
    expect(doArquivo('musica-pesadelo')!.tocou).toBe(1);
    expect(m.pausou).toBe(0);
    vi.advanceTimersByTime(CROSSFADE_MUSICA_S * 1000 + 100);
    expect(m.pausou).toBe(1);
  });

  it('pedir `null` para a faixa', () => {
    consentirMusicaDeCombate(true);
    pedirMusicaDeCombate('pesadelo');
    pedirMusicaDeCombate(null);
    expect(musicaDeCombateTocando()).toBeNull();
    vi.advanceTimersByTime(CROSSFADE_MUSICA_S * 1000 + 100);
    expect(fakes[0].pausou).toBe(1);
  });
});

describe('pausas por motivo, mudo e interruptor', () => {
  it('pausar `sono` para, retomar volta; com dois motivos, liberar um não toca', () => {
    consentirMusicaDeCombate(true);
    pedirMusicaDeCombate('combate');
    pausarMusicaDeCombate('sono');
    expect(musicaDeCombateTocando()).toBeNull();
    retomarMusicaDeCombate('sono');
    expect(musicaDeCombateTocando()).toBe('combate');
    pausarMusicaDeCombate('sono');
    pausarMusicaDeCombate('mudo');
    retomarMusicaDeCombate('sono');
    expect(musicaDeCombateTocando()).toBeNull();
    retomarMusicaDeCombate('mudo');
    expect(musicaDeCombateTocando()).toBe('combate');
  });

  it('o mudo global impede de começar', () => {
    E.muted = true;
    consentirMusicaDeCombate(true);
    pedirMusicaDeCombate('combate');
    expect(musicaDeCombateTocando()).toBeNull();
    expect(fakes.every(a => a.tocou === 0)).toBe(true);
  });

  it('`consentirMusicaDeCombate(false)` para', () => {
    consentirMusicaDeCombate(true);
    pedirMusicaDeCombate('combate');
    consentirMusicaDeCombate(false);
    expect(musicaDeCombateTocando()).toBeNull();
    pedirMusicaDeCombate('pesadelo'); // sem consentimento: não volta
    expect(musicaDeCombateTocando()).toBeNull();
  });
});

describe('o alvo do fade vem de loudness.ts', () => {
  it('em combate desce o degrau; com `combate=false` (lobby) é só o ganho de reprodução', () => {
    consentirMusicaDeCombate(true);
    pedirMusicaDeCombate('combate');
    const subida = E.rampas.find(r => r.de === 0 && r.para > 0);
    expect(subida?.para).toBeCloseTo(db2lin(GANHO_MUSICA_DB + TRIM_MUSICAS_DE_COMBATE_DB.combate + OFFSET_MUSICA_EM_COMBATE_DB), 9);
    esquecerMusicaDeCombate();
    fakes.length = 0; E.rampas.length = 0;
    consentirMusicaDeCombate(true);
    pedirMusicaDeCombate('pesadelo', false);
    const lobby = E.rampas.find(r => r.de === 0 && r.para > 0);
    expect(lobby?.para).toBeCloseTo(db2lin(GANHO_MUSICA_DB + TRIM_MUSICAS_DE_COMBATE_DB.pesadelo), 9);
  });

  it('mesma faixa com `combate` mudando rampa para o alvo novo em crossfade', () => {
    consentirMusicaDeCombate(true);
    pedirMusicaDeCombate('pesadelo', false);
    pedirMusicaDeCombate('pesadelo', true);
    expect(E.rampas.at(-1)?.para).toBeCloseTo(db2lin(GANHO_MUSICA_DB + TRIM_MUSICAS_DE_COMBATE_DB.pesadelo + OFFSET_MUSICA_EM_COMBATE_DB), 9);
    expect(fakes.length).toBe(1); // mesmo elemento
  });
});
