import { describe, it, expect } from 'vitest';
import { applyElementUnlockOnEvolve } from './elementUnlockOnEvolve';
import { elementosNovos, ELEMENTO_NOVO_MAX_LOTE } from './elementoNovoModal';
import { ALL_ELEMENT_IDS, BASE_ELEMENT_IDS, elementComponents } from './elementDex';

const composto = ALL_ELEMENT_IDS.find(id => !BASE_ELEMENT_IDS.includes(id) && elementComponents(id))!;
const base = BASE_ELEMENT_IDS[0];

describe('evoluir desbloqueia o elemento da forma nova (15/11/2026)', () => {
  it('composto: libera o PRÓPRIO id (como vencer um composto), não as bases componentes', () => {
    const s = applyElementUnlockOnEvolve({ potionElement: composto, defeatedElements: [] as string[] });
    expect(s.defeatedElements).toEqual([composto]);
  });

  it('elemento base também', () => {
    expect(applyElementUnlockOnEvolve({ potionElement: base, defeatedElements: [] as string[] }).defeatedElements).toEqual([base]);
  });

  it('já desbloqueado: no-op (a MESMA referência); rodar duas vezes também', () => {
    const ja = { potionElement: composto, defeatedElements: [composto] };
    expect(applyElementUnlockOnEvolve(ja)).toBe(ja);
    const um = applyElementUnlockOnEvolve({ potionElement: composto, defeatedElements: undefined as string[] | undefined });
    expect(applyElementUnlockOnEvolve(um)).toBe(um);
  });

  it('sem elemento nenhum: não toca no save; o corvinho (neutro) destranca o neutro, como já fazia o dex', () => {
    const nada = { defeatedElements: [] as string[] };
    expect(applyElementUnlockOnEvolve(nada)).toBe(nada);
    const corvo = { soulmonMeta: { creature: 'corvo' }, defeatedElements: [] as string[] };
    expect(applyElementUnlockOnEvolve(corvo).defeatedElements).toEqual(['neutro']);
  });

  it('preserva o que já havia (só acrescenta no fim)', () => {
    const s = applyElementUnlockOnEvolve({ potionElement: composto, defeatedElements: [base] });
    expect(s.defeatedElements).toEqual([base, composto]);
  });
});

describe('quem avisar no modal "Elemento novo"', () => {
  it('só o que entrou no dex e ainda não foi visto, em ordem, sem repetir', () => {
    expect(elementosNovos([base, composto, base], new Set([base]))).toEqual([composto]);
    expect(elementosNovos([base, composto], new Set([base, composto]))).toEqual([]);
    expect(elementosNovos(undefined, new Set())).toEqual([]);
    expect(elementosNovos(['lixo_que_nao_existe'], new Set())).toEqual([]);
  });
  it('o teto de lote é pequeno (save adotado da nuvem não vira carrossel de 100 páginas)', () => {
    expect(ELEMENTO_NOVO_MAX_LOTE).toBeLessThanOrEqual(10);
  });
});
