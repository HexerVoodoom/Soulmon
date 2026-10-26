// @vitest-environment jsdom
/**
 * D-01 (18/10/2026): TODO minijogo tem contexto narrativo (quem, por quê, objetivo) à vista. Percorre os 7 jogos em PT e EN e confere o
 * texto de `utils/gameStories.ts` na tela (`GameStory`, `data-game-story`) — mais a régua do conteúdo: curto, na voz da bíblia, sem
 * prometer efeito cognitivo, sem vermelho/"errou", e o Refúgio calmo, sem combate.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { ReactElement } from 'react';
import { renderWithCss } from '../../test/renderEnv';
import { Match3Game } from '../Match3Game';
import { EcoGame } from '../mente/EcoGame';
import { BolhasGame } from '../mente/BolhasGame';
import { TrocaGame } from '../mente/TrocaGame';
import { PicrossGame } from '../mente/PicrossGame';
import { RevisaoGame } from '../mente/RevisaoGame';
import { RespiracaoGame } from '../refugio/RespiracaoGame';
import { REVIEW_EMPTY } from '../../utils/mente/revisao';
import { GAME_STORIES, GAME_STORY_IDS, gameStory, type GameStoryId } from '../../utils/gameStories';
import type { Language } from '../../utils/i18n';

beforeEach(() => { localStorage.clear(); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

const base = { evolutionStage: 'rookie', onExit: () => {}, onEarnPoints: () => {} };
const JOGOS: Record<GameStoryId, (l: Language) => ReactElement> = {
  match3: l => <Match3Game {...base} language={l} seed={1} />,
  eco: l => <EcoGame {...base} language={l} />,
  bolhas: l => <BolhasGame {...base} language={l} mode="foco" />,
  troca: l => <TrocaGame {...base} language={l} />,
  picross: l => <PicrossGame {...base} language={l} todayKey="2026-10-18" />,
  revisao: l => <RevisaoGame {...base} language={l} todayKey="2026-10-18" review={REVIEW_EMPTY} onReviewChange={() => {}} />,
  respiracao: l => <RespiracaoGame language={l} evolutionStage="rookie" onExit={() => {}} />,
};

describe('D-01: cada um dos 7 jogos mostra o seu contexto narrativo', () => {
  for (const id of GAME_STORY_IDS) {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      it(`${id} (${lang}) renderiza o texto de gameStories`, () => {
        const { container } = renderWithCss(JOGOS[id](lang));
        if (id === 'match3') { // D-77 (19/10/2026): a tela de jogo do Elemental Fusion não tem nenhum texto de história
          expect(container.querySelector('[data-game-story]')).toBeNull();
          return;
        }
        const el = container.querySelector(`[data-game-story="${id}"]`);
        expect(el, `${id} sem GameStory`).toBeTruthy();
        const esperado = lang === 'pt-BR' ? GAME_STORIES[id].pt : GAME_STORIES[id].en;
        expect(el!.textContent).toBe(esperado);
        expect(el!.textContent).toBe(gameStory(id, lang));
        expect(container.querySelectorAll('[data-game-story]').length).toBe(1);
      });
    }
  }
});

describe('D-01: o conteúdo respeita a bíblia', () => {
  const todos = GAME_STORY_IDS.flatMap(id => [GAME_STORIES[id].pt, GAME_STORIES[id].en].map(t => [id, t] as const));
  it('cada jogo tem as duas línguas, com 1–2 frases curtas', () => {
    for (const id of GAME_STORY_IDS) {
      for (const t of [GAME_STORIES[id].pt, GAME_STORIES[id].en]) {
        expect(t.length, id).toBeGreaterThan(40);
        expect(t.length, id).toBeLessThan(260);
        expect((t.match(/[.!?]\s/g) ?? []).length + 1, id).toBeLessThanOrEqual(3);
      }
      expect(GAME_STORIES[id].pt).not.toBe(GAME_STORIES[id].en);
    }
  });
  it('sem promessa de efeito cognitivo, sem veredito, sem vermelho nem "errou"', () => {
    for (const [id, t] of todos) {
      expect(t, id).not.toMatch(/cérebro|brain|memória|memory|treina|train|melhora|improve|inteligên|intellig|foco|focus|concentra|QI|IQ/i);
      expect(t, id).not.toMatch(/errou|erro|falh|wrong|mistake|fail|vermelh|red\b|game over|você é|you are/i);
    }
  });
  it('só o Elemental Fusion tem combate; o Refúgio é calmo (sem inimigo, golpe, placar nem tempo)', () => {
    for (const id of GAME_STORY_IDS.filter(i => i !== 'match3')) {
      for (const t of [GAME_STORIES[id].pt, GAME_STORIES[id].en]) expect(t, id).not.toMatch(/inimig|enem|golpe|strike|combat|batalh|battle/i);
    }
    for (const t of [GAME_STORIES.respiracao.pt, GAME_STORIES.respiracao.en]) expect(t).toMatch(/placar|score/i); // diz que NÃO há placar
    expect(GAME_STORIES.match3.pt).toMatch(/time/);
    expect(GAME_STORIES.match3.en).toMatch(/team/);
  });
});
