// @vitest-environment jsdom
/**
 * O fluxo da sessão de diversão montado de verdade: AreaView + SalaoSheet reais, com o `funSession` ligado às funções puras como no
 * App. Os jogos e a pergunta do NPC são stubs (canvas/rodada inteira não rodam em jsdom): o botão do stub chama o `onReplayRound` que o
 * AreaView entrega. Que cada jogo real chama esse prop no "jogar de novo" é conferido por leitura de fonte, no último caso.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { useState, type ComponentProps } from 'react';
import { fireEvent, act, screen, cleanup } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { AreaView } from './AreaView';
import { funTicketStatus, startFunRound, buyFunTickets, ticketBuyRefusal, type FunTicketState } from '../../utils/funTickets';

vi.mock('../SoulBarrage', () => ({
  SoulBarrage: ({ onReplayRound }: { onReplayRound?: () => boolean }) => (
    <div data-stub-game="barrage"><button type="button" data-replay onClick={() => onReplayRound?.()}>again</button></div>
  ),
}));
vi.mock('../play/MinigameModeGate', () => ({
  MinigameModeGate: ({ onPick, onBack }: { onPick: (l?: 1 | 2) => void; onBack: () => void }) => (
    <div>
      <button type="button" data-gate-pick="1" onClick={() => onPick(1)}>pick</button>
      <button type="button" data-gate-back onClick={onBack}>back</button>
    </div>
  ),
}));

let estado: FunTicketState;
function Harness({ energy, tickets = 0 }: { energy: number; tickets?: number }) {
  const [s, setS] = useState<FunTicketState>({ energyPoints: energy, energyClock: { at: Date.now(), carry: 0 }, ...(tickets ? { funTickets: { batches: [{ at: Date.now() - 1000, left: tickets }] } } : {}) });
  estado = s;
  const props = {
    area: 'jogos', language: 'pt-BR', initialSheet: 'salao',
    ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
    actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
    points: 0, emblems: 0, credits: 0, onExchangeCredits: async () => false,
    tournament: {}, evolutionStage: 'rookie', onEarnPoints: () => {},
    play: {
      funSession: {
        status: (now: number) => funTicketStatus(s, now),
        onBuy: () => {
          const now = Date.now();
          if (ticketBuyRefusal(s, now)) return false;
          setS(prev => buyFunTickets(prev, now));
          return true;
        },
        onStartRound: () => {
          const now = Date.now();
          if (funTicketStatus(s, now).count < 1) return false;
          setS(prev => startFunRound(prev, now));
          return true;
        },
      },
    },
    labTab: 'evolution', onLabTab: () => {}, labContent: null, hallContent: () => null,
    guild: { saveId: 'x', metaDoDiaCumprida: false },
  } as unknown as ComponentProps<typeof AreaView>;
  return <AreaView {...props} />;
}

const q = (sel: string) => document.querySelector(sel) as HTMLElement | null;
const achar = (sel: string) => vi.waitFor(() => { const e = q(sel); if (!e) throw new Error(`sem ${sel}`); return e; }, { timeout: 20000 });
const toque = async (sel: string) => { const e = await achar(sel); await act(async () => { fireEvent.click(e); }); };
const abrirBarrage = async () => { await toque('[data-barrage-open]'); await toque('[data-gate-pick="1"]'); await screen.findByText('again', {}, { timeout: 20000 }); };

afterEach(cleanup);

describe('tickets dos minijogos: fluxo real no AreaView', () => {
  it('sem ticket, tocar em Jogar dá retorno visível e não abre nada', async () => {
    renderWithCss(<Harness energy={2} />);
    await achar('[data-barrage-open]');
    expect(q('[data-fun-tickets-nudged]')).toBeNull();
    await toque('[data-barrage-open]');
    expect(q('[data-fun-tickets-nudged]')).not.toBeNull();
    expect(q('[data-gate-pick]')).toBeNull();
    expect(estado.energyPoints).toBe(2);
  }, 60000);

  it('comprar cobra 1 energia e dá 3 tickets; comprar de novo com 3 é bloqueado', async () => {
    renderWithCss(<Harness energy={2} />);
    await toque('[data-fun-tickets-buy]');
    expect(estado.energyPoints).toBe(1);
    expect(funTicketStatus(estado, Date.now()).count).toBe(3);
    await vi.waitFor(() => { if (q('[data-fun-tickets-buy]').getAttribute('aria-disabled') !== 'true') throw new Error('ainda habilitado'); });
    await toque('[data-fun-tickets-buy]');
    expect(estado.energyPoints).toBe(1);
  }, 60000);

  it('voltar da pergunta do NPC não gasta ticket', async () => {
    renderWithCss(<Harness energy={2} tickets={3} />);
    await toque('[data-barrage-open]');
    await toque('[data-gate-back]');
    expect(funTicketStatus(estado, Date.now()).count).toBe(3);
  }, 60000);

  it('abrir gasta 1 ticket (3 → 2) e cada "jogar de novo" gasta mais 1 até acabar; sem ticket fecha com aviso', async () => {
    renderWithCss(<Harness energy={2} tickets={3} />);
    await abrirBarrage();
    expect(funTicketStatus(estado, Date.now()).count).toBe(2);
    await toque('[data-replay]');
    expect(funTicketStatus(estado, Date.now()).count).toBe(1);
    await toque('[data-replay]');
    expect(funTicketStatus(estado, Date.now()).count).toBe(0);
    expect(estado.energyPoints).toBe(2); // jogar nunca gasta energia
    await toque('[data-replay]');
    expect(q('[data-stub-game]')).toBeNull();
    expect(q('[data-fun-tickets]')).not.toBeNull();
  }, 60000);

  it('os 4 jogos reais passam o "jogar de novo" pelo onReplayRound', () => {
    const ler = (f: string) => readFileSync(resolve(__dirname, '..', f), 'utf8');
    expect(ler('DinoGame.tsx')).toContain('if (onReplayRound && !onReplayRound()) return; start(playedLevel);');
    expect(ler('SoulBarrage.tsx')).toContain('if (onReplayRound && !onReplayRound()) return; start();');
    expect(ler('Match3Game.tsx')).toContain('if (onReplayRound && !onReplayRound()) return; restart();');
    expect(ler('RPSGame.tsx').match(/if \(onReplayRound && !onReplayRound\(\)\) return; setLevel\(/g)).toHaveLength(2);
    const area = ler('nav/AreaView.tsx');
    expect(area.match(/onReplayRound=\{replayRound\}/g)).toHaveLength(4);
  });
});
