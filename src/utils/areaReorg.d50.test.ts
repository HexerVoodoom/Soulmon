/**
 * D-50 (19/10/2026, dono) — reorganização das áreas: a Biblioteca e o Círculo de Amigos saem do Hall e vão para o
 * Laboratório; o Hall fica com Feira, Clan Hall (`guilda`) e Grove. Trava: as listas de lotes, a migração do save
 * (idempotente, sem chave nova de storage), os atalhos e a geometria (Biblioteca inteira na 1ª tela, 360×640 — D-47;
 * Perfil ~15% maior — D-44).
 */
import { describe, it, expect } from 'vitest';
import { hallLots, laboratorioLots } from './areaSheetCopy';
import { BUILDING_GATES, MOVED_BUILDINGS, currentBuildingId } from './gates';
import { sanitizeBuildingQuests, QUEST_BUILDINGS, stockOf, materialOf } from './buildingQuests';
import { sanitizeBuildingIntrosSeen } from './buildingIntro';
import { sanitizeFirstTimes, FIRST_TIME_IDS } from './dailyMissions';
import { lotHitRects } from './areaLotGeometry';
import { buildingDestination } from '../navigation';

describe('D-50: as listas de lotes', () => {
  it('o Hall tem EXATAMENTE três prédios (Feira, Grove, Clan Hall) e o Laboratório seis', () => {
    expect(hallLots('pt-BR').map(l => l.id).sort()).toEqual(['feira', 'grove', 'guilda']);
    expect(laboratorioLots('pt-BR').map(l => l.id).sort()).toEqual(['amigos', 'biblioteca', 'evolucao', 'perfil', 'pet', 'stats']);
    expect(Object.keys(BUILDING_GATES).filter(id => id.startsWith('hall.')).sort()).toEqual(['hall.feira', 'hall.grove', 'hall.guilda']);
    expect(Object.keys(BUILDING_GATES)).not.toContain('hall.biblioteca');
    expect(Object.keys(BUILDING_GATES)).not.toContain('hall.amigos');
  });
  it('o Vínculo de Biblioteca e Amigos é o de antes (2); o Grove abre com o Clan Hall', () => {
    expect(BUILDING_GATES['laboratorio.biblioteca'].minBond).toBe(2);
    expect(BUILDING_GATES['laboratorio.amigos'].minBond).toBe(2);
    expect(BUILDING_GATES['hall.grove'].minBond).toBe(BUILDING_GATES['hall.guilda'].minBond);
    expect(QUEST_BUILDINGS).toContain('laboratorio.biblioteca');
    expect(materialOf('laboratorio.biblioteca')).toBe('page');
    expect(materialOf('laboratorio.amigos')).toBe('keepsake');
  });
});

