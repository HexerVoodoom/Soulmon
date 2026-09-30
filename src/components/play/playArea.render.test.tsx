// @vitest-environment jsdom
/**
 * AS ÁREAS DE JOGAR (minimal-ui F5) — Exploração (Masmorra) e Jogos, dentro
 * do molde `AreaScene`/`AreaSheet`. Desde 30/09/2026 (pedido do dono) Jogos tem
 * TRÊS prédios: Salão de Jogos (Corrida do Dino + PPT), Ateliê da Mente (cinco
 * jogos que pagam Bits) e Refúgio (respiração e bolhas calmas, sem Bits).
 *
 * Substitui a cobertura que a antiga `ActivitiesPage` (hub de cartões) dava
 * de graça: cada minijogo tem porta, a porta abre o jogo de sempre e os
 * handlers do `App` chegam INTACTOS ao jogo. Os três jogos são trocados por
 * dublês que só registram as props — o que se testa aqui é a fiação, não a
 * jogabilidade (que tem teste próprio).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { STORAGE_KEYS } from '../../utils/storageKeys';

const recebidas: Record<string, Record<string, unknown>> = {};
vi.mock('../DungeonGame', async (orig) => {
  const real = await orig<typeof import('../DungeonGame')>();
  return {
    ...real,
    DungeonGame: (p: Record<string, unknown>) => { recebidas.dungeon = p; return <div data-jogo="dungeon" />; },
  };
});
vi.mock('../DinoGame', () => ({
  DinoGame: (p: Record<string, unknown>) => { recebidas.dino = p; return <div data-jogo="dino" />; },
}));
vi.mock('../RPSGame', async (orig) => {
  const real = await orig<typeof import('../RPSGame')>();
  return {
    ...real,
    RPSGame: (p: Record<string, unknown>) => { recebidas.rps = p; return <div data-jogo="rps" />; },
  };
});

// Os jogos dos prédios novos: dublês que só registram as props (a
// jogabilidade tem teste próprio em `components/mente/*.render.test.tsx`).
const dubleDe = (nome: string) => (p: Record<string, unknown>) => { recebidas[nome] = p; return <div data-jogo={nome} />; };
vi.mock('../mente/EcoGame', () => ({ EcoGame: dubleDe('eco') }));
vi.mock('../mente/BolhasGame', () => ({ BolhasGame: (p: Record<string, unknown>) => dubleDe(`bolhas-${p.mode as string}`)(p) }));
vi.mock('../mente/TrocaGame', () => ({ TrocaGame: dubleDe('troca') }));
vi.mock('../mente/PicrossGame', () => ({ PicrossGame: dubleDe('picross') }));
vi.mock('../mente/RevisaoGame', () => ({ RevisaoGame: dubleDe('revisao') }));
vi.mock('../refugio/RespiracaoGame', () => ({ RespiracaoGame: dubleDe('respiracao') }));

import { AreaView, type AreaViewProps, type PlayHandlers } from '../nav/AreaView';

/** Consolidado (F5): Exploração e Jogos moram no `AreaView`, como as outras
 *  quatro áreas. As props planas do antigo `PlayAreaView` continuam sendo a
 *  interface do teste; `PlayAreaView` abaixo só as encaixa no `AreaView`. */
interface PlayProps extends PlayHandlers {
  area: 'exploracao' | 'jogos';
  language: 'pt-BR' | 'en-US';
  evolutionStage: string;
  demoCharacterId?: string;
  totalPoints: number;
  onEarnPoints: (pts: number) => void;
}

function props(over: Partial<PlayProps> = {}): PlayProps {
  return {
    area: 'exploracao',
    language: 'pt-BR',
    evolutionStage: 'rookie',
    totalPoints: 0,
    onDungeonEnter: vi.fn(() => ({ ok: true as const, level: 1, best: 0 })),
    onDungeonLose: vi.fn(),
    onDungeonHeartDrop: vi.fn(() => false),
    onGlitchtama: vi.fn(),
    onFloorCleared: vi.fn(),
    onDungeonEnemyDefeated: vi.fn(),
    onDinoScore: vi.fn(),
    onEarnPoints: vi.fn(),
    onSpendBits: vi.fn(() => true),
    ...over,
  };
}

