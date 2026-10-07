// @vitest-environment jsdom
/**
 * A DEMO LOCAL (07/10/2026) — o predicado, o save que ela monta e as quatro
 * regras do dono: salva só no aparelho, não ganha XP, não compra, não entra em
 * PvP. Também trava os 5 iniciais (nomes, tipos, arte) e os saves ANTIGOS com os
 * seis `demoCharacterId` de antes, que têm de continuar renderizando.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isDemoMode, DEMO_BOND_LEVEL, DEMO_BLOCKED_LOTS, isDemoBlockedLot, demoRefusalText,
} from './demoMode';
import { buildDemoPatch, demoTotalXP, leaveDemo, DEMO_ACTIVITIES } from './demoStart';
import { awardBondXP, bondLevelFor, xpForLevel } from './bond';
import { feedFood } from './careRules';
import { cloudSave, cloudSaveComRetry, reconcileSaveId } from './cloudSave';
import {
  PREMADE_CHARACTERS,
} from './monetization';
import {
  STARTER_IDS, STARTER_NAMES, STARTER_SPRITES, LEGACY_PREMADE_IDS, DEMO_CHARACTER_IDS,
  DUNGEON_LINE_SPRITES, getSpriteForStage, resolveLineForStage, isStarterId,
} from './sprites';
import { DERIVED_ELEMENT_PAIRS, BASE_ELEMENT_LABELS } from './soulProfile/derivedElements';
import { essenceEn } from './soulProfile/essenceLabels';
import { STORAGE_KEYS } from './storageKeys';

const DIA = '2026-10-07';

describe('o predicado — dono único', () => {
  it('só `demoLocal === true` é demo', () => {
    expect(isDemoMode({ demoLocal: true })).toBe(true);
    expect(isDemoMode({ demoLocal: false })).toBe(false);
    expect(isDemoMode({})).toBe(false);
    expect(isDemoMode(null)).toBe(false);
    expect(isDemoMode(undefined)).toBe(false);
    expect(isDemoMode({ demoLocal: 'true' as unknown as boolean })).toBe(false);
  });

  it('NÃO é `accountTier: demo` (o plano grátis tem conta, nuvem e XP)', () => {
    expect(isDemoMode({ accountTier: 'demo' } as never)).toBe(false);
  });

  it('a recusa é curta, sem culpa, nos dois idiomas (EN primeiro)', () => {
    expect(demoRefusalText(false)).toBe('Not available in the demo.');
    expect(demoRefusalText(true)).toBe('Não disponível na demo.');
    for (const t of [demoRefusalText(false), demoRefusalText(true)]) expect(t).not.toMatch(/!|você não|you can't|you cannot/i);
  });

  it('os prédios sociais da demo: Arena (Torneio, Duelo, Feira) e Hall (Biblioteca, Amigos, Guilda)', () => {
    expect(DEMO_BLOCKED_LOTS.arena).toEqual(['torneio', 'duelo', 'feira']);
    expect(DEMO_BLOCKED_LOTS.hall).toEqual(['biblioteca', 'amigos', 'guilda']);
    expect(isDemoBlockedLot('arena', 'torneio')).toBe(true);
    expect(isDemoBlockedLot('mercado', 'itens')).toBe(false);
    expect(isDemoBlockedLot('exploracao', 'masmorra')).toBe(false);
  });
});

describe('o save da demo — Vínculo 5, sem gravar `bondLevel`', () => {
  const patch = buildDemoPatch('industrial', { isPt: false, dayKey: DIA, now: new Date('2026-10-07T12:00:00Z') })!;

  it('`totalXP` é o MÍNIMO do nível 5 e `bondLevelFor` devolve 5', () => {
    expect(DEMO_BOND_LEVEL).toBe(5);
    expect(patch.totalXP).toBe(xpForLevel(5));
    expect(demoTotalXP()).toBe(xpForLevel(5));
    expect(bondLevelFor(patch.totalXP as number)).toBe(5);
    expect(bondLevelFor((patch.totalXP as number) - 1)).toBe(4);
    expect('bondLevel' in patch).toBe(false);
  });

  it('é demo local, mas NUNCA `paid`, e escolhe o personagem entre os 5', () => {
    expect(isDemoMode(patch as never)).toBe(true);
    expect(patch.accountTier).toBe('demo');
    expect(patch.demoCharacterId).toBe('industrial');
    expect(patch.evolutionStage).toBe('rookie');
  });

  it('nasce com atividades de cuidado nos dois idiomas, sem cobrança no texto', () => {
    const pt = buildDemoPatch('vida', { isPt: true, dayKey: DIA })!;
    expect((patch.activities as { name: string }[]).length).toBe(DEMO_ACTIVITIES.length);
    expect((pt.activities as { name: string }[])[0].name).toBe(DEMO_ACTIVITIES[0].name.pt);
    for (const a of DEMO_ACTIVITIES) expect(`${a.name.en} ${a.name.pt}`).not.toMatch(/dívida|atrasad|debt|overdue|failed/i);
  });

  it('só os 5 iniciais abrem uma demo — os seis antigos e ids soltos não', () => {
    for (const id of STARTER_IDS) expect(buildDemoPatch(id, { isPt: false, dayKey: DIA })).not.toBeNull();
    for (const id of LEGACY_PREMADE_IDS) expect(buildDemoPatch(id, { isPt: false, dayKey: DIA })).toBeNull();
    expect(buildDemoPatch('ninguem', { isPt: false, dayKey: DIA })).toBeNull();
  });

  it('o ritual de check-in não abre em cima de quem acabou de chegar', () => {
    expect(patch.lastCheckInDate).toBe(DIA);
  });
});

describe('(b) NÃO ganha XP — o nível fica fixo em 5', () => {
  const base = { ...buildDemoPatch('meteoro', { isPt: false, dayKey: DIA })!, totalXP: xpForLevel(5) } as { totalXP: number; demoLocal?: boolean };

  it('`awardBondXP` devolve a MESMA referência para todo evento', () => {
    const eventos = [
      { kind: 'completion', weight: 3 }, { kind: 'perfectDay' }, { kind: 'restNight' }, { kind: 'dreamNew' },
      { kind: 'dungeonFloor' }, { kind: 'dungeonRun' }, { kind: 'tournamentMatch', won: true },
      { kind: 'habitMilestone', days: 66 }, { kind: 'triageCleared' }, { kind: 'checkIn' },
    ] as const;
    for (const e of eventos) {
      expect(awardBondXP(base, e as never, DIA)).toBe(base);
      expect(bondLevelFor(awardBondXP(base, e as never, DIA).totalXP)).toBe(5);
    }
  });

  it('o MESMO evento rende XP fora da demo (a trava é do predicado, não do evento)', () => {
    const real = { totalXP: xpForLevel(5) };
    expect(awardBondXP(real, { kind: 'perfectDay' }, DIA).totalXP).toBeGreaterThan(real.totalXP);
  });

  it('comer não rende XP na demo (a outra porta do `totalXP`, em `careRules`)', () => {
    const estado = {
      healthPoints: 3, maxHealthPoints: 3, energyPoints: 0, evolutionStage: 'rookie',
      foodInventory: { '🍎': 2 }, powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0,
      totalXP: xpForLevel(5), attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
    };
    const T = 1_000_000;
    const naDemo = feedFood({ ...estado, demoLocal: true }, '🍎', [], T).state;
    const fora = feedFood({ ...estado }, '🍎', [], T).state;
    expect(naDemo.totalXP).toBe(estado.totalXP);
    expect(fora.totalXP).toBeGreaterThan(estado.totalXP);
    // o atributo SOBE nos dois: a comida continua alimentando o galho, só não vira Vínculo
    expect(naDemo.powerPoints + naDemo.harmonyPoints + naDemo.benevolencePoints).toBeGreaterThan(0);
  });
});

describe('(a) salva SÓ no aparelho — a nuvem não é chamada', () => {
  const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  beforeEach(() => { fetchMock.mockClear(); vi.stubGlobal('fetch', fetchMock); localStorage.clear(); });
  afterEach(() => { vi.unstubAllGlobals(); });
  const demoState = { demoLocal: true, totalXP: xpForLevel(5) };

  it('`cloudSave` recusa a demo sem tocar a rede, sem retry e sem aviso ao jogador', async () => {
    const r = await cloudSave('qualquer-id', demoState);
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.retentavel).toBe(false); expect(r.avisaJogador).toBe(false); }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('`cloudSaveComRetry` idem (e não gasta orçamento de retry)', async () => {
    const r = await cloudSaveComRetry('qualquer-id', demoState);
    expect(r.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('`reconcileSaveId` não migra a demo para a conta por acidente: não lê, não sobe, não troca o `saveId`', async () => {
    localStorage.setItem(STORAGE_KEYS.SAVE_ID, 'id-aleatorio-local');
    const r = await reconcileSaveId('alguem@example.com', demoState);
    expect(r.estado).toBe('sem-mudanca');
    expect(localStorage.getItem(STORAGE_KEYS.SAVE_ID)).toBe('id-aleatorio-local');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('o mesmo save SEM `demoLocal` ainda sobe (a trava é só da demo)', async () => {
    const r = await cloudSave('qualquer-id', { totalXP: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(r.ok).toBe(true);
  });

  it('sair da demo apaga o save local e os carimbos de onboarding, e recarrega', () => {
    for (const k of [STORAGE_KEYS.GAME_STATE, STORAGE_KEYS.SAVE_ID, STORAGE_KEYS.ONBOARDING_COMPLETE, STORAGE_KEYS.TUTORIAL_COMPLETE]) {
      localStorage.setItem(k, 'x');
    }
    const recarregar = vi.fn();
    leaveDemo({ recarregar });
    for (const k of [STORAGE_KEYS.GAME_STATE, STORAGE_KEYS.SAVE_ID, STORAGE_KEYS.ONBOARDING_COMPLETE, STORAGE_KEYS.TUTORIAL_COMPLETE]) {
      expect(localStorage.getItem(k)).toBeNull();
    }
    expect(recarregar).toHaveBeenCalledOnce();
  });
});

describe('os 5 personagens iniciais', () => {
  it('são exatamente os 5 oferecidos, na ordem, com o nome do dono único', () => {
    expect(PREMADE_CHARACTERS.map(c => c.id)).toEqual([...STARTER_IDS]);
    expect(PREMADE_CHARACTERS.map(c => c.name)).toEqual(STARTER_IDS.map(id => STARTER_NAMES[id]));
  });

  it('nomes originais: curtos, sem sufixo `-mon`, sem repetir linha da masmorra', () => {
    const nomes = STARTER_IDS.map(id => STARTER_NAMES[id]);
    expect(new Set(nomes).size).toBe(5);
    for (const n of nomes) { expect(n).not.toMatch(/mon$/i); expect(n.length).toBeLessThanOrEqual(8); expect(n).toMatch(/^[A-Z][a-z]+$/); }
  });

  it('o mapeamento de tipo bate com o class-system: ids reais, rótulos PT e EN iguais aos do dono', () => {
    const mapa: Record<string, { elementId: string; essence: string[] }> = {
      industrial: { elementId: 'industrial', essence: ['aco', 'ariete'] },
      nascente: { elementId: 'agua', essence: ['nascente', 'melodia'] },
      alento: { elementId: 'ar', essence: ['alento'] },
      vida: { elementId: 'planta', essence: ['vida'] },
      meteoro: { elementId: 'fogo', essence: ['meteoro'] },
    };
    for (const c of PREMADE_CHARACTERS) {
      expect(c.elementId).toBe(mapa[c.id].elementId);
      expect([...c.essence]).toEqual(mapa[c.id].essence);
      const nomePt = (id: string) => DERIVED_ELEMENT_PAIRS.find(d => d.id === id)?.nome ?? (BASE_ELEMENT_LABELS as Record<string, string>)[id];
      expect(c.essence.map(nomePt).join(' + ')).toBe(c.typePt);
      expect(c.essence.map(id => essenceEn(id)).join(' + ')).toBe(c.typeEn);
    }
  });

  it('a arte: um PNG 512² por personagem, o MESMO sprite em todos os estágios', () => {
    for (const id of STARTER_IDS) {
      expect(isStarterId(id)).toBe(true);
      const url = STARTER_SPRITES[id];
      expect(typeof url).toBe('string');
      for (const stage of ['rookie', 'champion-power', 'ultimate-harmony', 'mega-benevolence', 'ultra']) {
        expect(getSpriteForStage(stage, id)).toBe(url);
      }
      expect(resolveLineForStage('rookie', id)).toBeNull();
    }
    expect(new Set(STARTER_IDS.map(id => STARTER_SPRITES[id])).size).toBe(5);
  });
});

describe('saves antigos com `demoCharacterId` de um dos seis de antes', () => {
  it('seguem resolvendo o MESMO sprite de sempre, estágio a estágio', () => {
    for (const id of LEGACY_PREMADE_IDS) {
      for (const stage of ['rookie', 'champion', 'ultimate', 'mega'] as const) {
        expect(getSpriteForStage(stage, id)).toBe(DUNGEON_LINE_SPRITES[id][stage]);
      }
      expect(resolveLineForStage('rookie', id)).toEqual({ line: id, tier: 'rookie' });
      expect(isStarterId(id)).toBe(false);
    }
  });

  it('o roster da masmorra NÃO ganhou os iniciais (continua 9 linhas)', () => {
    expect(Object.keys(DUNGEON_LINE_SPRITES).length).toBe(9);
    for (const id of STARTER_IDS) expect(DUNGEON_LINE_SPRITES[id]).toBeUndefined();
  });

  it('o conjunto válido de `demoCharacterId` é os 5 novos + os 6 antigos', () => {
    expect([...DEMO_CHARACTER_IDS].sort()).toEqual([...STARTER_IDS, ...LEGACY_PREMADE_IDS].sort());
  });
});
