import { describe, it, expect } from 'vitest';
import { levelUpPending, levelUpBaseline, levelUpGains, sanitizeCelebratedLevel } from './levelUp';
import { xpForLevel } from './bond';
import { CATEGORIA_DO_SOM, OFFSET_POR_SOM_DB } from './loudness';

describe('levelUpPending — o evento é DERIVADO, o save guarda só o último celebrado', () => {
  it('campo ausente (save anterior): NÃO celebra o passado — a linha de base é o nível de agora', () => {
    expect(levelUpPending(xpForLevel(9), undefined)).toBeNull();
    expect(levelUpBaseline(xpForLevel(9))).toBe(9);
  });
  it('nível subiu desde o último celebrado: evento from → to', () => {
    expect(levelUpPending(xpForLevel(6), 4)).toEqual({ from: 4, to: 6 });
  });
  it('sem subida (ou campo à frente): null; nunca um evento "descendo"', () => {
    expect(levelUpPending(xpForLevel(4), 4)).toBeNull();
    expect(levelUpPending(xpForLevel(3), 5)).toBeNull();
  });
  it('sobrevive a fechar o app: o mesmo par (totalXP, celebrado) devolve o mesmo evento no próximo load', () => {
    const a = levelUpPending(xpForLevel(8), 5);
    const b = levelUpPending(xpForLevel(8), 5);
    expect(a).toEqual(b);
    expect(a).not.toBeNull();
  });
  it('demo local não celebra', () => {
    expect(levelUpPending(xpForLevel(8), 2, true)).toBeNull();
  });
  it('lixo vindo do save vira ausente', () => {
    for (const v of [null, 'x', -3, 0, NaN, Infinity, {}, []]) expect(sanitizeCelebratedLevel(v)).toBeUndefined();
    expect(sanitizeCelebratedLevel(4.9)).toBe(4);
    expect(sanitizeCelebratedLevel(1e9)).toBe(1000);
  });
});

describe('levelUpGains — vem dos donos, não de número escrito aqui', () => {
  it('1 ponto de talento por nível', () => {
    expect(levelUpGains(4, 5).talentPoints).toBe(1);
    expect(levelUpGains(1, 6).talentPoints).toBe(5);
  });
  it('passado o teto de talentos, 0', () => {
    expect(levelUpGains(30, 31).talentPoints).toBe(0);
  });
  it('recompensas do Vínculo dos níveis cruzados, do mais alto ao mais baixo, no máximo 3', () => {
    const g = levelUpGains(1, 13);
    expect(g.rewards.length).toBeLessThanOrEqual(3);
    expect(g.rewards.map(r => r.level)).toEqual([...g.rewards.map(r => r.level)].sort((a, b) => b - a));
  });
  it('portões que abriram nesta subida (e só nela)', () => {
    expect(levelUpGains(2, 3).gates.sort()).toEqual(['pvp', 'torneio']);
    expect(levelUpGains(3, 4).gates).toEqual([]);
    expect(levelUpGains(7, 12)).toMatchObject({ gates: expect.arrayContaining(['masmorraAlto', 'renascimento']) });
  });
});

describe('o som do level up está na política (R-CAT: o EVENTO decide)', () => {
  it('categoria `marco` e offset calibrado e plausível', () => {
    expect(CATEGORIA_DO_SOM.playLevelUp).toBe('marco');
    expect(Math.abs(OFFSET_POR_SOM_DB.playLevelUp)).toBeLessThanOrEqual(20);
  });
});
