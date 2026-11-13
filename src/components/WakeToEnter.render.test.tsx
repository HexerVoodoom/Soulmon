// @vitest-environment jsdom
/**
 * §329 — Soulmon dormindo: a pergunta "Quer acordá-lo?" montada de verdade (AreaView real + o provedor real). As folhas são stubs.
 * Emenda do dono (13/11/2026): a pergunta mora no gesto que LEVA o Soulmon. O Calabouço (a entrada já é a incursão) pergunta na
 * porta; as folhas com leitura (Arena, Torneio, Guerra, Fenda, Passeio, Oficina, Feira, Grove) entram livres e o botão de
 * lutar/agir lá dentro pergunta — no toque, então o sono que chega com a folha aberta também é visto.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import type { ComponentProps } from 'react';
import { fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { AreaView } from './nav/AreaView';
import { WakeToEnterProvider, useRequireAwake } from './WakeToEnter';

vi.mock('./TournamentPage', () => ({ TournamentPage: () => <p data-stub="torneio">torneio</p> }));
vi.mock('./guild/GuildSheet', () => ({ GuildSheet: ({ room }: { room: string }) => <p data-stub={room}>{room}</p> }));
vi.mock('./arena/DueloSheet', () => ({ DueloSheet: ({ onStart }: { onStart: (seed?: number) => void }) => <button type="button" data-stub="duelo" onClick={() => onStart(7)}>lutar</button> }));
vi.mock('./ArenaGame', () => ({ ArenaGame: () => <div data-stub-game="arena">arena</div> }));
vi.mock('./play/RogueDungeonPlaceholder', () => ({ RogueDungeonPlaceholder: () => <p data-stub="dungeon">dungeon</p> }));
vi.mock('./play/PasseioSheet', () => ({ PasseioSheet: () => <p data-stub="passeio">passeio</p> }));
vi.mock('./play/FocusBoard', () => ({ FocusBoard: () => <p data-stub="oficina">oficina</p> }));
vi.mock('./mercado/MercadoSheets', () => ({ MercadoStallSheet: () => <p data-stub="mercado">mercado</p> }));
vi.mock('./play/PlaySheets', () => ({
  MasmorraSheet: ({ onStart }: { onStart: () => void }) => <button type="button" data-stub="fenda" onClick={onStart}>descer</button>,
  SalaoSheet: ({ onStart }: { onStart: (g: string) => void }) => <button type="button" data-stub="salao" onClick={() => onStart('ppt')}>jogar</button>,
  MenteSheet: () => <p data-stub="mente">mente</p>,
  RefugioSheet: ({ onStart }: { onStart: (g: string) => void }) => <button type="button" data-stub="refugio" onClick={() => onStart('respiracao')}>respirar</button>,
  CadernoSheet: () => null,
}));
vi.mock('./play/MinigameModeGate', () => ({ MinigameModeGate: () => <div data-stub-game="gate">gate</div> }));
vi.mock('./refugio/RespiracaoGame', () => ({ RespiracaoGame: () => <div data-stub-game="respiracao">respiracao</div> }));

afterEach(cleanup);

type Area = 'arena' | 'exploracao' | 'forja' | 'hall' | 'mercado' | 'laboratorio' | 'jogos';
const base = (area: Area, over: Record<string, unknown> = {}): ComponentProps<typeof AreaView> => ({
  area,
  language: 'pt-BR',
  ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
  actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
  points: 0, emblems: 0, credits: 0,
  onExchangeCredits: async () => false,
  tournament: {}, evolutionStage: 'rookie',
  onEarnPoints: () => {},
  play: {},
  labTab: 'evolution', onLabTab: () => {}, labContent: null,
  hallContent: () => <p data-stub="biblioteca">biblioteca</p>,
  guild: { saveId: 'x', metaDoDiaCumprida: false },
  ...over,
}) as unknown as ComponentProps<typeof AreaView>;

function montar(area: Area, sono: { isSleeping: boolean; dayWakePending?: boolean }, over: Record<string, unknown> = {}) {
  const onWake = vi.fn();
  const r = renderWithCss(
    <WakeToEnterProvider isSleeping={sono.isSleeping} dayWakePending={!!sono.dayWakePending} language="pt-BR" onWake={onWake}>
      <AreaView {...base(area, over)} />
    </WakeToEnterProvider>,
  );
  return { ...r, onWake };
}

const lote = (c: HTMLElement, id: string) => c.querySelector(`[data-area-lot="${id}"]`) as HTMLElement;
const pergunta = () => document.body.querySelector('[data-wake-to-enter]');
const stub = (id: string) => document.body.querySelector(`[data-stub="${id}"]`);
async function toque(el: Element | null) {
  expect(el).not.toBeNull();
  await act(async () => { fireEvent.click(el as Element); });
}
/** As folhas são `lazy`: espera o stub resolver. */
async function esperaStub(id: string) {
  for (let i = 0; i < 30 && !stub(id); i++) await act(async () => { await new Promise(r => setTimeout(r, 5)); });
  return stub(id);
}

