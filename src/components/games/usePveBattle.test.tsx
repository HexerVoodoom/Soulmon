// @vitest-environment jsdom
/**
 * O RELÓGIO DA LUTA DE PvE (04/10/2026, REGISTRO §20.10): energia, anel, esquiva, pausa e
 * persistência — tudo determinístico pela semente.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { usePveBattle, type PveRules } from './usePveBattle';
import { CHEER_TAPS_FULL, ENERGY_CHEER, ENERGY_DEALT, ENERGY_MAX, ENERGY_TAKEN, dodgeSpec, ringSpec } from '../../utils/energia';
import { PVE_STEP_MS, STAGE_TIMING } from '../../utils/combatFx';

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
/** Do começo de um lado até o golpe começar a ser desenhado (o relógio espera `STEP - ranged.impact`). */
const LEAD = PVE_STEP_MS - STAGE_TIMING.ranged.impact;

function mkRules(log: string[], opts: { foeHp?: number; foeDmg?: number; kind?: 'melee' | 'ranged' } = {}): PveRules {
  let foeHp = opts.foeHp ?? 1000;
  return {
    perfect: 0.92,
    target: () => 0,
    foes: () => (foeHp > 0 ? [0] : []),
    playerElement: () => 'fogo',
    foeElement: () => 'agua',
    playerKind: () => opts.kind ?? 'ranged',
    foeKind: () => 'ranged',
    playerStrike: (i) => {
      log.push(`P:${i.special ? 'S' : 'n'}:${i.ring}`);
      foeHp -= i.special ? 9 : 3;
      return { hits: [{ foe: 0, value: i.special ? 9 : 3 }], victory: foeHp <= 0 };
    },
    foeStrike: (i) => {
      log.push(`F:${i.special ? 'S' : 'n'}:${i.dodge}:${i.acc.toFixed(4)}`);
      return { value: opts.foeDmg ?? 1, blocked: false, defeat: false };
    },
    onVictory: () => log.push('V'),
    onDefeat: () => log.push('D'),
  };
}
const montar = (rules: PveRules, extra: Partial<{ paused: boolean; seed: number; running: boolean }> = {}) =>
  renderHook((p: { paused: boolean }) => usePveBattle({
    running: extra.running ?? true, paused: p.paused, seed: extra.seed ?? 5, reduced: false, rules,
  }), { initialProps: { paused: extra.paused ?? false } });

describe('usePveBattle — a luta é determinística pela semente', () => {
  it('mesma semente, mesmos gestos = a mesma luta; semente outra muda a defesa', async () => {
    const run = async (seed: number) => {
      const log: string[] = [];
      montar(mkRules(log), { seed });
      await advance(40_000);
      cleanup();
      return log;
    };
    const a = await run(5);
    const b = await run(5);
    const c = await run(6);
    expect(a.length).toBeGreaterThan(8);
    expect(a).toEqual(b);
    expect(c.filter(x => x.startsWith('F')).join()).not.toBe(a.filter(x => x.startsWith('F')).join());
  });

  it('o ritmo: o primeiro golpe do pet CHEGA em ~1,7 s e o do inimigo ~1,7 s depois (cada lado leva `PVE_STEP_MS`)', async () => {
    const log: string[] = [];
    montar(mkRules(log));
    await advance(PVE_STEP_MS - 50);
    expect(log).toEqual([]);
    await advance(120);
    expect(log).toEqual(['P:n:bom']);
    await advance(PVE_STEP_MS);
    expect(log.length).toBe(2);
    expect(log[1].startsWith('F:n:nada')).toBe(true);
  });
});

describe('usePveBattle — a energia (dado + sofrido + cheer) e a barra de cheer', () => {
  it('cada golpe dado/sofrido enche a barra certa: pet +9/+7, inimigo +7/+9 (sem cheer)', async () => {
    const log: string[] = [];
    const { result } = montar(mkRules(log));
    await advance(PVE_STEP_MS + 50); // o golpe do pet chegou
    expect(result.current.petEnergy).toBe(ENERGY_DEALT);
    expect(result.current.foeEnergy[0]).toBe(ENERGY_TAKEN);
    await advance(PVE_STEP_MS);      // o do inimigo chegou
    expect(result.current.foeEnergy[0]).toBe(ENERGY_TAKEN + ENERGY_DEALT);
    expect(result.current.petEnergy).toBe(ENERGY_DEALT + ENERGY_TAKEN);
  });

  it('a barra de cheer enche devagar (24 toques) e, cheia, DESPEJA energia no pet e zera', async () => {
    const { result } = montar(mkRules([]));
    for (let i = 0; i < CHEER_TAPS_FULL - 1; i++) act(() => result.current.cheer());
    expect(result.current.meter).toBe(CHEER_TAPS_FULL - 1);
    expect(result.current.petEnergy).toBe(0);
    act(() => result.current.cheer());
    expect(result.current.meter).toBe(0);
    expect(result.current.petEnergy).toBe(ENERGY_CHEER);
  });

  it('PERSISTE entre os combates: reset({ keepPet }) mantém a barra de cheer e a energia; sem keepPet zera tudo', async () => {
    const { result } = montar(mkRules([]));
    for (let i = 0; i < 10; i++) act(() => result.current.cheer());
    act(() => result.current._setPetEnergy(55));
    act(() => result.current._setFoeEnergy(0, 80));
    act(() => result.current.reset({ foes: 1, keepPet: true })); // o próximo inimigo da masmorra
    expect(result.current.meter).toBe(10);
    expect(result.current.petEnergy).toBe(55);
    expect(result.current.foeEnergy[0]).toBe(0); // a do INIMIGO é dele: recomeça
    act(() => result.current.reset({ foes: 1 })); // uma run nova
    expect(result.current.meter).toBe(0);
    expect(result.current.petEnergy).toBe(0);
  });
});

