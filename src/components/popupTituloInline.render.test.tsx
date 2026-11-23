// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ModalSheet } from './form/FormKit';

/** Variante `titulo="inline"` do popup central: sem placa, ✕ redondo à direita ANTES do título, título completo no DOM (sem truncar), `placa` segue o padrão. */
function popup(titulo?: 'placa' | 'inline', closeSide?: 'start' | 'none') {
  return render(
    <ModalSheet open placement="center" titulo={titulo} closeSide={closeSide} onClose={() => {}} language="en-US" title="Potions for your Soulmon">
      <p>corpo</p>
    </ModalSheet>,
  );
}

describe('popup central: título inline', () => {
  afterEach(cleanup);
  it('inline: ✕ redondo (≥44 via CSS) vem antes do título e o título está inteiro no DOM', () => {
    popup('inline');
    const fechar = screen.getByRole('button', { name: 'Close' });
    const titulo = document.querySelector('[data-popup-titulo]')!;
    expect(fechar.className).toContain('sm2-popup-fechar');
    expect(titulo.textContent).toBe('Potions for your Soulmon');
    expect(fechar.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector('.sm2-moldura-modal--titulo-inline')).not.toBeNull();
    expect(document.querySelector('.sm2-moldura-modal__titulo')).toBeNull();
  });
  it('inline com closeSide none: título sem ✕', () => {
    popup('inline', 'none');
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(document.querySelector('[data-popup-titulo]')).not.toBeNull();
  });
  it('placa (padrão): título na placa, sem a variante inline', () => {
    popup();
    expect(document.querySelector('.sm2-moldura-modal__titulo')?.textContent).toBe('Potions for your Soulmon');
    expect(document.querySelector('[data-popup-titulo]')).toBeNull();
  });
});
