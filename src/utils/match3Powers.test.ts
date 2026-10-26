import { describe, it, expect } from 'vitest';
import { comboOrigin, powerShots, planFx, FX_AURA_MS, FX_TRAVEL_MS, FX_CAP_MS, FX_FULL_MS, FX_LANES, FX_ORB_PX, FX_ORB_PX_BIG, FX_NUM_MS } from './match3Powers';
import { newRound, trySwap, validMoves, M3_TILE_ELEMENTS, type Step } from './match3';
import { applyPlayerSteps, applyEnemySteps, newCombat } from './match3Combat';
import { mulberry32 } from './combate/rng';

const step = (cleared: Array<[number, number]>, kinds: number[]): Step => ({
  cleared: cleared.map(([r, c]) => ({ r, c })), kinds, triggered: [], created: [], chain: 1, gained: 0, after: [],
});

describe('comboOrigin: de onde sai o poder', () => {
  it('prefere a célula da troca que entrou no combo', () => {
    const st = step([[2, 1], [2, 2], [2, 3]], [0, 0, 0]);
    expect(comboOrigin(st, 0, [{ r: 2, c: 3 }, { r: 3, c: 3 }])).toEqual({ r: 2, c: 3 });
  });
  it('sem troca no combo (cascata) usa a célula do meio das peças do tipo', () => {
    const st = step([[2, 1], [2, 2], [2, 3]], [1, 1, 1]);
    expect(comboOrigin(st, 1, [])).toEqual({ r: 2, c: 2 });
  });
  it('separa os tipos e devolve null para tipo que não foi limpo', () => {
    const st = step([[0, 0], [0, 1], [0, 2], [5, 5], [5, 6], [5, 4]], [0, 0, 0, 3, 3, 3]);
    expect(comboOrigin(st, 3, [{ r: 0, c: 0 }])).toEqual({ r: 5, c: 5 });
    expect(comboOrigin(st, 2)).toBeNull();
  });
});

describe('powerShots: dano mostrado = dano aplicado', () => {
  it('cada evento do jogador vira um poder na célula de um combo do seu elemento, com o dano do log', () => {
    const { board, rng } = newRound(7);
    const m = validMoves(board)[0];
    const r = trySwap(board, m.a, m.b, rng);
    if (!r.ok) throw new Error('inválida');
    let c = newCombat(mulberry32(1), []);
    for (const st of r.steps) {
      const next = applyPlayerSteps(c, [st]);
      const novos = next.log.slice(c.log.length);
      const shots = powerShots(st, novos, st.chain === 1 ? [m.a, m.b] : []);
      expect(shots.length).toBe(novos.length);
      shots.forEach((s, i) => {
        expect(s.dmg).toBe(novos[i].dmg);
        expect(s.by).toBe('player');
        expect(s.target).toBe(novos[i].target);
        const k = M3_TILE_ELEMENTS.indexOf(s.element as (typeof M3_TILE_ELEMENTS)[number]);
        const idx = st.cleared.findIndex((p, j) => p.r === s.from.r && p.c === s.from.c && st.kinds[j] === k);
        expect(idx).toBeGreaterThanOrEqual(0); // a origem É uma célula limpa daquele elemento
      });
      c = next;
    }
  });
  it('o inimigo também: alvo = o jogador, dano = o do log do inimigo', () => {
    const { board, rng } = newRound(11);
    const m = validMoves(board)[0];
    const r = trySwap(board, m.a, m.b, rng);
    if (!r.ok) throw new Error('inválida');
    const c = newCombat(mulberry32(2), []);
    const next = applyEnemySteps(c, [r.steps[0]]);
    const shots = powerShots(r.steps[0], next.log, [m.a, m.b]);
    expect(shots.every(s => s.by === 'enemy' && s.target === 'player')).toBe(true);
    expect(shots.map(s => s.dmg)).toEqual(next.log.map(e => e.dmg));
  });
});

