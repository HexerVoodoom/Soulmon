// @vitest-environment jsdom
/**
 * BATTLE STAGE — FX de status e círculo de cast (PR11, run `combate-v3-01`).
 * Estados: sem status · 1 · vários (até 3 por canto, §328) · expirando · alvo derrubado · movimento reduzido · arte ainda carregando.
 * §327 (dono, 13/11/2026): o efeito aparece UMA vez — só o marcador no canto do sprite (e o escudo sobre o corpo); o selo
 * de 22 px com contador ao lado da barra saiu. O marcador leva o `aria-label` (efeito + turnos), com e sem movimento.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { BattleStage, STAGE_FX_MARK_MAX, Z_FX_MARK, type StageAction, type StageFighter } from './BattleStage';
import { STATUS_FX, STATUS_FX_KINDS, STATUS_LOOP_CROP, STATUS_LOOP_FRAME_PX, statusLoopCropSide, MAX_STATUS_CHIPS, statusAriaLabel, statusPolarity, type StageStatus, type StatusFxKind } from '../../utils/combatFx';
import { COMBAT_V3_ART_IDS, loadCombatV3Art, resetCombatV3ArtCache } from '../../utils/combatV3Art';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); resetCombatV3ArtCache(); });

const me: StageFighter = { key: 'me', sprite: 'me.png', name: 'Eu', hp: 40, maxHp: 80, element: 'fogo' };
const foe = (extra: Partial<StageFighter> = {}): StageFighter => ({ key: 0, sprite: 'foe.png', name: 'Rival', hp: 30, maxHp: 60, element: 'agua', ...extra });
const base = { scene: 'url(x.png) center/cover #123', title: 'Duelo', closeLabel: 'Sair', onClose: () => {} };
const reduzir = () => vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }));
/**
 * A arte de combate entra por `import()` sob demanda. Antes o teste dormia 400 ms fixos esperando isso — sob carga o
 * 1º import dinâmico passava de 400 ms e a asserção rodava antes da imagem; com a máquina livre, sobrava 400 ms por teste.
 * Agora (1) o `beforeAll` paga o import frio UMA vez, num hook com teto próprio, e (2) cada teste espera pelo ESTADO que
 * afirma (seletor presente), sem relógio fixo. `afterEach` zera o cache da arte, mas o módulo já está avaliado: a
 * promessa resolve em microtarefas.
 */
beforeAll(async () => { await Promise.all(COMBAT_V3_ART_IDS.map((id) => loadCombatV3Art(id))); }, 90_000);
const quando = (cond: () => unknown) => waitFor(() => { expect(cond()).toBeTruthy(); }, { timeout: 10_000 });

const marks = () => [...document.querySelectorAll('[data-stage-fx-mark]')] as HTMLElement[];
const mark = (kind: StatusFxKind) => document.querySelector(`[data-stage-fx-mark="${kind}"]`) as HTMLElement | null;
/** O texto acessível do marcador: `aria-label` (folha em loop, `role="img"`) ou `alt` (peça estática `<img>`). */
const rotulo = (el: Element) => el.getAttribute('aria-label') ?? el.getAttribute('alt');
/** §327: o selo com contador ao lado da barra de HP/especial não existe mais, em estado nenhum. */
const semSeloDaBarra = () => {
  expect(document.querySelector('[data-stage-status-row]')).toBeNull();
  expect(document.querySelector('[data-stage-status]')).toBeNull();
};
const acao = (kind: StageAction['kind'], extra: Partial<StageAction> = {}): StageAction => ({ id: 1, actor: 'me', foe: 0, kind, element: 'fogo', ...extra });

