import { describe, it, expect } from 'vitest';
import { STRAY_PLAYER_ENCOUNTER_CHANCE, strayPlayerForEncounter } from './strayPlayerEncounter';

const pool = [{ sid: 'a'.repeat(24), stage: 'mega' }, { sid: 'b'.repeat(24), stage: 'rookie' }];

describe('desgarrado de jogador nos encontros (§213 emenda)', () => {
  it('determinístico por chave; pool vazio ou sem chave = nunca', () => {
    for (let i = 0; i < 50; i++) expect(strayPlayerForEncounter(pool, `k${i}`)).toEqual(strayPlayerForEncounter(pool, `k${i}`));
    expect(strayPlayerForEncounter([], 'k1')).toBeUndefined();
    expect(strayPlayerForEncounter(pool, undefined)).toBeUndefined();
  });
  it('raro: perto de 1/40 em 20 mil encontros', () => {
    let n = 0;
    for (let i = 0; i < 20000; i++) if (strayPlayerForEncounter(pool, `dungeon|7|${i}|0`)) n++;
    expect(n / 20000).toBeGreaterThan(STRAY_PLAYER_ENCOUNTER_CHANCE * 0.6);
    expect(n / 20000).toBeLessThan(STRAY_PLAYER_ENCOUNTER_CHANCE * 1.4);
  });
  it('o Torneio não usa o desgarrado de jogador', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile(new URL('../components/TournamentPage.tsx', import.meta.url), 'utf8');
    expect(src).not.toMatch(/strayPlayer|StrayPlayer|getStrays/);
  });
});
