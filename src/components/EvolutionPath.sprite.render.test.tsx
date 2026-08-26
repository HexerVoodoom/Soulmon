// @vitest-environment jsdom
/**
 * A superfície de SINTONIA na página de Evolução (`spec-geracao-incremental.md`
 * §2.3.1 + §6), montada de verdade.
 *
 * O que este arquivo mede, e não afirma:
 *  - o visor da página usa o sprite próprio **só depois da adoção**;
 *  - "Sintonizar o Visor" e "Voltar ao traço antigo" existem, têm ≥ 44 px de
 *    alvo declarado e **não** recebem foco automático;
 *  - o aviso do prazo (`sprite.tuneAuto`) aparece ANTES da troca — é o que
 *    tira o "silenciosa" da adoção automática;
 *  - PT e EN, sempre os dois.
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

describe('a adoção do sprite próprio é gesto do jogador', () => {
  it('sprite chegado e NÃO adotado: o visor fica na reserva e o card oferece sintonizar', () => {
    const lib = recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: '2026-08-25' });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={lib} onTuneVisor={() => {}} onRevertVisor={() => {}} />);

    const botão = screen.getByRole('button', { name: 'Sintonizar o Visor' });
    expect(botão).toBeTruthy();
    // O visor ainda mostra a arte de RESERVA — a troca não aconteceu sozinha.
    const visor = document.querySelector('.sm2-viewport-screen img') as HTMLImageElement;
    expect(visor.getAttribute('src')).not.toBe(own.url);
  });

  it('o prazo é ANUNCIADO ANTES: a troca automática deixa de ser silenciosa', () => {
    const lib = recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: '2026-08-25' });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={lib} onTuneVisor={() => {}} />);
    expect(screen.getByText('Se você não escolher, o Visor sintoniza sozinho amanhã.')).toBeTruthy();
  });

  it('o mesmo, em EN — nunca só uma das duas línguas', () => {
    const lib = recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: '2026-08-25' });
    renderWithCss(
      <EvolutionPath {...base} language="en-US" spriteLibrary={lib} onTuneVisor={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Tune the Visor' })).toBeTruthy();
    expect(screen.getByText("If you don't choose, the Visor tunes itself tomorrow.")).toBeTruthy();
  });

  it('adotado: o visor usa o sprite próprio e sobra a saída "Voltar ao traço antigo"', () => {
    const lib = recordSprite(emptySpriteLibrary(), own, { adopt: 'now' });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={lib} onTuneVisor={() => {}} onRevertVisor={() => {}} />);
    const visor = document.querySelector('.sm2-viewport-screen img') as HTMLImageElement;
    expect(visor.getAttribute('src')).toBe(own.url);
    expect(screen.getByRole('button', { name: 'Voltar ao traço antigo' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sintonizar o Visor' })).toBeNull();
  });

  it('sem acervo nenhum (save antigo), nada disso aparece e a página segue inteira', () => {
    renderWithCss(<EvolutionPath {...base} />);
    expect(screen.queryByRole('button', { name: 'Sintonizar o Visor' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Voltar ao traço antigo' })).toBeNull();
    expect(document.querySelector('.sm2-viewport-screen img')).toBeTruthy();
  });
});

describe('acessibilidade dos dois botões (§6)', () => {
  it('alvo declarado ≥ 44 px, nos dois', () => {
    const askLib = recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: 'd' });
    const { unmount } = renderWithCss(
      <EvolutionPath {...base} spriteLibrary={askLib} onTuneVisor={() => {}} />,
    );
    const sintonizar = screen.getByRole('button', { name: 'Sintonizar o Visor' });
    expect(parseFloat(getComputedStyle(sintonizar).minHeight)).toBeGreaterThanOrEqual(44);
    unmount();

    const ownLib = recordSprite(emptySpriteLibrary(), own, { adopt: 'now' });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={ownLib} onRevertVisor={() => {}} />);
    const voltar = screen.getByRole('button', { name: 'Voltar ao traço antigo' });
    expect(parseFloat(getComputedStyle(voltar).minHeight)).toBeGreaterThanOrEqual(44);
  });

  it('"Sintonizar" NÃO recebe foco automático — é alcançável, nunca imposto', () => {
    const lib = recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: 'd' });
    renderWithCss(<EvolutionPath {...base} spriteLibrary={lib} onTuneVisor={() => {}} />);
    const botão = screen.getByRole('button', { name: 'Sintonizar o Visor' });
    expect(document.activeElement).not.toBe(botão);
    expect(botão.getAttribute('autofocus')).toBeNull();
  });
});

/**
 * X-3 — o selo do que o Visor fez SOZINHO.
 *
 * Antes deste conserto, `'NOVO'` era inalcançável em runtime: a copy existia,
 * `cardState` sabia produzi-la, e ninguém passava `unseen`. Estes testes montam
 * a página de verdade — não é guard textual.
 */
describe('X-3: quem não estava olhando descobre que o rosto trocou', () => {
  const adotadoSozinho = () =>
    tuneVisor(recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: '2026-08-25' }),
      'rookie', { auto: true });

  it('adoção automática ainda não vista: o selo NOVO aparece', () => {
    renderWithCss(
      <EvolutionPath {...base} spriteLibrary={adotadoSozinho()} onRevertVisor={() => {}} />,
    );
    expect(screen.getByTestId('sm-tuned-badge').textContent).toContain('NOVO');
    expect(screen.getByTestId('sm-tuned-badge').textContent).toContain('Visor sintonizado');
  });

  it('o mesmo em EN', () => {
    renderWithCss(
      <EvolutionPath {...base} language="en-US" spriteLibrary={adotadoSozinho()} onRevertVisor={() => {}} />,
    );
    expect(screen.getByTestId('sm-tuned-badge').textContent).toContain('NEW');
  });

  it('a saída continua à mão no card com selo — descobrir a troca sem poder desfazer é meio aviso', () => {
    renderWithCss(
      <EvolutionPath {...base} spriteLibrary={adotadoSozinho()} onRevertVisor={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Voltar ao traço antigo' })).toBeTruthy();
  });

  it('ver o card avisa quem cuida do save — é assim que o selo some', () => {
    const vistas: string[] = [];
    renderWithCss(
      <EvolutionPath {...base} spriteLibrary={adotadoSozinho()} onSeenTune={id => vistas.push(id)} />,
    );
    expect(vistas, 'sem isto o selo ficaria para sempre em quem só passa os olhos').toEqual(['rookie']);
  });

  it('adoção POR GESTO do jogador não mostra selo nenhum, e não avisa nada', () => {
    const porGesto = tuneVisor(
      recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: '2026-08-25' }), 'rookie');
    const vistas: string[] = [];
    renderWithCss(
      <EvolutionPath {...base} spriteLibrary={porGesto} onRevertVisor={() => {}} onSeenTune={id => vistas.push(id)} />,
    );
    expect(screen.queryByTestId('sm-tuned-badge')).toBeNull();
    expect(vistas).toEqual([]);
  });
});
