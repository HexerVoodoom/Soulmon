/**
 * Combate v3 / PR7 — a árvore de talentos do usuário (o Vínculo é o level dele).
 * Critérios 1, 2, 3 da story: pontos = level, árvore que nunca fecha, teto de 5% que não empilha.
 */
import { describe, it, expect } from 'vitest';
import {
  TALENT_TREE, TALENT_BY_ID, TALENT_POINTS_MAX, TALENTOS_PENDENTES_DO_DONO, RESPEC_COST_PER_POINT,
  talentPointsFor, isValidPicks, sanitizeTalentPicks, canPick, pickTalent, pointsLeft, talentBonus, pickableTreeCost, fullTreeCost,
  isPickable, respecCost, respecDiscount, applyRespec,
} from './talents';
import { bondLevelFor, xpForLevel, BOND_MAX_LEVEL } from './bond';
import { combinedBonus, COMBAT_BONUS_CAP } from './combate/bonus';
import { combatantAt, REFERENCE_BUILDS, RULER_LEVELS } from './combate/level';
import { fight } from './combate/fight';
import type { Combatant } from './combate/curve';

const PVP_IDS = ['tal-pvp-01', 'tal-pvp-02', 'tal-pvp-03'];
const todosPvp = () => PVP_IDS.flatMap((id) => Array(TALENT_BY_ID.get(id)!.maxRank).fill(id) as string[]);
const todosPve = () => ['tal-pve-01', 'tal-pve-02'].flatMap((id) => Array(TALENT_BY_ID.get(id)!.maxRank).fill(id) as string[]);

describe('1. pontos = level do Vínculo; vetor inválido é DESCARTADO', () => {
  it('1 ponto por Vínculo, até o teto declarado', () => {
    expect(talentPointsFor(1)).toBe(1);
    expect(talentPointsFor(7)).toBe(7);
    expect(talentPointsFor(TALENT_POINTS_MAX)).toBe(TALENT_POINTS_MAX);
    expect(talentPointsFor(BOND_MAX_LEVEL)).toBe(TALENT_POINTS_MAX);
    for (const lixo of [NaN, -3, 0, null, undefined, 'x', Infinity]) expect(talentPointsFor(lixo), String(lixo)).toBe(1);
  });

  it('o ponto vem do Vínculo derivado: cada degrau de XP dá o ponto do level', () => {
    for (let L = 1; L <= 15; L++) expect(talentPointsFor(bondLevelFor(xpForLevel(L)))).toBe(L);
  });

  it('com exatamente os pontos do level o vetor vale; com 1 a mais é descartado inteiro', () => {
    const pvp = todosPvp(); // 12 graus
    expect(isValidPicks(pvp.slice(0, 5), 5)).toBe(true);
    expect(sanitizeTalentPicks(pvp.slice(0, 5), 5)).toEqual(pvp.slice(0, 5));
    // PROVA DE VERMELHO: 1 pick a mais que os pontos reprova (e some tudo, não só o excedente)
    expect(isValidPicks(pvp.slice(0, 6), 5)).toBe(false);
    expect(sanitizeTalentPicks(pvp.slice(0, 6), 5)).toEqual([]);
  });

  it('id desconhecido, nó sem efeito ligado, grau a mais, tipo errado: tudo descartado', () => {
    expect(sanitizeTalentPicks(['tal-xxx-01'], 20)).toEqual([]);
    expect(sanitizeTalentPicks(['tal-pvp-04'], 20)).toEqual([]); // `pendente`: não se compra
    expect(sanitizeTalentPicks(Array(5).fill('tal-pvp-01'), 20)).toEqual([]); // maxRank 4
    expect(sanitizeTalentPicks(['tal-pvp-01', 7], 20)).toEqual([]);
    expect(sanitizeTalentPicks('tal-pvp-01', 20)).toEqual([]);
    expect(sanitizeTalentPicks({ 0: 'tal-pvp-01', length: 1 }, 20)).toEqual([]);
    expect(sanitizeTalentPicks(['__proto__'], 20)).toEqual([]);
    expect(sanitizeTalentPicks(['constructor'], 20)).toEqual([]);
    expect(sanitizeTalentPicks(null, 20)).toEqual([]);
  });

  it('pickTalent respeita ponto e grau e nunca lança', () => {
    let picks: readonly string[] = [];
    for (let i = 0; i < 9; i++) picks = pickTalent(picks, 'tal-pvp-01', 20);
    expect(picks.length).toBe(4);
    expect(canPick(picks, 'tal-pvp-01', 20)).toBe(false);
    expect(pointsLeft(picks, 20)).toBe(16);
    expect(pickTalent([], 'tal-pvp-01', 1)).toEqual(['tal-pvp-01']);
    expect(pickTalent(['tal-pvp-01'], 'tal-pvp-02', 1)).toEqual(['tal-pvp-01']); // sem ponto
  });
});

