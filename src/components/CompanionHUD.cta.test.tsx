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
 * NOTA (beta-2, 2.5): o balão (`data-pet-bubble-row`) é SOBREPOSTO à janela do
 * cenário (absoluto, topo, 3 linhas no máximo) — o #291 o pusera no fluxo e um
 * texto como "Tomar banho" empurrava cenário e sprite. O que impede o roubo do
 * toque do CTA agora é a camada: o "Evoluir" (z 30) fica ACIMA do balão (z 24).
 * O parágrafo abaixo é histórico.
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
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
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

// Diagnóstico (release/beta-1): o vermelho intermitente deste arquivo (visto na `main` e no passe 2 da
// suíte em São Paulo, com outras sessões carregando a máquina) é a `Mochila` ser `lazy` desde a
// velocidade-dev: sob carga a 1ª transformação do módulo passa de 1 s e o `findBy*` desiste.
// Isolado passa sempre. Pré-carregar os módulos lazy tira o relógio do teste sem mudar o que ele afirma.
beforeAll(async () => { await import('./home/Mochila'); await import('./ChatBox'); });
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
});
afterEach(() => { vi.unstubAllGlobals(); });

/** A linha do balão (`data-pet-bubble-row`): SOBREPOSTA à janela do cenário (beta-2, 2.5), fora do fluxo. */
function linhaDoBalao(): HTMLElement {
  return document.querySelector<HTMLElement>('[data-pet-bubble-row]')!;
}

