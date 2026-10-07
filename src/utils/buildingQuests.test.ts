import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  MATERIAL_IDS, MATERIAL_CAP, QUEST_BUILDINGS, forDay, questStatus, visitBuilding, claimBuildingQuest,
  buildingMarks, sanitizeBuildingQuests, stockOf, type BuildingQuestState,
} from './buildingQuests';
import { MATERIALS, questText } from './buildingQuestsCopy';
import { BUILDING_GATES, type BuildingId } from './gates';
import { questMarks } from './questMarks';

const D1 = 'Wed Oct 07 2026';
const D2 = 'Thu Oct 08 2026';
const MAXB = 99;

describe('tabela prédio → material', () => {
  it('todo prédio fora do Mercado tem 1 material, e o Mercado nenhum', () => {
    expect(QUEST_BUILDINGS.some(id => id.startsWith('mercado.'))).toBe(false);
    expect(QUEST_BUILDINGS.length).toBe(Object.keys(BUILDING_GATES).filter(id => !id.startsWith('mercado.')).length);
    expect(MATERIALS.map(m => m.building).sort()).toEqual([...QUEST_BUILDINGS].sort());
    expect(new Set(MATERIAL_IDS).size).toBe(MATERIAL_IDS.length);
  });
  it('material não é moeda: nenhum ícone de Bits/Emblemas/Créditos, e há nome EN e PT', () => {
    for (const m of MATERIALS) {
      expect(['🪙', '🎖️', '💎']).not.toContain(m.icon);
      expect(m.nameEn && m.namePt).toBeTruthy();
    }
  });
});

