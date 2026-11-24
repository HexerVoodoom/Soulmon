// @vitest-environment jsdom
/** 24/11/2026: os 7 hábitos de Criatividade têm arte própria (`ativ-criatividade-*`) e o catálogo os mostra com <img>. */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { renderWithCss, aquecerRender } from '../../test/renderEnv';
import { CatalogBrowserModal } from './CatalogBrowserModal';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';
import { ACTIVITY_ICON_ART } from '../../assets/soulmon/icones-ui/interacao';

beforeAll(aquecerRender, 60_000);

const IDS = [
  'criatividade-caminhar-sem-fone', 'criatividade-escrita-livre', 'criatividade-tempo-ocioso', 'criatividade-anotar-tres-ideias',
  'criatividade-mudar-de-ambiente', 'criatividade-oficio-manual', 'criatividade-usos-alternativos',
];

describe('Criatividade: ícones dos 7 hábitos', () => {
  it('cada id do catálogo resolve para arte no ACTIVITY_ICON_ART', () => {
    const doCatalogo = ACTIVITY_CATALOG.filter(a => a.category === 'criatividade').map(a => a.id).sort();
    expect(doCatalogo).toEqual([...IDS].sort());
    for (const id of IDS) expect(typeof ACTIVITY_ICON_ART[id], id).toBe('string');
  });
  it('o navegador do catálogo renderiza cada um com <img>', () => {
    const { container } = renderWithCss(
      <CatalogBrowserModal isOpen language="pt-BR" onClose={vi.fn()} onAdd={vi.fn()} onCreateFromScratch={vi.fn()} />,
    );
    for (const id of IDS) expect(container.ownerDocument.querySelector(`img[src="${ACTIVITY_ICON_ART[id]}"]`), id).not.toBeNull();
  });
});
