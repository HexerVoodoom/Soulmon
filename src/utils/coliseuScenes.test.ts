import { describe, it, expect } from 'vitest';
import { coliseuSceneFor, coliseuTierOf } from './coliseuScenes';
import { RUN_SCENE_POOL, ARENA_BG_SCENES } from './dungeonScenes';

describe('coliseuScenes', () => {
  it('faixa → coliseu; assentos usam o diamante; lixo cai na madeira', () => {
    expect(coliseuTierOf('mestre')).toBe('diamante');
    expect(coliseuTierOf('grao-mestre')).toBe('diamante');
    expect(coliseuTierOf(undefined)).toBe('madeira');
    expect(coliseuTierOf('xx')).toBe('madeira');
  });
  it('faixa sem arte usa a maior abaixo com arte; nome é o da faixa pedida', () => {
    const ouro = coliseuSceneFor('ouro');
    expect(ouro.bg).toBe(coliseuSceneFor('bronze').bg);
    expect(ouro.namePt).toBe('Coliseu de Ouro');
    expect(coliseuSceneFor('madeira').bg).not.toBe(coliseuSceneFor('bronze').bg);
  });
  it('as arenas da Arena não entram no sorteio da masmorra', () => {
    for (const a of ARENA_BG_SCENES) expect(RUN_SCENE_POOL).not.toContain(a);
  });
});
