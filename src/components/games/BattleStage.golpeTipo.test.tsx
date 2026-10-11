// @vitest-environment jsdom
/**
 * 11/10/2026, pedido do dono:
 *  (4) "diferença de som entre ataque FÍSICO e ataque RANGED" — o golpe básico soa pelo TIPO do ataque do combatente;
 *  (5) "quando usar o ESPECIAL, o efeito visual aumenta: ranged lança a esfera MAIOR (mesmo ícone), corte faz um corte
 *      MAIOR" — escala do FX no especial, e o movimento reduzido tem o seu lugar no bloco canônico do CSS.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const som = vi.hoisted(() => ({ playAttack: vi.fn(), playAttackRanged: vi.fn(), playSpecial: vi.fn(), playVictory: vi.fn() }));
vi.mock('../../utils/sounds', () => som);

import { BattleStage, ORB_PX, ORB_PX_SPECIAL, SLASH_SCALE, SLASH_SCALE_SPECIAL, type StageAction, type StageFighter } from './BattleStage';
import { impactMs, SPECIAL_INTRO_MS } from '../../utils/combatFx';
import { CATEGORIA_DO_SOM } from '../../utils/loudness';

afterEach(() => { cleanup(); vi.useRealTimers(); vi.clearAllMocks(); });

const me: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo', energy: 0.3 };
const foe: StageFighter = { key: 0, sprite: 'foe.png', name: 'Rival', hp: 30, maxHp: 60, element: 'agua' };
const base = { scene: '#123', me, foes: [foe], title: 'Arena', closeLabel: 'Sair', onClose: () => {} };
const acao = (kind: StageAction['kind'], strike?: 'melee' | 'ranged'): StageAction => ({ id: 1, actor: 'me', foe: 0, kind, strike, element: 'fogo' });

describe('(4) o som do golpe acompanha o TIPO do ataque', () => {
  it('físico (melee) soa o SOCO; à distância (ranged) soa o DISPARO — nunca os dois, e nunca o do outro tipo', () => {
    vi.useFakeTimers();
    render(<BattleStage {...base} action={acao('melee')} />);
    act(() => { vi.advanceTimersByTime(impactMs('melee', false) + 20); });
    expect(som.playAttack).toHaveBeenCalledTimes(1);
    expect(som.playAttackRanged).not.toHaveBeenCalled();
    cleanup(); vi.clearAllMocks();
    render(<BattleStage {...base} action={acao('ranged')} />);
    act(() => { vi.advanceTimersByTime(impactMs('ranged', false) + 20); });
    expect(som.playAttackRanged).toHaveBeenCalledTimes(1);
    expect(som.playAttack).not.toHaveBeenCalled();
  });

  it('o inimigo também: o tipo é do atacante, de qualquer lado', () => {
    vi.useFakeTimers();
    render(<BattleStage {...base} action={{ ...acao('ranged'), actor: 'foe' }} />);
    act(() => { vi.advanceTimersByTime(impactMs('ranged', false) + 20); });
    expect(som.playAttackRanged).toHaveBeenCalledTimes(1);
  });

  it('o especial segue com o som do especial, seja a forma que for (não soma o do básico)', () => {
    vi.useFakeTimers();
    render(<BattleStage {...base} action={acao('special', 'ranged')} />);
    act(() => { vi.advanceTimersByTime(SPECIAL_INTRO_MS + 3000); });
    expect(som.playSpecial).toHaveBeenCalledTimes(1);
    expect(som.playAttack).not.toHaveBeenCalled();
    expect(som.playAttackRanged).not.toHaveBeenCalled();
  });

  it('R-CAT: os dois são o MESMO evento (golpe de combate) → a mesma categoria `arcade`', () => {
    expect(CATEGORIA_DO_SOM.playAttackRanged).toBe(CATEGORIA_DO_SOM.playAttack);
    expect(CATEGORIA_DO_SOM.playAttack).toBe('arcade');
  });
});

describe('(5) o especial faz o efeito MAIOR (mesma arte, em escala)', () => {
  const tamanho = (el: Element | null) => parseInt((el as HTMLElement).style.width, 10);

  it('à distância: a esfera do especial é MAIOR que a do básico, e leva a marca `.sm-bs-big` (a animação cresce)', () => {
    const basico = render(<BattleStage {...base} action={acao('ranged')} />);
    const orbBasico = basico.container.querySelector('[data-stage-fx="sm-bs-fly"]');
    const tBasico = tamanho(orbBasico);
    expect(orbBasico?.classList.contains('sm-bs-big')).toBe(false);
    cleanup();
    const esp = render(<BattleStage {...base} action={acao('special', 'ranged')} />);
    const orbEsp = esp.container.querySelector('[data-stage-fx="sm-bs-fly"]');
    expect(tamanho(orbEsp)).toBeGreaterThan(tBasico);
    expect(tamanho(orbEsp) / tBasico).toBeCloseTo(ORB_PX_SPECIAL / ORB_PX, 1);
    expect(orbEsp?.classList.contains('sm-bs-big')).toBe(true);
    // MESMO ícone: a arte é a do elemento, só em escala
    expect(orbEsp?.querySelector('img')?.getAttribute('src')).toBe(orbBasico?.querySelector('img')?.getAttribute('src'));
  });

  it('física: o corte do especial é MAIOR que o do básico, com a mesma arte', () => {
    const basico = render(<BattleStage {...base} action={acao('melee')} />);
    const cBasico = basico.container.querySelector('[data-stage-fx="sm-bs-pop"][data-stage-fx-big]');
    expect(cBasico).toBeNull(); // o corte do básico não é marcado
    const sBasico = [...basico.container.querySelectorAll('[data-stage-fx="sm-bs-pop"]')].map(tamanho);
    cleanup();
    const esp = render(<BattleStage {...base} action={acao('special', 'melee')} />);
    const corte = esp.container.querySelector('[data-stage-fx="sm-bs-pop"][data-stage-fx-big="1"]');
    expect(corte).not.toBeNull();
    expect(tamanho(corte)).toBeGreaterThan(Math.max(...sBasico));
    expect(SLASH_SCALE_SPECIAL).toBeGreaterThan(SLASH_SCALE);
  });

  it('o CSS: `.sm-bs-big` tem animação própria que cresce, e movimento reduzido está no bloco CANÔNICO', () => {
    const css = readFileSync(join(__dirname, '..', '..', 'index.css'), 'utf-8');
    expect(css).toMatch(/\.sm-bs-fly\.sm-bs-big\s*\{\s*animation-name:\s*sm-bs-fly-big;/);
    expect(css).toMatch(/\.sm-bs-pop\.sm-bs-big\s*\{\s*animation-name:\s*sm-bs-pop-big;/);
    // o bloco canônico de movimento reduzido (o primeiro `@media (prefers-reduced-motion: reduce)` com as regras da cena)
    const canonico = css.slice(css.indexOf('.sm-bs-lunge, .sm-bs-fly, .sm-bs-cast, .sm-bs-hit'), css.indexOf('.sm2-viewport { animation: none !important; }'));
    expect(canonico).toContain('.sm-bs-fly.sm-bs-big { display: none !important; }');
    expect(canonico).toContain('.sm-bs-pop.sm-bs-big { animation-name: sm-bs-flash !important; }');
    // e não há um SEGUNDO bloco de movimento reduzido para o especial maior fora do canônico
    expect(css.split('.sm-bs-fly.sm-bs-big { display: none').length - 1).toBe(1);
  });
});