/** A ENTRADA já é a atividade: pergunta na porta. */
const PORTA: Array<[Area, string]> = [['exploracao', 'dungeon']];
/** A folha tem leitura: entra livre; o botão de lutar/agir pergunta. */
const FOLHAS: Array<[Area, string]> = [
  ['arena', 'duelo'], ['arena', 'torneio'], ['arena', 'guerra'],
  ['exploracao', 'fenda'], ['exploracao', 'passeio'],
  ['forja', 'oficina'],
  ['hall', 'feira'], ['hall', 'grove'],
];

describe('§329 — dormindo, o Calabouço pergunta na porta', () => {
  for (const [area, id] of PORTA) {
    it(`${area}.${id}: dormindo → a pergunta, sem folha; "Agora não" fica`, async () => {
      const { container, onWake } = montar(area, { isSleeping: true }, { bondLevel: 99 });
      await toque(lote(container, id));
      expect(pergunta()).not.toBeNull();
      expect(document.body.textContent).toContain('Seu Soulmon está dormindo. Quer acordá-lo?');
      expect(stub(id)).toBeNull();
      await toque(document.body.querySelector('[data-wake-later]'));
      expect(pergunta()).toBeNull();
      expect(onWake).not.toHaveBeenCalled();
      expect(await esperaStub(id)).toBeNull();
    });

    it(`${area}.${id}: "Acordar" acorda e entra na atividade escolhida`, async () => {
      const { container, onWake } = montar(area, { isSleeping: true }, { bondLevel: 99 });
      await toque(lote(container, id));
      await toque(document.body.querySelector('[data-wake-yes]'));
      expect(onWake).toHaveBeenCalledTimes(1);
      expect(pergunta()).toBeNull();
      expect(await esperaStub(id)).not.toBeNull();
    });

    it(`${area}.${id}: acordado entra direto, como antes`, async () => {
      const { container, onWake } = montar(area, { isSleeping: false }, { bondLevel: 99 });
      await toque(lote(container, id));
      expect(pergunta()).toBeNull();
      expect(await esperaStub(id)).not.toBeNull();
      expect(onWake).not.toHaveBeenCalled();
    });
  }

  it('atalho da Home/missão (`initialSheet`) para o Calabouço: a pergunta abre no lugar da folha; "Acordar" abre', async () => {
    const onVisit = vi.fn();
    const { onWake } = montar('exploracao', { isSleeping: true }, { bondLevel: 99, initialSheet: 'dungeon', onVisitBuilding: onVisit });
    expect(pergunta()).not.toBeNull();
    expect(stub('dungeon')).toBeNull();
    expect(onVisit).not.toHaveBeenCalled();
    await toque(document.body.querySelector('[data-wake-yes]'));
    expect(onWake).toHaveBeenCalledTimes(1);
    expect(onVisit).toHaveBeenCalledWith('exploracao.dungeon');
    expect(await esperaStub('dungeon')).not.toBeNull();
  });
});

