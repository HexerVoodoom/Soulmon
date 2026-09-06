// @vitest-environment jsdom
/**
 * A falha de CREDENCIAL na página de Evolução (`spriteLibrary.SpriteFailKind`
 * `auth` / `identity`, introduzidos em 84209ded).
 *
 * O que este arquivo mede:
 *  - 401 e 403 param de ser mudos: a arte de reserva passa a vir acompanhada
 *    da frase que nomeia o gesto capaz de destravar;
 *  - as DUAS frases são diferentes, porque as AÇÕES são diferentes (entrar de
 *    novo × sincronizar o progresso) — achatar as duas num texto só devolveria
 *    o jogador ao mesmo silêncio;
 *  - nenhum dos dois é terminal: a frase do `RESERVA_FINAL` ("fica com o traço
 *    antigo") NÃO pode aparecer aqui — seria mentira;
 *  - a situação está em PALAVRAS, legível por leitor de tela (WCAG 1.4.1: cor
 *    e posição nunca são o único portador);
 *  - "Tentar de novo" continua valendo depois do cooldown;
 *  - PT e EN, sempre os dois.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import {
  SPRITE_MANUAL_COOLDOWN_MS,
  emptySpriteLibrary,
  recordFailure,
  type SpriteFailKind,
} from '../utils/spriteLibrary';
import { SPRITE_COPY } from '../utils/spriteCopy';
import type { CreatureStage } from '../utils/oracle';

const stage = (over: Partial<CreatureStage>): CreatureStage => ({
  stage: 'rookie',
  stageName: { pt: 'Rookie', en: 'Rookie' },
  name: 'Fangmon',
  description: { pt: 'x', en: 'x' },
  imagePrompt: 'p',
  imagePromptFallback: 'pf',
  ...over,
} as CreatureStage);

const base = {
  currentStageId: 'rookie',
  currentBranch: 'data' as const,
  virusPoints: 1, dataPoints: 3, vaccinePoints: 0,
  perfectDays: 2,
  gateDays: 10,
  stages: [stage({})],
  unlockedEvolutions: ['rookie'],
};

/** Falha registrada há tempo suficiente para o cooldown manual já ter vencido. */
const acervoCom = (kind: SpriteFailKind) =>
  recordFailure(emptySpriteLibrary(), 'rookie', kind, {
    at: Date.now() - SPRITE_MANUAL_COOLDOWN_MS - 1000,
  });

describe('falha de credencial ganha card, e um card por AÇÃO', () => {
  it.each([
    ['pt-BR' as const, 'auth' as const, SPRITE_COPY.authFail.pt],
    ['pt-BR' as const, 'identity' as const, SPRITE_COPY.identityFail.pt],
    ['en-US' as const, 'auth' as const, SPRITE_COPY.authFail.en],
    ['en-US' as const, 'identity' as const, SPRITE_COPY.identityFail.en],
  ])('%s / %s: a frase da ação aparece em palavras', (language, kind, frase) => {
    renderWithCss(<EvolutionPath {...base} language={language} spriteLibrary={acervoCom(kind)} />);
    const card = screen.getByTestId('sm-sprite-credencial');
    expect(card.textContent).toContain(frase);
  });

  it('as duas frases NÃO são a mesma: 401 pede login, 403 pede sincronizar', () => {
    const { unmount } = renderWithCss(<EvolutionPath {...base} language="pt-BR" spriteLibrary={acervoCom('auth')} />);
    const doAuth = screen.getByTestId('sm-sprite-credencial').textContent ?? '';
    unmount();
    renderWithCss(<EvolutionPath {...base} language="pt-BR" spriteLibrary={acervoCom('identity')} />);
    const doIdentity = screen.getByTestId('sm-sprite-credencial').textContent ?? '';
    expect(doAuth).not.toBe(doIdentity);
  });

  it('não é terminal: a frase do RESERVA_FINAL não aparece', () => {
    renderWithCss(<EvolutionPath {...base} language="pt-BR" spriteLibrary={acervoCom('auth')} />);
    expect(screen.queryByText(SPRITE_COPY.final.pt)).toBeNull();
    expect(screen.queryByText(SPRITE_COPY.kept.pt)).toBeNull();
  });

  it('o card é uma região anunciável e rotulada — leitor de tela não pega texto solto', () => {
    renderWithCss(<EvolutionPath {...base} language="pt-BR" spriteLibrary={acervoCom('identity')} />);
    const card = screen.getByTestId('sm-sprite-credencial');
    expect(card.getAttribute('role')).toBe('status');
  });

  it('"Tentar de novo" aparece depois do cooldown, e nos dois idiomas', () => {
    renderWithCss(
      <EvolutionPath {...base} language="pt-BR" spriteLibrary={acervoCom('auth')} onRetrySprite={() => {}} />,
    );
    expect(screen.getByRole('button', { name: SPRITE_COPY.retry.pt })).toBeTruthy();
  });

  it('en-US: o botão de retentar também sai traduzido', () => {
    renderWithCss(
      <EvolutionPath {...base} language="en-US" spriteLibrary={acervoCom('identity')} onRetrySprite={() => {}} />,
    );
    expect(screen.getByRole('button', { name: SPRITE_COPY.retry.en })).toBeTruthy();
  });

  it('falha comum (error) segue sem card de credencial: nada a dizer, o lote volta sozinho', () => {
    renderWithCss(<EvolutionPath {...base} language="pt-BR" spriteLibrary={acervoCom('error')} />);
    expect(screen.queryByTestId('sm-sprite-credencial')).toBeNull();
  });
});
