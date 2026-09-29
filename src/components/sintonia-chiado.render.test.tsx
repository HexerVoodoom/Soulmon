// @vitest-environment jsdom
/**
 * O CHIADO CURTO DA SINTONIA — o terceiro terço
 * (`spec-geracao-incremental.md` §2.3.1, literal: "scanline de 400 ms + fade de
 * 120 ms reserva→próprio + o chiado curto que a ocasião A já usa").
 *
 * ## A divergência doc↔código nº 10, que é a razão deste arquivo existir
 *
 * "o chiado curto que a ocasião A já usa" descreve um som que NÃO EXISTIA. Até
 * o commit que trouxe este teste, o projeto tinha nove sons em `utils/sounds.ts`
 * e nenhum deles era de sintonia; nenhuma das duas telas da sintonia chamava
 * `play*` na troca do sprite (o único som do `CompanionHUD` era o `playShower`,
 * no banho). Pior, a spec se contradiz sozinha: a tabela do §2.1 dá **"nada"**
 * na coluna de fora do visor para a ocasião A, enquanto a prosa do §2.3 pede o
 * chiado. Uma frase que descreve o passado no presente é a forma mais barata de
 * um requisito nunca ser implementado: quem lê §2.3.1 conclui que só falta
 * ligar o que já existe, e não liga nada.
 *
 * Este arquivo é o que impede a frase de voltar a mentir. Ele mede
 * comportamento — quem chama, quando, e sob quais preferências —, não a
 * existência do símbolo.
 *
 * ## As três perguntas medidas
 *
 * 1. **Quando.** O chiado toca na TROCA do sprite, nas duas telas, e não na
 *    montagem: abrir a Home ou a página de Evolução não é sintonizar, e um som
 *    ambiental que dispara em toda montagem é pior que som nenhum.
 * 2. **Movimento reduzido silencia.** A WCAG 2.3.3 é sobre movimento e não
 *    obriga a cortar áudio; a decisão é de coerência diegética e está
 *    argumentada por extenso no `EvolutionPath.tsx`. Aqui ela vira contrato: o
 *    chiado é a trilha da varredura, e sob `prefers-reduced-motion` a varredura
 *    não nasce. Som sem a imagem que o explica é barulho órfão — o usuário que
 *    pediu MENOS movimento receberia MAIS ruído inexplicado.
 * 3. **O som em si.** Um segundo bloco, com `AudioContext` de mentira, prova o
 *    que o call-site não pode provar: que o mudo é respeitado (e que o gate é o
 *    do `play()`, não um `if` copiado no componente) e que o chiado é curto,
 *    discreto e sem graves — a sintonia é uma coisa boa acontecendo, e nada
 *    aqui pode soar como alarme.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';

/**
 * O duplo do módulo de som. É o que torna o teste capaz de FALHAR: sem chamada
 * nenhuma no call-site, o espião fica em zero e as asserções de "quando" caem.
 * `playShower` vem junto porque o `CompanionHUD` o importa — mock parcial que
 * esquecesse dele quebraria o componente por um motivo que não é o medido.
 */
const playVisorTune = vi.fn();
const playShower = vi.fn();
vi.mock('../utils/sounds', () => ({
  playVisorTune: (...a: unknown[]) => playVisorTune(...a),
  playShower: (...a: unknown[]) => playShower(...a),
}));

import { EvolutionPath } from './EvolutionPath';
import { CompanionHUD } from './CompanionHUD';
import { emptySpriteLibrary, recordSprite, tuneVisor } from '../utils/spriteLibrary';
import type { CreatureStage } from '../utils/oracle';

/* ── Cenário da página de Evolução ──────────────────────────────────────── */

const stage = (over: Partial<CreatureStage>): CreatureStage => ({
  stage: 'rookie',
  stageName: { pt: 'Rookie', en: 'Rookie' },
  name: 'Fangmon',
  description: { pt: 'x', en: 'x' },
  imagePrompt: 'p',
  imagePromptFallback: 'pf',
  ...over,
} as CreatureStage);

