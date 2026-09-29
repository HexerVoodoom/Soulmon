/**
 * Os recibos do resgate e a Concha no save. O recibo é o que impede o segundo crédito de Emblemas
 * quando o KV devolve 200 duas vezes (M3, `L2-backend.md`); a Concha só entra por id conhecido.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mem = new Map<string, string>();
/** O storage da conveniência; com `cheio` o `setItem` estoura como uma quota real (o `safeStorage` engole e devolve `false`). */
const cheio = (recusa: boolean) => ({
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { if (recusa) throw new Error('QuotaExceededError'); mem.set(k, v); },
  removeItem: (k: string) => { mem.delete(k); }, clear: () => mem.clear(), key: () => null, length: 0,
});
vi.stubGlobal('localStorage', cheio(false));

import {
  readClaimedReceipts, hasClaimedReceipt, rememberClaimedReceipt, grantGuildTrophy, markClaimAttempt, hadClaimAttempt, resetClaimMemoryForTests,
} from './guildClaimLocal';
import { STORAGE_KEYS } from './storageKeys';
import { RAID_TROPHY_ID } from './guildRules';

beforeEach(() => { mem.clear(); resetClaimMemoryForTests(); vi.stubGlobal('localStorage', cheio(false)); });

describe('recibos', () => {
  it('lembrar é idempotente: a segunda vez devolve false (quem chama NÃO credita)', () => {
    expect(hasClaimedReceipt('r1')).toBe(false);
    expect(rememberClaimedReceipt('r1')).toBe(true);
    expect(rememberClaimedReceipt('r1')).toBe(false);
    expect(readClaimedReceipts()).toEqual(['r1']);
    expect(hasClaimedReceipt('r1')).toBe(true);
  });

  it('só guarda recibos (opacos): nada de guilda ou quantia (a semana só na marca de tentativa)', () => {
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

  it('M2: storage CHEIO/indisponível — o recibo cai para a memória da execução e o segundo toque NÃO credita de novo', () => {
    vi.stubGlobal('localStorage', cheio(true));
    expect(() => rememberClaimedReceipt('r9')).not.toThrow();
    expect(hasClaimedReceipt('r9')).toBe(true);
    expect(rememberClaimedReceipt('r9')).toBe(false);   // quem chama não credita a segunda vez
    expect(readClaimedReceipts()).toEqual(['r9']);
    expect(mem.get(STORAGE_KEYS.GUILD_CLAIMED)).toBeUndefined(); // nada chegou ao disco
  });

  it('M2: com storage saudável a memória NÃO é usada (o disco é a fonte); depois de limpo, o app não "lembra" sozinho', () => {
    rememberClaimedReceipt('r1');
    mem.clear();
    expect(hasClaimedReceipt('r1')).toBe(false);
  });

  it('a TENTATIVA de colher (`~semana`) é do aparelho: só ela autoriza o 409 a creditar, e nunca conta como recibo', () => {
    expect(hadClaimAttempt('2026-W39')).toBe(false);
    markClaimAttempt('2026-W39');
    expect(hadClaimAttempt('2026-W39')).toBe(true);
    expect(hadClaimAttempt('2026-W38')).toBe(false);
    expect(readClaimedReceipts()).toEqual([]);
    expect(hasClaimedReceipt('~2026-W39')).toBe(true); // vive na mesma chave, com prefixo que nenhum recibo tem
    // também cai para a memória sem storage
    vi.stubGlobal('localStorage', cheio(true));
    markClaimAttempt('2026-W40');
    expect(hadClaimAttempt('2026-W40')).toBe(true);
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
