/**
 * Decisão do dono (16/11/2026): o Ultra só abre com as TRÊS megas liberadas, e
 * a barra dele (45 dias de teto) só acumula DEPOIS disso. O atalho de ficar
 * vários dias só com 1 mega acabou.
 *
 * Trava: se alguém reintroduzir "pontos substituem as megas" em `canReachUltra`
 * ou em `getNextEvolution`, quebra aqui.
 */
import { describe, it, expect } from 'vitest';
import { canReachUltra, hasMegaCollection, megasLiberadas, ULTRA_PATIENCE_DAYS, ULTRA_PATIENCE_POINTS, FORM_REQUIREMENTS } from './progression';
import { getNextEvolution } from '../utils/dailyReset';

const TRES_MEGAS = ['mega-power', 'mega-harmony', 'mega-benevolence'];

describe('o Ultra pede as três megas (16/11/2026)', () => {
  it('três megas abrem o destino', () => {
    expect(canReachUltra({ unlockedEvolutions: TRES_MEGAS })).toBe(true);
    expect(hasMegaCollection(TRES_MEGAS)).toBe(true);
  });

  it('menos de três megas não abrem, por mais pontos que haja (o atalho da permanência acabou)', () => {
    expect(canReachUltra({ unlockedEvolutions: ['mega-power'] })).toBe(false);
    expect(canReachUltra({ unlockedEvolutions: ['mega-power', 'mega-harmony'] })).toBe(false);
    expect(canReachUltra({ unlockedEvolutions: [] })).toBe(false);
  });

  it('save sem o campo ou com lixo não quebra e não abre de graça', () => {
    expect(canReachUltra({})).toBe(false);
    expect(megasLiberadas(undefined)).toBe(0);
    expect(megasLiberadas('mega-power' as unknown as string[])).toBe(0);
    expect(megasLiberadas(['mega-power', 'mega-power', 'champion-power'])).toBe(1);
  });

  it('a árvore: mega só vira ultra com as três; sozinho, o mega é o próprio destino', () => {
    expect(getNextEvolution('mega-power', 'power', TRES_MEGAS)).toBe('ultra');
    expect(getNextEvolution('mega-power', 'power', ['mega-power'])).toBe('mega-power');
  });

  it('o Ultra continua sendo o topo — dele não sai mais nada', () => {
    expect(getNextEvolution('ultra', 'harmony', TRES_MEGAS)).toBe('ultra');
  });

  it('a meta da barra do Ultra continua sendo 45 dias de teto do mega, um número só', () => {
    expect(ULTRA_PATIENCE_DAYS).toBe(45);
    expect(ULTRA_PATIENCE_POINTS).toBe(ULTRA_PATIENCE_DAYS * FORM_REQUIREMENTS.mega.required);
    expect(ULTRA_PATIENCE_DAYS).toBeGreaterThan(FORM_REQUIREMENTS.mega.required * 5);
  });
});