describe('§327 o efeito aparece UMA vez: o marcador no canto é a leitura, com efeito e turnos no aria-label', () => {
  for (const kind of STATUS_FX_KINDS.filter((k) => k !== 'escudo')) {
    it(`${kind}: o marcador leva o efeito e os turnos (EN e PT), sem selo com contador na barra; quando a duração acaba, some`, async () => {
      const turns = 3;
      for (const isPt of [false, true]) {
        const { rerender, unmount } = render(<BattleStage {...base} isPt={isPt} me={me} foes={[foe({ status: [{ kind, turns }] })]} />);
        await quando(() => mark(kind));
        const el = mark(kind)!;
        expect(rotulo(el)).toBe(statusAriaLabel(kind, turns, isPt));
        expect(rotulo(el)).toContain(String(turns));
        expect(el.getAttribute('data-stage-fx-turns')).toBe(String(turns));
        if (el.tagName !== 'IMG') expect(el.getAttribute('role')).toBe('img');
        expect(el.closest('[aria-hidden="true"]')).toBeNull(); // o leitor de tela alcança o marcador
        semSeloDaBarra();
        // a duração acabou: o motor tira o status e o marcador some
        rerender(<BattleStage {...base} isPt={isPt} me={me} foes={[foe({ status: [] })]} />);
        expect(mark(kind)).toBeNull();
        unmount();
      }
    });
  }

  it('escudo: segue sobre o corpo e é ele quem diz o efeito e os turnos ao leitor de tela', async () => {
    render(<BattleStage {...base} isPt me={me} foes={[foe({ status: [{ kind: 'escudo', turns: 2 }] })]} />);
    await quando(() => document.querySelector('[data-stage-fx-still="escudo"]'));
    const el = document.querySelector('[data-stage-fx-still="escudo"]') as HTMLElement;
    expect(el.getAttribute('alt')).toBe('Escudo, 2 turnos');
    expect(el.getAttribute('aria-hidden')).toBeNull();
    semSeloDaBarra();
  });

  it('sem status: nenhuma camada (nem marcador, nem selo)', () => {
    render(<BattleStage {...base} me={me} foes={[foe()]} />);
    expect(marks()).toHaveLength(0);
    semSeloDaBarra();
    expect(document.querySelector('[data-stage-fx-row]')).toBeNull();
    expect(document.querySelector('[data-stage-fx-loop]')).toBeNull();
  });

  it('o pet também carrega status (o buff dele), e cada lutador mostra o SEU', async () => {
    render(<BattleStage {...base} isPt me={{ ...me, status: [{ kind: 'buff', variant: 'atk', turns: 2 }] }} foes={[foe({ status: [{ kind: 'debuff', variant: 'def', turns: 3 }] })]} />);
    await quando(() => marks().length === 2);
    expect(marks().map(rotulo)).toEqual(['Defesa em baixa, 3 turnos', 'Ataque em alta, 2 turnos']); // ordem do DOM: inimigos, depois o pet
    expect(marks().map((m) => m.getAttribute('data-stage-fx-variant'))).toEqual(['def', 'atk']);
  });

  it('alvo derrubado com status: some (e o pet derrubado também)', () => {
    render(<BattleStage {...base} me={{ ...me, down: true, status: [{ kind: 'cura', turns: 1 }] }} foes={[foe({ down: true, status: [{ kind: 'dot', turns: 2 }] })]} />);
    expect(marks()).toHaveLength(0);
    semSeloDaBarra();
    expect(document.querySelector('[data-stage-fx-loop]')).toBeNull();
  });

  it('a arte chega depois (carga preguiçosa): sem selo de reserva na barra; os marcadores aparecem, um por efeito, pequenos no canto', async () => {
    render(<BattleStage {...base} me={me} foes={[foe({ status: [{ kind: 'debuff', variant: 'def', turns: 3 }, { kind: 'dot', turns: 3 }, { kind: 'buff', variant: 'atk', turns: 2 }] })]} />);
    semSeloDaBarra(); // o 1º desenho, antes da arte: nada na barra
    await quando(() => marks().length === 3);
    expect([...document.querySelectorAll('[data-stage-fx-loop]')].map((e) => e.getAttribute('data-stage-fx-loop'))).toEqual(['debuff', 'dot', 'buff']);
    // o marcador é pequeno (canto), não mais a folha do tamanho do sprite
    for (const m of marks()) expect(parseFloat(m.style.width)).toBeLessThanOrEqual(STAGE_FX_MARK_MAX);
    semSeloDaBarra();
  });

  it('o ESCUDO segue sobre o corpo (fx-shield, como era); a cura vira marcador no canto dos buffs (fx-heal)', async () => {
    render(<BattleStage {...base} me={{ ...me, status: [{ kind: 'escudo', turns: 3 }] }} foes={[foe({ status: [{ kind: 'cura', turns: 1 }] })]} />);
    await quando(() => document.querySelector('[data-stage-fx-still="escudo"]') && mark('cura'));
    const escudo = document.querySelector('[data-stage-fx-still="escudo"]') as HTMLElement;
    expect(escudo.closest('[data-stage-fx-row]')).toBeNull();
    expect(mark('escudo')).toBeNull();
    expect(document.querySelector('[data-stage-fx-still="cura"]')).toBeNull();
    expect(mark('cura')!.closest('[data-stage-fx-row]')!.getAttribute('data-stage-fx-zone')).toBe('buff');
    expect(rotulo(mark('cura')!)).toBe('Healing, 1 turn left');
    expect(document.querySelector('[data-stage-fx-loop]')).toBeNull();
  });
});