function PlayAreaView(p: PlayProps) {
  const { area, language, evolutionStage, demoCharacterId, totalPoints, onEarnPoints, ...play } = p;
  const areaProps = {
    area, language, evolutionStage, demoCharacterId, onEarnPoints, play,
    points: totalPoints, emblems: 0, credits: 0,
    ownership: {} as AreaViewProps['ownership'],
    actions: {} as AreaViewProps['actions'],
    onExchangeCredits: async () => false,
    tournament: {} as AreaViewProps['tournament'],
    labTab: 'evolution', onLabTab: () => {}, labContent: null, hallContent: () => null,
    guild: { saveId: 's', metaDoDiaCumprida: false },
  } satisfies AreaViewProps;
  return <AreaView {...areaProps} />;
}

beforeEach(() => {
  for (const k of Object.keys(recebidas)) delete recebidas[k];
  localStorage.clear();
});

/** O conteúdo da folha e os jogos entram por `lazy()` no `AreaView`
 *  (orçamento de bytes): espera o seletor aparecer. */
async function achar(container: HTMLElement, sel: string): Promise<HTMLElement> {
  let el: HTMLElement | null = null;
  await waitFor(() => { el = container.querySelector<HTMLElement>(sel); expect(el, sel).toBeTruthy(); });
  return el!;
}

describe('Exploração — Brisa e a Masmorra', () => {
  it('a cena tem só o lote da Masmorra (a Corrida mudou para o Salão de Jogos); a Brisa fala dentro da folha', () => {
    const { container } = renderWithCss(<PlayAreaView {...props()} />);
    expect(container.querySelector('[data-area-npc]')).toBeNull();
    expect(container.querySelectorAll('[data-area-lot]')).toHaveLength(1);
    expect(container.querySelector('[data-area-lot="masmorra"] [data-area-lot-art]')).toBeTruthy();
    expect(container.querySelector('[data-area-lot="dino"]')).toBeNull();
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    expect(container.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain('Brisa');
  });

  it('Masmorra: folha mostra dificuldade e placar lidos das chaves do jogo, e diz que perder não custa coração', async () => {
    localStorage.setItem(STORAGE_KEYS.DUNGEON_BEST, '321');
    const { container, getByRole } = renderWithCss(<PlayAreaView {...props()} />);
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    await achar(container, '[data-masmorra]');
    const folha = getByRole('dialog', { name: 'Masmorra' });
    expect(folha.textContent).toContain('321');
    expect(folha.textContent).toContain('Nível 1');
    expect(folha.textContent).toMatch(/nunca os seus corações/);
    expect(folha.textContent).toContain('4→12');
    expect(folha.querySelectorAll('ol li')).toHaveLength(5);
  });

  it('Masmorra: SEM gate de entrada — o CTA nunca fica desabilitado, nem com 0 Bits', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ totalPoints: 0 })} />);
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    const cta = await achar(container, '[data-masmorra-start]') as HTMLButtonElement;
    expect(cta.disabled).toBe(false);
    expect(cta.getAttribute('aria-disabled')).toBeNull();
  });

  it('Masmorra: o CTA fecha a folha e abre a DungeonGame com os handlers do App INTACTOS', async () => {
    const p = props({ totalPoints: 77 });
    const { container } = renderWithCss(<PlayAreaView {...p} />);
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    fireEvent.click(await achar(container, '[data-masmorra-start]'));
    await achar(container, '[data-jogo="dungeon"]');
    expect(container.querySelector('[data-area-sheet]')).toBeNull();
    const d = recebidas.dungeon;
    expect(d.onEnter).toBe(p.onDungeonEnter);
    expect(d.onLose).toBe(p.onDungeonLose);
    expect(d.onHeartDrop).toBe(p.onDungeonHeartDrop);
    expect(d.onGlitchtama).toBe(p.onGlitchtama);
    expect(d.onFloorCleared).toBe(p.onFloorCleared);
    expect(d.onEnemyDefeated).toBe(p.onDungeonEnemyDefeated);
    expect(d.onEarnPoints).toBe(p.onEarnPoints);
    expect(d.onSpendBits).toBe(p.onSpendBits);
    expect(d.bits).toBe(77);
  });

  it('sair do jogo volta à cena da área', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props()} />);
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    fireEvent.click(await achar(container, '[data-masmorra-start]'));
    await achar(container, '[data-jogo="dungeon"]');
    // O dublê não tem botão: chama-se o `onExit` que o jogo chamaria.
    act(() => { (recebidas.dungeon.onExit as () => void)(); });
    expect(container.querySelector('[data-jogo="dungeon"]')).toBeNull();
    expect(container.querySelector('[data-area-scene="exploracao"]')).toBeTruthy();
  });

  it('Salão de Jogos → Corrida do Dino: recorde da chave DINO_BEST, 1 Bit a cada 100, e o CTA abre a DinoGame', async () => {
    localStorage.setItem(STORAGE_KEYS.DINO_BEST, '1240');
    const p = props({ area: 'jogos' });
    const { container, getByRole } = renderWithCss(<PlayAreaView {...p} />);
    fireEvent.click(container.querySelector('[data-area-lot="salao"]')!);
    const start = await achar(container, '[data-dino-start]');
    const folha = getByRole('dialog', { name: 'Salão de Jogos' });
    expect(folha.textContent).toContain('1240');
    expect(folha.textContent).toContain('12 Bits');
    fireEvent.click(start);
    await achar(container, '[data-jogo="dino"]');
    expect(recebidas.dino.onScore).toBe(p.onDinoScore);
    expect(recebidas.dino.onEarnPoints).toBe(p.onEarnPoints);
  });

  it('EN: rótulos e folha em inglês', async () => {
    const { container, getByRole } = renderWithCss(<PlayAreaView {...props({ language: 'en-US' })} />);
    expect(container.querySelector('[data-area-lot="masmorra"]')!.textContent).toContain('Dungeon');
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    await achar(container, '[data-masmorra]');
    expect(getByRole('dialog', { name: 'Dungeon' }).textContent).toMatch(/never your hearts/);
  });
});

