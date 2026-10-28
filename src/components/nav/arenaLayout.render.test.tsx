// @vitest-environment jsdom
/**
 * 26/10/2026 (dono): a ARENA com os prédios juntos (3 desde #186), como no desenho dele. O toque de cada prédio abre a folha certa, e o miolo de
 * toque (`LOT_HIT_INSET`) é o que o botão real expõe — o mesmo que `lotHitRects` mede no contrato H11.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AreaScene } from './AreaScene';
import { arenaLots } from '../../utils/areaSheetCopy';
import { lotHitBounds, lotLabelOffset } from '../../utils/areaLotGeometry';

describe('AreaScene — Arena', () => {
  it('tocar no miolo de cada prédio abre o lote certo; o miolo e o rótulo seguem a geometria do contrato', () => {
    const opened: string[] = [];
    const lots = arenaLots('pt-BR').map(l => ({ id: l.id, label: l.label, left: l.left, top: l.top, width: l.width, ariaLabel: l.ariaLabel, art: 'x.png', onOpen: () => { opened.push(l.id); } }));
    const r = render(<AreaScene areaId="arena" language="pt-BR" lots={lots} />);
    expect(lots.map(l => l.id).sort()).toEqual(['duelo', 'guerra', 'torneio']); // #186: a Fenda Sem Fim voltou para a Exploração);
    for (const l of lots) {
      const btn = r.container.querySelector(`[data-area-lot="${l.id}"]`) as HTMLElement;
      const hit = btn.querySelector('[data-area-lot-hit]') as HTMLElement;
      const b = lotHitBounds('arena', l.id);
      expect(parseFloat(hit.style.left)).toBeCloseTo(b[0] * 100, 3);
      expect(parseFloat(hit.style.width)).toBeCloseTo((b[2] - b[0]) * 100, 3);
      const lab = btn.querySelector('[data-area-lot-label]') as HTMLElement;
      expect(parseFloat(lab.style.left)).toBe(lotLabelOffset('arena', l.id)[0]);
      expect(parseFloat(lab.style.top)).toBe(lotLabelOffset('arena', l.id)[1]);
      fireEvent.click(hit);
    }
    expect(opened).toEqual(lots.map(l => l.id));
    const z = (id: string) => Number((r.container.querySelector(`[data-area-lot="${id}"]`) as HTMLElement).style.zIndex);
    expect(z('duelo')).toBeGreaterThan(Math.max(z('torneio'), z('guerra'))); // a Arena livre fica na FRENTE
    vi.restoreAllMocks();
  });
});
