// @vitest-environment jsdom
/**
 * Beta-2, FRENTE D (13/10/2026) — critérios de aceite de tela que não cabem em outro arquivo:
 *  · 9.1  Salão de Jogos: o velociraptor e a tesoura saíram; ícones de arte existente; espaço maior entre os cards; Elemental Fusion mantém a gema;
 *  · 10.1 Santuário do Vínculo: a categoria da atividade vira ícone próprio (imagem), não emoji;
 *  · 10.3 Centro de Evolução: abas compactas (tablist), nome inteiro dos três caminhos, toque e deslize trocam de aba;
 *  · 12   Humor: ícones de 40 px em alvos >= 44, e o nome do humor escolhido aparece.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, cleanup, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderWithCss } from '../test/renderEnv';
import { SalaoSheet } from './play/PlaySheets';
import { StatsPage } from './StatsPage';
import { EvolutionPath } from './EvolutionPath';
import { DailyReportModal } from './DailyReportModal';
import { categoryIconArt, CATEGORY_ICON_ART } from '../assets/soulmon/icons/categories';
import { CATEGORY_ICONS } from '../types/category-icons';
import { MOOD_OPTIONS } from '../utils/mood';
import type { CreatureStage } from '../utils/oracle';

afterEach(() => cleanup());

describe('9.1 — Salão de Jogos', () => {
  it('quatro cards (Soul Barrage é o 4º), em cartas ilustradas (GameCard; pedido do dono em 17/11/2026, que revoga a lista de 04/11) e sem o velociraptor nem a tesoura; cada título tem ícone', () => {
    const { container } = renderWithCss(<SalaoSheet language="pt-BR" onStart={() => {}} />);
    const cards = container.querySelectorAll('li');
    expect(cards).toHaveLength(4);
    expect(container.querySelector('ul.sm-game-card-grid')).not.toBeNull();
    for (const li of cards) expect(li.querySelector('img[data-pixel-icon], img[data-game-card-art]')).not.toBeNull();
  });
  it('o fonte não importa mais icon-game-dino nem icon-game-rps (e o Elemental Fusion mantém a gema)', () => {
    const src = readFileSync(join(__dirname, 'play/PlaySheets.tsx'), 'utf-8');
    expect(src).not.toMatch(/^import .*icon-game-(dino|rps)\.png/m);
    expect(src).toMatch(/^import iconCombina from .*icon-gem\.png/m);
  });
});

describe('10.1 — ícones de categoria no Santuário', () => {
  it('as categorias com arte (as 7 herdadas; as outras são slots a gerar, caem no glifo) aceitam qualquer caixa e a inválida não quebra', () => {
    const comIcone = Object.keys(CATEGORY_ICONS);
    for (const id of Object.keys(CATEGORY_ICON_ART)) expect(comIcone).toContain(id);
    expect(Object.keys(CATEGORY_ICON_ART).length).toBeGreaterThanOrEqual(7);
    expect(categoryIconArt('study')).toBe(CATEGORY_ICON_ART.aprendizado);
    expect(categoryIconArt('STUDY')).toBe(CATEGORY_ICON_ART.aprendizado);
    expect(categoryIconArt('nada')).toBeUndefined();
    expect(categoryIconArt(undefined)).toBeUndefined();
  });
  it('as listas "O que você mais repete" e "Últimas conclusões" desenham a imagem da categoria, não o emoji', () => {
    const { container } = renderWithCss(
      <StatsPage
        completedTasks={[{ id: 't1', name: 'Alongar', category: 'corpo', emoji: '🧘', completedAt: new Date().toISOString() }]}
        activityStats={{ a1: { name: 'Alongar', emoji: '🧘', category: 'corpo', completionCount: 3 } }}
        language="pt-BR"
        totalXP={50}
      />,
    );
    const ems = [...container.querySelectorAll('.sm2-stats-lst .em')];
    expect(ems.length).toBeGreaterThanOrEqual(2);
    for (const em of ems) {
      expect(em.querySelector('img')).not.toBeNull();
      expect(em.textContent).not.toContain('🧘');
    }
  });
  it('sem categoria válida, o emoji da atividade segue como fallback', () => {
    const { container } = renderWithCss(
      <StatsPage
        completedTasks={[{ id: 't1', name: 'Algo', category: 'xyz' as never, emoji: '🧘', completedAt: new Date().toISOString() }]}
        activityStats={{}}
        language="pt-BR"
        totalXP={50}
      />,
    );
    expect(container.querySelector('.sm2-stats-lst .em')!.textContent).toBe('🧘');
  });
});

describe('10.3 — Centro de Evolução: os três caminhos lado a lado (09/11/2026, substitui as abas compactas)', () => {
  const stage = (over: Partial<CreatureStage>): CreatureStage => ({
    stage: 'rookie', stageName: { pt: 'Rookie', en: 'Rookie' }, name: 'Fagul',
    description: { pt: 'x', en: 'x' }, imagePrompt: 'p', imagePromptFallback: 'pf', ...over,
  } as CreatureStage);
  const base = {
    currentStageId: 'rookie', currentBranch: 'harmony' as const,
    powerPoints: 4, harmonyPoints: 12, benevolencePoints: 7,
    evolutionPoints: 5, todayGauge: 0, gaugeGoal: 30,
    stages: [stage({}), ...(['poder', 'harmonia', 'benevolencia'] as const).map(b => stage({ stage: 'champion', branch: b, name: `C-${b}`, stageName: { pt: 'Champion', en: 'Champion' } }))],
    unlockedEvolutions: ['rookie'],
  };
  it('PT: Poder / Harmonia / Benevolência inteiros, com número, sem abas nem radio', () => {
    renderWithCss(<EvolutionPath {...base} language="pt-BR" />);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    const rot = (a: string) => screen.getByTestId(`sm-caminho-rotulo-${a}`).textContent;
    expect([rot('power'), rot('harmony'), rot('benevolence')]).toEqual(['Poder4', 'Harmonia12', 'Benevolência7']);
  });
  it('EN: Power / Harmony / Benevolence inteiros', () => {
    renderWithCss(<EvolutionPath {...base} language="en-US" />);
    const rot = (a: string) => screen.getByTestId(`sm-caminho-rotulo-${a}`).textContent;
    expect([rot('power'), rot('harmony'), rot('benevolence')]).toEqual(['Power4', 'Harmony12', 'Benevolence7']);
  });
});

describe('12 — humor', () => {
  const relatorio = {
    date: 'Tue Sep 08 2026', done: 4, total: 4, required: 4, heartsLost: 0, wasPerfect: true, perfectDays: 3, degenerated: false,
  } as never;
  /** O resumo é em passos (frente C): tarefas -> corações -> hoje (onde mora o humor). */
  const ateHoje = () => { for (let i = 0; i < 2; i++) fireEvent.click(document.querySelector('[data-report-next]') as HTMLElement); };
  it('cinco ícones próprios de 40 px em alvos de pelo menos 44, com rótulo e estado preservados', () => {
    renderWithCss(<DailyReportModal report={relatorio} onClose={() => {}} language="pt-BR" moodToday={4} onPickMood={() => {}} />);
    ateHoje();
    const grupo = screen.getByRole('group', { name: 'Humor' });
    const botoes = [...grupo.querySelectorAll('button')];
    expect(botoes).toHaveLength(5);
    botoes.forEach((b, i) => {
      expect(b.getAttribute('aria-label')).toBe(MOOD_OPTIONS[i].labelPt);
      expect(parseInt(b.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
      const img = b.querySelector('img[data-mood-art]') as HTMLImageElement;
      expect(img.width).toBe(40);
      expect(img.height).toBe(40);
    });
    // W13: legenda curta sob cada ícone, ≥ 11 px; o aria-label segue o rótulo longo.
    expect(botoes.map(b => b.querySelector('[data-mood-caption]')!.textContent)).toEqual(['Mal', 'Baixo', 'Normal', 'Bom', 'Ótimo']);
    botoes.forEach(b => expect(parseInt((b.querySelector('[data-mood-caption]') as HTMLElement).style.fontSize, 10)).toBeGreaterThanOrEqual(11));
    expect(botoes.map(b => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true', 'false']);
    expect(document.querySelector('[data-mood-label]')!.textContent).toBe('Bem');
  });
  it('sem humor escolhido não há rótulo; EN usa o rótulo em inglês', () => {
    renderWithCss(<DailyReportModal report={relatorio} onClose={() => {}} language="en-US" moodToday={null} onPickMood={() => {}} />);
    ateHoje();
    expect(document.querySelector('[data-mood-label]')).toBeNull();
    cleanup();
    renderWithCss(<DailyReportModal report={relatorio} onClose={() => {}} language="en-US" moodToday={5} onPickMood={() => {}} />);
    ateHoje();
    expect(document.querySelector('[data-mood-label]')!.textContent).toBe('Great');
  });
});
