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
import { AvisosLink } from './AvisosLink';
import { AvisosSheet } from './AvisosSheet';

installDomGlobals();
afterEach(cleanup);

describe('AvisosLink — o selo no canto direito', () => {
  it('sem aviso o botão SOME; com avisos mostra um ponto (sem número) e o nome falado leva a contagem', () => {
    const { container, rerender } = render(<AvisosLink count={0} label="Avisos" countLabel="0 avisos" onClick={() => {}} row={1} />);
    expect(container.innerHTML).toBe('');
    rerender(<AvisosLink count={3} label="Avisos" countLabel="3 avisos" onClick={() => {}} row={2} />);
    const b = screen.getByRole('button', { name: 'Avisos, 3 avisos' });
    expect(b.querySelector('[data-avisos-seal]')).not.toBeNull();
    expect(b.textContent).not.toMatch(/\d/); // nada que cobre: só o ponto
    expect(b.style.position).toBe('fixed');
  });
  it('a linha da pilha acompanha as missões: cada linha (1..3) tem o seu `top`', () => {
    const tops = [1, 2, 3].map(row => {
      const { container, unmount } = render(<AvisosLink count={1} label="A" countLabel="1" onClick={() => {}} row={row as 1 | 2 | 3} />);
      const t = (container.firstElementChild as HTMLElement).style.top;
      unmount();
      return t;
    });
    expect(new Set(tops).size).toBe(3); // uma linha por posição (o jsdom reescreve o calc, então só a distinção é estável)
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
