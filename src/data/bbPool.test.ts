import { describe, it, expect, afterEach } from 'vitest';
import { sortearBB, BB_POOL, type BBEntry } from './bbPool';
import { initialStageForNewSave, setOnboardingVelado, setVeladoTester, isOnboardingVelado } from '../utils/bbStage';

const pool: BBEntry[] = [
  { id: 'a', elemento: 'fogo', sprite: 's' }, { id: 'b', elemento: 'fogo', sprite: 's' },
  { id: 'c', elemento: 'agua', reino: 'mare', sprite: 's' },
];

describe('sortearBB', () => {
  it('é determinístico pelo saveId', () => {
    expect(sortearBB('abc123', null, pool)).toBe(sortearBB('abc123', null, pool));
  });
  it('filtra por elemento da leitura; sem match cai em reino, depois em qualquer', () => {
    for (let i = 0; i < 30; i++) expect(sortearBB('s' + i, { elemento: 'fogo' }, pool)!.elemento).toBe('fogo');
    expect(sortearBB('x', { elemento: 'nada', reino: 'mare' }, pool)!.id).toBe('c');
    expect(pool).toContain(sortearBB('x', { elemento: 'nada' }, pool));
  });
  it('pool vazio = null; pool real tem 3 placeholders', () => {
    expect(sortearBB('x', null, [])).toBeNull();
    expect(BB_POOL).toHaveLength(3);
  });
});

describe('interruptor por usuário', () => {
  afterEach(() => { setOnboardingVelado(false); setVeladoTester(false); });
  it('desligado por padrão; global OU tester liga', () => {
    expect(initialStageForNewSave()).toBe('rookie');
    setVeladoTester(true);
    expect(isOnboardingVelado()).toBe(true);
    expect(initialStageForNewSave()).toBe('bb');
    setVeladoTester(false); setOnboardingVelado(true);
    expect(initialStageForNewSave()).toBe('bb');
    setVeladoTester('sim'); setOnboardingVelado(false);
    expect(isOnboardingVelado()).toBe(false);
  });
});
