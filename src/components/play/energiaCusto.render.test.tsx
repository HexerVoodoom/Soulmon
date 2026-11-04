// @vitest-environment jsdom
/** Tudo que gasta energia mostra o ícone da energia no botão/cartão (dono, 04/11/2026). */
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SalaoSheet, MasmorraSheet } from './PlaySheets';
import { EnergyCost } from '../ui/EnergyCost';
import { PlayCard } from '../PlayCard';
import type { FunSessionStatus } from '../../utils/funSession';

afterEach(cleanup);
const st = (o: Partial<FunSessionStatus>): (() => FunSessionStatus) => () => ({ active: false, roundsLeft: 0, msLeft: 0, costsEnergy: true, canPlay: true, ...o });

describe('ícone de custo de energia', () => {
  it('EnergyCost é decorativo (aria-hidden) com o número', () => {
    const { container } = render(<EnergyCost amount={2} />);
    const e = container.querySelector('[data-energy-cost="2"]')!;
    expect(e.getAttribute('aria-hidden')).toBe('true');
    expect(e.textContent).toBe('2');
    expect(e.querySelector('img')).toBeTruthy();
  });

  it('Salão: cada "Jogar" (Corrida, Pedra/Papel, Fusion, Chuva) e a linha de custo mostram o ícone quando abrir gasta', () => {
    const { container } = render(<SalaoSheet language="en-US" onStart={() => {}} funStatus={st({})} />);
    for (const k of ['data-dino-start', 'data-ppt-start', 'data-match3-start', 'data-barrage-open']) {
      expect(container.querySelector(`[${k}] [data-energy-cost="1"]`), k).toBeTruthy();
    }
    expect(container.querySelector('[data-fun-session="cost"] img')).toBeTruthy();
  });

  it('Salão: com sessão ativa (rodadas já pagas) os botões ficam sem custo; sem funStatus também', () => {
    const a = render(<SalaoSheet language="en-US" onStart={() => {}} funStatus={st({ active: true, roundsLeft: 2, msLeft: 60000, costsEnergy: false })} />);
    expect(a.container.querySelector('[data-energy-cost]')).toBeNull();
    cleanup();
    const b = render(<SalaoSheet language="en-US" onStart={() => {}} />);
    expect(b.container.querySelector('[data-energy-cost]')).toBeNull();
  });

  it('Masmorra: "Descer à Fenda" mostra o custo da camada', () => {
    const { container } = render(<MasmorraSheet language="pt-BR" onStart={() => {}} />);
    expect(container.querySelector('[data-masmorra-start] [data-energy-cost="1"]')).toBeTruthy();
  });

  it('Brincar (cartão do Soulmon) mostra o custo no botão; sem energia o botão nem existe', () => {
    const a = render(<PlayCard canPlay playedToday={false} buff={null} language="pt-BR" onPlay={() => {}} />);
    expect(a.container.querySelector('button [data-energy-cost="1"]')).toBeTruthy();
    cleanup();
    const b = render(<PlayCard canPlay={false} playedToday={false} buff={null} language="pt-BR" onPlay={() => {}} />);
    expect(b.container.querySelector('[data-energy-cost]')).toBeNull();
  });
});
