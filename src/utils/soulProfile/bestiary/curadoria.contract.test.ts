// CONTRATO DO POOL DO BESTIÁRIO — o corpus do Besti-rio-, direto.
//
// ⚠️ Reescrito em 06/10/2026. Decisão do dono: "sincronizar com o corpus
// inteiro, sem allowlist que restrinja". Até aqui este arquivo travava o
// OPOSTO (28/09/2026): pool de entradas originais curadas, sem variante
// gerada, sem franquia, com grupos de família pedidos. Isso tudo saiu junto com
// `scripts/bestiario-originais.mjs`/`bestiario-procedencia.mjs` da cadeia de
// sync (os scripts continuam no repo, sem chamador).
//
// O que sobra de contrato é o que o MOTOR de seleção precisa para funcionar:
// campo presente, nome único, elementos no vocabulário do class-system (ou
// derivado dele) e cobertura de cada um dos 17 elementos. Não é um filtro de
// PI e não deve virar um.

import { describe, expect, it } from 'vitest';
import { BESTIARY_POOL } from './select';
import { CLASS_ELEMENT_ORDER } from '../types';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';

const ELEMENTOS_CONHECIDOS = new Set<string>([
  ...CLASS_ELEMENT_ORDER,
  ...DERIVED_ELEMENT_PAIRS.map(d => d.id),
]);

describe('o pool é o corpus do Besti-rio-', () => {
  it('é grande e todo registro tem os campos que a seleção lê', () => {
    expect(BESTIARY_POOL.length).toBeGreaterThan(1000);
    for (const c of BESTIARY_POOL) {
      expect(typeof c.nome, c.nome).toBe('string');
      expect(c.nome.length, 'nome vazio').toBeGreaterThan(0);
      expect(Array.isArray(c.elementos), c.nome).toBe(true);
      expect(c.elementos.length, c.nome).toBeGreaterThan(0);
      expect(Array.isArray(c.biologia), c.nome).toBe(true);
      expect(Array.isArray(c.bioma), c.nome).toBe(true);
      expect(typeof c.descricao, c.nome).toBe('string');
    }
  });

  it('nenhum nome duplicado', () => {
    const vistos = new Set<string>();
    const dup: string[] = [];
    for (const c of BESTIARY_POOL) {
      if (vistos.has(c.nome)) dup.push(c.nome);
      vistos.add(c.nome);
    }
    expect(dup.slice(0, 10)).toEqual([]);
  });

  it('todo elemento é do vocabulário do class-system (base ou derivado)', () => {
    const fora = new Set<string>();
    for (const c of BESTIARY_POOL) for (const e of c.elementos) if (!ELEMENTOS_CONHECIDOS.has(e)) fora.add(e);
    expect([...fora]).toEqual([]);
  });

  it('os 17 elementos têm pelo menos 8 criaturas cada, exceto as lacunas CONHECIDAS do corpus', () => {
    // ⚠️ Lacuna medida em 06/10/2026: o corpus do Besti-rio- não tem NENHUMA
    // criatura com `marcial` (nem direto nem por derivado). Quem tem Marcial
    // dominante pontua o resto (reino, hostilidade, tamanho), mas o termo de
    // elemento não encontra par. Conserto é corpus (repo irmão), não regra.
    // Se o corpus passar a cobrir, tire daqui — este caso falha de propósito.
    const LACUNAS_CONHECIDAS = ['marcial'];
    const cont: Record<string, number> = {};
    // Derivado conta pelos componentes — é assim que `select.ts` pontua.
    const baseDe = (id: string): string[] =>
      DERIVED_ELEMENT_PAIRS.find(d => d.id === id)?.componentes ?? [id];
    for (const c of BESTIARY_POOL) {
      for (const e of c.elementos.flatMap(baseDe)) cont[e] = (cont[e] ?? 0) + 1;
    }
    const pobres = CLASS_ELEMENT_ORDER.filter(e => (cont[e] ?? 0) < 8);
    expect(pobres).toEqual(LACUNAS_CONHECIDAS);
  });

  it('o sorteio por grupo aguenta família nula (a maioria do corpus não a tem)', () => {
    // `select.ts` agrupa por `familia ?? especieDe(nome)`; este caso só trava
    // que o corpus continua assim (e que o fallback é o que está em uso).
    const semFamilia = BESTIARY_POOL.filter(c => c.familia === null).length;
    expect(semFamilia).toBeGreaterThan(0);
  });
});
