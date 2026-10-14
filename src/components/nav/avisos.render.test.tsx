// @vitest-environment jsdom
/**
 * F3 (design-critic beta-2, 13/10/2026): os avisos do dia NÃO ocupam a faixa acima de "HOJE". Viram um SELO (ponto) no botão da coluna direita
 * e moram numa folha (`ModalSheet`); o check-in da janela entra pelo mesmo canal.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { installDomGlobals } from '../../test/renderEnv';
import { AvisosLink, AVISOS_LINK_ENABLED } from './AvisosLink';
import { AvisosSheet } from './AvisosSheet';

installDomGlobals();
afterEach(cleanup);

describe('AvisosLink — OCULTO por completo (dono, 14/10/2026, REGISTRO §54)', () => {
  // Reescrito: os dois testes antigos exigiam o selo e a linha da pilha do botão, que agora não existe na tela (`AVISOS_LINK_ENABLED = false`).
  it('o botão não renderiza nada, com ou sem avisos; o código fica e a flag religa', () => {
    expect(AVISOS_LINK_ENABLED).toBe(false);
    const { container, rerender } = render(<AvisosLink count={0} label="Avisos" countLabel="0 avisos" onClick={() => {}} row={1} />);
    expect(container.innerHTML).toBe('');
    rerender(<AvisosLink count={3} label="Avisos" countLabel="3 avisos" onClick={() => {}} row={2} />);
    expect(container.innerHTML).toBe('');
    expect(screen.queryByRole('button', { name: /Avisos/ })).toBeNull();
  });
});

describe('AvisosSheet — a folha', () => {
  const itens = [{ key: 'hp', node: <p>Pouco fôlego</p> }, { key: 'checkin', node: <button type="button">Check-ins do dia</button> }];
  it('é um bottom sheet (ModalSheet) com os avisos na ordem da fila', () => {
    render(<AvisosSheet open language="pt-BR" items={itens} onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Avisos' })).toBeTruthy();
    expect([...document.querySelectorAll('[data-aviso]')].map(e => e.getAttribute('data-aviso'))).toEqual(['hp', 'checkin']);
    expect(document.querySelector('[data-modal-backdrop]')).not.toBeNull();
  });
  it('EN: título "Notices"; fechada não renderiza nada', () => {
    const { rerender } = render(<AvisosSheet open language="en-US" items={itens} onClose={() => {}} />);
    expect(screen.getByRole('dialog', { name: 'Notices' })).toBeTruthy();
    rerender(<AvisosSheet open={false} language="en-US" items={itens} onClose={() => {}} />);
    expect(document.querySelector('[data-avisos-sheet]')).toBeNull();
  });
  it('quando o último aviso some (resgate, "Ok") a folha se fecha sozinha — nunca fica uma folha vazia', () => {
    const onClose = vi.fn();
    const { rerender } = render(<AvisosSheet open language="en-US" items={itens} onClose={onClose} />);
    expect(onClose).not.toHaveBeenCalled();
    rerender(<AvisosSheet open language="en-US" items={[]} onClose={onClose} />);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-avisos-sheet]')).toBeNull();
  });
  it('o ✕ fecha', () => {
    const onClose = vi.fn();
    render(<AvisosSheet open language="en-US" items={itens} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('contrato da Home (App.tsx) — altura zero acima de HOJE', () => {
  const app = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
  it('a fila de avisos não renderiza mais o slot (`sm2-notice-slot`) nem a linha "+N" na lista; entra no botão e na folha', () => {
    expect(app).not.toContain('className="sm2-notice-slot"');
    expect(app).not.toContain('className="sm2-notice-more"\n                          aria-expanded');
    expect(app).toContain('<AvisosLink');
    expect(app).toContain('<AvisosSheet');
    // o check-in entra pelo mesmo canal: o item da fila fecha a folha dos avisos e abre a dos check-ins
    expect(app).toMatch(/data-checkin-open[^\n]*setAvisosAbertos\(false\); setCheckInsAbertos\(true\)/);
  });
});
