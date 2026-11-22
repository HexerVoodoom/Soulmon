import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { soulmonDisplayName } from '../utils/petName';

/** O chat fala com o Soulmon pelo APELIDO que a pessoa deu (mesma fonte da Home: `soulmonDisplayName`), nunca pelo nome da espécie. */
describe('chat do Soulmon usa o apelido', () => {
  const src = readFileSync('src/components/CompanionHUD.tsx', 'utf8');
  it('todo petName passado ao chat é petDisplayName com fallback à espécie', () => {
    const usos = src.match(/petName=\{[^}]+\}/g) ?? [];
    expect(usos.length).toBeGreaterThanOrEqual(2);
    for (const u of usos) expect(u).toBe('petName={petDisplayName || currentStage}');
  });
  it('a fonte é a mesma da Home: apelido, senão espécie', () => {
    expect(soulmonDisplayName({ baseName: 'Flamejante', petName: ' Bito ' })).toBe('Bito');
    expect(soulmonDisplayName({ baseName: 'Flamejante' })).toBe('Flamejante');
  });
});
