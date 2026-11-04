// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { ChamaGame } from './ChamaGame';
import { CenaSubaquatica } from './CenaSubaquatica';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { CHAMA_BITS } from '../../utils/refugio/chama';

const q = <T extends Element = HTMLElement>(c: Element, s: string) => c.querySelector(s) as T;

function mockReduced(on: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: on && query.includes('reduce'), media: query, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; },
  })) as unknown as typeof window.matchMedia;
}

describe('ChamaGame', () => {
  beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); mockReduced(false); });
  afterEach(() => { vi.useRealTimers(); });

  it('mostra o aviso de segurança na 1ª vez, com modo olhos fechados', () => {
    const { container } = renderWithCss(<ChamaGame language="pt-BR" evolutionStage="rookie" onExit={() => {}} />);
    expect(q(container, '[data-chama-aviso]').textContent).toContain('olhos fechados');
    fireEvent.click(q(container, '[data-chama-aviso-fechados]'));
    expect(q(container, '[data-chama-olhos-fechados]').getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem(STORAGE_KEYS.CHAMA_AVISO)).toBe('1');
  });

  it('concluir paga Bits fixos 1×/dia; a 2ª sessão do dia não paga', () => {
    localStorage.setItem(STORAGE_KEYS.CHAMA_AVISO, '1');
    let t = new Date(2026, 10, 4, 10).getTime();
    const agora = () => t;
    const earn = vi.fn();
    const done = vi.fn();
    const { container } = renderWithCss(<ChamaGame language="en-US" evolutionStage="rookie" onExit={() => {}} onEarnPoints={earn} onComplete={done} agora={agora} />);
    fireEvent.click(q(container, '[data-chama-min="3"]'));
    fireEvent.click(q(container, '[data-chama-start]'));
    t += 30_000; act(() => { vi.advanceTimersByTime(250); });
    expect(q(container, '[data-chama-run]').getAttribute('data-fase')).toBe('olhar');
    // toque duplo = voltei (contagem privada)
    fireEvent.click(q(container, '[data-chama-run]'));
    fireEvent.click(q(container, '[data-chama-run]'));
    t += 3 * 60_000; act(() => { vi.advanceTimersByTime(250); });
    expect(earn).toHaveBeenCalledWith(CHAMA_BITS);
    expect(done).toHaveBeenCalledTimes(1);
    expect(q(container, '[data-chama-voltas]').textContent).toContain('1 time');
    fireEvent.click(Array.from(container.querySelectorAll('button')).find(b => b.textContent === 'Again')!);
    fireEvent.click(q(container, '[data-chama-start]'));
    t += 4 * 60_000; act(() => { vi.advanceTimersByTime(250); });
    expect(earn).toHaveBeenCalledTimes(1);
    expect(q(container, '[data-chama-bits]')).toBeNull();
  });

  it('sair no meio não paga nem pune', () => {
    localStorage.setItem(STORAGE_KEYS.CHAMA_AVISO, '1');
    const earn = vi.fn();
    const { container } = renderWithCss(<ChamaGame language="pt-BR" evolutionStage="rookie" onExit={() => {}} onEarnPoints={earn} />);
    fireEvent.click(q(container, '[data-chama-start]'));
    fireEvent.click(q(container, '[data-chama-sair]'));
    expect(earn).not.toHaveBeenCalled();
    expect(q(container, '[data-chama-done]').textContent).toContain('A chama espera');
  });

  it('movimento reduzido: chama parada', () => {
    mockReduced(true);
    localStorage.setItem(STORAGE_KEYS.CHAMA_AVISO, '1');
    const { container } = renderWithCss(<ChamaGame language="pt-BR" evolutionStage="rookie" onExit={() => {}} />);
    const chama = q(container, '[data-chama-viva]');
    expect(chama.hasAttribute('data-reduced')).toBe(true);
    expect(chama.innerHTML).not.toMatch(/animation/);
  });

  it('a oscilação da chama é lenta (sem flash: WCAG 2.3.1)', () => {
    const src = readFileSync(resolve(__dirname, './ChamaGame.tsx'), 'utf8');
    const durs = [...src.matchAll(/sm-chama-\w+ ([\d.]+)s/g)].map(m => Number(m[1]));
    expect(durs.length).toBeGreaterThan(0);
    for (const d of durs) expect(d).toBeGreaterThanOrEqual(2);
  });
});

describe('Cena subaquática da Respiração', () => {
  it('movimento reduzido: sem bolhas nem animação', () => {
    const { container } = renderWithCss(<CenaSubaquatica level={0.5} reduced />);
    expect(q(container, '[data-camada="bolhas"]')).toBeNull();
    expect(q(container, '[data-cena-subaquatica]').innerHTML).not.toMatch(/animation:/);
  });
  it('sem arte pintada, entram as camadas procedurais', () => {
    const { container } = renderWithCss(<CenaSubaquatica level={0} reduced={false} />);
    expect(q(container, '[data-camada="fundo"]')).toBeTruthy();
    expect(q(container, '[data-camada="meio"]')).toBeTruthy();
    expect(q(container, '[data-camada="frente"]')).toBeTruthy();
    expect(q(container, '[data-camada="bolhas"]')).toBeTruthy();
  });
});
