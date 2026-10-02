/**
 * H11/H12 (02/10/2026) — a geometria dos lotes no mapa.
 *
 *  · H11: dois lotes de uma área nunca disputam o mesmo toque. A caixa do botão é o
 *    quadrado inteiro do sprite (com alfa), então o prédio grande de baixo roubava o
 *    toque do pé do vizinho — daí o NPC "que alterna" (Quill × Vesca no Laboratório).
 *    O alvo de toque agora é a caixa OPACA + o rótulo, e nenhum par se encosta.
 *  · H12: nenhum prédio fica minúsculo no lote (a torre de Conquistas, alta e estreita,
 *    ocupava ~19% da largura) nem estoura demais a cena. A auditoria cobre as 6 áreas.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import sharp from 'sharp';
import { LOT_ART_BOUNDS, lotHitRects, type Rect } from './areaLotGeometry';
import { mercadoLots, arenaLots, laboratorioLots, hallLots } from './areaSheetCopy';
import { exploracaoLots, jogosLots } from './playAreaLots';
import { MERCADO_LOT_ART, ARENA_LOT_ART, EXPLORACAO_LOT_ART, JOGOS_LOT_ART, LABORATORIO_LOT_ART, HALL_LOT_ART } from '../assets/soulmon/areas';
import type { AreaId } from '../navigation';

type Lot = { id: string; left: string; top: string; width?: string; label: string };
const AREAS: Array<[AreaId, Lot[], Record<string, string>]> = [
  ['mercado', mercadoLots('pt-BR'), MERCADO_LOT_ART],
  ['arena', arenaLots('pt-BR'), ARENA_LOT_ART],
  ['exploracao', exploracaoLots('pt-BR'), EXPLORACAO_LOT_ART],
  ['jogos', jogosLots('pt-BR'), JOGOS_LOT_ART],
  ['laboratorio', laboratorioLots('pt-BR'), LABORATORIO_LOT_ART],
  ['hall', hallLots('pt-BR'), HALL_LOT_ART],
];
const ART_DIR = resolve(__dirname, '../assets/soulmon/areas');
// Telefones modernos (proporção ≥ 2,0) — o fundo é `cover` e os lotes ficam em % da cena.
const VIEWPORTS: Array<[number, number]> = [[360, 740], [360, 780], [390, 844], [393, 873], [412, 915]];

const inter = (a: Rect, b: Rect) => Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > 0 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0;
const pct = (s?: string) => parseFloat(s ?? '38');

describe('geometria dos lotes — alvos de toque nunca se encostam (H11)', () => {
  for (const [w, h] of VIEWPORTS) {
    it(`${w}×${h}: nenhum par de lotes da mesma área compartilha ponto de toque`, () => {
      for (const [area, lots] of AREAS) {
        for (let i = 0; i < lots.length; i++) {
          for (let j = i + 1; j < lots.length; j++) {
            const a = lotHitRects(area, lots[i], w, h);
            const b = lotHitRects(area, lots[j], w, h);
            const bate = a.some(r => b.some(s => inter(r, s)));
            expect(bate, `${area}: ${lots[i].id} × ${lots[j].id} se encostam em ${w}×${h}`).toBe(false);
          }
        }
      }
    });
  }

  it('todo alvo de toque fica dentro da largura da tela (a torre pode passar por cima, nunca pelos lados)', () => {
    for (const [w, h] of VIEWPORTS) {
      for (const [area, lots] of AREAS) {
        for (const l of lots) {
          const [art, label] = lotHitRects(area, l, w, h);
          expect(art.x0, `${area}:${l.id} ${w}×${h}`).toBeGreaterThanOrEqual(-1);
          expect(art.x1, `${area}:${l.id} ${w}×${h}`).toBeLessThanOrEqual(w + 1);
          expect(label.y1, `${area}:${l.id} rótulo abaixo da tela`).toBeLessThanOrEqual(h);
        }
      }
    }
  });
});

describe('geometria dos lotes — tabela de caixas opacas bate com os PNG (fonte da verdade: o alfa)', () => {
  it('cada sprite é 1:1 e a caixa registrada é a medida (alfa > 20)', async () => {
    const todos = AREAS.flatMap(([area, , art]) => Object.entries(art).map(([id, url]) => [`${area}:${id}`, url] as const));
    expect(todos.map(([k]) => k).sort()).toEqual(Object.keys(LOT_ART_BOUNDS).sort());
    const arquivos = new Set(readdirSync(ART_DIR));
    for (const [key, url] of todos) {
      const nome = basename(String(url).split('?')[0]);
      expect(arquivos.has(nome), `${nome} some de assets/soulmon/areas`).toBe(true);
      const { data, info } = await sharp(resolve(ART_DIR, nome)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      expect(info.width, `${key} deixou de ser quadrado`).toBe(info.height);
      let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
      for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 20) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      }
      const medido = [x0 / info.width, y0 / info.height, (x1 + 1) / info.width, (y1 + 1) / info.height];
      LOT_ART_BOUNDS[key].forEach((v, i) => {
        expect(Math.abs(v - medido[i]), `${key}: caixa opaca mudou — use [${medido.map(n => Math.round(n * 1000) / 1000).join(', ')}]`).toBeLessThan(0.006);
      });
    }
  });
});

describe('auditoria de proporção — prédio × caixa do lote (H12)', () => {
  it('o que é OPACO ocupa entre 24% e 70% da largura da cena (nem minúsculo, nem gigante) em todas as áreas', () => {
    for (const [area, lots] of AREAS) {
      for (const l of lots) {
        const b = LOT_ART_BOUNDS[`${area}:${l.id}`];
        const larguraOpaca = pct(l.width) * (b[2] - b[0]);
        expect(larguraOpaca, `${area}:${l.id} ocupa ${larguraOpaca.toFixed(1)}% da largura`).toBeGreaterThanOrEqual(24);
        expect(larguraOpaca, `${area}:${l.id} ocupa ${larguraOpaca.toFixed(1)}% da largura`).toBeLessThanOrEqual(70);
      }
    }
  });

  it('Conquistas (torre) fica ATRÁS e GRANDE no espaço de cima; a Decoração desce para o de baixo (H12 b)', () => {
    const m = Object.fromEntries(mercadoLots('pt-BR').map(l => [l.id, l]));
    expect(pct(m.conquistas.top)).toBeLessThan(pct(m.decoracao.top));
    expect(m.conquistas.left).toBe(m.decoracao.left);
    expect(pct(m.conquistas.width)).toBeGreaterThanOrEqual(60);
    // a base opaca da torre (50% da caixa) ocupa a largura de um lote comum (≥ 30% da cena)
    const b = LOT_ART_BOUNDS['mercado:conquistas'];
    expect(pct(m.conquistas.width) * (b[2] - b[0])).toBeGreaterThanOrEqual(30);
  });

  it('Jogos (H10): os três prédios cresceram acima do molde de 38%', () => {
    for (const l of jogosLots('pt-BR')) expect(pct(l.width), l.id).toBeGreaterThan(38);
  });
});
