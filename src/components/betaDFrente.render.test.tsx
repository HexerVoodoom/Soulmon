// @vitest-environment jsdom
/**
 * Beta-2, FRENTE D (13/10/2026) — critérios de aceite de tela que não cabem em outro arquivo:
 *  · 9.1  Salão de Jogos: o velociraptor e a tesoura saíram; ícones de arte existente; espaço maior entre os cards; Combina 3 mantém a gema;
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
  it('três cards, com respiro de 16 e sem o velociraptor nem a tesoura; cada título tem ícone', () => {
    const { container } = renderWithCss(<SalaoSheet language="pt-BR" onStart={() => {}} />);
    const cards = container.querySelectorAll('li');
    expect(cards).toHaveLength(3);
    const lista = container.querySelector('ul') as HTMLElement;
    expect(lista.style.gap).toContain('--sm2-space-4');
    for (const li of cards) expect(li.querySelector('img[data-pixel-icon]')).not.toBeNull();
  });
  it('o fonte não importa mais icon-game-dino nem icon-game-rps (e o Combina 3 mantém a gema)', () => {
    const src = readFileSync(join(__dirname, 'play/PlaySheets.tsx'), 'utf-8');
    expect(src).not.toMatch(/^import .*icon-game-(dino|rps)\.png/m);
    expect(src).toMatch(/^import iconCombina from .*icon-gem\.png/m);
  });
});

describe('10.1 — ícones de categoria no Santuário', () => {
  it('as 8 categorias têm arte (qualquer caixa) e a categoria inválida não quebra', () => {
    expect(Object.keys(CATEGORY_ICON_ART).sort()).toEqual(Object.keys(CATEGORY_ICONS).sort());
    expect(categoryIconArt('study')).toBe(CATEGORY_ICON_ART.Study);
    expect(categoryIconArt('STUDY')).toBe(CATEGORY_ICON_ART.Study);
    expect(categoryIconArt('nada')).toBeUndefined();
    expect(categoryIconArt(undefined)).toBeUndefined();
  });
  it('as listas "O que você mais repete" e "Últimas conclusões" desenham a imagem da categoria, não o emoji', () => {
    const { container } = renderWithCss(
      <StatsPage
        completedTasks={[{ id: 't1', name: 'Alongar', category: 'Health', emoji: '🧘', completedAt: new Date().toISOString() }]}
        activityStats={{ a1: { name: 'Alongar', emoji: '🧘', category: 'Health', completionCount: 3 } }}
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

describe('10.3 — Centro de Evolução: abas compactas', () => {
  const stage = (over: Partial<CreatureStage>): CreatureStage => ({
    stage: 'rookie', stageName: { pt: 'Rookie', en: 'Rookie' }, name: 'Fagul',
    description: { pt: 'x', en: 'x' }, imagePrompt: 'p', imagePromptFallback: 'pf', ...over,
  } as CreatureStage);
  const base = {
    currentStageId: 'rookie', currentBranch: 'harmony' as const,
    powerPoints: 4, harmonyPoints: 12, benevolencePoints: 7,
    evolutionPoints: 5, todayGauge: 0, gaugeGoal: 30,
    stages: [stage({})], unlockedEvolutions: ['rookie'],
  };
  it('PT: tablist com as três abas, nome inteiro e número; a ativa é a do caminho atual; sem pílula (radio)', () => {
    renderWithCss(<EvolutionPath {...base} language="pt-BR" />);
    const tablist = screen.getByRole('tablist', { name: 'Linha de evolução' });
    expect(tablist.className).toContain('sm2-kit-tabs-compact');
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(t => t.querySelector('[data-tab-label]')!.textContent)).toEqual(['Poder', 'Harmonia', 'Benevolência']);
    expect(tabs.map(t => t.querySelector('[data-tab-meta]')!.textContent)).toEqual(['4', '12', '7']);
    expect(tabs.map(t => t.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    // nada de truncar: sem reticências nem overflow escondido no rótulo
    for (const t of tabs) expect((t.querySelector('[data-tab-label]') as HTMLElement).style.textOverflow).toBe('');
  });
  it('EN: Power / Harmony / Benevolence inteiros', () => {
    renderWithCss(<EvolutionPath {...base} language="en-US" />);
    expect(screen.getAllByRole('tab').map(t => t.querySelector('[data-tab-label]')!.textContent)).toEqual(['Power', 'Harmony', 'Benevolence']);
  });
  it('toque troca de aba', () => {
    renderWithCss(<EvolutionPath {...base} language="pt-BR" />);
    fireEvent.click(screen.getByRole('tab', { name: /Benevolência/ }));
    expect(screen.getByRole('tab', { name: /Benevolência/ }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: /Harmonia/ }).getAttribute('aria-selected')).toBe('false');
  });
  it('deslize para a esquerda avança, para a direita volta; gesto curto ou vertical não troca; nas pontas não passa', () => {
    const { container } = renderWithCss(<EvolutionPath {...base} language="pt-BR" />);
    const area = container.querySelector('[data-branch-swipe]') as HTMLElement;
    const sel = () => screen.getAllByRole('tab').findIndex(t => t.getAttribute('aria-selected') === 'true');
    const deslizar = (dx: number, dy = 0) => {
      fireEvent.pointerDown(area, { clientX: 200, clientY: 300 });
      fireEvent.pointerUp(area, { clientX: 200 + dx, clientY: 300 + dy });
    };
    expect(sel()).toBe(1);
    deslizar(-80);            // esquerda → próxima
    expect(sel()).toBe(2);
    deslizar(-80);            // já é a última
    expect(sel()).toBe(2);
    deslizar(30);             // curto demais
    expect(sel()).toBe(2);
    deslizar(80, 90);         // mais vertical que horizontal
    expect(sel()).toBe(2);
    deslizar(80);             // direita → anterior
    expect(sel()).toBe(1);
    deslizar(80);
    deslizar(80);             // já é a primeira
    expect(sel()).toBe(0);
  });
});

describe('12 — humor', () => {
  const relatorio = {
    date: 'Tue Sep 08 2026', done: 4, total: 4, required: 4, heartsLost: 0, wasPerfect: true, perfectDays: 3, degenerated: false,
  } as never;
  it('cinco ícones próprios de 40 px em alvos de pelo menos 44, com rótulo e estado preservados', () => {
    renderWithCss(<DailyReportModal report={relatorio} onClose={() => {}} language="pt-BR" moodToday={4} onPickMood={() => {}} />);
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
    expect(botoes.map(b => b.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true', 'false']);
    expect(document.querySelector('[data-mood-label]')!.textContent).toBe('Bem');
  });
  it('sem humor escolhido não há rótulo; EN usa o rótulo em inglês', () => {
    renderWithCss(<DailyReportModal report={relatorio} onClose={() => {}} language="en-US" moodToday={null} onPickMood={() => {}} />);
    expect(document.querySelector('[data-mood-label]')).toBeNull();
    cleanup();
    renderWithCss(<DailyReportModal report={relatorio} onClose={() => {}} language="en-US" moodToday={5} onPickMood={() => {}} />);
    expect(document.querySelector('[data-mood-label]')!.textContent).toBe('Great');
  });
});
