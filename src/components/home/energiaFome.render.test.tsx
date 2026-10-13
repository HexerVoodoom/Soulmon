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
import { MealInviteCard } from '../MealInviteCard';

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
    expect(document.querySelector('[data-energy-timer]')!.textContent).toBe('–');
    expect(document.querySelector('[data-energy-timer]')!.getAttribute('aria-label')).toMatch(/pausada.*faminto/);
    unmount();
    render(<EnergyTimer msToNext={null} mode="slow" language="en-US" />);
    expect(document.querySelector('[data-energy-timer]')!.textContent).toBe('–');
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
  it('sem `energyInfo` (testes, desktop): nada muda — a faixa é a de antes', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.querySelector('[data-energy-timer]')).toBeNull();
    expect(container.querySelector('[data-hunger-indicator]')).toBeNull();
    expect(container.querySelector('button[data-stat="energy"]')).not.toBeNull();
  });
  it('o nome acessível do botão da energia continua sendo o da energia (o timer é decoração do botão, com nome próprio)', () => {
    renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'fed', hunger: 90, mode: 'regen', msToNext: 30 * MIN }} />);
    expect(screen.getByRole('button', { name: /Energia: 2 de 8/ })).toBeTruthy();
  });
});

describe('cartão da refeição com check-in (beta-2 4.1)', () => {
  const props = { language: 'pt-BR' as const, petName: 'Pyraka', meal: 'breakfast' as const, kind: 'tenSeconds' as const, onAct: vi.fn(), onSkip: vi.fn() };
  it('mostra UM botão de check-in com o propósito da janela (sem número de recompensa na tela) e chama onClaim', () => {
    const onClaim = vi.fn();
    render(<MealInviteCard {...props} checkIn={{ slot: 'morning', onClaim }} />);
    const b = document.querySelector('[data-checkin="morning"]') as HTMLButtonElement;
    expect(b.textContent).toBe('Preparar o dia');
    expect(b.textContent).not.toMatch(/\d/);
    fireEvent.click(b);
    expect(onClaim).toHaveBeenCalledTimes(1);
  });
  it('os três rótulos em PT e EN', () => {
    const esperado = { morning: ['Preparar o dia', 'Plan the day'], afternoon: ['Ver como está indo', 'See how it is going'], night: ['Encerrar o dia', 'Close the day'] } as const;
    for (const slot of ['morning', 'afternoon', 'night'] as const) {
      for (const [i, lang] of (['pt-BR', 'en-US'] as const).entries()) {
        const { unmount } = render(<MealInviteCard {...props} language={lang} checkIn={{ slot, onClaim: () => {} }} />);
        expect(document.querySelector(`[data-checkin="${slot}"]`)!.textContent).toBe(esperado[slot][i]);
        unmount();
      }
    }
  });
  it('sem check-in disponível (já resgatado): o cartão é o de sempre, sem o botão', () => {
    render(<MealInviteCard {...props} />);
    expect(document.querySelector('[data-checkin]')).toBeNull();
    expect(document.querySelector('[data-meal-invite-act]')).not.toBeNull();
  });
});
