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
import { DinoSheet, Match3Sheet } from './PlaySheets';

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
vi.mock('../mente/ZipGame', () => ({ ZipGame: dubleDe('zip') }));
vi.mock('../mente/PatchesGame', () => ({ PatchesGame: dubleDe('patches') }));
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
  import('./PlaySheets'), import('../DungeonGame'), import('./OficinaSheet'),
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
  it('a cena tem a Masmorra, o Passeio, a Oficina e o Caderno (30/09 e 04/10/2026; a Corrida mudou para o Salão de Jogos); Zeph fala dentro da folha', () => {
    const { container } = renderWithCss(<PlayAreaView {...props()} />);
    expect(container.querySelector('[data-area-npc]')).toBeNull();
    expect([...container.querySelectorAll('[data-area-lot]')].map(e => e.getAttribute('data-area-lot')))
      .toEqual(['masmorra', 'passeio', 'oficina', 'caderno', 'preparar', 'refugio']);
    expect(container.querySelector('[data-area-lot="masmorra"] [data-area-lot-art]')).toBeTruthy();
    expect(container.querySelector('[data-area-lot="passeio"] [data-area-lot-art]')).toBeTruthy();
    expect(container.querySelector('[data-area-lot="oficina"] [data-area-lot-art]')).toBeTruthy();
    expect(container.querySelector('[data-area-lot="caderno"] [data-area-lot-art]')).toBeTruthy();
    expect(container.querySelector('[data-area-lot="dino"]')).toBeNull();
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    expect(container.querySelector('[data-area-sheet-npc-line]')!.textContent).toContain('Zeph');
  });

  it('Masmorra: folha mostra dificuldade e placar lidos das chaves do jogo, e diz que perder não custa coração', async () => {
    localStorage.setItem(STORAGE_KEYS.DUNGEON_BEST, '321');
    const { container, getByRole } = renderWithCss(<PlayAreaView {...props()} />);
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    await achar(container, '[data-masmorra]');
    const folha = getByRole('dialog', { name: 'Fenda Sem Fim' });
    expect(folha.textContent).toContain('321');
    expect(folha.textContent).not.toContain('Camada 0'); // P10 (beta-2): chip zerado não aparece (REGISTRO §31: o recorde de profundidade vem do save; vazio = 0 = sem chip)
    // I13 (02/10/2026): a nota "perder custa só a run" saiu da folha e mora
    // atrás do "?" — fica fora da tela até o jogador tocar.
    expect(folha.textContent).not.toMatch(/nunca os seus corações/);
    fireEvent.click(getByRole('button', { name: 'Como funciona a Fenda' }));
    // Pedido do dono (11/10/2026): "Pode cair" saiu do corpo da folha e vive no "i", como lista.
    expect(folha.textContent).not.toContain('Pode cair');
    expect(folha.textContent).not.toContain('4→12');
    const painel = document.querySelector('[data-info-tip-panel]')!;
    expect(painel.textContent).toMatch(/nunca os seus corações/);
    expect(painel.textContent).toContain('Pode cair');
    expect(painel.querySelectorAll('[data-masmorra-drops] li')).toHaveLength(4);
    expect(painel.textContent).toContain('4→12');
    // H11 (01/10/2026): a fileira 1-2-3-4-5 saiu.
    expect(folha.querySelectorAll('ol li')).toHaveLength(0);
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

  it('Salão de Jogos → Corrida com obstáculos: recorde da chave DINO_BEST, 1 Bit a cada 100, e o CTA abre a DinoGame', async () => {
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
    // 14/10/2026: o Dino embrulha o funil para também avisar a missão do dia (REGISTRO §52) — o Bit continua passando intacto.
    (recebidas.dino.onEarnPoints as (pts: number) => void)(7);
    expect(p.onEarnPoints).toHaveBeenCalledWith(7);
  });

  it('EN: rótulos e folha em inglês', async () => {
    const { container, getByRole } = renderWithCss(<PlayAreaView {...props({ language: 'en-US' })} />);
    expect(container.querySelector('[data-area-lot="masmorra"]')!.textContent).toContain('Endless Rift');
    fireEvent.click(container.querySelector('[data-area-lot="masmorra"]')!);
    await achar(container, '[data-masmorra]');
    fireEvent.click(getByRole('button', { name: 'How the Rift works' }));
    expect(document.querySelector('[data-info-tip-panel]')!.textContent).toMatch(/never your hearts/);
  });
});

describe('Exploração — o Passeio fica com o NPC (07/10/2026: "Stroll fica com o NPC")', () => {
  const DIA = '2026-10-07';
  function Viva({ language = 'en-US' as 'en-US' | 'pt-BR' }) {
    const [c, set] = useState<CrossingsState>(CROSSINGS_EMPTY);
    return <PlayAreaView {...props({ language, todayKey: DIA } as Partial<PlayProps>)} passeio={{ crossings: c, onChange: f => set(f), seed: 'seed' }} />;
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
    // escolher uma proposta mostra o card da missão com o botão de concluir travado pelo relógio
    fireEvent.click(folha.querySelector('[data-travessia-card] [data-travessia-abrir]')!);
    fireEvent.click(folha.querySelector('[data-travessia-escolher]')!);
    const ativa = await achar(container, '[data-travessia-ativa]');
    expect(ativa).toBeTruthy();
    const btn = folha.querySelector('[data-travessia-fiz]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(btn.textContent).toMatch(/^Done · \d\d:\d\d$/);
  });
});

