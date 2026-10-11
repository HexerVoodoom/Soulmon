// @vitest-environment jsdom
/**
 * O BALÃO DE FALA NÃO PODE COMER O BOTÃO "EVOLUIR".
 *
 * Histórico do defeito, medido nas constantes de CSS e não estimado no olho:
 * até 27/08/2026 os dois eram `position:absolute` na MESMA caixa
 * (`.sm2-device-stage`) e os dois ancoravam no RODAPÉ. "Evoluir" ficava em
 * `bottom:10` com `min-height:44px` (`.sm-px-btn-sm`, index.css) → faixa
 * [10, 54]. O balão ficava em `bottom:6`, `left-0 right-0`, com uma linha de
 * 14px/1,5 + 8px de padding dos dois lados → faixa [6, ~45]. Cruzam em 35px
 * de altura, na LARGURA INTEIRA do palco, e o balão vinha em `zIndex:45`
 * contra 30, com `pointer-events:auto`.
 *
 * Resultado no jogo: a fala idle dispara sozinha a cada 3 minutos e comia o
 * clique do ÚNICO CTA que faz o jogo avançar, por até 5 segundos, sem que nada
 * parecesse errado na tela.
 *
 * O CONSERTO DEFINITIVO (27/08/2026, pedido do dono): o balão saiu do rodapé
 * de vez e foi ANCORADO NO TOPO da janela do palco (`top: BUBBLE_GAP`, fixo,
 * nunca mais `bottom`). "Evoluir" continua no rodapé. As duas faixas não
 * podem mais se cruzar por CONSTRUÇÃO — não porque uma "sobe" quando a outra
 * aparece, mas porque vivem em pontas opostas da caixa sempre.
 *
 * jsdom não faz layout, então este guard mede o que DECIDE o layout: o
 * `top`/`bottom` inline de cada peça e o `pointer-events` da faixa.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';
import { PET_VOICE_LINES } from '../utils/petVoice';

/** A fala idle vem de `PET_VOICE_LINES.energized` — nunca literal copiado aqui
 *  (22/09/2026, QA R2: as frases saíram do HUD para o dono único da voz). */
const FALA_ENERGIZED = new RegExp(
  PET_VOICE_LINES.energized.pt.map(l => l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
);

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
  useAI: false,
  language: 'pt-BR' as const,
  energyPoints: 4,
  maxEnergyPoints: 4,
};

