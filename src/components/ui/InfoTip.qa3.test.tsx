// @vitest-environment jsdom
/**
 * QA3 — InfoTip.
 *  1. O tooltip abria SEMPRE abaixo do "?". O "?" da cena de combate mora no pé da tela:
 *     o painel (3–4 linhas) saía da viewport e o texto era cortado. Agora vira para CIMA
 *     quando embaixo não cabe.
 *  2. O painel mora num portal mas é filho React do "?": o `pointerdown` nele subia (árvore
 *     React) até a `TorcidaLayer` e contava como toque de torcida só por LER a dica.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InfoTip } from './InfoTip';
import { TorcidaLayer } from '../games/TorcidaKit';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('InfoTip — QA3', () => {
  it('perto do pé da tela, o painel abre para CIMA (ancorado por `bottom`) e nunca sai da viewport', () => {
    Object.defineProperty(window, 'innerHeight', { value: 640, configurable: true });
    render(<InfoTip language="pt-BR" label="Como torcer">texto longo</InfoTip>);
    const b = screen.getByRole('button', { name: 'Como torcer' });
    b.getBoundingClientRect = () => ({ top: 540, bottom: 584, left: 300, right: 344, width: 44, height: 44, x: 300, y: 540, toJSON() {} }) as DOMRect;
    fireEvent.click(b);
    const panel = screen.getByRole('note') as HTMLElement;
    expect(panel.style.top).toBe('');
    expect(parseFloat(panel.style.bottom)).toBeCloseTo(640 - 540 + 6, 0);
  });

  it('com espaço embaixo continua abrindo embaixo', () => {
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    render(<InfoTip language="pt-BR" label="Ajuda">x</InfoTip>);
    const b = screen.getByRole('button', { name: 'Ajuda' });
    b.getBoundingClientRect = () => ({ top: 100, bottom: 144, left: 20, right: 64, width: 44, height: 44, x: 20, y: 100, toJSON() {} }) as DOMRect;
    fireEvent.click(b);
    const panel = screen.getByRole('note') as HTMLElement;
    expect(parseFloat(panel.style.top)).toBeCloseTo(150, 0);
  });

  it('tocar no painel da dica NÃO conta como toque de torcida', () => {
    const onTap = vi.fn();
    render(<TorcidaLayer onTap={onTap} isPt><InfoTip language="pt-BR" label="Como torcer">dica</InfoTip></TorcidaLayer>);
    fireEvent.click(screen.getByRole('button', { name: 'Como torcer' }));
    fireEvent.pointerDown(screen.getByRole('note'));
    expect(onTap).not.toHaveBeenCalled();
  });
});
