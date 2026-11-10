// Caso real do dono (forma ultimate-power@sabbat): runas violetas apagadas pelo recorte viraram BURACOS; o avaliador disse "sem problema".
// Fixture anonimizada: so a silhueta (alfa) do sprite real em 160x160, cor chapada. Sem chamada externa.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import { encodePng } from './_png.js';
import { medirBuracosInternos, HOLE_REJECT_FRACTION } from './_chroma.js';
import {
  sanitizeReportBody, createReport, evaluateReport, readReport, saveReport, STATUS, EVAL_VERSION, userView, compositeOnChecker, buildClaudeRequest,
} from './_spriteReview.js';
import { decodePng } from './_png.js';

const FIXTURE = new Uint8Array(fs.readFileSync(new URL('../../src/test/fixtures/sabbat-buracos-160.png', import.meta.url)));
const SAVE = 'abcdefgh12345678abcdefgh';
const FORM = 'ultimate-power@sabbat';
const TOK = 'a'.repeat(32);
const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

function kvFake(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store, get: async k => (store.has(k) ? store.get(k) : null),
    getWithMetadata: async k => ({ value: store.has(k) ? store.get(k) : null, metadata: null }),
    put: async (k, v) => { store.set(k, v); }, delete: async k => { store.delete(k); },
    list: async ({ prefix = '' } = {}) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const solido = () => { // criatura sem buracos: quadrado opaco
  const w = 160, d = new Uint8Array(w * w * 4);
  for (let y = 30; y < 130; y++) for (let x = 30; x < 130; x++) { const p = (y * w + x) * 4; d[p] = 120; d[p + 1] = 40; d[p + 2] = 160; d[p + 3] = 255; }
  return encodePng(w, w, d);
};
const corpo = { id: SAVE, formId: FORM, spriteUrl: `https://x.test/api/sprite-image?k=${TOK}`, soulmonId: 's1', stage: 'ultimate', element: 'sabbat', note: '' };
const env = (png) => ({ SOULMON_SAVES: kvFake({ [`sprite:blob:${TOK}`]: ab(png) }), ANTHROPIC_API_KEY: 'k' });

describe('medicao deterministica de buracos internos', () => {
  it('o caso real do Saba passa MUITO do limiar; sprite sem buracos fica em zero', () => {
    const real = medirBuracosInternos(FIXTURE);
    expect(real.reprovado).toBe(true);
    expect(real.holeFraction).toBeGreaterThan(HOLE_REJECT_FRACTION * 3);
    expect(real.components).toBeGreaterThan(5);
    const limpo = medirBuracosInternos(solido());
    expect(limpo.holeFraction).toBe(0);
    expect(limpo.reprovado).toBe(false);
  });
  it('furo cercado (flood-fill) e entalhe estreito (fecho morfologico) contam; vao grande ligado ao exterior nao', () => {
    const w = 160, d = new Uint8Array(w * w * 4);
    for (let y = 20; y < 140; y++) for (let x = 20; x < 140; x++) d.set([100, 100, 100, 255], (y * w + x) * 4);
    for (let y = 60; y < 90; y++) for (let x = 60; x < 90; x++) d[(y * w + x) * 4 + 3] = 0; // furo 30x30 cercado
    expect(medirBuracosInternos(encodePng(w, w, d)).reprovado).toBe(true);
    const e = new Uint8Array(w * w * 4);
    for (let y = 20; y < 140; y++) for (let x = 20; x < 140; x++) e.set([100, 100, 100, 255], (y * w + x) * 4);
    for (let y = 20; y < 100; y++) for (let x = 70; x < 90; x++) e[(y * w + x) * 4 + 3] = 0; // baia larga aberta (perna/vao)
    expect(medirBuracosInternos(encodePng(w, w, e)).reprovado).toBe(false);
  });
});

describe('revisao: buracos forcam regenerar antes do Claude', () => {
  it('veredito "nada" do Claude NAO vale: a medicao forca regenerar, e o Claude nem e chamado', async () => {
    const e = env(FIXTURE);
    const { report } = await createReport(e, sanitizeReportBody(corpo));
    const f = vi.fn(async () => Response.json({ content: [{ type: 'text', text: '{"problema":"nenhum","detalhe":"ok","acao":"nada","fundoResidual":"none"}' }] }));
    const r = await evaluateReport(e, report.id, { fetch: f });
    expect(f).not.toHaveBeenCalled();
    expect(r.status).toBe(STATUS.REGENERAR);
    expect(r.verdict.acao).toBe('regenerar');
    expect(r.method).toBe('medicao');
    expect(r.evalVersion).toBe(EVAL_VERSION);
  });
  it('sem buracos, segue para o Claude (que enxerga a imagem sobre xadrez)', async () => {
    const e = env(solido());
    const { report } = await createReport(e, sanitizeReportBody(corpo));
    const f = vi.fn(async () => Response.json({ content: [{ type: 'text', text: '{"problema":"nenhum","detalhe":"ok","acao":"nada","fundoResidual":"none"}' }] }));
    const r = await evaluateReport(e, report.id, { fetch: f });
    expect(f).toHaveBeenCalledTimes(1);
    expect(r.status).toBe(STATUS.SEM_PROBLEMA);
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.system).toMatch(/INSIDE the silhouette/);
  });
  it('compositeOnChecker mostra o xadrez no buraco (alfa 0 vira laranja/branco, nao cinza)', () => {
    const o = decodePng(compositeOnChecker(FIXTURE));
    const cores = new Set();
    for (let i = 0; i < o.data.length; i += 4) cores.add(`${o.data[i]},${o.data[i + 1]},${o.data[i + 2]}`);
    expect(cores.has('255,140,0') && cores.has('255,255,255')).toBe(true);
    expect(buildClaudeRequest('x', { stage: 's' }).system).toContain('checkerboard');
  });
});

describe('cooldown e versao do avaliador', () => {
  async function comUltimoPedido(status, evalVersion) {
    const e = env(solido());
    const t0 = 1_000_000;
    const { report } = await createReport(e, sanitizeReportBody(corpo), t0);
    const r = await readReport(e, report.id, t0);
    r.status = status; if (evalVersion === undefined) delete r.evalVersion; else r.evalVersion = evalVersion;
    await saveReport(e, r, t0);
    // o pedido aberto sai do caminho (final)
    return { e, r, t1: t0 + 3600_000 };
  }
  it('sem-problema de avaliador ANTIGO (sem evalVersion): o cooldown de 24h nao vale', async () => {
    const { e, r, t1 } = await comUltimoPedido(STATUS.SEM_PROBLEMA, undefined);
    expect(userView(r).cooldownUntil).toBe(0);
    const novo = await createReport(e, sanitizeReportBody(corpo), t1);
    expect(novo.ok).toBe(true);
  });
  it('falhou de avaliador antigo tambem libera; sem-problema da versao ATUAL continua em cooldown', async () => {
    const a = await comUltimoPedido(STATUS.FALHOU, 1);
    expect((await createReport(a.e, sanitizeReportBody(corpo), a.t1)).ok).toBe(true);
    const b = await comUltimoPedido(STATUS.SEM_PROBLEMA, EVAL_VERSION);
    const r = await createReport(b.e, sanitizeReportBody(corpo), b.t1);
    expect(r.ok).toBe(false);
    expect(r.error).toBe('review-cooldown');
  });
});