describe('D-102: o ritmo do efeito (aura → poder maior e mais longo → burst)', () => {
  it('faixas pedidas: aura 0,4–0,6 s; viagem 0,9–1,2 s (≈ +1 s sobre os 0,3 s de antes); poder 2–3× o ícone de 24 px', () => {
    expect(FX_AURA_MS).toBeGreaterThanOrEqual(400);
    expect(FX_AURA_MS).toBeLessThanOrEqual(600);
    expect(FX_TRAVEL_MS).toBeGreaterThanOrEqual(900);
    expect(FX_TRAVEL_MS).toBeLessThanOrEqual(1200);
    expect(FX_ORB_PX / 24).toBeGreaterThanOrEqual(2);
    expect(FX_ORB_PX / 24).toBeLessThanOrEqual(3);
    // D-103: +25% sobre os 56/84 px de D-102
    expect(FX_ORB_PX / 56).toBeGreaterThanOrEqual(1.2);
    expect(FX_ORB_PX / 56).toBeLessThanOrEqual(1.3);
    expect(FX_ORB_PX_BIG / 84).toBeGreaterThanOrEqual(1.2);
    expect(FX_ORB_PX_BIG / 84).toBeLessThanOrEqual(1.3);
    expect(FX_ORB_PX_BIG).toBeGreaterThan(FX_ORB_PX);
    expect(FX_FULL_MS).toBeLessThanOrEqual(FX_CAP_MS);
  });

  it('o poder só sai DEPOIS da aura: a aura começa em `start`, o impacto em start + aura + viagem', () => {
    const { slots } = planFx(1, [0, 0], 1000, 1000);
    expect(slots[0]).toEqual({ mode: 'full', start: 1000, end: 1000 + FX_AURA_MS + FX_TRAVEL_MS + FX_NUM_MS });
  });

  it('no máximo 2 poderes completos ao mesmo tempo: o 3º espera a pista ou sai na versão rápida (sem aura nem viagem)', () => {
    const { slots } = planFx(5, [0, 0], 0, 0);
    const full = slots.filter(s => s.mode === 'full');
    const overlap = (t: number) => full.filter(s => s.start <= t && t < s.start + FX_AURA_MS + FX_TRAVEL_MS).length;
    for (let t = 0; t < FX_CAP_MS; t += 25) expect(overlap(t)).toBeLessThanOrEqual(FX_LANES);
    expect(full.length).toBeLessThanOrEqual(FX_LANES);
    expect(slots.filter(s => s.mode === 'quick').length).toBe(5 - full.length);
  });

  it('teto: nenhum efeito termina depois de 2,5 s da janela, por mais longa que seja a cascata', () => {
    const { slots } = planFx(12, [0, 0], 0, 0);
    expect(slots.length).toBe(12);
    slots.forEach(s => expect(s.end).toBeLessThanOrEqual(FX_CAP_MS));
  });

  it('janela já estourada: o número ainda sai (rápido, agora) — o dano mostrado nunca é cortado', () => {
    const { slots } = planFx(2, [9000, 9000], 5000, 0);
    expect(slots.every(s => s.mode === 'quick' && s.start >= 5000)).toBe(true);
  });

  it('é pura: o mesmo pedido dá o mesmo plano', () => {
    expect(planFx(4, [0, 300], 100, 0)).toEqual(planFx(4, [0, 300], 100, 0));
  });
});

describe('D-102: combo 4+ ganha a versão enfeitada', () => {
  it('`big` quando o passo deixou uma especial do elemento; não quando não deixou', () => {
    const base = step([[2, 1], [2, 2], [2, 3], [2, 4]], [0, 0, 0, 0]);
    const ev = [{ by: 'player' as const, element: M3_TILE_ELEMENTS[0], dmg: 7, target: 0 as const }];
    const grande = powerShots({ ...base, created: [{ pos: { r: 2, c: 2 }, tile: { k: 0, sp: 'row' } }] }, ev as never, []);
    const comum = powerShots(base, ev as never, []);
    expect(grande[0].big).toBe(true);
    expect(comum[0].big).toBe(false);
  });
});

describe('D-103: um poder por COMBO', () => {
  it('combo de 3 (ou 4, 5) peças do mesmo elemento = UM tiro; dois elementos no mesmo passo = um tiro cada', () => {
    const trio = step([[2, 1], [2, 2], [2, 3]], [0, 0, 0]);
    const ev = [{ by: 'player' as const, element: M3_TILE_ELEMENTS[0], dmg: 6, target: 0 as const }];
    expect(powerShots(trio, ev as never, [])).toHaveLength(1);
    const cinco = step([[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], [0, 0, 0, 0, 0]);
    expect(powerShots(cinco, ev as never, [])).toHaveLength(1);
    const dois = step([[2, 1], [2, 2], [2, 3], [4, 1], [4, 2], [4, 3]], [0, 0, 0, 1, 1, 1]);
    const ev2 = [...ev, { by: 'player' as const, element: M3_TILE_ELEMENTS[1], dmg: 6, target: 0 as const }];
    expect(powerShots(dois, ev2 as never, [])).toHaveLength(2);
  });
});