describe('Jogos — os três prédios', () => {
  it('a cena tem Salão de Jogos, Ateliê da Mente e Refúgio, todos com arte; o Pipo fala no Salão', () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'jogos' })} />);
    expect([...container.querySelectorAll('[data-area-lot]')].map(e => e.getAttribute('data-area-lot')))
      .toEqual(['salao', 'mente', 'refugio']);
    for (const id of ['salao', 'mente', 'refugio']) {
      expect(container.querySelector(`[data-area-lot="${id}"] [data-area-lot-art]`), id).toBeTruthy();
    }
    fireEvent.click(container.querySelector('[data-area-lot="salao"]')!);
    expect(container.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain('Pipo');
  });

  it('Salão: o PPT mostra 5 Bits por vitória e o CTA abre o RPSGame com o onEarnPoints do App', async () => {
    const p = props({ area: 'jogos' });
    const { container, getByRole } = renderWithCss(<PlayAreaView {...p} />);
    fireEvent.click(container.querySelector('[data-area-lot="salao"]')!);
    const start = await achar(container, '[data-ppt-start]');
    expect(getByRole('dialog', { name: 'Salão de Jogos' }).textContent).toContain('5 Bits');
    fireEvent.click(start);
    await achar(container, '[data-jogo="rps"]');
    expect(recebidas.rps.onEarnPoints).toBe(p.onEarnPoints);
  });

  it('Ateliê da Mente: os cinco jogos, e cada um recebe o onEarnPoints do App (o funil do teto diário)', async () => {
    const p = props({ area: 'jogos' });
    for (const id of ['eco', 'bolhas', 'troca', 'picross', 'revisao']) {
      const { container, unmount } = renderWithCss(<PlayAreaView {...p} />);
      fireEvent.click(container.querySelector('[data-area-lot="mente"]')!);
      fireEvent.click(await achar(container, `[data-mente-start="${id}"]`));
      const nome = id === 'bolhas' ? 'bolhas-foco' : id;
      await achar(container, `[data-jogo="${nome}"]`);
      expect(recebidas[nome].onEarnPoints, id).toBe(p.onEarnPoints);
      unmount();
    }
  });

  it('Ateliê da Mente: nenhuma linha promete efeito cognitivo (benchmark §1.2 — caso FTC × Lumosity)', async () => {
    for (const language of ['pt-BR', 'en-US'] as const) {
      const { container, unmount } = renderWithCss(<PlayAreaView {...props({ area: 'jogos', language })} />);
      fireEvent.click(container.querySelector('[data-area-lot="mente"]')!);
      const folha = await achar(container, '[data-mente]');
      expect(folha.textContent).not.toMatch(/c[ée]rebro|brain|treina|train|melhora|improve|QI|IQ/i);
      unmount();
    }
  });

  it('Refúgio: respiração e bolhas calmas NÃO recebem onEarnPoints, e o aviso de ajuda está na folha nos dois idiomas', async () => {
    const p = props({ area: 'jogos' });
    for (const id of ['respiracao', 'bolhas-calmas']) {
      const { container, unmount } = renderWithCss(<PlayAreaView {...p} />);
      fireEvent.click(container.querySelector('[data-area-lot="refugio"]')!);
      expect((await achar(container, '[data-refugio-ajuda]')).textContent).toContain('188');
      fireEvent.click(await achar(container, `[data-refugio-start="${id}"]`));
      const nome = id === 'bolhas-calmas' ? 'bolhas-calma' : id;
      await achar(container, `[data-jogo="${nome}"]`);
      expect(recebidas[nome].onEarnPoints, id).toBeUndefined();
      unmount();
    }
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'jogos', language: 'en-US' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="refugio"]')!);
    expect((await achar(container, '[data-refugio-ajuda]')).textContent).toMatch(/988/);
  });
});