describe('D-50: migração do save (idempotente, sem chave nova)', () => {
  const antigo = {
    day: 'Mon Oct 19 2026',
    visited: ['hall.biblioteca', 'hall.guilda', 'laboratorio.pet'],
    claimed: ['hall.amigos', 'hall.feira'],
    materials: { page: 4, keepsake: 2, crest: 1 },
  };
  it('missões de prédio: ids antigos viram `laboratorio.*`, o progresso e o estoque seguem', () => {
    const novo = sanitizeBuildingQuests(antigo)!;
    expect(novo.visited).toEqual(['laboratorio.biblioteca', 'hall.guilda', 'laboratorio.pet', 'laboratorio.amigos', 'hall.feira'].filter(x => novo.visited.includes(x as never)));
    expect(novo.visited).toContain('laboratorio.biblioteca');
    expect(novo.claimed).toEqual(['laboratorio.amigos', 'hall.feira']);
    expect(novo.visited).toContain('laboratorio.amigos'); // pago implica ter entrado
    expect(stockOf(novo, 'page')).toBe(4);
    expect(stockOf(novo, 'keepsake')).toBe(2);
    expect(JSON.stringify(novo)).not.toMatch(/hall\.(biblioteca|amigos)/);
  });
  it('rodar duas vezes = no-op (a 2ª saída é igual à 1ª)', () => {
    const a = sanitizeBuildingQuests(antigo);
    expect(sanitizeBuildingQuests(JSON.parse(JSON.stringify(a)))).toEqual(a);
  });
  it('id velho e novo juntos não duplicam', () => {
    const r = sanitizeBuildingQuests({ day: 'd', visited: ['hall.biblioteca', 'laboratorio.biblioteca'], claimed: [], materials: {} })!;
    expect(r.visited).toEqual(['laboratorio.biblioteca']);
  });
  it('apresentações já vistas: não reaparecem (e a 2ª rodada é igual)', () => {
    const a = sanitizeBuildingIntrosSeen(['hall.biblioteca', 'hall.amigos', 'hall.guilda'], 1);
    expect(a).toEqual(['laboratorio.biblioteca', 'laboratorio.amigos', 'hall.guilda']);
    expect(sanitizeBuildingIntrosSeen(a, 1)).toEqual(a);
  });
  it('"primeiras vezes" cumpridas e resgatadas seguem para o id novo (e a 2ª rodada é igual)', () => {
    const a = sanitizeFirstTimes({ done: ['visit:hall.biblioteca', 'visit:hall.amigos'], claimed: ['visit:hall.amigos'] })!;
    expect(a.done).toEqual(['visit:laboratorio.biblioteca', 'visit:laboratorio.amigos']);
    expect(a.claimed).toEqual(['visit:laboratorio.amigos']);
    expect(sanitizeFirstTimes(JSON.parse(JSON.stringify(a)))).toEqual(a);
    expect(FIRST_TIME_IDS).not.toContain('visit:hall.biblioteca');
    expect(FIRST_TIME_IDS).toContain('visit:laboratorio.biblioteca');
    expect(FIRST_TIME_IDS).not.toContain('visit:hall.grove'); // o Grove não paga primeira vez
  });
  it('a tabela de ids movidos é a mesma que o save usa', () => {
    expect(MOVED_BUILDINGS['hall.biblioteca']).toBe('laboratorio.biblioteca');
    expect(currentBuildingId('laboratorio.biblioteca')).toBe('laboratorio.biblioteca');
    expect(currentBuildingId(42)).toBe(42);
  });
  it('beta3 N8/N10: ids antigos migram na leitura (Fenda → arena.fenda, Prepare to Focus → oficina), idempotente; save velho segue válido', () => {
    expect(currentBuildingId('exploracao.masmorra')).toBe('arena.fenda');
    expect(currentBuildingId('exploracao.preparar')).toBe('exploracao.oficina');
    expect(currentBuildingId(currentBuildingId('exploracao.masmorra'))).toBe('arena.fenda');
    expect(BUILDING_GATES).not.toHaveProperty('exploracao.masmorra');
    expect(BUILDING_GATES).not.toHaveProperty('exploracao.preparar');
    const velho = sanitizeFirstTimes({ done: ['visit:exploracao.masmorra', 'first-dungeon'], claimed: ['visit:exploracao.masmorra'] })!;
    expect(velho.done).toContain('visit:arena.fenda');
    expect(velho.claimed).toEqual(['visit:arena.fenda']);
    expect(sanitizeFirstTimes(JSON.parse(JSON.stringify(velho)))).toEqual(velho);
  });
});

describe('D-50: atalhos e deep links', () => {
  it('missão/atalho para Biblioteca e Amigos leva ao Laboratório (id novo ou antigo)', () => {
    for (const id of ['laboratorio.biblioteca', 'hall.biblioteca']) expect(buildingDestination(id)).toEqual({ kind: 'lot', area: 'laboratorio', lot: 'biblioteca' });
    for (const id of ['laboratorio.amigos', 'hall.amigos']) expect(buildingDestination(id)).toEqual({ kind: 'lot', area: 'laboratorio', lot: 'amigos' });
    expect(buildingDestination('hall.grove')).toEqual({ kind: 'lot', area: 'hall', lot: 'grove' });
  });
});

describe('D-47 / D-44: geometria no Laboratório', () => {
  it('D-47: a Biblioteca aparece INTEIRA na primeira tela do Laboratório em 360×640 (caixa e rótulo dentro da viewport, abaixo da barra do topo)', () => {
    const lot = laboratorioLots('pt-BR').find(l => l.id === 'biblioteca')!;
    const [art, label] = lotHitRects('laboratorio', lot, 360, 640);
    expect(art.x0).toBeGreaterThanOrEqual(0);
    expect(art.x1).toBeLessThanOrEqual(360);
    expect(art.y0).toBeGreaterThanOrEqual(48); // sob a barra do topo
    expect(label.y1).toBeLessThanOrEqual(640);
    expect(label.x0).toBeGreaterThanOrEqual(0);
    expect(label.x1).toBeLessThanOrEqual(360);
  });
  it('D-44: o Perfil ficou ~15% maior (36% → 41%)', () => {
    const w = parseFloat(laboratorioLots('pt-BR').find(l => l.id === 'perfil')!.width!);
    expect(w / 36).toBeGreaterThanOrEqual(1.13);
    expect(w / 36).toBeLessThanOrEqual(1.17);
  });
});