describe('marcadores de efeito no sprite: canto por tipo, ordem de início, sempre na frente (dono, 13/11/2026)', () => {
  // ordem de início (o mais antigo primeiro), como o stageStatusOf entrega
  const dois: StageStatus[] = [
    { kind: 'veneno', turns: 3 }, { kind: 'buff', variant: 'atk', turns: 2 }, { kind: 'lento', turns: 2 }, { kind: 'hot', turns: 4 }, { kind: 'escudo', turns: 2 },
  ];
  const row = (side: 'me' | 'foe', zone: 'buff' | 'debuff') => document.querySelector(`[data-stage-fx-side="${side}"][data-stage-fx-zone="${zone}"]`) as HTMLElement | null;
  const kinds = (r: HTMLElement | null) => [...(r?.querySelectorAll('[data-stage-fx-mark]') ?? [])].map((c) => c.getAttribute('data-stage-fx-mark'));
  const pronto = () => quando(() => document.querySelectorAll('[data-stage-fx-mark]').length === 8 && document.querySelectorAll('[data-stage-fx-still="escudo"]').length === 2);

  it('cada efeito com arte de cena vai ao canto do seu tipo; só o escudo fica sobre o corpo', async () => {
    expect(STATUS_FX_KINDS.filter((k) => statusPolarity(k) === 'buff').sort()).toEqual(['buff', 'cura', 'escudo', 'hot']);
    for (const kind of STATUS_FX_KINDS.filter((k) => k !== 'escudo')) {
      render(<BattleStage {...base} me={me} foes={[foe({ status: [{ kind, turns: 2 }] })]} />);
      await quando(() => document.querySelector(`[data-stage-fx-mark="${kind}"]`));
      expect(document.querySelector(`[data-stage-fx-mark="${kind}"]`)!.closest('[data-stage-fx-row]')!.getAttribute('data-stage-fx-zone'), kind).toBe(statusPolarity(kind));
      cleanup();
    }
  });

  it('§328 3 debuffs e 3 buffs nos dois lados: o 1º (que começou antes) na borda do sprite, os seguintes para dentro; inimigo debuff ←/buff →, pet espelhado; sem o selo da barra (§327)', async () => {
    const tres: StageStatus[] = [
      { kind: 'veneno', turns: 3 }, { kind: 'buff', variant: 'atk', turns: 2 }, { kind: 'lento', turns: 2 }, { kind: 'hot', turns: 4 },
      { kind: 'queimadura', turns: 2 }, { kind: 'cura', turns: 1 }, { kind: 'escudo', turns: 2 },
    ];
    render(<BattleStage {...base} me={{ ...me, status: tres }} foes={[foe({ status: tres })]} />);
    await quando(() => document.querySelectorAll('[data-stage-fx-mark]').length === 12);
    // [lado, zona] → borda de partida: o 1º marcador encosta nela; flex `row` põe o 1º do DOM à esquerda, `row-reverse` à direita
    const esperado = { foe: { debuff: 'left', buff: 'right' }, me: { debuff: 'right', buff: 'left' } } as const;
    for (const side of ['me', 'foe'] as const) {
      expect(kinds(row(side, 'debuff'))).toEqual(['veneno', 'lento', 'queimadura']); // o DOM guarda a ordem de início
      expect(kinds(row(side, 'buff'))).toEqual(['buff', 'hot', 'cura']);
      for (const z of ['debuff', 'buff'] as const) {
        const r = row(side, z)!;
        const anchor = esperado[side][z];
        expect(r.getAttribute('data-stage-fx-anchor'), `${side} ${z}`).toBe(anchor);
        expect(r.style.flexDirection, `${side} ${z}`).toBe(anchor === 'left' ? 'row' : 'row-reverse');
        expect(r.getAttribute('data-stage-fx-order'), `${side} ${z}`).toBe(anchor === 'left' ? 'ltr' : 'rtl');
        expect(r.querySelector('[data-stage-fx-more]')).toBeNull();
      }
      // debuff em cima, buff embaixo
      expect(parseFloat(row(side, 'debuff')!.style.top)).toBeLessThan(parseFloat(row(side, 'buff')!.style.top));
    }
    // inimigo: debuff à esquerda do buff; pet: o contrário
    expect(parseFloat(row('foe', 'debuff')!.style.left)).toBeLessThan(parseFloat(row('foe', 'buff')!.style.left));
    expect(parseFloat(row('me', 'buff')!.style.left)).toBeLessThan(parseFloat(row('me', 'debuff')!.style.left));
    semSeloDaBarra();
  });

  it('§328 o marcador é o ícone ANIMADO do efeito, recortado no conteúdo da folha e do mesmo tamanho nos dois cantos', async () => {
    const st: StageStatus[] = [{ kind: 'silencio', turns: 2 }, { kind: 'buff', variant: 'atk', turns: 2 }];
    render(<BattleStage {...base} me={me} foes={[foe({ status: st })]} />);
    await quando(() => marks().length === 2);
    const sizes = new Set<number>();
    for (const m of marks()) {
      const def = STATUS_FX[m.getAttribute('data-stage-fx-mark') as StatusFxKind];
      const crop = STATUS_LOOP_CROP[def.loop!];
      expect(m.getAttribute('data-stage-fx-crop')).toBe(`${crop.x},${crop.y},${crop.w},${crop.h}`);
      expect(m.getAttribute('data-stage-fx-loop')).toBe(m.getAttribute('data-stage-fx-mark'));
      const icon = parseFloat(m.style.width);
      sizes.add(icon);
      expect(m.style.overflow).toBe('hidden');
      const sheet = m.querySelector('.sm-bs-sheet') as HTMLElement; // a folha em loop corre por dentro da moldura
      expect(sheet).not.toBeNull();
      // o quadro de 128 px escala para o recorte (o miolo, na arte alta) encher o marcador: a folha fica MAIOR que a moldura
      expect(parseFloat(sheet.style.width)).toBeCloseTo((icon * STATUS_LOOP_FRAME_PX) / statusLoopCropSide(crop), 3);
      expect(parseFloat(sheet.style.width)).toBeGreaterThan(icon);
    }
    expect(sizes.size).toBe(1);
  });

  it('§328 toda folha em loop usada como marcador tem recorte medido, dentro do quadro de 128 px', () => {
    for (const k of STATUS_FX_KINDS) {
      const loop = STATUS_FX[k].loop;
      if (!loop || k === 'escudo') continue;
      const c = STATUS_LOOP_CROP[loop];
      expect(c, loop).toBeTruthy();
      expect(c.x >= 0 && c.y >= 0 && c.w > 0 && c.h > 0 && c.x + c.w <= STATUS_LOOP_FRAME_PX && c.y + c.h <= STATUS_LOOP_FRAME_PX, loop).toBe(true);
    }
  });

  it('SEMPRE na frente: acima do sprite, do escudo, do véu, da aura e de quem conjura — no especial do pet e no do inimigo', async () => {
    for (const actor of ['me', 'foe'] as const) {
      render(<BattleStage {...base} me={{ ...me, status: dois }} foes={[foe({ status: dois })]} action={acao('special', { actor, strike: 'ranged' })} />);
      await pronto();
      const zs = [...document.querySelectorAll<HTMLElement>('[data-stage-sprite]')].map((e) => Number(e.closest<HTMLElement>('[style*="z-index"]')!.style.zIndex));
      const fx = [...document.querySelectorAll<HTMLElement>('[data-stage-cutscene], [data-stage-special], [data-stage-cast], [data-stage-fx], [data-stage-fx-still], [data-stage-bars-row]')].map((e) => Number(e.style.zIndex));
      const rows = [...document.querySelectorAll<HTMLElement>('[data-stage-fx-row]')];
      expect(rows).toHaveLength(4);
      for (const r of rows) expect(Number(r.style.zIndex)).toBe(Z_FX_MARK);
      expect(Z_FX_MARK, actor).toBeGreaterThan(Math.max(...zs, ...fx));
      cleanup();
    }
  });

  it('§328 até 3 por canto, sem "+k": os 3 que começaram antes', async () => {
    const st: StageStatus[] = [{ kind: 'veneno', turns: 3 }, { kind: 'lento', turns: 2 }, { kind: 'queimadura', turns: 2 }, { kind: 'silencio', turns: 1 }, { kind: 'maldicao', turns: 2 }];
    render(<BattleStage {...base} me={me} foes={[foe({ status: st })]} />);
    await quando(() => document.querySelectorAll('[data-stage-fx-mark]').length === MAX_STATUS_CHIPS);
    expect(MAX_STATUS_CHIPS).toBe(3);
    expect(kinds(row('foe', 'debuff'))).toEqual(['veneno', 'lento', 'queimadura']);
    expect(document.querySelector('[data-stage-fx-more]')).toBeNull();
  });
});

