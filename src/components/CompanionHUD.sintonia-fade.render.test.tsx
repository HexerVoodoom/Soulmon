// @vitest-environment jsdom
/**
 * O FADE DE 120 ms NO VISOR DA HOME — a metade que faltava do par
 * (`spec-geracao-incremental.md` §2.1 e §2.3.1).
 *
 * ## Por que existe um arquivo só para isto
 *
 * A sintonia nunca foi UMA animação; a spec sempre a descreveu como um PAR.
 * §2.3.1, literal: "É uma transição de ~1,2 s dentro do próprio visor,
 * diegética ('o Visor sintonizando'), na página de Evolução e depois no visor:
 * **scanline de 400 ms + fade de 120 ms reserva→próprio** + o chiado curto que
 * a ocasião A já usa". E a tabela do §2.1 — que é a tabela DESTE componente e
 * de mais nenhum — cobra o par nas duas ocasiões: na A, "fade 120 ms
 * reserva→próprio + scanline 400 ms, automático"; na C, "a sintonia usa **o
 * mesmo fade** + scanline".
 *
 * O visor da Home recebeu a varredura (`CompanionHUD.scanline.render.test.tsx`)
 * e ficou sem o fade. Meia sintonia é pior que nenhuma: a faixa passa anunciando
 * uma troca que, embaixo dela, acontece em corte seco. A aba Evolução já tem os
 * dois desde o primeiro dia (`.sm-visor-swap` no `<img>`, com `key`).
 *
 * ## O que este arquivo mede — e por que a IDENTIDADE DO NÓ é um caso
 *
 * `.sm-visor-swap` sozinho no JSX não produz fade nenhum na troca: a animação
 * já teria rodado na montagem e o CSS não a reinicia porque o elemento é o
 * mesmo. Quem reinicia é o `key={sprite}`, que faz o React DESCARTAR o `<img>`
 * antigo e montar um novo. Por isso um dos casos compara a referência do nó
 * antes e depois — é a única forma observável, sem layout, de provar que a
 * animação recomeça em vez de já ter terminado.
 *
 * ## O caso que não pode faltar
 *
 * Trocar o `<img>` do pet por um nó NOVO no meio de um gesto é a maneira exata
 * de matar o carinho — a **única cura de HP do jogo** — em silêncio: os
 * handlers de ponteiro vivem na `<div>` de cima, mas o alvo do gesto é o
 * sprite. O último caso esfrega o pet DEPOIS da sintonia e cobra o carinho de
 * volta.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, loadAppCss, unwrapLayers } from '../test/renderEnv';
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
};

/** O sprite próprio que chega do Oráculo — a prop que a sintonia troca. */
const PROPRIO = 'https://cdn/rookie-proprio.png';

/** Sem este duplo o hook de movimento reduzido devolve `false` pelo motivo
 *  errado: `matchMedia` simplesmente não existe em jsdom. */
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

const pet = () => screen.getByAltText('rookie');
const varredura = () => document.querySelector('.sm2-viewport-screen .sm-visor-scan');

