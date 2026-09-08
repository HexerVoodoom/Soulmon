// @vitest-environment jsdom
/**
 * PRESETS DE ROTINA no cadastro (P4).
 *
 * A pesquisa do dossiê (`product/soulmon-01/balance/carga-diaria.md`) foi
 * conclusiva: **ninguém planeja a semana** num app de hábito, e nenhum dos
 * benchmarks resolve isso com um planejador — todos resolvem com preset de um
 * toque na criação. A grade de 7 caixinhas não é difícil; ela é uma DECISÃO de
 * sete partes cobrada de quem só queria começar a correr.
 *
 * O que estes testes protegem:
 *
 *  1. **A precisão não foi tirada de ninguém.** A grade completa continua
 *     existindo atrás de "Personalizar". Preset que substitui a grade em vez de
 *     resumi-la trocaria um problema por outro.
 *  2. **Quem já tem uma semana personalizada não a vê sumir.** Abrir a edição
 *     com a grade escondida esconderia a própria configuração da pessoa.
 *  3. **PT e EN**, como todo texto de UI deste app.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { HabitScheduleFields } from './CreateModal';
import { ROUTINE_PRESETS, presetDeRotina } from '../types/taskModel';

/** O mínimo do `useHabitSchedule` que o seletor consome. */
function schedFake(weekDays: number[]) {
  const setWeekDays = vi.fn();
  const toggleWeekDay = vi.fn();
  return {
    sched: {
      kind: 'weekdays' as const,
      weekDays,
      setWeekDays,
      toggleWeekDay,
      setKind: vi.fn(),
      timesPerWeek: 3,
      setTimesPerWeek: vi.fn(),
      everyN: 2,
      setEveryN: vi.fn(),
      countFromCompletion: false,
      setCountFromCompletion: vi.fn(),
      buildWeekDays: () => weekDays,
    } as unknown as Parameters<typeof HabitScheduleFields>[0]['sched'],
    setWeekDays,
    toggleWeekDay,
  };
}

const abrir = (weekDays: number[], language: 'pt-BR' | 'en-US' = 'en-US') => {
  const f = schedFake(weekDays);
  renderWithCss(<HabitScheduleFields sched={f.sched} language={language} />);
  return f;
};

describe('presets de rotina', () => {
  it('oferece as três escolhas de um toque, mais "Personalizar"', () => {
    abrir([...ROUTINE_PRESETS.uteis]);
    expect(screen.getByLabelText('Every day')).toBeTruthy();
    expect(screen.getByLabelText('Weekdays')).toBeTruthy();
    expect(screen.getByLabelText('Light')).toBeTruthy();
    expect(screen.getByLabelText('Customize')).toBeTruthy();
  });

  it('um toque escreve a semana inteira — nenhuma decisão de sete partes', () => {
    const f = abrir([...ROUTINE_PRESETS.uteis]);
    fireEvent.click(screen.getByLabelText('Light'));
    expect(f.setWeekDays).toHaveBeenCalledWith([1, 3, 5]);
  });

  it('com um preset ativo, a grade fica RECOLHIDA', () => {
    abrir([...ROUTINE_PRESETS.diario]);
    // Os dias só existem na grade; ausentes = grade recolhida.
    expect(screen.queryByLabelText('Monday')).toBeNull();
  });

  it('"Personalizar" traz a grade de volta — a precisão não foi tirada', () => {
    abrir([...ROUTINE_PRESETS.diario]);
    fireEvent.click(screen.getByLabelText('Customize'));
    expect(screen.getByLabelText('Monday')).toBeTruthy();
    // E ela é a grade de verdade: os sete dias.
    for (const dia of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
      expect(screen.getByLabelText(dia)).toBeTruthy();
    }
  });

  it('semana PERSONALIZADA abre com a grade já aberta', () => {
    // Terça e sábado não são preset nenhum. Esconder a grade aqui esconderia a
    // configuração que a pessoa mesma montou.
    abrir([2, 6]);
    expect(presetDeRotina([2, 6])).toBeNull();
    expect(screen.getByLabelText('Tuesday')).toBeTruthy();
  });

  it('os rótulos existem nos DOIS idiomas', () => {
    abrir([...ROUTINE_PRESETS.leve], 'pt-BR');
    expect(screen.getByLabelText('Todo dia')).toBeTruthy();
    expect(screen.getByLabelText('Dias úteis')).toBeTruthy();
    expect(screen.getByLabelText('Leve')).toBeTruthy();
    expect(screen.getByLabelText('Personalizar')).toBeTruthy();
    cleanup();
    abrir([...ROUTINE_PRESETS.leve], 'en-US');
    expect(screen.getByLabelText('Every day')).toBeTruthy();
  });
});

describe('presetDeRotina', () => {
  it('reconhece os três, em qualquer ordem, e recusa o resto', () => {
    expect(presetDeRotina([6, 5, 4, 3, 2, 1, 0])).toBe('diario');
    expect(presetDeRotina([5, 4, 3, 2, 1])).toBe('uteis');
    expect(presetDeRotina([5, 3, 1])).toBe('leve');
    expect(presetDeRotina([1, 2])).toBeNull();
    expect(presetDeRotina([])).toBeNull();
  });

  it('dia repetido não confunde o reconhecimento', () => {
    expect(presetDeRotina([1, 1, 3, 5, 5])).toBe('leve');
  });
});
