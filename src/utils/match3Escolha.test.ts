/**
 * §487 — a escolha de 3 do Elemental Fusion (regra pura): sorteio determinístico por semente, 3 opções, redraw, Aventura por ELEMENTO
 * com o time de 4 daquele elemento, PvP só com jogadores (sem demo) e o boss decidido antes.
 */
import { describe, it, expect } from 'vitest';
import { M3_CHOICES, M3_REDRAWS_PER_VISIT, adventureChoices, adventureElementPool, isDemoOpponent, pvpChoices } from './match3Escolha';
import { isBossMatch } from './match3Boss';
import { newCombat } from './match3Combat';
import { mulberry32 } from './combate/rng';
import { mixedElementsForSeed } from './match3Pvp';
import { rosterEntryOfKey } from './enemyRoster';

const art = () => ({ sprite: 's.png' });
const opp = (id: string, level = 10) => ({ id, petName: `P${id}`, stage: 'rookie', duel: { level } });

/** Uma semente de tela que NÃO é de boss (e uma que é), achadas pela própria regra. */
const semBoss = (() => { let s = 1; while (isBossMatch(s)) s++; return s; })();
const comBoss = (() => { let s = 1; while (!isBossMatch(s)) s++; return s; })();

describe('match3Escolha — Aventura', () => {
  it('3 opções, elementos distintos, determinístico pela semente; outra semente sorteia outra lista', () => {
    const a = adventureChoices(42);
    expect(a).toHaveLength(M3_CHOICES);
    expect(new Set(a.map(c => c.element)).size).toBe(3);
    expect(adventureChoices(42)).toEqual(a);
    const outras = [43, 44, 45, 46].map(s => adventureChoices(s).map(c => `${c.element}:${c.seed}`).join());
    expect(outras.some(o => o !== a.map(c => `${c.element}:${c.seed}`).join())).toBe(true);
    for (const c of a) expect(adventureElementPool()).toContain(c.element);
  });

  it('o time de 4 da opção é DAQUELE elemento (com level) e é o mesmo para a mesma semente', () => {
    for (const s of [1, 2, 3, 7, 99]) {
      for (const c of adventureChoices(s)) {
        const mk = () => newCombat(mulberry32(c.seed + 99), [], undefined, 20, undefined, { elements: mixedElementsForSeed(c.seed), element: c.element });
        const comb = mk();
        expect(comb.enemies).toHaveLength(4);
        expect(comb.enemies.map(e => rosterEntryOfKey(e.roster)?.element)).toEqual([c.element, c.element, c.element, c.element]);
        expect(mk().enemies.map(e => e.roster)).toEqual(comb.enemies.map(e => e.roster));
      }
    }
  });
});

describe('match3Escolha — PvP', () => {
  it('até 3 jogadores da rota, sem demo; lista curta = menos linhas; sem jogador inventado', () => {
    const lista = [opp('a'), { id: 'demo-1', stage: 'rookie' }, opp('b'), { stage: 'rookie' }, opp('c', 30), opp('d')];
    const c = pvpChoices(semBoss, lista, 10, art);
    expect(c.map(x => x.opponentId)).toEqual(['a', 'b', 'c']);
    expect(c.every(x => x.foe?.kind === 'player' && !x.foe.simulated && !x.foe.roster)).toBe(true);
    expect(c[2].foe!.level).toBe(30);
    expect(pvpChoices(semBoss, [opp('a')], 10, art)).toHaveLength(1);
    expect(pvpChoices(semBoss, [], 10, art)).toEqual([]);
    expect(pvpChoices(semBoss, [{ id: 'x', demo: true }], 10, art)).toEqual([]);
  });

  it('as linhas de jogador nunca escondem um boss; determinístico pela semente', () => {
    for (let s = 1; s < 200; s++) {
      if (isBossMatch(s)) continue;
      for (const c of pvpChoices(s, [opp('a'), opp('b'), opp('c')], 10, art)) expect(isBossMatch(c.seed)).toBe(false);
    }
    expect(pvpChoices(semBoss, [opp('a'), opp('b')], 10, art)).toEqual(pvpChoices(semBoss, [opp('a'), opp('b')], 10, art));
  });

  it('boss decidido ANTES (semente da tela): só a linha do boss, sem jogador', () => {
    const c = pvpChoices(comBoss, [opp('a'), opp('b'), opp('c')], 10, art);
    expect(c).toEqual([{ mode: 'pvp', seed: comBoss, boss: true }]);
  });

  it('isDemoOpponent: sem id, flag demo ou id de demo; simulado do servidor passa', () => {
    expect(isDemoOpponent({})).toBe(true);
    expect(isDemoOpponent({ id: 'demo_x' })).toBe(true);
    expect(isDemoOpponent({ id: 'abc', demo: true })).toBe(true);
    expect(isDemoOpponent({ id: 'sim-123', simulated: true })).toBe(false);
  });

  it('redraw: 1 grátis por visita (a regra do Torneio ranqueado)', () => {
    expect(M3_REDRAWS_PER_VISIT).toBe(1);
  });
});
