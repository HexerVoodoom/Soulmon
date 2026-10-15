/**
 * OS 3 CENÁRIOS DE PESADELO (15/10/2026): sorteio determinístico por dia, cobertura dos três, fallback na Forja das Almas.
 */
import { describe, expect, it } from 'vitest';
import { NIGHTMARE_SCENE, NIGHTMARE_SCENES, nightmareScene, nightmareSceneIndex } from './dungeonScenes';

const dia = (i: number) => `2026-10-${String(1 + (i % 28)).padStart(2, '0')}`;

describe('cenários do Pesadelo', () => {
  it('são três, com nome PT/EN, destaque e `background` pintado (url + cor de reserva)', () => {
    expect(NIGHTMARE_SCENES).toHaveLength(3);
    expect(NIGHTMARE_SCENES.map(s => s.nameEn)).toEqual(['Glitch Abyss', 'Impossible Corridor', 'Endless Room']);
    for (const s of NIGHTMARE_SCENES) {
      expect(s.namePt && s.nameEn).toBeTruthy();
      expect(s.bg).toMatch(/^url\(.+\) center\/cover #05080c$/);
      expect(s.accent).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
  it('o sorteio é DETERMINÍSTICO pelo dia: o mesmo dia dá o mesmo cenário, sempre', () => {
    for (let i = 0; i < 28; i++) {
      expect(nightmareSceneIndex(dia(i))).toBe(nightmareSceneIndex(dia(i)));
      expect(nightmareScene(dia(i))).toBe(nightmareScene(dia(i)));
    }
  });
  it('em um mês aparecem os três cenários (nenhum fica órfão)', () => {
    const vistos = new Set(Array.from({ length: 28 }, (_, i) => nightmareSceneIndex(dia(i))));
    expect([...vistos].sort()).toEqual([0, 1, 2]);
  });
  it('o índice está sempre dentro da lista; lista vazia → 0 (o fallback cobre)', () => {
    for (let i = 0; i < 200; i++) expect(nightmareSceneIndex(`d${i}`, 3)).toBeLessThan(3);
    expect(nightmareSceneIndex('x', 0)).toBe(0);
  });
  it('sem dia explícito usa hoje e devolve um dos três; a Forja das Almas continua exportada como reserva', () => {
    expect(NIGHTMARE_SCENES).toContain(nightmareScene());
    expect(NIGHTMARE_SCENE.bg).toBeTruthy();
    expect(NIGHTMARE_SCENES).not.toContain(NIGHTMARE_SCENE);
  });
});
