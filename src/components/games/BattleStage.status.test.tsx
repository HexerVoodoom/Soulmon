// @vitest-environment jsdom
/**
 * BATTLE STAGE — FX de status e círculo de cast (PR11, run `combate-v3-01`).
 * Estados: sem status · 1 · vários (+k) · expirando · alvo derrubado · movimento reduzido · sem arte (fallback em CSS).
 * Regra: a MESMA informação (efeito, turnos, forma, texto) aparece com e sem movimento.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { BattleStage, type StageAction, type StageFighter } from './BattleStage';
import { STATUS_FX, STATUS_FX_KINDS, MAX_STATUS_CHIPS, statusAriaLabel, statusPolarity, type StageStatus, type StatusFxKind } from '../../utils/combatFx';
import { Z_STATUS } from './BattleStage';
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

const chips = () => [...document.querySelectorAll('[data-stage-status]')] as HTMLElement[];
const chip = (kind: StatusFxKind) => document.querySelector(`[data-stage-status="${kind}"]`) as HTMLElement | null;
const acao = (kind: StageAction['kind'], extra: Partial<StageAction> = {}): StageAction => ({ id: 1, actor: 'me', foe: 0, kind, element: 'fogo', ...extra });

describe('selos de status — um por efeito, com efeito e turnos no aria-label', () => {
  for (const kind of STATUS_FX_KINDS) {
    it(`${kind}: o lutador mostra data-stage-status="${kind}" com o efeito e os turnos (EN e PT); quando a duração acaba, some`, () => {
      const turns = 3;
      for (const isPt of [false, true]) {
        const { rerender, unmount } = render(<BattleStage {...base} isPt={isPt} me={me} foes={[foe({ status: [{ kind, turns }] })]} />);
        const el = chip(kind)!;
        expect(el, 'selo').not.toBeNull();
        expect(el.getAttribute('aria-label')).toBe(statusAriaLabel(kind, turns, isPt));
        expect(el.getAttribute('aria-label')).toContain(String(turns));
        expect(el.getAttribute('role')).toBe('img');
        // a forma (seta/sinal) e o texto curto estão NA TELA, em texto — não dependem da imagem nem da cor
        expect(el.textContent).toContain(STATUS_FX[kind].mark);
        expect(el.textContent).toContain(String(turns));
        // a duração acabou: o motor tira o status e o selo some
        rerender(<BattleStage {...base} isPt={isPt} me={me} foes={[foe({ status: [] })]} />);
        expect(chip(kind)).toBeNull();
        unmount();
      }
    });
  }

  it('sem status: nenhuma camada (nem a fileira)', () => {
    render(<BattleStage {...base} me={me} foes={[foe()]} />);
    expect(chips()).toHaveLength(0);
    expect(document.querySelector('[data-stage-status-row]')).toBeNull();
    expect(document.querySelector('[data-stage-fx-loop]')).toBeNull();
  });

  it('o pet também carrega status (o buff dele), e cada lutador mostra o SEU', () => {
    render(<BattleStage {...base} isPt me={{ ...me, status: [{ kind: 'buff', variant: 'atk', turns: 2 }] }} foes={[foe({ status: [{ kind: 'debuff', variant: 'def', turns: 3 }] })]} />);
    expect(chips().map(c => c.getAttribute('aria-label'))).toEqual(['Defesa em baixa, 3 turnos', 'Ataque em alta, 2 turnos']) // ordem do DOM: inimigos, depois o pet;
  });

  it('vários no mesmo alvo: cada ZONA mostra até o limite e o excedente dela vira "+k"', () => {
    const status: StageStatus[] = [
      { kind: 'buff', variant: 'atk', turns: 3 }, { kind: 'buff', variant: 'spd', turns: 2 }, { kind: 'escudo', turns: 3 }, { kind: 'hot', turns: 2 },
      { kind: 'dot', turns: 3 }, { kind: 'debuff', variant: 'def', turns: 1 },
    ];
    render(<BattleStage {...base} me={me} foes={[foe({ status })]} />);
    const buffRow = document.querySelector('[data-stage-status-zone="buff"]') as HTMLElement;
    const debuffRow = document.querySelector('[data-stage-status-zone="debuff"]') as HTMLElement;
    expect(buffRow.querySelectorAll('[data-stage-status]')).toHaveLength(MAX_STATUS_CHIPS);
    expect(debuffRow.querySelectorAll('[data-stage-status]')).toHaveLength(2);
    expect(debuffRow.querySelector('[data-stage-status-more]')).toBeNull();
    const more = buffRow.querySelector('[data-stage-status-more]') as HTMLElement;
    expect(more.getAttribute('data-stage-status-more')).toBe('1');
    expect(more.getAttribute('aria-label')).toBe('1 more effect');
    expect(more.textContent).toBe('+1');
    // os mais antigos ficam: o 4º buff (o mais novo) é o que vira "+1"
    expect([...buffRow.querySelectorAll('[data-stage-status]')].map((c) => c.getAttribute('data-stage-status'))).toEqual(['buff', 'buff', 'escudo']);
  });

  it('último turno: o selo marca "acabando" por borda tracejada e atributo, e mostra o 1', () => {
    render(<BattleStage {...base} me={me} foes={[foe({ status: [{ kind: 'buff', variant: 'spd', turns: 1 }] })]} />);
    const el = chip('buff')!;
    expect(el.getAttribute('data-stage-status-last')).toBe('1');
    expect(el.style.border).toContain('dashed');
    expect(el.textContent).toContain('1');
    expect(el.getAttribute('aria-label')).toBe('Speed up, 1 turn left');
  });

  it('alvo derrubado com status: some (e o pet derrubado também)', () => {
    render(<BattleStage {...base} me={{ ...me, down: true, status: [{ kind: 'cura', turns: 1 }] }} foes={[foe({ down: true, status: [{ kind: 'dot', turns: 2 }] })]} />);
    expect(chips()).toHaveLength(0);
    expect(document.querySelector('[data-stage-fx-loop]')).toBeNull();
  });

  it('sem arte (fallback): o selo sai só com forma + texto + turnos, sem imagem, e a luta não trava', () => {
    // a arte é sob demanda: no primeiro desenho ela ainda não chegou — é exatamente o caso "sem arte"
    render(<BattleStage {...base} me={me} foes={[foe({ status: [{ kind: 'maldicao', turns: 2 }] })]} />);
    const el = chip('maldicao')!;
    expect(el.getAttribute('data-stage-status-art')).toBe('css');
    expect(el.querySelector('img')).toBeNull();
    expect(el.textContent).toContain(STATUS_FX.maldicao.mark);
    expect(el.textContent).toContain('2');
    expect(document.querySelector('[data-stage-fx-loop]')).toBeNull(); // o loop só entra com a folha carregada
  });

  it('a arte chega depois (carga preguiçosa): o glifo e o loop aparecem, e é UMA camada animada por lutador', async () => {
    render(<BattleStage {...base} me={me} foes={[foe({ status: [{ kind: 'debuff', variant: 'def', turns: 3 }, { kind: 'dot', turns: 3 }, { kind: 'buff', variant: 'atk', turns: 2 }] })]} />);
    await quando(() => chip('debuff')?.querySelector('img') && document.querySelector('[data-stage-fx-loop]'));
    expect(chip('debuff')!.getAttribute('data-stage-status-art')).toBe('img');
    expect(chip('debuff')!.querySelector('img')).not.toBeNull();
    expect(document.querySelectorAll('[data-stage-fx-loop]')).toHaveLength(1); // orçamento: no máximo 1 camada animada por lutador
    expect(document.querySelector('[data-stage-fx-loop]')!.getAttribute('data-stage-fx-loop')).toBe('debuff'); // o de maior prioridade
  });

  it('cura e escudo desenham a peça estática existente (fx-heal / fx-shield) — sem loop', async () => {
    render(<BattleStage {...base} me={{ ...me, status: [{ kind: 'escudo', turns: 3 }] }} foes={[foe({ status: [{ kind: 'cura', turns: 1 }] })]} />);
    await quando(() => document.querySelector('[data-stage-fx-still="escudo"]') && document.querySelector('[data-stage-fx-still="cura"]'));
    expect(document.querySelector('[data-stage-fx-still="escudo"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-fx-still="cura"]')).not.toBeNull();
    expect(document.querySelector('[data-stage-fx-loop]')).toBeNull();
  });
});

describe('selos: zona por tipo, ordem de início e sempre na frente (dono, 13/11/2026)', () => {
  const dois: StageStatus[] = [
    { kind: 'veneno', turns: 3 }, { kind: 'buff', variant: 'atk', turns: 2 }, { kind: 'lento', turns: 2 }, { kind: 'escudo', turns: 4 },
  ];
  const row = (side: 'me' | 'foe', zone: 'buff' | 'debuff') => document.querySelector(`[data-stage-status-side="${side}"][data-stage-status-zone="${zone}"]`) as HTMLElement | null;
  const kinds = (r: HTMLElement | null) => [...(r?.querySelectorAll('[data-stage-status]') ?? [])].map((c) => c.getAttribute('data-stage-status'));

  it('cada efeito cai na zona do seu tipo: contra quem carrega = debuff; a favor = buff', () => {
    expect(STATUS_FX_KINDS.filter((k) => statusPolarity(k) === 'buff').sort()).toEqual(['buff', 'cura', 'escudo', 'hot']);
    for (const kind of STATUS_FX_KINDS) {
      render(<BattleStage {...base} me={me} foes={[foe({ status: [{ kind, turns: 2 }] })]} />);
      expect(chip(kind)!.closest('[data-stage-status-row]')!.getAttribute('data-stage-status-zone'), kind).toBe(statusPolarity(kind));
      cleanup();
    }
  });

  it('2 debuffs e 2 buffs nos dois lados: lado a lado na zona, na ordem em que começaram; inimigo RTL, pet LTR', () => {
    render(<BattleStage {...base} me={{ ...me, status: dois }} foes={[foe({ status: dois })]} />);
    for (const side of ['me', 'foe'] as const) {
      // o DOM guarda a ordem de início (o mais antigo primeiro); a direção da fileira põe o mais novo à esquerda (inimigo) ou à direita (pet)
      expect(kinds(row(side, 'debuff'))).toEqual(['veneno', 'lento']);
      expect(kinds(row(side, 'buff'))).toEqual(['buff', 'escudo']);
      for (const z of ['debuff', 'buff'] as const) {
        expect(row(side, z)!.style.flexDirection).toBe(side === 'foe' ? 'row-reverse' : 'row');
        expect(row(side, z)!.getAttribute('data-stage-status-order')).toBe(side === 'foe' ? 'rtl' : 'ltr');
      }
    }
  });

  it('o contador de turnos continua no selo, legível (>= 11 px, com fundo)', () => {
    render(<BattleStage {...base} me={me} foes={[foe({ status: dois })]} />);
    for (const c of chips()) {
      const n = c.querySelector('[data-stage-status-count]') as HTMLElement;
      expect(n.textContent).toBe(c.getAttribute('data-stage-status-turns'));
      expect(parseFloat(n.style.fontSize)).toBeGreaterThanOrEqual(11);
      expect(n.style.backgroundColor).not.toBe('');
    }
  });

  it('SEMPRE na frente: acima do sprite, do véu, da aura e de quem conjura — no especial do pet e no do inimigo', () => {
    for (const actor of ['me', 'foe'] as const) {
      render(<BattleStage {...base} me={{ ...me, status: dois }} foes={[foe({ status: dois })]} action={acao('special', { actor, strike: 'ranged' })} />);
      const zs = [...document.querySelectorAll<HTMLElement>('[data-stage-sprite]')].map((e) => Number(e.closest<HTMLElement>('[style*="z-index"]')!.style.zIndex));
      const fx = [...document.querySelectorAll<HTMLElement>('[data-stage-cutscene], [data-stage-special], [data-stage-cast], [data-stage-fx], [data-stage-fx-loop], [data-stage-fx-still]')].map((e) => Number(e.style.zIndex));
      const top = Math.max(...zs, ...fx);
      const rows = [...document.querySelectorAll<HTMLElement>('[data-stage-status-row]')];
      expect(rows).toHaveLength(4);
      for (const r of rows) {
        expect(Number(r.style.zIndex)).toBe(Z_STATUS);
        expect(Z_STATUS, actor).toBeGreaterThan(top);
      }
      cleanup();
    }
  });
});

describe('movimento reduzido: reduz o movimento e MANTÉM a informação', () => {
  const status: StageStatus[] = [{ kind: 'buff', variant: 'atk', turns: 2 }, { kind: 'dot', turns: 3 }];

  it('o selo tem o mesmo aria-label, a mesma forma, o mesmo texto e os mesmos turnos nos dois modos; só o loop e a entrada animada saem', async () => {
    const lido = () => chips().map(c => ({ aria: c.getAttribute('aria-label'), texto: c.textContent, turns: c.getAttribute('data-stage-status-turns') }));
    const { unmount } = render(<BattleStage {...base} isPt me={me} foes={[foe({ status })]} />);
    await quando(() => document.querySelector('[data-stage-fx-loop]') && chips().length === 2 && chips().every(c => c.getAttribute('data-stage-status-art') === 'img'));
    const normal = lido();
    expect(document.querySelector('[data-stage-fx-loop]')).not.toBeNull();
    expect(chips().every(c => c.className.includes('sm-bs-stpop'))).toBe(true);
    unmount();

    reduzir();
    render(<BattleStage {...base} isPt me={me} foes={[foe({ status })]} />);
    await quando(() => chips().length === 2 && chips().every(c => c.getAttribute('data-stage-status-art') === 'img'));
    expect(lido()).toEqual(normal); // a mesma informação
    expect(normal.length).toBe(2);
    // sem movimento: nenhuma camada em loop e nenhum selo com animação
    expect(document.querySelector('[data-stage-fx-loop]')).toBeNull();
    expect(document.querySelector('.sm-bs-sheet')).toBeNull();
    expect(chips().some(c => c.className.includes('sm-bs-stpop'))).toBe(false);
    // o glifo estático continua (a imagem do selo)
    expect(chips()[0].getAttribute('data-stage-status-art')).toBe('img');
  });

  it('o ícone/forma do selo não pode sumir no modo reduzido (a prova de vermelho do critério 5)', () => {
    reduzir();
    render(<BattleStage {...base} me={me} foes={[foe({ status: [{ kind: 'debuff', variant: 'def', turns: 2 }] })]} />);
    const el = chip('debuff')!;
    expect(el.querySelector('[data-stage-status-mark]')!.textContent).toBe(STATUS_FX.debuff.mark);
    expect(el.getAttribute('aria-label')).toBe('Defense down, 2 turns left');
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
