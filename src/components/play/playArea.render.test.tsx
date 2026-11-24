// @vitest-environment jsdom
/**
 * AS ÁREAS DE JOGAR (minimal-ui F5) — Exploração (Masmorra) e Jogos, dentro
 * do molde `AreaScene`/`AreaSheet`. Desde 30/09/2026 (pedido do dono) Jogos tem
 * TRÊS prédios: Salão de Jogos (Corrida com obstáculos + PPT), Ateliê da Mente (cinco
 * jogos que pagam Bits) e Refúgio (respiração e bolhas calmas, sem Bits).
 *
 * Substitui a cobertura que a antiga `ActivitiesPage` (hub de cartões) dava
 * de graça: cada minijogo tem porta, a porta abre o jogo de sempre e os
 * handlers do `App` chegam INTACTOS ao jogo. Os três jogos são trocados por
 * dublês que só registram as props — o que se testa aqui é a fiação, não a
 * jogabilidade (que tem teste próprio).
 */
import { CROSSINGS_EMPTY, type CrossingsState } from '../../types/travessias';
import { useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { SalaoSheet } from './PlaySheets';

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
vi.mock('../Match3Game', () => ({ Match3Game: dubleDe('match3') }));
// §488: a lista de 3 do Match-3 vira um botão "Lutar" que devolve uma escolha do modo (a lista real tem teste próprio).
vi.mock('./Match3Escolha', () => ({ Match3Escolha: ({ mode, onFight }: { mode: 'adventure' | 'pvp'; onFight: (c: unknown) => void }) => (
  <button type="button" data-m3-escolha-lutar="0" onClick={() => onFight(mode === 'pvp' ? { mode, seed: 7, foe: { kind: 'player', level: 3 } } : { mode, element: 'fogo', seed: 7 })}>Lutar</button>
) }));
vi.mock('../SoulBarrage', () => ({ SoulBarrage: dubleDe('barrage') }));
vi.mock('../mente/EcoGame', () => ({ EcoGame: dubleDe('eco') }));
vi.mock('../mente/BolhasGame', () => ({ BolhasGame: (p: Record<string, unknown>) => dubleDe(`bolhas-${p.mode as string}`)(p) }));
vi.mock('../mente/ZipGame', () => ({ ZipGame: dubleDe('zip') }));
vi.mock('../mente/SeloGame', () => ({ SeloGame: dubleDe('selo') }));
vi.mock('../refugio/RespiracaoGame', () => ({ RespiracaoGame: dubleDe('respiracao') }));

import { AreaView, type AreaViewProps, type PlayHandlers } from '../nav/AreaView';

/** Consolidado (F5): Exploração e Jogos moram no `AreaView`, como as outras
 *  quatro áreas. As props planas do antigo `PlayAreaView` continuam sendo a
 *  interface do teste; `PlayAreaView` abaixo só as encaixa no `AreaView`. */
interface PlayProps extends PlayHandlers {
  area: 'exploracao' | 'forja' | 'jogos' | 'arena';
  language: 'pt-BR' | 'en-US';
  evolutionStage: string;
  demoCharacterId?: string;
  totalPoints: number;
  onEarnPoints: (pts: number, extra?: number, category?: string) => void;
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

function PlayAreaView(p: PlayProps & { passeio?: AreaViewProps['passeio'] }) {
  const { area, language, evolutionStage, demoCharacterId, totalPoints, onEarnPoints, passeio, ...play } = p;
  const areaProps = {
    area, language, evolutionStage, demoCharacterId, onEarnPoints, play,
    points: totalPoints, emblems: 0, credits: 0,
    ownership: {} as AreaViewProps['ownership'],
    actions: {} as AreaViewProps['actions'],
    onExchangeCredits: async () => false,
    tournament: {} as AreaViewProps['tournament'],
    labTab: 'evolution', onLabTab: () => {}, labContent: null, hallContent: () => null,
    guild: { saveId: 's', metaDoDiaCumprida: false },
    passeio,
  } satisfies AreaViewProps;
  return <AreaView {...areaProps} />;
}

beforeEach(() => {
  for (const k of Object.keys(recebidas)) delete recebidas[k];
  localStorage.clear();
});

// ⚠️ Estabilidade sob carga (01/10/2026). O PRIMEIRO `lazy()` do arquivo paga o
// import frio do grafo (medido ~3,1 s ocioso, 3× isso com a suíte inteira
// rodando) e o `waitFor` herdava o `asyncUtilTimeout` global de 3 s: o teste
// passava isolado e estourava sob contenção. A espera continua sendo por
// SELETOR (nada de sleep fixo) — só ganha teto à altura do import frio, e o
// teste ganha um teto de runner maior que o da espera (a espera estoura antes
// e diz o que não achou).
const ESPERA_LAZY_MS = 30_000;
// Pré-aquecimento: os chunks `lazy()` que a suíte abre são importados AQUI, na
// fase de coleta (sem teto de teste), e não dentro do primeiro `it` que clica.
// Os doubles de `vi.mock` acima já valem; depois disso o `lazy()` do AreaView
// resolve do cache de módulos e o `waitFor` só espera o React, não o disco.
await Promise.all([
  import('./PlaySheets'), import('../DungeonGame'),
  import('./CadernoSheet'), import('./PasseioSheet'),
]);
vi.setConfig({ testTimeout: 60_000 });

/** O conteúdo da folha e os jogos entram por `lazy()` no `AreaView`
 *  (orçamento de bytes): espera o seletor aparecer. */
async function achar(container: HTMLElement, sel: string): Promise<HTMLElement> {
  let el: HTMLElement | null = null;
  await waitFor(() => { el = container.querySelector<HTMLElement>(sel); expect(el, sel).toBeTruthy(); }, { timeout: ESPERA_LAZY_MS });
  return el!;
}

describe('Exploração — Zeph e a Masmorra', () => {
  it('a cena da Exploração tem o Passeio, a Fenda Sem Fim e o Calabouço (#187, 28/10/2026), com arte; Zeph fala dentro da folha da Fenda', () => {
    const { container } = renderWithCss(<PlayAreaView {...props()} />);
    expect(container.querySelector('[data-area-npc]')).toBeNull();
    expect([...container.querySelectorAll('[data-area-lot]')].map(e => e.getAttribute('data-area-lot')))
      .toEqual(['passeio', 'fenda', 'dungeon']);
    expect(container.querySelector('[data-area-lot="masmorra"]')).toBeNull();
    expect(container.querySelector('[data-area-lot="preparar"]')).toBeNull();
    for (const id of ['passeio', 'fenda', 'dungeon']) {
      expect(container.querySelector(`[data-area-lot="${id}"] [data-area-lot-label]`), id).toBeTruthy();
    }
    expect(container.querySelector('[data-area-lot="dino"]')).toBeNull();
  });

  it('A Forja (7ª área): tem a Oficina, o Caderno e o Refúgio, com arte', () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'forja' })} />);
    const ids = [...container.querySelectorAll('[data-area-lot]')].map(e => e.getAttribute('data-area-lot'));
    for (const id of ['oficina', 'caderno', 'refugio']) {
      expect(ids, id).toContain(id);
      expect(container.querySelector(`[data-area-lot="${id}"] [data-area-lot-label]`), id).toBeTruthy();
    }
  });

  it('Exploração: a Fenda Sem Fim é um prédio da Exploração (veio da Arena, #187), com arte; Zeph fala dentro da folha (N10)', () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'exploracao' })} />);
    expect(container.querySelector('[data-area-lot="fenda"] [data-area-lot-label]')).toBeTruthy();
    fireEvent.click(container.querySelector('[data-area-lot="fenda"]')!);
    expect(container.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain('Zeph');
  });

  it('Oficina do Foco (§247): abre o quadro de cards, com ou sem a chave antiga', async () => {
    const r = renderWithCss(<PlayAreaView {...props({ area: 'forja', focusKeyActive: false } as Partial<PlayProps>)} />);
    fireEvent.click(r.container.querySelector('[data-area-lot="oficina"]')!);
    await achar(r.container, '[data-focus-board] [data-focus-session]');
    expect(r.container.querySelectorAll('[data-focus-card]')).toHaveLength(6);
    expect(r.container.querySelector('[data-oficina-etapa="1"]')).toBeNull();
  });

  it('Masmorra: a folha tem 2 botões + Bits do dia, SEM a nota "Pode cair"; "Ranking" no cabeçalho e o "i" do Drop rate (dono, 17/11/2026)', async () => {
    const { container, getByRole } = renderWithCss(<PlayAreaView {...props({ area: 'exploracao' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="fenda"]')!);
    await achar(container, '[data-masmorra]');
    const folha = getByRole('dialog', { name: 'Fenda Sem Fim' });
    expect(folha.querySelectorAll('[data-masmorra] button')).toHaveLength(2); // Entrar no Rift, Ver o mapa (o ranking mora no rodapé do mapa, 24/11/2026)
    expect(folha.querySelector('[data-masmorra-start]')!.textContent).toContain('Entrar no Rift');
    expect(folha.querySelector('[data-masmorra-map]')!.textContent).toBe('Ver o mapa');
    expect(folha.querySelector('[data-masmorra-start]')!.getAttribute('data-especial-variant')).toBe('rift');
    expect(folha.querySelector('[data-masmorra-map]')!.getAttribute('data-especial-variant')).toBe('rift-sec');
    expect(folha.querySelector('[data-masmorra-start] [data-energy-cost]')).toBeTruthy();
    // 24/11/2026 (dono): as linhas de Bits ficam na BASE (depois dos botões), com a masmorra (75) e o total (180)
    const dung = folha.querySelector('[data-rift-bits-dungeon]')!; const tot = folha.querySelector('[data-rift-bits-total]')!;
    expect(dung.textContent).toMatch(/^Bits da masmorra hoje: \d+ de 75$/); expect(tot.textContent).toMatch(/^Bits totais hoje: \d+ de 180$/);
    expect(folha.querySelector('[data-masmorra-map]')!.compareDocumentPosition(dung) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // a nota "Pode cair" saiu do corpo; os itens só existem no tooltip do "i"
    expect(folha.textContent).not.toContain('Pode cair');
    expect(folha.querySelector('[data-masmorra-drops]')).toBeNull();
    expect(folha.querySelector('[data-info-tip-panel]')).toBeNull();
    // "Ver ranking": o mesmo botão do Torneio (BotaoEspecial ranking), no corpo da folha; sem CSS próprio
    expect(folha.querySelector('[data-masmorra-ranking]')).toBeNull();
    // "Entrar no Rift" na BASE, depois do "Ver o mapa" e das linhas de Bits
    expect(folha.querySelector('[data-masmorra-map]')!.compareDocumentPosition(folha.querySelector('[data-masmorra-start]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(folha.querySelector('[data-area-sheet-head-start]')).toBeNull();
  });

  it('Masmorra: o "i" (Drop rate) abre o tooltip com os itens e as chances; fecha pelo próprio "i", fora e Esc', async () => {
    const { container, getByRole } = renderWithCss(<PlayAreaView {...props({ area: 'exploracao' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="fenda"]')!);
    await achar(container, '[data-masmorra]');
    const folha = getByRole('dialog', { name: 'Fenda Sem Fim' });
    const info = folha.querySelector('[data-moldura-info] [data-info-tip]') as HTMLButtonElement; // o botão mora sobre o ornamento "i" da arte
    expect(info.getAttribute('aria-label')).toBe('Drop rate');
    expect(folha.querySelectorAll('[data-info-tip]')).toHaveLength(1);
    fireEvent.click(info);
    const painel = document.querySelector('[data-info-tip-panel]')!;
    expect(painel.textContent).toContain('Drop rate');
    expect(painel.querySelector('[data-masmorra-drops]')!.textContent).toMatch(/Coraçãozinho.*5%[\s\S]*Glitchtama.*1%[\s\S]*Soulsmith.*5→100/);
    expect(painel.querySelector('[data-masmorra-drops]')!.textContent).toMatch(/Bits.*→/);
    fireEvent.click(info);
    expect(document.querySelector('[data-info-tip-panel]')).toBeNull();
    fireEvent.click(info);
    fireEvent.pointerDown(document.body);
    expect(document.querySelector('[data-info-tip-panel]')).toBeNull();
    fireEvent.click(info);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.querySelector('[data-info-tip-panel]')).toBeNull();
    expect(getByRole('dialog', { name: 'Fenda Sem Fim' })).toBeTruthy();
  });

  it('Masmorra: "Ranking" abre o ranking mensal do Rift (endless-rift)', async () => {
    const { container, getByRole } = renderWithCss(<PlayAreaView {...props({ area: 'exploracao' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="fenda"]')!);
    await achar(container, '[data-masmorra]');
    fireEvent.click(getByRole('dialog', { name: 'Fenda Sem Fim' }).querySelector('[data-masmorra-map]')!);
    await achar(container, '[data-rift-map-ranking]'); // o ranking mora FIXO no rodapé do mapa do Rift
    fireEvent.click(container.querySelector('[data-rift-map-ranking]')!);
    await waitFor(() => expect(document.querySelector('[data-rift-map-ranking-panel]')).toBeTruthy());
    expect(getByRole('dialog', { name: 'Ranking' })).toBeTruthy();
  });

  it('Masmorra: SEM gate de entrada — o CTA nunca fica desabilitado, nem com 0 Bits', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'exploracao', totalPoints: 0 })} />);
    fireEvent.click(container.querySelector('[data-area-lot="fenda"]')!);
    const cta = await achar(container, '[data-masmorra-start]') as HTMLButtonElement;
    expect(cta.disabled).toBe(false);
    expect(cta.getAttribute('aria-disabled')).toBeNull();
  });

  it('Masmorra: o CTA fecha a folha e abre a DungeonGame com os handlers do App INTACTOS', async () => {
    const p = props({ area: 'exploracao', totalPoints: 77 });
    const { container } = renderWithCss(<PlayAreaView {...p} />);
    fireEvent.click(container.querySelector('[data-area-lot="fenda"]')!);
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
    // §456: a Fenda entra pelo funil do App com a categoria `explorar`; o extra da Agulha segue passando.
    (d.onEarnPoints as (pts: number, extra?: number) => void)(7, 3);
    expect(p.onEarnPoints).toHaveBeenCalledWith(7, 3, 'explorar');
    expect(d.onSpendBits).toBe(p.onSpendBits);
    expect(d.bits).toBe(77);
  });

  it('sair do jogo volta à cena da área', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'exploracao' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="fenda"]')!);
    fireEvent.click(await achar(container, '[data-masmorra-start]'));
    await achar(container, '[data-jogo="dungeon"]');
    // O dublê não tem botão: chama-se o `onExit` que o jogo chamaria.
    act(() => { (recebidas.dungeon.onExit as () => void)(); });
    expect(container.querySelector('[data-jogo="dungeon"]')).toBeNull();
    expect(container.querySelector('[data-area-scene="exploracao"]')).toBeTruthy();
  });

  it('Salão de Jogos → Corrida com obstáculos: recorde da chave DINO_BEST, ganho 1 Bit a cada 100 no pergaminho, e o CTA abre a DinoGame', async () => {
    localStorage.setItem(STORAGE_KEYS.DINO_BEST, '1240');
    const p = props({ area: 'jogos' });
    const { container, getByRole } = renderWithCss(<PlayAreaView {...p} />);
    fireEvent.click(container.querySelector('[data-area-lot="salao"]')!);
    const start = await achar(container, '[data-dino-start]');
    const folha = getByRole('dialog', { name: 'Salão de Jogos' });
    expect(folha.textContent).toContain('1240');
    expect(folha.textContent).toContain('a cada 100 pts');
    fireEvent.click(start);
    fireEvent.click(await achar(container, '[data-gate-pick="2"]'));
    await achar(container, '[data-jogo="dino"]');
    expect(recebidas.dino.initialLevel).toBe(2);
    expect(recebidas.dino.onScore).toBe(p.onDinoScore);
    // 14/10/2026: o Dino embrulha o funil para também avisar a missão do dia (REGISTRO §52) — o Bit continua passando intacto.
    (recebidas.dino.onEarnPoints as (pts: number) => void)(7);
    expect(p.onEarnPoints).toHaveBeenCalledWith(7);
  });

  it('EN: rótulos e folha em inglês', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'exploracao', language: 'en-US' })} />);
    expect(container.querySelector('[data-area-lot="fenda"]')!.textContent).toContain('Endless Rift');
    fireEvent.click(container.querySelector('[data-area-lot="fenda"]')!);
    await achar(container, '[data-masmorra]');
    expect(container.querySelector('[data-masmorra-start]')!.textContent).toContain('Enter the Rift');
    expect(container.querySelector('[data-masmorra-map]')!.textContent).toBe('See the map');
    expect(container.querySelector('[data-masmorra-ranking]')).toBeNull(); // saiu da folha: vive no rodapé do mapa
    expect(container.querySelector('[data-masmorra]')!.textContent).not.toContain('Possible drops');
    fireEvent.click(container.querySelector('[data-moldura-info] [data-info-tip]')!);
    expect(document.querySelector('[data-masmorra-drops]')!.textContent).toContain('Glitchtama');
  });
});

