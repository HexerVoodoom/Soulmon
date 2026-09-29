/**
 * Os recibos do resgate e a Concha no save. O recibo é o que impede o segundo crédito de Emblemas
 * quando o KV devolve 200 duas vezes (M3, `L2-backend.md`); a Concha só entra por id conhecido.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mem = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); }, clear: () => mem.clear(), key: () => null, length: 0,
});

import { readClaimedReceipts, hasClaimedReceipt, rememberClaimedReceipt, grantGuildTrophy } from './guildClaimLocal';
import { STORAGE_KEYS } from './storageKeys';
import { RAID_TROPHY_ID } from './guildRules';

beforeEach(() => mem.clear());

describe('recibos', () => {
  it('lembrar é idempotente: a segunda vez devolve false (quem chama NÃO credita)', () => {
    expect(hasClaimedReceipt('r1')).toBe(false);
    expect(rememberClaimedReceipt('r1')).toBe(true);
    expect(rememberClaimedReceipt('r1')).toBe(false);
    expect(readClaimedReceipts()).toEqual(['r1']);
    expect(hasClaimedReceipt('r1')).toBe(true);
  });

  it('só guarda recibos (opacos): nada de semana, guilda ou quantia', () => {
    rememberClaimedReceipt('abc123');
    expect(mem.get(STORAGE_KEYS.GUILD_CLAIMED)).toBe('["abc123"]');
  });

  it('lixo no disco vira lista vazia; o teto descarta os mais velhos', () => {
    mem.set(STORAGE_KEYS.GUILD_CLAIMED, '{"x":1}');
    expect(readClaimedReceipts()).toEqual([]);
    mem.set(STORAGE_KEYS.GUILD_CLAIMED, JSON.stringify([1, '', 'ok', null]));
    expect(readClaimedReceipts()).toEqual(['ok']);
    for (let i = 0; i < 40; i++) rememberClaimedReceipt(`r${i}`);
    const lista = readClaimedReceipts();
    expect(lista.length).toBe(24);
    expect(lista.at(-1)).toBe('r39');
  });

  it('storage que falha na escrita NÃO derruba (o servidor ainda recusa a segunda)', () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} });
    expect(() => rememberClaimedReceipt('r9')).not.toThrow();
  });
});

describe('a Concha da Maré no save', () => {
  it('entra em ownedFurniture UMA vez (a 8ª Concha é no-op) e não muta o `prev`', () => {
    const prev = { ownedFurniture: ['furn-rug'] };
    const a = grantGuildTrophy(prev, RAID_TROPHY_ID);
    expect(a.ownedFurniture).toEqual(['furn-rug', RAID_TROPHY_ID]);
    expect(prev.ownedFurniture).toEqual(['furn-rug']);
    expect(grantGuildTrophy(a, RAID_TROPHY_ID)).toBe(a);
  });

  it('id que não é conquista da Guilda não entra no save (dado do servidor não inventa item)', () => {
    const prev = { ownedFurniture: [] as string[] };
    expect(grantGuildTrophy(prev, 'furn-sofa')).toBe(prev);
    expect(grantGuildTrophy(prev, 'qualquer-coisa')).toBe(prev);
  });

  it('save sem `ownedFurniture` (antigo) recebe a lista', () => {
    expect(grantGuildTrophy({}, RAID_TROPHY_ID)).toEqual({ ownedFurniture: [RAID_TROPHY_ID] });
  });
});
