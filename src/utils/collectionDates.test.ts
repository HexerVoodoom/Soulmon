/**
 * WP4.10 — datar as coleções.
 *
 * O jogo guardava O QUE foi alcançado e nunca QUANDO. Sem data, uma coleção é
 * uma lista; com data, é uma história. As duas regras abaixo existem para essa
 * data não mentir.
 */
import { describe, it, expect } from 'vitest';
import { stampCollected, stampAllCollected, collectedAt } from './collectionDates';

describe('collectionDates — a data é a PRIMEIRA, e nunca é reescrita', () => {
  it('grava quando ainda não havia', () => {
    expect(stampCollected(undefined, 'mega-harmony', '2026-09-06')).toEqual({ 'mega-harmony': '2026-09-06' });
  });

  it('NÃO sobrescreve — data que se atualiza registra a última vez', () => {
    const antes = { 'mega-harmony': '2026-01-01' };
    expect(stampCollected(antes, 'mega-harmony', '2026-09-06')).toBe(antes);
  });

  it('é idempotente: chamar duas vezes devolve a MESMA referência', () => {
    const um = stampCollected({}, 'rookie', '2026-09-06');
    expect(stampCollected(um, 'rookie', '2026-09-07')).toBe(um);
  });

  it('id ou dia vazio não cria entrada fantasma', () => {
    expect(stampCollected({}, '', '2026-09-06')).toEqual({});
    expect(stampCollected({}, 'rookie', '')).toEqual({});
  });
});

describe('collectionDates — ausência NÃO vira data inventada', () => {
  it('ler o que não tem data devolve null', () => {
    expect(collectedAt(undefined, 'rookie')).toBeNull();
    expect(collectedAt({}, 'rookie')).toBeNull();
    expect(collectedAt({ rookie: '' }, 'rookie')).toBeNull();
  });

  it('save antigo pode ser carimbado em lote sem virar tudo "hoje" depois', () => {
    // O carimbo em lote existe para uma migração deliberada; o que não pode
    // acontecer é a leitura inventar data sozinha, e é isso que o caso acima
    // garante.
    const d = stampAllCollected({}, ['rookie', 'champion-harmony'], '2026-09-06');
    expect(Object.keys(d)).toHaveLength(2);
    expect(stampAllCollected(d, ['rookie'], '2026-12-25').rookie).toBe('2026-09-06');
  });
});
