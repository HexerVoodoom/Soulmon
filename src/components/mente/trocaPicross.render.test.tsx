// @vitest-environment jsdom
/**
 * TROCA DE REGRA e PICROSS DA MALHA montados de verdade: o jogo roda até o fim
 * pela interface e paga UMA vez pelo funil `onEarnPoints`. E as regras de copy
 * do contrato (`mente/types.ts`): mudo, sem "errou", sem promessa cognitiva.
 */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { TrocaGame } from './TrocaGame';
import { PicrossGame } from './PicrossGame';
import { TROCA_DECK_SIZE, sideFor, trocaBits, type TrocaRule } from '../../utils/mente/troca';
import { dailyPattern, PICROSS_DAILY_BITS, PICROSS_EXTRA_BITS } from '../../utils/mente/picross';
import { PICROSS_PATTERNS } from '../../utils/mente/picrossPatterns';

const base = { evolutionStage: 'rookie', onExit: () => {} };

function sortCurrent(right: boolean) {
  const card = document.querySelector('[data-troca-card]') as HTMLElement;
  const rule = document.querySelector('[data-troca-rule]')!.getAttribute('data-troca-rule') as TrocaRule;
  const c = { forma: card.dataset.forma as 'young' | 'grown', lugar: card.dataset.lugar as 'sky' | 'cave' };
  const side = sideFor(c, rule);
  const pick = right ? side : (side === 'left' ? 'right' : 'left');
  fireEvent.click(document.querySelector(`[data-troca-side="${pick}"]`)!);
}

describe('TrocaGame', () => {
  it('separar as 30 cartas certo termina a rodada e paga uma vez', () => {
    const onEarn = vi.fn();
    renderWithCss(<TrocaGame {...base} language="en-US" onEarnPoints={onEarn} />);
    expect(screen.getByText(/Rule:/)).toBeTruthy();
    for (let i = 0; i < TROCA_DECK_SIZE; i++) sortCurrent(true);
    expect(screen.getByText(`You sorted ${TROCA_DECK_SIZE}`)).toBeTruthy();
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn).toHaveBeenCalledWith(trocaBits(TROCA_DECK_SIZE));
  });

  it('a regra troca durante a rodada e a pista muda', () => {
    renderWithCss(<TrocaGame {...base} language="pt-BR" onEarnPoints={() => {}} />);
    const seen = new Set<string>();
    for (let i = 0; i < 12; i++) {
      seen.add(document.querySelector('[data-troca-rule]')!.getAttribute('data-troca-rule')!);
      sortCurrent(true);
    }
    expect(seen.size).toBe(2);
  });

  it('separar errado não diz "errou": a carta volta e a próxima vem', async () => {
    renderWithCss(<TrocaGame {...base} language="pt-BR" onEarnPoints={() => {}} />);
    const first = document.querySelector('[data-troca-card]')!.getAttribute('data-troca-card');
    sortCurrent(false);
    expect(document.body.textContent).not.toMatch(/errou|errado|wrong/i);
    await waitFor(() => {
      expect(document.querySelector('[data-troca-card]')!.getAttribute('data-troca-card')).not.toBe(first);
    });
  });

  it('botões de lado têm alvo ≥ 44', () => {
    renderWithCss(<TrocaGame {...base} language="en-US" onEarnPoints={() => {}} />);
    for (const side of ['left', 'right']) {
      const b = document.querySelector(`[data-troca-side="${side}"]`) as HTMLElement;
      expect(parseInt(b.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    }
  });
});

function solve(rows: readonly string[]) {
  rows.forEach((row, r) => Array.from(row).forEach((ch, c) => {
    if (ch === '#') fireEvent.click(document.querySelector(`[data-cell="${r}-${c}"]`)!);
  }));
}

describe('PicrossGame', () => {
  const todayKey = '2026-09-30';

  it('resolver o desenho do dia revela o nome e paga 10 uma vez', () => {
    const onEarn = vi.fn();
    renderWithCss(<PicrossGame {...base} language="en-US" onEarnPoints={onEarn} todayKey={todayKey} />);
    const p = dailyPattern(todayKey);
    solve(p.rows);
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn).toHaveBeenCalledWith(PICROSS_DAILY_BITS);
    expect(screen.getByRole('status').textContent).toBe(`You revealed: ${p.nameEn}`);
  });

  it('cada casa diz linha, coluna e estado; X e desfazer funcionam por botão', () => {
    renderWithCss(<PicrossGame {...base} language="pt-BR" onEarnPoints={() => {}} todayKey={todayKey} />);
    const cell = () => document.querySelector('[data-cell="0-0"]') as HTMLElement;
    expect(cell().getAttribute('aria-label')).toMatch(/^Linha 1, coluna 1: vazia/);
    fireEvent.click(document.querySelector('[data-picross-mode="cross"]')!);
    fireEvent.click(cell());
    expect(cell().getAttribute('aria-label')).toMatch(/marcada com X/);
    fireEvent.click(document.querySelector('[data-picross-undo]')!);
    expect(cell().getAttribute('aria-label')).toMatch(/vazia/);
  });

  it('um desenho de "Outros" paga 3', () => {
    const onEarn = vi.fn();
    renderWithCss(<PicrossGame {...base} language="en-US" onEarnPoints={onEarn} todayKey={todayKey} />);
    const other = PICROSS_PATTERNS.find(p => p.id !== dailyPattern(todayKey).id && p.rows.length === 5)!;
    fireEvent.click(screen.getAllByText('More')[0]);
    fireEvent.click(document.querySelector(`[data-picross-pick="${other.id}"]`)!);
    solve(other.rows);
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn).toHaveBeenCalledWith(PICROSS_EXTRA_BITS);
  });

  it('casas: 44 em 5×5/7×7, ≥30 em 10×10', () => {
    for (const size of [5, 7, 10]) {
      const p = PICROSS_PATTERNS.find(x => x.rows.length === size)!;
      const { unmount } = renderWithCss(<PicrossGame {...base} language="en-US" onEarnPoints={() => {}} todayKey={todayKey} />);
      fireEvent.click(screen.getAllByText('More')[0]);
      fireEvent.click(document.querySelector(`[data-picross-pick="${p.id}"]`)!);
      const w = parseInt((document.querySelector('[data-cell="0-0"]') as HTMLElement).style.width, 10);
      expect(w).toBeGreaterThanOrEqual(size <= 7 ? 44 : 30);
      expect(w * size).toBeLessThanOrEqual(348);
      unmount();
    }
  });
});

describe('copy e som', () => {
  const files = [
    'src/components/mente/TrocaGame.tsx',
    'src/components/mente/PicrossGame.tsx',
    'src/utils/mente/troca.ts',
    'src/utils/mente/picross.ts',
    'src/utils/mente/picrossPatterns.ts',
  ].map(f => [f, readFileSync(resolve(process.cwd(), f), 'utf8')] as const);

  it.each(files)('%s nasce mudo e sem vocabulário vetado', (_f, src) => {
    expect(src).not.toMatch(/utils\/sounds/);
    expect(src).not.toMatch(/\b(tamer|domador|treinador|digievolu|mundo digital|Weave|V[íi]rus|Vacina|Glitchtama)/i);
    expect(src).not.toMatch(/treina o c[ée]rebro|brain|melhora a mem[óo]ria/i);
    expect(src).not.toMatch(/faltam\s/i);
  });
});
