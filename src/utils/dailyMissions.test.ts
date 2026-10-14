import { describe, it, expect } from 'vitest';
import {
  DAILY_MISSION_COUNT, bumpDaily, claimDaily, dailyForDay, dailyMissionPool, dailyMissionsFor, dailyMissionsMark, dailyStatus,
  sanitizeDailyMissions, type DailyMissionsState,
} from './dailyMissions';
import { BUILDING_GATES, buildingGateFor } from './gates';
import { MATERIAL_CAP, MATERIAL_IDS, type BuildingQuestState } from './buildingQuests';

const D1 = '2026-10-14';
const D2 = '2026-10-15';

describe('catálogo', () => {
  it('ids únicos, PT/EN presentes, alvo baixo (1–2), material e prédio válidos', () => {
    const pool = dailyMissionPool();
    expect(new Set(pool.map(m => m.id)).size).toBe(pool.length);
    expect(new Set(pool.map(m => m.event)).size).toBe(pool.length);
    for (const m of pool) {
      expect(m.descPt.length).toBeGreaterThan(5);
      expect(m.descEn.length).toBeGreaterThan(5);
      expect(m.target).toBeGreaterThanOrEqual(1);
      expect(m.target).toBeLessThanOrEqual(2);
      expect(MATERIAL_IDS).toContain(m.material);
      expect(BUILDING_GATES[m.building]).toBeDefined();
    }
  });
  it('voz: encoraja, nunca cobra; nenhuma missão premia contagem de tarefas', () => {
    for (const m of dailyMissionPool()) {
      expect(`${m.descPt} ${m.descEn}`).not.toMatch(/tarefa|task|todos? os|every|streak|sequência|perder|lose|não esqueça|don.t forget|hurry|corra para/i);
    }
  });
  it('só 3 por dia e a pessoa nova (Vínculo 1) sempre tem as 3, todas abertas', () => {
    for (let d = 1; d <= 28; d += 1) {
      const list = dailyMissionsFor(`2026-10-${String(d).padStart(2, '0')}`, 1);
      expect(list.length).toBe(DAILY_MISSION_COUNT);
      for (const m of list) expect(buildingGateFor(m.building, 1).open).toBe(true);
    }
  });
});

describe('rotação determinística', () => {
  it('mesma chave de dia e Vínculo = mesma lista; dias diferentes variam ao longo de um mês', () => {
    expect(dailyMissionsFor(D1, 5).map(m => m.id)).toEqual(dailyMissionsFor(D1, 5).map(m => m.id));
    const conjuntos = new Set<string>();
    for (let d = 1; d <= 30; d += 1) conjuntos.add(dailyMissionsFor(`2026-09-${String(d).padStart(2, '0')}`, 99).map(m => m.id).join());
    expect(conjuntos.size).toBeGreaterThan(15);
  });
  it('RESPEITA BLOQUEIOS: nada de Duelo/Torneio/Oficina/Amigos antes do Vínculo que abre o prédio, em nenhum dia', () => {
    for (let d = 1; d <= 60; d += 1) {
      const day = `2026-08-${String((d % 28) + 1).padStart(2, '0')}-${d}`;
      for (const bond of [1, 2, 3, 4, 5]) {
        for (const m of dailyMissionsFor(day, bond)) expect(buildingGateFor(m.building, bond).open).toBe(true);
      }
      // a Masmorra abre no Vínculo 1 desde a #328 (REGISTRO §51): sai da lista de bloqueadas, o portão é lido da tabela.
      const b1 = dailyMissionsFor(day, 1).map(m => m.event);
      for (const e of ['arena', 'torneio', 'foco', 'amigo'] as const) expect(b1).not.toContain(e);
    }
  });
  it('as missões dos recursos novos aparecem quando o Vínculo os abre', () => {
    const vistos = new Set<string>();
    for (let d = 0; d < 200; d += 1) for (const m of dailyMissionsFor(`seed-${d}`, 99)) vistos.add(m.event);
    expect(vistos.size).toBe(dailyMissionPool().length);
  });
});

