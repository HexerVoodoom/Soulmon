/**
 * Testes do "Equilibrar minha semana" (P4).
 *
 * O que estes testes protegem, em ordem de gravidade:
 *
 *  1. **A frequência de cada atividade nunca muda.** É a invariante que separa
 *     "reorganizar" de "decidir pela pessoa quanto ela se exercita". Se este
 *     teste cair, a função virou outra coisa.
 *  2. **Determinismo.** Sugestão que muda a cada toque ensina a apertar de novo
 *     até gostar do resultado — um sorteio disfarçado de ajuda.
 *  3. **Honestidade quando não cabe.** Carga que não entra em `7 × teto` não
 *     pode ser vendida como resolvida.
 */
import { describe, it, expect } from 'vitest';
import {
  equilibrarSemana, contarPorDia, valeEquilibrar, type AtividadeSemanal,
} from './weekBalance';

const soma = (n: number[]) => n.reduce((a, b) => a + b, 0);

describe('equilibrarSemana', () => {
  it('NUNCA muda a frequência de nenhuma atividade', () => {
    const atividades: AtividadeSemanal[] = [
      { id: 'a', days: [1, 2, 3] },
      { id: 'b', days: [1, 2] },
      { id: 'c', days: [1] },
      { id: 'd', days: [1, 2, 3, 4, 5] },
    ];
    const p = equilibrarSemana(atividades, 2);
    const porId = new Map(p.mudancas.map(m => [m.id, m.days]));
    for (const a of atividades) {
      const depois = porId.get(a.id) ?? a.days;
      expect(depois.length, `${a.id} mudou de frequência`).toBe(a.days.length);
      // E sem dia repetido, que seria frequência inflada por outro caminho.
      expect(new Set(depois).size).toBe(depois.length);
    }
    // O total de ocorrências na semana também é preservado.
    expect(soma(p.depois)).toBe(soma(p.antes));
  });

  it('achata o pico: a semana empilhada num dia vira semana espalhada', () => {
    const atividades: AtividadeSemanal[] = [
      { id: 'a', days: [1] }, { id: 'b', days: [1] }, { id: 'c', days: [1] },
      { id: 'd', days: [1] }, { id: 'e', days: [1] }, { id: 'f', days: [1] },
    ];
    const p = equilibrarSemana(atividades, 2);
    expect(p.picoAntes).toBe(6);
    expect(p.picoDepois).toBeLessThanOrEqual(2);
    expect(p.cabe).toBe(true);
  });

  it('é DETERMINÍSTICA: a mesma entrada dá sempre a mesma proposta', () => {
    const atividades: AtividadeSemanal[] = [
      { id: 'correr', days: [1, 3] },
      { id: 'ler', days: [1, 3, 5] },
      { id: 'agua', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 'meditar', days: [2] },
    ];
    const a = equilibrarSemana(atividades, 3);
    const b = equilibrarSemana(atividades, 3);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    // E a ORDEM da lista de entrada não pode mudar o resultado.
    const c = equilibrarSemana([...atividades].reverse(), 3);
    expect(JSON.stringify(c.depois)).toBe(JSON.stringify(a.depois));
  });

  it('atividade de TODO DIA não é tocada — não há o que redistribuir', () => {
    const p = equilibrarSemana([
      { id: 'agua', days: [0, 1, 2, 3, 4, 5, 6] },
      { id: 'correr', days: [1, 1, 2] as number[] },
    ], 2);
    expect(p.mudancas.find(m => m.id === 'agua')).toBeUndefined();
  });

  it('prefere manter os dias que a pessoa já usava, quando dá na mesma', () => {
    // Uma atividade sozinha numa semana vazia não tem motivo para mudar de dia.
    const p = equilibrarSemana([{ id: 'a', days: [3] }], 4);
    expect(p.mudancas).toEqual([]);
  });

  it('quando NÃO cabe, diz que não cabe — e ainda assim melhora', () => {
    // 15 ocorrências com teto 2 => 7 × 2 = 14 < 15.
    const atividades: AtividadeSemanal[] = Array.from({ length: 5 }, (_, i) => ({
      id: `a${i}`, days: [0, 1, 2],
    }));
    const p = equilibrarSemana(atividades, 2);
    expect(p.cabe).toBe(false);
    expect(p.picoDepois).toBeLessThan(p.picoAntes);
    expect(soma(p.depois)).toBe(15);
  });

  it('dado corrompido do save não derruba nada', () => {
    const p = equilibrarSemana([
      { id: 'a', days: [1, 1, 1] },                    // repetido
      { id: 'b', days: [9, -2, 3] },                   // fora da faixa
      { id: 'c', days: 'segunda' as unknown as number[] }, // nem é lista
      { id: 'd', days: [] },                           // vazia
    ], 3);
    // Sobram: 'a' com 1 dia e 'b' com 1 dia (só o 3 é válido).
    expect(soma(p.depois)).toBe(2);
    expect(p.antes.length).toBe(7);
  });

  it('teto inválido não vira divisão por zero nem semana vazia', () => {
    for (const teto of [0, -3, 0.4, NaN]) {
      const p = equilibrarSemana([{ id: 'a', days: [1, 2] }], teto);
      expect(soma(p.depois)).toBe(2);
    }
  });
});

describe('contarPorDia', () => {
  it('conta por dia da semana, domingo em 0', () => {
    expect(contarPorDia([
      { id: 'a', days: [0, 6] },
      { id: 'b', days: [0] },
    ])).toEqual([2, 0, 0, 0, 0, 0, 1]);
  });
});

describe('valeEquilibrar', () => {
  it('NÃO oferece para quem já está equilibrado', () => {
    // Oferecer "equilibrar" a quem está bem sugere que há algo errado quando
    // não há — e a voz do produto encoraja, nunca insinua falha.
    const atividades: AtividadeSemanal[] = [
      { id: 'a', days: [1] }, { id: 'b', days: [3] }, { id: 'c', days: [5] },
    ];
    const p = equilibrarSemana(atividades, 4);
    expect(valeEquilibrar(p, 4)).toBe(false);
  });

  it('oferece quando há dia acima do teto E a proposta melhora', () => {
    const atividades: AtividadeSemanal[] = Array.from({ length: 6 }, (_, i) => ({
      id: `a${i}`, days: [1],
    }));
    const p = equilibrarSemana(atividades, 2);
    expect(valeEquilibrar(p, 2)).toBe(true);
  });

  it('não oferece quando não há nada a mudar, mesmo com dia cheio', () => {
    // Sete atividades diárias: todo dia tem 7, acima de qualquer teto — e não
    // existe redistribuição possível. Prometer ajuda aqui seria mentir.
    const atividades: AtividadeSemanal[] = Array.from({ length: 7 }, (_, i) => ({
      id: `a${i}`, days: [0, 1, 2, 3, 4, 5, 6],
    }));
    const p = equilibrarSemana(atividades, 4);
    expect(p.mudancas).toEqual([]);
    expect(valeEquilibrar(p, 4)).toBe(false);
  });
});