describe('Exploração — o Passeio fica com o NPC (07/10/2026: "Stroll fica com o NPC")', () => {
  const DIA = '2026-10-07';
  const onPicked = vi.fn();
  function Viva({ language = 'en-US' as 'en-US' | 'pt-BR' }) {
    const [c, set] = useState<CrossingsState>(CROSSINGS_EMPTY);
    return <PlayAreaView {...props({ language, todayKey: DIA } as Partial<PlayProps>)} passeio={{ crossings: c, onChange: f => set(f), seed: 'seed', onPicked }} />;
  }
  it('a folha do lote traz o Passeio INTEIRO (três propostas, escolha) com Lisel falando; sem texto que aponta para a Home', async () => {
    const { container, getByRole } = renderWithCss(<Viva />);
    fireEvent.click(container.querySelector('[data-area-lot="passeio"]')!);
    await achar(container, '[data-travessia-card]');
    const folha = getByRole('dialog', { name: 'Stroll' });
    expect(folha.querySelectorAll('[data-travessia-card]').length).toBe(3);
    expect(folha.querySelector('[data-passeio-pointer]')).toBeNull();
    expect(folha.textContent).not.toMatch(/Missions menu|menu de Missões/);
    expect(container.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain('Lisel');
    // REGISTRO §413: escolher fecha a folha e avisa o App ("Tarefa criada"); reabrindo o NPC, a missão está lá e o "Concluir" já abre (sem timer)
    fireEvent.click(folha.querySelector('[data-travessia-card] [data-travessia-abrir]')!);
    fireEvent.click(folha.querySelector('[data-travessia-escolher]')!);
    expect(onPicked).toHaveBeenCalledTimes(1);
    fireEvent.click(container.querySelector('[data-area-lot="passeio"]')!);
    const ativa = await achar(container, '[data-travessia-ativa]');
    expect(ativa).toBeTruthy();
    const btn = container.querySelector('[data-travessia-fiz]') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    expect(btn.textContent).toBe('Done');
  });
});

describe('Jogos — os três prédios', () => {
  it('a cena de Jogos tem Salão de Jogos e Ateliê da Mente (o Calabouço foi para a Exploração, #187), todos com arte; o Pipo fala no Salão', () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'jogos' })} />);
    expect([...container.querySelectorAll('[data-area-lot]')].map(e => e.getAttribute('data-area-lot')))
      .toEqual(['salao', 'mente']);
    for (const id of ['salao', 'mente']) {
      expect(container.querySelector(`[data-area-lot="${id}"] [data-area-lot-label]`), id).toBeTruthy();
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
    // O Pipo pergunta o modo antes do jogo (30/10/2026): Comum começa a partida.
    fireEvent.click(await achar(container, '[data-gate-pick="1"]'));
    await achar(container, '[data-jogo="rps"]');
    expect(recebidas.rps.onEarnPoints).toBe(p.onEarnPoints);
  });

  it('Ateliê da Mente: só o Eco do Pet + Trilha e Selo Faltante (os outros saíram da lista), e cada um recebe o onEarnPoints do App (o funil do teto diário)', async () => {
    const p = props({ area: 'jogos' });
    for (const id of ['eco', 'zip', 'selo']) {
      const { container, unmount } = renderWithCss(<PlayAreaView {...p} />);
      fireEvent.click(container.querySelector('[data-area-lot="mente"]')!);
      fireEvent.click(await achar(container, `[data-mente-start="${id}"]`));
      // O Selo Faltante não tem ranking: abre direto, sem a pergunta do Pipo.
      if (id !== 'selo') fireEvent.click(await achar(container, '[data-gate-play]'));
      await achar(container, `[data-jogo="${id}"]`);
      // Os três embrulham o funil para avisar a missão do dia / os feitos (L4): o Bit continua passando intacto ao onEarnPoints do App.
      (recebidas[id].onEarnPoints as (pts: number) => void)(3);
      expect(p.onEarnPoints, id).toHaveBeenLastCalledWith(3);
      unmount();
    }
  });

  it('Ateliê da Mente: a lista tem exatamente Eco do Pet, Trilha e Selo Faltante, nos dois idiomas', async () => {
    for (const language of ['pt-BR', 'en-US'] as const) {
      const { container, unmount } = renderWithCss(<PlayAreaView {...props({ area: 'jogos', language })} />);
      fireEvent.click(container.querySelector('[data-area-lot="mente"]')!);
      await achar(container, '[data-mente]');
      const ids = [...container.querySelectorAll('[data-mente-start]')].map(e => e.getAttribute('data-mente-start'));
      expect(ids).toEqual(['eco', 'zip', 'selo']);
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

  it('Calabouço (M3, agora na Exploração): abre o placeholder "em breve" — ponto de encaixe do RogueDungeon', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'exploracao' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="dungeon"]')!);
    expect(await achar(container, '[data-rogue-dungeon-placeholder]')).toBeTruthy();
  });

  it('Refúgio (agora na Forja): respiração e bolhas calmas NÃO recebem onEarnPoints, e o aviso de ajuda está na folha nos dois idiomas', async () => {
    const p = props({ area: 'forja' });
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
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'forja', language: 'en-US' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="refugio"]')!);
    expect((await achar(container, '[data-refugio-ajuda]')).textContent).toMatch(/988/);
  });
});

