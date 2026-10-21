// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { FirstTaskCompletedPopup } from './FirstTaskCompletedPopup';
import { MissionCard } from './nav/MissionCard';

afterEach(cleanup);

/** QA L05-09: foco do diálogo, coluna de ícone vazia e causa do estado vazio. */
describe('L05-09 — estados', () => {
  it('"First task done!" abre com o foco DENTRO do diálogo, no botão primário (antes ficava no BODY)', () => {
    render(<FirstTaskCompletedPopup isOpen onClose={() => {}} language="en-US" />);
    const ativo = document.activeElement as HTMLElement;
    expect(ativo).not.toBe(document.body);
    expect(ativo.textContent).toBe('Got it');
    expect(ativo.closest('[role="dialog"]')).toBeTruthy();
  });

  it('cartão calmo (missão especial) ainda não feito: sem a coluna de ícone vazia; o normal e o feito mantêm o ícone', () => {
    const calmo = render(<ul><MissionCard language="en-US" attrs={{}} status="open" title="Special" quiet /></ul>);
    expect(calmo.container.querySelector('li > span')).toBeNull();
    calmo.unmount();
    const normal = render(<ul><MissionCard language="en-US" attrs={{}} status="open" title="Normal" /></ul>);
    expect(normal.container.querySelector('li > span')).toBeTruthy();
    normal.unmount();
    const feito = render(<ul><MissionCard language="en-US" attrs={{}} status="claimed" title="Done" quiet /></ul>);
    expect(feito.container.querySelector('li > span')).toBeTruthy();
  });

  it('o vazio do "View all" diz a causa: busca, filtro de tarefas ou de hábitos (PT e EN)', () => {
    const src = readFileSync('src/components/DailyRituals.tsx', 'utf8');
    for (const t of ["`Nada encontrado para “${busca.trim()}”.`", "`Nothing found for “${busca.trim()}”.`", "'Nenhuma tarefa por aqui.'", "'No tasks here.'", "'Nenhum hábito por aqui.'", "'No habits here.'"]) {
      expect(src, t).toContain(t);
    }
    expect(src).not.toContain("(isPt ? 'Nada encontrado.' : 'Nothing found.')");
  });
});
