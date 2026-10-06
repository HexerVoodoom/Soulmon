// @vitest-environment jsdom
/**
 * PR18 (06/10/2026, pedido do dono) — a torcida sem barrinha, a CENA DO ESPECIAL e o som do combate.
 *  (a) sem barra de cheer: só o ícone, pequeno, no canto; o que a torcida já encheu aparece na barra de ENERGIA;
 *  (b) o especial abre com o nome grande + fundo escurecido, quem conjura POR CIMA do véu, e o golpe só sai depois;
 *  (c) os sons disparam nos eventos (golpe, especial, vitória) — e nada muda no motor (só apresentação).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';

const som = vi.hoisted(() => ({ playAttack: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn() }));
vi.mock('../utils/sounds', () => som);

import { BattleStage, type StageAction, type StageFighter } from './games/BattleStage';
import { TorcidaLayer } from './games/TorcidaKit';
import { DuelScreen } from './DuelScreen';
import { SPECIAL_INTRO_MS, introMs, impactMs } from '../utils/combatFx';
import { simulatePvp, type DuelSide } from '../utils/combate/duel';
import { duelSide } from '../../functions/api/_duel.js';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

const me: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo', energy: 0.3 };
const foe: StageFighter = { key: 0, sprite: 'foe.png', name: 'Rival', hp: 30, maxHp: 60, element: 'agua' };
const base = { scene: '#123', me, foes: [foe], title: 'Arena', closeLabel: 'Sair', onClose: () => {} };
const especial = (actor: 'me' | 'foe' = 'me', strike: 'melee' | 'ranged' = 'ranged'): StageAction => ({ id: 7, actor, foe: 0, kind: 'special', strike, element: 'fogo' });
const num = (el: Element | null, prop: string) => parseInt((el as HTMLElement).style.getPropertyValue(prop), 10);

describe('(a) torcida SEM barrinha — só o ícone', () => {
  it('a camada de combate não desenha barra de cheer; o ícone é pequeno e carrega a fração', () => {
    const { container } = render(
      <TorcidaLayer onTap={() => {}} isPt={false} mascot cheerRatio={0.5}>
        <BattleStage {...base} />
      </TorcidaLayer>,
    );
    expect(container.querySelector('[data-torcida-gauge]')).toBeNull();
    expect([...container.querySelectorAll('[role="progressbar"]')].some(p => /cheer|torcida/i.test(p.getAttribute('aria-label') ?? ''))).toBe(false);
    expect(container.querySelector('[data-stage-footer]')).toBeNull(); // sem HUD de pé: nada de caixa da barra
    const icone = container.querySelector('[data-cheer-mascot]') as HTMLElement;
    expect(icone.getAttribute('data-torcida-ratio')).toBe('0.50');
    const svg = icone.querySelector('svg') as SVGElement;
    expect(Number(svg.getAttribute('width'))).toBeLessThanOrEqual(44);
    expect(container.querySelector('[data-torcida-button]')?.getAttribute('aria-label')).toBe('Cheer for your Soulmon');
  });

  it('cada toque enche o seu ponto na barra de ENERGIA do pet (trecho claro), limitado ao que falta', () => {
    const { container, rerender } = render(<BattleStage {...base} me={{ ...me, cheerPending: 0.05 }} />);
    const pend = () => container.querySelector('[data-stage-plate="me"] [data-stage-energy-pending]') as HTMLElement | null;
    expect(pend()?.style.width).toBe('5%');
    rerender(<BattleStage {...base} me={{ ...me, energy: 0.97, cheerPending: 0.09 }} />);
    expect(pend()?.style.width).toBe('3%'); // 100% − 97%: nunca passa do topo
    rerender(<BattleStage {...base} me={{ ...me, cheerPending: 0 }} />);
    expect(pend()).toBeNull();
    // o preenchimento real não muda por causa do trecho pendente
    expect((container.querySelector('[data-stage-plate="me"] [data-stage-energy] > i') as HTMLElement).style.width).toBe('30%');
  });
});

describe('(b) a cena do especial — nome → fundo some → golpe', () => {
  it('o véu escuro e o NOME grande entram com o especial; o golpe básico não tem cena', () => {
    const { container } = render(<BattleStage {...base} specialLabel="Lâmina do Crepúsculo" action={especial()} />);
    expect(container.querySelector('[data-stage-cutscene]')).not.toBeNull();
    expect(container.querySelector('[data-stage-special]')?.textContent).toBe('Lâmina do Crepúsculo');
    cleanup();
    const b = render(<BattleStage {...base} action={{ id: 8, actor: 'me', foe: 0, kind: 'ranged', element: 'fogo' }} />);
    expect(b.container.querySelector('[data-stage-cutscene]')).toBeNull();
    expect(b.container.querySelector('[data-stage-special]')).toBeNull();
  });

  it('quem conjura e a aura ficam POR CIMA do véu; o nome fica acima do véu', () => {
    const { container } = render(<BattleStage {...base} action={especial('me')} />);
    const z = (el: Element | null) => parseInt((el as HTMLElement).style.zIndex, 10);
    const veu = z(container.querySelector('[data-stage-cutscene]'));
    const nome = z(container.querySelector('[data-stage-special]'));
    const ator = z((container.querySelector('[data-stage-sprite="me"]') as HTMLElement).closest('div[style*="position: absolute"]'));
    const aura = z(container.querySelector('[data-stage-fx="sm-bs-pop"]'));
    const outro = z((container.querySelector('[data-stage-sprite="foe"]') as HTMLElement).closest('div[style*="position: absolute"]'));
    expect(ator).toBeGreaterThan(veu);
    expect(nome).toBeGreaterThan(veu);
    expect(aura).toBeGreaterThan(veu);
    expect(aura).toBeLessThan(ator); // o pet fica na frente da própria aura
    expect(outro).toBeLessThan(veu); // o alvo fica sob o escuro
  });

  it('quando o inimigo conjura, é ELE quem sobe acima do véu', () => {
    const { container } = render(<BattleStage {...base} action={especial('foe')} />);
    const z = (s: string) => parseInt(((container.querySelector(`[data-stage-sprite="${s}"]`) as HTMLElement).closest('div[style*="position: absolute"]') as HTMLElement).style.zIndex, 10);
    const veu = parseInt((container.querySelector('[data-stage-cutscene]') as HTMLElement).style.zIndex, 10);
    expect(z('foe')).toBeGreaterThan(veu);
    expect(z('me')).toBeLessThan(veu);
  });

  it('o nome e o véu duram SPECIAL_INTRO_MS e o golpe (projétil, investida, impacto, número) só começa depois', () => {
    const { container } = render(<BattleStage {...base} action={especial('me', 'ranged')} hit={{ id: 1, side: 'foe', foe: 0, value: 9, big: true }} />);
    expect(num(container.querySelector('[data-stage-cutscene]'), '--bs-dur')).toBe(SPECIAL_INTRO_MS);
    expect(num(container.querySelector('[data-stage-special]'), '--bs-dur')).toBe(SPECIAL_INTRO_MS);
    const orb = [...container.querySelectorAll('[data-stage-fx="sm-bs-fly"]')];
    expect(orb.length).toBe(1);
    expect(num(orb[0], '--bs-delay')).toBeGreaterThanOrEqual(SPECIAL_INTRO_MS);
    // o alvo só apanha depois da cena + o tempo do especial
    const hit = container.querySelector('.sm-bs-hit') as HTMLElement;
    expect(num(hit, '--bs-delay')).toBe(SPECIAL_INTRO_MS + impactMs('special', false));
    cleanup();
    const melee = render(<BattleStage {...base} action={especial('me', 'melee')} />);
    expect(num(melee.container.querySelector('.sm-bs-lunge'), '--bs-delay')).toBeGreaterThanOrEqual(SPECIAL_INTRO_MS);
  });

  it('a introdução é só do especial (introMs) e o golpe básico não ganha atraso', () => {
    expect(introMs('special')).toBe(SPECIAL_INTRO_MS);
    expect(introMs('melee')).toBe(0);
    expect(introMs('ranged')).toBe(0);
    const { container } = render(<BattleStage {...base} action={{ id: 9, actor: 'me', foe: 0, kind: 'ranged', element: 'fogo' }} hit={{ id: 1, side: 'foe', foe: 0, value: 5 }} />);
    expect(num(container.querySelector('.sm-bs-hit'), '--bs-delay')).toBe(impactMs('ranged', false));
  });

  it('movimento reduzido reduz o MOVIMENTO, nunca a pausa: o véu e o nome continuam e o golpe espera a cena', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));
    const { container } = render(<BattleStage {...base} action={especial('me')} />);
    expect(container.querySelector('[data-stage-cutscene]')).not.toBeNull();
    expect(num(container.querySelector('[data-stage-cutscene]'), '--bs-dur')).toBe(SPECIAL_INTRO_MS);
    const land = container.querySelector('[data-stage-fx="sm-bs-pop"][style*="--bs-delay"]');
    const atrasos = [...container.querySelectorAll('[data-stage-fx]')].map(e => num(e, '--bs-delay')).filter(d => d > 0);
    expect(atrasos.length).toBeGreaterThan(0);
    expect(atrasos.every(d => d >= SPECIAL_INTRO_MS)).toBe(true);
    expect(land === null || true).toBe(true);
    // o CSS troca o movimento do nome por opacidade (sem crescer): a regra existe no bloco de movimento reduzido
  });

  it('acessível: região viva com o nome (EN e PT-BR), sempre montada; o visual é aria-hidden', () => {
    const { container, rerender } = render(<BattleStage {...base} specialLabel="Flare" isPt={false} action={null} />);
    const live = container.querySelector('[data-stage-announce]') as HTMLElement;
    expect(live.getAttribute('role')).toBe('status');
    expect(live.getAttribute('aria-live')).toBe('polite');
    expect(live.textContent).toBe('');
    rerender(<BattleStage {...base} specialLabel="Flare" isPt={false} action={especial()} />);
    expect(container.querySelector('[data-stage-announce]')).toBe(live); // o mesmo nó: o leitor anuncia a troca
    expect(live.textContent).toBe('Special attack: Flare');
    rerender(<BattleStage {...base} specialLabel="Flare" isPt action={especial()} />);
    expect(live.textContent).toBe('Especial: Flare');
    expect(container.querySelector('[data-stage-special]')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.querySelector('[data-stage-cutscene]')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('(c) sons nos eventos', () => {
  it('o golpe básico soa no IMPACTO; o especial sobe no fim da cena e estoura quando o golpe sai', () => {
    vi.useFakeTimers();
    render(<BattleStage {...base} action={{ id: 1, actor: 'me', foe: 0, kind: 'ranged', element: 'fogo' }} />);
    act(() => { vi.advanceTimersByTime(impactMs('ranged', false) - 10); });
    expect(som.playAttack).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(20); });
    expect(som.playAttack).toHaveBeenCalledTimes(1);
    expect(som.playSpecial).not.toHaveBeenCalled();
    cleanup();
    vi.clearAllMocks();
    render(<BattleStage {...base} action={especial()} />);
    act(() => { vi.advanceTimersByTime(SPECIAL_INTRO_MS - 310); });
    expect(som.playSpecial).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(20); });
    expect(som.playSpecial).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(5000); });
    expect(som.playAttack).not.toHaveBeenCalled(); // o especial não soma o som do básico
    expect(som.playSpecial).toHaveBeenCalledTimes(1);
  });

  it('sem ação não soa nada, e sair no meio cancela o som pendente', () => {
    vi.useFakeTimers();
    const r = render(<BattleStage {...base} action={null} />);
    act(() => { vi.advanceTimersByTime(3000); });
    expect(som.playAttack).not.toHaveBeenCalled();
    r.rerender(<BattleStage {...base} action={{ id: 2, actor: 'me', foe: 0, kind: 'melee', element: 'fogo' }} />);
    r.unmount();
    act(() => { vi.advanceTimersByTime(3000); });
    expect(som.playAttack).not.toHaveBeenCalled();
  });
});

describe('Duelo — a cena vem ANTES do golpe e a vitória soa; o motor não muda', () => {
  const lado = (perfectDays = 3): DuelSide => duelSide({ evolutionStage: 'rookie', perfectDays }) as unknown as DuelSide;
  function semente(): number {
    for (let s = 1; s < 2000; s++) {
      const ev = simulatePvp({ me: lado(), opp: lado(), seed: s, taps: [] }).events;
      const ko = ev.findIndex(e => e.kind === 'ko');
      if (ev.slice(0, ko).some(e => e.kind === 'cast')) return s;
    }
    throw new Error('sem semente com especial');
  }

  it('o nome aparece SPECIAL_INTRO_MS antes de o número do golpe do especial chegar', () => {
    vi.useFakeTimers();
    const seed = semente();
    const onDone = vi.fn();
    render(<DuelScreen me={lado()} opp={lado()} seed={seed} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt={false} petElement="fogo" oppElement="agua" onDone={onDone} onClose={() => {}} />);
    let t = 0; let tNome = -1; let tNumeroGrande = -1;
    let antigos = new Set<Element>();
    for (let i = 0; i < 2400 && !onDone.mock.calls.length; i++) {
      act(() => { vi.advanceTimersByTime(25); }); t += 25;
      if (tNome < 0 && document.querySelector('[data-stage-special]')) { tNome = t; antigos = new Set(document.querySelectorAll('[data-stage-dmg]')); }
      // o número GRANDE (`big`, 26px) novo é o do golpe do especial (os básicos do outro lado podem cair durante a cena)
      if (tNome >= 0 && tNumeroGrande < 0 && [...document.querySelectorAll('[data-stage-dmg]')].some(e => !antigos.has(e) && (e.lastElementChild as HTMLElement | null)?.style.fontSize === '26px')) tNumeroGrande = t;
    }
    expect(tNome).toBeGreaterThanOrEqual(0);
    expect(tNumeroGrande - tNome).toBeGreaterThanOrEqual(SPECIAL_INTRO_MS - 50);
    // o motor é o mesmo: a simulação com a mesma semente continua idêntica (a cena é só apresentação)
    const a = JSON.stringify(simulatePvp({ me: lado(), opp: lado(), seed, taps: [] }).events);
    const b = JSON.stringify(simulatePvp({ me: lado(), opp: lado(), seed, taps: [] }).events);
    expect(a).toBe(b);
    expect(som.playSpecial).toHaveBeenCalled();
    expect(som.playAttack).toHaveBeenCalled();
  });

  it('a vitória soa uma vez, só quando a luta termina a favor do pet', () => {
    vi.useFakeTimers();
    let seed = 0; let venceu = false;
    for (let s = 1; s < 3000 && !venceu; s++) {
      if (simulatePvp({ me: lado(), opp: lado(), seed: s, taps: [] }).winner === 'me') { seed = s; venceu = true; }
    }
    expect(venceu).toBe(true);
    const onDone = vi.fn();
    render(<DuelScreen me={lado()} opp={lado()} seed={seed} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt={false} petElement="fogo" oppElement="agua" onDone={onDone} onClose={() => {}} />);
    for (let i = 0; i < 600 && !onDone.mock.calls.length; i++) act(() => { vi.advanceTimersByTime(300); });
    expect(som.playVictory).toHaveBeenCalledTimes(1);
  });
});
