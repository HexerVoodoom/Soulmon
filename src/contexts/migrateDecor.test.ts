import { describe, it, expect } from 'vitest';
import { migrateDecor } from './GameStateContext';
import type { GameState } from './GameStateContext';

// A migração do formato antigo de decoração (`equippedFurniture`, um item só,
// desenhado como badge de canto) para o palco (`equippedDecor`, um item por
// espaço). Não tinha teste nenhum — e foi exatamente aí que passou um bug que
// desfazia a escolha do jogador.

const save = (p: Partial<GameState>) => p as Partial<GameState>;

describe('migração de decoração', () => {
  it('leva o item antigo para o espaço que ele declara', () => {
    expect(migrateDecor(save({ equippedFurniture: 'furn-sofa' })))
      .toEqual({ 'floor-left': 'furn-sofa' });
  });

  it('save sem nada continua sem nada', () => {
    expect(migrateDecor(save({}))).toEqual({});
    expect(migrateDecor(save({ equippedFurniture: null }))).toEqual({});
  });

  it('item antigo que não existe mais é ignorado', () => {
    expect(migrateDecor(save({ equippedFurniture: 'furn-que-nao-existe' }))).toEqual({});
  });

  it('quem já está no formato novo não é remigrado', () => {
    const atual = { trophy: 'furniture-podium' };
    expect(migrateDecor(save({ equippedDecor: atual, equippedFurniture: 'furn-sofa' })))
      .toEqual(atual);
  });

  it('MAPA VAZIO é escolha do jogador, não falta de migração', () => {
    // Regressão: a versão anterior tratava `{}` como "ainda não migrado" e caía
    // no campo antigo. Quem tinha save velho desequipava o item, recarregava, e
    // ele voltava sozinho — a decisão do jogador era desfeita a cada reload.
    expect(migrateDecor(save({ equippedDecor: {}, equippedFurniture: 'furn-sofa' })))
      .toEqual({});
  });

  it('é idempotente: migrar o resultado de novo não muda nada', () => {
    const uma = migrateDecor(save({ equippedFurniture: 'furn-books' }));
    expect(migrateDecor(save({ equippedDecor: uma }))).toEqual(uma);
  });
});