describe('convite ao Refúgio → a respiração abre direto', () => {
  it('initialGame="respiracao" monta a RespiracaoGame e avisa o App (one-shot)', async () => {
    const consumed = vi.fn();
    function ComInicial() {
      const { area, language, evolutionStage, demoCharacterId, totalPoints, onEarnPoints, ...play } = props({ area: 'jogos' });
      const areaProps = {
        area, language, evolutionStage, demoCharacterId, onEarnPoints, play,
        initialGame: 'respiracao' as const, onInitialGameConsumed: consumed,
        points: totalPoints, emblems: 0, credits: 0,
        ownership: {} as AreaViewProps['ownership'], actions: {} as AreaViewProps['actions'],
        onExchangeCredits: async () => false, tournament: {} as AreaViewProps['tournament'],
        labTab: 'evolution', onLabTab: () => {}, labContent: null, hallContent: () => null,
        guild: { saveId: 's', metaDoDiaCumprida: false },
      } satisfies AreaViewProps;
      return <AreaView {...areaProps} />;
    }
    const { container } = renderWithCss(<ComInicial />);
    await achar(container, '[data-jogo="respiracao"]');
    expect(consumed).toHaveBeenCalledTimes(1);
    expect(recebidas.respiracao.onEarnPoints).toBeUndefined();
  });
});

describe('fiação no App (guard de fonte)', () => {
  const app = readFileSync(resolve(__dirname, '../../App.tsx'), 'utf8');
  it('as duas áreas recebem, via AreaView, os handlers da masmorra de sempre', () => {
    const i = app.indexOf('<AreaView');
    expect(i, 'o App não monta mais o AreaView').toBeGreaterThan(0);
    const j = app.indexOf('play={{', i);
    expect(j, 'o AreaView perdeu a fiação `play`').toBeGreaterThan(i);
    const bloco = app.slice(i, app.indexOf('/>', app.indexOf('onSpendBits', j)));
    for (const h of ['handleDungeonEnter', 'handleDungeonLose', 'handleDungeonHeartDrop', 'handleGlitchtama',
      'handleDungeonFloorCleared', 'handleDungeonEnemyDefeated', 'handleDinoScore', 'handleEarnGamePoints']) {
      expect(bloco, `${h} sumiu da fiação das áreas de jogar`).toContain(h);
    }
  });
});
