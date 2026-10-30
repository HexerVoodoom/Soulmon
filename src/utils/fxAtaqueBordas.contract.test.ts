// Régua dos PNGs de `assets/soulmon/fx-ataque/` (29/10/2026, relato do dono: o orb de FOGO sai com a cabeça "serrada").
// Duas leituras do mesmo defeito, e a segunda é a que pegou o orb de fogo:
//  (1) BORDA: nenhum pixel opaco (alpha > 20) encosta numa das 4 bordas — corte reto contra a moldura da célula.
//  (2) CORTE INTERNO: a arte foi serrada por uma reta ANTES da margem transparente (a margem está lá, mas a peça já vinha
//      cortada). Detecção: a linha/coluna extrema da arte (alpha > 200) tem um trecho reto contíguo >= `MIN_RUN` px e a
//      mesma coluna 3px para dentro tem trecho ~igual (arte redonda encolhe rápido; corte reto não).
// O que (2) acha NÃO se conserta com código nem com padding: precisa REGERAR a peça. Estão em `PENDENTE_DE_REGERAR`
// (docs/reviews/2026-10-29-fx-cortados.md traz o prompt de cada uma). Peça NOVA no diretório não entra aqui: tem que passar.
//  (3) CACO DE VIZINHA (`strayCuts`) e (4) peça fora do centro/vazia/parcial — ver comentário de `strayCuts`.
// `defended` fica de fora de (2) e (3): o escudo hexagonal tem lado reto POR DESENHO.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

const DIR = join(__dirname, '../assets/soulmon/fx-ataque');
const MIN_RUN = 24;

const longestRun = (v: boolean[]): number => {
  let best = 0;
  let cur = 0;
  for (const x of v) { cur = x ? cur + 1 : 0; if (cur > best) best = cur; }
  return best;
};

type Raw = { data: Uint8Array; width: number; height: number };

/**
 * FRAGMENTO DE VIZINHA (30/10/2026, relato do dono: o ataque corpo a corpo da MORTE saiu com um caco solto a esquerda do
 * crescente). Era a ponta da cabecinha do `orb`, que cruzava a divisa da folha 3x2 e ficou colada na peca do lado. Um caco
 * assim tem area grande (>= 100 px a 128) e um LADO RETO de altura >= 15 (a linha da grade) que se repete 2 px para dentro —
 * entulho de verdade (losango, folha, fagulha) e pequeno e de ponta. Acha qualquer componente (mascara dilatada em 3 px)
 * que nao seja o principal com essa assinatura.
 */
export function strayCuts({ data, width: w, height: h }: Raw): string[] {
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = data[i * 4 + 3] > 24 ? 1 : 0;
  const R = 3;
  const dil = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (solid[y * w + x]) {
    for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
      const yy = y + dy; const xx = x + dx;
      if (yy >= 0 && yy < h && xx >= 0 && xx < w && Math.abs(dy) + Math.abs(dx) <= R) dil[yy * w + xx] = 1;
    }
  }
  const lab = new Int32Array(w * h);
  const comps: number[][] = [];
  for (let i = 0; i < w * h; i++) {
    if (!dil[i] || lab[i]) continue;
    const id = comps.length + 1;
    const pix: number[] = [];
    const st = [i]; lab[i] = id;
    while (st.length) {
      const c = st.pop() as number;
      if (solid[c]) pix.push(c);
      const cx = c % w; const cy = (c - cx) / w;
      for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (dil[j] && !lab[j]) { lab[j] = id; st.push(j); }
      }
    }
    comps.push(pix);
  }
  if (comps.length < 2) return [];
  const main = comps.reduce((b, c, k) => (c.length > comps[b].length ? k : b), 0);
  const out: string[] = [];
  comps.forEach((pix, k) => {
    if (k === main || pix.length < 100) return;
    const set = new Set(pix);
    let minX = w; let maxX = -1;
    for (const p of pix) { const x = p % w; if (x < minX) minX = x; if (x > maxX) maxX = x; }
    const run = (x: number) => { let r = 0; let b = 0; for (let y = 0; y < h; y++) { if (set.has(y * w + x)) { r++; if (r > b) b = r; } else r = 0; } return b; };
    for (const [side, x, xin] of [['L', minX, minX + 2], ['R', maxX, maxX - 2]] as const) {
      const r0 = run(x); const r2 = run(xin);
      if (r0 >= 15 && r2 >= 0.8 * r0) out.push(`${side}${pix.length}/${r0}`);
    }
  });
  return out;
}

