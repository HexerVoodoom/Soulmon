// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { RefugeInviteCard } from './RefugeInviteCard';
import { SupportNote } from './SupportNote';

describe('RefugeInviteCard', () => {
  it('marca exibido ao montar e chama aceitar/dispensar', () => {
    const shown = vi.fn(); const accept = vi.fn(); const dismiss = vi.fn();
    const { container } = renderWithCss(<RefugeInviteCard language="pt-BR" onShown={shown} onAccept={accept} onDismiss={dismiss} />);
    expect(shown).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector('[data-refugio-convite-aceitar]')!);
    fireEvent.click(container.querySelector('[data-refugio-convite-dispensar]')!);
    expect(accept).toHaveBeenCalledTimes(1);
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('nunca cita humor, nunca diagnostica, nunca traz crise nem promete efeito (PT e EN)', () => {
    for (const language of ['pt-BR', 'en-US'] as const) {
      const { container, unmount } = renderWithCss(<RefugeInviteCard language={language} onShown={() => {}} onAccept={() => {}} onDismiss={() => {}} />);
      const t = container.textContent ?? '';
      expect(t).not.toMatch(/humor|mood|triste|sad|percebi|notic|dif[ií]cil|hard day|crise|crisis|188|988|acalma|calm you|melhor|better|ansiedade|anxiety/i);
      unmount();
    }
  });
});

describe('SupportNote', () => {
  it('PT tem o atalho tel:188 e o diretório; EN tem 988/116 123 e o diretório', () => {
    const pt = renderWithCss(<SupportNote isPt data-x />);
    expect(pt.container.querySelector('a[href="tel:188"]')).toBeTruthy();
    expect(pt.container.querySelector('a[href="https://findahelpline.com"]')).toBeTruthy();
    pt.unmount();
    const en = renderWithCss(<SupportNote isPt={false} />);
    expect(en.container.textContent).toMatch(/988/);
    expect(en.container.textContent).toMatch(/116 123/);
    expect(en.container.querySelector('a[href="tel:188"]')).toBeNull();
    expect(en.container.querySelector('a[href="https://findahelpline.com"]')).toBeTruthy();
  });
});
