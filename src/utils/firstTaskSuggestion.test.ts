import { describe, expect, it } from 'vitest';
import { LIFE_AREAS } from '../types/activityCatalog';
import { firstTaskFrom, suggestFirstTask } from './firstTaskSuggestion';

describe('primeira tarefa do onboarding (11/10/2026)', () => {
  it('toda área tem sugestão nas duas línguas, com emoji', () => {
    for (const a of LIFE_AREAS) {
      const en = suggestFirstTask([a], false);
      const pt = suggestFirstTask([a], true);
      expect(en.name.length).toBeGreaterThan(5);
      expect(pt.name).not.toBe(en.name);
      expect(en.emoji).toBeTruthy();
    }
  });
  it('sem área vem uma sugestão genérica', () => {
    expect(suggestFirstTask([], false).name).toMatch(/small thing/);
  });
  it('o texto da pessoa vence a sugestão; vazio = sem tarefa', () => {
    expect(firstTaskFrom('  Ligar pro médico ', ['corpo'], true)?.name).toBe('Ligar pro médico');
    expect(firstTaskFrom('   ', ['corpo'], true)).toBeNull();
  });
  it('limita o nome a 80 caracteres', () => {
    expect(firstTaskFrom('x'.repeat(200), [], false)?.name.length).toBe(80);
  });
});
