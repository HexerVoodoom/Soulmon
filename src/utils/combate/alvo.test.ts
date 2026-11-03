import { describe, expect, it } from 'vitest';
import { escolherAlvo, tocarAlvo } from './alvo';
import { groupFight, groupFightSteps, type GroupOptions } from './group';
import type { FightSide } from './fight';
import { combatantAt, REFERENCE_BUILDS } from './level';

describe('escolherAlvo', () => {
  it('sem escolha: o 1º vivo (regra automática)', () => {
    expect(escolherAlvo([1, 1, 1])).toBe(0);
    expect(escolherAlvo([0, 0.5, 1])).toBe(1);
    expect(escolherAlvo([0, 0, 0])).toBe(0);
  });
  it('a escolha vale enquanto o inimigo vive', () => {
    expect(escolherAlvo([1, 1, 1], 2)).toBe(2);
    expect(escolherAlvo([0.3, 0.2, 0.1], 1)).toBe(1);
  });
  it('escolhido morto ou inválido: volta à regra automática', () => {
    expect(escolherAlvo([1, 1, 0], 2)).toBe(0);
    expect(escolherAlvo([0, 1, 0], 2)).toBe(1);
    expect(escolherAlvo([1, 1], 5)).toBe(0);
    expect(escolherAlvo([1, 1], -1)).toBe(0);
    expect(escolherAlvo([1, 1], 0.5)).toBe(0);
    expect(escolherAlvo([1, 1], null)).toBe(0);
  });
});

describe('tocarAlvo', () => {
  it('toque num vivo com 2+ inimigos troca a escolha', () => {
    expect(tocarAlvo([1, 1], null, 1)).toBe(1);
    expect(tocarAlvo([1, 1, 1], 1, 2)).toBe(2);
  });
  it('luta 1×1, inimigo caído ou índice fora: mantém', () => {
    expect(tocarAlvo([1], null, 0)).toBeNull();
    expect(tocarAlvo([1, 0], 0, 1)).toBe(0);
    expect(tocarAlvo([1, 1], 0, 3)).toBe(0);
  });
});

describe('groupFight com alvo escolhido', () => {
  const c = combatantAt(13, REFERENCE_BUILDS.balanced);
  const player: FightSide = { combatant: c, special: null };
  const foes: FightSide[] = [{ combatant: c, special: null }, { combatant: c, special: null }, { combatant: c, special: null }];
  const base: GroupOptions = { seed: 1 };

  it('sem `target` é idêntico ao de antes; target fixo em 0 também', () => {
    const a = groupFight(player, foes, base);
    const b = groupFight(player, foes, { ...base, target: () => 0 });
    expect(b).toEqual(a);
  });
  it('mirar o último faz ele cair primeiro; morto, volta ao 1º vivo', () => {
    const strong: FightSide = { combatant: { ...c, bonus: 5 }, special: null };
    const g = groupFightSteps(strong, foes, { ...base, target: () => 2 });
    const kos: number[] = [];
    let r = g.next();
    while (!r.done) { if (r.value.kind === 'ko' && r.value.who > 0) kos.push(r.value.who - 1); r = g.next(r.value.kind === 'cast' ? 1 : undefined); }
    expect(kos.length).toBeGreaterThan(0);
    expect(kos[0]).toBe(2);
    if (kos.length > 1) expect(kos[1]).toBe(0);
  });
});
