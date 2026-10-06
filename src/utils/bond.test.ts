import { describe, it, expect } from 'vitest';
import {
  BOND_LAST_TITLED_LEVEL,
  bondXP, applyBondXP, bondXPForDay, bondCapSource, BOND_DAILY_CAP,
  bondLevelFor, xpForLevel, bondProgress, bondRewardFor, bondRewardLadder,
  bondTitle, unclaimedBondRewards,
  XP_PER_EFFORT, XP_TOURNAMENT_WIN, XP_TOURNAMENT_LOSS,
  type BondEvent,
} from './bond';
import { ALL_SHOP_ITEMS } from './shop';
import { DREAM_CATALOG } from './restWindow';
import { HABIT_TIER_BONUS } from '../types/taskModel';

// Perfil de XP usado na calibragem (docs/PLANO-PRODUTO.md, Parte 4).
const GOOD_DAY = 165;
const MIN_DAY = 25;

/** Primeiro dia (1-based) em que o acumulado alcança o nível `n`. */
function dayLevelLands(perDay: readonly number[], n: number): number {
  let acc = 0;
  for (let i = 0; i < perDay.length; i++) {
    acc += perDay[i];
    if (bondLevelFor(acc) >= n) return i + 1;
  }
  return Infinity;
}

describe('tabela de XP — só relê eventos que já existem', () => {
  it('conclusão rende 10 por peso de esforço', () => {
    expect(bondXP({ kind: 'completion', weight: 1 })).toBe(XP_PER_EFFORT);
    expect(bondXP({ kind: 'completion', weight: 3 })).toBe(XP_PER_EFFORT * 3);
  });

  it('multiplicador do tier reusa HABIT_TIER_BONUS e é sempre ≥ 1', () => {
    const base = bondXP({ kind: 'completion', weight: 1, habitTier: 'seed' });
    expect(base).toBe(XP_PER_EFFORT);
    for (const tier of ['seed', 'sprout', 'sapling', 'tree'] as const) {
      const got = bondXP({ kind: 'completion', weight: 10, habitTier: tier });
      expect(got).toBe(Math.round(XP_PER_EFFORT * 10 * (1 + HABIT_TIER_BONUS[tier])));
      expect(got).toBeGreaterThanOrEqual(XP_PER_EFFORT * 10);
    }
  });

  it('DERROTA DE TORNEIO RENDE XP — falha não pune', () => {
    const loss = bondXP({ kind: 'tournamentMatch', won: false });
    expect(loss).toBe(XP_TOURNAMENT_LOSS);
    expect(loss).toBeGreaterThan(0);
    expect(loss).toBeLessThan(XP_TOURNAMENT_WIN);
  });

  it('marcos 7/21/66 rendem 100/200/400', () => {
    expect(bondXP({ kind: 'habitMilestone', days: 7 })).toBe(100);
    expect(bondXP({ kind: 'habitMilestone', days: 21 })).toBe(200);
    expect(bondXP({ kind: 'habitMilestone', days: 66 })).toBe(400);
    expect(bondXP({ kind: 'habitMilestone', days: 5 })).toBe(0);
  });

  it('NENHUM evento devolve XP negativo — nem com entrada corrompida', () => {
    const events: BondEvent[] = [
      { kind: 'completion', weight: -5 },
      { kind: 'completion', weight: NaN },
      { kind: 'completion', weight: 0 },
      { kind: 'perfectDay' }, { kind: 'restNight' }, { kind: 'dreamNew' },
      { kind: 'nightmareCleared' }, { kind: 'dungeonFloor' }, { kind: 'dungeonRun' },
      { kind: 'tournamentMatch', won: true }, { kind: 'tournamentMatch', won: false },
      { kind: 'habitMilestone', days: 7 }, { kind: 'habitMilestone', days: NaN },
      { kind: 'triageCleared' }, { kind: 'checkIn' },
    ];
    for (const ev of events) {
      const xp = bondXP(ev);
      expect(Number.isFinite(xp)).toBe(true);
      expect(xp).toBeGreaterThanOrEqual(0);
      expect(applyBondXP(ev).xp).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('teto diário SUAVE — para de somar, nunca subtrai', () => {
  it('só masmorra e torneio têm teto', () => {
    expect(bondCapSource({ kind: 'dungeonFloor' })).toBe('dungeon');
    expect(bondCapSource({ kind: 'dungeonRun' })).toBe('dungeon');
    expect(bondCapSource({ kind: 'tournamentMatch', won: true })).toBe('tournament');
    expect(bondCapSource({ kind: 'completion', weight: 1 })).toBeNull();
    expect(bondCapSource({ kind: 'perfectDay' })).toBeNull();
    expect(bondCapSource({ kind: 'checkIn' })).toBeNull();
  });

  it('ao bater o teto o ganho vira 0 e o total NUNCA diminui', () => {
    const many: BondEvent[] = Array.from({ length: 200 }, () => ({ kind: 'dungeonFloor' }) as BondEvent);
    let spent = {};
    let total = 0;
    let last = 0;
    for (const ev of many) {
      const gain = applyBondXP(ev, spent);
      expect(gain.xp).toBeGreaterThanOrEqual(0);
      total += gain.xp;
      expect(total).toBeGreaterThanOrEqual(last);
      last = total;
      spent = gain.spent;
    }
    expect(total).toBe(BOND_DAILY_CAP.dungeon);
    // e o ledger nunca passa do teto nem regride
    expect((spent as Record<string, number>).dungeon).toBe(BOND_DAILY_CAP.dungeon);
    // depois de saturado, mais um evento rende exatamente 0 (e sinaliza capped)
    const after = applyBondXP({ kind: 'dungeonRun' }, spent);
    expect(after.xp).toBe(0);
    expect(after.capped).toBe(true);
    expect(after.spent.dungeon).toBe(BOND_DAILY_CAP.dungeon);
  });

  it('os tetos são independentes e não vazam de uma fonte para a outra', () => {
    let { spent } = bondXPForDay(
      Array.from({ length: 50 }, () => ({ kind: 'dungeonRun' }) as BondEvent),
    );
    expect(spent.dungeon).toBe(BOND_DAILY_CAP.dungeon);
    const t = applyBondXP({ kind: 'tournamentMatch', won: false }, spent);
    expect(t.xp).toBe(XP_TOURNAMENT_LOSS);
    spent = t.spent;

    // fontes SEM teto seguem rendendo integralmente mesmo com tudo saturado
    const free = applyBondXP({ kind: 'completion', weight: 3 }, spent);
    expect(free.xp).toBe(30);
    expect(free.capped).toBe(false);
  });

  it('bater o teto não custa nada: nenhuma chamada devolve valor negativo', () => {
    const events: BondEvent[] = Array.from({ length: 40 }, (_, i) =>
      i % 2 ? { kind: 'tournamentMatch', won: false } : { kind: 'dungeonFloor' });
    const { xp, spent } = bondXPForDay(events);
    expect(xp).toBeGreaterThanOrEqual(0);
    expect(spent.dungeon!).toBeLessThanOrEqual(BOND_DAILY_CAP.dungeon);
    expect(spent.tournament!).toBeLessThanOrEqual(BOND_DAILY_CAP.tournament);
  });
});

describe('curva — os níveis 1 a 4 são os que importam, na primeira semana', () => {
  it('xpForLevel é monótona, começa em 0 e não tem cap', () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(0)).toBe(0);
    for (let n = 1; n < 60; n++) {
      expect(xpForLevel(n + 1)).toBeGreaterThan(xpForLevel(n));
    }
    expect(bondLevelFor(xpForLevel(50))).toBe(50); // sem teto de nível
  });

  it('a tabela documentada: 0 / 75 / 200 / 400 / 700 / 1100', () => {
    expect([1, 2, 3, 4, 5, 6].map(xpForLevel)).toEqual([0, 75, 200, 400, 700, 1100]);
  });

  it('nível 2 (1ª recompensa visível) cai no DIA 1 num dia bom', () => {
    const dias = Array(7).fill(GOOD_DAY);
    expect(dayLevelLands(dias, 2)).toBe(1);
  });

  it('nível 3 (2ª recompensa) cai até o DIA 3 mesmo no perfil misto', () => {
    const bom = Array(7).fill(GOOD_DAY);
    expect(dayLevelLands(bom, 3)).toBeLessThanOrEqual(3);

    // 165 no dia 1, depois dois dias mínimos: 165 / 190 / 215
    const misto = [GOOD_DAY, MIN_DAY, MIN_DAY, GOOD_DAY, MIN_DAY, MIN_DAY, GOOD_DAY];
    expect(dayLevelLands(misto, 2)).toBe(1);
    expect(dayLevelLands(misto, 3)).toBe(3);
    // nível 4 ainda dentro da primeira semana
    expect(dayLevelLands(misto, 4)).toBeLessThanOrEqual(7);
  });

  it('bondProgress nunca devolve número negativo nem barra > 1', () => {
    for (const xp of [-999, NaN, 0, 1, 74, 75, 199, 200, 5000, 1e6]) {
      const p = bondProgress(xp as number);
      expect(p.level).toBeGreaterThanOrEqual(1);
      expect(p.into).toBeGreaterThanOrEqual(0);
      expect(p.need).toBeGreaterThan(0);
      expect(p.ratio).toBeGreaterThanOrEqual(0);
      expect(p.ratio).toBeLessThanOrEqual(1);
      expect(p.into).toBeLessThan(p.need);
    }
  });

  it('o nível nunca desce quando o XP sobe', () => {
    let prev = 1;
    for (let xp = 0; xp < 20000; xp += 37) {
      const lvl = bondLevelFor(xp);
      expect(lvl).toBeGreaterThanOrEqual(prev);
      prev = lvl;
    }
  });
});

describe('progresso dotado — save antigo já nasce em nível > 1', () => {
  it('um save existente com totalXP acumulado começa acima do nível 1, de graça', () => {
    // saves reais dos testes do repo: 420, 900, 1200
    for (const xp of [420, 900, 1200]) {
      expect(bondLevelFor(xp)).toBeGreaterThan(1);
    }
    expect(bondLevelFor(900)).toBe(5);
    // e a barra dele já começa preenchida — ninguém vê 0%
    expect(bondProgress(900).ratio).toBeGreaterThan(0);
  });

  it('mesmo um save modesto (o +10 por ponto de atributo ao alimentar) sobe de nível', () => {
    // 8 refeições dando 1 ponto de atributo cada = 80 XP
    expect(bondLevelFor(80)).toBeGreaterThan(1);
  });

  it('save zerado começa em nível 1 e nunca em nível 0 ou negativo', () => {
    expect(bondLevelFor(0)).toBe(1);
    expect(bondLevelFor(-500)).toBe(1);
    expect(bondLevelFor(NaN as unknown as number)).toBe(1);
  });
});

/**
 * INVARIANTE 3 REESCRITO (06/10/2026, Combate v3 / PR7, REGISTRO §24 itens 1 e 2).
 * ANTES: "as recompensas do Vínculo são 100% cosméticas, nunca vantagem de combate" e "escada de gates é
 * grind". AGORA: o Vínculo é o level do usuário (1 ponto de talento por Vínculo, portões em `gates.ts`).
 * O que continua valendo, e é o que este bloco trava: o CATÁLOGO `BOND_REWARDS` segue cosmético, e a
 * única vantagem de combate entra por talento, sob o teto único de 5%, sem nenhum caminho pago.
 */
describe('invariante 3 (reescrito): o catálogo de recompensas segue cosmético; a vantagem é só por talento, com teto', () => {
  it('o Vínculo dá ponto de talento (efeito de jogo novo) e abre portões', async () => {
    const { talentPointsFor } = await import('./talents');
    const { gateFor } = await import('./gates');
    expect(talentPointsFor(bondLevelFor(xpForLevel(6)))).toBe(6);
    expect(gateFor('pvp', bondLevelFor(xpForLevel(5))).open).toBe(true);
    expect(gateFor('pvp', bondLevelFor(xpForLevel(4))).open).toBe(false);
  });

  it('o ÚNICO efeito de combate do Vínculo é o talento, e ele nunca passa do teto único de 5%', async () => {
    const { talentBonus, TALENT_TREE, isPickable } = await import('./talents');
    const { COMBAT_BONUS_CAP } = await import('./combate/bonus');
    const tudo = TALENT_TREE.filter(isPickable).flatMap((n) => Array(n.maxRank).fill(n.id) as string[]);
    for (const scope of ['pvp', 'pve'] as const) {
      expect(talentBonus(tudo.slice(0, 20), 1000, scope)).toBeLessThanOrEqual(COMBAT_BONUS_CAP);
    }
  });

  it('nenhum caminho de compra com dinheiro real alcança talentos ou portões', async () => {
    const { readFileSync } = await import('node:fs');
    for (const f of ['./talents.ts', './gates.ts', '../../functions/api/_talents.js', '../../functions/api/_gates.js']) {
      const src = readFileSync(new URL(f, import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      expect(src, f).not.toMatch(/credits|creditos|accountTier|purchase|checkout/i);
    }
  });
});

describe('recompensas — o CATÁLOGO BOND_REWARDS segue 100% cosmético', () => {
  const ladder = bondRewardLadder();

  it('NENHUMA recompensa devolve moeda relevante, HP, energia ou perfectDay', () => {
    const proibido = [
      'bits', 'gamePoints', 'emblems', 'credits', 'creditos', 'coins',
      'hp', 'healthPoints', 'hearts', 'energy', 'energyPoints',
      'perfectDays', 'totalPerfectDays', 'attack', 'defense', 'stats',
    ];
    for (const r of ladder) {
      expect(['title', 'decor', 'bg', 'dream']).toContain(r.kind);
      for (const key of proibido) {
        expect(r as unknown as Record<string, unknown>).not.toHaveProperty(key);
      }
      // e nenhum valor numérico solto que possa virar quantidade de moeda
      for (const v of Object.values(r as unknown as Record<string, unknown>)) {
        if (typeof v === 'number') expect(v).toBe(r.level);
      }
    }
  });

  it('decor/bg apontam para ids REAIS de utils/shop.ts', () => {
    const ids = new Set(ALL_SHOP_ITEMS.map((i) => i.id));
    for (const r of ladder) {
      if (r.kind === 'decor' || r.kind === 'bg') {
        expect(r.refId).toBeTruthy();
        expect(ids.has(r.refId!)).toBe(true);
        const item = ALL_SHOP_ITEMS.find((i) => i.id === r.refId)!;
        // cosmético de verdade: só bg ou furniture, nunca chip/heart/emblem
        expect(['bg', 'furniture']).toContain(item.kind);
        // e nunca um item que custa Emblemas (não mistura moedas)
        expect(item.currency ?? 'bits').toBe('bits');
      }
    }
  });

  it('sonhos apontam para ids REAIS do DREAM_CATALOG', () => {
    const ids = new Set(DREAM_CATALOG.map((d) => d.id));
    for (const r of ladder) {
      if (r.kind === 'dream') expect(ids.has(r.refId!)).toBe(true);
    }
  });

  it('a 1ª recompensa (nível 2) e a 2ª (nível 3) existem e são visíveis', () => {
    expect(bondRewardFor(1)).toBeNull();
    const r2 = bondRewardFor(2)!;
    const r3 = bondRewardFor(3)!;
    expect(r2.kind).toBe('title');   // aparece sob o nome do pet, sem abrir nada
    expect(r3.kind).toBe('decor');
    // decoração que serve em QUALQUER cenário, inclusive o grátis
    const item = ALL_SHOP_ITEMS.find((i) => i.id === r3.refId)!;
    expect(item.fits).toBe('any');
  });

  it('ids de recompensa são únicos e os níveis, estritamente crescentes', () => {
    expect(new Set(ladder.map((r) => r.id)).size).toBe(ladder.length);
    for (let i = 1; i < ladder.length; i++) {
      expect(ladder[i].level).toBeGreaterThan(ladder[i - 1].level);
    }
  });
});

describe('títulos', () => {
  it('par EN/PT, e nada antes do nível 2', () => {
    expect(bondTitle(1, 'en')).toBeNull();
    expect(bondTitle(2, 'en')).toBe('Companion');
    expect(bondTitle(2, 'pt-BR')).toBe('Companheiro');
    expect(bondTitle(5, 'pt-BR')).toBe('Companheiro'); // mantém o mais alto alcançado
    expect(bondTitle(6, 'en')).toBe('Confidant');
    // WP4.3 — a escada continua depois do 13 (títulos de 3 em 3 até o 31).
    // Antes ela parava ali, e o L13 cai por volta do dia 25–35: exatamente
    // quando o jogador provou que fica, o Vínculo parava de dizer qualquer
    // coisa. O topo declarado agora é o 31.
    expect(bondTitle(13, 'pt-BR')).toBe('Vínculo de uma Vida');
    expect(bondTitle(16, 'pt-BR')).toBe('Guardião dos Dias');
    expect(bondTitle(99, 'pt-BR')).toBe('Além da Conta');
  });

  it('todo título tem os dois idiomas preenchidos', () => {
    for (let n = 2; n <= 20; n++) {
      const en = bondTitle(n, 'en');
      const pt = bondTitle(n, 'pt-BR');
      expect(en).toBeTruthy();
      expect(pt).toBeTruthy();
    }
  });
});

describe('entrega de recompensas (bondRewardsClaimed — o nível NUNCA é persistido)', () => {
  it('lista tudo que o nível já liberou e ainda não foi entregue', () => {
    const xp = xpForLevel(4);
    const todas = unclaimedBondRewards(xp, []);
    expect(todas.map((r) => r.level)).toEqual([2, 3, 4]);

    const parcial = unclaimedBondRewards(xp, ['bond-2-title']);
    expect(parcial.map((r) => r.id)).toEqual(['bond-3-plant', 'bond-4-forest']);

    expect(unclaimedBondRewards(xp, todas.map((r) => r.id))).toHaveLength(0);
  });

  it('um save antigo recebe as recompensas retroativas de graça', () => {
    // não fez nada de novo: só tinha totalXP acumulado
    expect(unclaimedBondRewards(900, []).length).toBeGreaterThan(0);
  });
});

describe('WP4.3 — o Vínculo não trava no nível 13', () => {
  it('todo nível com título é recompensa, até o 31', () => {
    // `bondRewardFor` devolvia null a partir do 14: a trilha terminava em
    // silêncio bem quando o jogador acabou de provar que fica.
    for (const n of [16, 19, 22, 25, 28, 31]) {
      const r = bondRewardFor(n);
      expect(r, `nível ${n} sem recompensa`).toBeTruthy();
      expect(r!.kind).toBe('title');
      expect(r!.namePt).toContain('Título');
      expect(r!.nameEn).toContain('Title');
    }
  });

  it('a escada acaba num lugar DECLARADO', () => {
    // Acabar num ponto declarado é diferente de parar sem aviso no 14.
    expect(BOND_LAST_TITLED_LEVEL).toBe(31);
    expect(bondRewardFor(BOND_LAST_TITLED_LEVEL)).toBeTruthy();
    expect(bondRewardFor(BOND_LAST_TITLED_LEVEL + 1)).toBeNull();
  });

  it('tudo continua COSMÉTICO — a régua das moedas não é tocada', () => {
    for (const n of [16, 19, 22, 25, 28, 31]) {
      const r = bondRewardFor(n)!;
      expect(['title', 'furniture', 'bg']).toContain(r.kind);
      expect(JSON.stringify(r)).not.toMatch(/credits|gamePoints|emblems|bits/i);
    }
  });
});
