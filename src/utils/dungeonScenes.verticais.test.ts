/**
 * D-79 (19/10/2026): a masmorra só sorteia cenas VERTICAIS. O campo de batalha é uma caixa alta (`cover`); um cenário horizontal
 * (ex.: `bg-sakura`, do box do pet) virava um tile enorme e repetido. A régua lê o cabeçalho PNG de CADA cena do pool.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PET_BACKGROUNDS } from './backgrounds';
import { RUN_SCENE_POOL, buildRunScenes, DUNGEON_SCENES } from './dungeonScenes';

const RAIZ = join(__dirname, '..', '..');
/** Largura × altura do PNG a partir do `url(...)` do `background` (o Vite devolve o caminho de `src/assets/...`). */
function dimensoes(bg: string): { w: number; h: number } | null {
  const m = bg.match(/url\(["']?([^"')]+)["']?\)/);
  if (!m) return null;
  const rel = m[1].replace(/^\/@fs\//, '').replace(/\?.*$/, '');
  const candidatos = [join(RAIZ, rel.replace(/^\//, '')), rel];
  const arq = candidatos.find(existsSync);
  if (!arq) return null;
  const d = readFileSync(arq);
  return { w: d.readUInt32BE(16), h: d.readUInt32BE(20) };
}

describe('masmorra: cenas só verticais', () => {
  it('toda cena do pool é mais ALTA que larga (retrato, ≥ 1,5)', () => {
    expect(RUN_SCENE_POOL.length).toBeGreaterThanOrEqual(20);
    for (const sc of RUN_SCENE_POOL) {
      const d = dimensoes(sc.bg);
      expect(d, `${sc.nameEn}: não achei o PNG de ${sc.bg}`).not.toBeNull();
      expect(d!.h / d!.w, sc.nameEn).toBeGreaterThanOrEqual(1.5);
    }
  });

  it('nenhum cenário da LOJA (horizontal, do box do pet) entra no sorteio — nem o Cerejeira (`bg-sakura`)', () => {
    const lojaCss = Object.values(PET_BACKGROUNDS).map(b => b.css);
    for (const sc of RUN_SCENE_POOL) expect(lojaCss).not.toContain(sc.bg);
    expect(RUN_SCENE_POOL.some(sc => /sakura|cerejeira|cherry/i.test(`${sc.nameEn} ${sc.namePt} ${sc.bg}`))).toBe(false);
    for (let i = 0; i < 40; i++) for (const sc of buildRunScenes()) expect(RUN_SCENE_POOL).toContain(sc);
  });

  it('cada corrida sorteia 5 cenas distintas e as 5 clássicas continuam no pool', () => {
    const run = buildRunScenes();
    expect(run).toHaveLength(5);
    expect(new Set(run).size).toBe(5);
    for (const sc of DUNGEON_SCENES) expect(RUN_SCENE_POOL).toContain(sc);
  });
});
