// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ModalSheet } from './form/FormKit';

/** Popup central: o PADRÃO é o título em TEXTO na mesma linha do ✕ (glifo à direita), sem placa de bronze (dono, 24/11/2026). `titulo="placa"` segue existindo. */
function popup(titulo?: 'placa' | 'inline', closeSide?: 'start' | 'none', onBack?: () => void) {
  return render(
    <ModalSheet open placement="center" titulo={titulo} closeSide={closeSide} onBack={onBack} onClose={() => {}} language="en-US" title="Potions for your Soulmon">
      <p>corpo</p>
    </ModalSheet>,
  );
}

describe('popup central: título inline (padrão)', () => {
  afterEach(cleanup);
  it('padrão: título e ✕ na MESMA linha (título antes, ✕ à direita), sem placa', () => {
    popup();
    const fechar = screen.getByRole('button', { name: 'Close' });
    const titulo = document.querySelector('[data-popup-titulo]')!;
    expect(titulo.textContent).toBe('Potions for your Soulmon');
    expect(fechar.className).toContain('sm2-popup-fechar');
    expect(fechar.parentElement).toBe(titulo.parentElement);
    expect(titulo.compareDocumentPosition(fechar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector('.sm2-moldura-modal--titulo-inline')).not.toBeNull();
    expect(document.querySelector('.sm2-moldura-modal__titulo')).toBeNull();
  });
  it('closeSide none: título sem ✕', () => {
    popup('inline', 'none');
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(document.querySelector('[data-popup-titulo]')).not.toBeNull();
  });
  it('com onBack: seta de voltar à esquerda do título, sem ✕, sem placa', () => {
    popup(undefined, 'start', () => {});
    const titulo = document.querySelector('[data-popup-titulo]')!;
    expect(titulo).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(document.querySelector('.sm2-moldura-modal__titulo')).toBeNull();
    const seta = titulo.parentElement!.querySelector('button')!;
    expect(seta.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('titulo="placa" (opt-in): título na placa, sem a variante inline', () => {
    popup('placa');
    expect(document.querySelector('.sm2-moldura-modal__titulo')?.textContent).toBe('Potions for your Soulmon');
    expect(document.querySelector('[data-popup-titulo]')).toBeNull();
  });
});
