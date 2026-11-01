import { describe, it, expect } from 'vitest';
import { recordStrayPlayerSeen, sanitizeStrayPlayersSeen, sanitizeStrayPool, strayPlayerForTournament, STRAY_SEEN_MAX, type StrayPlayerSeen } from './strayPlayers';

const SID = (c: string) => c.repeat(24);

describe('desgarrados de jogadores — cliente (§213)', () => {
  it('pool: só sid de 24 hex, sem repetir, URL fora da allowlist cai, sem nome nenhum', () => {
    const p = sanitizeStrayPool([
      { sid: SID('a'), stage: 'mega', spriteUrl: 'https://atacante.example/x.png', element: 'fogo', name: 'Fulano' },
      { sid: SID('a'), stage: 'rookie' },
      { sid: 'curto', stage: 'rookie' },
      { sid: SID('b'), stage: '<script>', spriteUrl: '/api/sprite-image?k=' + '0'.repeat(32) },
    ]);
    expect(p).toEqual([
      { sid: SID('a'), stage: 'mega', element: 'fogo' },
      { sid: SID('b'), stage: 'rookie', spriteUrl: '/api/sprite-image?k=' + '0'.repeat(32) },
    ]);
    expect(sanitizeStrayPool('lixo')).toEqual([]);
  });
  it('registro de visto: idempotente, só acrescenta, quem já viu fica com ele', () => {
    const s0: { strayPlayersSeen?: StrayPlayerSeen[] } = { strayPlayersSeen: [] };
    const s1 = recordStrayPlayerSeen(s0, { sid: SID('c'), stage: 'champion' }, '2026-11-01');
    expect(s1.strayPlayersSeen).toEqual([{ sid: SID('c'), stage: 'champion', at: '2026-11-01' }]);
    expect(recordStrayPlayerSeen(s1, { sid: SID('c'), stage: 'mega' }, '2026-11-02')).toBe(s1);
  });
  it('sanitiza o save: lixo = vazio, teto, data ruim vira 1970-01-01', () => {
    expect(sanitizeStrayPlayersSeen(null)).toEqual([]);
    expect(sanitizeStrayPlayersSeen([{ sid: SID('d'), stage: 'rookie', at: 'ontem' }])).toEqual([{ sid: SID('d'), stage: 'rookie', at: '1970-01-01' }]);
    const muitos = Array.from({ length: STRAY_SEEN_MAX + 5 }, (_, i) => ({ sid: i.toString(16).padStart(24, '0'), stage: 'rookie', at: '2026-11-01' }));
    expect(sanitizeStrayPlayersSeen(muitos)).toHaveLength(STRAY_SEEN_MAX);
  });
  it('escolha do Torneio: estável por conta e dia; pool vazio = nenhum', () => {
    const pool = [{ sid: SID('1'), stage: 'rookie' }, { sid: SID('2'), stage: 'rookie' }, { sid: SID('3'), stage: 'rookie' }];
    expect(strayPlayerForTournament(pool, 'x', '2026-11-01')).toEqual(strayPlayerForTournament(pool, 'x', '2026-11-01'));
    expect(strayPlayerForTournament([], 'x', '2026-11-01')).toBeUndefined();
  });
});
