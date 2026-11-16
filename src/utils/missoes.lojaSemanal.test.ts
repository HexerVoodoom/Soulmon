import { describe, it, expect } from 'vitest';
import { weeklyMissionPool, weeklyMissionsFor, isWeeklyDone, migrateWeeklyLegacy, type WeeklyMissionProgress } from './weeklyMissions';
import { applyShopBuy } from './shopBuy';
import { countWeeklyMission } from './dungeonRewards';
import { weeklyTarget } from './missionTargets';
import { NPC_MISSIONS, NPCS_SEM_MISSAO } from './npcMissions';
import { dailyMissionPool, sanitizeDailyMissions } from './dailyMissions';
import { ALL_SHOP_ITEMS } from './shop';
import type { GameState } from '../contexts/GameStateContext';
import { readFileSync } from 'node:fs';

// 16/11/2026 (dono): as missões da Lasca (Decoração) e da Panora (Background) são SEMANAIS e nomeiam o lugar certo.
const app = readFileSync('src/App.tsx', 'utf8');

describe('Lasca e Panora: missões semanais da loja', () => {
  it('saíram do rodízio diário e estão explicadas em NPCS_SEM_MISSAO', () => {
    expect(NPC_MISSIONS.map(m => m.id)).not.toContain('n-lasca');
    expect(NPC_MISSIONS.map(m => m.id)).not.toContain('n-panora');
    expect(dailyMissionPool().map(m => m.id)).not.toContain('n-lasca');
    expect(NPCS_SEM_MISSAO['mercado:decoracao']).toMatch(/SEMANAL/);
    expect(NPCS_SEM_MISSAO['mercado:background']).toMatch(/SEMANAL/);
  });

  it('textos PT/EN nomeiam a lojinha certa, sem "Mercado/Market" genérico', () => {
    const pool = weeklyMissionPool();
    const d = pool.find(m => m.id === 'buy-decor')!;
    const b = pool.find(m => m.id === 'buy-backdrop')!;
    expect(d).toMatchObject({ target: 2, descPt: 'Compre 2 itens de decoração na lojinha de Decoração', descEn: 'Buy 2 decor pieces at the Decor stall' });
    expect(b).toMatchObject({ target: 1, descPt: 'Compre 1 cenário na lojinha de Background', descEn: 'Buy 1 backdrop at the Background stall' });
    for (const m of [d, b]) expect(`${m.descPt} ${m.descEn}`).not.toMatch(/Mercado|Market/);
  });

  it('o "Ir" leva à lojinha certa', () => {
    expect(weeklyTarget('buy-decor')).toBe('mercado.decoracao');
    expect(weeklyTarget('buy-backdrop')).toBe('mercado.background');
  });

  it('presença: cada uma cai no sorteio semanal em parte das semanas (pool), sem duplicar', () => {
    for (const id of ['buy-decor', 'buy-backdrop'] as const) {
      let n = 0;
      for (let i = 0; i < 400; i += 1) {
        const l = weeklyMissionsFor(`2026-W${i}`).map(m => m.id);
        expect(new Set(l).size).toBe(l.length);
        if (l.includes(id)) n += 1;
      }
      expect(n / 400, id).toBeGreaterThan(0.1);
      expect(n / 400, id).toBeLessThan(0.35);
    }
  });

  // Mesma conta do `handleShopBuy` do App: decoração (furniture) → buy-decor; cenário (bg) → buy-backdrop; o resto não conta.
  type S = Parameters<typeof applyShopBuy>[0] & Pick<GameState, 'weeklyMissions' | 'playerDayTz'>;
  const conta = (prev: S, item: (typeof ALL_SHOP_ITEMS)[number]) => {
    const r = applyShopBuy(prev, item);
    if (r.refused) return prev;
    const now = new Date('2026-11-17T12:00:00Z');
    if (item.kind === 'furniture') return countWeeklyMission(r.state, 'buy-decor', now);
    if (item.kind === 'bg') return countWeeklyMission(r.state, 'buy-backdrop', now);
    return r.state;
  };
  const base = (): S => ({ gamePoints: 99999, emblems: 0, foodInventory: {}, ownedBackgrounds: [], ownedFurniture: [], playerDayTz: undefined } as unknown as S);
  const bits = (k: string) => ALL_SHOP_ITEMS.filter(i => i.kind === k && !i.currency && i.price > 0 && i.price < 5000);

  it('progresso: 2 decorações fecham buy-decor; um cenário NÃO conta para a decoração e vice-versa', () => {
    const [f1, f2] = bits('furniture');
    const [b1] = bits('bg');
    let s = conta(base(), b1);
    const w = s.weeklyMissions!;
    expect(w.counts['buy-backdrop']).toBe(1);
    expect(w.counts['buy-decor']).toBeUndefined();
    expect(isWeeklyDone(w, weeklyMissionPool().find(m => m.id === 'buy-backdrop')!)).toBe(true);
    s = conta(s, f1);
    let w2 = s.weeklyMissions!;
    expect(isWeeklyDone(w2, weeklyMissionPool().find(m => m.id === 'buy-decor')!)).toBe(false);
    s = conta(s, f2);
    w2 = s.weeklyMissions!;
    expect(w2.counts['buy-decor']).toBe(2);
    expect(isWeeklyDone(w2, weeklyMissionPool().find(m => m.id === 'buy-decor')!)).toBe(true);
  });

  it('o App conta pelo tipo do item, no mesmo ponto da compra', () => {
    expect(app).toContain("countWeeklyMission(comprou, 'buy-decor'");
    expect(app).toContain("countWeeklyMission(comprou, 'buy-backdrop'");
    expect(app).not.toContain("bumpDailyIn(comprou, 'cenario')");
  });

  it('saves antigos: progresso semanal sem as chaves novas segue válido; diária com n-lasca/n-panora/cenario é saneada sem quebrar', () => {
    const antigo: WeeklyMissionProgress = { week: '2026-W47', counts: { 'gift-sent': 1 }, claimed: [] };
    expect(migrateWeeklyLegacy(antigo)).toBe(antigo);
    expect(isWeeklyDone(antigo, weeklyMissionPool().find(m => m.id === 'buy-decor')!)).toBe(false);
    const s = sanitizeDailyMissions({ day: 'd', counts: { compra: 2, cenario: 1 }, claimed: ['n-lasca', 'n-panora', 'n-lamela'] })!;
    expect(s.counts).toEqual({ compra: 2 });
    expect(s.claimed).toEqual(['n-lamela']);
  });
});