describe('jogo aberto pelo Fliperama da Home (§487): sair volta DIRETO à Home', () => {
  function Montar({ volta, onReturnHome }: { volta: boolean; onReturnHome: () => void }) {
    const { area, language, evolutionStage, demoCharacterId, totalPoints, onEarnPoints, ...play } = props({ area: 'jogos' });
    const areaProps = {
      area, language, evolutionStage, demoCharacterId, onEarnPoints, play,
      initialGame: 'respiracao' as const, returnHomeOnGameExit: volta, onReturnHome,
      points: totalPoints, emblems: 0, credits: 0,
      ownership: {} as AreaViewProps['ownership'], actions: {} as AreaViewProps['actions'],
      onExchangeCredits: async () => false, tournament: {} as AreaViewProps['tournament'],
      labTab: 'evolution', onLabTab: () => {}, labContent: null, hallContent: () => null,
      guild: { saveId: 's', metaDoDiaCumprida: false },
    } satisfies AreaViewProps;
    return <AreaView {...areaProps} />;
  }
  it('com returnHomeOnGameExit: fechar o jogo chama onReturnHome UMA vez', async () => {
    const volta = vi.fn();
    const { container } = renderWithCss(<Montar volta onReturnHome={volta} />);
    await achar(container, '[data-jogo="respiracao"]');
    expect(volta).not.toHaveBeenCalled();
    act(() => { (recebidas.respiracao.onExit as () => void)(); });
    expect(volta).toHaveBeenCalledTimes(1);
  });
  it('sem returnHomeOnGameExit: sair do jogo fica na área (comportamento de sempre)', async () => {
    const volta = vi.fn();
    const { container } = renderWithCss(<Montar volta={false} onReturnHome={volta} />);
    await achar(container, '[data-jogo="respiracao"]');
    act(() => { (recebidas.respiracao.onExit as () => void)(); });
    expect(volta).not.toHaveBeenCalled();
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

describe('Salão de Jogos — ícone de cada jogo (11/10/2026)', () => {
  it('Corrida com obstáculos, Pedra-papel-tesoura e Elemental Fusion têm ícone próprio, pelado (sem moldura)', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'jogos' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="salao"]')!);
    await waitFor(() => expect(container.querySelector('[data-salao]')).toBeTruthy());
    const cards = [...container.querySelectorAll('[data-salao] > ul.sm-game-card-grid > li')];
    expect(cards.length).toBe(4); // + Soul Barrage (M9); + Elemental Fusion (11/10/2026, REGISTRO §36)
    for (const c of cards) {
      // Com a ilustração da carta no lugar, o ícone sai; sem ela, é o ícone pelado no placeholder.
      const img = (c.querySelector('img[data-pixel-icon]') ?? c.querySelector('img[data-game-card-art]')) as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.getAttribute('alt')).toBe('');
      expect(img.parentElement!.style.background).toBe('');
      expect(img.parentElement!.style.border).toBe('');
    }
  });
});

describe('P10 (beta-2) — selos zerados do Salão não aparecem', () => {
  it('Corrida: o selo de recorde só aparece com recorde; o ganho (1 Bit a cada 100 pts) fica no pergaminho', () => {
    const { container, unmount } = renderWithCss(<SalaoSheet language="pt-BR" onStart={() => {}} />);
    const dino = () => container.querySelector('[data-game-card="dino"]')!.textContent!;
    expect(dino()).not.toMatch(/seu recorde/);
    unmount();
    localStorage.setItem(STORAGE_KEYS.DINO_BEST, '250');
    const r = renderWithCss(<SalaoSheet language="pt-BR" onStart={() => {}} />);
    const t = r.container.querySelector('[data-game-card="dino"]')!.textContent!;
    expect(t).toContain('seu recorde');
    expect(t).toContain('a cada 100 pts');
    expect(r.container.querySelector('[data-game-card="dino"] [data-game-card-badges]')!.textContent).not.toMatch(/Bits/);
    localStorage.removeItem(STORAGE_KEYS.DINO_BEST);
  });
  it('Elemental Fusion sem recorde: só o "até N Bits"', () => {
    const { container } = renderWithCss(<SalaoSheet language="pt-BR" onStart={() => {}} />);
    const t = container.querySelector('[data-game-card="match3"]')!.textContent!;
    expect(t).not.toContain('seu recorde');
    expect(t).toMatch(/até\s*\d+/);
  });
});

describe('Salão — o roteamento do Elemental Fusion nunca cai na Soul Barrage (REGISTRO §473)', () => {
  it.each([[1, 'pve'], [2, 'pvp']] as const)('Elemental Fusion + botão %i abre o Match3Game em modo %s, e NÃO a Soul Barrage', async (btn, modo) => {
    const p = props({ area: 'jogos' });
    const { container } = renderWithCss(<PlayAreaView {...p} />);
    fireEvent.click(container.querySelector('[data-area-lot="salao"]')!);
    fireEvent.click(await achar(container, '[data-match3-start]'));
    fireEvent.click(await achar(container, `[data-gate-pick="${btn}"]`));
    // §488: o botão de modo só escolhe a lista; quem abre o jogo é o "Lutar" de uma linha.
    expect(container.querySelector('[data-jogo="match3"]')).toBeNull();
    fireEvent.click(await achar(container, '[data-m3-escolha-lutar="0"]'));
    await achar(container, '[data-jogo="match3"]');
    expect(container.querySelector('[data-jogo="barrage"]')).toBeNull();
    expect(recebidas.match3.initialMode).toBe(modo);
    expect((recebidas.match3.initialChoice as { mode: string }).mode).toBe(modo === 'pvp' ? 'pvp' : 'adventure');
  });
  it('Soul Barrage continua abrindo a Soul Barrage', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'jogos' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="salao"]')!);
    fireEvent.click(await achar(container, '[data-barrage-open]'));
    fireEvent.click(await achar(container, '[data-gate-pick="1"]'));
    await achar(container, '[data-jogo="barrage"]');
    expect(container.querySelector('[data-jogo="match3"]')).toBeNull();
  });
});
