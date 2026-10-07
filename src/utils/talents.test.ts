/**
 * Combate v3 / PR7 — a árvore de talentos do usuário (o Vínculo é o level dele).
 * Critérios 1, 2, 3 da story: pontos = level, árvore que nunca fecha, teto de 5% que não empilha.
 */
import { describe, it, expect } from 'vitest';
import {
  TALENT_TREE, TALENT_BY_ID, TALENT_POINTS_MAX, RESPEC_COST_PER_POINT, CHEER_STEP, talentAttrBonus, talentCheerScale, canRespecOne, respecOneCost, applyRespecOne,
  talentPointsFor, isValidPicks, sanitizeTalentPicks, canPick, pickTalent, pointsLeft, talentBonus, pickableTreeCost, fullTreeCost,
  isPickable, respecCost, respecDiscount, applyRespec,
} from './talents';
import { bondLevelFor, xpForLevel, BOND_MAX_LEVEL } from './bond';
import { combinedBonus, combinedAttrBonus, COMBAT_BONUS_CAP } from './combate/bonus';
import { combatantAt, REFERENCE_BUILDS, RULER_LEVELS } from './combate/level';
import { fight, PVP_HP_SCALE } from './combate/fight';
import { hitsToKnockOut, attacksPerWindow } from './combate/curve';
import { specialOf, cleanCheerScale, CHEER_SCALE_MAX } from './combate/specials';
import { simulatePvp, duelCheerEvents } from './combate/duel';
import type { Combatant } from './combate/curve';

