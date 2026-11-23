// @vitest-environment jsdom
/**
 * 26/10/2026 (dono): a ARENA com os prédios juntos (3 desde #186), como no desenho dele. O toque de cada prédio abre a folha certa, e o miolo de
 * toque (`LOT_HIT_INSET`) é o que o botão real expõe — o mesmo que `lotHitRects` mede no contrato H11.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { AreaScene } from './AreaScene';
import { arenaLots } from '../../utils/areaSheetCopy';
import { lotPintado } from '../../utils/areaLotGeometry';

describe('AreaScene — Arena', () => {
  it('tocar em cada prédio pintado abre o lote certo; o alvo segue LOT_PINTADO e não há sprite', () => {
    const opened: string[] = [];
    const lots = arenaLots('pt-BR').map(l => ({ id: l.id, label: l.label, left: l.left, top: l.top, width: l.width, ariaLabel: l.ariaLabel, art: 'x.png', onOpen: () => { opened.push(l.id); } }));
    const r = render(<AreaScene areaId="arena" language="pt-BR" lots={lots} />);
    expect(lots.map(l => l.id).sort()).toEqual(['duelo', 'guerra', 'torneio']); // #186: a Fenda Sem Fim voltou para a Exploração);
    for (const l of lots) {
      const btn = r.container.querySelector(`[data-area-lot="${l.id}"]`) as HTMLElement;
      const b = lotPintado('arena', l.id)!;
      expect(parseFloat(btn.style.left)).toBeCloseTo(b[0], 3);
      expect(parseFloat(btn.style.width)).toBeCloseTo(b[2] - b[0], 3);
      expect(btn.querySelector('[data-area-lot-art]')).toBeNull();
      expect(btn.querySelector('[data-area-lot-label]')).toBeTruthy();
      fireEvent.click(btn);
    }
    expect(opened).toEqual(lots.map(l => l.id));
    vi.restoreAllMocks();
  });
});
