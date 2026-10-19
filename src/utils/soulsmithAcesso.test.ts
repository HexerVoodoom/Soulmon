/**
 * 8.3 (beta-2) — "Soulsmith bloqueado mesmo após concluir scrolls e missões".
 *
 * CAUSA RAIZ (reproduzida no 1º teste): a missão de prédio só tem tela de "Resgatar" para os prédios LISTADOS (hoje só o Caderno, cujo
 * material — tinta — não é de peça nenhuma). Os outros prédios ficavam `ready` para sempre; sem resgate não nascia a peça de nível 1
 * (`applyForgeGrant`) nem o material de aprimoramento, e o Soulsmith abria vazio. O Vínculo NUNCA foi o problema (Vínculo 2 abre o prédio).
 * A correção é `applyBuildingEntry`: o prédio não listado paga na entrada. Nada é liberado artificialmente — Vínculo, 1 por dia e
 * peça única continuam valendo (testes abaixo, incluindo reabrir o app, trocar o relógio e entrar/sair repetido).
 */
import { describe, it, expect } from 'vitest';
import { applyBuildingEntry, applyForgeGrant, upgradeRefusal, type ForgeGameState } from './forgeActions';
import { visitBuilding, claimBuildingQuest, sanitizeBuildingQuests, stockOf, LISTED_QUEST_BUILDINGS, QUEST_BUILDINGS, type BuildingQuestState } from './buildingQuests';
import { sanitizeForge, FORGE_PIECES } from './forge';
import { sanitizeEquipment } from './equipment';
import { xpForLevel } from './bond';
import type { BuildingId } from './gates';

type S = ForgeGameState & { buildingQuests?: BuildingQuestState };
const base = (xp: number): S => ({ totalXP: xp });
const owned = (s: S) => sanitizeEquipment(s.equipment).owned;
const roundTrip = (s: S): S => {
  const j = JSON.parse(JSON.stringify(s)) as S;
  return { ...j, buildingQuests: sanitizeBuildingQuests(j.buildingQuests), forge: sanitizeForge(j.forge) };
};

describe('8.3 — causa raiz reproduzida (fluxo ANTIGO: só visita + resgate do prédio listado)', () => {
  it('visitar os 14 prédios não listados por 30 dias não rende peça nem material de peça; o Soulsmith segue vazio', () => {
    let s: S = base(xpForLevel(10));
    for (let d = 1; d <= 30; d++) {
      const day = `2026-11-${String(d).padStart(2, '0')}`;
      for (const id of QUEST_BUILDINGS) {
        // fluxo antigo: `visitBuilding` (presença) e, só para o listado, o Resgatar manual.
        const v = visitBuilding(s.buildingQuests, day, id, 10);
        s = { ...s, buildingQuests: v };
        if ((LISTED_QUEST_BUILDINGS as readonly string[]).includes(id)) {
          const r = claimBuildingQuest(s.buildingQuests, day, id, 10);
          if (r.paid) s = applyForgeGrant({ ...s, buildingQuests: r.state }, id);
        }
      }
    }
    expect(owned(s)).toEqual([]); // nenhuma peça
    for (const p of FORGE_PIECES) expect(stockOf(s.buildingQuests, p.mats[0])).toBe(0); // nenhum material de peça
  });
});

