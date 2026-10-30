// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EtapaDuelo } from './EtapaDuelo';
import { DUELO_MAX, duelCut, duelFoeStrike, duelPlayerStrike, duelStart, enemyHp, enemyMaxHp } from './dueloLogic';

afterEach(cleanup);

describe('duelo do onboarding (lógica)', () => {
  it('dano nunca cai no jogador: só ancião/Soulmon do ancião, e nunca zera', () => {
    let s = duelStart();
    for (let i = 0; i < 200; i++) {
      const r = duelFoeStrike(s);
      expect(['anciao', 'anciaoSoulmon']).toContain(r.victim);
      s = { ...r.state, turn: s.turn + 1 };
    }
    expect(s.anciao).toBeGreaterThanOrEqual(1);
    expect(s.anciaoSoulmon).toBeGreaterThanOrEqual(1);
    expect(Object.keys(s).sort()).toEqual(['anciao', 'anciaoSoulmon', 'desfeito', 'pesadelo', 'turn']);
  });
  it('corta em ~1/3 e não antes', () => {
    let s = duelStart();
    expect(duelCut(s)).toBe(false);
    while (!duelCut(s)) s = duelPlayerStrike(s);
    expect(enemyHp(s)).toBeLessThanOrEqual(Math.ceil(enemyMaxHp() / 3));
    expect(enemyHp(s)).toBeGreaterThan(0);
  });
  it('inimigo começa cheio', () => {
    expect(enemyHp(duelStart())).toBe(DUELO_MAX.desfeito + DUELO_MAX.pesadelo);
  });
});

describe('EtapaDuelo (UI)', () => {
  it('chama onDone uma vez ao cortar; ancião nunca zera', () => {
    const onDone = vi.fn();
    render(<EtapaDuelo onDone={onDone} />);
    const btn = screen.getByRole('button');
    for (let i = 0; i < 30 && onDone.mock.calls.length === 0; i++) {
      fireEvent.click(btn);
      expect(Number(screen.getByTestId('hp-anciao').getAttribute('data-hp'))).toBeGreaterThanOrEqual(1);
    }
    expect(onDone).toHaveBeenCalledTimes(1);
    fireEvent.click(btn);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
