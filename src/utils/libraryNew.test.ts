import { describe, it, expect } from 'vitest';
import { ackLibrary, libraryNewCount, libraryNewKeys, sanitizeLibraryAck, LIBRARY_NEW_TEXT, LIBRARY_NEW_BADGE } from './libraryNew';

const sp = (sid: string) => ({ sid, stage: 'rookie', at: '2026-11-01' });

describe('aviso NEW da Biblioteca (libraryNew)', () => {
  it('texto e selo exatos do dono', () => {
    expect(LIBRARY_NEW_TEXT).toBe('A new entry has been recorded to the library');
    expect(LIBRARY_NEW_BADGE).toBe('NEW');
  });
  it('save antigo sem libraryAck: nada vira NEW retroativo', () => {
    const lists = { bestiary: ['a', 'b'], defeatedElements: ['fogo'], strayPlayersSeen: [] };
    const ack = sanitizeLibraryAck(undefined, lists);
    expect(ack).toEqual({ b: 2, e: 1, s: 0 });
    expect(libraryNewCount({ ...lists, libraryAck: ack })).toBe(0);
  });
  it('sanitiza: lixo vira os tamanhos; contador acima da lista é cortado; negativo/fração = tamanho', () => {
    const lists = { bestiary: ['a'], defeatedElements: [], strayPlayersSeen: [] };
    expect(sanitizeLibraryAck('x', lists)).toEqual({ b: 1, e: 0, s: 0 });
    expect(sanitizeLibraryAck({ b: 99, e: 0, s: 0 }, lists)).toEqual({ b: 1, e: 0, s: 0 });
    expect(sanitizeLibraryAck({ b: -1, e: 0.5, s: 0 }, lists)).toEqual({ b: 1, e: 0, s: 0 });
    expect(sanitizeLibraryAck({ b: 0, e: 0, s: 0 }, lists)).toEqual({ b: 0, e: 0, s: 0 });
  });
  it('o que entrou depois da última abertura é NEW; duas entradas juntas marcam as duas', () => {
    const s = { bestiary: ['a', 'b', 'c'], defeatedElements: ['fogo', 'geiser'], strayPlayersSeen: [sp('1'.repeat(24))], libraryAck: { b: 1, e: 1, s: 0 } };
    const k = libraryNewKeys(s);
    expect([...k.bestiary]).toEqual(['b', 'c']);
    expect([...k.elements]).toEqual(['geiser']);
    expect([...k.strays]).toEqual(['1'.repeat(24)]);
    expect(k.total).toBe(4);
    expect(libraryNewCount(s)).toBe(4);
  });
  it('abrir a Biblioteca zera o NEW na próxima abertura; idempotente', () => {
    const s = { bestiary: ['a', 'b'], defeatedElements: [], strayPlayersSeen: [], libraryAck: { b: 0, e: 0, s: 0 } };
    const a = ackLibrary(s);
    expect(a.libraryAck).toEqual({ b: 2, e: 0, s: 0 });
    expect(libraryNewCount(a)).toBe(0);
    expect(ackLibrary(a)).toBe(a);
  });
  it('estado novo (sem ack, nunca hidratado de save antigo): o primeiro registro já é NEW', () => {
    expect(libraryNewCount({ bestiary: ['a'] })).toBe(1);
  });
});
