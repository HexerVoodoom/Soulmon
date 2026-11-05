import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { friendTrainingSide } from './FriendTraining';
import { lotMissionMarks } from '../utils/lotMarks';

describe('treino com amigo (§242): não vale nada', () => {
  it('o lado do amigo nasce só do estágio público', () => {
    const a = friendTrainingSide({ stage: 'rookie' });
    expect(a.combatant).toBeTruthy();
    expect(a.fx).toBeUndefined();
  });
  it('o componente não toca rede, save, Bits, Honra nem ranking', () => {
    const src = readFileSync(new URL('./FriendTraining.tsx', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const proibido of ['utils/community', 'setGameState', 'onEarnEmblems', 'awardBondXP', 'gamePoints', 'fetch(']) expect(src).not.toContain(proibido);
  });
});

describe('marcador "!" do prédio Amigos', () => {
  const base = { passeio: null, weekly: null, conquistas: null, dailyMissions: undefined, day: '2026-11-05', bondLevel: 1 } as const;
  it('acende com convite/presente novo e apaga sem', () => {
    expect(lotMissionMarks({ ...base, friendsAlert: true })['laboratorio.amigos']).toBe('available');
    expect(lotMissionMarks({ ...base, friendsAlert: false })['laboratorio.amigos']).toBeUndefined();
  });
});
