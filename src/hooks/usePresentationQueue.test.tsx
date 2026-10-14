// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act, cleanup, render, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { usePresentationQueue } from './usePresentationQueue';
import { closeTopBackLayer } from '../utils/backStack';
import { PRESENTATION_IDLE, type PresentationId, type PresentationReady } from '../utils/presentationQueue';
import { PresentationSlot } from '../components/PresentationSlot';
import { pendingBuildingIntros, markBuildingIntroSeen, seedBuildingIntrosSeen } from '../utils/buildingIntro';
import { levelUpPending, applyLevelUpCelebrated } from '../utils/levelUp';
import { bondLevelFor } from '../utils/bond';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('usePresentationQueue', () => {
  it('um por vez, na ordem; fechar o atual faz entrar o próximo', () => {
    const { result, rerender } = renderHook((p: { ready: PresentationReady }) => usePresentationQueue({ ready: p.ready }), {
      initialProps: { ready: { checkIn: true, dailyReport: true, levelUp: true } as PresentationReady },
    });
    expect(result.current.current).toBe('levelUp');
    rerender({ ready: { checkIn: true, dailyReport: true } });
    expect(result.current.current).toBe('dailyReport');
    rerender({ ready: { checkIn: true } });
    expect(result.current.current).toBe('checkIn');
    rerender({ ready: {} });
    expect(result.current.current).toBe(PRESENTATION_IDLE);
  });

  it('quem está na tela não é expulso por um mais prioritário que chega depois', () => {
    const { result, rerender } = renderHook((p: { ready: PresentationReady }) => usePresentationQueue({ ready: p.ready }), {
      initialProps: { ready: { checkIn: true } as PresentationReady },
    });
    expect(result.current.current).toBe('checkIn');
    rerender({ ready: { checkIn: true, levelUp: true, dailyReport: true } });
    expect(result.current.current).toBe('checkIn');
    rerender({ ready: { levelUp: true, dailyReport: true } });
    expect(result.current.current).toBe('levelUp');
  });

  it('`onShow` roda UMA vez por entrada na tela (não a cada render), e um erro nele não trava', () => {
    const onShow = vi.fn((id: PresentationId) => { if (id === 'levelUp') throw new Error('boom'); });
    const { result, rerender } = renderHook((p: { ready: PresentationReady }) => usePresentationQueue({ ready: p.ready, onShow }), {
      initialProps: { ready: { levelUp: true, dailyReport: true } as PresentationReady },
    });
    rerender({ ready: { levelUp: true, dailyReport: true } });
    rerender({ ready: { levelUp: true, dailyReport: true } });
    expect(onShow).toHaveBeenCalledTimes(1);
    expect(onShow).toHaveBeenLastCalledWith('levelUp');
    expect(result.current.current).toBe('levelUp'); // lançou, mas segue na tela
    rerender({ ready: { dailyReport: true } });
    expect(onShow).toHaveBeenCalledTimes(2);
    expect(onShow).toHaveBeenLastCalledWith('dailyReport');
  });

  it('o VOLTAR do Android fecha o item da tela e a fila avança', () => {
    const fechados: PresentationId[] = [];
    function Harness() {
      const [ready, setReady] = useState<PresentationReady>({ dailyReport: true, checkIn: true });
      const q = usePresentationQueue({ ready, onDismiss: id => { fechados.push(id); setReady(r => ({ ...r, [id]: false })); } });
      return <div data-testid="atual">{q.current}</div>;
    }
    const { getByTestId } = render(<Harness />);
    expect(getByTestId('atual').textContent).toBe('dailyReport');
    act(() => { expect(closeTopBackLayer()).toBe(true); });
    expect(getByTestId('atual').textContent).toBe('checkIn');
    act(() => { closeTopBackLayer(); });
    expect(getByTestId('atual').textContent).toBe(PRESENTATION_IDLE);
    expect(fechados).toEqual(['dailyReport', 'checkIn']);
    expect(closeTopBackLayer()).toBe(false); // sem item, sem camada de voltar
  });

  it('um fechamento que LANÇA marca o item como falho e a fila avança', () => {
    function Harness() {
      const q = usePresentationQueue({
        ready: { levelUp: true, dream: true },
        onDismiss: id => { if (id === 'levelUp') throw new Error('quebrou'); },
      });
      return <div data-testid="atual">{q.current}</div>;
    }
    const { getByTestId } = render(<Harness />);
    expect(getByTestId('atual').textContent).toBe('levelUp');
    act(() => { closeTopBackLayer(); });
    expect(getByTestId('atual').textContent).toBe('dream');
  });

  it('`fail` pula o item, tenta o fechamento dele e a fila continua', () => {
    const onDismiss = vi.fn();
    const { result } = renderHook(() => usePresentationQueue({ ready: { dailyReport: true, checkIn: true }, onDismiss }));
    expect(result.current.current).toBe('dailyReport');
    act(() => result.current.fail('dailyReport'));
    expect(result.current.current).toBe('checkIn');
    expect(onDismiss).toHaveBeenCalledWith('dailyReport');
  });
});

