import { describe, it, expect } from 'vitest';
import { MATERIAL_IDS, MATERIAL_BUILDING, LISTED_QUEST_BUILDINGS } from './buildingQuests';
import { MATERIALS } from './buildingQuestsCopy';
import { FORGE_PIECES } from './forge';
import { DISHES } from './restaurant';
import { FOCUS_ENVIRONMENTS } from './focusExpedition';
import { EXTRA_MATERIALS, guideOfMaterial, guideOfExtra, usesOfMaterial, expeditionsOf } from './materialGuide';

describe('guia dos materiais: onde conseguir e para que serve (derivado do código)', () => {
  it('os 16 materiais têm nome/ícone e prédio dono', () => {
    expect(MATERIALS.map(m => m.id).sort()).toEqual([...MATERIAL_IDS].sort());
    for (const id of MATERIAL_IDS) expect(MATERIAL_BUILDING[id]).toBeTruthy();
  });
  it('todo material tem uma frase de "onde conseguir" com o prédio, em PT e EN', () => {
    for (const id of MATERIAL_IDS) {
      expect(guideOfMaterial(id, true, 'Prédio X').sources).toContain('Prédio X');
      expect(guideOfMaterial(id, false, 'Building X').sources).toContain('Building X');
    }
  });
  it('as receitas do Soulsmith são a fonte: cada material de cada peça aparece nos usos desse material', () => {
    for (const p of FORGE_PIECES) for (const m of p.mats) {
      expect(usesOfMaterial(m, true).join(' ')).toContain('Soulsmith');
    }
    // principal x apoio respeita a ordem de `mats`
    expect(usesOfMaterial('ore', true).join(' ')).toMatch(/principal para aprimorar Núcleo de cobre\./);
    expect(usesOfMaterial('ore', true).join(' ')).toMatch(/apoio .* Núcleo polido\./);
    expect(usesOfMaterial('gear', true).join(' ')).toMatch(/principal para aprimorar Rastro polido\./);
    expect(usesOfMaterial('gear', true).join(' ')).toMatch(/apoio .* Núcleo de cobre e Rastro ornado\./);
  });
  it('o Restaurante entra nos usos dos materiais que ele consome (e só deles)', () => {
    const usados = new Set(DISHES.flatMap(d => (d.extra.type === 'material' ? [d.extra.id] : [])));
    for (const id of MATERIAL_IDS) {
      expect(usesOfMaterial(id, true).some(u => u.startsWith('Restaurante')), id).toBe(usados.has(id));
    }
  });
  it('"só por entrar" só vale para prédio que paga na entrada: o Caderno (listado) pede registro + resgate', () => {
    for (const id of MATERIAL_IDS) {
      const listado = (LISTED_QUEST_BUILDINGS as readonly string[]).includes(MATERIAL_BUILDING[id]);
      expect(guideOfMaterial(id, true, 'X').sources.includes('só por entrar'), id).toBe(!listado);
      expect(guideOfMaterial(id, false, 'X').sources.includes('just by stepping in'), id).toBe(!listado);
    }
    expect(guideOfMaterial('ink', true, 'Caderno').sources).toMatch(/registro/);
  });
  it('as expedições do Foco entram na fonte', () => {
    for (const id of MATERIAL_IDS) {
      const envs = expeditionsOf(id);
      expect(envs.length, id).toBeGreaterThan(0);
      for (const e of envs) expect(guideOfMaterial(id, true, 'X').sources).toContain(e.pt);
    }
    expect(FOCUS_ENVIRONMENTS.length).toBeGreaterThan(0);
  });
  it('MATERIAIS SEM USO HOJE (auditoria, 10/11/2026): lista fechada — se um ganhar uso, esta linha muda', () => {
    const semUso = MATERIAL_IDS.filter(id => usesOfMaterial(id, true).length === 0).sort();
    expect(semUso).toEqual(['cipher', 'essence', 'ink', 'keepsake', 'page', 'prism']);
  });
  it('os 3 recursos extras têm fonte e (ou) uso reais', () => {
    expect(EXTRA_MATERIALS.map(x => x.id)).toEqual(['soulsmith-fragment', 'boss-shard', 'essences']);
    const frag = guideOfExtra('soulsmith-fragment', true);
    expect(frag.sources).toMatch(/Fenda/);
    expect(frag.uses.join(' ')).toMatch(/refazer a escolha/);
    const boss = guideOfExtra('boss-shard', false);
    expect(boss.sources).toMatch(/Elemental Fusion/);
    expect(boss.uses).toEqual([]); // sem uso hoje
    const ess = guideOfExtra('essences', true);
    expect(ess.uses.join(' ')).toMatch(/Poção de Elemento/);
    expect(ess.uses.join(' ')).toMatch(/Restaurante/);
  });
});
