// @vitest-environment jsdom
/**
 * AUDITORIA DA MÚSICA (11/10/2026) — a retomada do contexto é do barramento, com dono único: o contexto é suspenso
 * com a aba oculta (restrição 4) e o navegador também o suspende sozinho (`interrupted` no iOS, foco de áudio no
 * Chrome, APK voltando do segundo plano). Antes, NINGUÉM mandava `resume()` ao voltar: a música ficava "tocando" num
 * contexto `suspended`, em silêncio, até o próximo SFX por acaso destravá-lo.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { barramentoAtual, encerrarBarramento, retomarContexto, tocarNa } from './audioBus';

let ctxs: Array<{ state: string; resumes: number; ouvintes: Map<string, Array<() => void>> }> = [];

function instalar() {
  ctxs = [];
  class Falso {
    currentTime = 0; sampleRate = 48000; state = 'running'; resumes = 0;
    destination = {};
    ouvintes = new Map<string, Array<() => void>>();
    constructor() { ctxs.push(this); }
    addEventListener(t: string, f: () => void) { this.ouvintes.set(t, [...(this.ouvintes.get(t) ?? []), f]); }
    emitir(t: string) { (this.ouvintes.get(t) ?? []).forEach(f => f()); }
    resume() { this.resumes++; this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createGain() { return { gain: { value: 1, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} }; }
  }
  vi.stubGlobal('AudioContext', Falso as unknown as typeof AudioContext);
  Object.defineProperty(window, 'AudioContext', { configurable: true, value: Falso });
}
const escondida = (v: boolean) => {
  Object.defineProperty(document, 'hidden', { configurable: true, value: v });
  document.dispatchEvent(new Event('visibilitychange'));
};
const emitir = (t: string) => (ctxs[0] as unknown as { emitir(t: string): void }).emitir(t);

beforeEach(() => {
  encerrarBarramento();
  instalar();
  escondida(false);
  tocarNa('conclusao', () => 0.1); // o contexto nasce no gesto
});
afterEach(() => { encerrarBarramento(); vi.unstubAllGlobals(); });

describe('retomada do contexto', () => {
  it('aba oculta suspende; ao voltar, retoma (era o "música que não volta")', () => {
    escondida(true);
    expect(ctxs[0].state).toBe('suspended');
    escondida(false);
    expect(ctxs[0].state).toBe('running');
    expect(ctxs[0].resumes).toBeGreaterThan(0);
  });

  it('o navegador suspendeu sozinho (`statechange` → suspended / interrupted) com a aba visível: retoma', () => {
    ctxs[0].state = 'suspended';
    emitir('statechange');
    expect(ctxs[0].state).toBe('running');
    ctxs[0].state = 'interrupted';
    emitir('statechange');
    expect(ctxs[0].state).toBe('running');
  });

  it('com a aba OCULTA nada retoma (D11): nem o statechange, nem o focus, nem o pageshow', () => {
    escondida(true);
    const n = ctxs[0].resumes;
    emitir('statechange');
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('pageshow'));
    document.dispatchEvent(new Event('resume'));
    expect(ctxs[0].resumes).toBe(n);
    expect(ctxs[0].state).toBe('suspended');
  });

  it.each(['focus', 'pageshow'])('%s (bfcache / foco) retoma um contexto suspenso', (ev) => {
    ctxs[0].state = 'suspended';
    window.dispatchEvent(new Event(ev));
    expect(ctxs[0].state).toBe('running');
  });

  it('o evento `resume` do Capacitor (APK voltando do segundo plano) retoma', () => {
    ctxs[0].state = 'suspended';
    document.dispatchEvent(new Event('resume'));
    expect(ctxs[0].state).toBe('running');
  });

  it('contexto fechado não é retomado, e sem barramento é inofensivo', () => {
    ctxs[0].state = 'closed';
    const n = ctxs[0].resumes;
    retomarContexto();
    expect(ctxs[0].resumes).toBe(n);
    encerrarBarramento();
    expect(barramentoAtual()).toBeNull();
    expect(() => retomarContexto()).not.toThrow();
  });
});