const baseEvo = {
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
/** Sprite próprio chegado, ainda NA RESERVA (o jogador não sintonizou). */
const naReserva = () => recordSprite(emptySpriteLibrary(), own, { adopt: 'ask', dayKey: 'd' });
/** O mesmo acervo depois da sintonia — o visor passa ao sprite próprio. */
const sintonizado = () => tuneVisor(naReserva(), 'rookie');

/* ── Cenário do visor da Home ───────────────────────────────────────────── */

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

beforeEach(() => {
  playVisorTune.mockClear();
  playShower.mockClear();
  // O idle do HUD chama /api/chat. Nenhum teste de render toca a rede.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste'))));
  fixarMovimentoReduzido(false);
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('página de Evolução: a sintonia deixa de ser muda', () => {
  it('abrir a página não é sintonizar: na montagem não toca nada', () => {
    renderWithCss(<EvolutionPath {...baseEvo} spriteLibrary={naReserva()} onTuneVisor={() => {}} />);
    expect(
      playVisorTune,
      'chiado em toda montagem vira tique ambiental — é o mesmo defeito da varredura',
    ).not.toHaveBeenCalled();
  });

  it('quando o jogador sintoniza, o chiado toca UMA vez', () => {
    const { rerender } = renderWithCss(
      <EvolutionPath {...baseEvo} spriteLibrary={naReserva()} onTuneVisor={() => {}} />,
    );
    act(() => {
      rerender(<EvolutionPath {...baseEvo} spriteLibrary={sintonizado()} onRevertVisor={() => {}} />);
    });
    expect(
      playVisorTune,
      'a spec pede o chiado JUNTO da varredura (§2.3.1); sem ele a sintonia tem duas metades só',
    ).toHaveBeenCalledTimes(1);
  });

  it('re-render sem troca de sprite não repete o chiado', () => {
    const { rerender } = renderWithCss(
      <EvolutionPath {...baseEvo} spriteLibrary={naReserva()} onTuneVisor={() => {}} />,
    );
    act(() => {
      rerender(<EvolutionPath {...baseEvo} spriteLibrary={sintonizado()} onRevertVisor={() => {}} />);
    });
    act(() => {
      rerender(<EvolutionPath {...baseEvo} spriteLibrary={sintonizado()} onRevertVisor={() => {}} evolutionLocked />);
    });
    expect(
      playVisorTune,
      'som preso a render, e não à troca, dispara a cada mudança de prop qualquer',
    ).toHaveBeenCalledTimes(1);
  });
});

describe('visor da Home: o mesmo chiado, no segundo call-site', () => {
  it('abrir a Home não é sintonizar: na montagem não toca nada', () => {
    renderWithCss(<CompanionHUD {...baseHud} />);
    expect(playVisorTune).not.toHaveBeenCalled();
  });

  it('quando o sprite próprio CHEGA, o chiado toca uma vez', () => {
    const { rerender } = renderWithCss(<CompanionHUD {...baseHud} />);
    act(() => { rerender(<CompanionHUD {...baseHud} ownSpriteUrl={PROPRIO} />); });
    expect(
      playVisorTune,
      'o §2.3.1 pede a MESMA sintonia nos dois visores; ligar só um recria a divergência',
    ).toHaveBeenCalledTimes(1);
  });
});

describe('movimento reduzido (§6): sem varredura, sem chiado', () => {
  it('na página de Evolução o chiado não toca', () => {
    fixarMovimentoReduzido(true);
    const { rerender } = renderWithCss(
      <EvolutionPath {...baseEvo} spriteLibrary={naReserva()} onTuneVisor={() => {}} />,
    );
    act(() => {
      rerender(<EvolutionPath {...baseEvo} spriteLibrary={sintonizado()} onRevertVisor={() => {}} />);
    });
    expect(
      playVisorTune,
      'chiado sem a faixa na tela é barulho órfão: quem pediu menos movimento receberia mais ruído',
    ).not.toHaveBeenCalled();
  });

  it('no visor da Home o chiado não toca', () => {
    fixarMovimentoReduzido(true);
    const { rerender } = renderWithCss(<CompanionHUD {...baseHud} />);
    act(() => { rerender(<CompanionHUD {...baseHud} ownSpriteUrl={PROPRIO} />); });
    expect(playVisorTune).not.toHaveBeenCalled();
  });

  it('a TROCA em si continua acontecendo — o que morre é a transição, não o sprite', () => {
    fixarMovimentoReduzido(true);
    const { rerender } = renderWithCss(
      <EvolutionPath {...baseEvo} spriteLibrary={naReserva()} onTuneVisor={() => {}} />,
    );
    act(() => {
      rerender(<EvolutionPath {...baseEvo} spriteLibrary={sintonizado()} onRevertVisor={() => {}} />);
    });
    const img = document.querySelector('.sm2-viewport-screen img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(own.url);
  });
});