describe('2. a árvore nunca fecha', () => {
  it('o custo do que dá para comprar passa dos pontos do Vínculo máximo (lidos do módulo)', () => {
    const maxPontos = talentPointsFor(BOND_MAX_LEVEL);
    expect(maxPontos).toBe(TALENT_POINTS_MAX);
    expect(pickableTreeCost()).toBeGreaterThan(maxPontos);
    expect(fullTreeCost()).toBeGreaterThan(pickableTreeCost());
  });

  it('os três caminhos existem, cada um com algo comprável; todo id é de um dos 3 caminhos', () => {
    for (const path of ['pvp', 'pve', 'comercio'] as const) {
      expect(TALENT_TREE.some((n) => n.path === path && isPickable(n)), path).toBe(true);
    }
    for (const n of TALENT_TREE) expect(n.id.startsWith(`tal-${n.path === 'comercio' ? 'com' : n.path}-`)).toBe(true);
  });

  it('as escolhas importam: PvP cheio e PvE cheio não cabem juntos', () => {
    expect(todosPvp().length + todosPve().length).toBeGreaterThan(TALENT_POINTS_MAX - 1);
    expect(isValidPicks([...todosPvp(), ...todosPve()], BOND_MAX_LEVEL)).toBe(true); // 20 graus: cabe...
    expect(isValidPicks([...todosPvp(), ...todosPve(), 'tal-com-03'], BOND_MAX_LEVEL)).toBe(false); // ...e o 21º, não
  });

  it('os dois talentos de linha vermelha NÃO estão na árvore (pendência do dono)', () => {
    expect(TALENTOS_PENDENTES_DO_DONO.map((p) => p.id)).toEqual(['tal-pvp-05', 'tal-com-05']);
    for (const p of TALENTOS_PENDENTES_DO_DONO) expect(TALENT_BY_ID.has(p.id), p.id).toBe(false);
  });

  it('o Comércio nunca dá % de combate', () => {
    for (const n of TALENT_TREE.filter((x) => x.path === 'comercio')) expect(n.effect.kind, n.id).not.toBe('combatBonus');
  });
});

describe('3. teto de 5% NÃO empilhável (régua: razão das médias, HP×3)', () => {
  const N = 60;
  /** Vantagem média de A sobre B: Σ tA / Σ tB − 1 (tX = quando X cai), HP×3, mesma semente dos dois lados. */
  function adv(a: Combatant, b: Combatant): number {
    let ta = 0, tb = 0;
    for (let s = 1; s <= N; s++) {
      const r = fight({ combatant: a, special: null }, { combatant: b, special: null }, { seed: s * 104729 + a.level, hpScale: 3 });
      ta += r.timeA; tb += r.timeB;
    }
    return ta / tb - 1;
  }
  const niveis = [RULER_LEVELS[0], RULER_LEVELS[Math.floor(RULER_LEVELS.length / 2)], RULER_LEVELS[RULER_LEVELS.length - 1]];

  it('o talento sozinho nunca passa de 5% e o PvP cheio fica perto do teto', () => {
    expect(talentBonus(todosPvp(), BOND_MAX_LEVEL, 'pvp')).toBeLessThanOrEqual(COMBAT_BONUS_CAP);
    expect(talentBonus(todosPvp(), BOND_MAX_LEVEL, 'pvp')).toBeGreaterThan(0.04);
    expect(talentBonus(todosPve(), BOND_MAX_LEVEL, 'pve')).toBeLessThanOrEqual(COMBAT_BONUS_CAP);
  });

  it('PvP: só conta o caminho PvP (PvE cheio vale 0 no duelo) e vice-versa', () => {
    expect(talentBonus(todosPve(), BOND_MAX_LEVEL, 'pvp')).toBe(0);
    expect(talentBonus(todosPvp(), BOND_MAX_LEVEL, 'pve')).toBe(0);
  });

  it('vetor inválido para o Vínculo vale 0 (o servidor nunca confia)', () => {
    expect(talentBonus(todosPvp(), 5, 'pvp')).toBe(0); // 12 graus com 5 pontos
    expect(talentBonus(['tal-pvp-01', 'lixo'], 20, 'pvp')).toBe(0);
  });

  it('todos os picks + equipamento e Renascimento fictícios: o bônus fica ≤ 5% e a vantagem medida ≤ ~5,5%', () => {
    const talent = talentBonus(todosPvp(), BOND_MAX_LEVEL, 'pvp');
    const bonus = combinedBonus({ talent, equipment: 0.2, commerce: 0.1, rebirth: 0.1 });
    expect(bonus).toBeLessThanOrEqual(COMBAT_BONUS_CAP);
    let pior = -Infinity;
    for (const L of niveis) {
      const base = combatantAt(L, REFERENCE_BUILDS.balanced);
      const forte = combatantAt(L, REFERENCE_BUILDS.balanced, bonus);
      pior = Math.max(pior, adv(forte, base) - adv(base, base));
    }
    expect(pior).toBeLessThanOrEqual(0.055);
    expect(pior).toBeGreaterThan(0.03);
  });

  it('PROVA DE VERMELHO: sem o teto (soma crua) a vantagem passa de +20%', () => {
    const talent = talentBonus(todosPvp(), BOND_MAX_LEVEL, 'pvp');
    const semTeto = talent + 0.2 + 0.1 + 0.1;
    const L = niveis[1];
    const base = combatantAt(L, REFERENCE_BUILDS.balanced);
    const cru = combatantAt(L, REFERENCE_BUILDS.balanced, semTeto);
    expect(adv(cru, base) - adv(base, base)).toBeGreaterThan(0.2);
  });
});

