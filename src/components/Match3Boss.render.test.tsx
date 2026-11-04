// @vitest-environment jsdom
/**
 * BOSS do Elemental Fusion — a TELA (03/11/2026). A regra é pura em `utils/match3Boss.test.ts`; aqui: a semente de boss abre o cartão
 * com as 3 regras (nome + explicação), o tabuleiro só aceita jogada depois do OK, a barra de regras fica visível e o boss é UM
 * inimigo rotulado "Boss" com o HP do jogador.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { Match3Game } from './Match3Game';
import { M3C_PLAYER_HP } from '../utils/match3Combat';
import { drawBossRules, isBossMatch, bossRuleInfo } from '../utils/match3Boss';

const BOSS_SEED = 74;

afterEach(() => cleanup());

describe('Elemental Fusion — BOSS', () => {
  it('a semente de teste é de boss', () => { expect(isBossMatch(BOSS_SEED)).toBe(true); });

  it('cartão com as 3 regras; jogo só começa depois do OK; barra de regras e o Boss com o HP do jogador', () => {
    renderWithCss(<Match3Game language="en-US" evolutionStage="rookie" onEarnPoints={() => {}} onExit={() => {}} seed={BOSS_SEED} rankSaveId="t" initialMode="pve" />);
    const dlg = screen.getByRole('dialog');
    const rules = drawBossRules(BOSS_SEED);
    expect(dlg.querySelectorAll('[data-m3-boss-rule-card]')).toHaveLength(3);
    for (const id of rules) expect(dlg.textContent).toContain(bossRuleInfo(id).en.name);
    // antes do OK, tocar no tabuleiro não seleciona nem joga
    const cell = document.querySelector('[data-m3-cell="0,0"]') as HTMLButtonElement;
    fireEvent.click(cell);
    const n = document.querySelector('[data-m3-cell="0,1"]') as HTMLButtonElement;
    fireEvent.click(n);
    expect(document.querySelector('[data-m3-turn]')?.getAttribute('data-m3-turn')).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelectorAll('[data-m3-boss-rule]')).toHaveLength(3);
    const inimigos = document.querySelectorAll('[data-m3-enemy]');
    expect(inimigos).toHaveLength(1);
    expect(inimigos[0].getAttribute('data-m3-hp')).toBe(String(M3C_PLAYER_HP));
    expect(inimigos[0].getAttribute('aria-label')).toContain('Boss');
    // o chip mostra a explicação da regra ao tocar
    fireEvent.click(document.querySelector(`[data-m3-boss-rule="${rules[0]}"]`) as HTMLButtonElement);
    expect(document.querySelector('[data-m3-boss-tip]')?.textContent).toBe(bossRuleInfo(rules[0]).en.line);
  });

  it('em PT o cartão sai em português', () => {
    renderWithCss(<Match3Game language="pt-BR" evolutionStage="rookie" onEarnPoints={() => {}} onExit={() => {}} seed={BOSS_SEED} rankSaveId="t" initialMode="pve" />);
    expect(screen.getByRole('dialog').textContent).toContain('Um Boss apareceu!');
  });
});
