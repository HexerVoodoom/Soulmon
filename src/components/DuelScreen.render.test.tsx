// @vitest-environment jsdom
/**
 * A tela do duelo no núcleo v3 (PR5, contexto §2.19): a luta corre em TEMPO REAL com a semente e a ficha do
 * servidor; a torcida é por BALDE de 3 s; ao fim os toques de cada balde vão para o `match`.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { DuelScreen, cheerQuality } from './DuelScreen';
import { simulatePvp, DUEL_CHEER_BUCKETS, type DuelSide } from '../utils/combate/duel';
import { PVP_HP_SCALE } from '../utils/combate/fight';
import { CHEER } from '../utils/combate/specials';
import { duelSide } from '../../functions/api/_duel.js';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const SEED = 123;
const lado = (perfectDays = 3, evolutionStage = 'rookie'): DuelSide => duelSide({ evolutionStage, perfectDays }) as unknown as DuelSide;

/** A 1ª semente em que OS DOIS soltam o especial antes do 1º nocaute (para ver a forma do especial de cada um). */
function sementeComEspecialDosDois(): number {
  for (let s = 1; s < 2000; s++) {
    const ev = simulatePvp({ me: lado(), opp: lado(), seed: s, taps: [] }).events;
    const ko = ev.findIndex(e => e.kind === 'ko');
    const ate = ev.slice(0, ko);
    if (ate.some(e => e.kind === 'cast' && e.side === 0) && ate.some(e => e.kind === 'cast' && e.side === 1)) return s;
  }
  throw new Error('nenhuma semente com o especial dos dois');
}

function montar(onDone = vi.fn(), onClose = vi.fn(), oppElement = 'agua', me: DuelSide = lado(), opp: DuelSide = lado(), seed = SEED) {
  const r = render(<DuelScreen me={me} opp={opp} seed={seed} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt petElement="fogo" oppElement={oppElement} onDone={onDone} onClose={onClose} />);
  const camada = () => r.container.querySelector('[data-torcida-layer]') as HTMLElement;
  return { onDone, onClose, camada };
}
/** Corre o relógio de 300 em 300 ms até a luta terminar; devolve o tempo gasto (ms). */
const correr = (onDone: ReturnType<typeof vi.fn>) => {
  let t = 0;
  for (let i = 0; i < 600 && !onDone.mock.calls.length; i++) { act(() => { vi.advanceTimersByTime(300); }); t += 300; }
  return t;
};
const gauge = () => document.querySelector('[data-cheer-mascot]') as HTMLElement;
const ratio = () => parseFloat(gauge().getAttribute('data-torcida-ratio') ?? 'NaN');

