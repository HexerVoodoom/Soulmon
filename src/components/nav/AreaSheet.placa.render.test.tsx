// @vitest-environment jsdom
/**
 * Moldura do modal (feedback do dono, 18/11/2026): o NOME de cada lote/folha tem de aparecer NA PLACA do topo (PT-BR e EN), em todas as áreas.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { AreaSheet } from './AreaSheet';
import { mercadoLots, arenaLots, laboratorioLots, hallLots } from '../../utils/areaSheetCopy';
import { exploracaoLots, forjaLots, jogosLots } from '../../utils/playAreaLots';
import type { AreaId } from '../../navigation';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

const AREAS: Array<[AreaId, (l: 'pt-BR' | 'en-US') => Array<{ id: string; label: string }>]> = [
  ['mercado', mercadoLots], ['arena', arenaLots], ['laboratorio', laboratorioLots], ['hall', hallLots],
  ['exploracao', exploracaoLots], ['forja', forjaLots], ['jogos', jogosLots],
];

describe('AreaSheet: título na placa da moldura', () => {
  for (const language of ['pt-BR', 'en-US'] as const) {
    for (const [area, lots] of AREAS) {
      it(`${area} (${language}): todo lote tem nome e ele vai para a placa`, () => {
        for (const lot of lots(language)) {
          expect(lot.label.trim().length, `${area}:${lot.id}`).toBeGreaterThan(0);
          const { container, unmount } = render(<AreaSheet areaId={area} lotId={lot.id} language={language} title={lot.label} closeLabel="x" open onClose={() => {}}>c</AreaSheet>);
          const placa = container.querySelector('[data-moldura-placa] h2');
          expect(placa?.textContent, `${area}:${lot.id}`).toBe(lot.label);
          unmount();
        }
      });
    }
  }
});