describe('movimento reduzido: reduz o movimento e MANTÉM a informação', () => {
  const status: StageStatus[] = [{ kind: 'buff', variant: 'atk', turns: 2 }, { kind: 'dot', turns: 3 }];

  it('o marcador tem o mesmo aria-label e os mesmos turnos nos dois modos; só o loop sai', async () => {
    const lido = () => marks().map((m) => ({ aria: rotulo(m), kind: m.getAttribute('data-stage-fx-mark'), turns: m.getAttribute('data-stage-fx-turns') }));
    const { unmount } = render(<BattleStage {...base} isPt me={me} foes={[foe({ status })]} />);
    await quando(() => document.querySelector('[data-stage-fx-loop]') && marks().length === 2);
    const normal = lido();
    unmount();

    reduzir();
    render(<BattleStage {...base} isPt me={me} foes={[foe({ status })]} />);
    await quando(() => marks().length === 2);
    expect(lido()).toEqual(normal); // a mesma informação
    expect(normal.map((n) => n.aria)).toEqual(['Dano contínuo, 3 turnos', 'Ataque em alta, 2 turnos']);
    // sem movimento: nenhuma camada em loop
    expect(document.querySelector('[data-stage-fx-loop]')).toBeNull();
    expect(document.querySelector('.sm-bs-sheet')).toBeNull();
    semSeloDaBarra();
  });
});

