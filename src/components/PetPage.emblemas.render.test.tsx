// @vitest-environment jsdom
/**
 * A GRADE DE EMBLEMAS da Ficha — I12 (02/10/2026, pedido do dono). Substitui o
 * "visor de emblemas" (D-P5): os emblemas saíram do box.
 *
 *  1. **Fora de qualquer visor**: nenhum `role="img"` de conquistas e nenhuma
 *     `data-emblem-row`; é uma grade solta (`data-emblem-grid`).
 *  2. **Os 9 sempre aparecem**, abertos ou fechados; o fechado é apagado por
 *     FILTRO e legenda `muted` — nunca por `opacity` (reprovaria contraste).
 *  3. **Maiores**: arte 64² a 64 CSS (1× nativo) e alvo de toque ≥ 48.
 *  4. **Nome curto embaixo**; tocar abre COMO se ganha (H9).
 *  5. A contagem de POSSE continua a linha quieta ("Achievements · N of 9" —
 *     `ACHIEVEMENT_IDS.length`, nunca um 9 escrito à mão), nunca "faltam N".
 */
import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { PetPage } from './PetPage';
import { ACHIEVEMENT_IDS, ACHIEVEMENT_HOW, achievementShortName, type AchievementId } from '../utils/achievements';
import type { CreatureStage } from '../utils/oracle';

const rookie: CreatureStage = {
  stage: 'rookie',
  stageName: { pt: 'Desperto', en: 'Awakened' },
  name: 'Pixel',
  description: { pt: 'Uma faísca curiosa.', en: 'A curious spark.' },
  imagePrompt: '', imagePromptFallback: '',
};

function montar(abertas: readonly AchievementId[], language: 'pt-BR' | 'en-US' = 'en-US') {
  return renderWithCss(
    <PetPage
      stages={[rookie]}
      achievements={abertas}
      unlockedEvolutions={['rookie']}
      currentStageId="rookie"
      petName="Pixel"
      language={language}
    />,
  );
}

describe('grade de emblemas (I12)', () => {
  it('há 9 conquistas, e a contagem do rótulo sai de ACHIEVEMENT_IDS.length', () => {
    expect(ACHIEVEMENT_IDS).toHaveLength(9);
    montar(['perfect-day', 'habit-7', 'dungeon-10']);
    const linha = document.querySelector('[data-achievements-count]')!;
    expect(linha.textContent).toBe('Achievements · 3 of 9');
    expect(linha.textContent).not.toMatch(/left|remaining|faltam/i);
  });

  it('está FORA de qualquer box: sem visor de emblemas nem linhas de visor', () => {
    montar([...ACHIEVEMENT_IDS]);
    expect(screen.queryByRole('img', { name: /Achievements/ })).toBeNull();
    expect(document.querySelector('[data-emblem-row]')).toBeNull();
    const grade = document.querySelector('[data-emblem-grid]')!;
    expect(grade).toBeTruthy();
    expect(grade.closest('[data-viewport]')).toBeNull();
  });

  it('os 9 aparecem sempre; só os abertos têm data-emblem, os fechados ficam apagados SEM opacity', () => {
    montar(['perfect-day', 'habit-7', 'dungeon-10']);
    const celulas = Array.from(document.querySelectorAll<HTMLElement>('[data-emblem-cell]'));
    expect(celulas.map(c => c.getAttribute('data-emblem-cell'))).toEqual([...ACHIEVEMENT_IDS]);
    const abertos = Array.from(document.querySelectorAll('img[data-emblem]')).map(e => e.getAttribute('data-emblem'));
    expect(abertos).toEqual(['perfect-day', 'habit-7', 'dungeon-10']);
    const fechada = document.querySelector<HTMLElement>('[data-emblem-cell="mega-form"]')!;
    expect(fechada.getAttribute('data-locked')).toBe('true');
    const img = fechada.querySelector<HTMLImageElement>('img')!;
    expect(img.style.filter).toMatch(/grayscale/);
    for (const el of [fechada, img, ...Array.from(fechada.querySelectorAll<HTMLElement>('*'))]) {
      expect(el.style.opacity).toBe('');
    }
  });

  it('emblema 64² a 64 CSS (1× nativo) e alvo de toque ≥ 48', () => {
    montar([...ACHIEVEMENT_IDS]);
    for (const img of Array.from(document.querySelectorAll('img[data-emblem]'))) {
      expect(img.getAttribute('width')).toBe('64');
      expect(img.getAttribute('height')).toBe('64');
    }
    for (const c of Array.from(document.querySelectorAll<HTMLElement>('[data-emblem-cell]'))) {
      expect(parseInt(c.style.minHeight, 10)).toBeGreaterThanOrEqual(48);
    }
  });

  it('nome curto embaixo; tocar mostra COMO se ganha; tocar de novo recolhe', () => {
    montar(['habit-7'], 'pt-BR');
    const celula = document.querySelector<HTMLElement>('[data-emblem-cell="habit-7"]')!;
    expect(celula.textContent).toBe('Broto');
    expect(achievementShortName('habit-7', false)).toBe('Sprout');
    const como = document.querySelector('[data-emblem-how]')!;
    expect(como.textContent).toBe('');
    fireEvent.click(celula);
    expect(celula.getAttribute('aria-pressed')).toBe('true');
    expect(como.textContent).toContain(ACHIEVEMENT_HOW['habit-7'].pt);
    fireEvent.click(celula);
    expect(como.textContent).toBe('');
  });

  it('sem conquista aberta a grade ainda mostra os 9 apagados e a contagem 0', () => {
    montar([]);
    expect(document.querySelectorAll('[data-emblem-cell]')).toHaveLength(9);
    expect(document.querySelectorAll('img[data-emblem]')).toHaveLength(0);
    expect(document.querySelector('[data-achievements-count]')!.textContent).toBe('Achievements · 0 of 9');
  });

  it('PT-BR: "Conquistas · N de 9" na linha e no nome acessível da seção', () => {
    montar(['perfect-day'], 'pt-BR');
    expect(document.querySelector('[data-achievements-count]')!.textContent).toBe('Conquistas · 1 de 9');
    expect(screen.getByLabelText('Conquistas · 1 de 9')).toBeTruthy();
  });

  it('todo ACHIEVEMENT_ID tem texto de "como ganhar" nos dois idiomas', () => {
    for (const id of ACHIEVEMENT_IDS) {
      expect(ACHIEVEMENT_HOW[id].pt.length).toBeGreaterThan(5);
      expect(ACHIEVEMENT_HOW[id].en.length).toBeGreaterThan(5);
    }
  });
});
