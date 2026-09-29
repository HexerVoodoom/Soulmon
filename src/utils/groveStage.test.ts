import { describe, it, expect } from 'vitest';
import { groveCreatures, spriteForMember, spreadX, OWN_RENDER, OTHER_RENDER } from './groveStage';
import { DUNGEON_LINE_SPRITES } from './sprites';
import { GUILD_MAX_MEMBERS, GUILD_PRESENCE_NOMINAL_MAX } from './guildRules';

/** O id OPACO por guilda que o servidor manda (16 hex): é ele a chave da lista e a semente do sprite. */
const mid = (i: number) => `a1b2c3d4e5f6a7${i.toString(16).padStart(2, '0')}`;
const roda = (n: number, eu = 0) => ({
  size: n,
  members: Array.from({ length: n }, (_, i) => ({ id: mid(i), name: `M${i}`, euMesmo: i === eu, ...(n <= 4 ? { apareceuHoje: i % 2 === 0 } : {}) })),
});

describe('palco do Bosque — quem aparece', () => {
  it('de 1 a 4: um por membro, na ORDEM DE CHEGADA, e a própria é a única grande', () => {
    for (let n = 1; n <= GUILD_PRESENCE_NOMINAL_MAX; n++) {
      const c = groveCreatures(roda(n, n - 1));
      expect(c).toHaveLength(n);
      expect(c.map(x => x.key)).toEqual(Array.from({ length: n }, (_, i) => mid(i)));
      expect(c.filter(x => x.own)).toHaveLength(1);
      expect(c.filter(x => x.own)[0].size).toBe(OWN_RENDER);
      expect(c.filter(x => !x.own).every(x => x.size === OTHER_RENDER)).toBe(true);
    }
  });

  it('de 5 a 12: SÓ a própria, no centro, e nenhuma dos outros', () => {
    for (let n = GUILD_PRESENCE_NOMINAL_MAX + 1; n <= GUILD_MAX_MEMBERS; n++) {
      const c = groveCreatures(roda(n, 2));
      expect(c).toEqual([{ key: 'eu', own: true, x: 50, size: OWN_RENDER, sprite: null }]);
    }
  });

  it('não lê presença: `apareceuHoje` é irrelevante para quem aparece, onde e como', () => {
    const a = roda(4);
    const b = { ...a, members: a.members.map(m => ({ ...m, apareceuHoje: !m.apareceuHoje })) };
    const c = { ...a, members: a.members.map(({ apareceuHoje: _p, ...m }) => m) };
    expect(groveCreatures(b)).toEqual(groveCreatures(a));
    expect(groveCreatures(c)).toEqual(groveCreatures(a));
  });

  it('sem "eu" na lista (vista inconsistente), volta à regra segura: só a própria', () => {
    const r = roda(3);
    r.members.forEach(m => { m.euMesmo = false; });
    expect(groveCreatures(r)).toHaveLength(1);
  });

  it('a distribuição conta o TAMANHO: a criatura grande não come a vizinha (caixas não se sobrepõem)', () => {
    for (let n = 1; n <= 4; n++) {
      const sizes = [OWN_RENDER, ...Array(n - 1).fill(OTHER_RENDER)];
      const xs = spreadX(sizes).map(x => (x / 100) * 320);
      for (let i = 1; i < n; i++) expect(xs[i] - sizes[i] / 2).toBeGreaterThanOrEqual(xs[i - 1] + sizes[i - 1] / 2 - 0.5);
    }
    expect(spreadX([128])).toEqual([50]);
  });

  it('posições dentro do vidro (nada colado na borda) e crescentes', () => {
    for (let n = 1; n <= 4; n++) {
      const xs = groveCreatures(roda(n)).map(x => x.x);
      expect(xs.every(x => x >= 10 && x <= 92)).toBe(true);
      expect(xs).toEqual([...xs].sort((p, q) => p - q));
    }
  });

  it('a criatura de outro membro é uma das NOSSAS linhas, determinística por id — nunca estágio, nunca URL alheia', () => {
    const nossas = new Set(Object.values(DUNGEON_LINE_SPRITES).map(l => l.rookie));
    for (const id of [mid(1), mid(2), 'zzz', '']) {
      expect(nossas.has(spriteForMember(id))).toBe(true);
      expect(spriteForMember(id)).toBe(spriteForMember(id));
    }
    expect(new Set(Array.from({ length: 40 }, (_, i) => spriteForMember(mid(i)))).size).toBeGreaterThan(3);
  });

  it('escalas inteiras do sprite de 256² e 384²', () => {
    for (const px of [OWN_RENDER, OTHER_RENDER]) { expect(256 % px).toBe(0); expect(384 % px).toBe(0); }
  });
});
