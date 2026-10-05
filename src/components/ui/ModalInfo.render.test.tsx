// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ModalSheet } from '../form/FormKit';
import { ModalInfo } from './InfoTip';

describe('ModalInfo — o "i" mora na linha do título da moldura', () => {
  it('dentro do ModalSheet, entra no encaixe ao lado do título', () => {
    render(
      <ModalSheet open title="Folha" onClose={() => {}} language="pt-BR">
        <p>corpo</p>
        <ModalInfo language="pt-BR" label="Sobre a folha">texto</ModalInfo>
      </ModalSheet>,
    );
    const slot = document.querySelector('[data-modal-info-slot]')!;
    expect(slot.querySelector('button[aria-label="Sobre a folha"]')).toBeTruthy();
    expect(slot.parentElement!.textContent).toContain('Folha');
  });

  it('fora de moldura, cai no lugar onde foi escrito', () => {
    const { container } = render(<div><ModalInfo language="en-US" label="About">t</ModalInfo></div>);
    expect(container.querySelector('button[aria-label="About"]')).toBeTruthy();
  });
});
