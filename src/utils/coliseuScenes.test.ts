import { describe, it, expect } from 'vitest';
import { COLISEU_TIERS, coliseuSceneFor, coliseuTierOf } from './coliseuScenes';
import { RUN_SCENE_POOL, ARENA_BG_SCENES } from './dungeonScenes';

describe('coliseuScenes', () => {
  it('faixa → coliseu; assentos usam o diamante; lixo cai na madeira', () => {
    expect(coliseuTierOf('mestre')).toBe('diamante');
    expect(coliseuTierOf('grao-mestre')).toBe('diamante');
    expect(coliseuTierOf(undefined)).toBe('madeira');
    expect(coliseuTierOf('xx')).toBe('madeira');
  });
  it('cada faixa tem arte própria; nome é o da faixa pedida; assentos usam a do diamante', () => {
    const bgs = COLISEU_TIERS.map(t => coliseuSceneFor(t).bg);
    expect(new Set(bgs).size).toBe(COLISEU_TIERS.length);
    for (const bg of bgs) expect(bg).not.toContain('undefined');
    expect(coliseuSceneFor('ouro').namePt).toBe('Coliseu de Ouro');
    expect(coliseuSceneFor('mestre').bg).toBe(coliseuSceneFor('diamante').bg);
  });
  it('as arenas da Arena não entram no sorteio da masmorra', () => {
    for (const a of ARENA_BG_SCENES) expect(RUN_SCENE_POOL).not.toContain(a);
  });
});
