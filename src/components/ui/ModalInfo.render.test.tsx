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
    // Com a moldura da folha (etapa 3) o encaixe é o ornamento "i" do quadro (`data-moldura-info`); o título é a placa do mesmo quadro.
    const slot = document.querySelector('[data-moldura-info]')!;
    expect(slot.querySelector('button[aria-label="Sobre a folha"]')).toBeTruthy();
    expect(slot.closest('[role="dialog"]')!.querySelector('[data-moldura-placa]')!.textContent).toContain('Folha');
  });

  it('fora de moldura, cai no lugar onde foi escrito', () => {
    const { container } = render(<div><ModalInfo language="en-US" label="About">t</ModalInfo></div>);
    expect(container.querySelector('button[aria-label="About"]')).toBeTruthy();
  });
});
