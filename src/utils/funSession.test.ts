import { describe, it, expect } from 'vitest';
import {
  startFunRound, funSessionStatus, funRoundRefusal, sanitizeFunSession, activeFunSession, formatMmSs, isFunGame,
  FUN_SESSION_MS, FUN_SESSION_ROUNDS, type FunSessionState,
} from './funSession';

const T0 = 1_800_000_000_000;
// Relógio da energia ancorado em T0: sem regeneração retroativa entre as rodadas de um mesmo teste curto (o UNIT é horas).
const base = (energy: number, extra: Partial<FunSessionState> = {}): FunSessionState => ({
  energyPoints: energy, energyClock: { at: T0, carry: 0 }, ...extra,
});

describe('funSession — 1 energia = 3 rodadas em 30 min', () => {
  it('cobra 1 energia só na 1ª de 3 rodadas; a 4ª cobra de novo', () => {
    let s = base(3);
    s = startFunRound(s, T0);
    expect(s.energyPoints).toBe(2);
    s = startFunRound(s, T0 + 1000);
    s = startFunRound(s, T0 + 2000);
    expect(s.energyPoints).toBe(2);
    expect(s.funSession).toEqual({ startedAt: T0, rounds: 3 });
    expect(funSessionStatus(s, T0 + 3000).active).toBe(false);
    s = startFunRound(s, T0 + 3000);
    expect(s.energyPoints).toBe(1);
    expect(s.funSession).toEqual({ startedAt: T0 + 3000, rounds: 1 });
  });

  it('expira em 30 min: depois disso a rodada cobra de novo', () => {
    let s = startFunRound(base(2), T0);
    const st = funSessionStatus(s, T0 + FUN_SESSION_MS - 1000);
    expect(st).toMatchObject({ active: true, roundsLeft: FUN_SESSION_ROUNDS - 1 });
    expect(formatMmSs(st.msLeft)).toBe('00:01');
    expect(funSessionStatus(s, T0 + FUN_SESSION_MS).active).toBe(false);
    s = startFunRound(s, T0 + FUN_SESSION_MS);
    expect(s.funSession?.startedAt).toBe(T0 + FUN_SESSION_MS);
    expect(s.funSession?.rounds).toBe(1);
  });

  it('sem energia: bloqueia e devolve a MESMA referência', () => {
    const s = base(0);
    expect(funRoundRefusal(s, T0)).toBe('no-energy');
    expect(funSessionStatus(s, T0).canPlay).toBe(false);
    expect(startFunRound(s, T0)).toBe(s);
  });

  it('sessão aberta joga mesmo com energia zerada', () => {
    let s = startFunRound(base(1), T0);
    expect(s.energyPoints).toBe(0);
    expect(funRoundRefusal(s, T0 + 1)).toBeUndefined();
    s = startFunRound(s, T0 + 1);
    expect(s.funSession?.rounds).toBe(2);
  });

  it('save antigo (sem funSession) ou lixo = nenhuma sessão', () => {
    expect(activeFunSession({}, T0)).toBeUndefined();
    expect(sanitizeFunSession(undefined)).toBeUndefined();
    expect(sanitizeFunSession({ startedAt: 'x', rounds: 1 })).toBeUndefined();
    expect(sanitizeFunSession({ startedAt: T0, rounds: 99 })).toEqual({ startedAt: T0, rounds: FUN_SESSION_ROUNDS });
    expect(funSessionStatus(base(5), T0)).toMatchObject({ active: false, costsEnergy: true, canPlay: true });
  });

  it('relógio que voltou antes da abertura não vale como sessão', () => {
    const s = base(0, { funSession: { startedAt: T0, rounds: 1 } });
    expect(activeFunSession(s, T0 - 1)).toBeUndefined();
  });

  it('só os jogos do Salão contam como diversão', () => {
    expect(['dino', 'ppt', 'match3', 'barrage'].every(isFunGame)).toBe(true);
    expect(['eco', 'zip', 'patches', 'respiracao', 'bolhas-calmas', 'masmorra'].some(isFunGame)).toBe(false);
  });
});