describe('DuelScreen — a cena em tela cheia', () => {
  it('é a CENA do combate: lutadores, HP E ENERGIA em cima de cada um, X no canto, mascote da torcida, sem texto explicativo', () => {
    vi.useFakeTimers();
    montar();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"]')?.textContent).toContain('Pet');
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain('Rival');
    expect(document.querySelectorAll('[data-stage-energy]').length).toBe(2); // a energia de cada lutador
    expect(document.querySelector('[data-stage-close]')).not.toBeNull();
    expect(document.querySelector('[data-cheer-mascot]')).not.toBeNull();
    expect(screen.queryByText(/lutam sozinhos/i)).toBeNull();
    expect(document.querySelector('[data-info-tip]')).toBeNull(); // A7: nenhum "?" dentro da luta
  });

  it('a vida mostrada é a da ficha do SERVIDOR × PVP_HP_SCALE (nada de HP calculado na tela)', () => {
    vi.useFakeTimers();
    const me = lado(3), opp = lado(10, 'champion-power');
    montar(vi.fn(), vi.fn(), 'agua', me, opp);
    expect(document.querySelector('[data-stage-plate="me"]')?.textContent).toContain(`${Math.round(me.combatant.hp * PVP_HP_SCALE)}/`);
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain(`${Math.round(opp.combatant.hp * PVP_HP_SCALE)}/`);
  });

  it('a luta corre em TEMPO REAL: dura o que o núcleo diz (até o 1º nocaute) mais a pausa final, e entrega UMA vez', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    const sim = simulatePvp({ me: lado(), opp: lado(), seed: SEED, taps: [] });
    const duracao = Math.min(sim.timeMe, sim.timeOpp) * 1000;
    // Antes do 1º golpe nada caiu: as duas barras estão cheias.
    act(() => { vi.advanceTimersByTime(300); });
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain(`${Math.round(lado().combatant.hp * PVP_HP_SCALE)}/`);
    const gasto = correr(onDone) + 300;
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(gasto).toBeGreaterThan(duracao - 600);
    expect(gasto).toBeLessThan(duracao + 3500);
    expect(gasto / 1000).toBeGreaterThan(20);
    expect(gasto / 1000).toBeLessThan(90);
  });

  it('o golpe é desenhado com a arte do ELEMENTO de quem ataca', () => {
    vi.useFakeTimers();
    montar();
    act(() => { vi.advanceTimersByTime(4000); });
    const fx = [...document.querySelectorAll('[data-stage-fx] img')].map(i => i.getAttribute('src') ?? '');
    expect(fx.length).toBeGreaterThan(0);
    for (const src of fx) expect(src).toMatch(/fx-(fogo|agua)-(cast|aura|slash|impact|defended|orb)/);
  });

  /** Corre a luta toda e anota quem investiu (lunge) e quem atirou (projétil), por lado. */
  function observar(oppElement: string) {
    vi.useFakeTimers();
    const { onDone } = montar(vi.fn(), vi.fn(), oppElement, lado(), lado(), sementeComEspecialDosDois());
    const v = { oponenteInvestiu: false, donoInvestiu: false, atirou: false };
    for (let i = 0; i < 1200 && !onDone.mock.calls.length; i++) {
      act(() => { vi.advanceTimersByTime(100); });
      if (document.querySelector('[data-stage-sprite="foe"]')?.closest('.sm-bs-lunge')) v.oponenteInvestiu = true;
      if (document.querySelector('[data-stage-sprite="me"]')?.closest('.sm-bs-lunge')) v.donoInvestiu = true;
      if (document.querySelector('.sm-bs-fly')) v.atirou = true;
    }
    return v;
  }

  it('R8: a forma do golpe vem da SKILL (arquétipo do elemento): oponente físico investe, à distância atira; o círculo de cast só no especial', () => {
    // fogo (dono): básica à distância, especial físico. marcial (oponente): físico nas duas — nunca atira.
    const fisico = observar('marcial');
    expect(fisico.oponenteInvestiu).toBe(true);
    expect(fisico.donoInvestiu).toBe(true); // o especial físico do fogo
    cleanup(); vi.useRealTimers();
    // agua (oponente): à distância nas duas — nunca investe.
    const distancia = observar('agua');
    expect(distancia.oponenteInvestiu).toBe(false);
    expect(distancia.atirou).toBe(true);
  });

  it('a forma do golpe do OPONENTE vem da ficha dele (`opp.fx`), não do elemento: combate_fisico investe mesmo com o elemento à distância', () => {
    vi.useFakeTimers();
    const opp = { ...lado(), fx: { basica: 'combate_fisico', especial: 'combate_fisico' } } as DuelSide;
    const { onDone } = montar(vi.fn(), vi.fn(), 'agua', lado(), opp);
    let investiu = false;
    for (let i = 0; i < 1200 && !onDone.mock.calls.length; i++) {
      act(() => { vi.advanceTimersByTime(100); });
      if (document.querySelector('[data-stage-sprite="foe"]')?.closest('.sm-bs-lunge')) investiu = true;
    }
    expect(investiu).toBe(true);
  });

  it('a energia sobe na barra de cada um (dado + sofrido + tempo): depois de alguns golpes as barras não estão vazias', () => {
    vi.useFakeTimers();
    montar();
    act(() => { vi.advanceTimersByTime(9000); });
    const barras = [...document.querySelectorAll('[data-stage-energy]')].map(b => Number(b.getAttribute('aria-valuenow')));
    expect(barras.every(v => v > 0)).toBe(true);
  });

  it('PvP: o ESPECIAL sai DIRETO — sem anel, sem janela de esquiva, sem botão nenhum de mecânica', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    let viuEspecial = false;
    for (let i = 0; i < 600 && !onDone.mock.calls.length; i++) {
      act(() => { vi.advanceTimersByTime(200); });
      if (document.querySelector('[data-stage-fx="sm-bs-pop"] img[src*="aura"]')) viuEspecial = true;
      expect(document.querySelector('[data-stage-ring]')).toBeNull();
      expect(document.querySelector('[data-dodge-button]')).toBeNull();
    }
    expect(viuEspecial).toBe(true); // o fantasma e o pet soltaram o especial (aura), sem nenhuma mecânica
  });
});

