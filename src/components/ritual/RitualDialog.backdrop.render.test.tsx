// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { RitualDialog } from './RitualKit';

describe('RitualDialog: toque fora fecha só quando pedido (Drive, 01/11/2026)', () => {
  it('closeOnBackdrop: tocar no véu fecha; tocar no cartão não', () => {
    const onClose = vi.fn();
    const { container, getByText } = render(<RitualDialog onClose={onClose} label="x" closeOnBackdrop><p>dentro</p></RitualDialog>);
    fireEvent.click(getByText('dentro'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('[data-ritual-veil]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('sem a opção, tocar no véu não fecha', () => {
    const onClose = vi.fn();
    const { container } = render(<RitualDialog onClose={onClose} label="x"><p>dentro</p></RitualDialog>);
    fireEvent.click(container.querySelector('[data-ritual-veil]') as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });
});
