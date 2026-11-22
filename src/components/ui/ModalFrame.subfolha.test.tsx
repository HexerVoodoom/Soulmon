// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ModalFrame } from './ModalFrame';
import { ModalSheet } from '../form/FormKit';

afterEach(cleanup);
describe('sub-folha dentro da moldura', () => {
  it('abre no miolo do ModalFrame pai, não na tela cheia', () => {
    const { container } = render(<ModalFrame title="Pai"><ModalSheet open title="Filha" language="pt-BR" onClose={() => {}}><p>x</p></ModalSheet></ModalFrame>);
    const slot = container.querySelector('[data-moldura-subfolha]')!;
    expect(slot).toBeTruthy();
    const dialog = screen.getByRole('dialog', { name: 'Filha' });
    expect(slot.contains(dialog)).toBe(true);
    expect(slot.querySelector('[data-modal-backdrop]')?.hasAttribute('data-no-miolo')).toBe(true);
  });
  it('sem moldura pai mantém o véu de tela cheia', () => {
    render(<ModalSheet open title="Solta" language="pt-BR" onClose={() => {}}><p>x</p></ModalSheet>);
    const bd = document.querySelector('[data-modal-backdrop]') as HTMLElement;
    expect(bd.hasAttribute('data-no-miolo')).toBe(false);
    expect(bd.style.position).toBe('fixed');
  });
});
