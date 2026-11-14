import { describe, it, expect } from 'vitest';
import { NPC_MISSIONS, NPC_MISSIONS_RODIZIO, NPCS_POR_SEMANA, NPCS_SEM_MISSAO } from './npcMissions';
import { LOT_NPC_VOICE } from './areaNpcVoice';
import { BUILDING_GATES } from './gates';
import { MATERIAL_PER_QUEST, type BuildingQuestState } from './buildingQuests';
import {
  DAILY_COUNT_CAP, DAILY_EVENTS, DAILY_MISSION_COUNT, FIRST_TIME_IDS, bumpDaily, bumpDailyIn, claimDaily, dailyMissionPool, dailyMissionsFor,
  dailyStatus, npcMissionsOfDay, npcsOfWeek, trilhoMission, sanitizeDailyMissions, type DailyMissionsState,
} from './dailyMissions';
import { applyEssences } from './essences';

const BOND_MAX = 10;
const dia = (i: number) => `2026-11-${String(1 + i).padStart(2, '0')}`;

describe('missões dos NPCs (REGISTRO §314)', () => {
  it('cada NPC de lote do jogo tem missão — ou está na lista explícita de quem não tem (e por quê)', () => {
    const com = new Set(NPC_MISSIONS.map(m => m.npc));
    for (const key of Object.keys(LOT_NPC_VOICE)) {
      expect(com.has(key) || key in NPCS_SEM_MISSAO, key).toBe(true);
      expect(com.has(key) && key in NPCS_SEM_MISSAO, `${key} em AMBAS`).toBe(false);
    }
    // Papus (carteiro) e Nuri (cuidados) também passam missão
    expect(com.has('papus')).toBe(true);
    expect(com.has('nuri')).toBe(true);
  });

  it('toda missão: id único, prédio com portão, alvo ≥ 1, nome + descrição + material, evento do vocabulário fechado', () => {
    const ids = NPC_MISSIONS.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of NPC_MISSIONS) {
      expect(BUILDING_GATES[m.building], m.id).toBeTruthy();
      expect(m.target).toBeGreaterThanOrEqual(1);
      expect(m.target).toBeLessThanOrEqual(DAILY_COUNT_CAP);
      for (const t of [m.namePt, m.nameEn, m.descPt, m.descEn]) expect(t.length, m.id).toBeGreaterThan(2);
      expect(DAILY_EVENTS).toContain(m.event);
    }
  });

  it('a Vesca pede 30 essências elementais e paga o material do Centro de Evolução', () => {
    const v = NPC_MISSIONS.find(m => m.npc === 'laboratorio:evolucao')!;
    expect(v).toMatchObject({ event: 'essencia', target: 30, building: 'laboratorio.evolucao', material: 'essence' });
    expect(v.descPt).toBe('Colete 30 essências elementais');
    // sem "visitar" no catálogo do Centro de Evolução
    expect(FIRST_TIME_IDS).not.toContain('visit:laboratorio.evolucao');
  });

  const segunda = '2026-11-02';
  const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

  it('rodízio SEMANAL determinístico: a semana inteira (segunda a domingo) tem os MESMOS NPCs; a semana seguinte, outros', () => {
    const base = Date.UTC(2026, 10, 2); // segunda
    const ids = (d: string) => npcsOfWeek(d, BOND_MAX).map(m => m.id).join();
    for (let sem = 0; sem < 4; sem += 1) {
      const dias = Array.from({ length: 7 }, (_, k) => iso(base + (sem * 7 + k) * 86400000));
      expect(new Set(dias.map(ids)).size, `semana ${sem}`).toBe(1);
    }
    expect(ids(segunda)).not.toBe(ids(iso(base + 7 * 86400000)));
    // o domingo anterior ainda é da semana passada
    expect(ids('2026-11-01')).not.toBe(ids(segunda));
    expect(npcsOfWeek(segunda, BOND_MAX)).toHaveLength(NPCS_POR_SEMANA);
  });

  it('o ciclo cobre todo NPC do rodízio e recomeça igual', () => {
    // `N` NPCs, `NPCS_POR_SEMANA` por semana: cobre todos em ceil(N/K) semanas; a posição só repete depois de N semanas (N ímpar vs K = 2)
    const N = NPC_MISSIONS_RODIZIO.length;
    const semanas = N;
    const base = Date.UTC(2026, 10, 2);
    const vistos = new Set<string>();
    for (let w = 0; w < Math.ceil(N / NPCS_POR_SEMANA); w += 1) for (const m of npcsOfWeek(iso(base + w * 7 * 86400000), BOND_MAX)) vistos.add(m.id);
    expect([...vistos].sort()).toEqual(NPC_MISSIONS_RODIZIO.map(m => m.id).sort());
    expect(npcsOfWeek(iso(base + semanas * 7 * 86400000), BOND_MAX).map(m => m.id)).toEqual(npcsOfWeek(segunda, BOND_MAX).map(m => m.id));
  });

  it('só entram NPCs com o prédio ABERTO pelo Vínculo (nunca um trancado) e o Trilho nunca está no rodízio', () => {
    for (let i = 0; i < 40; i += 1) {
      for (const bond of [1, 2, 3]) {
        const l = npcsOfWeek(iso(Date.UTC(2026, 10, 2) + i * 7 * 86400000), bond);
        for (const m of l) expect(BUILDING_GATES[m.building].minBond, m.id).toBeLessThanOrEqual(bond);
        expect(l.map(m => m.id)).not.toContain('n-trilho');
        expect(new Set(l.map(m => m.id)).size).toBe(l.length);
      }
    }
  });

  it('Trilho: missão diária FIXA "Faça 1 registro" (journal), Caderno sem trava por Vínculo; fora do rodízio', () => {
    const t = trilhoMission(BOND_MAX)!;
    expect(t).toMatchObject({ id: 'n-trilho', event: 'journal', target: 1, building: 'forja.caderno', npc: 'forja:caderno' });
    expect(t.descPt).toBe('Faça 1 registro no Caderno');
    expect(trilhoMission(0)).toBeDefined(); // Vínculo lixo cai em 1 e o Caderno abre no 1 (dono 12/11/2026)
    expect(NPC_MISSIONS_RODIZIO.map(m => m.id)).not.toContain('n-trilho');
    for (let i = 0; i < 10; i += 1) expect(npcMissionsOfDay(dia(i), BOND_MAX)[0].id).toBe('n-trilho');
  });

  it('a lista do dia abre com o Trilho + os NPCs da semana e continua com no máximo DAILY_MISSION_COUNT (sem NPC repetido)', () => {
    for (let i = 0; i < 20; i += 1) {
      const l = dailyMissionsFor(dia(i), BOND_MAX);
      expect(l.length).toBeLessThanOrEqual(DAILY_MISSION_COUNT);
      expect(l.slice(0, 1 + NPCS_POR_SEMANA).every(m => m.npc)).toBe(true);
      expect(l.filter(m => m.npc)).toHaveLength(1 + NPCS_POR_SEMANA);
    }
  });

  it('claim do Trilho: 1 registro deixa pronta; resgata 1× e paga tinta', () => {
    const d = '2026-11-03';
    const m = dailyMissionsFor(d, BOND_MAX).find(x => x.id === 'n-trilho')!;
    let st: { dailyMissions?: DailyMissionsState; buildingQuests?: BuildingQuestState } = { dailyMissions: undefined };
    expect(dailyStatus(st.dailyMissions, d, m)).toBe('available');
    st = { ...st, dailyMissions: bumpDaily(undefined, d, 'journal') };
    expect(dailyStatus(st.dailyMissions, d, m)).toBe('ready');
    const r = claimDaily(st, d, BOND_MAX, 'n-trilho');
    expect(r.paid).toBe('ink');
    expect(claimDaily(r.state, d, BOND_MAX, 'n-trilho').paid).toBeNull();
  });

  it('o catálogo vivo inclui as missões de NPC (o servidor/sanitize as conhece)', () => {
    const vivos = dailyMissionPool().map(m => m.id);
    for (const m of NPC_MISSIONS) expect(vivos).toContain(m.id);
    const s = sanitizeDailyMissions({ day: 'd', counts: { essencia: 12, hack: 3 }, claimed: ['n-vesca', 'n-nope'] })!;
    expect(s.counts).toEqual({ essencia: 12 });
    expect(s.claimed).toEqual(['n-vesca']);
  });

  it('progresso e resgate: 30 essências (por qualquer fonte) deixam a Vesca pronta; resgata 1× (idempotente) e paga 1 Essência (material)', () => {
    // Acha um dia em que a Vesca abre a lista
    let d = '';
    for (let i = 0; i < NPC_MISSIONS.length * 7; i += 7) { const c = iso(Date.UTC(2027, 0, 4) + i * 86400000); if (npcsOfWeek(c, BOND_MAX).some(x => x.id === 'n-vesca')) { d = c; break; } }
    expect(d).not.toBe('');
    const m = dailyMissionsFor(d, BOND_MAX).find(x => x.id === 'n-vesca')!;
    expect(m.id).toBe('n-vesca');
    type Est = { dailyMissions?: DailyMissionsState; essences?: Record<string, number>; playerDayTz?: undefined; buildingQuests?: BuildingQuestState };
    let st: Est = {};
    const hoje = new Date(`${d}T12:00:00`);
    // aplica as essências pelo caminho real (`applyEssences` conta o que entra), em dois lotes
    const agora = (s: typeof st, qtd: number) => applyEssences(s, [{ id: 'fogo', qty: qtd }]);
    st = agora(st, 12);
    expect(st.essences).toEqual({ fogo: 12 });
    // a contagem usa o dia do relógio: força o dia da Vesca pelo bump explícito
    st = { ...st, dailyMissions: bumpDaily(undefined, d, 'essencia', 12) };
    expect(dailyStatus(st.dailyMissions, d, m)).toBe('available');
    st = { ...st, dailyMissions: bumpDaily(st.dailyMissions, d, 'essencia', 18) };
    expect(dailyStatus(st.dailyMissions, d, m)).toBe('ready');
    const r1 = claimDaily<Est>({ ...st, buildingQuests: undefined }, d, BOND_MAX, 'n-vesca');
    expect(r1.paid).toBe('essence');
    expect(r1.state.buildingQuests?.materials.essence).toBe(MATERIAL_PER_QUEST);
    const r2 = claimDaily(r1.state, d, BOND_MAX, 'n-vesca');
    expect(r2.paid).toBeNull();
    expect(r2.state).toBe(r1.state);
    void hoje;
  });

  it('applyEssences conta o que entrou na missão do dia; recusa/lixo não conta', () => {
    const base = { essences: {} as Record<string, number> };
    const a = applyEssences(base, [{ id: 'fogo', qty: 2 }, { id: 'agua', qty: 3 }, { id: 'x', qty: 0 }]) as typeof base & { dailyMissions?: DailyMissionsState };
    expect(a.dailyMissions?.counts.essencia).toBe(5);
    const sem = applyEssences(base, [{ id: 'fogo', qty: 0 }]);
    expect(sem).toBe(base);
  });

  it('bumpDaily: quantidade, teto e agregados dos jogos do Salão e do Ateliê', () => {
    let s = bumpDaily(undefined, 'd', 'dino');
    expect(s.counts).toMatchObject({ dino: 1, salao: 1 });
    s = bumpDaily(s, 'd', 'zip');
    expect(s.counts).toMatchObject({ zip: 1, mente: 1 });
    expect(bumpDaily(s, 'd', 'essencia', 500).counts.essencia).toBe(DAILY_COUNT_CAP);
    expect(bumpDaily(s, 'd', 'essencia', 0)).toBe(s);
    expect(bumpDaily(s, 'd', 'essencia', -3)).toBe(s);
  });

  it('bumpDailyIn: soma no dia do jogador e devolve o MESMO objeto quando nada muda', () => {
    const o = bumpDailyIn({ x: 1 }, 'hex');
    expect((o as { dailyMissions?: DailyMissionsState }).dailyMissions?.counts.hex).toBe(1);
    expect(bumpDailyIn(o, 'hex', 0)).toBe(o);
  });
});
