// @vitest-environment jsdom
/**
 * A SCANLINE DE 400 ms da sintonia do Visor
 * (`spec-geracao-incremental.md` §2.1, §2.3.1 e §6).
 *
 * ## Por que este arquivo existe, e por que a scanline não é a scanline "de CRT"
 *
 * O `Viewport` diz, desde a fundação, que NÃO tem scanline "por padrão":
 * scanline permanente sobre sprite de 32 px come metade do desenho. Isso é uma
 * decisão de LEGIBILIDADE, e continua de pé. A spec, no entanto, pede scanline
 * em dois lugares — e nos dois ela é TRANSIÇÃO, ao lado do fade de 120 ms,
 * dentro de uma sintonia de ~1,2 s. As duas coisas só se contradizem se a
 * leitura for "overlay permanente". A leitura certa, e a que este arquivo
 * trava, é: **uma varredura que passa UMA VEZ na troca do sprite e some**.
 * Enquanto ela passa, o sprite continua inteiro embaixo — 400 ms de faixa
 * viajando não é meio desenho comido.
 *
 * ## O que é medido aqui, e não afirmado
 *
 * Render de verdade (jsdom + `renderWithCss`), não guard textual:
 *  - a varredura NÃO existe na primeira montagem (abrir a página não é
 *    sintonizar) e passa a existir quando o sprite TROCA;
 *  - ela vive dentro da tela do visor e é `pointer-events: none` — não pode
 *    roubar o gesto de esfregar o pet, exatamente como o `.sm2-viewport-glass`;
 *  - ela SOME sozinha depois dos 400 ms: uma vez, não em loop;
 *  - com `prefers-reduced-motion: reduce` ela **não toca** — nem chega a
 *    entrar no DOM, pelo mesmo motivo que a respiração do anel é cortada em JS
 *    (`Viewport.tsx:70-93`): `animation-duration: 0.01ms` não é "desligado".
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithCss, computed } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import { emptySpriteLibrary, recordSprite, tuneVisor } from '../utils/spriteLibrary';
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
  currentBranch: 'harmony' as const,
  powerPoints: 1, harmonyPoints: 3, benevolencePoints: 0,
  perfectDays: 2,
  gateDays: 10,
  stages: [stage({})],
  unlockedEvolutions: ['rookie'],
  language: 'pt-BR' as const,
};

const own = { url: 'https://cdn/rookie.png', formId: 'rookie', at: 1 };

/** Acervo com sprite próprio chegado, ainda NA RESERVA (não sintonizado). */
const naReserva = () => recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: 'd' });
/** O mesmo acervo, já sintonizado — o visor passa a mostrar o sprite próprio. */
const sintonizado = () => tuneVisor(naReserva(), 'rookie');

/**
 * `matchMedia` não existe em jsdom. Sem este duplo o hook devolve `false` e o
 * caso de movimento reduzido passaria pelo motivo errado — que é a forma mais
 * comum de guard de acessibilidade morto.
 */
function fixarMovimentoReduzido(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

const varredura = () => document.querySelector('.sm2-viewport-screen .sm-visor-scan');

beforeEach(() => { vi.useFakeTimers(); fixarMovimentoReduzido(false); });
afterEach(() => { vi.useRealTimers(); });

describe('a sintonia varre o Visor uma vez, e só na troca', () => {
  it('abrir a página não é sintonizar: na primeira montagem não há varredura', () => {
    renderWithCss(<EvolutionPath {...base} spriteLibrary={naReserva()} onTuneVisor={() => {}} />);
    expect(
      varredura(),
      'varrer a tela toda vez que a página monta transforma transição em tique',
    ).toBeNull();
  });

  it('quando o sprite TROCA, a varredura entra na tela do visor', () => {
    const { rerender } = renderWithCss(
      <EvolutionPath {...base} spriteLibrary={naReserva()} onTuneVisor={() => {}} />,
    );
    act(() => {
      rerender(
        <EvolutionPath {...base} spriteLibrary={sintonizado()} onRevertVisor={() => {}} />,
      );
    });
    expect(varredura(), 'é a superfície da sintonia — sem ela a troca é muda').toBeTruthy();
  });

  it('não rouba o gesto de esfregar o pet: `pointer-events: none`, como o vidro', () => {
    const { rerender } = renderWithCss(
      <EvolutionPath {...base} spriteLibrary={naReserva()} onTuneVisor={() => {}} />,
    );
    act(() => {
      rerender(<EvolutionPath {...base} spriteLibrary={sintonizado()} onRevertVisor={() => {}} />);
    });
    expect(computed(varredura()!, 'pointer-events')).toBe('none');
  });

  it('UMA VEZ, não em loop: passados os 400 ms ela some do DOM', () => {
    const { rerender } = renderWithCss(
      <EvolutionPath {...base} spriteLibrary={naReserva()} onTuneVisor={() => {}} />,
    );
    act(() => {
      rerender(<EvolutionPath {...base} spriteLibrary={sintonizado()} onRevertVisor={() => {}} />);
    });
    expect(varredura()).toBeTruthy();
    act(() => { vi.advanceTimersByTime(399); });
    expect(varredura(), 'sumir antes da hora corta a própria transição').toBeTruthy();
    act(() => { vi.advanceTimersByTime(2); });
    expect(varredura(), 'overlay que fica é a scanline permanente que o visor recusa').toBeNull();
  });
});

describe('movimento reduzido (§6): a scanline NÃO TOCA', () => {
  it('com `prefers-reduced-motion: reduce` a troca acontece sem varredura nenhuma', () => {
    fixarMovimentoReduzido(true);
    const { rerender } = renderWithCss(
      <EvolutionPath {...base} spriteLibrary={naReserva()} onTuneVisor={() => {}} />,
    );
    act(() => {
      rerender(<EvolutionPath {...base} spriteLibrary={sintonizado()} onRevertVisor={() => {}} />);
    });
    expect(varredura(), 'corte em JS, não `0.01ms` — 0.01ms ainda é animação').toBeNull();
    // A troca em si CONTINUA acontecendo: o que morre é a transição.
    const img = document.querySelector('.sm2-viewport-screen img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(own.url);
  });
});
