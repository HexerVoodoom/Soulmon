/** Tarefa B (§2.37) — o GRAFO e o DESENHO da árvore de talentos. */
import { describe, it, expect } from 'vitest';
import {
  TALENT_TREE, TALENT_BY_ID, TALENT_POINTS_MAX, isPickable, prereqsMet, missingPrereqs, isValidPicks, sanitizeTalentPicks,
  canTakeBack, applyRespecOne, pickTalent, ranksOf,
} from './talents';
import { LAYOUT_NODES, LAYOUT_EDGES, BOARD, NODE_SIZE, neighborIn } from './talentLayout';

const refs = (n: (typeof TALENT_TREE)[number]) => [...(n.requires ?? []), ...(n.requiresAny ?? [])];

describe('o grafo', () => {
  it('só exige nós que existem, com grau possível, e nunca a si mesmo', () => {
    for (const n of TALENT_TREE) for (const r of refs(n)) {
      const d = TALENT_BY_ID.get(r.id)!;
      expect(d, `${n.id}→${r.id}`).toBeDefined();
      expect(r.rank).toBeGreaterThanOrEqual(1);
      expect(r.rank).toBeLessThanOrEqual(d.maxRank);
      expect(r.id).not.toBe(n.id);
      expect(d.path).toBe(n.path);
    }
  });
  it('não tem ciclo (ordem topológica existe)', () => {
    const done = new Set<string>();
    let rest = [...TALENT_TREE];
    while (rest.length) {
      const ok = rest.filter((n) => refs(n).every((r) => done.has(r.id)));
      expect(ok.length, 'ciclo').toBeGreaterThan(0);
      ok.forEach((n) => done.add(n.id));
      rest = rest.filter((n) => !done.has(n.id));
    }
  });
  it('todo nó COMPRÁVEL é alcançável usando só nós compráveis, dentro dos 20 pontos', () => {
    const ranks = new Map<string, number>();
    let gastos = 0;
    const pega = (id: string, depth = 0) => {
      expect(depth).toBeLessThan(10);
      const n = TALENT_BY_ID.get(id)!;
      expect(isPickable(n), `${id} depende de nó pendente`).toBe(true);
      const need = n.requires ?? [];
      for (const r of need) while ((ranks.get(r.id) ?? 0) < r.rank) pega(r.id, depth + 1);
      if (n.requiresAny && !n.requiresAny.some((r) => (ranks.get(r.id) ?? 0) >= r.rank)) {
        const r = n.requiresAny[0];
        while ((ranks.get(r.id) ?? 0) < r.rank) pega(r.id, depth + 1);
      }
      ranks.set(id, (ranks.get(id) ?? 0) + 1); gastos++;
    };
    for (const n of TALENT_TREE.filter(isPickable)) { if (!ranks.get(n.id)) pega(n.id); }
    expect(gastos).toBeGreaterThan(0);
  });
  it('20 pontos nunca fecham a árvore (o custo dos nós compráveis passa do teto)', () => {
    expect(TALENT_TREE.filter(isPickable).reduce((s, n) => s + n.maxRank, 0)).toBeGreaterThan(TALENT_POINTS_MAX);
  });
  it('pré-requisito de UM nó e de DOIS nós: só abre com os dois; ANY abre com qualquer um', () => {
    const com05 = TALENT_BY_ID.get('tal-com-05')!; // um
    expect(prereqsMet(com05, new Map([['tal-com-03', 1]]))).toBe(false);
    expect(prereqsMet(com05, new Map([['tal-com-03', 2]]))).toBe(true);
    const com07 = TALENT_BY_ID.get('tal-com-07')!; // dois
    expect(prereqsMet(com07, new Map([['tal-com-04', 1]]))).toBe(false);
    expect(prereqsMet(com07, new Map([['tal-com-04', 1], ['tal-com-05', 1]]))).toBe(true);
    const pvp05 = TALENT_BY_ID.get('tal-pvp-05')!; // um OU outro
    expect(prereqsMet(pvp05, new Map())).toBe(false);
    expect(prereqsMet(pvp05, new Map([['tal-pvp-03', 2]]))).toBe(true);
    expect(prereqsMet(pvp05, new Map([['tal-pvp-02', 2]]))).toBe(true);
    expect(missingPrereqs(pvp05, new Map()).any).toHaveLength(2);
    expect(missingPrereqs(com07, new Map([['tal-com-04', 1]])).all.map((r) => r.id)).toEqual(['tal-com-05']);
  });
  it('comprar fora de ordem é recusado; vetor com nó sem pré-requisito é inválido', () => {
    expect(pickTalent([], 'tal-pvp-02', 20)).toEqual([]);
    expect(isValidPicks(['tal-pvp-02'], 20)).toBe(false);
    expect(isValidPicks(['tal-pvp-01', 'tal-pvp-01', 'tal-pvp-02'], 20)).toBe(true);
    expect(isValidPicks(['tal-pvp-02', 'tal-pvp-01', 'tal-pvp-01'], 20)).toBe(true); // a ORDEM do vetor não importa: dá para comprar em alguma
  });
  it('save legado (de antes dos pré-requisitos): poda o que viola, mantém o que compra, sem tocar em Bits', () => {
    const legado = ['tal-pvp-02', 'tal-pvp-02', 'tal-pvp-01', 'tal-pve-02', 'tal-com-05'];
    const s = sanitizeTalentPicks(legado, 10);
    expect(s).toEqual(['tal-pvp-01']);
    expect(isValidPicks(s, 10)).toBe(true);
    expect(sanitizeTalentPicks(['tal-pvp-01', 'lixo'], 10)).toEqual([]); // malformado descarta tudo
  });
  it('tirar o grau de que outro nó depende é recusado (needed) e não cobra', () => {
    const picks = ['tal-pvp-01', 'tal-pvp-01', 'tal-pvp-02', ...Array(2).fill('tal-com-01'), ...Array(2).fill('tal-com-03'), 'tal-com-05'];
    expect(canTakeBack(picks, 'tal-pvp-01')).toBe(false);
    const r = applyRespecOne({ talentPicks: picks, gamePoints: 999 }, 'tal-pvp-01');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('needed');
    expect(canTakeBack(picks, 'tal-pvp-02')).toBe(true);
    expect(ranksOf(picks).get('tal-pvp-01')).toBe(2);
  });
});

