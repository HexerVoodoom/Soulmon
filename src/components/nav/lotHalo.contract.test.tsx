// @vitest-environment jsdom
/**
 * Contrato do HALO PRETO dos prédios (20/10/2026): TODO lote de TODA área — Mercado, Arena, Laboratório, Hall, Jogos,
 * Exploração — leva o mesmo `filter` (`lotHalo.ts`), trancado ou não; e nenhum outro componente monta sprite de lote
 * por conta própria (o filtro nasce em UM ponto).
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { AreaScene, type AreaLot } from './AreaScene';
import { LOT_HALO_BLACK, lotArtFilter } from './lotHalo';
import { mercadoLots, arenaLots, laboratorioLots, hallLots } from '../../utils/areaSheetCopy';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { MERCADO_LOT_ART, ARENA_LOT_ART, EXPLORACAO_LOT_ART, JOGOS_LOT_ART, LABORATORIO_LOT_ART, HALL_LOT_ART } from '../../assets/soulmon/areas';
import type { AreaId } from '../../navigation';

const AREAS: Array<[AreaId, Array<{ id: string; label: string; left: string; top: string; width?: string; ariaLabel: string }>, Record<string, string>]> = [
  ['mercado', mercadoLots('pt-BR'), MERCADO_LOT_ART],
  ['arena', arenaLots('pt-BR'), ARENA_LOT_ART],
  ['exploracao', exploracaoLots('pt-BR'), EXPLORACAO_LOT_ART],
  ['jogos', jogosLots('pt-BR'), JOGOS_LOT_ART],
  ['laboratorio', laboratorioLots('pt-BR'), LABORATORIO_LOT_ART],
  ['hall', hallLots('pt-BR'), HALL_LOT_ART],
];

describe('halo preto padronizado em todos os prédios', () => {
  for (const trancado of [false, true]) {
    it(`toda a arte de lote das 6 áreas leva o halo preto (${trancado ? 'trancado' : 'aberto'})`, () => {
      for (const [area, lots, arts] of AREAS) {
        const props: AreaLot[] = lots.map(l => ({ ...l, art: arts[l.id], onOpen: () => {}, ...(trancado ? { locked: { minBond: 2 } } : {}) }));
        const { container, unmount } = renderWithCss(<AreaScene areaId={area} language="pt-BR" lots={props} />);
        const imgs = Array.from(container.querySelectorAll<HTMLImageElement>('img[data-area-lot-art]'));
        expect(imgs.length, `${area}: lotes sem arte renderizada`).toBe(lots.length);
        for (const img of imgs) {
          const f = img.style.filter;
          expect(f, `${area}: lote sem o halo preto`).toContain(LOT_HALO_BLACK);
          // poucos filtros: o preto padrão (2) + no máximo o halo claro do Caderno (2) — nunca mais que 4 por sprite
          expect((f.match(/drop-shadow\(/g) ?? []).length).toBeLessThanOrEqual(4);
          if (trancado) expect(f).toContain('grayscale(1)');
          else expect(f).not.toContain('grayscale');
        }
        unmount();
      }
    });
  }

  it('o halo é UM ponto: lotHalo.ts; AreaScene e MapPage o usam e nenhuma string de drop-shadow de lote sobrou lá', () => {
    expect(lotArtFilter()).toBe(LOT_HALO_BLACK);
    expect(lotArtFilter({ locked: true })).toBe(`grayscale(1) brightness(.72) ${LOT_HALO_BLACK}`);
    for (const f of ['AreaScene.tsx', 'MapPage.tsx']) {
      const src = fs.readFileSync(path.resolve(__dirname, f), 'utf8');
      expect(src, f).toContain('lotArtFilter(');
      expect(src, `${f} voltou a montar o filtro à mão`).not.toMatch(/filter:[^\n]*grayscale\(1\)/);
    }
  });

  it('só o AreaScene desenha a arte de um lote (`data-area-lot-art`)', () => {
    const raiz = path.resolve(__dirname, '..');
    const achados: string[] = [];
    const varre = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) varre(p);
        else if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name) && fs.readFileSync(p, 'utf8').includes('data-area-lot-art')) achados.push(e.name);
      }
    };
    varre(raiz);
    expect(achados).toEqual(['AreaScene.tsx']);
  });
});
