// @vitest-environment jsdom
/**
 * 01/11/2026 (dono): "tive pesadelo e 'noite tranquila' ao mesmo tempo". O convite do Pesadelo e o "a noite passou tranquila"
 * têm UMA fonte (`nightmaresFor`, via `buildNightmareWave`); nunca aparecem juntos, em nenhuma ordem de chegada da noite.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { NightmareBattleHost } from './NightmareBattleHost';
import { createRestState, recordNight } from '../utils/restWindow';
import { nightmaresFor, nightmareDayKey, nightmareNightSignature, hasPendingNightmare, createNightmareState } from '../utils/nightmares';

vi.mock('../utils/sounds', () => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn(), playDefend: vi.fn(), playCharge: vi.fn(), playDefeat: vi.fn(), playFeed: vi.fn(), isMuted: () => true }));

const NOW = new Date('2026-11-01T10:00:00-03:00');
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(NOW); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const comNoite = () => recordNight(createRestState(), new Date('2026-10-31T22:30:00-03:00'), new Date('2026-11-01T07:00:00-03:00'));
const props = (rest: ReturnType<typeof createRestState> | undefined, onVanish = vi.fn()) => ({
  open: true, rest, nightKey: nightmareDayKey(new Date(), rest?.playerDayTz), rarity: 'common' as const, petStage: 'rookie', language: 'pt-BR' as const,
  onWin: vi.fn(), onLose: vi.fn(), onClose: vi.fn(), onVanish,
});
const tranquila = () => screen.queryByText(/passou tranquila/i);
const convite = () => screen.queryByText(/Encarar o pesadelo/i);

describe('Pesadelo × "noite tranquila": exclusão mútua', () => {
  it('a fixture tem pesadelo pendente (sanidade)', () => {
    const rest = comNoite();
    expect(nightmaresFor(rest, NOW).count).toBeGreaterThan(0);
    expect(hasPendingNightmare(createNightmareState(), rest, NOW)).toBe(true);
  });

  it('noite registrada: mostra o convite e NUNCA a frase tranquila', () => {
    render(<NightmareBattleHost {...props(comNoite())} />);
    expect(convite()).not.toBeNull();
    expect(tranquila()).toBeNull();
  });

  it('ORDEM A (noite chega DEPOIS da primeira renderização): a onda vazia se refaz, sem "tranquila" e sem fechar', () => {
    const onVanish = vi.fn();
    const { rerender } = render(<NightmareBattleHost {...props(createRestState(), onVanish)} />);
    expect(tranquila()).toBeNull(); // sem oferta não há tela de pesadelo
    expect(convite()).toBeNull();
    rerender(<NightmareBattleHost {...props(comNoite(), onVanish)} />);
    expect(convite()).not.toBeNull();
    expect(tranquila()).toBeNull();
  });

  it('ORDEM B (noite já existe, depois some do rest): a onda da luta fica, não vira "tranquila"', () => {
    const { rerender } = render(<NightmareBattleHost {...props(comNoite())} />);
    rerender(<NightmareBattleHost {...props(createRestState())} />);
    expect(convite()).not.toBeNull();
    expect(tranquila()).toBeNull();
  });

  it('virada da meia-noite com a tela aberta não esvazia a onda', () => {
    const rest = comNoite();
    const { rerender } = render(<NightmareBattleHost {...props(rest)} />);
    vi.setSystemTime(new Date('2026-11-02T00:10:00-03:00'));
    rerender(<NightmareBattleHost {...props(rest)} />);
    expect(convite()).not.toBeNull();
    expect(tranquila()).toBeNull();
  });

  it('sem oferta nenhuma: o Host avisa `onVanish` (o App fecha sem gravar a noite) e não desenha nada', () => {
    const onVanish = vi.fn();
    const { container } = render(<NightmareBattleHost {...props(createRestState(), onVanish)} />);
    expect(onVanish).toHaveBeenCalled();
    expect(container.textContent).toBe('');
  });

  it('a assinatura da noite muda quando a noite chega e é estável sem mudança', () => {
    const key = nightmareDayKey(NOW, undefined);
    const a = nightmareNightSignature(createRestState(), key);
    const b = nightmareNightSignature(comNoite(), key);
    expect(a).not.toBe(b);
    expect(nightmareNightSignature(comNoite(), key)).toBe(b);
  });
});
