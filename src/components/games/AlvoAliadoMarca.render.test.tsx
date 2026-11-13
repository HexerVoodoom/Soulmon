// @vitest-environment jsdom
/** §327: a marca de ALVO ALIADO — botão acessível, losango turquesa só quando a mira de apoio está nele, toque alterna. */
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { useState } from 'react';
import { AlvoAliadoMarca } from './AlvoAliadoMarca';
import { MIRA_VAZIA, tocarAliado, tocarInimigo, type Mira } from '../../utils/combate/alvoAliado';

afterEach(() => cleanup());

function Cena({ family }: { family: 'shield' | 'direct' }) {
  const [m, setM] = useState<Mira>(MIRA_VAZIA);
  return (
    <div>
      <button type="button" data-inimigo onClick={() => setM((x) => tocarInimigo(x, [1, 1], 1))}>inimigo</button>
      <AlvoAliadoMarca x={100} y={100} size={20} name="Maré" on={m.aliado === 0} isPt reduced onPick={() => setM((x) => tocarAliado(x, [1], 0, family))} />
      <output data-mira>{`${m.inimigo}/${m.aliado}`}</output>
    </div>
  );
}

describe('AlvoAliadoMarca', () => {
  it('rótulo, alvo de toque mínimo e marca só quando ligada', () => {
    render(<Cena family="shield" />);
    const b = screen.getByRole('button', { name: 'Apoiar Maré' });
    expect(b.getAttribute('aria-pressed')).toBe('false');
    expect(parseInt(b.style.width, 10)).toBeGreaterThanOrEqual(44);
    expect(b.querySelector('[data-stage-ally-mark]')).toBeNull();
    fireEvent.click(b);
    expect(b.getAttribute('aria-pressed')).toBe('true');
    const mark = b.querySelector('[data-stage-ally-mark]') as HTMLElement;
    expect(mark.style.border).toContain('var(--sm2-primary-fill)');
    expect(mark.style.animation).toBe(''); // movimento reduzido: sem pulso
  });

  it('tocar inimigo apaga a mira do aliado, e tocar aliado apaga a do inimigo', () => {
    const { container } = render(<Cena family="shield" />);
    const mira = () => container.querySelector('[data-mira]')!.textContent;
    fireEvent.click(screen.getByText('inimigo'));
    expect(mira()).toBe('1/null');
    fireEvent.click(screen.getByRole('button', { name: 'Apoiar Maré' }));
    expect(mira()).toBe('null/0');
    fireEvent.click(screen.getByText('inimigo'));
    expect(mira()).toBe('1/null');
  });

  it('especial ofensivo não liga a mira de aliado', () => {
    render(<Cena family="direct" />);
    const b = screen.getByRole('button', { name: 'Apoiar Maré' });
    fireEvent.click(b);
    expect(b.getAttribute('aria-pressed')).toBe('false');
  });
});
