// @vitest-environment jsdom
/**
 * LEVEL UP (11/10/2026) — o display que escurece a tela e SÓ SAI AO TOQUE.
 * As travas: abre e escurece, não some sozinho, o toque fecha (e o toque "no ar" do gesto que causou a
 * subida não), vários níveis viram "Lv A → Lv B" com o final grande, mostra o que ganhou, movimento
 * reduzido reduz o movimento e NUNCA a pausa, e o som obedece à D11 (visível + áudio já liberado).
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';

const som = vi.hoisted(() => ({ playLevelUp: vi.fn(), estado: 'running' as string | null }));
vi.mock('../utils/sounds', () => ({ playLevelUp: som.playLevelUp }));
vi.mock('../utils/audioBus', () => ({
  barramentoAtual: () => (som.estado ? { ctx: { state: som.estado } } : null),
}));

import { LevelUpOverlay, ARM_MS } from './LevelUpOverlay';

const evt = { from: 4, to: 5 };
const base = { event: evt, language: 'en-US' as const, spriteUrl: '/pet.png' };

function reducao(on: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: on && /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  }));
}

beforeEach(() => { vi.useFakeTimers(); som.playLevelUp.mockClear(); som.estado = 'running'; reducao(false); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('LevelUpOverlay — abre e escurece', () => {
  it('é um DIÁLOGO modal com nome, acima da fila (z 300) e com o fundo escurecido', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    const dlg = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg).not.toBeNull();
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(container.querySelector(`#${dlg.getAttribute('aria-labelledby')}`)?.textContent).toBe('Bond level 5');
    expect(Number(dlg.style.zIndex)).toBe(300);
    expect(dlg.style.position).toBe('fixed');
    // rgba(2,10,12,.88): bem mais denso que o scrim dos rituais (.55)
    const alfa = Number(/,\s*([\d.]+)\)/.exec(dlg.style.background)?.[1]);
    expect(alfa).toBeGreaterThanOrEqual(0.8);
  });

  it('mostra o número do nível grande e o texto de saída ("Tap to continue" / "Toque para continuar")', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(container.querySelector('[data-lvup-number]')?.textContent).toBe('4'); // sobe de 4…
    act(() => { vi.advanceTimersByTime(1000); });
    expect(container.querySelector('[data-lvup-number]')?.textContent).toBe('5'); // …até 5
    expect(screen.getByText('Tap to continue')).toBeTruthy();
  });

  it('PT-BR: "Toque para continuar"', () => {
    renderWithCss(<LevelUpOverlay {...base} language="pt-BR" onDone={() => {}} />);
    expect(screen.getByText('Toque para continuar')).toBeTruthy();
    // 7.2: o texto redundante saiu (o número já diz que o vínculo cresceu).
    expect(screen.queryByText('Seu vínculo cresceu.')).toBeNull();
  });

  it('o pet aparece em destaque', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(container.querySelector('[data-lvup-pet]')?.getAttribute('src')).toBe('/pet.png');
  });

  it('com a arte do banner instalada (28/10/2026): a imagem substitui o texto procedural', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(container.querySelector('[data-lvup-banner]')?.getAttribute('src')).toBeTruthy();
    expect(container.querySelector('[data-lvup-banner-text]')).toBeNull();
  });
});

describe('LevelUpOverlay — só sai quando a pessoa TOCA', () => {
  it('NÃO some sozinho: sem toque, nada acontece (nem em 10 minutos)', () => {
    const onDone = vi.fn();
    renderWithCss(<LevelUpOverlay {...base} onDone={onDone} />);
    act(() => { vi.advanceTimersByTime(10 * 60_000); });
    expect(onDone).not.toHaveBeenCalled();
  });

  it('o toque em QUALQUER lugar da tela fecha — uma vez, com o nível celebrado', () => {
    const onDone = vi.fn();
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={onDone} />);
    act(() => { vi.advanceTimersByTime(ARM_MS + 10); });
    fireEvent.click(container.querySelector('[role="dialog"]') as HTMLElement);
    fireEvent.click(container.querySelector('[role="dialog"]') as HTMLElement);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledWith(5);
  });

  it('o toque "no ar" do gesto que causou a subida (primeiros ms) é ignorado', () => {
    const onDone = vi.fn();
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={onDone} />);
    fireEvent.click(container.querySelector('[role="dialog"]') as HTMLElement);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('teclado: o botão real fecha, e Escape é o mesmo gesto', () => {
    const a = vi.fn();
    const { container, unmount } = renderWithCss(<LevelUpOverlay {...base} onDone={a} />);
    act(() => { vi.advanceTimersByTime(ARM_MS + 10); });
    fireEvent.click(container.querySelector('[data-lvup-continue]') as HTMLElement);
    expect(a).toHaveBeenCalledTimes(1);
    unmount();
    const b = vi.fn();
    renderWithCss(<LevelUpOverlay {...base} onDone={b} />);
    act(() => { vi.advanceTimersByTime(ARM_MS + 10); });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(b).toHaveBeenCalledTimes(1);
  });
});

describe('LevelUpOverlay — vários níveis de uma vez', () => {
  it('mostra "Lv A → Lv B" e o número FINAL grande', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} event={{ from: 3, to: 7 }} onDone={() => {}} />);
    expect(container.querySelector('[data-lvup-range]')?.textContent).toBe('Lv 3 → Lv 7');
    act(() => { vi.advanceTimersByTime(1000); });
    expect(container.querySelector('[data-lvup-number]')?.textContent).toBe('7');
  });

  it('um nível só: sem a linha de intervalo', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(container.querySelector('[data-lvup-range]')).toBeNull();
  });
});

describe('LevelUpOverlay — o que ganhou', () => {
  it('a recompensa do Vínculo e, sob "Now Open", o que abriu — SEM pontos de talento e SEM "Your bond grew"', () => {
    // 4 → 5: o nível 5 dá o sonho "À deriva num barquinho" e abre o Duelo e o Torneio.
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(container.querySelector('[data-lvup-talent]')).toBeNull();
    expect(container.textContent).not.toMatch(/talent|Your bond grew/i);
    expect(container.querySelector('[data-lvup-reward]')?.textContent).toMatch(/Adrift on a little boat/);
    expect(container.querySelector('[data-lvup-open-label]')?.textContent).toBe('Now Open');
    const gates = [...container.querySelectorAll('[data-lvup-gate]')].map(n => n.textContent);
    expect(gates).toEqual(expect.arrayContaining(['The Duel', 'The Tournament']));
  });

  it('PT-BR: "Agora aberto"; sem desbloqueio, o rótulo nem aparece', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} language="pt-BR" onDone={() => {}} />);
    expect(container.querySelector('[data-lvup-open-label]')?.textContent).toBe('Agora aberto');
    expect(container.textContent).not.toMatch(/talento/);
    cleanup();
    // 1 → 2 não abre nenhum portão.
    const sem = renderWithCss(<LevelUpOverlay {...base} event={{ from: 1, to: 2 }} onDone={() => {}} />);
    expect(sem.container.querySelector('[data-lvup-open]')).toBeNull();
  });

  it('7.2: resultado direto sobre o fundo escurecido — sem caixa (vidro) e sem o sunburst', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(container.querySelector('[data-lvup-glass], .sm2-viewport-screen, .sm2-visor')).toBeNull();
    expect(container.querySelector('[data-lvup-burst], [data-lvup-light], canvas')).toBeNull();
    expect(container.querySelector('[data-lvup-glow]')).not.toBeNull();
  });

  it('7.2: o ícone das três setas não é cortado — caixa visível, escala 0,5× exata, pixel nítido', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    const box = container.querySelector('[data-lvup-chevron-box]') as HTMLElement;
    const img = container.querySelector('[data-lvup-chevron]') as HTMLElement;
    expect(box.style.overflow).toBe('visible');
    expect(parseInt(box.style.height)).toBeGreaterThan(parseInt(img.style.height)); // respiro: a arte vai de borda a borda
    expect(img.style.width).toBe('48px');
    expect(img.style.imageRendering).toBe('pixelated');
  });

  it('nunca cobra: sem "faltam", sem urgência', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(container.textContent).not.toMatch(/faltam|only \d|hurry|streak|missing/i);
  });
});

describe('LevelUpOverlay — movimento reduzido reduz o MOVIMENTO, nunca a pausa', () => {
  it('sem glow animado, sem classes de animação, número final direto — e continua ESPERANDO o toque', () => {
    reducao(true);
    const onDone = vi.fn();
    const { container } = renderWithCss(<LevelUpOverlay {...base} event={{ from: 3, to: 7 }} onDone={onDone} />);
    expect(container.querySelector('.sm-lvup-glow')).toBeNull();
    expect(container.querySelector('[data-lvup-number]')?.textContent).toBe('7');
    expect(container.querySelector('.sm-lvup-num, .sm-lvup-banner, .sm-lvup-pet, .sm-lvup-hint')).toBeNull();
    act(() => { vi.advanceTimersByTime(60_000); });
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(container.querySelector('[role="dialog"]') as HTMLElement);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('com movimento: o glow difuso respira (classe de animação)', () => {
    const { container } = renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(container.querySelector('[data-lvup-glow]')?.className).toContain('sm-lvup-glow');
  });
});

describe('LevelUpOverlay — o som (D11 no chamador)', () => {
  it('áudio já liberado por gesto + aba visível: toca UMA vez', () => {
    renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(som.playLevelUp).toHaveBeenCalledTimes(1);
  });

  it('áudio ainda não liberado (abertura do app, sem gesto): nasce MUDO', () => {
    som.estado = 'suspended';
    renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(som.playLevelUp).not.toHaveBeenCalled();
  });

  it('sem barramento nenhum: mudo', () => {
    som.estado = null;
    renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(som.playLevelUp).not.toHaveBeenCalled();
  });

  it('aba oculta: mudo', () => {
    const d = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    renderWithCss(<LevelUpOverlay {...base} onDone={() => {}} />);
    expect(som.playLevelUp).not.toHaveBeenCalled();
    if (d) Object.defineProperty(document, 'hidden', d); else delete (document as unknown as Record<string, unknown>).hidden;
  });
});
