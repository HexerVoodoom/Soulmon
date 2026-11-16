import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import {
  BITS_PER_CATEGORY_PER_DAY, MINIGAME_BITS_PER_DAY, creditMinigameBits, minigameBitsCategoryToday, minigameBitsGrantedIn,
  minigameBitsToday, sanitizeBitsCat, type BitsCategory, type MinigameBitsState,
} from './currencies';

const DAY = 'Mon Nov 16 2026';
type S = MinigameBitsState & { gamePoints: number };
const novo = (): S => ({ gamePoints: 0 });
const pague = (s: S, cat: BitsCategory, n: number) => creditMinigameBits(s as never, n, DAY, 0, cat) as unknown as S;

describe('teto de Bits por categoria (§456)', () => {
  it('75 por categoria; o excedente é cortado, o resto segue', () => {
    let s = pague(novo(), 'minigames', 100);
    expect(minigameBitsCategoryToday(s, DAY, 'minigames')).toBe(BITS_PER_CATEGORY_PER_DAY);
    expect(s.gamePoints).toBe(75);
    s = pague(s, 'minigames', 10);
    expect(s.gamePoints).toBe(75);
  });
  it('categorias independentes e a soma nunca passa do teto geral de 150', () => {
    let s = novo();
    for (const c of ['minigames', 'explorar', 'arena'] as const) s = pague(s, c, 999);
    expect(minigameBitsToday(s, DAY)).toBe(MINIGAME_BITS_PER_DAY);
    expect(s.gamePoints).toBe(150);
    expect(minigameBitsCategoryToday(s, DAY, 'arena')).toBe(0);
  });
  it('save antigo (sem cat) lê zero e o crédito acrescenta cat sem perder o total', () => {
    const antigo: S = { gamePoints: 40, minigameBits: { day: DAY, earned: 40 } };
    expect(minigameBitsCategoryToday(antigo, DAY, 'explorar')).toBe(0);
    const s = pague(antigo, 'explorar', 30);
    expect(s.minigameBits).toEqual({ day: DAY, earned: 70, cat: { explorar: 30 } });
  });
  it('dia novo zera a categoria sem apagar o registro (idempotente)', () => {
    const s = pague(novo(), 'arena', 50);
    expect(minigameBitsCategoryToday(s, 'Tue Nov 17 2026', 'arena')).toBe(0);
  });
  it('sanitizeBitsCat é tolerante e idempotente', () => {
    const lixo = { minigames: 'x', explorar: -3, arena: 20.7, foo: 9 };
    const a = sanitizeBitsCat(lixo);
    expect(a).toEqual({ arena: 20 });
    expect(sanitizeBitsCat(a)).toEqual(a);
    expect(sanitizeBitsCat(null)).toBeUndefined();
    expect(sanitizeBitsCat([1])).toBeUndefined();
  });
  it('minigameBitsGrantedIn respeita o menor dos dois tetos e o extra da Agulha', () => {
    expect(minigameBitsGrantedIn(0, 70, 20)).toBe(5);
    expect(minigameBitsGrantedIn(140, 0, 20)).toBe(10);
    expect(minigameBitsGrantedIn(0, 70, 20, 10)).toBe(15);
    expect(minigameBitsGrantedIn(0, 0, Number.NaN)).toBe(0);
  });
  it('a arte aprovada da Hexsmith v2 está no lugar', () => {
    for (const f of ['combate-v3/status/st-debuff-atk', 'hex/coroa-silence', 'hex/coroa-hot']) {
      const p = new URL(`../assets/soulmon/${f}.png`, import.meta.url);
      expect(existsSync(p)).toBe(true);
      const b = readFileSync(p);
      const [w, h] = f.includes('st-debuff') ? [64, 64] : [96, 96];
      expect([b.readUInt32BE(16), b.readUInt32BE(20)]).toEqual([w, h]);
    }
  });
});
