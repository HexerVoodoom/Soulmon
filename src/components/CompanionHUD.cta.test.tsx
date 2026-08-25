// @vitest-environment jsdom
/**
 * O BALÃO DE FALA NÃO PODE COMER O BOTÃO "EVOLUIR".
 *
 * O defeito, medido nas constantes de CSS e não estimado no olho: os dois são
 * `position:absolute` na MESMA caixa (`.sm2-device-stage`) e os dois ancoram no
 * rodapé. "Evoluir" ficava em `bottom:10` com `min-height:44px`
 * (`.sm-px-btn-sm`, index.css) → faixa [10, 54]. O balão ficava em `bottom:6`,
 * `left-0 right-0`, com uma linha de 14px/1,5 + 8px de padding dos dois lados
 * → faixa [6, ~45]. Cruzam em 35px de altura, na LARGURA INTEIRA do palco, e o
 * balão vinha em `zIndex:45` contra 30, com `pointer-events:auto`.
 *
 * Resultado no jogo: a fala idle dispara sozinha a cada 3 minutos e come o
 * clique do ÚNICO CTA que faz o jogo avançar, por até 5 segundos, sem que nada
 * pareça errado na tela.
 *
 * jsdom não faz layout, então este guard mede o que DECIDE o layout: o `bottom`
 * inline de cada peça e o `pointer-events` da faixa. É o suficiente para
 * quebrar se alguém devolver as duas âncoras para a mesma faixa.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';

const base = {
  companionMood: 'idle' as const,
  energyLevel: 3,
  message: 'Oi!',
  currentStage: 'rookie',
  evolutionStage: 'rookie',
  healthPoints: 3,
  maxHealthPoints: 3,
  dominantBranch: 'balanced' as const,
  currentXP: 0,
  nextLevelXP: 10,
  digivolutionSegments: 1,
  digivolutionSegmentsNeeded: 3,
  useAI: false,
  language: 'pt-BR' as const,
  energyPoints: 4,
  maxEnergyPoints: 4,
};

/** Altura mínima do `PixelButton size="sm"` — `.sm-px-btn-sm` no index.css. */
const EVOLVE_H = 44;

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); });

/** A faixa de largura total que carrega o balão (o pai da caixa de fala). */
function faixaDoBalao(texto: HTMLElement): HTMLElement {
  // <p> → caixa da fala → faixa
  const caixa = texto.parentElement!;
  return caixa.parentElement as HTMLElement;
}

