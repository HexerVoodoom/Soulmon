// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { InfoTip, alvo44 } from './InfoTip';
import { MissionCard } from '../nav/MissionCard';

afterEach(cleanup);

/** QA L05-02/L09-04: alvos de toque < 44 px. A área sobe a 44 SEM mudar o espaço no layout (padding compensado por margem negativa). */
describe('alvo de toque ≥ 44 sem mudar o layout', () => {
  it('alvo44: o "i" que pede minHeight 24 ganha área 44 e devolve os 20 px por margem negativa', () => {
    expect(alvo44({ minHeight: 24 })).toEqual({ minHeight: 44, minWidth: 44, margin: '-10px -0px' });
    expect(alvo44(undefined)).toEqual({});
    expect(alvo44({ minHeight: 44 })).toEqual({});
  });

  it('InfoTip com minHeight 24: o botão tem minHeight 44', () => {
    const { container } = render(<InfoTip language="pt-BR" label="Sobre" style={{ minHeight: 24 }}>x</InfoTip>);
    const b = container.querySelector('[data-info-tip]') as HTMLElement;
    expect(b.style.minHeight).toBe('44px');
    expect(b.style.minWidth).toBe('44px');
  });

  it('MissionCard: o link da missão tem área 44 (era 32) e margem negativa', () => {
    const { container } = render(
      <ul><MissionCard language="pt-BR" attrs={{}} status="open" title="Conheça: Arena" onGo={() => {}} /></ul>,
    );
    const b = container.querySelector('[data-mission-go]') as HTMLElement;
    expect(b.style.minHeight).toBe('44px');
    expect(b.style.margin).toBe('-6px 0px');
  });
});
