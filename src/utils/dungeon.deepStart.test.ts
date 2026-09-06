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
  deepStartCost, canBuyDeepStart, DEEP_START_BASE_COST, DEEP_START_MAX_LEVEL,
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
    expect(canBuyDeepStart(1, deepStartCost(1))).toBe(true);
  });

  it('sem Bits suficientes, não', () => {
    expect(canBuyDeepStart(1, deepStartCost(1) - 1)).toBe(false);
  });

  it('existe TETO — senão a pessoa compra uma run que perde no 1º inimigo', () => {
    // Isso não é desafio, é dinheiro queimado por uma tela que deixou.
    expect(canBuyDeepStart(DEEP_START_MAX_LEVEL, 999_999)).toBe(false);
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
