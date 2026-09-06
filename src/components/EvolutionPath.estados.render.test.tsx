// @vitest-environment jsdom
/**
 * OS ESTADOS DE CARD da página de Evolução (`spec-geracao-incremental.md` §2.2),
 * montados de verdade.
 *
 * O que este arquivo mede, e não afirma:
 *  - `GERANDO`, `OFFLINE`, `RESERVA`, `RESERVA_VESPERA`, `RESERVA_FINAL` e
 *    `DISTANTE` existem em RUNTIME — até aqui `generating` e `online` eram
 *    literais (`[]` e `true`) dentro do componente, e três desses estados eram
 *    inalcançáveis (o mesmo defeito X-3 que o selo `NOVO` teve);
 *  - `RESERVA_FINAL` (409/402) **não tem botão** — botão que sempre falha é
 *    pior que botão ausente;
 *  - o "Tentar de novo" da véspera tem alvo ≥ 44 px;
 *  - o anúncio de `GERANDO` é UM por lote, no container, nunca um por card;
 *  - PT e EN, sempre os dois.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import { emptySpriteLibrary, recordFailure, type SpriteLibrary } from '../utils/spriteLibrary';
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

/** rookie (atual) → champion-data → ultimate-data, o galho `data`. */
const stages = [
  stage({}),
  stage({ stage: 'champion', branch: 'harmonia', name: 'Champ', stageName: { pt: 'Champion', en: 'Champion' } }),
  stage({ stage: 'perfeito', branch: 'harmonia', name: 'Ult', stageName: { pt: 'Ultimate', en: 'Ultimate' } }),
];

const base = {
  currentStageId: 'rookie',
  currentBranch: 'data' as const,
  virusPoints: 1, dataPoints: 3, vaccinePoints: 0,
  perfectDays: 2,
  gateDays: 10,
  stages,
  unlockedEvolutions: ['rookie'],
  language: 'pt-BR' as const,
};

/** Uma falha NÃO terminal na forma atual, com a última tentativa velha o
 *  bastante para o cooldown de 60 s já ter passado. */
const falhou = (kind: Parameters<typeof recordFailure>[2] = 'error'): SpriteLibrary =>
  recordFailure(emptySpriteLibrary(), 'rookie', kind, { at: 0 });

describe('§2.2 — cada forma diz em que estado a arte dela está', () => {
  it('GERANDO: a frase do Oráculo aparece no nó, e o anúncio é UM só no container', () => {
    renderWithCss(<EvolutionPath {...base} generatingSprites={['rookie']} />);
    expect(screen.getByTestId('sm-estado-rookie').textContent)
      .toContain('O Oráculo está desenhando…');
    // Um anúncio por LOTE (§6): a região viva é uma, e é do container.
    const anuncio = screen.getByTestId('sm-gerando-anuncio');
    expect(anuncio.getAttribute('aria-live')).toBe('polite');
    expect(anuncio.textContent).toBe('O Oráculo está desenhando…');
  });

  it('sem lote vivo, a região do anúncio fica MUDA (e continua no DOM)', () => {
    renderWithCss(<EvolutionPath {...base} />);
    expect(screen.getByTestId('sm-gerando-anuncio').textContent).toBe('');
  });

  it('RESERVA_FINAL (teto da forma, 409): o card diz por quê e NÃO tem botão', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'rookie', 'form-cap', { at: 0 });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={lib} onRetrySprite={() => {}} />);
    expect(screen.getByTestId('sm-sprite-final').textContent)
      .toBe('O Oráculo não conseguiu desenhar esta forma. Ela fica com o traço antigo.');
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
  });

  it('RESERVA_FINAL também no teto da CONTA (402) — e 402 nunca vira erro na tela', () => {
    const lib = recordFailure(emptySpriteLibrary(), 'rookie', 'lifetime-cap', { at: 0 });
    renderWithCss(<EvolutionPath {...base} language="en-US" spriteLibrary={lib} onRetrySprite={() => {}} />);
    expect(screen.getByTestId('sm-sprite-final').textContent)
      .toBe("The Oracle couldn't draw this form. It keeps the old look.");
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('RESERVA (longe da evolução): "Tentar de novo" é link discreto, com 44 px de alvo', () => {
    renderWithCss(<EvolutionPath {...base} spriteLibrary={falhou()} onRetrySprite={() => {}} />);
    const link = screen.getByTestId('sm-estado-rookie');
    expect(link.textContent).toBe('Tentar de novo');
    expect(parseFloat(getComputedStyle(link).minHeight)).toBeGreaterThanOrEqual(44);
  });

  it('RESERVA_VESPERA (evolução iminente): a frase aparece e o botão vira texto real', () => {
    renderWithCss(
      <EvolutionPath
        {...base}
        // `required` do rookie é 4 → `faltam === 1` é a véspera. O gatilho lê
        // `required`, nunca `daysToEvolve` (§3.1).
        perfectDays={3}
        spriteLibrary={falhou()}
        onRetrySprite={() => {}}
      />,
    );
    expect(screen.getByTestId('sm-estado-rookie').textContent)
      .toContain('Esta forma ficou com o traço antigo.');
    const botão = screen.getByRole('button', { name: 'Tentar de novo' });
    expect(parseFloat(getComputedStyle(botão).minHeight)).toBeGreaterThanOrEqual(44);
  });

  it('sem retentativa possível (cooldown de 60 s correndo), não há botão nenhum', () => {
    const recente = recordFailure(emptySpriteLibrary(), 'rookie', 'error', { at: Date.now() });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={recente} onRetrySprite={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
  });

  it('forma futura sem ocasião nenhuma NÃO ganha botão de gerar — DISTANTE não é falha', () => {
    renderWithCss(<EvolutionPath {...base} onRetrySprite={() => {}} />);
    // Nenhum nó da árvore oferece "Tentar de novo": a UI não pode reverter a
    // decisão do dono (geração incremental) oferecendo a árvore num toque.
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull();
    expect(screen.queryByTestId('sm-estado-champion-data')).toBeNull();
  });

  it('OFFLINE: sem rede, a forma sem sprite diz que volta quando você voltar', () => {
    // `useIsOnline` é o dono da leitura (o mesmo do selo "SEM SINAL"); aqui só
    // se muda a fonte que ele lê.
    const original = Object.getOwnPropertyDescriptor(window.navigator, 'onLine');
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    try {
      renderWithCss(<EvolutionPath {...base} spriteLibrary={falhou('offline')} />);
      expect(screen.getByTestId('sm-estado-rookie').textContent)
        .toBe('Sem conexão — volta quando você voltar.');
    } finally {
      if (original) Object.defineProperty(window.navigator, 'onLine', original);
    }
  });

  it('empate nos atributos: a página diz que o ritmo ainda pode decidir', () => {
    const { unmount } = renderWithCss(
      <EvolutionPath {...base} virusPoints={3} dataPoints={3} vaccinePoints={0} />,
    );
    expect(screen.getByTestId('sm-sprite-empate').textContent).toBe('Seu ritmo ainda pode decidir.');
    unmount();
    renderWithCss(
      <EvolutionPath {...base} language="en-US" virusPoints={3} dataPoints={3} vaccinePoints={0} />,
    );
    expect(screen.getByTestId('sm-sprite-empate').textContent).toBe('Your rhythm can still decide.');
  });
});
