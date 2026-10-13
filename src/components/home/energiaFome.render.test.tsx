// @vitest-environment jsdom
/**
 * Os dois componentes pequenos da faixa de status (beta-2 3.4/3.5): `EnergyTimer` e `HungerIndicator`. Props simples, nenhuma leitura do
 * save, nenhum relógio próprio. Também o ENCAIXE no `CompanionHUD` (a menor mudança) e o botão de check-in do cartão da refeição.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { EnergyTimer } from './EnergyTimer';
import { HungerIndicator } from './HungerIndicator';
import { CompanionHUD } from '../CompanionHUD';
import { CheckInSheet } from '../CheckInSheet';
import type { CheckInWindow } from '../../utils/checkIns';

const MIN = 60_000;

describe('EnergyTimer', () => {
  it('regenerando: mostra o tempo até a próxima unidade (curto, sem número de 0)', () => {
    render(<EnergyTimer msToNext={65 * MIN} mode="regen" language="pt-BR" />);
    const t = document.querySelector('[data-energy-timer]')!;
    expect(t.textContent).toBe('1h05');
    expect(t.getAttribute('aria-label')).toBe('Próxima energia em 1h05');
    expect(t.getAttribute('data-mode')).toBe('regen');
  });
  it('devagar (fome): o nome acessível diz que está devagar; EN também', () => {
    render(<EnergyTimer msToNext={42 * MIN} mode="slow" language="en-US" />);
    expect(document.querySelector('[data-energy-timer]')!.getAttribute('aria-label')).toBe('Next energy in 42m (regenerating slowly)');
  });
  it('pausado (faminto) ou sem previsão: um traço, e o nome acessível explica', () => {
    const { unmount } = render(<EnergyTimer msToNext={null} mode="paused" language="pt-BR" />);
    const t = document.querySelector('[data-energy-timer]')!;
    expect(t.textContent).toBe('');
    expect(t.querySelector('svg')).not.toBeNull(); // a pausa é VISÍVEL: símbolo de duas barras, sem depender do aria-label
    expect(t.getAttribute('aria-label')).toMatch(/pausada.*faminto/);
    unmount();
    render(<EnergyTimer msToNext={null} mode="slow" language="en-US" />);
    expect(document.querySelector('[data-energy-timer] svg')).not.toBeNull();
  });
  it('energia cheia: não renderiza nada (não há próxima unidade)', () => {
    const { container } = render(<EnergyTimer msToNext={null} mode="full" language="pt-BR" />);
    expect(container.innerHTML).toBe('');
  });
});

describe('HungerIndicator', () => {
  it('três estados legíveis SEM depender de cor: nome acessível em palavras e pontos preenchidos 3 / 2 / 0', () => {
    const casos = [['fed', 3, 'Fome: bem alimentado'], ['fair', 2, 'Fome: com um pouco de fome'], ['starving', 0, 'Fome: faminto']] as const;
    for (const [tier, pontos, nome] of casos) {
      const { unmount } = render(<HungerIndicator tier={tier} value={50} language="pt-BR" />);
      const el = document.querySelector('[data-hunger-indicator]')!;
      expect(el.getAttribute('aria-label')).toBe(nome);
      expect(el.getAttribute('data-hunger-tier')).toBe(tier);
      const cheios = [...el.querySelectorAll('i')].filter(i => (i as HTMLElement).style.background === 'currentcolor').length;
      expect(cheios).toBe(pontos);
      unmount();
    }
  });
  it('EN e o valor numérico só vai para data-hunger (a tela não mostra número)', () => {
    render(<HungerIndicator tier="starving" value={7.4} language="en-US" />);
    const el = document.querySelector('[data-hunger-indicator]') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Hunger: starving');
    expect(el.getAttribute('data-hunger')).toBe('7');
    expect(el.textContent).toBe('');
  });
});

describe('HungerIndicator — legibilidade (beta-2 F1)', () => {
  it('pontos de 6px em LINHA (não empilhados) e faminto leva a tinta de aviso', () => {
    render(<HungerIndicator tier="starving" value={2} language="pt-BR" />);
    const pontos = [...document.querySelectorAll('[data-hunger-indicator] i')] as HTMLElement[];
    expect(pontos).toHaveLength(3);
    for (const p of pontos) { expect(p.style.width).toBe('6px'); expect(p.style.height).toBe('6px'); }
    expect((pontos[0].parentElement as HTMLElement).style.flexDirection).toBe('row');
  });
  it('com onTap vira botão e chama; sem onTap segue imagem', () => {
    const onTap = vi.fn();
    const { unmount } = render(<HungerIndicator tier="fair" language="en-US" onTap={onTap} />);
    const b = screen.getByRole('button', { name: 'Hunger: a little hungry' });
    fireEvent.click(b);
    expect(onTap).toHaveBeenCalledTimes(1);
    unmount();
    render(<HungerIndicator tier="fair" language="en-US" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('img', { name: 'Hunger: a little hungry' })).not.toBeNull();
  });
});

describe('encaixe no CompanionHUD (a faixa de status do cenário)', () => {
  const base = {
    companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!', currentStage: 'rookie', evolutionStage: 'rookie',
    healthPoints: 3, maxHealthPoints: 3, dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10, useAI: false,
    language: 'pt-BR' as const, energyPoints: 2, maxEnergyPoints: 8,
  };
  it('com `energyInfo`: o timer entra DENTRO do botão da energia e o indicador de fome é irmão dele, no mesmo bloco `.sm3-stats`', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'fair', hunger: 45, mode: 'slow', msToNext: 80 * MIN }} />);
    const botao = container.querySelector('button[data-stat="energy"]')!;
    expect(botao.querySelector('[data-energy-timer]')!.textContent).toBe('1h20');
    const stats = container.querySelector('.sm3-stats')!;
    expect(stats.querySelector('[data-hunger-indicator]')!.getAttribute('data-hunger-tier')).toBe('fair');
    expect(botao.contains(stats.querySelector('[data-hunger-indicator]'))).toBe(false);
  });
  it('tocar na fome abre a dica da energia (statTips) — e tocar de novo fecha', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'starving', hunger: 3, mode: 'paused', msToNext: null }} />);
    const fome = container.querySelector('button[data-hunger-indicator]')!;
    fireEvent.click(fome);
    expect(container.querySelector('[data-stat-tip="energy"]')).not.toBeNull();
    fireEvent.click(fome);
    expect(container.querySelector('[data-stat-tip]')).toBeNull();
  });
  it('sem `energyInfo` (testes, desktop): nada muda — a faixa é a de antes', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.querySelector('[data-energy-timer]')).toBeNull();
    expect(container.querySelector('[data-hunger-indicator]')).toBeNull();
    expect(container.querySelector('button[data-stat="energy"]')).not.toBeNull();
  });
  it('o nome acessível do botão da energia continua sendo o da energia (o timer é decoração do botão, com nome próprio)', () => {
    renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'fed', hunger: 90, mode: 'regen', msToNext: 30 * MIN }} />);
    const b = screen.getByRole('button', { name: /Energia: 2 de 8/ });
    expect(b.getAttribute('aria-label')).toBe('Energia: 2 de 8. Próxima em 30 min');
  });
  it('o nome acessível do botão leva o estado do timer: parada (faminto) e cheia', () => {
    const { unmount } = renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'starving', hunger: 3, mode: 'paused', msToNext: null }} />);
    expect(screen.getByRole('button', { name: /Energia: 2 de 8/ }).getAttribute('aria-label')).toBe('Energia: 2 de 8. Regeneração parada');
    unmount();
    renderWithCss(<CompanionHUD {...base} energyPoints={8} energyInfo={{ tier: 'fed', hunger: 99, mode: 'full', msToNext: null }} />);
    expect(screen.getByRole('button', { name: /Energia: 8 de 8/ }).getAttribute('aria-label')).toBe('Energia: 8 de 8');
  });
});

describe('folha dos check-ins (beta-2 4.1): bottom sheet com as 3 janelas', () => {
  const win = (status: CheckInWindow['status'], slot: CheckInWindow['slot'], from: string, to: string | null): CheckInWindow => ({ slot, from, to, status });
  const janelas: CheckInWindow[] = [win('claimed', 'morning', '09:00', '13:30'), win('open', 'afternoon', '13:30', '20:00'), win('upcoming', 'night', '20:00', null)];
  it('mostra as três janelas com horário e estado; só a janela aberta tem botão, e ele chama onClaim', () => {
    const onClaim = vi.fn();
    render(<CheckInSheet open language="pt-BR" windows={janelas} onClaim={onClaim} onClose={() => {}} />);
    expect(document.querySelectorAll('[data-checkin-window]').length).toBe(3);
    expect(document.querySelector('[data-checkin-window="morning"]')!.textContent).toContain('Feito');
    expect(document.querySelector('[data-checkin-window="night"]')!.textContent).toContain('Mais tarde');
    expect(document.querySelector('[data-checkin-window="night"]')!.textContent).toContain('20:00 até o fim do dia');
    expect(document.querySelectorAll('button[data-checkin]').length).toBe(1);
    const b = document.querySelector('[data-checkin="afternoon"]') as HTMLButtonElement;
    expect(document.body.textContent).not.toMatch(/\+\d|Bits|XP/);
    fireEvent.click(b);
    expect(onClaim).toHaveBeenCalledTimes(1);
  });
  it('os três rótulos em PT e EN', () => {
    const esperado = { morning: ['Preparar o dia', 'Plan the day'], afternoon: ['Ver como está indo', 'See how it is going'], night: ['Encerrar o dia', 'Close the day'] } as const;
    for (const [i, lang] of (['pt-BR', 'en-US'] as const).entries()) {
      const { unmount } = render(<CheckInSheet open language={lang} windows={janelas} onClaim={() => {}} onClose={() => {}} />);
      for (const slot of ['morning', 'afternoon', 'night'] as const) {
        expect(document.querySelector(`[data-checkin-window="${slot}"]`)!.textContent).toContain(esperado[slot][i]);
      }
      unmount();
    }
  });
  it('sem janela aberta (tudo feito/passou): nenhum botão; fechada não renderiza nada', () => {
    const { unmount } = render(<CheckInSheet open language="en-US" windows={janelas.map(w => ({ ...w, status: 'claimed' as const }))} onClaim={() => {}} onClose={() => {}} />);
    expect(document.querySelector('button[data-checkin]')).toBeNull();
    unmount();
    render(<CheckInSheet open={false} language="en-US" windows={janelas} onClaim={() => {}} onClose={() => {}} />);
    expect(document.querySelector('[data-checkin-sheet]')).toBeNull();
  });
});
