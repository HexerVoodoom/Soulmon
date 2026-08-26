// @vitest-environment jsdom
/**
 * O ANÚNCIO DA SINTONIA — o que fecha a ocasião C
 * (`spec-geracao-incremental.md` §6).
 *
 * ## O buraco, literal
 *
 * §6, item "Sintonia": "ao concluir, um `aria-live="polite"` **único** anuncia
 * 'Visor sintonizado' / 'Visor tuned'. A adoção automática do prazo (§2.3.1)
 * usa o mesmo anúncio — **troca sem palavra nenhuma é exatamente o que o X4
 * derrubou**."
 *
 * A ocasião C já tinha quase tudo: o botão "Sintonizar o Visor", o aviso do
 * prazo, o "Voltar ao traço antigo", o ponto na nav, a adoção automática na
 * virada de dia, o par fade+varredura. O que faltava era a única peça que a
 * spec marcou como acessibilidade **com número**: quem não vê a tela não
 * recebia nada. O rosto do bicho — o objeto do jogo cuja troca sempre teve
 * ritual — trocava mudo para quem usa leitor de tela. A copy `sprite.tuned`
 * existia e só era usada como selo ESTÁTICO no caso automático; texto estático
 * que aparece não é anunciado por leitor de tela nenhum.
 *
 * ## Por que o anúncio nasce da TRANSIÇÃO de estado, e não da troca do sprite
 *
 * A varredura pode disparar em qualquer troca de sprite — inclusive numa
 * evolução, em que o bicho vira outro bicho. Uma faixa de luz ali continua
 * lendo bem; a frase "Visor sintonizado" seria uma MENTIRA. Por isso o gatilho
 * aqui é `A_SINTONIZAR → adotado` (`cardState`), o estado que só o ato de
 * sintonizar produz, e que este componente já calcula.
 *
 * "Único" (§6) é medido: um `aria-live` por conclusão, nunca dois. E o anúncio
 * só existe para a conclusão OBSERVADA — abrir a página com a forma já adotada
 * não anuncia nada, porque não concluiu nada agora.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
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
  currentBranch: 'data' as const,
  virusPoints: 1, dataPoints: 3, vaccinePoints: 0,
  digivolutionSegments: 2,
  digivolutionSegmentsNeeded: 10,
  stages: [stage({})],
  unlockedEvolutions: ['rookie'],
  language: 'pt-BR' as const,
};

const own = { url: 'https://cdn/rookie.png', formId: 'rookie', at: 1 };
/** O acervo no exato estado `A_SINTONIZAR`: sprite pago, parado, à espera. */
const aSintonizar = () => recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: '2026-08-25' });

const anuncios = () => Array.from(document.querySelectorAll('[data-testid="sm-tune-anuncio"]'));

describe('a sintonia ANUNCIA ao concluir (§6)', () => {
  it('enquanto há o que sintonizar, não há anúncio — nada concluiu', () => {
    renderWithCss(
      <EvolutionPath {...base} spriteLibrary={aSintonizar()} onTuneVisor={() => {}} />,
    );
    expect(
      anuncios(),
      'anunciar antes de concluir treina o jogador a ignorar o canal',
    ).toHaveLength(0);
  });

  it('ao concluir, um `aria-live="polite"` diz "Visor sintonizado"', () => {
    const { rerender } = renderWithCss(
      <EvolutionPath {...base} spriteLibrary={aSintonizar()} onTuneVisor={() => {}} onRevertVisor={() => {}} />,
    );
    // O clique existe e é do jogador; quem muda o acervo é quem o possui
    // (`useSpriteGeneration`). Aqui a volta do estado chega por prop, que é
    // exatamente como ela chega em produção.
    screen.getByRole('button', { name: 'Sintonizar o Visor' }).click();
    rerender(
      <EvolutionPath {...base} spriteLibrary={tuneVisor(aSintonizar(), 'rookie')} onTuneVisor={() => {}} onRevertVisor={() => {}} />,
    );

    const [regiao, ...resto] = anuncios();
    expect(regiao, 'o rosto do bicho trocou sem uma palavra para quem não vê a tela — é o X4 de volta').toBeTruthy();
    expect(resto, '"um `aria-live` ÚNICO" (§6): dois anúncios viram eco duplo no leitor').toHaveLength(0);
    expect(regiao.getAttribute('aria-live')).toBe('polite');
    expect(regiao.textContent).toBe('Visor sintonizado');
    // O visor da própria página passou a mostrar o traço PRÓPRIO — a frase e a
    // imagem contam a mesma história.
    const visor = document.querySelector('.sm2-viewport-screen img') as HTMLImageElement;
    expect(visor.getAttribute('src')).toBe(own.url);
  });

  it('o mesmo em EN — nunca só uma das duas línguas', () => {
    const { rerender } = renderWithCss(
      <EvolutionPath {...base} language="en-US" spriteLibrary={aSintonizar()} onTuneVisor={() => {}} onRevertVisor={() => {}} />,
    );
    rerender(
      <EvolutionPath {...base} language="en-US" spriteLibrary={tuneVisor(aSintonizar(), 'rookie')} onTuneVisor={() => {}} onRevertVisor={() => {}} />,
    );
    expect(anuncios()[0]?.textContent).toBe('Visor tuned');
  });

  it('abrir a página com a forma JÁ adotada não anuncia: não concluiu nada agora', () => {
    renderWithCss(
      <EvolutionPath {...base} spriteLibrary={tuneVisor(aSintonizar(), 'rookie')} onTuneVisor={() => {}} onRevertVisor={() => {}} />,
    );
    expect(
      anuncios(),
      'anúncio em toda montagem vira ruído ambiental — o leitor de tela para de ser ouvido',
    ).toHaveLength(0);
  });

  it('"Voltar ao traço antigo" não anuncia sintonia: é o gesto contrário', () => {
    const adotado = tuneVisor(aSintonizar(), 'rookie');
    const { rerender } = renderWithCss(
      <EvolutionPath {...base} spriteLibrary={adotado} onTuneVisor={() => {}} onRevertVisor={() => {}} />,
    );
    rerender(
      <EvolutionPath {...base} spriteLibrary={aSintonizar()} onTuneVisor={() => {}} onRevertVisor={() => {}} />,
    );
    expect(anuncios(), 'desfazer anunciado como sintonia é o oposto do que aconteceu').toHaveLength(0);
  });
});
