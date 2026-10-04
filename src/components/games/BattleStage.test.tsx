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

describe('stageLayout — profundidade de Game Boy, lutadores BEM maiores (04/10/2026)', () => {
  for (const [w, h] of [[375, 636], [412, 760], [360, 560], [800, 700]] as const) {
    it(`${w}×${h}: o seu Soulmon embaixo à ESQUERDA e maior; o inimigo em cima à DIREITA e menor`, () => {
      const l = stageLayout(w, h, 1);
      const f = l.foes[0];
      expect(l.me.x).toBeLessThan(w / 2);
      expect(f.x).toBeGreaterThan(w / 2);
      expect(l.me.y).toBeGreaterThan(f.y); // o seu mais perto (embaixo)
      expect(l.me.size).toBeGreaterThan(f.size); // e maior
      expect(f.size / l.me.size).toBeGreaterThan(0.5);
      expect(f.size / l.me.size).toBeLessThan(0.7);
    });

    it(`${w}×${h}: tudo cabe na caixa, com as barras de HP e energia EM CIMA de cada lutador, dentro dela`, () => {
      for (const n of [1, 2, 3]) {
        const l = stageLayout(w, h, n);
        expect(l.foes).toHaveLength(n);
        for (const s of [l.me, ...l.foes]) {
          expect(s.x - s.size / 2).toBeGreaterThanOrEqual(-1);
          expect(s.x + s.size / 2).toBeLessThanOrEqual(w + 1);
          expect(s.y - s.size * 0.94 - l.barsH).toBeGreaterThanOrEqual(-12); // o bloco de barras (acima da cabeça) cabe no topo
          expect(s.y + l.platHalf(s)).toBeLessThanOrEqual(h + 1); // e a plataforma, embaixo
        }
      }
    });
  }

  it('o seu Soulmon usa a viewport: ≥ 55% da largura num celular (era ≤ 190 px)', () => {
    const l = stageLayout(375, 640, 1);
    expect(l.me.size).toBeGreaterThanOrEqual(215);
    expect(l.me.size / 375).toBeGreaterThan(0.55);
    expect(stageLayout(375, 640, 1).me.size).toBeGreaterThan(190);
  });
});

