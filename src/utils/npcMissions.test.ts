import { describe, it, expect } from 'vitest';
import { NPC_MISSIONS, NPCS_SEM_MISSAO } from './npcMissions';
import { LOT_NPC_VOICE } from './areaNpcVoice';
import { BUILDING_GATES } from './gates';
import { MATERIAL_PER_QUEST, type BuildingQuestState } from './buildingQuests';
import {
  DAILY_COUNT_CAP, DAILY_EVENTS, DAILY_MISSION_COUNT, FIRST_TIME_IDS, bumpDaily, bumpDailyIn, claimDaily, dailyMissionPool, dailyMissionsFor,
  dailyStatus, npcOfDay, sanitizeDailyMissions, type DailyMissionsState,
} from './dailyMissions';
import { applyEssences } from './essences';

const BOND_MAX = 10;
const dia = (i: number) => `2026-11-${String(1 + i).padStart(2, '0')}`;

describe('missões dos NPCs (REGISTRO §313)', () => {
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

  it('rotação DETERMINÍSTICA por dia: mesmo dia = mesmo NPC; um ciclo inteiro passa cada NPC exatamente uma vez', () => {
    const n = NPC_MISSIONS.length;
    for (let i = 0; i < 6; i += 1) expect(npcOfDay(dia(i), BOND_MAX)?.id).toBe(npcOfDay(dia(i), BOND_MAX)?.id);
    const ciclo = Array.from({ length: n }, (_, i) => npcOfDay(`2026-12-${String(1 + i).padStart(2, '0')}`, BOND_MAX)!.id);
    expect(new Set(ciclo).size).toBe(n);
    expect([...ciclo].sort()).toEqual(NPC_MISSIONS.map(m => m.id).sort());
    // dias seguidos mudam o NPC
    expect(npcOfDay('2026-12-01', BOND_MAX)!.id).not.toBe(npcOfDay('2026-12-02', BOND_MAX)!.id);
    // o ciclo recomeça igual (dia + N)
    const d0 = Date.UTC(2026, 11, 1);
    const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
    expect(npcOfDay(iso(d0 + n * 86400000), BOND_MAX)!.id).toBe(npcOfDay(iso(d0), BOND_MAX)!.id);
  });

  it('Vínculo baixo: o dia traz o próximo NPC com prédio aberto (nunca um trancado)', () => {
    for (let i = 0; i < 30; i += 1) {
      const m = npcOfDay(dia(i % 28), 1)!;
      expect(m).toBeTruthy();
      expect(BUILDING_GATES[m.building].minBond).toBeLessThanOrEqual(1);
    }
  });

  it('a lista do dia abre com a missão do NPC e continua com no máximo DAILY_MISSION_COUNT (sem NPC repetido)', () => {
    for (let i = 0; i < 20; i += 1) {
      const l = dailyMissionsFor(dia(i), BOND_MAX);
      expect(l.length).toBeLessThanOrEqual(DAILY_MISSION_COUNT);
      expect(l[0].npc).toBeTruthy();
      expect(l.filter(m => m.npc)).toHaveLength(1);
    }
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
    for (let i = 0; i < NPC_MISSIONS.length; i += 1) { const c = `2027-01-${String(1 + i).padStart(2, '0')}`; if (npcOfDay(c, BOND_MAX)!.id === 'n-vesca') { d = c; break; } }
    expect(d).not.toBe('');
    const m = dailyMissionsFor(d, BOND_MAX)[0];
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