describe('8.3 — correção: entrar no prédio paga (uma vez por dia do jogador)', () => {
  const BOND2 = xpForLevel(2);
  it('Masmorra no Vínculo 2: entrar concede a peça de nível 1 e 1 minério; entrar de novo no mesmo dia não paga de novo', () => {
    const a = applyBuildingEntry(base(BOND2), '2026-11-01', 'exploracao.masmorra');
    expect(owned(a)).toEqual(['eq-nucleo-t1']);
    expect(stockOf(a.buildingQuests, 'ore')).toBe(1);
    const b = applyBuildingEntry(a, '2026-11-01', 'exploracao.masmorra');
    expect(b).toBe(a); // idempotente: MESMA referência
    let c = a;
    for (let i = 0; i < 20; i++) c = applyBuildingEntry(c, '2026-11-01', 'exploracao.masmorra'); // entra/sai repetido
    expect(stockOf(c.buildingQuests, 'ore')).toBe(1);
  });
  it('dia seguinte paga mais 1 (o material é o ritmo), a peça não duplica', () => {
    let s = applyBuildingEntry(base(BOND2), '2026-11-01', 'exploracao.masmorra');
    s = applyBuildingEntry(s, '2026-11-02', 'exploracao.masmorra');
    s = applyBuildingEntry(s, '2026-11-03', 'exploracao.masmorra');
    expect(stockOf(s.buildingQuests, 'ore')).toBe(3);
    expect(owned(s)).toEqual(['eq-nucleo-t1']);
  });
  it('reabrir o app (JSON + sanitize) preserva o pago e não repaga no mesmo dia', () => {
    const a = applyBuildingEntry(base(BOND2), '2026-11-01', 'exploracao.masmorra');
    const r = roundTrip(a);
    expect(owned(r)).toEqual(['eq-nucleo-t1']);
    expect(stockOf(r.buildingQuests, 'ore')).toBe(1);
    const again = applyBuildingEntry(r, '2026-11-01', 'exploracao.masmorra');
    expect(stockOf(again.buildingQuests, 'ore')).toBe(1);
  });
  it('trocar o relógio para trás (dia já pago) não repaga; o dia é o do JOGADOR, passado por parâmetro', () => {
    let s = applyBuildingEntry(base(BOND2), '2026-11-05', 'exploracao.masmorra');
    s = applyBuildingEntry(s, '2026-11-05', 'exploracao.masmorra');
    expect(stockOf(s.buildingQuests, 'ore')).toBe(1);
  });
  it('Vínculo insuficiente não paga (nada é liberado de graça): Duelo exige Vínculo 5', () => {
    const baixo = applyBuildingEntry(base(xpForLevel(2)), '2026-11-01', 'arena.duelo');
    expect(owned(baixo)).toEqual([]);
    expect(stockOf(baixo.buildingQuests, 'fang')).toBe(0);
    const alto = applyBuildingEntry(base(xpForLevel(5)), '2026-11-01', 'arena.duelo');
    expect(owned(alto)).toEqual(['eq-nucleo-t2']);
    expect(stockOf(alto.buildingQuests, 'fang')).toBe(1);
  });
  it('prédio sem peça paga só o material (Biblioteca); o Caderno (listado) segue manual', () => {
    const b = applyBuildingEntry(base(BOND2), '2026-11-01', 'laboratorio.biblioteca');
    expect(owned(b)).toEqual([]);
    expect(stockOf(b.buildingQuests, 'page')).toBe(1);
    const c = applyBuildingEntry(base(BOND2), '2026-11-01', 'exploracao.caderno');
    expect(stockOf(c.buildingQuests, 'ink')).toBe(0); // listado: a ação real + Resgatar
  });
  it('com o dia andando, o aprimoramento do Soulsmith passa a ter material (não fica "no-materials" para sempre)', () => {
    let s: S = base(xpForLevel(3));
    expect(upgradeRefusal(s, 'eq-nucleo-t1')).toBe('not-owned');
    for (let d = 1; d <= 6; d++) {
      const day = `2026-11-${String(d).padStart(2, '0')}`;
      for (const id of ['exploracao.masmorra', 'exploracao.oficina'] as BuildingId[]) s = applyBuildingEntry(s, day, id);
    }
    expect(owned(s)).toContain('eq-nucleo-t1');
    expect(upgradeRefusal(s, 'eq-nucleo-t1')).not.toBe('not-owned');
    expect(stockOf(s.buildingQuests, 'ore')).toBe(6);
  });
});
