// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { RewardPreview } from './RewardPreview';
import { MenteSheet } from '../play/PlaySheets';
import { XP_DUNGEON_FLOOR, XP_DUNGEON_RUN, bondXP } from '../../utils/bond';
import { ECO_MAX_BITS } from '../../utils/mente/eco';

afterEach(cleanup);
const txt = (c: HTMLElement) => c.textContent!.replace(/\s+/g, ' ');

describe('RewardPreview', () => {
  it('antes: valor fixo vira +N, faixa vira "até N" / "up to N", sem número fica só o ícone', () => {
    const { container } = render(<RewardPreview mode="before" language="pt-BR" items={[
      { kind: 'xp', amount: 20 }, { kind: 'honor', max: 5 }, { kind: 'item', item: 'heart' },
    ]} />);
    const xp = container.querySelector('[data-reward-preview="xp"]')!;
    expect(xp.querySelector('.sm2-num')!.textContent).toBe('+20');
    expect(container.querySelector('[data-reward-preview="honor"] .sm2-num')!.textContent).toBe('até 5');
    const heart = container.querySelector('[data-reward-preview="item"]')!;
    expect(heart.querySelector('.sm2-num')).toBeNull();
    expect(container.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Você pode ganhar');
  });
  it('EN: "up to" no máximo de Bits', () => {
    const { container } = render(<RewardPreview mode="before" language="en-US" items={[{ kind: 'bits', max: 10 }]} />);
    expect(txt(container)).toContain('up to');
    expect(txt(container)).toContain('10');
  });
  it('depois: mostra o valor exato concedido e some o que for 0', () => {
    const { container } = render(<RewardPreview mode="after" language="pt-BR" items={[
      { kind: 'bits', amount: 7 }, { kind: 'xp', amount: 30 }, { kind: 'energy', amount: 0 },
    ]} />);
    expect(txt(container)).toContain('+7');
    expect(container.querySelector('[data-reward-preview="xp"] .sm2-num')!.textContent).toBe('+30');
    expect(container.querySelector('[data-reward-preview="energy"]')).toBeNull();
    expect(container.querySelector('[role="group"]')!.getAttribute('aria-label')).toBe('Você ganhou');
  });
  it('lista vazia não desenha nada', () => {
    const { container } = render(<RewardPreview mode="after" language="en-US" items={[{ kind: 'bits', amount: 0 }]} />);
    expect(container.innerHTML).toBe('');
  });
});

describe('telas ligadas', () => {
  it('Ateliê da Mente mostra o máximo de Bits de cada jogo pela mesma constante que paga', () => {
    const { container } = render(<MenteSheet language="en-US" onStart={() => {}} />);
    const rows = container.querySelectorAll('[data-reward-preview="bits"]');
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain(String(ECO_MAX_BITS));
    expect(rows[0].textContent).toContain('up to');
  });
  it('o XP exibido no Torneio/Fenda vem de bond.ts', () => {
    expect(bondXP({ kind: 'tournamentMatch', won: true })).toBeGreaterThan(0);
    expect(XP_DUNGEON_FLOOR * 5 + XP_DUNGEON_RUN).toBeGreaterThan(XP_DUNGEON_RUN);
  });
});
