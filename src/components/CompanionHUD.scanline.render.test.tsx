// @vitest-environment jsdom
/**
 * A VARREDURA DA SINTONIA NO VISOR DA HOME
 * (`spec-geracao-incremental.md` §2.1, §2.3.1 e §6).
 *
 * ## Por que este arquivo existe, se já há um igual para a página de Evolução
 *
 * Porque a spec pede a sintonia nos DOIS lugares, e o segundo é o que o
 * jogador realmente olha. §2.3.1, literal: "É uma transição de ~1,2 s dentro do
 * próprio visor, diegética ('o Visor sintonizando'), **na página de Evolução e
 * depois no visor**: scanline de 400 ms + fade de 120 ms reserva→próprio".
 * E a tabela do §2.1, que é a tabela do `CompanionHUD` e de mais nenhum
 * componente, cobra a mesma coisa em duas linhas: na ocasião A "fade 120 ms
 * reserva→próprio + scanline 400 ms, automático", e na ocasião C "a sintonia
 * usa o mesmo fade + scanline".
 *
 * O `CompanionHUD` já tinha o estado que dispara isso: `ownSpriteUrl` chega por
 * prop e `sprite = ownSpriteUrl ?? reserva`. Trocar essa prop É a sintonia
 * vista de dentro do visor — não foi preciso inventar dono de estado nenhum.
 *
 * ## O que este arquivo mede, e por que não repete o outro palavra por palavra
 *
 * O irmão (`EvolutionPath.scanline.render.test.tsx`) trava a REGRA da varredura
 * (uma vez, na troca, some aos 400 ms, morre em movimento reduzido). Aqui a
 * regra é reverificada — o hook agora é compartilhado, e hook compartilhado que
 * só é testado num call-site é hook testado pela metade — mas o caso que só
 * existe AQUI é o terceiro: **o gesto de esfregar o pet continua funcionando
 * com a faixa por cima**. Esse gesto é a única cura de HP do jogo; um overlay
 * que o engolisse seria um bloqueador, não um detalhe visual. Por isso ele é
 * medido pelo COMPORTAMENTO (o carinho ainda produz corações) e não só pelo
 * `pointer-events: none` computado.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss, computed } from '../test/renderEnv';
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
  useAI: false,
  language: 'pt-BR' as const,
};

/** O sprite próprio que chega do Oráculo — a prop que a sintonia troca. */
const PROPRIO = 'https://cdn/rookie-proprio.png';

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

beforeEach(() => {
  // O idle chama /api/chat a cada 3min. Nenhum teste de render deve tocar a
  // rede; se tocar, quero um erro alto e não uma requisição real pendurada.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
  fixarMovimentoReduzido(false);
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('o visor da Home sintoniza: varredura de 400 ms na troca do sprite', () => {
  it('abrir a Home não é sintonizar: na primeira montagem não há varredura', () => {
    renderWithCss(<CompanionHUD {...base} />);
    expect(
      varredura(),
      'varrer a tela toda vez que a Home monta transforma transição em tique ambiental',
    ).toBeNull();
  });

  it('quando o sprite próprio CHEGA, a varredura entra na tela do visor', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} />);
    act(() => { rerender(<CompanionHUD {...base} ownSpriteUrl={PROPRIO} />); });
    expect(
      varredura(),
      'é a superfície da sintonia no §2.1 — sem ela o rosto do bicho troca mudo',
    ).toBeTruthy();
    // A troca em si é o que a varredura acompanha: o sprite novo está lá.
    expect(screen.getByAltText('rookie').getAttribute('src')).toBe(PROPRIO);
  });

  it('UMA VEZ, não em loop: passados os 400 ms ela some do DOM', () => {
    vi.useFakeTimers();
    const { rerender } = renderWithCss(<CompanionHUD {...base} />);
    act(() => { rerender(<CompanionHUD {...base} ownSpriteUrl={PROPRIO} />); });
    expect(varredura()).toBeTruthy();
    act(() => { vi.advanceTimersByTime(399); });
    expect(varredura(), 'sumir antes da hora corta a própria transição').toBeTruthy();
    act(() => { vi.advanceTimersByTime(2); });
    expect(
      varredura(),
      'overlay que fica é a scanline permanente que a fundação do Viewport recusa',
    ).toBeNull();
  });

  it('não rouba o gesto de esfregar o pet: `pointer-events: none`, como o vidro', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...base} />);
    act(() => { rerender(<CompanionHUD {...base} ownSpriteUrl={PROPRIO} />); });
    expect(computed(varredura()!, 'pointer-events')).toBe('none');
  });

  /**
   * O caso que só existe nesta tela. `pointer-events: none` é a CAUSA; isto é
   * o EFEITO, medido: com a faixa no DOM, esfregar o pet continua curando —
   * o gesto dispara os corações do carinho como se nada estivesse por cima.
   * Se um dia a varredura ganhar fundo opaco, `z-index` ou `inset: 0` com
   * eventos ligados, este é o teste que grita antes do jogador.
   */
  it('COM a varredura passando, o carinho continua respondendo (é a única cura de HP)', () => {
    vi.useFakeTimers();
    const { rerender } = renderWithCss(<CompanionHUD {...base} healthPoints={1} />);
    act(() => { rerender(<CompanionHUD {...base} healthPoints={1} ownSpriteUrl={PROPRIO} />); });
    expect(varredura(), 'sem a faixa no DOM este caso não prova nada').toBeTruthy();

    /* O alvo escolhido é o sprite DENTRO da tela, e não o `<button>` do carinho
       que mora fora do visor: a faixa só poderia engolir o que está debaixo
       dela, e é isso que precisa ser provado. O evento sobe para a `<div>` que
       carrega `onPointerDown`/`onPointerMove`. */
    const pet = screen.getByAltText('rookie');
    fireEvent.pointerDown(pet, { pointerId: 1 });
    fireEvent.pointerMove(pet, { pointerId: 1 });
    // O carinho responde no tique de 100 ms, enquanto houver movimento recente.
    act(() => { vi.advanceTimersByTime(120); });

    expect(
      screen.getByAltText('rookie').getAttribute('style') ?? '',
      'o gesto de esfregar parou de responder com a faixa na tela — bloqueador, não detalhe',
    ).toContain('pet-rub');

    fireEvent.pointerUp(pet, { pointerId: 1 });
  });
});

describe('movimento reduzido (§6): a varredura do visor da Home NÃO TOCA', () => {
  it('com `prefers-reduced-motion: reduce` a troca acontece sem varredura nenhuma', () => {
    fixarMovimentoReduzido(true);
    const { rerender } = renderWithCss(<CompanionHUD {...base} />);
    act(() => { rerender(<CompanionHUD {...base} ownSpriteUrl={PROPRIO} />); });
    expect(varredura(), 'corte em JS, não `0.01ms` — 0.01ms ainda é animação').toBeNull();
    // A troca em si CONTINUA acontecendo: o que morre é a transição (§6).
    expect(screen.getByAltText('rookie').getAttribute('src')).toBe(PROPRIO);
  });
});
