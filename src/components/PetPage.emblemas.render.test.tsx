// @vitest-environment jsdom
/**
 * O VISOR DE EMBLEMAS da Ficha — canvas Pet (D-P5, `DECISOES-WIREFRAME.md` §22).
 *
 *  1. **Só os ABERTOS são desenhados.** Fechado não vira cadeado nem silhueta:
 *     o app não cobra (E5/13.7 — posse, nunca dívida).
 *  2. **Duas linhas de 158×20 (×2)**, cada conquista com casa FIXA pela ordem
 *     canônica de `ACHIEVEMENT_IDS` — abrir uma nova nunca embaralha as outras.
 *     Com 9 conquistas o visor de 142×20 não comportava as nove (312 > 284).
 *  3. **Emblema 64² a 32** (0,5×) — escala inteira, como toda arte no vidro.
 *  4. **`role="img"` + `aria-label` = a linha quieta sob o visor** ("Achievements
 *     · N of 9", `ACHIEVEMENT_IDS.length` — nunca um 9 escrito à mão): o
 *     vidente vê o que o leitor ouve (X2). Nunca "faltam N".
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { PetPage } from './PetPage';
import { ACHIEVEMENT_IDS, type AchievementId } from '../utils/achievements';
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

describe('visor de emblemas (D-P5)', () => {
  it('há 9 conquistas, e a contagem do rótulo sai de ACHIEVEMENT_IDS.length', () => {
    expect(ACHIEVEMENT_IDS).toHaveLength(9);
    montar(['perfect-day', 'habit-7', 'dungeon-10']);
    const visor = screen.getByRole('img', { name: 'Achievements · 3 of 9' });
    expect(visor).toBeTruthy();
    // a MESMA frase como linha quieta, visível, sob o visor (X2)
    const linha = document.querySelector('[data-achievements-count]')!;
    expect(linha.textContent).toBe('Achievements · 3 of 9');
    expect(linha.textContent).not.toMatch(/left|remaining|faltam/i);
  });

  it('desenha SÓ os abertos — nada de cadeado ou silhueta para os fechados', () => {
    montar(['perfect-day', 'habit-7', 'dungeon-10']);
    const emblemas = Array.from(document.querySelectorAll('[data-emblem]'));
    expect(emblemas.map(e => e.getAttribute('data-emblem'))).toEqual(['perfect-day', 'habit-7', 'dungeon-10']);
    for (const img of emblemas) {
      expect(img.getAttribute('width')).toBe('32');
      expect(img.getAttribute('height')).toBe('32');
      expect((img as HTMLImageElement).alt.length).toBeGreaterThan(0);
    }
  });

  it('duas linhas de 158×20 a 2× (316×40), gap 2 + padding 4, e casa fixa por conquista', () => {
    montar([...ACHIEVEMENT_IDS]);
    const linhas = Array.from(document.querySelectorAll<HTMLElement>('[data-emblem-row]'));
    expect(linhas).toHaveLength(2);
    for (const l of linhas) {
      expect(l.style.width).toBe('316px');
      expect(l.style.height).toBe('40px');
      expect(l.style.gap).toBe('2px');
      expect(l.style.padding).toBe('0px 4px');
    }
    // as nove abertas: 5 em cima, 4 embaixo, na ordem canônica
    const emCima = Array.from(linhas[0].querySelectorAll('[data-emblem]')).map(e => e.getAttribute('data-emblem'));
    const embaixo = Array.from(linhas[1].querySelectorAll('[data-emblem]')).map(e => e.getAttribute('data-emblem'));
    expect(emCima).toEqual(ACHIEVEMENT_IDS.slice(0, 5));
    expect(embaixo).toEqual(ACHIEVEMENT_IDS.slice(5));
    // as nove cabem: 5 × 32 + 4 × 2 + 8 = 176 ≤ 316
    expect(5 * 32 + 4 * 2 + 8).toBeLessThanOrEqual(316);
    expect(screen.getByRole('img', { name: 'Achievements · 9 of 9' })).toBeTruthy();
  });

  it('uma conquista da 2ª linha aberta sozinha fica na 2ª linha (casa fixa, sem subir)', () => {
    montar(['tasks-100']);
    const linhas = Array.from(document.querySelectorAll('[data-emblem-row]'));
    expect(linhas[0].querySelectorAll('[data-emblem]')).toHaveLength(0);
    expect(linhas[1].querySelectorAll('[data-emblem]')).toHaveLength(1);
  });

  it('sem conquista aberta o visor não é desenhado (nem a linha de contagem)', () => {
    montar([]);
    expect(screen.queryByRole('img', { name: /Achievements/ })).toBeNull();
    expect(document.querySelector('[data-achievements-count]')).toBeNull();
  });

  it('PT-BR: "Conquistas · N de 9", no rótulo e na linha', () => {
    montar(['perfect-day'], 'pt-BR');
    expect(screen.getByRole('img', { name: 'Conquistas · 1 de 9' })).toBeTruthy();
    expect(document.querySelector('[data-achievements-count]')!.textContent).toBe('Conquistas · 1 de 9');
  });
});