async function analyse(file: string) {
  const { data, info } = await sharp(join(DIR, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const al = (x: number, y: number) => data[(y * w + x) * 4 + 3];
  let minX = w, maxX = -1, minY = h, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (al(x, y) > 200) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  const row = (y: number) => Array.from({ length: w }, (_, x) => al(x, y) > 200);
  const col = (x: number) => Array.from({ length: h }, (_, y) => al(x, y) > 200);
  const edge: string[] = [];
  for (let x = 0; x < w; x++) { if (al(x, 0) > 20 && !edge.includes('T')) edge.push('T'); if (al(x, h - 1) > 20 && !edge.includes('B')) edge.push('B'); }
  for (let y = 0; y < h; y++) { if (al(0, y) > 20 && !edge.includes('L')) edge.push('L'); if (al(w - 1, y) > 20 && !edge.includes('R')) edge.push('R'); }
  const flat: string[] = [];
  if (maxX >= 0) {
    const sides: Record<string, (k: number) => boolean[]> = { T: (k) => row(minY + k), B: (k) => row(maxY - k), L: (k) => col(minX + k), R: (k) => col(maxX - k) };
    for (const [n, g] of Object.entries(sides)) {
      const r0 = longestRun(g(0));
      const r3 = longestRun(g(3));
      if (r0 >= MIN_RUN && r3 >= 0.9 * r0 && r3 <= 1.15 * r0 + 2) flat.push(n);
    }
  }
  const stray = /-defended\.png$/.test(file) ? [] : strayCuts({ data, width: w, height: h });
  // centro da caixa da arte (as pecas saem centradas em 128x128) e tamanho: peca vazia/parcial/torta
  const area = Array.from({ length: w * h }, (_, i) => data[i * 4 + 3] > 24).filter(Boolean).length;
  const off = maxX >= 0 ? Math.max(Math.abs((minX + maxX) / 2 - (w - 1) / 2), Math.abs((minY + maxY) / 2 - (h - 1) / 2)) : 99;
  const span = maxX >= 0 ? (Math.max(maxX - minX, maxY - minY) + 1) / w : 0;
  return { edge, flat, stray, area, off, span };
}

/** Peças cortadas aguardando regeração. Vazia desde 29/10/2026: `tools/regerar-fx-cortados.py` refez as 74 a partir das folhas originais (o corte era do fatiador de grade 3x2). */
const PENDENTE_DE_REGERAR = new Set<string>([
]);

/** Conferidas a olho: o detector acusa, a arte está inteira (cabeça redonda que só encosta na coluna 122). */
const FALSO_POSITIVO = new Set<string>(['fx-entropia-orb.png']);

describe('fx-ataque: a régua pega a classe do defeito da MORTE (caco de vizinha)', () => {
  const blob = (w: number, h: number, draw: (set: (x: number, y: number) => void) => void): Raw => {
    const data = new Uint8Array(w * h * 4);
    draw((x, y) => { const i = (y * w + x) * 4; data[i] = 200; data[i + 3] = 255; });
    return { data, width: w, height: h };
  };
  it('acusa caco grande com lado reto fora do corpo; não acusa entulho pequeno de ponta', () => {
    const corpo = (set: (x: number, y: number) => void) => { for (let y = 30; y < 100; y++) for (let x = 60; x < 110; x++) set(x, y); };
    const comCaco = blob(128, 128, (set) => { corpo(set); for (let y = 55; y < 80; y++) for (let x = 12; x < 24; x++) set(x, y); });
    const comEntulho = blob(128, 128, (set) => { corpo(set); for (let y = 60; y < 66; y++) for (let x = 20; x < 26; x++) set(x, y); });
    expect(strayCuts(comCaco).length).toBeGreaterThan(0);
    expect(strayCuts(comEntulho)).toEqual([]);
  });
});

describe('fx-ataque: nenhuma peça cortada', () => {
  it('borda limpa e sem corte reto interno (fora da lista de regeração)', async () => {
    const files = readdirSync(DIR).filter((f) => f.endsWith('.png'));
    expect(files.length).toBeGreaterThan(1000);
    const bad: string[] = [];
    const stillPending: string[] = [];
    for (const f of files) {
      const { edge, flat, stray, area, off, span } = await analyse(f);
      const torta = off > 7 || area < 500 || span < 0.7; // fora do centro, vazia ou parcial
      const cut = edge.length > 0 || (!FALSO_POSITIVO.has(f) && flat.length > 0 && !/-defended\.png$/.test(f)) || stray.length > 0 || torta;
      if (cut) { if (PENDENTE_DE_REGERAR.has(f)) stillPending.push(f); else bad.push(`${f} edge=${edge.join('')} flat=${flat.join('')} stray=${stray.join(',')} off=${off.toFixed(1)} area=${area} span=${span.toFixed(2)}`); }
    }
    expect(bad).toEqual([]);
    // a lista não pode guardar peça que já foi consertada
    expect([...PENDENTE_DE_REGERAR].filter((f) => !stillPending.includes(f))).toEqual([]);
  }, 120_000);
});