describe('§329 — folhas com leitura: entrar é livre, LUTAR/AGIR pergunta', () => {
  for (const [area, id] of FOLHAS) {
    it(`${area}.${id}: dormindo, a folha abre direto (sem pergunta)`, async () => {
      const { container, onWake } = montar(area, { isSleeping: true, dayWakePending: true }, { bondLevel: 99 });
      await toque(lote(container, id));
      expect(pergunta()).toBeNull();
      expect(await esperaStub(id)).not.toBeNull();
      expect(onWake).not.toHaveBeenCalled();
    });
  }

  it('atalho da Home (`initialSheet`) para a Arena: a folha abre direto, dormindo', async () => {
    const onVisit = vi.fn();
    montar('arena', { isSleeping: true }, { bondLevel: 99, initialSheet: 'duelo', onVisitBuilding: onVisit });
    expect(pergunta()).toBeNull();
    expect(onVisit).toHaveBeenCalledWith('arena.duelo');
    expect(await esperaStub('duelo')).not.toBeNull();
  });

  const arena = () => document.body.querySelector('[data-stub-game="arena"]');
  it('Arena livre: "Lutar" pergunta; "Agora não" fica na folha; "Acordar" acorda e abre a luta', async () => {
    const { container, onWake } = montar('arena', { isSleeping: true }, { bondLevel: 99 });
    await toque(lote(container, 'duelo'));
    await toque(await esperaStub('duelo'));
    expect(pergunta()).not.toBeNull();
    expect(arena()).toBeNull();
    await toque(document.body.querySelector('[data-wake-later]'));
    expect(pergunta()).toBeNull();
    expect(stub('duelo')).not.toBeNull(); // continua na folha
    await toque(stub('duelo'));
    await toque(document.body.querySelector('[data-wake-yes]'));
    expect(onWake).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 30 && !arena(); i++) await act(async () => { await new Promise(r => setTimeout(r, 5)); });
    expect(arena()).not.toBeNull();
  });

  it('o sono que chega com a folha ABERTA: entrou acordado, dormiu, "Lutar" pergunta no toque', async () => {
    const onWake = vi.fn();
    const arvore = (isSleeping: boolean) => (
      <WakeToEnterProvider isSleeping={isSleeping} dayWakePending={false} language="pt-BR" onWake={onWake}>
        <AreaView {...base('arena', { bondLevel: 99 })} />
      </WakeToEnterProvider>
    );
    const { container, rerender } = renderWithCss(arvore(false));
    await toque(lote(container, 'duelo'));
    expect(await esperaStub('duelo')).not.toBeNull();
    rerender(arvore(true)); // o sono automático chegou com a folha aberta
    await toque(stub('duelo'));
    expect(pergunta()).not.toBeNull();
    expect(arena()).toBeNull();
  });

  it('Fenda: a folha entra livre; "Descer" (o jogo `masmorra`) pergunta', async () => {
    const { container, onWake } = montar('exploracao', { isSleeping: true }, { bondLevel: 99 });
    await toque(lote(container, 'fenda'));
    expect(pergunta()).toBeNull();
    await toque(await esperaStub('fenda'));
    expect(pergunta()).not.toBeNull();
    await toque(document.body.querySelector('[data-wake-yes]'));
    expect(onWake).toHaveBeenCalledTimes(1);
  });

  it('o sono real diz o que acordar muda; o "Acordar" do dia não diz nada a mais', async () => {
    const real = montar('arena', { isSleeping: true }, { bondLevel: 99 });
    await toque(lote(real.container, 'duelo'));
    await toque(await esperaStub('duelo'));
    expect(document.body.querySelector('[data-wake-effect]')?.textContent).toContain('energia recarrega mais rápido');
    cleanup();
    const dia = montar('arena', { isSleeping: false, dayWakePending: true }, { bondLevel: 99 });
    await toque(lote(dia.container, 'duelo'));
    await toque(await esperaStub('duelo'));
    expect(pergunta()).not.toBeNull();
    expect(document.body.querySelector('[data-wake-effect]')).toBeNull();
  });

  it('os botões de lutar/agir das outras folhas passam pelo gancho, com a entrada do prédio (fonte)', () => {
    const fonte = (f: string) => readFileSync(f, 'utf8');
    const torneio = fonte('src/components/TournamentPage.tsx');
    expect(torneio).toContain("requireAwake('arena.torneio', () => startTraining(n))");
    expect(torneio).toContain("requireAwake('arena.torneio', () => startTraining(undefined, stray))");
    expect(torneio).toContain("requireAwake('arena.torneio', () => { void fight(o); })");
    expect(torneio).toContain("requireAwake('arena.torneio', () => { void fightSpar(o); })");
    const guild = fonte('src/components/guild/GuildSheet.tsx');
    expect(guild).toContain("requireAwake('arena.guerra', buscarGuerra)");
    expect(guild).toContain("requireAwake('hall.feira', onRodada)");
    const plantio = fonte('src/components/guild/PlantioVisor.tsx');
    expect(plantio).toContain("requireAwake('hall.grove', () => { void cuidar(); })");
    expect(plantio).toContain("requireAwake('hall.grove', () => setLutando(true))");
    expect(plantio).toContain("onClick={() => void fazer('claColher')}"); // colher é livre
    expect(fonte('src/components/play/PasseioSheet.tsx')).toContain("requireAwake('exploracao.passeio', () => escolher(region, challengeId))");
    expect(fonte('src/components/play/FocusBoard.tsx')).toContain("requireAwake('forja.oficina', () => { setDoneNote(null); setPickOpen(true); })");
    expect(fonte('src/components/nav/AreaView.tsx')).toContain("wakeGate.require('arena.duelo', () => { setSheet(null); setDuelSeed(seed); setDuelOpen(true); })");
  });
});