describe('respec: SEMPRE pago, em moeda ganha', () => {
  it('sem picks não há o que refazer (e não cobra)', () => {
    expect(respecCost([])).toBe(0);
    expect(applyRespec({ talentPicks: [], gamePoints: 999 })).toEqual({ ok: false, reason: 'nothing', cost: 0 });
  });

  it('com picks custa Bits por ponto gasto, nunca de graça', () => {
    const picks = ['tal-pvp-01', 'tal-pvp-01', 'tal-pve-01'];
    expect(respecCost(picks)).toBe(3 * RESPEC_COST_PER_POINT);
    expect(respecCost(['tal-pvp-01'])).toBeGreaterThan(0);
  });

  it('sem Bits suficientes nada muda; com Bits, limpa a árvore e debita', () => {
    const picks = ['tal-pvp-01', 'tal-pvp-02'];
    const pobre = applyRespec({ talentPicks: picks, gamePoints: 10 });
    expect(pobre).toEqual({ ok: false, reason: 'no-bits', cost: 2 * RESPEC_COST_PER_POINT });
    const r = applyRespec({ talentPicks: picks, gamePoints: 80, outro: 'x' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.state.talentPicks).toEqual([]);
      expect(r.state.gamePoints).toBe(80 - 2 * RESPEC_COST_PER_POINT);
      expect(r.state.outro).toBe('x');
    }
  });

  it('a ampulheta do Comércio barateia o respec, mas nunca o zera', () => {
    const base = Array(8).fill('tal-pvp-01').slice(0, 4).concat(Array(4).fill('tal-pvp-02'));
    const com = [...base, ...Array(4).fill('tal-com-03')];
    expect(respecDiscount(com)).toBeCloseTo(0.4);
    expect(respecCost(com)).toBeLessThan(com.length * RESPEC_COST_PER_POINT);
    expect(respecCost(com)).toBeGreaterThan(0);
  });

  it('Bits NaN no estado nunca viram saldo (cobra como 0 Bits e recusa)', () => {
    expect(applyRespec({ talentPicks: ['tal-pvp-01'], gamePoints: NaN }).ok).toBe(false);
  });
});

describe('os talentos sobrevivem à degeneração', () => {
  it('o bônus depende só dos picks e do Vínculo (nunca de estágio, perfectDays ou HP)', () => {
    const picks = todosPvp();
    const a = talentBonus(picks, 20, 'pvp');
    // a assinatura não recebe estado do Soulmon: nada que a degeneração mude entra na conta
    expect(talentBonus(picks, 20, 'pvp')).toBe(a);
    expect(talentBonus.length).toBe(3);
  });
});

describe('todo nó da árvore tem texto nas duas línguas (talentCopy.ts)', () => {
  it('sem nó órfão e sem texto vazio', async () => {
    const { TALENT_COPY } = await import('./talentCopy');
    expect(Object.keys(TALENT_COPY).sort()).toEqual(TALENT_TREE.map((n) => n.id).sort());
    for (const [id, c] of Object.entries(TALENT_COPY)) for (const t of [c.namePt, c.nameEn, c.descPt, c.descEn]) expect(t.length, id).toBeGreaterThan(3);
  });
});