/** Gêmeo de `BUBBLE_GAP` no `CompanionHUD.tsx` (não exportado). */
const BUBBLE_GAP = 6;
/** Gêmeo de `BUBBLE_BOTTOM`. */
const BUBBLE_BOTTOM = 100;

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
  it('BLOQUEADOR: com "Evoluir" no ALTO, o balão fica na BASE da caixa — as faixas não se cruzam', () => {
    renderWithCss(<CompanionHUD {...base} canEvolve onEvolveRequest={() => {}} />);
    fireEvent.click(screen.getByAltText('rookie'));

    const btn = screen.getByRole('button', { name: 'Evoluir' });
    const faixa = faixaDoBalao(screen.getByText(FALA_ENERGIZED));

    // B3 (02/10/2026): "Evoluir" é CENTRALIZADO no ALTO da área do pet
    // (`top`, `left: 50%`). 08/10/2026 (pedido do dono): o balão foi para a
    // BASE da caixa (`bottom`), então as duas faixas não se cruzam por
    // construção: uma ancora no topo, a outra no rodapé.
    expect(btn.style.left).toBe('50%');
    expect(btn.style.bottom).toBe('');
    expect(faixa.style.top).toBe('');
    expect(parseFloat(faixa.style.bottom)).toBeGreaterThanOrEqual(BUBBLE_GAP);
    expect(parseFloat(btn.style.top)).toBeGreaterThanOrEqual(0);
    // alvo ≥ 44 e rótulo acessível
    expect(parseFloat(btn.style.minHeight)).toBeGreaterThanOrEqual(44);
    expect(btn.getAttribute('aria-label')).toBe('Evoluir');
  });

  it('sem CTA na tela o balão fica na MESMA base (a posição não depende do botão)', () => {
    renderWithCss(<CompanionHUD {...base} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const faixa = faixaDoBalao(screen.getByText(FALA_ENERGIZED));
    expect(faixa.style.top).toBe('');
    expect(faixa.style.bottom).toBe(`${BUBBLE_BOTTOM}px`);
  });

  it('a caixa de fala tem 30% de opacidade no fundo e o texto a 100%', () => {
    renderWithCss(<CompanionHUD {...base} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const texto = screen.getByText(FALA_ENERGIZED);
    expect(texto.parentElement!.style.background).toContain('30%');
    expect(texto.style.opacity).toBe('');
  });

  it('a faixa de largura total do balão não intercepta toque; a caixa de fala sim', () => {
    renderWithCss(<CompanionHUD {...base} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const texto = screen.getByText(FALA_ENERGIZED);
    const faixa = faixaDoBalao(texto);
    // A faixa cobre o palco inteiro na horizontal: se ela capturar ponteiro,
    // qualquer controle embaixo dela morre — foi assim que o bug aconteceu.
    expect(faixa.style.pointerEvents).toBe('none');
    expect(texto.parentElement!.className).toContain('pointer-events-auto');
  });

  it('o clique na caixa de fala continua dispensando o balão', () => {
    renderWithCss(<CompanionHUD {...base} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const texto = screen.getByText(FALA_ENERGIZED);
    fireEvent.click(texto.parentElement!);
    expect(screen.queryByText(FALA_ENERGIZED)).toBeNull();
  });

  it('o "Evoluir" continua clicável com o balão aberto', () => {
    const onEvolveRequest = vi.fn();
    renderWithCss(<CompanionHUD {...base} canEvolve onEvolveRequest={onEvolveRequest} />);
    fireEvent.click(screen.getByAltText('rookie'));
    fireEvent.click(screen.getByRole('button', { name: 'Evoluir' }));
    expect(onEvolveRequest).toHaveBeenCalledTimes(1);
  });
});

/* minimal-ui F2 (Home B): o deck de cinco células saiu. A comida continua sendo
   controle de PRIMEIRA CLASSE — mora na MOCHILA, que é um dos três cuidados da
   faixa —, e cada guarda abaixo é o mesmo de antes, sobre a superfície nova. */
describe('CompanionHUD — a MOCHILA é controle de primeira classe', () => {
  it('a faixa tem o botão Mochila (PT/EN) e ele abre a mochila com a comida', () => {
    const en = renderWithCss(<CompanionHUD {...base} language="en-US" foodInventory={{ '🍎': 2 }} onFeed={() => {}} />);
    expect(screen.getByRole('button', { name: 'Backpack' })).toBeTruthy();
    en.unmount();

    renderWithCss(<CompanionHUD {...base} foodInventory={{ '🍎': 2 }} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mochila' }));
    expect(screen.getByRole('dialog', { name: 'Mochila' })).toBeTruthy();
    // PL-5 (21/09/2026): o nome acessível segue o idioma.
    expect(screen.getByRole('button', { name: 'Maçã × 2' })).toBeTruthy();
  });

  it('PL-5: o nome do alimento na mochila é o MESMO da pastinha, por idioma (getFoodName)', () => {
    const en = renderWithCss(<CompanionHUD {...base} language="en-US" foodInventory={{ '🍎': 2 }} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Backpack' }));
    expect(screen.getByRole('button', { name: 'Apple × 2' })).toBeTruthy();
    en.unmount();
  });

  it('usar a comida chama `onFeed` — a REGRA continua no App, não aqui', () => {
    const onFeed = vi.fn();
    renderWithCss(<CompanionHUD {...base} foodInventory={{ '🍎': 2 }} onFeed={onFeed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mochila' }));
    // Tocar no item SÓ seleciona (decisão 3 do dono: item se usa arrastando).
    fireEvent.click(screen.getByRole('button', { name: 'Maçã × 2' }));
    expect(onFeed).not.toHaveBeenCalled();
    // A alternativa acessível: o botão "Usar" do item selecionado.
    fireEvent.click(screen.getByRole('button', { name: 'Usar Maçã' }));
    expect(onFeed).toHaveBeenCalledWith('🍎');
    // e a folha fecha sozinha: usar é uma ação, não um menu preso
    expect(screen.queryByRole('dialog', { name: 'Mochila' })).toBeNull();
  });

  it('consumível especial NÃO se mistura com a comida: coraçãozinho e Glitchtama moram em Especiais', () => {
    renderWithCss(<CompanionHUD {...base} foodInventory={{ '🍎': 1, '💗': 3, '🌀': 1 }} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mochila' }));
    const folha = screen.getByRole('dialog', { name: 'Mochila' });
    // Pelo NOME ACESSÍVEL do botão (a arte é <img>, utils/itemArt.ts).
    expect(within(folha).queryByRole('button', { name: /Coração|Heart/ })).toBeNull();
    expect(within(folha).queryByRole('button', { name: /Glitchtama/ })).toBeNull();
    expect(within(folha).getByRole('button', { name: 'Maçã × 1' })).toBeTruthy();
    fireEvent.click(within(folha).getByRole('tab', { name: 'Especiais' }));
    expect(within(folha).getByRole('button', { name: /Glitchtama × 1/ })).toBeTruthy();
    expect(within(folha).queryByRole('button', { name: 'Maçã × 1' })).toBeNull();
  });

  it('ESTADO VAZIO: sem comida a mochila explica como conseguir, não some', () => {
    renderWithCss(<CompanionHUD {...base} foodInventory={{}} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mochila' }));
    expect(screen.getByText(/Complete tarefas pra ganhar comida/)).toBeTruthy();
  });

  it('os três cuidados da faixa: mochila, dormir/acordar e banho — e nada de deck', () => {
    const onSleep = vi.fn();
    const onShower = vi.fn();
    const { container, rerender } = renderWithCss(<CompanionHUD {...base} onSleep={onSleep} onShower={onShower} />);
    const grupo = screen.getByRole('group', { name: 'Cuidar do pet' });
    expect(within(grupo).getAllByRole('button').map(b => b.getAttribute('aria-label')))
      .toEqual(['Mochila', 'Dormir', 'Banho']);
    expect(container.querySelector('.sm2-deck')).toBeNull();
    fireEvent.click(within(grupo).getByRole('button', { name: 'Dormir' }));
    expect(onSleep).toHaveBeenCalledTimes(1);
    fireEvent.click(within(grupo).getByRole('button', { name: 'Banho' }));
    expect(onShower).toHaveBeenCalledTimes(1);
    // lua → sol: dormindo, o mesmo botão acorda e diz que está ligado
    rerender(<CompanionHUD {...base} isSleeping onSleep={onSleep} onShower={onShower} />);
    const acordar = screen.getByRole('button', { name: 'Acordar' });
    expect(acordar.getAttribute('aria-pressed')).toBe('true');
  });

  it('banho em cooldown fica INERTE por forma (aria-disabled), nunca some da ordem de Tab', () => {
    const onShower = vi.fn();
    renderWithCss(<CompanionHUD {...base} onShower={onShower} />);
    fireEvent.click(screen.getByRole('button', { name: 'Banho' }));
    const inerte = screen.getByRole('button', { name: 'Banho — só um instante' });
    expect(inerte.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(inerte);
    expect(onShower).toHaveBeenCalledTimes(1);
  });

  it('BRINCAR é gesto sobre o pet: toque duplo chama a mesma ação de antes', () => {
    const onPlay = vi.fn();
    renderWithCss(<CompanionHUD {...base} play={{ available: true, canPlay: true, playedToday: false, onPlay }} />);
    const alvo = screen.getByRole('button', { name: /Fazer carinho no Soulmon/ });
    fireEvent.doubleClick(alvo);
    expect(onPlay).toHaveBeenCalledTimes(1);
    // e pelo teclado (tecla P com o foco no pet)
    fireEvent.keyDown(alvo, { key: 'p' });
    expect(onPlay).toHaveBeenCalledTimes(2);
  });

  it('HP/EN moram no canto da faixa, com nome acessível e a marca de BAIXO do estado real', () => {
    renderWithCss(<CompanionHUD {...base} healthPoints={1} energyPoints={0} />);
    // C13 (01/10/2026): viraram BOTÕES (abrem a dica de como sobe/desce).
    expect(screen.getByRole('button', { name: 'Corações: 1 de 3 (baixo)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Energia: 0 de 4 (vazia)' })).toBeTruthy();
  });

  it('C13: tocar no coração/energia abre a dica de como sobe e como desce; tocar de novo fecha', () => {
    renderWithCss(<CompanionHUD {...base} healthPoints={2} energyPoints={1} />);
    const hp = screen.getByRole('button', { name: /Corações/ });
    fireEvent.click(hp);
    const tip = screen.getByRole('tooltip');
    expect(tip.textContent).toMatch(/Sobe/);
    expect(tip.textContent).toMatch(/Desce/);
    expect(tip.textContent).toMatch(/carinho/);
    expect(hp.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(hp);
    expect(screen.queryByRole('tooltip')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Energia/ }));
    expect(screen.getByRole('tooltip').textContent).toMatch(/comendo/);
  });
});
