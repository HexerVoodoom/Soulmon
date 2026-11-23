import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  MATERIAL_IDS, MATERIAL_CAP, QUEST_BUILDINGS, forDay, questStatus, visitBuilding, completeBuildingQuest, claimBuildingQuest,
  buildingMarks, sanitizeBuildingQuests, stockOf, LISTED_QUEST_BUILDINGS, settleRetiredListed, type BuildingQuestState,
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
    // beta-2 (11): o Perfil do Soulmon é leitura — sem missão, sem material (e sem peça do Soulsmith).
    expect(QUEST_BUILDINGS).not.toContain('forja.ferreiro'); // #187: o Soulsmith saiu do Mercado para a Forja, e segue sem missão/material
    expect(QUEST_BUILDINGS).not.toContain('laboratorio.perfil');
    expect(QUEST_BUILDINGS).not.toContain('arena.guerra'); // a guerra rende na casa do clã, sem material
    expect(QUEST_BUILDINGS.length).toBe(Object.keys(BUILDING_GATES).filter(id => !id.startsWith('mercado.') && id !== 'forja.ferreiro' && id !== 'forja.hexsmith' && id !== 'laboratorio.perfil' && id !== 'arena.guerra' && id !== 'hall.grove' && id !== 'exploracao.preparar' && id !== 'exploracao.dungeon').length);
    expect(QUEST_BUILDINGS).not.toContain('exploracao.preparar'); // beta3 F1: rende a chave da Oficina, sem material
    expect(QUEST_BUILDINGS).not.toContain('exploracao.dungeon'); // beta3 M3: placeholder do Calabouço, sem material
    expect(QUEST_BUILDINGS).not.toContain('hall.grove'); // D-50: o bosque rende no clã, sem material
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
  it('sem trancas por Vínculo (12/11/2026); disponível → pronta → resgatada', () => {
    // A Masmorra abre no Vínculo 1 desde 14/10/2026 (pedido do dono); a Oficina do Foco segue no 3.
    expect(questStatus(undefined, D1, 'exploracao.fenda', 1)).toBe('available');
    expect(questStatus(undefined, D1, 'forja.oficina', 1)).toBe('available'); // era trancada até o Vínculo 3
    const v = visitBuilding(undefined, D1, 'forja.oficina', 3);
    expect(questStatus(v, D1, 'forja.oficina', 3)).toBe('ready');
    const c = claimBuildingQuest(v, D1, 'forja.oficina', 3);
    expect(c.paid).toBe('gear');
    expect(stockOf(c.state, 'gear')).toBe(1);
    expect(questStatus(c.state, D1, 'forja.oficina', 3)).toBe('claimed');
  });
  it('resgate duplo não paga 2× e devolve a mesma referência', () => {
    const v = visitBuilding(undefined, D1, 'hall.guilda', MAXB);
    const a = claimBuildingQuest(v, D1, 'hall.guilda', MAXB);
    const b = claimBuildingQuest(a.state, D1, 'hall.guilda', MAXB);
    expect(b.paid).toBeNull();
    expect(b.state).toBe(a.state);
  });
  it('sem entrar não resgata; o Mercado não visita; sem tranca por Vínculo', () => {
    expect(claimBuildingQuest(undefined, D1, 'arena.duelo', MAXB).paid).toBeNull();
    expect(visitBuilding(undefined, D1, 'mercado.itens' as BuildingId, MAXB)).toBeUndefined();
    expect(visitBuilding(undefined, D1, 'arena.duelo', 1)).toBeDefined(); // abre no Vínculo 1 (dono 12/11/2026)
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

describe('nenhuma missão é LISTADA: o Caderno diário saiu (12/11/2026, REGISTRO §309)', () => {
  it('LISTED_QUEST_BUILDINGS está vazia: o menu não lista prédio e nenhum acende marca', () => {
    expect(LISTED_QUEST_BUILDINGS).toEqual([]);
    expect(buildingMarks(undefined, D1, MAXB)).toEqual({});
    expect(buildingMarks(visitBuilding(undefined, D1, 'forja.caderno', MAXB), D1, MAXB)).toEqual({});
  });
  it('o prédio do Caderno continua existindo e conta a presença como os demais; resgatar paga a tinta 1× por dia', () => {
    expect(QUEST_BUILDINGS).toContain('forja.caderno');
    const v = visitBuilding(undefined, D1, 'forja.caderno', MAXB);
    expect(questStatus(v, D1, 'forja.caderno', MAXB)).toBe('ready');
    expect(completeBuildingQuest(v, D1, 'forja.caderno', MAXB)).toBe(v); // idempotente no dia
    const c = claimBuildingQuest(v, D1, 'forja.caderno', MAXB);
    expect(c.paid).toBe('ink');
    expect(claimBuildingQuest(c.state, D1, 'forja.caderno', MAXB).paid).toBeNull();
    expect(completeBuildingQuest(c.state, D1, 'forja.caderno', MAXB)).toBe(c.state); // pago não reabre no dia
    expect(questStatus(c.state, D2, 'forja.caderno', MAXB)).toBe('available'); // dia novo
  });
  it('migração: o Caderno pronto e sem resgate é pago uma vez; pago, de outro dia ou sem pendência não muda nada', () => {
    const pronto = completeBuildingQuest({ day: D1, visited: [], claimed: [], materials: { ink: 4, ore: 2 } }, D1, 'forja.caderno', MAXB)!;
    const pago = settleRetiredListed(pronto, D1, MAXB)!;
    expect(pago.claimed).toContain('forja.caderno');
    expect(stockOf(pago, 'ink')).toBe(5);
    expect(stockOf(pago, 'ore')).toBe(2); // o resto do estoque passa intacto
    expect(settleRetiredListed(pago, D1, MAXB)).toBe(pago); // 2ª passada = no-op
    expect(settleRetiredListed(pronto, D2, MAXB)).toBe(pronto); // dia diferente: expirou como sempre expirou
    const semPendencia: BuildingQuestState = { day: D1, visited: ['arena.duelo'], claimed: [], materials: {} };
    expect(settleRetiredListed(semPendencia, D1, MAXB)).toBe(semPendencia);
    expect(settleRetiredListed(undefined, D1, MAXB)).toBeUndefined();
  });
  it('visitar prédio não listado continua contando, mas não acende nada', () => {
    const v = visitBuilding(undefined, D1, 'arena.duelo', MAXB);
    expect(v?.visited).toContain('arena.duelo');
    expect(buildingMarks(v, D1, MAXB)['arena.duelo']).toBeUndefined();
  });
  it('canto: sem missão listada nada acende, antes ou depois de visitar', () => {
    const base = { passeio: null, weekly: [], missionProgress: {}, ownedBackgrounds: [] };
    const v = visitBuilding(undefined, D1, 'forja.caderno', MAXB);
    expect(questMarks({ ...base, buildings: buildingMarks(undefined, D1, MAXB) }).corner).toBeNull();
    expect(questMarks({ ...base, buildings: buildingMarks(v, D1, MAXB) }).corner).toBeNull();
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
    expect(app.slice(i, i + 1400)).toContain('claimBuildingQuest(prev.buildingQuests');
    expect(app).toContain('onVisitBuilding={visitarPredio}');
    // o journal conta SÓ na missão do Trilho (`n-trilho`; a semanal anda no resgate dela, REGISTRO §318): um registro novo, no mesmo updater do Caderno
    const j = app.indexOf('const handleCaderno');
    expect(app.slice(j, j + 1200)).toContain("bumpDailyIn(prev, 'journal')");
    expect(app.slice(j, j + 1200)).not.toContain('countWeeklyMission');
    const r = app.indexOf('const resgatarDiaria');
    expect(app.slice(r, r + 1200)).toContain("id === 'n-trilho' ? countWeeklyMission(r.state, 'journal-days'");
    expect(app.slice(j, j + 900)).not.toContain('completeBuildingQuest');
  });
});
