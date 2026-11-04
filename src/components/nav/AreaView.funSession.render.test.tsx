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
import { funRoundRefusal, funSessionStatus, startFunRound, type FunSessionState } from '../../utils/funSession';

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

let estado: FunSessionState;
function Harness({ energy }: { energy: number }) {
  const [s, setS] = useState<FunSessionState>({ energyPoints: energy, energyClock: { at: Date.now(), carry: 0 } });
  estado = s;
  const props = {
    area: 'jogos', language: 'pt-BR', initialSheet: 'salao',
    ownership: { ownedBackgrounds: [], equippedBackground: null, ownedFurniture: [], equippedDecor: {}, missionProgress: {} },
    actions: { onBuy: () => false, onEquip: () => {}, onEquipFurniture: () => {} },
    points: 0, emblems: 0, credits: 0, onExchangeCredits: async () => false,
    tournament: {}, evolutionStage: 'rookie', onEarnPoints: () => {},
    play: {
      funSession: {
        status: (now: number) => funSessionStatus(s, now),
        onStartRound: () => {
          const now = Date.now();
          if (funRoundRefusal(s, now)) return false;
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

describe('sessão de diversão: fluxo real no AreaView', () => {
  it('voltar da pergunta do NPC não gasta', async () => {
    renderWithCss(<Harness energy={2} />);
    await toque('[data-barrage-open]');
    await toque('[data-gate-back]');
    expect(estado.energyPoints).toBe(2);
    expect(estado.funSession).toBeUndefined();
  }, 60000);

  it('cobra ao abrir; o replay conta rodada e, gasta a sessão, cobra mais 1 energia', async () => {
    renderWithCss(<Harness energy={2} />);
    await abrirBarrage();
    expect(estado).toMatchObject({ energyPoints: 1, funSession: { rounds: 1 } });
    await toque('[data-replay]');
    await toque('[data-replay]');
    expect(estado).toMatchObject({ energyPoints: 1, funSession: { rounds: 3 } });
    await toque('[data-replay]');
    expect(estado).toMatchObject({ energyPoints: 0, funSession: { rounds: 1 } });
    expect(q('[data-stub-game]')).not.toBeNull();
  }, 60000);

  it('replay sem energia fecha o jogo e volta ao Salão com o aviso em destaque', async () => {
    renderWithCss(<Harness energy={1} />);
    await abrirBarrage();
    await toque('[data-replay]');
    await toque('[data-replay]');
    await toque('[data-replay]');
    expect(q('[data-stub-game]')).toBeNull();
    const aviso = await achar('[data-fun-session="blocked"]');
    expect(aviso.getAttribute('role')).toBe('alert');
    expect(aviso.textContent).toContain('Sem energia');
    expect(estado.energyPoints).toBe(0);
  }, 60000);

  it('tocar em Jogar bloqueado dá retorno visível e não abre nada', async () => {
    renderWithCss(<Harness energy={0} />);
    await achar('[data-barrage-open]');
    expect(q('[data-fun-nudged]')).toBeNull();
    const subir = vi.fn();
    Element.prototype.scrollTo = subir as never;
    await toque('[data-barrage-open]');
    expect(q('[data-fun-nudged]')).not.toBeNull();
    // Com a lista rolada o aviso estaria fora da tela: o toque sobe a lista até ele.
    expect(subir).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(q('[data-gate-pick]')).toBeNull();
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
