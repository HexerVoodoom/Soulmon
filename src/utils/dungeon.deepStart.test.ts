/**
 * WP4.5 — o sumidouro recorrente de Bits.
 *
 * Os Bits só tinham compras ÚNICAS (decoração, cenários): quem joga muito
 * acumulava uma moeda que não compra mais nada, e moeda que não compra nada
 * deixa de ser recompensa.
 *
 * A escolha do sumidouro tem uma trava de produto, e é ela que este arquivo
 * guarda: o `CLAUDE.md` diz que a alavanca legítima é **custo de ENTRADA em
 * Bits, nunca cobrar da barra que representa o cuidado que a pessoa teve
 * consigo mesma**.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  deepStartCost, canBuyDeepStart, buyDeepStart, DEEP_START_BASE_COST, DEEP_START_MAX_LEVEL,
} from './dungeon';

describe('deepStart — o preço', () => {
  it('sobe com o nível: o sumidouro acompanha quem farma mais', () => {
    expect(deepStartCost(1)).toBe(DEEP_START_BASE_COST);
    expect(deepStartCost(2)).toBeGreaterThan(deepStartCost(1));
    expect(deepStartCost(4)).toBeGreaterThan(deepStartCost(3));
  });

  it('nível inválido não vira preço grátis nem negativo', () => {
    expect(deepStartCost(0)).toBe(DEEP_START_BASE_COST);
    expect(deepStartCost(-5)).toBe(DEEP_START_BASE_COST);
  });
});

describe('deepStart — quando dá para comprar', () => {
  it('com Bits suficientes, abaixo do teto', () => {
    expect(canBuyDeepStart(1, deepStartCost(1), 3)).toBe(true);
  });

  it('sem Bits suficientes, não', () => {
    expect(canBuyDeepStart(1, deepStartCost(1) - 1, 3)).toBe(false);
  });

  it('existe TETO — senão a pessoa compra uma run que perde no 1º inimigo', () => {
    // Isso não é desafio, é dinheiro queimado por uma tela que deixou.
    expect(canBuyDeepStart(DEEP_START_MAX_LEVEL, 999_999, 99)).toBe(false);
  });
});

describe('deepStart — a linha vermelha', () => {
  it('a compra é de ENTRADA e não toca em coração em lugar nenhum', () => {
    // A regra do produto: o jogo nunca cobra da barra que representa o
    // cuidado que a pessoa teve consigo mesma. Se alguém "melhorar" o
    // sumidouro cobrando HP, é aqui que quebra.
    const fonte = readFileSync(resolve(process.cwd(), 'src/utils/dungeon.ts'), 'utf-8');
    const bloco = fonte.slice(fonte.indexOf('DEEP_START_BASE_COST'), fonte.indexOf('setDungeonDifficultyAtLeast'));
    expect(bloco).not.toMatch(/healthPoints|heart|coração/i);
  });

  it('é recorrente de graça: a base reseta toda semana', () => {
    // Nada de mecânica nova para o sumidouro voltar — a semana já faz isso.
    const fonte = readFileSync(resolve(process.cwd(), 'src/utils/dungeon.ts'), 'utf-8');
    expect(fonte).toMatch(/weekKey/);
  });
});

describe('deepStart — E2 (02/10/2026): só até onde já se chegou', () => {
  it('não compra um nível que a pessoa ainda não cumpriu, nem com todos os Bits do mundo', () => {
    // base 1, nível mais fundo cumprido 1: nada a devolver.
    expect(canBuyDeepStart(1, 999_999, 1)).toBe(false);
    expect(buyDeepStart(1, 999_999, 1)).toBeNull();
    // base 2 com alcançado 2: idem — não dá para pular para o 3 pagando.
    expect(canBuyDeepStart(2, 999_999, 2)).toBe(false);
    expect(buyDeepStart(2, 999_999, 2)).toBeNull();
  });

  it('depois do reset semanal, devolve a base de um em um, até o alcançado', () => {
    // base voltou a 1, mas a pessoa já cumpriu até o 3.
    expect(buyDeepStart(1, deepStartCost(1), 3)).toBe(2);
    expect(buyDeepStart(2, deepStartCost(2), 3)).toBe(3);
    expect(buyDeepStart(3, 999_999, 3)).toBeNull(); // chegou no teto conquistado
  });

  it('o resultado nunca passa do alcançado nem do teto absoluto', () => {
    for (let base = 1; base <= 8; base++) {
      for (let reached = 1; reached <= 8; reached++) {
        const next = buyDeepStart(base, 999_999, reached);
        if (next !== null) {
          expect(next).toBe(base + 1);
          expect(next).toBeLessThanOrEqual(reached);
          expect(next).toBeLessThanOrEqual(DEEP_START_MAX_LEVEL);
        }
      }
    }
  });

  it('sem Bits, mesmo com nível conquistado acima, não compra', () => {
    expect(canBuyDeepStart(1, deepStartCost(1) - 1, 3)).toBe(false);
    expect(buyDeepStart(1, 0, 3)).toBeNull();
  });

  it('a compra nunca grava o alcançado: só concluir a descida grava', () => {
    const fonte = readFileSync(resolve(process.cwd(), 'src/components/DungeonGame.tsx'), 'utf-8');
    const bloco = fonte.slice(fonte.indexOf('buyDeepStart(baseLevel'), fonte.indexOf('buyDeepStart(baseLevel') + 400);
    expect(bloco).not.toMatch(/recordDungeonReached/);
    expect(fonte).toMatch(/recordDungeonReached\(baseLevel \+ 1\)/);
  });
});