describe('DuelScreen — torcida por BALDE de 3 s', () => {
  it('a torcida por TIMING não tem UI e o anel não existe mais na tela', () => {
    vi.useFakeTimers();
    // O código antigo continua exportado (reaproveitável), mas sem UI.
    expect(cheerQuality(0)).toBe(1);
    expect(cheerQuality(1000)).toBe(0);
    montar();
    expect(document.querySelector('[data-duel-cheer]')).toBeNull();
  });

  it('sem tocar: luta sozinha e entrega os baldes vazios (a torcida só soma)', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    correr(onDone);
    expect(onDone).toHaveBeenCalledTimes(1);
    const taps = onDone.mock.calls[0][0] as number[];
    expect(taps.length).toBeLessThanOrEqual(DUEL_CHEER_BUCKETS);
    expect(taps.every(n => n === 0)).toBe(true);
  });

  it('tocar em qualquer lugar enche a barra de cheer e vira toques no 1º balde, com teto de 16 por balde', () => {
    vi.useFakeTimers();
    const { onDone, camada } = montar();
    for (let i = 0; i < 40; i++) fireEvent.pointerDown(camada());
    expect(ratio()).toBeCloseTo(CHEER.tapsCapPerBucket / CHEER.tapsFull, 1); // o teto por balde limita o que conta (16 de 24)
    correr(onDone);
    const taps = onDone.mock.calls[0][0] as number[];
    expect(taps[0]).toBe(CHEER.tapsCapPerBucket); // 40 toques, mas o teto por balde vale
    expect(taps.slice(1).every(n => n === 0)).toBe(true);
  });

  it('cada balde de 3 s tem a sua conta: 10 toques no 1º, 5 no 2º', () => {
    vi.useFakeTimers();
    const { onDone, camada } = montar();
    for (let i = 0; i < 10; i++) fireEvent.pointerDown(camada());
    act(() => { vi.advanceTimersByTime(CHEER.bucketSeconds * 1000 + 200); }); // o 1º balde fecha
    for (let i = 0; i < 5; i++) fireEvent.pointerDown(camada());
    correr(onDone);
    const taps = onDone.mock.calls[0][0] as number[];
    expect(taps.slice(0, 3)).toEqual([10, 5, 0]);
  });

  it('a barra de cheer é LENTA: 24 toques para encher (16 num balde não enchem)', () => {
    vi.useFakeTimers();
    const { camada } = montar();
    for (let i = 0; i < CHEER.tapsCapPerBucket; i++) fireEvent.pointerDown(camada());
    expect(ratio()).toBeLessThan(1);
    expect(CHEER.tapsFull).toBe(24);
  });

  it('o MASCOTE também torce (teclado e leitor de tela) e grita com o balão', () => {
    vi.useFakeTimers();
    montar();
    const btn = screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' }) as HTMLButtonElement;
    fireEvent.click(btn);
    expect(ratio()).toBeGreaterThan(0);
    expect(document.querySelector('[data-cheer-bubble]')?.textContent).toBe('VAI!');
  });

  it('o que a tela manda é o que o servidor recalcula: os mesmos baldes dão a mesma luta, e a tela termina no HP dela', () => {
    vi.useFakeTimers();
    const me = lado(), opp = lado();
    const { onDone, camada } = montar(vi.fn(), vi.fn(), 'agua', me, opp);
    for (let i = 0; i < 14; i++) fireEvent.pointerDown(camada());
    // o 1º balde tem 14 toques; deixa o 2º com mais 16 (a luta com torcida muda depois do fecho)
    act(() => { vi.advanceTimersByTime(CHEER.bucketSeconds * 1000 + 100); });
    for (let i = 0; i < 16; i++) fireEvent.pointerDown(camada());
    correr(onDone);
    const taps = onDone.mock.calls[0][0] as number[];
    const servidor = simulatePvp({ me, opp, seed: SEED, taps });
    expect(servidor.events.length).toBeGreaterThan(10);
    const maxMe = Math.round(me.combatant.hp * PVP_HP_SCALE);
    const maxOpp = Math.round(opp.combatant.hp * PVP_HP_SCALE);
    if (servidor.winner === 'me') {
      expect(document.querySelector('[data-stage-plate="me"]')?.textContent).toContain(`${Math.round(servidor.hpMe * maxMe)}/`);
    } else if (servidor.winner === 'opp') {
      expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain(`${Math.round(servidor.hpOpp * maxOpp)}/`);
    }
  });

  it('o botão de sair não vira torcida: o toque é dele — e sair pede CONFIRMAÇÃO (conta como derrota)', () => {
    vi.useFakeTimers();
    const { onClose } = montar();
    const sair = screen.getByRole('button', { name: 'Sair do duelo' });
    fireEvent.pointerDown(sair);
    fireEvent.click(sair);
    expect(onClose).not.toHaveBeenCalled();
    expect(ratio()).toBe(0);
    expect(document.querySelector('[data-stage-confirm]')?.textContent).toMatch(/derrota/i);
    fireEvent.click(document.querySelector('[data-stage-confirm-leave]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('com a confirmação aberta a luta PAUSA (o relógio e a torcida param), e "Continuar" a retoma', () => {
    vi.useFakeTimers();
    const { onDone, camada } = montar();
    fireEvent.click(screen.getByRole('button', { name: 'Sair do duelo' }));
    act(() => { vi.advanceTimersByTime(60000); });
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.pointerDown(camada()); // pausado: toque não conta
    expect(ratio()).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    correr(onDone);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('sair antes do fim NÃO entrega o resultado depois (quem sai fecha o duelo como derrota)', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    const sim = simulatePvp({ me: lado(), opp: lado(), seed: SEED, taps: [] });
    act(() => { vi.advanceTimersByTime(Math.min(sim.timeMe, sim.timeOpp) * 1000 + 200); }); // o nocaute assentou, a pausa final corre
    cleanup(); // a tela some antes do `onDone`
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onDone).not.toHaveBeenCalled();
  });
});
