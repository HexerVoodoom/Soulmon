// @vitest-environment jsdom
/**
 * BATTLE STAGE — a cena de combate em tela cheia (rodada 5 / I10).
 * O layout é PURO e é testado em números; a cena é testada pelo que ela desenha por ação.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { BattleStage, BATTLE_LAYER_STYLE, stageLayout, type StageAction, type StageFighter } from './BattleStage';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const me: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo' };
const foe = (i: number, extra: Partial<StageFighter> = {}): StageFighter => ({
  key: i, sprite: 'foe.png', name: `Inimigo ${i}`, hp: 30, maxHp: 60, element: 'agua', ...extra,
});

describe('stageLayout — profundidade de Game Boy', () => {
  for (const [w, h] of [[375, 636], [412, 760], [360, 560], [800, 700]] as const) {
    it(`${w}×${h}: o seu Soulmon embaixo à ESQUERDA e maior; o inimigo em cima à DIREITA e menor`, () => {
      const l = stageLayout(w, h, 1);
      const f = l.foes[0];
      expect(l.me.x).toBeLessThan(w / 2);
      expect(f.x).toBeGreaterThan(w / 2);
      expect(l.me.y).toBeGreaterThan(f.y); // o seu mais perto (embaixo)
      expect(l.me.size).toBeGreaterThan(f.size); // e maior
      expect(f.size / l.me.size).toBeGreaterThan(0.45);
      expect(f.size / l.me.size).toBeLessThan(0.65);
    });

    it(`${w}×${h}: tudo cabe na caixa, com a barra de HP dos pés DENTRO dela`, () => {
      for (const n of [1, 2, 3]) {
        const l = stageLayout(w, h, n);
        expect(l.foes).toHaveLength(n);
        for (const s of [l.me, ...l.foes]) {
          expect(s.x - s.size / 2).toBeGreaterThanOrEqual(-1);
          expect(s.x + s.size / 2).toBeLessThanOrEqual(w + 1);
          expect(s.y - s.size * 0.94).toBeGreaterThanOrEqual(0); // o sprite não sai pelo topo
          const plateBottom = s.y + l.platHalf(s) + 3 + l.plateH;
          expect(plateBottom).toBeLessThanOrEqual(h + 1); // a barra do pé cabe
        }
      }
    });
  }
});

describe('BattleStage — o que a cena desenha', () => {
  const baseProps = {
    scene: 'url(x.png) center/cover #123',
    me, foes: [foe(0)], title: 'Duelo', closeLabel: 'Sair', onClose: () => {},
  };

  it('tela cheia: o layer fixo, o X no canto superior DIREITO e uma barra de HP em cada pé', () => {
    expect(BATTLE_LAYER_STYLE.position).toBe('fixed');
    render(<BattleStage {...baseProps} />);
    const x = screen.getByRole('button', { name: 'Sair' });
    expect(x.hasAttribute('data-stage-close')).toBe(true);
    expect(document.querySelector('[data-stage-plate="me"]')?.textContent).toContain('40/80');
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain('Inimigo 0');
    expect(document.querySelectorAll('[role="progressbar"]').length).toBe(2);
  });

  it('o inimigo caído some a barra e fica apagado', () => {
    render(<BattleStage {...baseProps} foes={[foe(0, { hp: 0, down: true }), foe(1)]} />);
    expect(document.querySelectorAll('[data-stage-plate="foe"]').length).toBe(1);
  });

  it('sem `exitConfirm` o X sai direto; com ele, pergunta e pausa (onPauseChange)', () => {
    const onClose = vi.fn(); const onPause = vi.fn();
    const { rerender } = render(<BattleStage {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear();
    rerender(<BattleStage {...baseProps} onClose={onClose} onPauseChange={onPause} exitConfirm={{ title: 'Sair?', stay: 'Ficar', leave: 'Ir' }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(onPause).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole('button', { name: 'Ficar' }));
    expect(onPause).toHaveBeenLastCalledWith(false);
  });

  const camadasDe = () => [...document.querySelectorAll('[data-stage-fx]')].map(e => e.getAttribute('data-stage-fx'));
  const srcsDe = () => [...document.querySelectorAll('[data-stage-fx] img')].map(e => e.getAttribute('src') ?? '');

  it('ataque FÍSICO: a investida do atacante + o corte e o impacto do ELEMENTO dele no alvo', () => {
    const action: StageAction = { id: 1, actor: 'me', foe: 0, kind: 'melee', element: 'fogo' };
    render(<BattleStage {...baseProps} action={action} />);
    expect(document.querySelector('.sm-bs-lunge')).not.toBeNull();
    expect(camadasDe()).not.toContain('sm-bs-fly');
    const srcs = srcsDe();
    expect(srcs.some(s => /fx-fogo-slash/.test(s))).toBe(true);
    expect(srcs.some(s => /fx-fogo-impact/.test(s))).toBe(true);
  });

  it('ataque À DISTÂNCIA: o projétil (orb) do elemento atravessa a cena; sem investida', () => {
    const action: StageAction = { id: 2, actor: 'me', foe: 0, kind: 'ranged', element: 'fogo' };
    render(<BattleStage {...baseProps} action={action} />);
    expect(document.querySelector('.sm-bs-lunge')).toBeNull();
    expect(camadasDe()).toContain('sm-bs-fly');
    expect(srcsDe().some(s => /fx-fogo-orb/.test(s))).toBe(true);
    // A trajetória sai do corpo do seu Soulmon e chega no corpo do alvo.
    const fly = document.querySelector('.sm-bs-fly') as HTMLElement;
    expect(parseInt(fly.style.getPropertyValue('--dx'), 10)).toBeGreaterThan(0); // vai para a direita
    expect(parseInt(fly.style.getPropertyValue('--dy'), 10)).toBeLessThan(0); // e para cima
  });

  it('o revide do inimigo vai na direção OPOSTA (para a esquerda e para baixo)', () => {
    const action: StageAction = { id: 3, actor: 'foe', foe: 0, kind: 'ranged', element: 'agua' };
    render(<BattleStage {...baseProps} action={action} />);
    const fly = document.querySelector('.sm-bs-fly') as HTMLElement;
    expect(parseInt(fly.style.getPropertyValue('--dx'), 10)).toBeLessThan(0);
    expect(parseInt(fly.style.getPropertyValue('--dy'), 10)).toBeGreaterThan(0);
    expect(srcsDe().some(s => /fx-agua-orb/.test(s))).toBe(true);
  });

  it('ESCUDO: a defesa mostra a barreira do elemento do DEFENSOR no lugar do impacto', () => {
    const action: StageAction = { id: 4, actor: 'foe', foe: 0, kind: 'melee', element: 'agua', shield: 'fogo' };
    render(<BattleStage {...baseProps} action={action} />);
    const srcs = srcsDe();
    expect(srcs.some(s => /fx-fogo-defended/.test(s))).toBe(true);
    expect(srcs.some(s => /fx-agua-impact/.test(s))).toBe(false);
    // E o escudo defende: o seu Soulmon não treme.
    expect(document.querySelector('.sm-bs-hit')).toBeNull();
  });

  it('o golpe que ACERTA faz o alvo tremer (e o número do dano sobe dele)', () => {
    const action: StageAction = { id: 5, actor: 'me', foe: 0, kind: 'ranged', element: 'fogo' };
    render(<BattleStage {...baseProps} action={action} hit={{ id: 1, side: 'foe', foe: 0, value: 12 }} />);
    expect(document.querySelectorAll('.sm-bs-hit').length).toBe(1);
    expect(document.querySelector('[data-stage-dmg]')?.textContent).toContain('12');
  });

  it('o ESPECIAL é o ranged em dobro: círculo + aura no conjurador, projétil grande', () => {
    const action: StageAction = { id: 6, actor: 'me', foe: 0, kind: 'special', element: 'fogo' };
    render(<BattleStage {...baseProps} action={action} />);
    const srcs = srcsDe();
    expect(srcs.some(s => /fx-fogo-cast/.test(s))).toBe(true);
    expect(srcs.some(s => /fx-fogo-aura/.test(s))).toBe(true);
    expect(srcs.some(s => /fx-fogo-orb/.test(s))).toBe(true);
  });

  it('elemento sem arte cai no NEUTRO (nunca some o golpe)', () => {
    const action: StageAction = { id: 7, actor: 'me', foe: 0, kind: 'ranged', element: 'inexistente' };
    render(<BattleStage {...baseProps} action={action} />);
    expect(srcsDe().some(s => /fx-neutro-orb/.test(s))).toBe(true);
  });

  it('prefers-reduced-motion: sem investida e sem projétil — só o flash no alvo', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));
    for (const kind of ['melee', 'ranged', 'special'] as const) {
      cleanup();
      render(<BattleStage {...baseProps} action={{ id: 10, actor: 'me', foe: 0, kind, element: 'fogo' }} hit={{ id: 1, side: 'foe', foe: 0, value: 5 }} />);
      expect(document.querySelector('.sm-bs-lunge'), kind).toBeNull();
      expect(document.querySelector('.sm-bs-fly'), kind).toBeNull();
      expect(document.querySelector('.sm-bs-cast'), kind).toBeNull();
      expect(document.querySelector('.sm-bs-hit'), kind).toBeNull();
      expect(camadasDe(), kind).toEqual(['sm-bs-pop']); // só o flash do impacto
    }
  });
});