describe('CompanionHUD — o balão de fala e o CTA de evolução', () => {
  it('BLOQUEADOR: com "Evoluir" na tela, o balão sobe ACIMA dele', () => {
    renderWithCss(<CompanionHUD {...base} canEvolve onEvolveRequest={() => {}} />);
    fireEvent.click(screen.getByAltText('rookie'));

    const btn = screen.getByRole('button', { name: 'Evoluir' });
    const faixa = faixaDoBalao(screen.getByText(/Cheio de energia!|Pronto para tudo!|Totalmente carregado!/));

    const btnBottom = parseFloat(btn.style.bottom);
    const balaoBottom = parseFloat(faixa.style.bottom);
    expect(
      balaoBottom,
      `o balão começa em ${balaoBottom}px e o botão vai até ${btnBottom + EVOLVE_H}px — sobreposição`,
    ).toBeGreaterThanOrEqual(btnBottom + EVOLVE_H);
  });

  it('sem CTA na tela o balão volta para o rodapé (não fica flutuando alto)', () => {
    renderWithCss(<CompanionHUD {...base} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const faixa = faixaDoBalao(screen.getByText(/Cheio de energia!|Pronto para tudo!|Totalmente carregado!/));
    expect(parseFloat(faixa.style.bottom)).toBeLessThan(EVOLVE_H);
  });

  it('a faixa de largura total do balão não intercepta toque; a caixa de fala sim', () => {
    renderWithCss(<CompanionHUD {...base} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const texto = screen.getByText(/Cheio de energia!|Pronto para tudo!|Totalmente carregado!/);
    const faixa = faixaDoBalao(texto);
    // A faixa cobre o palco inteiro na horizontal: se ela capturar ponteiro,
    // qualquer controle embaixo dela morre — foi assim que o bug aconteceu.
    expect(faixa.style.pointerEvents).toBe('none');
    expect(texto.parentElement!.className).toContain('pointer-events-auto');
  });

  it('o clique na caixa de fala continua dispensando o balão', () => {
    renderWithCss(<CompanionHUD {...base} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const texto = screen.getByText(/Cheio de energia!|Pronto para tudo!|Totalmente carregado!/);
    fireEvent.click(texto.parentElement!);
    expect(screen.queryByText(/Cheio de energia!|Pronto para tudo!|Totalmente carregado!/)).toBeNull();
  });

  it('o "Evoluir" continua clicável com o balão aberto', () => {
    const onEvolveRequest = vi.fn();
    renderWithCss(<CompanionHUD {...base} canEvolve onEvolveRequest={onEvolveRequest} />);
    fireEvent.click(screen.getByAltText('rookie'));
    fireEvent.click(screen.getByRole('button', { name: 'Evoluir' }));
    expect(onEvolveRequest).toHaveBeenCalledTimes(1);
  });
});

describe('CompanionHUD — ALIMENTAR é controle de primeira classe', () => {
  it('o deck tem o botão Alimentar (PT/EN) e ele abre a escolha de comida', () => {
    const en = renderWithCss(<CompanionHUD {...base} language="en-US" foodInventory={{ '🍎': 2 }} onFeed={() => {}} />);
    expect(screen.getByRole('button', { name: 'Feed' })).toBeTruthy();
    en.unmount();

    renderWithCss(<CompanionHUD {...base} foodInventory={{ '🍎': 2 }} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Alimentar' }));
    expect(screen.getByRole('dialog', { name: 'Alimentar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Apple × 2' })).toBeTruthy();
  });

  it('escolher a comida chama `onFeed` — a REGRA continua no App, não aqui', () => {
    const onFeed = vi.fn();
    renderWithCss(<CompanionHUD {...base} foodInventory={{ '🍎': 2 }} onFeed={onFeed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Alimentar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Apple × 2' }));
    expect(onFeed).toHaveBeenCalledWith('🍎');
    // e a folha fecha sozinha: escolher comida é uma ação, não um menu preso
    expect(screen.queryByRole('dialog', { name: 'Alimentar' })).toBeNull();
  });

  it('consumível especial NÃO aparece em Alimentar (ele se usa na pastinha)', () => {
    renderWithCss(<CompanionHUD {...base} foodInventory={{ '🍎': 1, '💗': 3, '🌀': 1 }} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Alimentar' }));
    const folha = screen.getByRole('dialog', { name: 'Alimentar' });
    // A identidade do item deixou de ser texto (a arte agora é <img>, ver
    // utils/itemArt.ts), então a afirmação certa é pelo NOME ACESSÍVEL do
    // botão — que é também o que o leitor de tela anuncia. Conferir pelo
    // textContent voltaria a passar/falhar ao sabor de como a arte é rendida.
    expect(within(folha).queryByRole('button', { name: /💗|Coração|Heart/ })).toBeNull();
    expect(within(folha).queryByRole('button', { name: /🌀|Glitchtama/ })).toBeNull();
    expect(within(folha).getByRole('button', { name: 'Apple × 1' })).toBeTruthy();
  });

  it('ESTADO VAZIO: sem comida a folha explica como conseguir, não some', () => {
    renderWithCss(<CompanionHUD {...base} foodInventory={{}} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Alimentar' }));
    expect(screen.getByText(/Conclua uma tarefa ou hábito/)).toBeTruthy();
  });
});