describe('Jogos — os três prédios', () => {
  it('a cena tem Salão de Jogos, Ateliê da Mente e Calabouço (M3: o Refúgio foi para a Exploração), todos com arte; o Pipo fala no Salão', () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'jogos' })} />);
    expect([...container.querySelectorAll('[data-area-lot]')].map(e => e.getAttribute('data-area-lot')))
      .toEqual(['salao', 'mente', 'dungeon']);
    for (const id of ['salao', 'mente', 'dungeon']) {
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

  it('Ateliê da Mente: só o Eco do Pet + Trilha e Colcha (os outros saíram da lista), e cada um recebe o onEarnPoints do App (o funil do teto diário)', async () => {
    const p = props({ area: 'jogos' });
    for (const id of ['eco', 'zip', 'patches']) {
      const { container, unmount } = renderWithCss(<PlayAreaView {...p} />);
      fireEvent.click(container.querySelector('[data-area-lot="mente"]')!);
      fireEvent.click(await achar(container, `[data-mente-start="${id}"]`));
      await achar(container, `[data-jogo="${id}"]`);
      expect(recebidas[id].onEarnPoints, id).toBe(p.onEarnPoints);
      unmount();
    }
  });

  it('Ateliê da Mente: a lista tem exatamente Eco do Pet, Trilha e Colcha, nos dois idiomas', async () => {
    for (const language of ['pt-BR', 'en-US'] as const) {
      const { container, unmount } = renderWithCss(<PlayAreaView {...props({ area: 'jogos', language })} />);
      fireEvent.click(container.querySelector('[data-area-lot="mente"]')!);
      await achar(container, '[data-mente]');
      const ids = [...container.querySelectorAll('[data-mente-start]')].map(e => e.getAttribute('data-mente-start'));
      expect(ids).toEqual(['eco', 'zip', 'patches']);
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

  it('Calabouço (M3): abre o placeholder "em breve" — ponto de encaixe do RogueDungeon', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'jogos' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="dungeon"]')!);
    expect(await achar(container, '[data-rogue-dungeon-placeholder]')).toBeTruthy();
  });

  it('Refúgio (agora na Exploração): respiração e bolhas calmas NÃO recebem onEarnPoints, e o aviso de ajuda está na folha nos dois idiomas', async () => {
    const p = props({ area: 'exploracao' });
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
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'exploracao', language: 'en-US' })} />);
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

describe('Salão de Jogos — ícone de cada jogo (11/10/2026)', () => {
  it('Corrida com obstáculos, Pedra-papel-tesoura e Combina 3 têm ícone próprio, pelado (sem moldura)', async () => {
    const { container } = renderWithCss(<PlayAreaView {...props({ area: 'jogos' })} />);
    fireEvent.click(container.querySelector('[data-area-lot="salao"]')!);
    await waitFor(() => expect(container.querySelector('[data-salao]')).toBeTruthy());
    const cards = [...container.querySelectorAll('[data-salao] > ul > li')];
    expect(cards.length).toBe(4); // + Soul Barrage (M9); + Combina 3 (11/10/2026, REGISTRO §36)
    for (const c of cards) {
      const img = c.querySelector('img[data-pixel-icon]') as HTMLImageElement;
      expect(img).toBeTruthy();
      expect(img.getAttribute('alt')).toBe('');
      expect(img.parentElement!.style.background).toBe('');
      expect(img.parentElement!.style.border).toBe('');
    }
  });
});

describe('P10 (beta-2) — chips zerados do Salão não aparecem', () => {
  it('Corrida sem recorde: nenhum chip "0"/"0 Bits"; com recorde, os dois entram', () => {
    const { container, unmount } = renderWithCss(<DinoSheet language="pt-BR" onStart={() => {}} />);
    expect(container.textContent).not.toMatch(/seu recorde|no recorde/);
    unmount();
    localStorage.setItem(STORAGE_KEYS.DINO_BEST, '250');
    const r = renderWithCss(<DinoSheet language="pt-BR" onStart={() => {}} />);
    expect(r.container.textContent).toContain('seu recorde');
    expect(r.container.textContent).toContain('2 Bits');
    localStorage.removeItem(STORAGE_KEYS.DINO_BEST);
  });
  it('Combina 3 sem recorde: só o "até N Bits"; PPT mantém seus dois chips (não são zerados)', () => {
    const { container } = renderWithCss(<Match3Sheet language="pt-BR" onStart={() => {}} />);
    expect(container.textContent).not.toContain('seu recorde');
    expect(container.textContent).toMatch(/até \d+ Bits/);
  });
});
