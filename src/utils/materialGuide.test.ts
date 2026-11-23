import { describe, it, expect } from 'vitest';
import { MATERIAL_IDS, MATERIAL_BUILDING } from './buildingQuests';
import { MATERIALS } from './buildingQuestsCopy';
import { FORGE_PIECES } from './forge';
import { DISHES } from './restaurant';
import { FOCUS_ENVIRONMENTS } from './focusExpedition';
import { EXTRA_MATERIALS, guideOfMaterial, guideOfExtra, usesOfMaterial, usePlacesOfMaterial, expeditionsOf } from './materialGuide';

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
  it('as expedições do Foco entram na fonte', () => {
    for (const id of MATERIAL_IDS) {
      const envs = expeditionsOf(id);
      expect(envs.length, id).toBeGreaterThan(0);
      expect(guideOfMaterial(id, true, 'X').sources).toContain('Expedições do Foco');
    }
    expect(FOCUS_ENVIRONMENTS.length).toBeGreaterThan(0);
  });
  it('MATERIAIS SEM USO HOJE (auditoria, 10/11/2026): lista fechada — se um ganhar uso, esta linha muda', () => {
    const semUso = MATERIAL_IDS.filter(id => usesOfMaterial(id, true).length === 0).sort();
    expect(semUso).toEqual(['cipher', 'essence', 'ink', 'keepsake', 'page', 'prism']);
  });
  it('os 2 recursos extras (sem Essências: ficam só no Arquivo) têm fonte e uso reais', () => {
    expect(EXTRA_MATERIALS.map(x => x.id)).toEqual(['soulsmith-fragment', 'boss-shard']);
    const frag = guideOfExtra('soulsmith-fragment', true);
    expect(frag.sources).toMatch(/Fenda/);
    expect(frag.uses).toEqual(['Soulsmith']);
    const boss = guideOfExtra('boss-shard', false);
    expect(boss.sources).toMatch(/Elemental Fusion/);
    expect(boss.uses).toEqual([]); // sem uso hoje
  });
  it('formato enxuto: "onde conseguir" é só lugares; "onde usa" é só lugares (Soulsmith/Restaurante)', () => {
    expect(guideOfMaterial('ore', true, 'Mina').sources).toMatch(/^Mina(, Expedições do Foco)?$/);
    expect(guideOfMaterial('ore', false, 'Mine').sources).toMatch(/^Mine(, Focus expeditions)?$/);
    for (const id of MATERIAL_IDS) {
      for (const u of usePlacesOfMaterial(id, true)) expect(['Soulsmith', 'Restaurante']).toContain(u);
      expect(guideOfMaterial(id, true, 'X').uses).toEqual(usePlacesOfMaterial(id, true));
    }
    expect(guideOfMaterial('cipher', true, 'X').uses).toEqual([]);
  });
});