describe('CompanionHUD — o balão de fala e o CTA de evolução', () => {
  it('BLOQUEADOR: o balão fica na camada ABAIXO do "Evoluir" — onde se tocam, o CTA recebe o toque', () => {
    renderWithCss(<CompanionHUD {...base} canEvolve onEvolveRequest={() => {}} />);
    fireEvent.click(screen.getByAltText('rookie'));

    const btn = screen.getByRole('button', { name: 'Evoluir' });
    const linha = linhaDoBalao();

    // B3 (02/10/2026): "Evoluir" é CENTRALIZADO no ALTO da área do pet
    // (`top`, `left: 50%`).
    expect(btn.style.left).toBe('50%');
    expect(btn.style.bottom).toBe('');
    expect(parseFloat(btn.style.top)).toBeGreaterThanOrEqual(0);
    expect(linha.style.position).toBe('absolute');
    expect(linha.contains(btn)).toBe(false);
    expect(linha.style.pointerEvents).toBe('none');
    expect(Number(btn.style.zIndex)).toBeGreaterThan(Number(linha.style.zIndex));
    // alvo ≥ 44 e rótulo acessível
    expect(parseFloat(btn.style.minHeight)).toBeGreaterThanOrEqual(44);
    expect(btn.getAttribute('aria-label')).toBe('Evoluir');
  });

  it('2.5: o balão NÃO está no fluxo — fala curta ou longa não muda a altura da área do pet', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const sticky = container.querySelector('.sm-pet-sticky')!;
    const antes = Array.from(sticky.children).length;
    fireEvent.click(screen.getByAltText('rookie'));
    const linha = linhaDoBalao();
    // dentro da JANELA do cenário (a caixa de altura fixa), nunca irmão do palco
    expect(container.querySelector('.sm3-cena')!.contains(linha)).toBe(true);
    expect(linha.style.position).toBe('absolute');
    expect(Array.from(sticky.children).length).toBe(antes);
    // texto longo é CONTIDO: 3 linhas no máximo, quebra em qualquer ponto
    const p = linha.querySelector('p')!;
    expect(p.style.webkitLineClamp || p.style.getPropertyValue('-webkit-line-clamp')).toBe('3');
    expect(p.style.overflow).toBe('hidden');
    expect(p.style.overflowWrap).toBe('anywhere');
  });

  it('sem CTA na tela o balão fica na MESMA posição (a posição não depende do botão)', () => {
    renderWithCss(<CompanionHUD {...base} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const linha = linhaDoBalao();
    expect(linha.style.position).toBe('absolute');
    expect(linha.style.bottom).toBe('');
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
    const faixa = linhaDoBalao();
    // A linha cobre a largura inteira: se ela capturar ponteiro, qualquer
    // controle embaixo dela morre — foi assim que o bug aconteceu.
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
  it('a faixa tem o botão Mochila (PT/EN) e ele abre a mochila com a comida', async () => {
    const en = renderWithCss(<CompanionHUD {...base} language="en-US" foodInventory={{ '🍎': 2 }} onFeed={() => {}} />);
    expect(screen.getByRole('button', { name: 'Backpack' })).toBeTruthy();
    en.unmount();

    renderWithCss(<CompanionHUD {...base} foodInventory={{ '🍎': 2 }} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mochila' }));
    // A folha é `lazy` (fora do chunk de entrada): na 1ª abertura o chunk chega assíncrono.
    expect(await screen.findByRole('dialog', { name: 'Mochila' })).toBeTruthy();
    // PL-5 (21/09/2026): o nome acessível segue o idioma.
    expect(screen.getByRole('button', { name: 'Maçã × 2' })).toBeTruthy();
  });

  it('PL-5: o nome do alimento na mochila é o MESMO da pastinha, por idioma (getFoodName)', async () => {
    const en = renderWithCss(<CompanionHUD {...base} language="en-US" foodInventory={{ '🍎': 2 }} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Backpack' }));
    expect(await screen.findByRole('button', { name: 'Apple × 2' })).toBeTruthy();
    en.unmount();
  });

  it('usar a comida chama `onFeed` — a REGRA continua no App, não aqui', async () => {
    const onFeed = vi.fn();
    renderWithCss(<CompanionHUD {...base} foodInventory={{ '🍎': 2 }} onFeed={onFeed} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mochila' }));
    // Tocar no item SÓ seleciona (decisão 3 do dono: item se usa arrastando).
    fireEvent.click(await screen.findByRole('button', { name: 'Maçã × 2' }));
    expect(onFeed).not.toHaveBeenCalled();
    // A alternativa acessível: o botão "Usar" do item selecionado.
    fireEvent.click(screen.getByRole('button', { name: 'Usar Maçã' }));
    expect(onFeed).toHaveBeenCalledWith('🍎');
    // e a folha fecha sozinha: usar é uma ação, não um menu preso
    expect(screen.queryByRole('dialog', { name: 'Mochila' })).toBeNull();
  });

  it('consumível especial NÃO se mistura com a comida: coraçãozinho e Glitchtama moram em Especiais', async () => {
    renderWithCss(<CompanionHUD {...base} foodInventory={{ '🍎': 1, '💗': 3, '🌀': 1 }} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mochila' }));
    const folha = await screen.findByRole('dialog', { name: 'Mochila' });
    // Pelo NOME ACESSÍVEL do botão (a arte é <img>, utils/itemArt.ts).
    expect(within(folha).queryByRole('button', { name: /Coração|Heart/ })).toBeNull();
    expect(within(folha).queryByRole('button', { name: /Glitchtama/ })).toBeNull();
    expect(within(folha).getByRole('button', { name: 'Maçã × 1' })).toBeTruthy();
    fireEvent.click(within(folha).getByRole('tab', { name: 'Especiais' }));
    expect(within(folha).getByRole('button', { name: /Glitchtama × 1/ })).toBeTruthy();
    expect(within(folha).queryByRole('button', { name: 'Maçã × 1' })).toBeNull();
  });

  it('ESTADO VAZIO: sem comida a mochila explica como conseguir, não some', async () => {
    renderWithCss(<CompanionHUD {...base} foodInventory={{}} onFeed={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mochila' }));
    expect(await screen.findByText(/Complete tarefas pra ganhar comida/)).toBeTruthy();
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