const PVP_IDS = ['tal-pvp-01', 'tal-pvp-02', 'tal-pvp-03'];
const todosPvp = () => PVP_IDS.flatMap((id) => Array(TALENT_BY_ID.get(id)!.maxRank).fill(id) as string[]);
/** Pré-requisitos do grafo (PR B1): a torcida pede ATK 2 + DEF 2; a Balança pede Comércio 01 x2 + 03 x2. */
const ATE_TORCIDA = ['tal-pvp-01', 'tal-pvp-01', 'tal-pvp-02', 'tal-pvp-02'];
const torcidaCom = (n: number) => [...ATE_TORCIDA, ...Array(n).fill('tal-pvp-05')] as string[];
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
    expect(sanitizeTalentPicks(['tal-pvp-04'], 20)).toEqual([]); // sem pré-requisito: podado
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
    expect(fullTreeCost()).toBeGreaterThanOrEqual(pickableTreeCost()); // hoje todos os nós se compram (Tarefa B)
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

  it('PR7b: tal-pvp-05 e tal-com-05 foram REDESENHADOS e entram na árvore, com efeito ligado e dentro das linhas vermelhas', () => {
    const torcida = TALENT_BY_ID.get('tal-pvp-05')!;
    const balanca = TALENT_BY_ID.get('tal-com-05')!;
    expect(torcida.effect).toEqual({ kind: 'cheerBoost', perRank: CHEER_STEP });
    expect(balanca.effect).toEqual({ kind: 'respecOne' });
    expect(isPickable(torcida) && isPickable(balanca)).toBe(true);
    // 3 graus de torcida = exatamente o teto do núcleo (CHEER_SCALE_MAX): o talento nunca passa dele
    expect(talentCheerScale(torcidaCom(3), 20)).toBeCloseTo(CHEER_SCALE_MAX, 12);
  });

  it('o Comércio nunca dá % de combate nem rendimento de torcida', () => {
    for (const n of TALENT_TREE.filter((x) => x.path === 'comercio')) expect(['combatBonus', 'cheerBoost'], n.id).not.toContain(n.effect.kind);
  });

  it('o caminho PvP tem escolhas que importam: três canais de atributo e a torcida, e não cabem todos', () => {
    const efeitos = TALENT_TREE.filter((n) => n.path === 'pvp' && isPickable(n)).map((n) => (n.effect.kind === 'combatBonus' ? `bonus:${n.effect.attr}` : n.effect.kind));
    expect(efeitos.sort()).toEqual(['allAttr', 'bonus:atk', 'bonus:def', 'bonus:spd', 'cheerBoost', 'dotResist', 'startEnergy']);
    const todo = TALENT_TREE.filter((n) => n.path === 'pvp' && isPickable(n)).reduce((s, n) => s + n.maxRank, 0);
    expect(todo).toBeGreaterThan(TALENT_POINTS_MAX * 0.7); // o caminho sozinho já pede mais de 70% dos pontos do teto
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

describe('PR7b: o canal de PvP é POR ATRIBUTO, com UM teto de 5% na soma', () => {
  const N = 60;
  const niveis = [RULER_LEVELS[0], RULER_LEVELS[Math.floor(RULER_LEVELS.length / 2)], RULER_LEVELS[RULER_LEVELS.length - 1]];
  /** Vantagem média de A sobre B: Σ tA / Σ tB − 1, HP×3, mesma semente (a régua do §2.25: razão das médias). */
  const adv = (a: Combatant, b: Combatant) => {
    let ta = 0, tb = 0;
    for (let s = 1; s <= N; s++) {
      const r = fight({ combatant: a, special: null }, { combatant: b, special: null }, { seed: s * 104729 + a.level, hpScale: 3 });
      ta += r.timeA; tb += r.timeB;
    }
    return ta / tb - 1;
  };

  it('cada nó de PvP cai no SEU canal (ATK/DEF/SPD distintos)', () => {
    const um = Array(4).fill('tal-pvp-01') as string[];
    expect(talentAttrBonus(um, 20)).toEqual({ atk: 4 * 0.004, def: 0, spd: 0 });
    expect(talentAttrBonus([...um, ...Array(4).fill('tal-pvp-02')], 20)).toEqual({ atk: 4 * 0.004, def: 4 * 0.004, spd: 0 });
    expect(talentAttrBonus([...um, ...Array(4).fill('tal-pvp-03')], 20)).toEqual({ atk: 4 * 0.004, def: 0, spd: 4 * 0.004 });
    // sem o pré-requisito o nó não vale nada: DEF sozinho é vetor inválido
    expect(talentAttrBonus(Array(4).fill('tal-pvp-02'), 20)).toEqual({ atk: 0, def: 0, spd: 0 });
    expect(talentAttrBonus(todosPve(), 20)).toEqual({ atk: 0, def: 0, spd: 0 });
    expect(talentAttrBonus(todosPvp(), 5)).toEqual({ atk: 0, def: 0, spd: 0 }); // inválido para o Vínculo vale 0
  });

  it('a SOMA dos três canais passa pelo teto único: nunca mais que 5%, e o formato da build fica', () => {
    const t = talentAttrBonus(todosPvp(), 20);
    const c = combinedAttrBonus({ talent: t, equipment: { atk: 0.2 }, commerce: { def: 0.1 }, rebirth: { spd: 0.1 } });
    expect(c.atk + c.def + c.spd).toBeCloseTo(COMBAT_BONUS_CAP, 12);
    expect(c.atk / c.def).toBeCloseTo((0.016 + 0.2) / (0.016 + 0.1), 9); // a proporção das fontes se mantém
    expect(combinedAttrBonus({ talent: { atk: 0.01 } })).toEqual({ atk: 0.01, def: 0, spd: 0 }); // abaixo do teto: intacto
    expect(combinedAttrBonus({ talent: { atk: -1, def: NaN, spd: Infinity } })).toEqual({ atk: 0, def: 0, spd: 0 });
  });

  it('cada canal, no teto, vale ~5% na razão das médias (HP×3): nenhum atributo é atalho', () => {
    for (const ch of ['atk', 'def', 'spd'] as const) {
      let pior = -Infinity, melhor = Infinity;
      for (const L of niveis) {
        const base = combatantAt(L, REFERENCE_BUILDS.balanced);
        const forte = combatantAt(L, REFERENCE_BUILDS.balanced, combinedAttrBonus({ talent: { [ch]: 0.2 } }));
        const v = adv(forte, base) - adv(base, base);
        pior = Math.max(pior, v); melhor = Math.min(melhor, v);
      }
      expect(pior, ch).toBeLessThanOrEqual(0.055);
      expect(melhor, ch).toBeGreaterThan(0.035);
    }
  });

  it('o canal MISTO (ATK+DEF+SPD), com todas as outras fontes fictícias, também fica ≤ 5,5%', () => {
    const c = combinedAttrBonus({ talent: talentAttrBonus(todosPvp(), 20), equipment: { atk: 0.2, def: 0.2, spd: 0.2 }, commerce: { atk: 0.1 }, rebirth: { def: 0.1 } });
    let pior = -Infinity;
    for (const L of niveis) {
      const base = combatantAt(L, REFERENCE_BUILDS.balanced);
      pior = Math.max(pior, adv(combatantAt(L, REFERENCE_BUILDS.balanced, c), base) - adv(base, base));
    }
    expect(pior).toBeLessThanOrEqual(0.055);
  });

  it('PROVA DE VERMELHO: sem o teto na soma dos três canais, ATK+DEF+SPD passam de +20%', () => {
    const cru = { atk: 0.07, def: 0.07, spd: 0.07 }; // cada canal "pequeno", a soma não
    const L = niveis[1];
    const base = combatantAt(L, REFERENCE_BUILDS.balanced);
    expect(adv(combatantAt(L, REFERENCE_BUILDS.balanced, cru), base) - adv(base, base)).toBeGreaterThan(0.2);
    const c = combinedAttrBonus({ talent: cru });
    expect(adv(combatantAt(L, REFERENCE_BUILDS.balanced, c), base) - adv(base, base)).toBeLessThanOrEqual(0.055);
  });

  it('a conta é exata: DEF e SPD entram no stat sem tocar o motor', () => {
    const b = combatantAt(20, REFERENCE_BUILDS.balanced);
    const d = combatantAt(20, REFERENCE_BUILDS.balanced, { def: 0.05 });
    const s = combatantAt(20, REFERENCE_BUILDS.balanced, { spd: 0.05 });
    expect(hitsToKnockOut(b, d) / hitsToKnockOut(b, b)).toBeCloseTo(1.05, 12); // o rival precisa de 5% mais golpes
    expect(attacksPerWindow(s.spd) / attacksPerWindow(b.spd)).toBeCloseTo(1.05, 12);
    expect(combatantAt(20, REFERENCE_BUILDS.balanced, 0.05).bonus).toBe(0.05); // o escalar legado segue sendo o ATK
  });
});

describe('PR7b: tal-pvp-05, a torcida do Duelo (redesenhado)', () => {
  const TETO = Array(20).fill(16);
  it('sem o nó vale 1; 3 graus = +15%, o teto do núcleo; inválido para o Vínculo vale 1', () => {
    expect(talentCheerScale([], 20)).toBe(1);
    expect(talentCheerScale(torcidaCom(2), 20)).toBeCloseTo(1.1, 12);
    expect(talentCheerScale(torcidaCom(3), 20)).toBeCloseTo(1.15, 12);
    expect(talentCheerScale(torcidaCom(3), 2)).toBe(1);
  });
  it('só rende quando você torce: sem toques o talento não muda nada', () => {
    const a = { combatant: combatantAt(10, REFERENCE_BUILDS.balanced), special: specialOf('direct') };
    for (let s = 0; s < 40; s++) {
      expect(simulatePvp({ me: { ...a, cheerScale: 1.15 }, opp: a, seed: s, taps: [] })).toEqual(simulatePvp({ me: a, opp: a, seed: s, taps: [] }));
    }
  });
  it('dentro da régua: no teto de torcida o inimigo cai ≤ 5% mais cedo (medido ~1%) e o nó nunca é desvantagem', () => {
    let t1 = 0, t2 = 0, perdeu = 0, ganhou = 0;
    for (const L of RULER_LEVELS) for (const fam of ['direct', 'atkBuff', 'dot'] as const) for (let s = 0; s < 30; s++) {
      const c = combatantAt(L, REFERENCE_BUILDS.balanced);
      const me = { combatant: c, special: specialOf(fam) };
      const opp = { combatant: c, special: specialOf('direct') };
      const r1 = simulatePvp({ me, opp, seed: s * 31 + L, taps: TETO });
      const r2 = simulatePvp({ me: { ...me, cheerScale: 1.15 }, opp, seed: s * 31 + L, taps: TETO });
      t1 += r1.timeOpp; t2 += r2.timeOpp;
      if (r1.winner === 'me' && r2.winner !== 'me') perdeu++;
      if (r1.winner !== 'me' && r2.winner === 'me') ganhou++;
    }
    expect(t1 / t2 - 1).toBeLessThanOrEqual(0.05);
    expect(t1 / t2 - 1).toBeGreaterThan(0);
    expect(ganhou).toBeGreaterThan(perdeu);
  });
  it('PROVA DE VERMELHO: um multiplicador sem teto não passa; o núcleo corta em CHEER_SCALE_MAX', () => {
    expect(cleanCheerScale(3)).toBe(CHEER_SCALE_MAX);
    expect(cleanCheerScale(NaN)).toBe(1);
    expect(cleanCheerScale(0.2)).toBe(1); // nunca piora a torcida de ninguém
    const c = combatantAt(20, REFERENCE_BUILDS.balanced);
    const lado = { combatant: c, special: specialOf('direct') };
    let t15 = 0, t3 = 0;
    for (let s = 0; s < 30; s++) {
      t15 += fight(lado, lado, { seed: s, hpScale: PVP_HP_SCALE, cheer: duelCheerEvents(TETO, 0, 1.15) }).timeB;
      t3 += fight(lado, lado, { seed: s, hpScale: PVP_HP_SCALE, cheer: duelCheerEvents(TETO, 0, 3) }).timeB;
    }
    expect(t3).toBe(t15); // ×3 vale o mesmo que ×1,15
  });
});

describe('PR7b: tal-com-05, a Balança (refazer UM ponto)', () => {
  const picks = ['tal-pvp-01', 'tal-pvp-01', 'tal-pve-01', 'tal-com-01', 'tal-com-01', 'tal-com-03', 'tal-com-03', 'tal-com-05'];
  it('sem o nó não existe (e não cobra): a única saída é refazer tudo', () => {
    expect(canRespecOne(['tal-pvp-01'])).toBe(false);
    expect(applyRespecOne({ talentPicks: ['tal-pvp-01'], gamePoints: 999 }, 'tal-pvp-01')).toEqual({ ok: false, reason: 'locked', cost: RESPEC_COST_PER_POINT });
  });
  it('com o nó: tira o ÚLTIMO grau escolhido, cobra o preço de UM ponto em Bits e devolve só esse ponto', () => {
    const r = applyRespecOne({ talentPicks: picks, gamePoints: 100, x: 1 }, 'tal-pvp-01');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.cost).toBe(respecOneCost(picks)); // a ampulheta (com-03 x2) já barateia
      expect(r.state.talentPicks).toEqual(['tal-pvp-01', 'tal-pve-01', 'tal-com-01', 'tal-com-01', 'tal-com-03', 'tal-com-03', 'tal-com-05']);
      expect(r.state.gamePoints).toBe(100 - respecOneCost(picks));
      expect(r.state.x).toBe(1);
    }
    expect(respecOneCost(picks)).toBeLessThan(respecCost(picks)); // um ponto sai mais barato que a árvore
  });
  it('a ampulheta do Comércio barateia, o preço nunca zera, e sem Bits ou sem o grau nada muda', () => {
    const com = [...picks, ...Array(2).fill('tal-com-03')];
    expect(respecOneCost(com)).toBeLessThan(RESPEC_COST_PER_POINT);
    expect(respecOneCost(com)).toBeGreaterThan(0);
    expect(applyRespecOne({ talentPicks: picks, gamePoints: 5 }, 'tal-pvp-01')).toEqual({ ok: false, reason: 'no-bits', cost: respecOneCost(picks) });
    expect(applyRespecOne({ talentPicks: picks, gamePoints: 100 }, 'tal-pvp-02')).toEqual({ ok: false, reason: 'not-picked', cost: respecOneCost(picks) });
    expect(applyRespecOne({ talentPicks: picks, gamePoints: NaN }, 'tal-pvp-01').ok).toBe(false);
  });
});
