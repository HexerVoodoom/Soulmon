// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { VescaPotionOffer } from './VescaPotionOffer';

beforeEach(() => { installDomGlobals(); });
afterEach(() => cleanup());

describe('VescaPotionOffer: poção criada', () => {
  it('ao fazer, some o modalzinho e aparece a tela cheia: ícone da poção, luz, texto e OK, sem painel', () => {
    const onMake = vi.fn(() => true);
    const onDismiss = vi.fn();
    render(<VescaPotionOffer language="pt-BR" elementId="fogo" onMake={onMake} onDismiss={onDismiss} />);
    expect(document.querySelector('[data-vesca-offer]')).not.toBeNull();
    fireEvent.click(document.querySelector('[data-vesca-make]')!);
    expect(onMake).toHaveBeenCalledWith('fogo');
    expect(document.querySelector('[data-vesca-offer]')).toBeNull();
    const tela = document.querySelector('[data-pocao-criada]')!;
    expect(tela.getAttribute('aria-modal')).toBe('true');
    expect(tela.querySelector('[data-pocao-art]')).not.toBeNull();
    expect(tela.querySelector('[data-potion-rays]')).not.toBeNull();
    expect(screen.getByText('Poção de fogo criada')).toBeTruthy();
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    const ok = tela.querySelector('[data-vesca-ok]')!;
    // §364: o OK da revelação é o CTA do site, tom de ação, com o rótulo de sempre.
    expect(ok.hasAttribute('data-cta-button')).toBe(true);
    expect(ok.getAttribute('data-cta-tone')).toBe('acao');
    expect(ok.textContent).toBe('OK');
    expect(document.activeElement).toBe(ok);
    fireEvent.click(ok);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
  it('em inglês: "Fire potion created"; Esc fecha', () => {
    const onDismiss = vi.fn();
    render(<VescaPotionOffer language="en-US" elementId="fogo" onMake={() => true} onDismiss={onDismiss} />);
    fireEvent.click(document.querySelector('[data-vesca-make]')!);
    expect(screen.getByText('Fire potion created')).toBeTruthy();
    act(() => { fireEvent.keyDown(document.querySelector('[data-pocao-criada]')!, { key: 'Escape' }); });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
  it('sem saldo (onMake devolve false): nada de "criada"', () => {
    render(<VescaPotionOffer language="pt-BR" elementId="fogo" onMake={() => false} onDismiss={() => {}} />);
    fireEvent.click(document.querySelector('[data-vesca-make]')!);
    expect(document.querySelector('[data-pocao-criada]')).toBeNull();
  });
  it('§316c: popup branco pequeno usa o par PADRÃO do app em linha ("Depois", "Fazer a poção"), sem o CTA do site', () => {
    render(<VescaPotionOffer language="pt-BR" elementId="fogo" onMake={() => false} onDismiss={() => {}} />);
    const make = document.querySelector<HTMLElement>('[data-vesca-make]')!;
    const later = document.querySelector('[data-vesca-later]')!;
    expect(make.hasAttribute('data-cta-button')).toBe(false);
    expect(later.compareDocumentPosition(make) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(make.parentElement!.hasAttribute('data-cta-stack')).toBe(false);
    expect((make.parentElement as HTMLElement).style.display).toBe('flex');
  });
});
