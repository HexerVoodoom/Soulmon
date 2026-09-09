// @vitest-environment jsdom
/**
 * A D11 MEDIDA NO CHAMADOR — run `som-01`, Fase 2.
 *
 * A decisão D11 (`utils/sounds.ts`, `playPresence`) diz que o som de presença
 * **só sai em resposta a gesto**, nunca em idle, nunca com `document.hidden`, e
 * **uma vez por sessão**. O módulo não é o lugar onde isso se prova:
 * `sounds.ts` não tem uma ocorrência de `document.hidden` — a fronteira mora
 * inteira no `CompanionHUD`, no `handlePetClick`. Um teste que lesse o fonte do
 * módulo atrás da regra encontraria a ausência dela e concluiria o contrário.
 *
 * O precedente é `sintonia-chiado.render.test.tsx`: espionar o módulo de som e
 * renderizar o COMPONENTE que chama. É o que este arquivo faz — mede quem
 * chama, quando, e sob que condição de aba.
 *
 * ⚠️ Sem este arquivo, a única régua da D11 era a prosa do JSDoc, e prosa não
 * fica vermelha: um refactor do `handlePetClick` podia perder o `!document.hidden`
 * ou o `presencaTocadaRef` sem nenhum teste acusar — e o resultado seria
 * exatamente o bipe que fez as escolas banirem o Tamagotchi.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';

const playPresence = vi.fn();
const playShower = vi.fn();
const playVisorTune = vi.fn();
vi.mock('../utils/sounds', () => ({
  playPresence: (...a: unknown[]) => playPresence(...a),
  playShower: (...a: unknown[]) => playShower(...a),
  playVisorTune: (...a: unknown[]) => playVisorTune(...a),
}));

import { CompanionHUD } from './CompanionHUD';

const baseHud = {
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

/** `document.hidden` é somente-leitura em jsdom; só um defineProperty troca. */
function fixarAbaOculta(oculta: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: oculta });
}

/** O gesto: o clique borbulha do sprite para o `onClick` do palco do pet. */
function tocarNoPet(container: HTMLElement) {
  const sprite = container.querySelector('img.sm-visor-swap');
  expect(sprite, 'o sprite do pet sumiu do palco — o gesto medido aqui não existe mais').toBeTruthy();
  act(() => { fireEvent.click(sprite!); });
}

beforeEach(() => { playPresence.mockClear(); fixarAbaOculta(false); });
afterEach(() => { fixarAbaOculta(false); });

describe('D11 · o som de presença só sai por gesto', () => {
  it('montar a Home não é gesto: nada toca sozinho', () => {
    renderWithCss(<CompanionHUD {...baseHud} />);
    expect(
      playPresence,
      'presença disparando na montagem não é presença, é alarme — é a D11 pelo predicado literal',
    ).not.toHaveBeenCalled();
  });

  it('tocar no pet toca a presença UMA vez', () => {
    const { container } = renderWithCss(<CompanionHUD {...baseHud} />);
    tocarNoPet(container);
    expect(playPresence).toHaveBeenCalledTimes(1);
  });

  it('uma vez por sessão: o segundo toque não repete', () => {
    const { container } = renderWithCss(<CompanionHUD {...baseHud} />);
    tocarNoPet(container);
    tocarNoPet(container);
    tocarNoPet(container);
    expect(
      playPresence,
      '"tem alguém aqui" só precisa ser dito uma vez; repetido, vira ruído',
    ).toHaveBeenCalledTimes(1);
  });

  it('com a aba oculta (`document.hidden`) o gesto NÃO soa', () => {
    const { container } = renderWithCss(<CompanionHUD {...baseHud} />);
    fixarAbaOculta(true);
    tocarNoPet(container);
    expect(
      playPresence,
      'aba em segundo plano é exatamente o caso em que "tem alguém aqui" seria um susto',
    ).not.toHaveBeenCalled();
  });

  it('a trava de aba oculta não gasta a única vez da sessão', () => {
    const { container } = renderWithCss(<CompanionHUD {...baseHud} />);
    fixarAbaOculta(true);
    tocarNoPet(container);
    fixarAbaOculta(false);
    tocarNoPet(container);
    expect(
      playPresence,
      'barrar por aba oculta não pode consumir a presença da sessão — o usuário voltaria a um app mudo sem ter ouvido nada',
    ).toHaveBeenCalledTimes(1);
  });
});
