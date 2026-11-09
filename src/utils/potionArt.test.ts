import { describe, expect, it } from 'vitest';
import { potionArt } from './potionArt';
import { ITEM_ART } from './itemArt';
import { potionKey } from './elementPotion';
import { resolveHexChipArt } from '../assets/soulmon/hex';

const BASES = 'fogo agua terra ar eletricidade arcano sombra luz vileza morte vida vigor marcial tempo som gravidade espaco fada industrial planta'.split(' ');

describe('arte das poções e chips de essência', () => {
  it('as 20 bases têm poção, chip e a Mochila usa a poção', () => {
    for (const id of BASES) {
      expect(potionArt(id), id).toBeTruthy();
      expect(resolveHexChipArt(id), id).toBeTruthy();
      expect(ITEM_ART[potionKey(id)], id).toBe(potionArt(id));
    }
  });
  it('elemento sem arte própria devolve undefined', () => {
    expect(potionArt('inexistente')).toBeUndefined();
    expect(resolveHexChipArt('inexistente')).toBeUndefined();
  });
});