describe('condição, 1 recompensa por dia, sem duplicar', () => {
  const pick = (id: string) => dailyMissionPool().find(m => m.id === id)!;
  const day = (() => {
    // um dia em que a missão alvo está na lista do Vínculo 99
    for (let d = 0; d < 400; d += 1) { const k = `claim-${d}`; if (dailyMissionsFor(k, 99).some(m => m.id === 'd-dino')) return k; }
    throw new Error('sem dia');
  })();

  it('evento real conta; antes disso está disponível; depois fica pronta', () => {
    const m = pick('d-dino');
    expect(dailyStatus(undefined, day, m)).toBe('available');
    const s = bumpDaily(undefined, day, 'dino');
    expect(dailyStatus(s, day, m)).toBe('ready');
    expect(dailyMissionsMark(s, day, 99)).toBe('ready');
  });
  it('resgata UMA vez: paga 1 material e marca; segundo resgate e reabrir devolvem o MESMO estado', () => {
    const s0 = { dailyMissions: bumpDaily(undefined, day, 'dino'), buildingQuests: undefined as BuildingQuestState | undefined };
    const a = claimDaily(s0, day, 99, 'd-dino');
    expect(a.paid).toBe('spark');
    expect(a.state.buildingQuests!.materials.spark).toBe(1);
    expect(a.state.dailyMissions!.claimed).toEqual(['d-dino']);
    const b = claimDaily(a.state, day, 99, 'd-dino');
    expect(b.paid).toBeNull();
    expect(b.state).toBe(a.state);
    expect(dailyStatus(a.state.dailyMissions, day, pick('d-dino'))).toBe('claimed');
  });
  it('não resgata o que não está pronto, nem o que não está na lista do dia/Vínculo', () => {
    const s0 = { dailyMissions: undefined as DailyMissionsState | undefined, buildingQuests: undefined as BuildingQuestState | undefined };
    expect(claimDaily(s0, day, 99, 'd-dino').paid).toBeNull();
    const com = { dailyMissions: bumpDaily(bumpDaily(undefined, day, 'arena'), day, 'torneio'), buildingQuests: undefined as BuildingQuestState | undefined };
    expect(claimDaily(com, day, 1, 'd-arena').paid).toBeNull();
    expect(claimDaily(com, day, 1, 'd-inexistente').paid).toBeNull();
  });
  it('estoque no teto: o resgate vale, o excedente não entra', () => {
    const cheio: BuildingQuestState = { day, visited: [], claimed: [], materials: { spark: MATERIAL_CAP } };
    const r = claimDaily({ dailyMissions: bumpDaily(undefined, day, 'dino'), buildingQuests: cheio }, day, 99, 'd-dino');
    expect(r.paid).toBe('spark');
    expect(r.state.buildingQuests!.materials.spark).toBe(MATERIAL_CAP);
  });
  it('dia novo zera contagem e resgates, o estoque passa', () => {
    const s = { dailyMissions: bumpDaily(undefined, day, 'dino'), buildingQuests: undefined as BuildingQuestState | undefined };
    const pago = claimDaily(s, day, 99, 'd-dino').state;
    expect(dailyForDay(pago.dailyMissions, D2)).toEqual({ day: D2, counts: {}, claimed: [] });
    expect(pago.buildingQuests!.materials.spark).toBe(1);
  });
  it('contagem é por evento: dois eventos iguais somam, mas o pagamento continua 1', () => {
    let s: DailyMissionsState | undefined;
    s = bumpDaily(s, day, 'dino'); s = bumpDaily(s, day, 'dino');
    expect(s.counts.dino).toBe(2);
    const a = claimDaily({ dailyMissions: s, buildingQuests: undefined as BuildingQuestState | undefined }, day, 99, 'd-dino');
    expect(a.state.buildingQuests!.materials.spark).toBe(1);
  });
});

describe('economia (REGISTRO §52): o máximo diário por faixa de Vínculo', () => {
  it('no máximo DAILY_MISSION_COUNT materiais por dia, sempre materiais (sem moeda nova)', () => {
    for (const bond of [1, 2, 3, 5]) {
      for (let d = 0; d < 50; d += 1) {
        const list = dailyMissionsFor(`eco-${d}`, bond);
        expect(list.length).toBeLessThanOrEqual(3);
        for (const m of list) expect(MATERIAL_IDS).toContain(m.material);
      }
    }
  });
});

describe('sanitize', () => {
  it('lixo vira undefined; eventos/ids fora do catálogo caem; contagem vira inteiro limitado', () => {
    expect(sanitizeDailyMissions(null)).toBeUndefined();
    expect(sanitizeDailyMissions({ day: 1 })).toBeUndefined();
    const s = sanitizeDailyMissions({ day: D1, counts: { dino: 3.7, hack: 5, ppt: -1, foco: 1e9 }, claimed: ['d-dino', 'd-dino', 'x', 7] })!;
    expect(s.counts).toEqual({ dino: 3, foco: 99 });
    expect(s.claimed).toEqual(['d-dino']);
  });
});