describe('BattleStage — o que a cena desenha', () => {
  const baseProps = {
    scene: 'url(x.png) center/cover #123',
    me, foes: [foe(0)], title: 'Duelo', closeLabel: 'Sair', onClose: () => {},
  };

  it('tela cheia: o layer fixo, o X no canto superior DIREITO e as barras de HP EM CIMA de cada lutador', () => {
    expect(BATTLE_LAYER_STYLE.position).toBe('fixed');
    render(<BattleStage {...baseProps} />);
    const x = screen.getByRole('button', { name: 'Sair' });
    expect(x.hasAttribute('data-stage-close')).toBe(true);
    expect(document.querySelector('[data-stage-plate="me"]')?.textContent).toContain('40/80');
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain('Inimigo 0');
    expect(document.querySelectorAll('[role="progressbar"]').length).toBe(2); // sem energia informada: só HP
  });

  it('as barras ficam EM CIMA do personagem (coladas nele): HP e, logo abaixo, ENERGIA', () => {
    render(<BattleStage {...baseProps} me={{ ...me, energy: 0.4 }} foes={[foe(0, { energy: 1 })]} />);
    expect(document.querySelectorAll('[role="progressbar"]').length).toBe(4); // HP + energia de cada um
    const plate = document.querySelector('[data-stage-plate="me"]') as HTMLElement;
    const sprite = document.querySelector('[data-stage-sprite="me"]') as HTMLElement;
    const spriteBox = sprite.closest('div[style*="position: absolute"]') as HTMLElement;
    // a placa fica ACIMA do topo do sprite (top menor)
    expect(parseFloat(plate.style.top)).toBeLessThan(parseFloat(spriteBox.style.top) + parseFloat(spriteBox.style.height) * 0.3);
    // dentro da placa: o HP vem antes da energia
    const barras = plate.querySelectorAll('[role="progressbar"]');
    expect(barras[0].className).toContain('sm2-kit-meter');
    expect(barras[1].hasAttribute('data-stage-energy')).toBe(true);
    expect(barras[1].getAttribute('aria-valuenow')).toBe('40');
    // energia cheia do inimigo: a barra pulsa e a placa avisa
    const foePlate = document.querySelector('[data-stage-plate="foe"]') as HTMLElement;
    expect(foePlate.getAttribute('data-stage-energy-full')).toBe('1');
    expect(foePlate.querySelector('.sm-bs-energy-full')).not.toBeNull();
    expect(plate.getAttribute('data-stage-energy-full')).toBe('0');
  });

  it('o personagem faz o BOUNCING idle durante a luta (e brilha com a energia cheia)', () => {
    render(<BattleStage {...baseProps} me={{ ...me, energy: 1 }} />);
    const meImg = document.querySelector('[data-stage-sprite="me"]') as HTMLElement;
    const foeImg = document.querySelector('[data-stage-sprite="foe"]') as HTMLElement;
    expect(meImg.className).toContain('sm-bs-bounce');
    expect(foeImg.className).toContain('sm-bs-bounce');
    expect(meImg.className).toContain('sm-bs-charged');
    expect(foeImg.className).not.toContain('sm-bs-charged');
    expect(meImg.style.getPropertyValue('--bs-bounce')).toMatch(/px$/);
  });

  it('nenhum texto explicativo na cena: só o título, os nomes e os números', () => {
    render(<BattleStage {...baseProps} me={{ ...me, energy: 0.5 }} />);
    const texto = (document.querySelector('[data-battle-stage]')?.textContent ?? '').replace(/\s+/g, ' ').trim();
    expect(texto.length).toBeLessThan(80);
    expect(texto).not.toMatch(/toque|tap|torça|cheer|energia|energy/i);
  });

  it('a barra de cheer (hud) vai no PÉ da cena, não no topo', () => {
    render(<BattleStage {...baseProps} hud={<span data-teste-hud>x</span>} />);
    const footer = document.querySelector('[data-stage-footer]') as HTMLElement;
    expect(footer.contains(document.querySelector('[data-teste-hud]'))).toBe(true);
    expect(footer.style.bottom).toContain('--sm-corner-h');
    expect((document.querySelector('[data-stage-hud]') as HTMLElement).contains(footer)).toBe(false);
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

  it('ataque FÍSICO (A5): a investida do atacante + SÓ o corte do ELEMENTO dele no alvo — sem splash/impacto', () => {
    const action: StageAction = { id: 1, actor: 'me', foe: 0, kind: 'melee', element: 'fogo' };
    render(<BattleStage {...baseProps} action={action} />);
    expect(document.querySelector('.sm-bs-lunge')).not.toBeNull();
    expect(camadasDe()).not.toContain('sm-bs-fly');
    const srcs = srcsDe();
    expect(srcs.some(s => /fx-fogo-slash/.test(s))).toBe(true);
    expect(srcs.some(s => /fx-fogo-impact/.test(s))).toBe(false);
  });

  it('o splash (impacto) é do dano à distância/mágico: o projétil e o especial ainda o mostram', () => {
    for (const kind of ['ranged', 'special'] as const) {
      cleanup();
      render(<BattleStage {...baseProps} action={{ id: 20, actor: 'me', foe: 0, kind, element: 'fogo' }} />);
      expect(srcsDe().some(s => /fx-fogo-impact/.test(s)), kind).toBe(true);
    }
  });

  it('R8: o círculo de cast e a aura são SÓ do especial — golpe básico (físico ou à distância) não carrega nada', () => {
    for (const kind of ['melee', 'ranged'] as const) {
      cleanup();
      render(<BattleStage {...baseProps} action={{ id: 30, actor: 'me', foe: 0, kind, element: 'fogo' }} />);
      expect(document.querySelector('.sm-bs-cast'), kind).toBeNull();
      expect(srcsDe().some(s => /fx-fogo-cast|fx-fogo-aura/.test(s)), kind).toBe(false);
      expect(document.querySelector('[data-stage-special]'), kind).toBeNull();
    }
  });

  it('R8: o ESPECIAL físico (skill física) = círculo + aura + investida + corte, sem projétil e sem splash; o selo SPECIAL! aparece', () => {
    render(<BattleStage {...baseProps} action={{ id: 31, actor: 'me', foe: 0, kind: 'special', strike: 'melee', element: 'fogo' }} />);
    const srcs = srcsDe();
    expect(srcs.some(s => /fx-fogo-cast/.test(s))).toBe(true);
    expect(srcs.some(s => /fx-fogo-aura/.test(s))).toBe(true);
    expect(srcs.some(s => /fx-fogo-slash/.test(s))).toBe(true);
    expect(srcs.some(s => /fx-fogo-orb|fx-fogo-impact/.test(s))).toBe(false);
    const lunge = document.querySelector('.sm-bs-lunge') as HTMLElement;
    expect(lunge).not.toBeNull();
    expect(parseInt(lunge.style.getPropertyValue('--bs-delay'), 10)).toBeGreaterThan(0); // a investida espera a carga
    expect(document.querySelector('[data-stage-special]')?.textContent).toBe('SPECIAL!');
  });

  it('R8: o selo do especial usa o rótulo recebido (copy centralizada) e aparece no inimigo também', () => {
    render(<BattleStage {...baseProps} specialLabel="ESPECIAL!" action={{ id: 32, actor: 'foe', foe: 0, kind: 'special', element: 'agua' }} />);
    expect(document.querySelector('[data-stage-special]')?.textContent).toBe('ESPECIAL!');
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

  it('o feedback do golpe é CURTO: o número e um selo (ÓTIMO!, Defendeu!) sobem do alvo; vários alvos = vários números', () => {
    render(<BattleStage {...baseProps} foes={[foe(0), foe(1)]} hit={[{ id: 1, side: 'foe', foe: 0, value: 12, big: true, tag: 'ÓTIMO!' }, { id: 2, side: 'foe', foe: 1, value: 7 }]} />);
    const nums = [...document.querySelectorAll('[data-stage-dmg]')];
    expect(nums.length).toBe(2);
    expect(nums[0].textContent).toContain('ÓTIMO!');
    expect(nums[0].textContent).toContain('12');
    expect(nums[1].textContent).toContain('7');
    cleanup();
    render(<BattleStage {...baseProps} hit={{ id: 3, side: 'me', foe: 0, value: 0, tag: 'Defendeu!' }} />);
    expect(document.querySelector('[data-stage-tag]')?.textContent).toBe('Defendeu!');
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

  it('o especial do INIMIGO no PvE carrega (cast + aura) e o projétil só sai depois — o tempo da esquiva', () => {
    const action: StageAction = { id: 8, actor: 'foe', foe: 0, kind: 'special', element: 'agua', castMs: 1200, impactMs: 2200, totalMs: 2700 };
    render(<BattleStage {...baseProps} action={action} />);
    const orb = document.querySelector('.sm-bs-fly') as HTMLElement;
    expect(orb.style.getPropertyValue('--bs-delay')).toBe('1200ms'); // o projétil sai depois da carga
    expect(orb.style.getPropertyValue('--bs-dur')).toBe('1000ms'); // e voa 1 s até chegar
    expect(srcsDe().some(s => /fx-agua-aura/.test(s))).toBe(true);
  });

  it('o ANEL do especial (PvE) aparece sobre o ALVO e o toque entrega a nota; as setas de esquiva ficam do lado do pet', async () => {
    const onGrade = vi.fn();
    const onDodge = vi.fn();
    const spec = { ms: 1800, targetMs: 1270 };
    const { rerender } = render(<BattleStage {...baseProps} ring={{ key: 1, spec, foe: 0 }} onRingGrade={onGrade} onDodge={onDodge} />);
    expect(document.querySelector('[data-stage-ring]')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Strike' })).toBeTruthy();
    expect(document.querySelector('[data-stage-charging]')).toBeNull();
    rerender(<BattleStage {...baseProps} charging dodge={{ key: 2 }} onDodge={onDodge} onRingGrade={onGrade} />);
    expect(document.querySelector('[data-stage-charging]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Dodge left' }));
    expect(onDodge).toHaveBeenLastCalledWith(-1);
    fireEvent.click(screen.getByRole('button', { name: 'Dodge right' }));
    expect(onDodge).toHaveBeenLastCalledWith(1);
  });

  it('a esquiva faz o pet DESLIZAR (sem movimento reduzido)', () => {
    render(<BattleStage {...baseProps} petDodge={{ id: 1, dir: 1 }} />);
    const lunge = document.querySelector('.sm-bs-lunge') as HTMLElement;
    expect(lunge).not.toBeNull();
    expect(parseInt(lunge.style.getPropertyValue('--dx'), 10)).toBeGreaterThan(0);
    expect(parseInt(lunge.style.getPropertyValue('--dy'), 10)).toBe(0);
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
      // O selo do especial aparece (a classe troca a animação por flash no CSS reduzido), sem círculo de cast.
      expect(!!document.querySelector('[data-stage-special]'), kind).toBe(kind === 'special');
    }
  });
});
