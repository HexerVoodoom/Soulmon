import { describe, it, expect } from 'vitest';
import { aliadoCortou, DANO_INIMIGO, duelRodada, duelStart, DUELO_MAX } from './dueloLogic';

function lutar() {
  let s = duelStart();
  const historico = [s];
  for (let i = 0; i < 20 && !aliadoCortou(s); i++) { s = duelRodada(s).state; historico.push(s); }
  return historico;
}

describe('duelo 2x1 roteirizado', () => {
  it('só o aliado do ancião toma dano: o Soulmon do jogador nunca perde vida', () => {
    for (const s of lutar()) expect(s.jogador).toBe(DUELO_MAX.jogador);
    const h = lutar();
    expect(h[h.length - 1].aliado).toBeLessThan(DUELO_MAX.aliado);
  });

  it('corta quando o aliado chega a 1/3 da vida ou menos, e não antes', () => {
    const h = lutar();
    const ultimo = h[h.length - 1];
    expect(ultimo.aliado).toBeLessThanOrEqual(Math.ceil(DUELO_MAX.aliado / 3));
    for (const s of h.slice(0, -1)) expect(s.aliado).toBeGreaterThan(Math.ceil(DUELO_MAX.aliado / 3));
    expect(aliadoCortou(ultimo)).toBe(true);
  });

  it('o inimigo tem vantagem: nunca cai nem perto de zero antes do corte', () => {
    for (const s of lutar()) expect(s.inimigo).toBeGreaterThan(DUELO_MAX.inimigo / 3);
  });

  it('é determinístico: duas lutas dão a mesma sequência', () => {
    expect(lutar()).toEqual(lutar());
  });

  it('o aliado nunca zera (piso 1) e depois do corte a rodada não muda nada', () => {
    let s = { ...duelStart(), aliado: 12 };
    s = duelRodada(s).state;
    expect(s.aliado).toBeGreaterThanOrEqual(1);
    const r = duelRodada(s);
    expect(r.state).toBe(s);
    expect(r.danoNoAliado).toBe(0);
  });

  it('acaba em poucas rodadas', () => {
    expect(lutar().length - 1).toBeLessThanOrEqual(DANO_INIMIGO.length + 2);
  });
});
