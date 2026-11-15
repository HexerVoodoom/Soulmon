/**
 * Cada COMPONENTE de um elemento combinado (2, 3 ou 4) deve ter uma pista visual própria no texto de pistas do prompt de sprite,
 * e o trecho de elemento tem teto de tamanho (dono, 10/11/2026). Só texto de prompt; nenhum save muda.
 */
import { describe, it, expect } from 'vitest';
import { pistasVisuaisDoElemento, PALAVRA_CHAVE_BASE, TETO_PISTAS, nomeiaBase } from './elementoCombinado';
import { essenceComposition, ESSENCE_ELEMENT_IDS, BASE_ELEMENT_IDS } from './elementDex';
import { ELEMENTOS_CURADOS } from './elementosCurados';
import { DESCRITORES_ELEMENTO } from './elementoDescritores.data';

const faltas = (id: string): string[] => {
  const t = (pistasVisuaisDoElemento(id) ?? '').toLowerCase();
  return (essenceComposition(id) ?? []).filter(c => !nomeiaBase(t, c));
};

describe('uma pista por componente', () => {
  it('toda base tem palavra-chave e ela existe no descritor da própria base', () => {
    for (const b of BASE_ELEMENT_IDS) {
      const d = DESCRITORES_ELEMENTO[b];
      expect(PALAVRA_CHAVE_BASE[b], b).toBeTruthy();
      expect(nomeiaBase(`${d.forma} ${d.paleta}`.toLowerCase(), b), b).toBe(true);
    }
  });
  it('os 59 curados (3 e 4 componentes): cada componente aparece nas pistas', () => {
    const ruins = ELEMENTOS_CURADOS.map(e => [e.id, faltas(e.id)] as const).filter(([, f]) => f.length);
    expect(ruins).toEqual([]);
  });
  it('todos os combinados de 2 componentes e todos os 269: cada componente aparece nas pistas', () => {
    const ruins = ESSENCE_ELEMENT_IDS.map(id => [id, faltas(id)] as const).filter(([, f]) => f.length);
    expect(ruins).toEqual([]);
  });
  it('pedra no lugar de ar: o avatar_elemental cita vento', () => {
    expect(pistasVisuaisDoElemento('avatar_elemental')).toMatch(/wind/);
  });
});

describe('teto de tamanho do trecho de elemento', () => {
  it(`pistas (forma + paleta) de TODOS os 269 elementos <= ${TETO_PISTAS} caracteres`, () => {
    const grandes = ESSENCE_ELEMENT_IDS.map(id => [id, (pistasVisuaisDoElemento(id) ?? '').length] as const).filter(([, n]) => n > TETO_PISTAS);
    expect(grandes).toEqual([]);
  });
});