beforeEach(() => {
  // O idle chama /api/chat a cada 3min. Render nenhum deste arquivo toca rede.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
  fixarMovimentoReduzido(false);
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('o visor da Home sintoniza: fade de 120 ms na troca do sprite (§2.1)', () => {
  it('o sprite do pet carrega a classe do fade — sem ela a troca é corte seco', () => {
    renderWithCss(<CompanionHUD {...base} />);
    expect(
      pet().classList.contains('sm-visor-swap'),
      'a tabela do §2.1 pede fade nas DUAS ocasiões do visor; a aba Evolução já o tem',
    ).toBe(true);
  });

  /**
   * Fronteira JSX↔CSS (footgun 1): classe no JSX que não existe no CSS não
   * anima nada e não quebra nada — some em silêncio. É o defeito que fez este
   * ambiente de render existir.
   *
   * **Por que não por `getComputedStyle`.** Medido aqui: jsdom CASA o
   * `@media (prefers-reduced-motion: reduce)`, então `animation-name` computa
   * `none` para `.sm-visor-swap` — e `none` é também o valor inicial da
   * propriedade, logo classe presente e classe ausente ficam
   * indistinguíveis. Um guard escrito assim passaria sempre, pelo motivo
   * errado. A pergunta é feita ao CSS carregado, que é onde ela tem resposta.
   */
  it('a classe existe no CSS de verdade, e é o fade de 120 ms', () => {
    const css = unwrapLayers(loadAppCss());
    /* `.sm-visor-swap` aparece DUAS vezes de propósito: a definição, e o
       `animation: none !important` do bloco de movimento reduzido. Pegar "a
       primeira" leria justamente o corte e o guard mediria o oposto do que
       pergunta — então os corpos são todos colhidos e o de definição é achado
       pelo conteúdo. */
    const corpos = css.split('.sm-visor-swap {').slice(1).map(t => t.slice(0, t.indexOf('}')));
    expect(corpos.length, '`.sm-visor-swap` sumiu do `index.css` — o JSX ficaria decorado com nada')
      .toBeGreaterThan(0);
    const corpo = corpos.find(c => c.includes('sm-visor-swap-in'));
    expect(corpo, 'a classe existe mas não anima o fade — sobrou o nome, morreu a transição').toBeTruthy();
    // 120 ms pelo TOKEN, nunca digitado: `--sm2-dur-tap` é o mesmo número do
    // fade de toque, e é dele que a spec diz "os mesmos tokens de movimento".
    expect(corpo, 'número copiado é número que diverge (footgun 9)').toContain('--sm2-dur-tap');
  });

  it('na TROCA o `<img>` é um nó NOVO: é o `key` que faz a animação recomeçar', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} />);
    const antes = pet();
    act(() => { rerender(<CompanionHUD {...base} ownSpriteUrl={PROPRIO} />); });
    const depois = pet();
    expect(depois.getAttribute('src'), 'a troca em si tem de acontecer').toBe(PROPRIO);
    expect(
      depois,
      'React reusou o mesmo `<img>`: a animação de 120 ms já terminou na montagem e a troca fica sem fade',
    ).not.toBe(antes);
    expect(depois.classList.contains('sm-visor-swap')).toBe(true);
  });

  it('é o PAR, não meia sintonia: fade e varredura entram na MESMA troca', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} />);
    act(() => { rerender(<CompanionHUD {...base} ownSpriteUrl={PROPRIO} />); });
    expect(varredura(), 'a varredura de 400 ms').toBeTruthy();
    expect(pet().classList.contains('sm-visor-swap'), 'o fade de 120 ms').toBe(true);
  });

  it('movimento reduzido (§6): a troca continua acontecendo, e quem corta o fade é o CSS', () => {
    fixarMovimentoReduzido(true);
    const { rerender } = renderWithCss(<CompanionHUD {...base} />);
    act(() => { rerender(<CompanionHUD {...base} ownSpriteUrl={PROPRIO} />); });
    // "A troca de sprite continua acontecendo" — §6, literal.
    expect(pet().getAttribute('src')).toBe(PROPRIO);
    expect(varredura(), 'a varredura é cortada em JS: o elemento nem nasce').toBeNull();
    /* O fade NÃO é cortado em JS, e isso é de propósito: ao contrário da
       varredura (elemento próprio, animação de 400 ms que o `0.01ms` global
       ainda dispararia), o fade mora numa classe do PRÓPRIO sprite. Tirar a
       classe tiraria o elemento do alcance da regra canônica; a regra
       `.sm-visor-swap { animation: none !important }` dentro do bloco
       `SENTINELA-MOVIMENTO-REDUZIDO-CANONICO` é o corte, e `tokens.contrast
       .test.ts` é quem a tranca lá dentro. */
    expect(pet().classList.contains('sm-visor-swap')).toBe(true);
  });
});

describe('o fade não pode custar o carinho (única cura de HP do jogo)', () => {
  it('DEPOIS da sintonia, esfregar o pet continua respondendo no nó novo', () => {
    vi.useFakeTimers();
    const { rerender } = renderWithCss(<CompanionHUD {...base} healthPoints={1} />);
    act(() => { rerender(<CompanionHUD {...base} healthPoints={1} ownSpriteUrl={PROPRIO} />); });

    /* O alvo é o `<img>` DEPOIS da troca — o nó que o `key` acabou de criar.
       Os handlers moram na `<div>` de cima, então o gesto tem de continuar
       subindo; se o remonte quebrasse a delegação, o carinho morreria mudo. */
    const alvo = pet();
    fireEvent.pointerDown(alvo, { pointerId: 1 });
    fireEvent.pointerMove(alvo, { pointerId: 1 });
    act(() => { vi.advanceTimersByTime(120); });

    expect(
      pet().getAttribute('style') ?? '',
      'o gesto de esfregar parou de responder depois da sintonia — bloqueador, não detalhe visual',
    ).toContain('pet-rub');

    fireEvent.pointerUp(alvo, { pointerId: 1 });
  });
});
