// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { ModalFrame } from './ModalFrame';
import { InfoTip, ModalInfo } from './InfoTip';
import { ModalSheet } from '../form/FormKit';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

const slotDoModal = () => document.querySelector('[data-moldura-info]') as HTMLElement;

describe('ModalFrame — o "i" é o ornamento da própria arte', () => {
  it('com UMA info: um botão transparente sobre o ornamento, sem ícone próprio, que abre o painel', () => {
    render(
      <ModalFrame title="Arena">
        <p>corpo</p>
        <ModalInfo language="pt-BR" label="Como funciona a Arena">Regras da Arena</ModalInfo>
      </ModalFrame>,
    );
    const slot = slotDoModal();
    const btn = slot.querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Como funciona a Arena');
    expect(btn.type).toBe('button');
    expect(btn.className).toContain('sm2-info-hit');
    expect(btn.hasAttribute('data-info-bare')).toBe(true);
    expect(btn.querySelector('svg, img, span')).toBeNull();
    expect(document.querySelectorAll('[data-info-tip]')).toHaveLength(1);
    expect(btn.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(btn);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    expect(document.querySelector('[data-info-tip-panel]')!.textContent).toBe('Regras da Arena');
    fireEvent.click(btn);
    expect(document.querySelector('[data-info-tip-panel]')).toBeNull();
  });

  it('com DUAS infos: um único botão no canto, um painel com uma seção por info, nenhum "i" solto', () => {
    render(
      <ModalFrame title="Salão">
        <section><InfoTip language="pt-BR" label="Ingressos">Texto dos ingressos</InfoTip></section>
        <footer><InfoTip language="pt-BR" label="Prêmios" align="right">Texto dos prêmios</InfoTip></footer>
      </ModalFrame>,
    );
    expect(document.querySelectorAll('[data-info-tip]')).toHaveLength(1);
    const btn = slotDoModal().querySelector('button') as HTMLButtonElement;
    expect(btn.getAttribute('aria-label')).toBe('Informações');
    fireEvent.click(btn);
    const painel = document.querySelector('[data-info-tip-panel]') as HTMLElement;
    expect(painel.textContent).toContain('Ingressos');
    expect(painel.textContent).toContain('Texto dos ingressos');
    expect(painel.textContent).toContain('Prêmios');
    expect(painel.textContent).toContain('Texto dos prêmios');
    expect(painel.textContent!.indexOf('Ingressos')).toBeLessThan(painel.textContent!.indexOf('Prêmios'));
  });

  it('em inglês o botão agrupado se chama "Info"', () => {
    render(
      <ModalFrame title="Hall">
        <InfoTip language="en-US" label="Tickets">a</InfoTip>
        <InfoTip language="en-US" label="Prizes">b</InfoTip>
      </ModalFrame>,
    );
    expect(screen.getByRole('button', { name: 'Info' })).toBeTruthy();
  });

  it('SEM info não há botão e o encaixe fica vazio (ornamento só decorativo)', () => {
    render(<ModalFrame title="Vazio"><p>corpo</p></ModalFrame>);
    expect(slotDoModal().childElementCount).toBe(0);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('a info que some do conteúdo tira o botão', () => {
    const { rerender } = render(<ModalFrame title="T"><InfoTip language="pt-BR" label="Ajuda">x</InfoTip></ModalFrame>);
    expect(screen.getByRole('button', { name: 'Ajuda' })).toBeTruthy();
    rerender(<ModalFrame title="T"><p>sem info</p></ModalFrame>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('InfoTip com gatilho próprio não é capturado pelo canto', () => {
    render(<ModalFrame title="T"><InfoTip language="pt-BR" label="Origem" trigger={<span>poção</span>}>de onde vem</InfoTip></ModalFrame>);
    expect(slotDoModal().childElementCount).toBe(0);
    expect(screen.getByRole('button', { name: 'Origem' })).toBeTruthy();
  });

  it('fora de moldura o "i" continua sendo o botão com ícone, onde foi escrito', () => {
    const { container } = render(<div><InfoTip language="en-US" label="About">t</InfoTip></div>);
    const btn = container.querySelector('button[aria-label="About"]') as HTMLElement;
    expect(btn.hasAttribute('data-info-bare')).toBe(false);
    expect(btn.querySelector('svg, img, span')).toBeTruthy();
  });

  it('uma sub-folha do miolo com info assume o ornamento e devolve ao fechar', () => {
    function Cena({ sub }: { sub: boolean }) {
      return (
        <ModalFrame title="Pai">
          <InfoTip language="pt-BR" label="Info do pai">pai</InfoTip>
          <ModalSheet open={sub} title="Sub" onClose={() => {}} language="pt-BR" info={{ label: 'Info da folha', content: 'folha' }}>corpo</ModalSheet>
        </ModalFrame>
      );
    }
    const { rerender } = render(<Cena sub={false} />);
    expect(screen.getByRole('button', { name: 'Info do pai' })).toBeTruthy();
    rerender(<Cena sub />);
    expect(screen.queryByRole('button', { name: 'Info do pai' })).toBeNull();
    expect(slotDoModal().querySelector('button')!.getAttribute('aria-label')).toBe('Info da folha');
    expect(document.querySelectorAll('[data-info-tip]')).toHaveLength(1);
    rerender(<Cena sub={false} />);
    expect(screen.getByRole('button', { name: 'Info do pai' })).toBeTruthy();
  });
});