describe('PresentationSlot: erro de render e chunk que não carrega não travam a fila', () => {
  it('um item que lança no render vira `onFail` e o resto da árvore segue de pé', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    function Bomba(): never { throw new Error('render quebrou'); }
    const onFail = vi.fn();
    const { container } = render(<div><PresentationSlot id="dream" onFail={onFail}><Bomba /></PresentationSlot><p data-ok>ok</p></div>);
    await act(async () => { await Promise.resolve(); });
    expect(onFail).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-ok]')).not.toBeNull();
    spy.mockRestore();
  });

  it('um chunk que nunca carrega estoura o tempo de segurança (8 s) e chama `onFail` uma vez', () => {
    vi.useFakeTimers();
    const onFail = vi.fn();
    const Pendente = (() => { throw new Promise(() => {}); }) as unknown as () => null;
    render(<PresentationSlot id="dailyReport" onFail={onFail}><Pendente /></PresentationSlot>);
    vi.advanceTimersByTime(7_900);
    expect(onFail).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(onFail).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// O CENÁRIO EXATO DO DONO (14/10/2026): "começou um dia novo, subiu de nível, apareceu um modal de um mapa e o de se
// comprometer com as três tarefas, e quebrou tudo. Fechei o jogo, abri de novo, veio um modal, depois outro modal do mapa."
// O save abaixo usa as MESMAS funções puras do App (`pendingBuildingIntros`, `markBuildingIntroSeen`, `levelUpPending`,
// `applyLevelUpCelebrated`, `bondLevelFor`) e a mesma regra "marca ao MOSTRAR"; "reiniciar" = desmontar tudo e montar de
// novo com o save e o "visto do aparelho" que sobraram.
// ---------------------------------------------------------------------------
interface Save { totalXP: number; lastCelebratedLevel: number; buildingIntrosSeen: readonly string[]; checkInDone: boolean }
interface Device { reportShownFor: string | null }

let ultimoSave: Save | null = null;

function Jogo({ save0, device, log }: { save0: Save; device: Device; log: PresentationId[] }) {
  const [save, setSave] = useState(save0);
  ultimoSave = save;
  const [levelUpShown, setLevelUpShown] = useState<{ from: number; to: number } | null>(null);
  const [introShown, setIntroShown] = useState<readonly string[]>([]);
  const [reportOpen, setReportOpen] = useState(() => device.reportShownFor !== 'dia-2'); // o relatório do dia novo
  const [checkInOpen, setCheckInOpen] = useState(() => !save0.checkInDone);
  const levelUpEvent = levelUpPending(save.totalXP, save.lastCelebratedLevel);
  const pend = pendingBuildingIntros(save.buildingIntrosSeen, bondLevelFor(save.totalXP));
  const q = usePresentationQueue({
    ready: {
      levelUp: Boolean(levelUpEvent) || levelUpShown !== null,
      dailyReport: reportOpen,
      buildingIntro: introShown.length > 0 || pend.length > 0,
      checkIn: checkInOpen,
    },
    // ao MOSTRAR: grava o "visto" (a mesma regra do App)
    onShow: id => {
      log.push(id);
      if (id === 'levelUp' && levelUpEvent) {
        setLevelUpShown(levelUpEvent);
        setSave(s => ({ ...s, lastCelebratedLevel: applyLevelUpCelebrated({ lastCelebratedLevel: s.lastCelebratedLevel, energyPoints: 0, evolutionStage: 'rookie' }, levelUpEvent.to).lastCelebratedLevel ?? s.lastCelebratedLevel }));
      }
      if (id === 'dailyReport') device.reportShownFor = 'dia-2';
      if (id === 'buildingIntro' && pend.length > 0) {
        const ids = pend;
        setIntroShown(ids);
        setSave(s => ({ ...s, buildingIntrosSeen: ids.reduce<readonly string[]>((a, b) => markBuildingIntroSeen(a, b) as readonly string[], s.buildingIntrosSeen) }));
      }
    },
  });
  const fecha = () => {
    if (q.current === 'levelUp') setLevelUpShown(null);
    if (q.current === 'dailyReport') setReportOpen(false);
    if (q.current === 'buildingIntro') setIntroShown([]);
    if (q.current === 'checkIn') { setCheckInOpen(false); setSave(s => ({ ...s, checkInDone: true })); }
  };
  return <button type="button" data-testid="atual" onClick={fecha}>{q.current}</button>;
}

describe('cenário do dono: dia novo + level-up + prédio do mapa + compromisso das tarefas, tudo ao mesmo tempo', () => {
  const inicial: Save = { totalXP: 100000, lastCelebratedLevel: 1, buildingIntrosSeen: seedBuildingIntrosSeen(1), checkInDone: false };
  const toca = (el: HTMLElement) => act(() => { el.click(); });

  it('a sequência é level-up -> resumo do dia -> mapa -> compromisso, sem sobreposição; reiniciar NÃO repete o que foi mostrado', () => {
    expect(pendingBuildingIntros(inicial.buildingIntrosSeen, bondLevelFor(inicial.totalXP)).length).toBeGreaterThan(0);
    expect(levelUpPending(inicial.totalXP, inicial.lastCelebratedLevel)).not.toBeNull();
    const device: Device = { reportShownFor: null };
    const log1: PresentationId[] = [];
    const a = render(<Jogo save0={inicial} device={device} log={log1} />);
    const atual = () => a.getByTestId('atual');
    expect(atual().textContent).toBe('levelUp');
    toca(atual());
    expect(atual().textContent).toBe('dailyReport');
    toca(atual());
    expect(atual().textContent).toBe('buildingIntro');
    // --- o dono fecha o jogo NO MEIO do mapa (sem terminar) e abre de novo ---
    const salvo = ultimoSave!;
    a.unmount();

    const log2: PresentationId[] = [];
    const b = render(<Jogo save0={salvo} device={device} log={log2} />);
    // o level-up, o resumo e o mapa JÁ foram mostrados: só sobra o compromisso, que ainda não foi respondido
    expect(b.getByTestId('atual').textContent).toBe('checkIn');
    expect(log2).toEqual(['checkIn']);
    toca(b.getByTestId('atual'));
    expect(b.getByTestId('atual').textContent).toBe(PRESENTATION_IDLE);
    expect(log1).toEqual(['levelUp', 'dailyReport', 'buildingIntro']);
  });

  it('REPRODUÇÃO DO BUG ANTIGO: marcar "visto" só ao FECHAR faz o mapa voltar na abertura seguinte', () => {
    // o desenho antigo: `buildingIntrosSeen` só era gravado em "Depois"/"Ir lá" (ao fechar)
    const seenAoFechar = inicial.buildingIntrosSeen;
    const antes = pendingBuildingIntros(seenAoFechar, bondLevelFor(inicial.totalXP));
    expect(antes.length).toBeGreaterThan(0);
    // fechou o app no meio: nada foi gravado, então a próxima abertura traz TODOS de novo
    expect(pendingBuildingIntros(seenAoFechar, bondLevelFor(inicial.totalXP))).toEqual(antes);
    // o desenho novo grava ao MOSTRAR: a próxima abertura não traz nenhum
    const seenAoMostrar = antes.reduce<readonly string[]>((a, id) => markBuildingIntroSeen(a, id) as readonly string[], seenAoFechar);
    expect(pendingBuildingIntros(seenAoMostrar, bondLevelFor(inicial.totalXP))).toEqual([]);
  });

  it('REPRODUÇÃO DO BUG ANTIGO: a cadeia recalculada a cada render expulsava o resumo do dia da tela', () => {
    // cadeia antiga (App.tsx antes de 14/10/2026): o prédio novo (2º) ficava ACIMA do resumo do dia
    const antiga = (r: PresentationReady) => (r.buildingIntro ? 'buildingIntro' : r.dailyReport ? 'dailyReport' : r.checkIn ? 'checkIn' : 'welcome');
    expect(antiga({ dailyReport: true })).toBe('dailyReport'); // a pessoa está lendo o resumo...
    expect(antiga({ dailyReport: true, buildingIntro: true })).toBe('buildingIntro'); // ...e o mapa DESMONTA o resumo
    // a fila nova: quem está na tela fica
    const { result, rerender } = renderHook((p: { ready: PresentationReady }) => usePresentationQueue({ ready: p.ready }), {
      initialProps: { ready: { dailyReport: true } as PresentationReady },
    });
    rerender({ ready: { dailyReport: true, buildingIntro: true } });
    expect(result.current.current).toBe('dailyReport');
  });
});
