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
  const sem = { passeio: null, weekly: null, conquistas: null, dailyMissions: undefined, bondLevel: 1 } as const;
  // O rodízio diário pode sortear uma missão de amigo/presente (que também marca o prédio): o teste mede um dia SEM ela, para isolar o alerta.
  const day = Array.from({ length: 28 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`)
    .find(d => lotMissionMarks({ ...sem, day: d, friendsAlert: false })['laboratorio.amigos'] === undefined);
  const base = { ...sem, day: day ?? '2026-11-05' } as const;
  it('acende com convite/presente novo e apaga sem', () => {
    expect(day, 'algum dia de novembro sem missão de amigo').toBeDefined();
    expect(lotMissionMarks({ ...base, friendsAlert: true })['laboratorio.amigos']).toBe('available');
    expect(lotMissionMarks({ ...base, friendsAlert: false })['laboratorio.amigos']).toBeUndefined();
  });
});
