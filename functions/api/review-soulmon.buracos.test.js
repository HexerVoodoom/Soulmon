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

const CORRETO = new Uint8Array(fs.readFileSync(new URL('../../src/test/fixtures/sabbat-recorte-correto-160.png', import.meta.url)));
const quadrado = (w, lado) => { const d = new Uint8Array(w * w * 4); const o = (w - lado) >> 1; for (let y = o; y < o + lado; y++) for (let x = o; x < o + lado; x++) d.set([100, 100, 100, 255], (y * w + x) * 4); return d; };

describe('medicao deterministica de buracos internos (poeira de furos pequenos)', () => {
  it('o caso real do Saba (runas comidas) reprova; sprite sem buracos fica em zero', () => {
    const real = medirBuracosInternos(FIXTURE);
    expect(real.reprovado).toBe(true);
    expect(real.holeFraction).toBeGreaterThan(HOLE_REJECT_FRACTION);
    expect(real.components).toBeGreaterThan(20);
    const limpo = medirBuracosInternos(solido());
    expect(limpo.holeFraction).toBe(0);
    expect(limpo.reprovado).toBe(false);
  });
  it('o MESMO sprite recortado certo (arejado, com vaos enclausurados grandes) NAO reprova: nao forca regenerar', () => {
    const ok = medirBuracosInternos(CORRETO);
    expect(ok.reprovado).toBe(false);
    expect(ok.holeFraction).toBeLessThan(HOLE_REJECT_FRACTION / 1.5);
    expect(ok.components).toBeLessThan(15);
  });
  it('poeira de furos pequenos cercados reprova; um vao grande cercado (ou aberto ao exterior) nao', () => {
    const w = 160;
    const poeira = quadrado(w, 120);
    for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 6; gx++) for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) poeira[((30 + gy * 18 + y) * w + 30 + gx * 18 + x) * 4 + 3] = 0; // 36 furos de 3x3 (2,25% da silhueta, cada um < 0,2%)
    const rp = medirBuracosInternos(encodePng(w, w, poeira));
    expect(rp.reprovado).toBe(true);
    expect(rp.components).toBe(36);
    const furoGrande = quadrado(w, 120);
    for (let y = 60; y < 90; y++) for (let x = 60; x < 90; x++) furoGrande[(y * w + x) * 4 + 3] = 0; // furo 30x30 cercado = vao legitimo
    expect(medirBuracosInternos(encodePng(w, w, furoGrande)).reprovado).toBe(false);
    const baia = quadrado(w, 120);
    for (let y = 20; y < 100; y++) for (let x = 70; x < 90; x++) baia[(y * w + x) * 4 + 3] = 0; // baia aberta
    expect(medirBuracosInternos(encodePng(w, w, baia)).reprovado).toBe(false);
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
