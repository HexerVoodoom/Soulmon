// @vitest-environment jsdom
/**
 * WP2.4 — a cerimônia do marco.
 *
 * Cruzar 7, 21 ou 66 dias de um hábito era um som, um toast e uma fala: três
 * coisas que o app faz o tempo todo por qualquer motivo. O momento mais raro
 * da mecânica de constância era indistinguível de concluir uma tarefa.
 *
 * As duas travas que este teste guarda: ela NÃO pede nada, e ela vai embora.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { MilestoneCeremony } from './MilestoneCeremony';

const base = {
  tierIcon: '🌿',
  habitName: 'Ler',
  text: '🌿 7 dias! Este hábito virou broto.',
  language: 'pt-BR' as const,
};

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('MilestoneCeremony — o que ela mostra', () => {
  it('o hábito e a frase do marco', () => {
    renderWithCss(<MilestoneCeremony {...base} onDone={() => {}} />);
    expect(screen.getByText('Ler')).toBeTruthy();
    expect(screen.getByText(base.text)).toBeTruthy();
  });

  it('é anunciada a quem usa leitor de tela', () => {
    const { container } = renderWithCss(<MilestoneCeremony {...base} onDone={() => {}} />);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });
});

describe('MilestoneCeremony — a saída é do jogador', () => {
  // ⚠️ Estes testes eram o INVERSO até 06/09/2026: exigiam que o overlay
  // sumisse em 2,5s e que não houvesse botão. Isso contrariava o aceite
  // escrito no próprio ledger ("o modal não fecha sozinho") e o que o dossiê
  // achou em onze apps — o que faz a pessoa REGISTRAR o marco é a saída
  // pertencer a ela. 66 dias efetivos é o evento mais raro do motor de
  // constância; ele não pode passar enquanto ninguém olha.
  it('NÃO some sozinha: sem gesto, nada acontece', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    renderWithCss(<MilestoneCeremony {...base} onDone={onDone} />);
    vi.advanceTimersByTime(60_000);
    expect(onDone).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('tem UM botão, e ele fecha', () => {
    const onDone = vi.fn();
    const { container } = renderWithCss(<MilestoneCeremony {...base} onDone={onDone} />);
    const botoes = container.querySelectorAll('button');
    expect(botoes).toHaveLength(1);
    fireEvent.click(botoes[0]);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('a saída é relacional, nunca um "OK"', () => {
    const { container } = renderWithCss(<MilestoneCeremony {...base} onDone={() => {}} />);
    const texto = container.querySelector('button')?.textContent ?? '';
    expect(texto).toMatch(/juntos/i);
  });

  it('mostra a DATA quando ela existe — marco é memória, não aviso', () => {
    const { container } = renderWithCss(
      <MilestoneCeremony {...base} dateLabel="7 de setembro de 2026" onDone={() => {}} />,
    );
    expect(container.textContent).toContain('7 de setembro de 2026');
  });

  it('fica ACIMA dos intersticiais', () => {
    // Ela vivia em z-60, abaixo do check-in (200): o marco era comemorado
    // para um véu invisível.
    const { container } = renderWithCss(<MilestoneCeremony {...base} onDone={() => {}} />);
    const z = Number((container.querySelector('[role="status"]') as HTMLElement)?.style.zIndex);
    expect(z).toBeGreaterThan(210);
  });
});

describe('MilestoneCeremony — movimento reduzido reduz o MOVIMENTO, não a pausa', () => {
  it('a cerimônia é a mesma; só as animações somem', () => {
    const { container } = renderWithCss(
      <MilestoneCeremony {...base} reducedMotion onDone={() => {}} />,
    );
    // O overlay continua existindo, com o mesmo botão: quem pediu menos
    // movimento não recebe MENOS cerimônia.
    expect(container.querySelector('[role="status"]')).not.toBeNull();
    expect(container.querySelectorAll('button')).toHaveLength(1);
    expect(container.querySelectorAll('.sm-milestone-pop')).toHaveLength(0);
  });

  it('e não vibra', () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { vibrate });
    renderWithCss(<MilestoneCeremony {...base} reducedMotion onDone={() => {}} />);
    expect(vibrate).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

describe('MilestoneCeremony — o háptico é opcional', () => {
  it('onde não existe `vibrate`, nada quebra', () => {
    vi.stubGlobal('navigator', {});
    expect(() => renderWithCss(<MilestoneCeremony {...base} onDone={() => {}} />)).not.toThrow();
  });
});
