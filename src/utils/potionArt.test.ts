import { describe, expect, it } from 'vitest';
import { potionArt } from './potionArt';
import { ITEM_ART } from './itemArt';
import { potionKey } from './elementPotion';
import { resolveHexChipArt } from '../assets/soulmon/hex';
import { CURATED_ELEMENT_IDS } from './elementosCurados';

/** Dívida de arte declarada (P5, 23/11/2026): os 4 trios do lote 5 ainda não têm poção nem chip (ver `docs/ASSETS-A-GERAR.md`); caem no ícone. Tire daqui quando a arte entrar. */
const SEM_POCAO_AINDA: readonly string[] = []; // 24/11/2026: poção e chip dos 4 trios do lote 5 instalados (P6)

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
  it('os 63 compostos curados (59 + 4 do lote 5) também têm poção e chip próprios (18/11/2026)', () => {
    const curados = CURATED_ELEMENT_IDS.filter(id => id !== 'neutro' && !SEM_POCAO_AINDA.includes(id));
    expect(curados).toHaveLength(63);
    for (const id of curados) {
      expect(potionArt(id), id).toBeTruthy();
      expect(resolveHexChipArt(id), id).toBeTruthy();
    }
  });
  it('dívida do lote 5: sem poção nem chip próprios ainda (se a arte entrou, tire o id de SEM_POCAO_AINDA)', () => {
    for (const id of SEM_POCAO_AINDA) {
      expect(potionArt(id), id).toBeUndefined();
      expect(resolveHexChipArt(id), id).toBeUndefined();
    }
  });
});
