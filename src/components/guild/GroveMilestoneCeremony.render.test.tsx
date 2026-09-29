// @vitest-environment jsdom
/**
 * A cerimônia do marco do Bosque (`PLANO-GUILDA.md` §4). Irmã da `MilestoneCeremony`
 * do hábito, e guarda as mesmas travas que custaram caro lá: ela ESPERA o gesto,
 * fica acima da fila (z 300) e movimento reduzido reduz o movimento, NUNCA a pausa.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { GroveMilestoneCeremony } from './GroveMilestoneCeremony';
import { GUILD_COPY } from '../../utils/guildCopy';

const base = { stage: 'copa' as const, spriteUrl: '/eu.png', dateLabel: '29 de setembro de 2026', sceneGranted: false, language: 'pt-BR' as const };
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('o que ela diz', () => {
  it.each([
    ['ramagem', 'guild.marco.ramagem'], ['copa', 'guild.marco.copa'], ['mata', 'guild.marco.mata'], ['bosque-antigo', 'guild.marco.bosqueAntigo'],
  ] as const)('%s: a frase do MUNDO manda e a fala do pet vem embaixo, em PT e EN', (stage, chave) => {
    for (const [language, i] of [['pt-BR', 0], ['en-US', 1]] as const) {
      const { unmount } = renderWithCss(<GroveMilestoneCeremony {...base} stage={stage} language={language} onDone={() => {}} />);
      expect(screen.getByText(GUILD_COPY[`${chave}.mundo` as keyof typeof GUILD_COPY][i])).toBeTruthy();
      expect(screen.getByText(GUILD_COPY[`${chave}.pet` as keyof typeof GUILD_COPY][i])).toBeTruthy();
      expect(screen.getByRole('button').textContent).toBe(GUILD_COPY['guild.marco.botao'][i]);
      unmount();
    }
  });

  it('a DATA do marco aparece — é a saída relacional — e some quando não é legível', () => {
    const { container, rerender } = renderWithCss(<GroveMilestoneCeremony {...base} onDone={() => {}} />);
    expect(container.textContent).toContain('29 de setembro de 2026');
    rerender(<GroveMilestoneCeremony {...base} dateLabel="" onDone={() => {}} />);
    expect(container.textContent).not.toContain('setembro');
  });

  it('o cenário novo só é anunciado quando ELE ENTROU nos cenários da pessoa', () => {
    const { container, rerender } = renderWithCss(<GroveMilestoneCeremony {...base} onDone={() => {}} />);
    expect(container.textContent).not.toMatch(/Cenário do bosque/);
    rerender(<GroveMilestoneCeremony {...base} sceneGranted onDone={() => {}} />);
    expect(container.textContent).toContain('Cenário do bosque: Copa. Já está em Background.');
    rerender(<GroveMilestoneCeremony {...base} sceneGranted language="en-US" onDone={() => {}} />);
    expect(container.textContent).toContain('Grove scenery: Canopy. It is now under Background.');
  });

  it('sem número, sem "parabéns" e sem cobrança', () => {
    const { container } = renderWithCss(<GroveMilestoneCeremony {...base} dateLabel="" onDone={() => {}} />);
    expect(container.textContent).not.toMatch(/\d|parab[ée]ns|congrat|voc[êe] fez/i);
  });

  it('o pixel mora no vidro: o cenário do estágio e a criatura de quem olha a 128', () => {
    const { container } = renderWithCss(<GroveMilestoneCeremony {...base} onDone={() => {}} />);
    const vidro = container.querySelector('[data-ritual-glass]') as HTMLElement;
    const sprite = vidro.querySelector('[data-grove-ceremony-sprite]')!;
    expect(sprite.getAttribute('width')).toBe('128');
    expect(sprite.getAttribute('src')).toBe('/eu.png');
    expect(container.querySelectorAll('img')).toHaveLength(1);
  });
});

describe('a saída é do jogador', () => {
  it('NÃO some sozinha: sem gesto, nada acontece', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    renderWithCss(<GroveMilestoneCeremony {...base} onDone={onDone} />);
    vi.advanceTimersByTime(120_000);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('UM botão, e ele fecha; Escape é a mesma saída', () => {
    const onDone = vi.fn();
    const { container } = renderWithCss(<GroveMilestoneCeremony {...base} onDone={onDone} />);
    expect(container.querySelectorAll('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onDone).toHaveBeenCalledTimes(2);
  });

  it('é diálogo modal nomeado, anunciado, e fica ACIMA da fila de intersticiais (z 300)', () => {
    const { container } = renderWithCss(<GroveMilestoneCeremony {...base} onDone={() => {}} />);
    const dlg = container.querySelector('[role="dialog"]')!;
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-labelledby')).toBe('gmc-title');
    expect(container.querySelector('#gmc-title')?.textContent).toBe('O bosque fechou copa.');
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(Number((container.querySelector('[role="status"]') as HTMLElement).style.zIndex)).toBe(300);
  });
});

describe('movimento reduzido reduz o MOVIMENTO, nunca a pausa', () => {
  it('a cerimônia é a mesma (mesmo botão, mesmo texto); só a animação some', () => {
    const normal = renderWithCss(<GroveMilestoneCeremony {...base} onDone={() => {}} />);
    expect(normal.container.querySelectorAll('.sm-milestone-pop')).toHaveLength(1);
    const textoNormal = normal.container.textContent;
    normal.unmount();
    const { container } = renderWithCss(<GroveMilestoneCeremony {...base} reducedMotion onDone={() => {}} />);
    expect(container.querySelectorAll('.sm-milestone-pop')).toHaveLength(0);
    expect(container.querySelectorAll('button')).toHaveLength(1);
    expect(container.textContent).toBe(textoNormal);
  });

  it('e não vibra; com movimento normal, vibra (opcional onde não existe)', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    renderWithCss(<GroveMilestoneCeremony {...base} reducedMotion onDone={() => {}} />);
    expect(vibrate).not.toHaveBeenCalled();
    renderWithCss(<GroveMilestoneCeremony {...base} onDone={() => {}} />);
    expect(vibrate).toHaveBeenCalledTimes(1);
    vi.stubGlobal('navigator', {});
    expect(() => renderWithCss(<GroveMilestoneCeremony {...base} onDone={() => {}} />)).not.toThrow();
  });
});
