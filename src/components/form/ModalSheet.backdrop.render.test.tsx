// @vitest-environment jsdom
/**
 * Padrão de todo modal (pedido do dono, 11/10/2026): tocar FORA da folha fecha.
 * Dono único: `ModalSheet` (FormKit). Opt-out explícito (`dismissOnBackdrop={false}`) só em
 * confirmação destrutiva e formulário com texto digitado — lista em `docs/BETA-AJUSTES-UI.md`.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { ModalSheet } from './FormKit';
import { ConfirmDialog } from '../ConfirmDialog';

const veu = (c: HTMLElement) => document.querySelector('[data-modal-backdrop]') as HTMLElement;
const toque = (el: Element) => { fireEvent.pointerDown(el); fireEvent.click(el); };

describe('ModalSheet — clicar no véu fecha', () => {
  it('toque no véu fecha; toque dentro da folha não', () => {
    const onClose = vi.fn();
    const { container } = renderWithCss(<ModalSheet open title="Folha" onClose={onClose} language="pt-BR"><p>x</p></ModalSheet>);
    toque(document.querySelector('[role="dialog"]')!);
    expect(onClose).not.toHaveBeenCalled();
    toque(veu(container));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('arrastar de dentro da folha e soltar no véu NÃO fecha (seleção de texto)', () => {
    const onClose = vi.fn();
    const { container } = renderWithCss(<ModalSheet open title="Folha" onClose={onClose} language="en-US"><p>x</p></ModalSheet>);
    fireEvent.pointerDown(document.querySelector('[role="dialog"]')!);
    fireEvent.click(veu(container));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('opt-out: dismissOnBackdrop={false} e closeSide="end" (atividade em andamento) não fecham', () => {
    const a = vi.fn(); const b = vi.fn();
    const r1 = renderWithCss(<ModalSheet open title="F" onClose={a} language="pt-BR" dismissOnBackdrop={false}><p>x</p></ModalSheet>);
    toque(veu(r1.container));
    r1.unmount();
    renderWithCss(<ModalSheet open title="F" onClose={b} language="pt-BR" closeSide="end"><p>x</p></ModalSheet>);
    toque(document.querySelector('[data-modal-backdrop]')!);
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });

  it('ConfirmDialog: comum fecha no véu; destrutivo não', () => {
    const a = vi.fn(); const b = vi.fn();
    const r1 = renderWithCss(<ConfirmDialog isOpen onClose={a} onConfirm={() => {}} title="T" message="m" language="pt-BR" />);
    toque(veu(r1.container));
    expect(a).toHaveBeenCalledOnce();
    r1.unmount();
    renderWithCss(<ConfirmDialog isOpen onClose={b} onConfirm={() => {}} title="T" message="m" language="pt-BR" destructive />);
    toque(document.querySelector('[data-modal-backdrop]')!);
    expect(b).not.toHaveBeenCalled();
  });
});
