// @vitest-environment jsdom
/**
 * Os dois componentes pequenos da faixa de status (beta-2 3.4/3.5): `EnergyTimer` e `HungerIndicator`. Props simples, nenhuma leitura do
 * save, nenhum relógio próprio. Também o ENCAIXE no `CompanionHUD` (a menor mudança) e o botão de check-in do cartão da refeição.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { EnergyTimer } from './EnergyTimer';
import { HungerIndicator } from './HungerIndicator';
import { CompanionHUD } from '../CompanionHUD';
import { CheckInSheet } from '../CheckInSheet';
import type { CheckInWindow } from '../../utils/checkIns';

const MIN = 60_000;

describe('EnergyTimer (contagem ao vivo dentro da dica da energia, REGISTRO §43)', () => {
  it('regenerando: H:MM:SS quando há hora, tabular; o número é aria-hidden e o rótulo falado leva o tempo da abertura', () => {
    render(<EnergyTimer msToNext={65 * MIN + 5000} mode="regen" language="pt-BR" />);
    const t = document.querySelector('[data-energy-timer]')!;
    expect(t.querySelector('[data-energy-countdown]')!.textContent).toBe('1:05:05');
    expect(t.querySelector('[data-energy-countdown]')!.getAttribute('aria-hidden')).toBe('true');
    expect(t.getAttribute('aria-live')).toBe('polite');
    expect(t.textContent).toContain('Próxima energia em');
    expect(t.querySelector('.sm2-sr-only')!.textContent).toBe('1h06');
  });
  it('sem hora: M:SS, em EN; devagar avisa', () => {
    render(<EnergyTimer msToNext={42 * MIN} mode="slow" language="en-US" />);
    const t = document.querySelector('[data-energy-timer]')!;
    expect(t.querySelector('[data-energy-countdown]')!.textContent).toBe('42:00');
    expect(t.textContent).toContain('Next energy in');
    expect(t.textContent).toContain('slower');
  });
  it('anda a cada segundo, sem mexer no texto falado, e reancora quando chega um msToNext novo', () => {
    vi.useFakeTimers();
    try {
      const { rerender } = render(<EnergyTimer msToNext={61_000} mode="regen" language="pt-BR" />);
      const n = () => document.querySelector('[data-energy-countdown]')!.textContent;
      expect(n()).toBe('1:01');
      act(() => { vi.advanceTimersByTime(3000); });
      expect(n()).toBe('0:58');
      expect(document.querySelector('.sm2-sr-only')!.textContent).toBe('2 min');
      rerender(<EnergyTimer msToNext={30_000} mode="regen" language="pt-BR" />);
      expect(n()).toBe('0:30');
    } finally { vi.useRealTimers(); }
  });
  it('pausado (faminto): estado "pausada" em vez de contagem', () => {
    render(<EnergyTimer msToNext={null} mode="paused" language="pt-BR" />);
    const t = document.querySelector('[data-energy-timer]')!;
    expect(t.querySelector('[data-energy-countdown]')).toBeNull();
    expect(t.textContent).toMatch(/pausada.*faminto/);
    expect(t.getAttribute('data-mode')).toBe('paused');
  });
  it('energia cheia: não renderiza nada (não há próxima unidade)', () => {
    const { container } = render(<EnergyTimer msToNext={null} mode="full" language="pt-BR" />);
    expect(container.innerHTML).toBe('');
  });
});

describe('HungerIndicator', () => {
  it('três estados legíveis SEM depender de cor: nome acessível em palavras e uma arte por estado', () => {
    const casos = [['fed', 3, 'Fome: bem alimentado, nível 3 de 3'], ['fair', 2, 'Fome: com um pouco de fome, nível 2 de 3'], ['starving', 0, 'Fome: faminto, nível 1 de 3']] as const;
    const arts = new Set<string | null>();
    for (const [tier, , nome] of casos) {
      const { unmount } = render(<HungerIndicator tier={tier} value={50} language="pt-BR" />);
      const el = document.querySelector('[data-hunger-indicator]')!;
      expect(el.getAttribute('aria-label')).toBe(nome);
      expect(el.getAttribute('data-hunger-tier')).toBe(tier);
      expect(el.querySelectorAll('img')).toHaveLength(1);
      arts.add(el.querySelector('img')!.getAttribute('src'));
      unmount();
    }
    expect(arts.size).toBe(3);
  });
  it('EN: o valor 0..100 só vai para data-hunger; a tela mostra só N/3', () => {
    render(<HungerIndicator tier="starving" value={7.4} language="en-US" />);
    const el = document.querySelector('[data-hunger-indicator]') as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Hunger: starving, level 1 of 3');
    expect(el.getAttribute('data-hunger')).toBe('7');
    expect(el.textContent).toBe('1/3');
  });
});

describe('HungerIndicator — legibilidade (beta-2 F1)', () => {
  it('a arte é pixelada e nenhum ponto empilhado resta', () => {
    render(<HungerIndicator tier="starving" value={2} language="pt-BR" />);
    expect(document.querySelectorAll('[data-hunger-indicator] i')).toHaveLength(0);
    expect((document.querySelector('[data-hunger-indicator] img') as HTMLElement).style.imageRendering).toBe('pixelated');
  });
  it('com onTap vira botão e chama; sem onTap segue imagem', () => {
    const onTap = vi.fn();
    const { unmount } = render(<HungerIndicator tier="fair" language="en-US" onTap={onTap} />);
    const b = screen.getByRole('button', { name: 'Hunger: a little hungry, level 2 of 3' });
    fireEvent.click(b);
    expect(onTap).toHaveBeenCalledTimes(1);
    unmount();
    render(<HungerIndicator tier="fair" language="en-US" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('img', { name: 'Hunger: a little hungry, level 2 of 3' })).not.toBeNull();
  });
});

describe('encaixe no CompanionHUD (a faixa de status do cenário)', () => {
  const base = {
    companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!', currentStage: 'rookie', evolutionStage: 'rookie',
    healthPoints: 3, maxHealthPoints: 3, dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10, useAI: false,
    language: 'pt-BR' as const, energyPoints: 2, maxEnergyPoints: 8,
  };
  it('com `energyInfo`: NADA de timer na faixa; o indicador de fome segue irmão do botão da energia', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'fair', hunger: 45, mode: 'slow', msToNext: 80 * MIN }} />);
    expect(container.querySelector('[data-energy-timer]')).toBeNull();
    const botao = container.querySelector('button[data-stat="energy"]')!;
    const stats = container.querySelector('.sm3-stats')!;
    expect(stats.querySelector('[data-hunger-indicator]')!.getAttribute('data-hunger-tier')).toBe('fair');
    expect(botao.contains(stats.querySelector('[data-hunger-indicator]'))).toBe(false);
  });
  it('tocar no raio abre a dica com a contagem ao vivo (H:MM:SS com hora); tocar de novo fecha e o timer some', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'fair', hunger: 45, mode: 'slow', msToNext: 80 * MIN }} />);
    const raio = container.querySelector('button[data-stat="energy"]')!;
    fireEvent.click(raio);
    const tip = container.querySelector('[data-stat-tip="energy"]')!;
    expect(tip.querySelector('[data-energy-countdown]')!.textContent).toBe('1:20:00');
    fireEvent.click(raio);
    expect(container.querySelector('[data-energy-timer]')).toBeNull();
  });
  it('faminto: a dica mostra "pausada" no lugar da contagem', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'starving', hunger: 3, mode: 'paused', msToNext: null }} />);
    fireEvent.click(container.querySelector('button[data-stat="energy"]')!);
    expect(container.querySelector('[data-energy-timer][data-mode="paused"]')).not.toBeNull();
    expect(container.querySelector('[data-energy-countdown]')).toBeNull();
  });
  it('tocar na fome abre a dica da FOME com contagem ao vivo até cair de nível e o impacto; faminto não tem contagem', () => {
    const { container, unmount } = renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'fed', hunger: 90, mode: 'regen', msToNext: 30 * MIN, msToHungerDrop: 135 * MIN + 7000 }} />);
    fireEvent.click(container.querySelector('button[data-hunger-indicator]')!);
    expect(container.querySelector('[data-stat-tip="hunger"] [data-hunger-countdown]')!.textContent).toBe('2:15:07');
    expect(container.querySelector('[data-stat-tip="hunger"] [data-stat-tip-use]')!.textContent).toMatch(/velocidade da energia/);
    expect(container.querySelector('[data-energy-timer]')).toBeNull();
    unmount();
    const r = renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'starving', hunger: 3, mode: 'paused', msToNext: null, msToHungerDrop: null }} />);
    fireEvent.click(r.container.querySelector('button[data-hunger-indicator]')!);
    expect(r.container.querySelector('[data-hunger-countdown]')).toBeNull();
    expect(r.container.querySelector('[data-hunger-timer]')).not.toBeNull();
  });
  it('fome exatamente vazia (chegada do Soulmon pago) mostra 0/3; com fome > 0 o piso segue 1/3', () => {
    const vazia = render(<HungerIndicator tier="starving" value={0} language="pt-BR" />);
    expect(vazia.container.querySelector('[data-hunger-level]')!.textContent).toBe('0/3');
    expect(vazia.container.querySelector('[data-hunger-indicator]')!.getAttribute('aria-label')).toMatch(/nível 0 de 3/);
    vazia.unmount();
    const baixa = render(<HungerIndicator tier="starving" value={3} language="pt-BR" />);
    expect(baixa.container.querySelector('[data-hunger-level]')!.textContent).toBe('1/3');
    baixa.unmount();
  });
  it('o indicador mostra o nível como número N/3 (3/3, 2/3, 1/3) e tocar de novo fecha', () => {
    for (const [tier, n] of [['fed', 3], ['fair', 2], ['starving', 1]] as const) {
      const { container, unmount } = render(<HungerIndicator tier={tier} language="pt-BR" />);
      expect(container.querySelector('[data-hunger-level]')!.getAttribute('data-hunger-level')).toBe(String(n));
      expect(container.querySelector('[data-hunger-level]')!.textContent).toBe(`${n}/3`);
      expect(container.querySelector('svg')).toBeNull();
      unmount();
    }
  });
  it('tocar na fome abre a dica e tocar de novo fecha', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'starving', hunger: 3, mode: 'paused', msToNext: null }} />);
    const fome = container.querySelector('button[data-hunger-indicator]')!;
    fireEvent.click(fome);
    expect(container.querySelector('[data-stat-tip="hunger"]')).not.toBeNull();
    fireEvent.click(fome);
    expect(container.querySelector('[data-stat-tip]')).toBeNull();
  });
  it('sem `energyInfo` (testes, desktop): nada muda — a faixa é a de antes', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.querySelector('[data-energy-timer]')).toBeNull();
    expect(container.querySelector('[data-hunger-indicator]')).toBeNull();
    expect(container.querySelector('button[data-stat="energy"]')).not.toBeNull();
  });
  it('o nome acessível do botão da energia é só o da energia (o tempo mora na dica, não no botão)', () => {
    renderWithCss(<CompanionHUD {...base} energyInfo={{ tier: 'fed', hunger: 90, mode: 'regen', msToNext: 30 * MIN }} />);
    const b = screen.getByRole('button', { name: /Energia: 2 de 8/ });
    expect(b.getAttribute('aria-label')).toBe('Energia: 2 de 8');
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