describe('missão do dia', () => {
  it('trancada pelo Vínculo; aberta vira disponível → pronta → resgatada', () => {
    expect(questStatus(undefined, D1, 'exploracao.masmorra', 1)).toBe('locked');
    expect(questStatus(undefined, D1, 'exploracao.masmorra', 2)).toBe('available');
    const v = visitBuilding(undefined, D1, 'exploracao.masmorra', 2);
    expect(questStatus(v, D1, 'exploracao.masmorra', 2)).toBe('ready');
    const c = claimBuildingQuest(v, D1, 'exploracao.masmorra', 2);
    expect(c.paid).toBe('ore');
    expect(stockOf(c.state, 'ore')).toBe(1);
    expect(questStatus(c.state, D1, 'exploracao.masmorra', 2)).toBe('claimed');
  });
  it('resgate duplo não paga 2× e devolve a mesma referência', () => {
    const v = visitBuilding(undefined, D1, 'hall.guilda', MAXB);
    const a = claimBuildingQuest(v, D1, 'hall.guilda', MAXB);
    const b = claimBuildingQuest(a.state, D1, 'hall.guilda', MAXB);
    expect(b.paid).toBeNull();
    expect(b.state).toBe(a.state);
  });
  it('sem entrar não resgata; Mercado e trancado não visitam', () => {
    expect(claimBuildingQuest(undefined, D1, 'arena.duelo', MAXB).paid).toBeNull();
    expect(visitBuilding(undefined, D1, 'mercado.itens' as BuildingId, MAXB)).toBeUndefined();
    expect(visitBuilding(undefined, D1, 'arena.duelo', 1)).toBeUndefined();
  });
  it('visitar de novo é no-op (mesma referência)', () => {
    const v = visitBuilding(undefined, D1, 'jogos.salao', 1)!;
    expect(visitBuilding(v, D1, 'jogos.salao', 1)).toBe(v);
  });
  it('dia novo reseta a missão e preserva o estoque', () => {
    const c = claimBuildingQuest(visitBuilding(undefined, D1, 'jogos.salao', 1), D1, 'jogos.salao', 1).state;
    expect(questStatus(c, D2, 'jogos.salao', 1)).toBe('available');
    expect(forDay(c, D2).materials.spark).toBe(1);
    expect(forDay(c, D1)).toBe(c);
  });
  it('estoque no teto: o resgate vale e o excedente não entra', () => {
    const base: BuildingQuestState = { day: D1, visited: ['jogos.salao'], claimed: [], materials: { spark: MATERIAL_CAP } };
    const c = claimBuildingQuest(base, D1, 'jogos.salao', 1);
    expect(c.paid).toBe('spark');
    expect(stockOf(c.state, 'spark')).toBe(MATERIAL_CAP);
    expect(c.state!.claimed).toContain('jogos.salao');
  });
  it('é determinístico por dia + prédio (sem sorteio)', () => {
    for (const id of QUEST_BUILDINGS) expect(questText(D1, id, false)).toBe(questText(D1, id, false));
  });
  it('nenhum texto premia contagem de tarefas nem cobra', () => {
    for (const id of QUEST_BUILDINGS) for (const d of [D1, D2, 'a', 'b', 'c']) for (const pt of [true, false]) {
      expect(questText(d, id, pt)).not.toMatch(/tarefa|task|\d|hurry|last chance|n[aã]o perca|don'?t miss|falta/i);
    }
  });
});

describe('marcas', () => {
  it('só a missão LISTADA no menu (Caderno) tem marca: ! disponível, ? pronta, nada depois de paga; Mercado nunca', () => {
    expect(buildingMarks(undefined, D1, MAXB)['exploracao.caderno']).toBe('available');
    const v = visitBuilding(undefined, D1, 'exploracao.caderno', MAXB);
    expect(buildingMarks(v, D1, MAXB)['exploracao.caderno']).toBe('ready');
    const c = claimBuildingQuest(v, D1, 'exploracao.caderno', MAXB).state;
    expect(buildingMarks(c, D1, MAXB)['exploracao.caderno']).toBeUndefined();
    expect(Object.keys(buildingMarks(undefined, D1, MAXB))).toEqual(['exploracao.caderno']);
  });
  it('visitar prédio não listado continua contando, mas não acende nada', () => {
    const v = visitBuilding(undefined, D1, 'arena.duelo', MAXB);
    expect(v?.visited).toContain('arena.duelo');
    expect(buildingMarks(v, D1, MAXB)['arena.duelo']).toBeUndefined();
  });
  it('canto: a missão listada acende em dourado; sem nada a fazer nem a entregar, some', () => {
    const base = { passeio: null, weekly: [], missionProgress: {}, ownedBackgrounds: [] };
    const v = visitBuilding(undefined, D1, 'exploracao.caderno', MAXB);
    const c = claimBuildingQuest(v, D1, 'exploracao.caderno', MAXB).state;
    expect(questMarks({ ...base, buildings: buildingMarks(c, D1, MAXB) }).corner).toBeNull();
    expect(questMarks({ ...base, buildings: buildingMarks(undefined, D1, MAXB) }).corner).toBe('available');
    const m = questMarks({ ...base, buildings: buildingMarks(v, D1, MAXB) });
    expect(m.corner).toBe('ready');
    expect(m.cornerTone).toBe('gold');
    expect(m.daily).toBe('ready');
  });
});

describe('sanitizeBuildingQuests', () => {
  it('lixo vira undefined; lista fechada e teto', () => {
    for (const x of [null, 1, 'x', [], { day: 3 }, { day: '' }]) expect(sanitizeBuildingQuests(x)).toBeUndefined();
    const s = sanitizeBuildingQuests({
      day: D1, visited: ['arena.duelo', 'arena.duelo', 'mercado.itens', 5], claimed: ['hall.guilda'],
      materials: { ore: 1e9, spark: -3, falso: 5, gear: 2.9, __proto__: { x: 1 } },
    })!;
    expect(s.visited).toEqual(['arena.duelo', 'hall.guilda']);
    expect(s.materials).toEqual({ ore: MATERIAL_CAP, gear: 2 });
  });
});

describe('fiação', () => {
  it('o App usa o updater puro, sem toast/efeito dentro do setGameState', () => {
    const app = readFileSync('src/App.tsx', 'utf8');
    const i = app.indexOf('const resgatarPredio');
    expect(app.slice(i, i + 500)).toContain('claimBuildingQuest(prev.buildingQuests');
    expect(app).toContain('onVisitBuilding={visitarPredio}');
  });
});