describe('usePveBattle — o ANEL do especial (mecânica ativa do pet)', () => {
  it('energia cheia: o golpe seguinte vira o ESPECIAL e espera o anel; o toque define a nota', async () => {
    const log: string[] = [];
    const { result } = montar(mkRules(log), { seed: 9 });
    act(() => result.current._setPetEnergy(ENERGY_MAX));
    await advance(LEAD + 50);
    expect(result.current.phase).toBe('ring');
    expect(result.current.ring).not.toBeNull();
    expect(result.current.ring!.spec).toEqual(ringSpec(9, 0));
    expect(result.current.charging).toBe(true);
    expect(log).toEqual([]); // o golpe só sai depois do toque
    act(() => result.current.cheer()); // durante o anel o cheer não vale (o toque é do anel)
    expect(result.current.meter).toBe(0);
    act(() => result.current.resolveRing('otimo'));
    await advance(STAGE_TIMING.special.impact + 20);
    expect(log).toEqual(['P:S:otimo']);
    expect(result.current.phase).toBe('idle');
    expect(result.current.charging).toBe(false);
    expect(result.current.petEnergy).toBe(0); // B1 (PR1b): o cast zera a barra e NÃO rende o "dado"
  });

  it('B1: barra enchida pelo golpe SOFRIDO no turno do inimigo → a próxima ação do pet é o especial', async () => {
    const log: string[] = [];
    const { result } = montar(mkRules(log), { seed: 9 });
    act(() => result.current._setPetEnergy(ENERGY_MAX - ENERGY_DEALT - ENERGY_TAKEN));
    await advance(2 * (LEAD + STAGE_TIMING.ranged.impact) + LEAD + 50);
    expect(log).toEqual(['P:n:bom', expect.stringMatching(/^F:n:/)]);
    expect(result.current.petEnergy).toBe(ENERGY_MAX); // cheia, aguardando a vez do dono
    expect(result.current.phase).toBe('ring'); // sem básica no meio
    act(() => result.current.resolveRing('bom'));
    await advance(STAGE_TIMING.special.impact + 20);
    expect(log[2]).toBe('P:S:bom');
    expect(result.current.petEnergy).toBe(0);
  });
});

describe('usePveBattle — a ESQUIVA do especial do inimigo (mecânica ativa)', () => {
  const ate = async (result: { current: ReturnType<typeof usePveBattle> }) => {
    act(() => result.current._setFoeEnergy(0, ENERGY_MAX));
    await advance(LEAD + STAGE_TIMING.ranged.impact + LEAD + 10); // o pet bate (1,7 s), o inimigo espera o respiro e a carga começa
    expect(result.current.phase).toBe('dodge');
  };

  it('sem agir: leva o dano normal do especial (dodge = nada)', async () => {
    const log: string[] = [];
    const { result } = montar(mkRules(log), { seed: 3 });
    await ate(result);
    const spec = dodgeSpec(3, 0);
    expect(result.current.dodge).not.toBeNull();
    await advance(spec.impactMs + 20);
    expect(log.some(l => l.startsWith('F:S:nada'))).toBe(true);
    expect(result.current.phase).toBe('idle');
  });

  it('deslizar no último trecho antes do impacto = ÓTIMO; deslizar cedo (ainda carregando) = nada', async () => {
    const spec = dodgeSpec(3, 0);
    // ótimo
    const logA: string[] = [];
    const a = montar(mkRules(logA), { seed: 3 });
    await ate(a.result);
    await advance(spec.impactMs - 200);
    act(() => a.result.current.swipe(1));
    expect(a.result.current.petDodge).not.toBeNull();
    await advance(300);
    expect(logA.some(l => l.startsWith('F:S:otimo'))).toBe(true);
    cleanup();
    // cedo demais
    const logB: string[] = [];
    const b = montar(mkRules(logB), { seed: 3 });
    await ate(b.result);
    await advance(100);
    act(() => b.result.current.swipe(-1));
    await advance(spec.impactMs + 20);
    expect(logB.some(l => l.startsWith('F:S:nada'))).toBe(true);
  });

  it('o golpe NORMAL do inimigo segue com a defesa automática: sem janela de esquiva', async () => {
    const log: string[] = [];
    const { result } = montar(mkRules(log), { seed: 3 });
    await advance(LEAD + PVE_STEP_MS + 100);
    expect(result.current.phase).toBe('idle');
    expect(result.current.dodge).toBeNull();
    act(() => result.current.swipe(1)); // gesto fora da janela não faz nada
    expect(result.current.petDodge).toBeNull();
  });
});

describe('usePveBattle — pausa e fim', () => {
  it('a confirmação de sair PAUSA o relógio e retomá-lo continua de onde parou', async () => {
    const log: string[] = [];
    const { rerender } = montar(mkRules(log));
    await advance(PVE_STEP_MS / 2);
    rerender({ paused: true });
    await advance(20_000);
    expect(log).toEqual([]);
    rerender({ paused: false });
    await advance(PVE_STEP_MS);
    expect(log.length).toBeGreaterThanOrEqual(1);
  });

  it('vitória: o golpe que derruba o inimigo encerra a luta depois de um respiro', async () => {
    const log: string[] = [];
    montar(mkRules(log, { foeHp: 3 }));
    await advance(PVE_STEP_MS + 100);
    expect(log).toEqual(['P:n:bom']);
    await advance(1200);
    expect(log).toEqual(['P:n:bom', 'V']);
    await advance(20_000);
    expect(log).toEqual(['P:n:bom', 'V']); // não recomeça sozinho
  });
});