describe('o desenho', () => {
  it('todo nó tem posição dentro do tabuleiro, sem sobreposição', () => {
    expect(LAYOUT_NODES).toHaveLength(TALENT_TREE.length);
    for (const n of LAYOUT_NODES) {
      expect(n.x).toBeGreaterThan(NODE_SIZE / 2); expect(n.x).toBeLessThan(BOARD.width - NODE_SIZE / 2);
      expect(n.y).toBeGreaterThan(NODE_SIZE / 2); expect(n.y).toBeLessThan(BOARD.height - NODE_SIZE / 2);
    }
    for (const a of LAYOUT_NODES) for (const b of LAYOUT_NODES) if (a.id < b.id) {
      expect(Math.hypot(a.x - b.x, a.y - b.y), `${a.id}/${b.id}`).toBeGreaterThan(NODE_SIZE + 8);
    }
  });
  it('as ligações saem do grafo: cada nó tem ao menos uma, e os pontos de partida ligam ao hub', () => {
    for (const n of TALENT_TREE) expect(LAYOUT_EDGES.some((e) => e.to === n.id), n.id).toBe(true);
    expect(LAYOUT_EDGES.filter((e) => e.from === 'hub').map((e) => e.to).sort()).toEqual(['tal-com-01', 'tal-pve-01', 'tal-pvp-01']);
  });
  it('setas: sempre achar um vizinho a partir de qualquer nó, em alguma direção', () => {
    for (const n of LAYOUT_NODES) expect((['left', 'right', 'up', 'down'] as const).some((d) => neighborIn(n.id, d) !== null), n.id).toBe(true);
  });
});
