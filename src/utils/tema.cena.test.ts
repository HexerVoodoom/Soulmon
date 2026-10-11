// @vitest-environment jsdom
/**
 * O TEMA no diretor de música (11/10/2026): o motivo de pausa `cena` (crossfade, volta de onde parou), o ganho vindo da
 * política (`loudness.ts`, "a música está muito baixa") e o `<audio>` refeito quando o contexto é refeito (bfcache).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const E = vi.hoisted(() => ({
  muted: false,
  ctxAtual: null as null | Record<string, any>,
  rampas: [] as Array<{ de: number; para: number; s: number }>,
}));

vi.mock('./audioBus', () => {
  const novoCtx = () => {
    const c: Record<string, any> = {
      state: 'running', currentTime: 0, resume: () => Promise.resolve(),
      createGain: () => ({
        gain: {
          value: 0,
          cancelScheduledValues() {},
          setValueAtTime(v: number) { this.value = v; },
          linearRampToValueAtTime(v: number) { E.rampas.push({ de: this.value, para: v, s: 0 }); },
        },
        connect() {}, disconnect() {},
      }),
      createMediaElementSource: () => ({ connect() {} }),
    };
    return c;
  };
  return {
    garantirBarramento: () => {
      if (!E.ctxAtual || E.ctxAtual.state === 'closed') E.ctxAtual = novoCtx();
      return { ctx: E.ctxAtual, busTema: { gain: { value: 1 }, connect() {} } };
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

import { armarTemaNoPrimeiroGesto, definirTemaEmCombate, esquecerTema, pausarTema, retomarTema, temaTocando } from './tema';
import { CROSSFADE_MUSICA_S } from './sonsAssets';
import { db2lin, GANHO_MUSICA_DB, OFFSET_MUSICA_EM_COMBATE_DB } from './loudness';

const gesto = () => window.dispatchEvent(new Event('pointerup'));

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  esquecerTema();
  fakes.length = 0; E.ctxAtual = null; E.rampas.length = 0; E.muted = false;
  vi.stubGlobal('Audio', FakeAudio);
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('2) "a música está muito baixa": o ganho do tema vem da política', () => {
  it('o fade-in sobe ao ganho de reprodução (alvo − masterização), não a 1', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    const subida = E.rampas.find(r => r.de === 0 && r.para > 0);
    expect(subida?.para).toBeCloseTo(db2lin(GANHO_MUSICA_DB), 9);
    expect(subida!.para).toBeGreaterThan(1); // o pedido foi MAIS ALTO
  });

  it('em combate o tema continua, mais baixo (o degrau do golpe)', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    definirTemaEmCombate(true);
    const desce = E.rampas.at(-1);
    expect(desce?.para).toBeCloseTo(db2lin(GANHO_MUSICA_DB + OFFSET_MUSICA_EM_COMBATE_DB), 9);
    definirTemaEmCombate(false);
    expect(E.rampas.at(-1)?.para).toBeCloseTo(db2lin(GANHO_MUSICA_DB), 9);
  });
});

describe('3) o motivo `cena`: a masmorra/arena pega o lugar do tema com crossfade, e ele volta de onde parou', () => {
  it('pausar por `cena` esmaece (não corta) e pausa o elemento só ao fim do crossfade; retomar volta ao ganho com fade longo', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    const a = fakes[0];
    expect(temaTocando()).toBe(true);
    pausarTema('cena');
    expect(temaTocando()).toBe(false);
    expect(E.rampas.at(-1)?.para).toBe(0);
    vi.advanceTimersByTime(CROSSFADE_MUSICA_S * 1000 - 100);
    expect(a.pausou).toBe(0); // ainda esmaecendo: nada de corte seco
    vi.advanceTimersByTime(200);
    expect(a.pausou).toBe(1);
    const tocouAntes = a.tocou;
    retomarTema('cena');
    expect(a.tocou).toBe(tocouAntes + 1);          // volta no MESMO elemento (de onde parou), sem recomeçar a faixa
    expect(fakes.length).toBe(1);
    expect(temaTocando()).toBe(true);
  });

  it('`cena` é um motivo como os outros: dormir enquanto está na masmorra não é liberado pelo fim da cena', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    pausarTema('cena');
    pausarTema('sono');
    retomarTema('cena');
    expect(temaTocando()).toBe(false);
    retomarTema('sono');
    expect(temaTocando()).toBe(true);
  });
});

describe('1) contexto refeito (pagehide → bfcache): o <audio> preso ao grafo morto é refeito', () => {
  it('com o contexto fechado e recriado, o próximo início cria um <audio> novo no contexto vigente', () => {
    armarTemaNoPrimeiroGesto();
    gesto();
    const velho = E.ctxAtual!;
    velho.state = 'closed';
    pausarTema('cena');
    vi.advanceTimersByTime(2000);
    retomarTema('cena');
    expect(E.ctxAtual).not.toBe(velho);
    expect(fakes.length).toBe(2);
    expect(fakes[1].tocou).toBe(1);
    expect(temaTocando()).toBe(true);
  });
});
