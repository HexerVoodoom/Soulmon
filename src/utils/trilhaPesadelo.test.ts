// @vitest-environment jsdom
/**
 * A TRILHA DE TERROR DO PESADELO (15/10/2026): síntese determinística e sem emenda + reprodução com o motor de áudio
 * FALSO (só o bastante do Web Audio). Mede decisões e estado (quem toca, quando, em que bus), nunca som.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const E = vi.hoisted(() => ({ mudo: false, criados: 0, ctx: null as null | Record<string, any>, bus: { gain: { value: 0 } } }));

vi.mock('./audioBus', () => ({
  garantirBarramento: () => {
    if (!E.ctx || E.ctx.state === 'closed') {
      E.criados++;
      const c: Record<string, any> = {
        state: 'running', currentTime: 0, sampleRate: 48000, fontes: [] as any[], ganhos: [] as any[], resumes: 0,
        resume() { c.resumes++; c.state = 'running'; return Promise.resolve(); },
        createGain() {
          const g = { gain: { value: 1, rampas: [] as number[], cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime(v: number) { this.rampas.push(v); } }, connect() {}, disconnect() {} };
          c.ganhos.push(g); return g;
        },
        createBuffer: (_n: number, len: number, sr: number) => ({ length: len, duration: len / sr, sr, copyToChannel() {} }),
        createBufferSource() {
          const f = { buffer: null as any, loop: false, loopStart: 0, loopEnd: 0, parou: false, connect() {}, disconnect() {}, start() {}, stop(t?: number) { if (t === undefined || t <= c.currentTime) f.parou = true; } };
          c.fontes.push(f); return f;
        },
      };
      E.ctx = c;
    }
    return { ctx: E.ctx, busTrilha: E.bus };
  },
  retomarContexto: () => {},
}));
vi.mock('./sounds', () => ({ isMuted: () => E.mudo }));

import {
  DURACAO_PESADELO_S, PICO_PESADELO, TAXA_PESADELO, ARQUIVO_DO_DONO, esquecerTrilhaPesadelo, medirTrilha, paraWav16, pausarPesadelo,
  pedirTrilhaPesadelo, retomarPesadelo, sintetizarTrilhaPesadelo, trilhaPesadeloTocando,
} from './trilhaPesadelo';
import { GANHO_MUSICA_DB, OFFSET_MUSICA_EM_COMBATE_DB, TRIM_TRILHA_POR_CAMADAS_DB, db2lin } from './loudness';

const pequena = { sampleRate: 4000, duracaoS: 8 };
const soma = (d: Float32Array) => { let h = 0; for (let i = 0; i < d.length; i++) h = (Math.imul(h, 31) + Math.round(d[i] * 1e6)) | 0; return h; };
const tick = () => new Promise(r => setTimeout(r, 80)); // a síntese cede 30 ms ao quadro antes de rodar

beforeEach(() => {
  esquecerTrilhaPesadelo();
  E.mudo = false; E.criados = 0; E.ctx = null; E.bus.gain.value = 0;
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
});

describe('a síntese', () => {
  it('é DETERMINÍSTICA por semente: duas gerações iguais; outra semente, outra trilha', () => {
    const a = sintetizarTrilhaPesadelo({ ...pequena, seed: 7 });
    const b = sintetizarTrilhaPesadelo({ ...pequena, seed: 7 });
    const c = sintetizarTrilhaPesadelo({ ...pequena, seed: 8 });
    expect(soma(a)).toBe(soma(b));
    expect(soma(a)).not.toBe(soma(c));
    expect(a.length).toBe(4000 * 8);
  });
  it('é finita, sem DC, com pico no alvo (-14,1 dBFS) e sem clipping', () => {
    const d = sintetizarTrilhaPesadelo(pequena);
    expect(d.every(Number.isFinite)).toBe(true);
    const { pico } = medirTrilha(d);
    expect(pico).toBeCloseTo(PICO_PESADELO, 4);
    expect(pico).toBeLessThan(0.25);
    let m = 0;
    for (const x of d) m += x;
    expect(Math.abs(m / d.length)).toBeLessThan(0.002);
  });
  it('LOOP SEM EMENDA: o salto do último para o primeiro é do tamanho dos saltos vizinhos (sem degrau)', () => {
    const d = sintetizarTrilhaPesadelo({ sampleRate: 8000, duracaoS: 16 });
    let maxVizinho = 0;
    for (let i = 1; i < d.length; i++) maxVizinho = Math.max(maxVizinho, Math.abs(d[i] - d[i - 1]));
    const emenda = Math.abs(d[0] - d[d.length - 1]);
    expect(emenda).toBeLessThanOrEqual(maxVizinho * 1.01);
  });
  it('não é silêncio nem ruído branco: tem RMS e o grave domina (drones/batida)', () => {
    const d = sintetizarTrilhaPesadelo({ sampleRate: 8000, duracaoS: 8 });
    const { rms } = medirTrilha(d);
    expect(rms).toBeGreaterThan(0.01);
    let e1 = 0;
    let e0 = 0;
    for (let i = 1; i < d.length; i++) { e1 += (d[i] - d[i - 1]) ** 2; e0 += d[i] ** 2; }
    expect(e1 / e0).toBeLessThan(0.5);
  });
  it('a duração e a taxa padrão do loop são as documentadas', () => {
    expect(DURACAO_PESADELO_S).toBe(24);
    expect(TAXA_PESADELO).toBe(12000);
  });
  it('o WAV tem cabeçalho PCM 16 bits mono e o tamanho certo', () => {
    const w = paraWav16(new Float32Array([0, 0.5, -0.5, 1]), 16000);
    const t = (o: number, n: number) => String.fromCharCode(...w.slice(o, o + n));
    expect([t(0, 4), t(8, 4), t(12, 4), t(36, 4)]).toEqual(['RIFF', 'WAVE', 'fmt ', 'data']);
    expect(w.length).toBe(44 + 8);
    const v = new DataView(w.buffer);
    expect(v.getUint16(22, true)).toBe(1);
    expect(v.getUint32(24, true)).toBe(16000);
    expect(v.getInt16(46, true)).toBe(16383);
  });
});

describe('a reprodução', () => {
  it('sem arquivo do dono no repositório, toca a procedural', () => {
    expect(ARQUIVO_DO_DONO).toBeUndefined();
  });
  it('nada é criado antes do pedido (nem o barramento): sem autoplay', () => {
    expect(E.criados).toBe(0);
    expect(trilhaPesadeloTocando()).toBe(false);
  });
  it('pedir com música ligada: toca em loop no busTrilha, com fade de entrada e o ganho da trilha de combate', async () => {
    pedirTrilhaPesadelo(true, true);
    await tick();
    expect(trilhaPesadeloTocando()).toBe(true);
    const f = E.ctx!.fontes[0];
    expect(f.loop).toBe(true);
    expect(f.buffer.sr).toBe(TAXA_PESADELO);
    expect(E.bus.gain.value).toBe(1);
    const alvo = db2lin(TRIM_TRILHA_POR_CAMADAS_DB[1] + GANHO_MUSICA_DB + OFFSET_MUSICA_EM_COMBATE_DB);
    expect(E.ctx!.ganhos[0].gain.rampas).toEqual([alvo]);
  });
  it('sem música ligada nas Configurações (permitido=false): silêncio e nenhum nó', async () => {
    pedirTrilhaPesadelo(true, false);
    await tick();
    expect(trilhaPesadeloTocando()).toBe(false);
    expect(E.criados).toBe(0);
  });
  it('MUDO: não toca e não cria barramento; dormir cortam e a retomada volta', async () => {
    E.mudo = true;
    pedirTrilhaPesadelo(true, true);
    await tick();
    expect(trilhaPesadeloTocando()).toBe(false);
    expect(E.criados).toBe(0);
    E.mudo = false;
    retomarPesadelo('mudo');
    await tick();
    expect(trilhaPesadeloTocando()).toBe(true);
    pausarPesadelo('sono');
    expect(trilhaPesadeloTocando()).toBe(false);
    retomarPesadelo('sono');
    await tick();
    expect(trilhaPesadeloTocando()).toBe(true);
  });
  it('aba oculta: não começa', async () => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    pedirTrilhaPesadelo(true, true);
    await tick();
    expect(trilhaPesadeloTocando()).toBe(false);
  });
  it('fechar o Pesadelo: sai em fade (rampa a 0) e a voz some; reabrir toca de novo', async () => {
    pedirTrilhaPesadelo(true, true);
    await tick();
    const g = E.ctx!.ganhos[0];
    pedirTrilhaPesadelo(false);
    expect(trilhaPesadeloTocando()).toBe(false);
    expect(g.gain.rampas.at(-1)).toBe(0);
    pedirTrilhaPesadelo(true, true);
    await tick();
    expect(trilhaPesadeloTocando()).toBe(true);
  });
  it('um pedido repetido não empilha vozes', async () => {
    pedirTrilhaPesadelo(true, true);
    pedirTrilhaPesadelo(true, true);
    await tick();
    expect(E.ctx!.fontes.length).toBe(1);
  });
});
