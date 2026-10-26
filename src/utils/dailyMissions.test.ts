import { describe, it, expect } from 'vitest';
import {
  DAILY_MISSION_COUNT, FIRST_TIME_IDS, FIRST_TIMES_EMPTY, claimFirst, firstStatus, firstTimesFor, firstTimesMark, markFirst, markFirstForEvent, seedFirstTimes, sanitizeFirstTimes, bumpDaily, claimDaily, dailyForDay, dailyMissionPool, dailyMissionsFor, dailyMissionsMark, dailyStatus,
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
  it('até 6 por dia e a pessoa nova (Vínculo 1) sempre tem as 6, todas abertas', () => {
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
  it('no máximo DAILY_MISSION_COUNT (6) materiais por dia, sempre materiais (sem moeda nova)', () => {
    for (const bond of [1, 2, 3, 5]) {
      for (let d = 0; d < 50; d += 1) {
        const list = dailyMissionsFor(`eco-${d}`, bond);
        expect(list.length).toBeLessThanOrEqual(DAILY_MISSION_COUNT);
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

describe('rotação com 6 por dia', () => {
  it('quem tem menos recursos abertos recebe menos que 6, nunca mais; o Vínculo 1 enche as 6', () => {
    expect(DAILY_MISSION_COUNT).toBe(6);
    expect(dailyMissionsFor('2026-10-14', 1).length).toBe(6);
    expect(new Set(dailyMissionsFor('2026-10-14', 99).map(m => m.id)).size).toBe(6);
  });
});

describe('primeiras vezes (missões únicas)', () => {
  const D = '2026-10-14';
  it('catálogo: uma visita por prédio do mapa (menos o Perfil) e quatro estreias; ids únicos', () => {
    expect(new Set(FIRST_TIME_IDS).size).toBe(FIRST_TIME_IDS.length);
    expect(FIRST_TIME_IDS).toContain('visit:mercado.itens');
    expect(FIRST_TIME_IDS).toContain('visit:hall.feira');
    expect(FIRST_TIME_IDS).not.toContain('visit:laboratorio.perfil');
    // prédios placeholder não pagam material (QA 25/10)
    expect(FIRST_TIME_IDS).not.toContain('visit:jogos.dungeon');
    expect(FIRST_TIME_IDS).not.toContain('visit:exploracao.preparar');
    expect(FIRST_TIME_IDS.filter(i => i.startsWith('first-')).length).toBe(4);
  });
  it('só lista o que o Vínculo abriu', () => {
    const ids1 = firstTimesFor(1).map(f => f.id);
    expect(ids1).toContain('visit:mercado.itens');
    expect(ids1).not.toContain('visit:hall.feira');
    expect(ids1).not.toContain('first-focus');
    expect(firstTimesFor(99).length).toBe(FIRST_TIME_IDS.length);
  });
  it('visita e estreia por evento marcam; id estranho e repetição devolvem o MESMO estado', () => {
    const a = markFirst(undefined, 'visit:mercado.itens');
    expect(markFirst(a, 'visit:mercado.itens')).toBe(a);
    expect(markFirst(a, 'visit:lugar.nenhum')).toBe(a);
    expect(markFirstForEvent(FIRST_TIMES_EMPTY, 'ppt').done).toEqual(['first-minigame']);
    expect(markFirstForEvent(FIRST_TIMES_EMPTY, 'foco').done).toEqual(['first-focus']);
    expect(markFirstForEvent(FIRST_TIMES_EMPTY, 'masmorra').done).toEqual(['first-dungeon']);
    const sem = markFirstForEvent(FIRST_TIMES_EMPTY, 'banho');
    expect(sem).toBe(FIRST_TIMES_EMPTY);
  });
  it('resgata UMA vez na vida: 1 material, dia seguinte não repete; antes de cumprir não paga', () => {
    const s0 = { firstTimes: undefined as ReturnType<typeof markFirst> | undefined, buildingQuests: undefined as BuildingQuestState | undefined };
    expect(claimFirst(s0, D, 1, 'first-minigame').paid).toBeNull();
    const pronta = { ...s0, firstTimes: markFirstForEvent(undefined, 'dino') };
    expect(firstTimesMark(pronta.firstTimes, 1)).toBe('ready');
    const r = claimFirst(pronta, D, 1, 'first-minigame');
    expect(r.paid).toBe('spark');
    expect(r.state.buildingQuests!.materials.spark).toBe(1);
    expect(firstStatus(r.state.firstTimes, 'first-minigame')).toBe('claimed');
    expect(firstTimesMark(r.state.firstTimes, 1)).toBeNull();
    const de = claimFirst(r.state, '2026-10-15', 1, 'first-minigame');
    expect(de.paid).toBeNull();
    expect(de.state).toBe(r.state);
  });
  it('não resgata o que o Vínculo ainda não abriu', () => {
    const s = { firstTimes: markFirst(undefined, 'visit:hall.feira'), buildingQuests: undefined as BuildingQuestState | undefined };
    expect(claimFirst(s, D, 1, 'visit:hall.feira').paid).toBeNull();
    expect(claimFirst(s, D, 99, 'visit:hall.feira').paid).toBe('ribbon');
  });
  it('SEM RETROATIVO PAGO: quem já jogava tem tudo que o Vínculo abre como feito e resgatado, e nada a pagar; o que abrir depois é novo', () => {
    const seed = seedFirstTimes(1);
    const s = { firstTimes: seed, buildingQuests: undefined as BuildingQuestState | undefined };
    for (const f of firstTimesFor(1)) {
      expect(firstStatus(seed, f.id)).toBe('claimed');
      expect(claimFirst(s, D, 1, f.id).paid).toBeNull();
    }
    expect(firstTimesMark(seed, 1)).toBeNull();
    expect(firstStatus(seed, 'visit:hall.feira')).toBe('available');
  });
  it('sanitize: lixo cai, claimed implica done', () => {
    expect(sanitizeFirstTimes(null)).toBeUndefined();
    expect(sanitizeFirstTimes({ done: ['x', 'first-focus', 'first-focus'], claimed: ['first-stroll'] })).toEqual({ done: ['first-focus', 'first-stroll'], claimed: ['first-stroll'] });
  });
});

describe('rodízio da rodada 6: Salão, Ateliê e Calabouço', () => {
  const dia = (n: number) => new Date(Date.UTC(2026, 9, 1 + n)).toISOString().slice(0, 10);
  it('com tudo aberto: 1 do Salão (dino/ppt/match3/barrage), 1 do Ateliê (eco/zip/patches) e o Calabouço, TODO dia; os 4 e os 3 giram', () => {
    const salao = new Set<string>(); const mente = new Set<string>();
    for (let n = 0; n < 24; n += 1) {
      const ev = dailyMissionsFor(dia(n), 99).map(m => m.event);
      const s = ev.filter(e => ['dino', 'ppt', 'match3', 'barrage'].includes(e));
      const m = ev.filter(e => ['eco', 'zip', 'patches'].includes(e));
      expect(s.length).toBe(1); expect(m.length).toBe(1); expect(ev).toContain('calabouco');
      expect(ev.length).toBe(DAILY_MISSION_COUNT);
      salao.add(s[0]); mente.add(m[0]);
    }
    expect(salao.size).toBe(4); expect(mente.size).toBe(3);
  });
  it('é determinístico e consecutivo: dia seguinte avança a roda do Salão', () => {
    const a = dailyMissionsFor(dia(0), 99).map(m => m.id);
    expect(dailyMissionsFor(dia(0), 99).map(m => m.id)).toEqual(a);
    const salaoDe = (d: string) => dailyMissionsFor(d, 99).find(m => ['d-dino', 'd-ppt', 'd-match3', 'd-barrage'].includes(m.id))!.id;
    expect(new Set([0, 1, 2, 3].map(n => salaoDe(dia(n)))).size).toBe(4);
    expect(salaoDe(dia(0))).toBe(salaoDe(dia(4)));
  });
  it('respeita portões: Vínculo 1 não vê Ateliê nem Calabouço (Vínculo 3), mas sempre tem 1 do Salão', () => {
    for (let n = 0; n < 12; n += 1) {
      const ev = dailyMissionsFor(dia(n), 1).map(m => m.event);
      expect(ev).not.toContain('calabouco'); expect(ev).not.toContain('zip');
      expect(ev.filter(e => ['dino', 'ppt', 'match3', 'barrage'].includes(e)).length).toBe(1);
      expect(ev.length).toBe(DAILY_MISSION_COUNT);
    }
    expect(dailyMissionsFor(dia(0), 3).map(m => m.event)).toContain('calabouco');
  });
  it('conta, resgata (1 material) e saves antigos higienizam', () => {
    let s = bumpDaily(undefined, dia(0), 'calabouco');
    const r = claimDaily({ dailyMissions: s } as never, dia(0), 99, 'd-calabouco');
    expect(r.paid).toBe('ore');
    expect(sanitizeDailyMissions({ day: 'x', counts: { zip: 2, barrage: 1 }, claimed: ['d-zip', 'd-calabouco'] })).toEqual({ day: 'x', counts: { zip: 2, barrage: 1 }, claimed: ['d-zip', 'd-calabouco'] });
    expect(sanitizeDailyMissions({ day: 'x', counts: { dino: 1 }, claimed: ['d-dino'] })!.claimed).toEqual(['d-dino']);
    s = bumpDaily(s, dia(0), 'zip'); expect(s.counts.zip).toBe(1);
  });
});
