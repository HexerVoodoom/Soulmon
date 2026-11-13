import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  PLAYER_SEARCH_MAX, PLAYER_SEARCH_MIN, foldPlayerName, isSearchableQuery, nameStartsWith, sanitizePlayerSearch, searchPlayers,
} from './playerSearch';
// @ts-expect-error — módulo JS do servidor, sem tipos: a paridade da régua de dobra é o ponto do teste.
import { foldNome } from '../../functions/api/_profile.js';

// §321: a busca de jogadores — o lado do cliente (dobra espelhada, mínimo, saneamento) e a paridade com o servidor.

describe('foldPlayerName — espelho de foldNome do servidor', () => {
  const casos = ['João', 'JOÃO', '  joão  da   silva ', 'Ágata', 'Çarina', 'Ñandu', 'Zoë', 'ŁUKASZ', 'ｊｏａ', 'Lia\u0000x', '🦊 Raposa'];
  it.each(casos)('%s dobra igual nos dois lados', (nome) => {
    expect(foldPlayerName(nome)).toBe(foldNome(nome));
  });
  it('sem acento e sem caixa', () => {
    expect(foldPlayerName('JOÃO')).toBe('joao');
    expect(foldPlayerName('ｊｏａ')).toBe('joa'); // largura cheia (NFKC)
  });
});

describe('mínimo de 2 caracteres', () => {
  it('vazio, 1 letra e só espaço não buscam; 2 letras (contadas depois de dobrar) buscam', () => {
    expect(PLAYER_SEARCH_MIN).toBe(2);
    expect(isSearchableQuery('')).toBe(false);
    expect(isSearchableQuery('j')).toBe(false);
    expect(isSearchableQuery('   ')).toBe(false);
    expect(isSearchableQuery(' j ')).toBe(false);
    expect(isSearchableQuery('jo')).toBe(true);
  });
  it('searchPlayers com termo curto devolve [] SEM chamar o servidor', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await searchPlayers('save-1', 'j')).toEqual([]);
    expect(await searchPlayers('save-1', '')).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('nameStartsWith — prefixo, em ordem, sem acento e sem caixa', () => {
  it('"JOA" casa João e Joana; não casa Ana Joaquina nem "Jo"', () => {
    expect(nameStartsWith('João', 'JOA')).toBe(true);
    expect(nameStartsWith('Joana', 'joa')).toBe(true);
    expect(nameStartsWith('Ana Joaquina', 'joa')).toBe(false);
    expect(nameStartsWith('Jo', 'joa')).toBe(false);
    expect(nameStartsWith('João', 'j')).toBe(false); // abaixo do mínimo nunca casa
  });
});

describe('sanitizePlayerSearch — só a vista pública passa', () => {
  it('descarta e-mail, saveId, aparelho e qualquer campo a mais; corta em 10', () => {
    const cru = {
      players: Array.from({ length: 15 }, (_, i) => ({
        id: `pid${String(i).padStart(10, '0')}`, name: `João ${i}`, guildName: 'Os Lumes', stage: 'rookie',
        email: 'x@y.com', saveId: 'segredo', device: 'pixel', points: 9,
      })),
    };
    const out = sanitizePlayerSearch(cru);
    expect(PLAYER_SEARCH_MAX).toBe(10);
    expect(out).toHaveLength(10);
    for (const h of out) expect(Object.keys(h).sort()).toEqual(['guildName', 'id', 'name', 'stage']);
    expect(JSON.stringify(out)).not.toMatch(/x@y\.com|segredo|pixel/);
  });
  it('lixo vira lista vazia; linha sem id/nome some; clã vazio não vira campo', () => {
    expect(sanitizePlayerSearch(null)).toEqual([]);
    expect(sanitizePlayerSearch({ players: 'x' })).toEqual([]);
    expect(sanitizePlayerSearch({ players: [{ id: 'curto', name: 'A' }, { id: 'pid0000000001', name: '' }, { id: 'pid0000000002', name: 'Bia', guildName: '  ' }] }))
      .toEqual([{ id: 'pid0000000002', name: 'Bia', stage: 'rookie' }]);
  });
});

afterEach(() => { vi.unstubAllGlobals(); });
