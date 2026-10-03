// @vitest-environment jsdom
/**
 * I2/I3 (02/10/2026) — o contêiner-base dos modais de BASE:
 *  1. o FECHAR mora no canto superior ESQUERDO, ANTES do título (mesma peça do
 *     voltar, ícone `close`); `closeSide="end"` leva o X para a direita;
 *  2. `onBack` troca o fechar pela seta de voltar;
 *  3. a folha entra SUBINDO (classes `sm2-sheet-rise`/`sm2-sheet-fade`) e o
 *     bloco canônico de movimento reduzido do `index.css` as desliga.
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { ModalSheet } from './FormKit';
import { RitualDialog } from '../ritual/RitualKit';

describe('ModalSheet — voltar/fechar e entrada', () => {
  it('fechar à ESQUERDA, antes do título, dentro de [data-back-arrow]', () => {
    const onClose = vi.fn();
    renderWithCss(<ModalSheet open title="Folha" onClose={onClose} language="pt-BR"><p>x</p></ModalSheet>);
    const fechar = screen.getByRole('button', { name: 'Fechar' });
    expect(fechar.closest('[data-back-arrow]')).toBeTruthy();
    const titulo = screen.getByText('Folha');
    expect(fechar.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(fechar);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closeSide="end" mantém o X à direita (fora do BackArrow)', () => {
    renderWithCss(<ModalSheet open title="Folha" onClose={() => {}} language="en-US" closeSide="end"><p>x</p></ModalSheet>);
    const fechar = screen.getByRole('button', { name: 'Close' });
    expect(fechar.closest('[data-back-arrow]')).toBeNull();
  });

  it('onBack vira a seta de voltar', () => {
    const onBack = vi.fn();
    const onClose = vi.fn();
    renderWithCss(<ModalSheet open title="Folha" onClose={onClose} onBack={onBack} language="pt-BR"><p>x</p></ModalSheet>);
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect(onBack).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('a folha e o véu levam as classes de entrada', () => {
    renderWithCss(<ModalSheet open title="Folha" onClose={() => {}} language="pt-BR"><p>x</p></ModalSheet>);
    const dialog = screen.getByRole('dialog');
    expect(dialog.classList.contains('sm2-sheet-rise')).toBe(true);
    expect(dialog.parentElement!.classList.contains('sm2-sheet-fade')).toBe(true);
  });

  it('o bloco canônico de movimento reduzido (o ÚLTIMO) desliga as duas animações', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const ultimo = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(ultimo).toMatch(/\.sm2-sheet-rise,\s*\.sm2-sheet-fade\s*\{\s*animation:\s*none\s*!important/);
  });
});

describe('RitualDialog — fechar', () => {
  it('padrão: à ESQUERDA, em [data-back-arrow]; closeSide="end": à direita', () => {
    const a = renderWithCss(<RitualDialog label="A" onClose={() => {}} closeLabel="Fechar"><h2>t</h2></RitualDialog>);
    expect(screen.getByRole('button', { name: 'Fechar' }).closest('[data-back-arrow]')).toBeTruthy();
    a.unmount();
    renderWithCss(<RitualDialog label="B" onClose={() => {}} closeLabel="Fechar" closeSide="end"><h2>t</h2></RitualDialog>);
    expect(screen.getByRole('button', { name: 'Fechar' }).closest('[data-back-arrow]')).toBeNull();
  });
});
