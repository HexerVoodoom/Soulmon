// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import EvoBanner from './EvoBanner';

const ev = (name: string, at: number) => ({ name, pet: 'Sombra', tier: 'champion', branch: 'harmony', at });
const AGORA = 1_000_000_000_000;
const relogio = () => AGORA;
beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('EvoBanner', () => {
  it('sem aviso não ocupa lugar', () => {
    const { container } = render(<EvoBanner language="pt-BR" stage="rookie" playerName="Mateus" petName="Sombra" reducedMotion />);
    expect(container.innerHTML).toBe('');
  });

  it('evolução própria: a frase nasce na hora, em PT e sem bloquear o toque', async () => {
    const { rerender } = render(<EvoBanner language="pt-BR" stage="rookie" playerName="Mateus" petName="Sombra" reducedMotion />);
    rerender(<EvoBanner language="pt-BR" stage="champion-harmony" playerName="Mateus" petName="Sombra" reducedMotion />);
    const b = document.querySelector<HTMLElement>('[data-evo-banner]')!;
    expect(b.textContent).toBe('Mateus acabou de evoluir Sombra para o nível Champion através da Harmonia');
    expect(b.style.pointerEvents).toBe('none');
    expect(b.getAttribute('data-motion')).toBe('reduced');
  });

  it('a hidratação inicial (estágio já alto na carga) não gera aviso', () => {
    const { container } = render(<EvoBanner language="pt-BR" stage="mega-power" playerName="Mateus" petName="Sombra" reducedMotion />);
    expect(container.innerHTML).toBe('');
  });

  it('feed global em EN, fila em ordem; movimento reduzido passa sozinho para o próximo e some no fim', async () => {
    vi.useFakeTimers();
    const fetchFeed = vi.fn(() => Promise.resolve({ events: [ev('Bia', AGORA - 1), ev('Ana', AGORA - 2)] }));
    render(<EvoBanner language="en-US" stage="rookie" playerName="Eu" petName="X" fetchFeed={fetchFeed} reducedMotion now={relogio} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(screen.getByRole('status').textContent).toBe('Ana just evolved Sombra to the Champion level through Harmony');
    await act(async () => { vi.advanceTimersByTime(6100); });
    expect(screen.getByRole('status').textContent).toMatch(/^Bia just evolved/);
    await act(async () => { vi.advanceTimersByTime(6100); });
    expect(document.querySelector('[data-evo-banner]')).toBeNull();
  });

  it('com movimento a frase é uma animação que, ao acabar, chama a próxima', async () => {
    const { rerender } = render(<EvoBanner language="pt-BR" stage="rookie" playerName="A" petName="P" reducedMotion={false} now={relogio} fetchFeed={() => Promise.resolve({ events: [ev('Bia', AGORA - 1)] })} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    rerender(<EvoBanner language="pt-BR" stage="champion-power" playerName="A" petName="P" reducedMotion={false} fetchFeed={undefined} />);
    const run = document.querySelector('.sm2-evo-run')!;
    expect(run.textContent).toMatch(/^Bia/);
  });

  it('feed com lixo e falha de rede não derrubam a tela', async () => {
    const { container } = render(<EvoBanner language="pt-BR" stage="rookie" playerName="A" petName="P" fetchFeed={() => Promise.reject(new Error('x'))} reducedMotion />);
    await act(async () => { await Promise.resolve(); });
    expect(container.innerHTML).toBe('');
  });

  const abrir = async (eventos: ReturnType<typeof ev>[], agora = AGORA) => {
    const r = render(<EvoBanner language="pt-BR" stage="rookie" playerName="Eu" petName="X" reducedMotion now={() => agora} fetchFeed={() => Promise.resolve({ events: eventos })} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    return r;
  };

  it('a faixa não repete na abertura seguinte: o que já entrou na tira fica marcado no aparelho', async () => {
    const eventos = [ev('Bia', AGORA - 1000)];
    const a = await abrir(eventos);
    expect(screen.getByRole('status').textContent).toMatch(/^Bia/);
    a.unmount();
    const b = await abrir(eventos, AGORA + 1000);
    expect(b.container.innerHTML).toBe('');
  });

  it('o que ficou na fila sem passar aparece na próxima abertura; o que passou, não', async () => {
    const eventos = [ev('Ana', AGORA - 2000), ev('Bia', AGORA - 1000)];
    const a = await abrir(eventos);
    expect(screen.getByRole('status').textContent).toMatch(/^Ana/);
    a.unmount();
    await abrir(eventos);
    expect(screen.getByRole('status').textContent).toMatch(/^Bia/);
  });

  it('evento com mais de 1 h não entra', async () => {
    const { container } = await abrir([ev('Bia', AGORA - 60 * 60 * 1000 - 1)]);
    expect(container.innerHTML).toBe('');
  });

  it('a própria evolução no feed não duplica o aviso local', async () => {
    const { container } = await abrir([ev('Eu', AGORA - 1000)]);
    expect(container.innerHTML).toBe('');
  });
});