describe('círculo de cast do especial (`data-stage-cast="special"`)', () => {
  it('o especial renderiza o círculo; o golpe básico, não', () => {
    const { rerender } = render(<BattleStage {...base} me={me} foes={[foe()]} action={acao('ranged')} />);
    expect(document.querySelector('[data-stage-cast]')).toBeNull();
    rerender(<BattleStage {...base} me={me} foes={[foe()]} action={acao('melee')} />);
    expect(document.querySelector('[data-stage-cast]')).toBeNull();
    rerender(<BattleStage {...base} me={me} foes={[foe()]} action={acao('special', { id: 2, strike: 'ranged' })} />);
    expect(document.querySelector('[data-stage-cast="special"]')).not.toBeNull();
  });

  it('vale para o especial do INIMIGO também (a esquiva abre o cast dele)', () => {
    render(<BattleStage {...base} me={me} foes={[foe()]} action={acao('special', { actor: 'foe', castMs: 900, impactMs: 1500 })} />);
    expect(document.querySelector('[data-stage-cast="special"]')).not.toBeNull();
  });

  it('sem a arte: anel em CSS (fallback) com tokens, e o selo SPECIAL! segue ali', () => {
    render(<BattleStage {...base} me={me} foes={[foe()]} action={acao('special')} specialLabel="Lâmina" />);
    const c = document.querySelector('[data-stage-cast="special"]') as HTMLElement;
    expect(c.getAttribute('data-stage-cast-art')).toBe('css');
    expect(c.querySelector('img')).toBeNull();
    expect(c.innerHTML).toContain('var(--sm2-gold-ink)');
    expect(document.querySelector('[data-stage-special]')!.textContent).toBe('Lâmina');
  });

  it('com a arte carregada: a peça fx-cast-circle', async () => {
    render(<BattleStage {...base} me={me} foes={[foe()]} action={acao('special')} />);
    await quando(() => document.querySelector('[data-stage-cast="special"][data-stage-cast-art="img"]'));
    const c = document.querySelector('[data-stage-cast="special"]') as HTMLElement;
    expect(c.getAttribute('data-stage-cast-art')).toBe('img');
    expect(c.querySelector('img')).not.toBeNull();
  });

  it('movimento reduzido: o círculo continua (flash único, sem girar) e nenhum FX móvel do cast aparece', () => {
    reduzir();
    render(<BattleStage {...base} me={me} foes={[foe()]} action={acao('special', { strike: 'ranged' })} />);
    const c = document.querySelector('[data-stage-cast="special"]') as HTMLElement;
    expect(c).not.toBeNull();
    expect(c.getAttribute('data-stage-cast-motion')).toBe('flash');
    expect(c.className).toBe('sm-bs-pop'); // o `sm-bs-pop` vira o flash único no CSS reduzido
    expect(document.querySelector('.sm-bs-cast, .sm-bs-fly, .sm-bs-circle, .sm-bs-sheet')).toBeNull();
    expect(document.querySelector('[data-stage-special]')).not.toBeNull(); // o texto do especial segue
  });
});
