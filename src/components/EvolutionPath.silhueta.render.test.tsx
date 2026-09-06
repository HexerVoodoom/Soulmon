// @vitest-environment jsdom
/**
 * WP4.21 — a SILHUETA da próxima forma prevista.
 *
 * O nó `forecast` já existia: o app sabe qual é a próxima forma (`resolveBranch`
 * + `forecastStageId`) e dizia isso em PALAVRAS. O jogador sabia QUE vinha
 * algo e não via NADA — a antecipação visual, que é metade do prazer do
 * gênero (o "quem é esse pokémon"), não existia.
 *
 * Duas metades, e a segunda é a que impede o erro: com sprite, silhueta; SEM
 * sprite, silêncio. Borrar a arte de RESERVA mostraria a silhueta de uma
 * criatura que não é a que vem — pior que não mostrar nada.
 */
import { describe, it, expect } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { EvolutionPath } from './EvolutionPath';
import { emptySpriteLibrary, recordSprite } from '../utils/spriteLibrary';
import type { CreatureStage } from '../utils/oracle';

const stage = (over: Partial<CreatureStage>): CreatureStage => ({
  stage: 'rookie',
  stageName: { pt: 'Rookie', en: 'Rookie' },
  name: 'Forma',
  description: { pt: 'x', en: 'x' },
  imagePrompt: 'p',
  imagePromptFallback: 'pf',
  ...over,
} as CreatureStage);

const base = {
  currentStageId: 'rookie',
  currentBranch: 'data' as const,
  virusPoints: 0, dataPoints: 3, vaccinePoints: 0,
  perfectDays: 2,
  gateDays: 10,
  stages: [stage({}), stage({ stage: 'champion', branch: 'harmonia', name: 'Prevista' })],
  unlockedEvolutions: ['rookie'],
  language: 'pt-BR' as const,
  forecastBranch: 'data' as const,
};

/** O sprite PRÓPRIO da forma prevista, já adotado. */
const spritePrevisto = { url: 'https://cdn/champion-data.png', formId: 'champion-data', at: 1 };

function silhuetas() {
  return [...document.querySelectorAll('.sm-px-node-sprite')]
    .filter(el => (el as HTMLElement).style.filter.includes('blur'));
}

describe('EvolutionPath — a próxima forma aparece como silhueta (WP4.21)', () => {
  it('com sprite da forma prevista, ela vira sombra borrada', () => {
    const lib = recordSprite(emptySpriteLibrary(), spritePrevisto, { adopt: 'now' });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={lib} />);
    expect(silhuetas().length, 'a forma prevista não ganhou silhueta').toBeGreaterThan(0);
  });

  it('a silhueta não deixa a COR passar — senão ela entrega o que existe para esconder', () => {
    const lib = recordSprite(emptySpriteLibrary(), spritePrevisto, { adopt: 'now' });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={lib} />);
    const filtro = (silhuetas()[0] as HTMLElement).style.filter;
    expect(filtro).toContain('brightness(0)');
  });

  it('SEM sprite, silêncio: nada é borrado', () => {
    // Borrar a arte de reserva mostraria a silhueta ERRADA — a de uma
    // criatura que não é a que vem.
    renderWithCss(<EvolutionPath {...base} spriteLibrary={emptySpriteLibrary()} />);
    expect(silhuetas()).toHaveLength(0);
  });

  it('a forma ATUAL nunca é silhueta', () => {
    const atual = { url: 'https://cdn/rookie.png', formId: 'rookie', at: 1 };
    const lib = recordSprite(emptySpriteLibrary(), atual, { adopt: 'now' });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={lib} />);
    expect(silhuetas()).toHaveLength(0);
  });
});

describe('EvolutionPath — a silhueta NÃO desfaz o spoiler', () => {
  it('o nó da silhueta continua sem o NOME da forma', () => {
    // Contorno é antecipação; nome é spoiler. A silhueta existe para dar o
    // primeiro sem dar o segundo — se o nome aparecesse junto, o botão de
    // revelar perderia a função.
    const lib = recordSprite(emptySpriteLibrary(), spritePrevisto, { adopt: 'now' });
    const { container } = renderWithCss(<EvolutionPath {...base} spriteLibrary={lib} />);
    expect(container.textContent).not.toContain('Prevista');
    // A forma oculta se anuncia como `???` no grafo (o rótulo acessível diz
    // "Evolução oculta"). A silhueta entra ao lado disso, não no lugar.
    expect(container.textContent).toContain('???');
  });
});