describe('§329 — jogos, Refúgio e leitura', () => {
  it('minijogo: a folha do Salão abre (ler é livre); JOGAR pergunta; "Acordar" segue para o jogo', async () => {
    const { container, onWake } = montar('jogos', { isSleeping: true }, { bondLevel: 99 });
    await toque(lote(container, 'salao'));
    expect(pergunta()).toBeNull();
    const salao = await esperaStub('salao');
    await toque(salao);
    expect(pergunta()).not.toBeNull();
    expect(document.body.querySelector('[data-stub-game="gate"]')).toBeNull();
    await toque(document.body.querySelector('[data-wake-yes]'));
    expect(onWake).toHaveBeenCalledTimes(1);
    expect(document.body.querySelector('[data-stub-game="gate"]')).not.toBeNull();
  });

  it('o Refúgio nunca pergunta, nem dormindo', async () => {
    const { container } = montar('forja', { isSleeping: true }, { bondLevel: 99 });
    await toque(lote(container, 'refugio'));
    await toque(await esperaStub('refugio'));
    expect(pergunta()).toBeNull();
  });

  for (const [area, id, s] of [['mercado', 'itens', 'mercado'], ['laboratorio', 'biblioteca', 'biblioteca'], ['hall', 'guilda', 'salao']] as const) {
    it(`ler é livre: ${area}.${id} abre direto com o Soulmon dormindo`, async () => {
      const { container } = montar(area, { isSleeping: true, dayWakePending: true }, { bondLevel: 99 });
      await toque(lote(container, id));
      expect(pergunta()).toBeNull();
      expect(await esperaStub(s)).not.toBeNull();
    });
  }
});

describe('§329 — o gancho fora do AreaView (treino com amigo, missão da guilda)', () => {
  function Botao({ entry, onGo }: { entry: string; onGo: () => void }) {
    const requireAwake = useRequireAwake();
    return <button type="button" data-go onClick={() => { requireAwake(entry, onGo); }}>ir</button>;
  }
  for (const entry of ['treino', 'missao']) {
    it(`${entry}: dormindo pergunta; "Acordar" segue; acordado segue direto`, async () => {
      const onGo = vi.fn();
      const onWake = vi.fn();
      const { container, rerender } = renderWithCss(<WakeToEnterProvider isSleeping dayWakePending={false} language="en-US" onWake={onWake}><Botao entry={entry} onGo={onGo} /></WakeToEnterProvider>);
      await toque(container.querySelector('[data-go]'));
      expect(onGo).not.toHaveBeenCalled();
      expect(document.body.textContent).toContain('Your Soulmon is sleeping. Want to wake it up?');
      await toque(document.body.querySelector('[data-wake-yes]'));
      expect(onWake).toHaveBeenCalledTimes(1);
      expect(onGo).toHaveBeenCalledTimes(1);
      rerender(<WakeToEnterProvider isSleeping={false} dayWakePending={false} language="en-US" onWake={onWake}><Botao entry={entry} onGo={onGo} /></WakeToEnterProvider>);
      await toque(container.querySelector('[data-go]'));
      expect(onGo).toHaveBeenCalledTimes(2);
      expect(pergunta()).toBeNull();
    });
  }

  it('sem provedor (tela isolada) nada trava', async () => {
    const onGo = vi.fn();
    const { container } = renderWithCss(<Botao entry="treino" onGo={onGo} />);
    await toque(container.querySelector('[data-go]'));
    expect(onGo).toHaveBeenCalledTimes(1);
  });

  it('a pergunta é o modal simples do app: diálogo rotulado, botões do kit com 48 px, sem CtaButton', async () => {
    const { container } = renderWithCss(<WakeToEnterProvider isSleeping dayWakePending={false} language="pt-BR" onWake={() => {}}><Botao entry="treino" onGo={() => {}} /></WakeToEnterProvider>);
    await toque(container.querySelector('[data-go]'));
    const dlg = document.body.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg).not.toBeNull();
    expect(dlg.getAttribute('aria-modal')).toBe('true');
    expect(dlg.getAttribute('aria-labelledby') || dlg.getAttribute('aria-label')).toBeTruthy();
    for (const b of [document.body.querySelector('[data-wake-yes]'), document.body.querySelector('[data-wake-later]')] as HTMLElement[]) {
      expect(b.className).toContain('sm2-kit-btn');
      expect(b.style.minHeight).toBe('48px');
    }
    expect(readFileSync('src/components/WakeToEnter.tsx', 'utf8')).not.toMatch(/import .*CtaButton/);
  });

  it('as duas entradas fora do AreaView passam pelo gancho (fonte)', () => {
    expect(readFileSync('src/components/LibraryPage.tsx', 'utf8')).toContain("requireAwake('treino', () => setTrainingWith(p))");
    expect(readFileSync('src/components/guild/GuildSheet.tsx', 'utf8')).toContain("requireAwake('missao', missao.onSend)");
  });
});
