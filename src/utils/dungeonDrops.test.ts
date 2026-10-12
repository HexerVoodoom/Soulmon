import { describe, it, expect } from 'vitest';
import { pushDrop, popDrop, dropName, dropTitle, type DropGroup } from './dungeonDrops';
import { DUNGEON_SPEEDS, nextDungeonSpeed, sanitizeDungeonSpeed } from './dungeonIdle';

describe('fila do modalzinho de drop', () => {
  it('um item novo vira um grupo com a quantidade', () => {
    const q = pushDrop([], 'heart', 1, 1, 1);
    expect(q).toEqual([{ id: 1, lines: [{ kind: 'heart', qty: 1 }] }]);
  });

  it('o MESMO item soma na entrada que espera (não vira outro modal)', () => {
    let q: DropGroup[] = [];
    q = pushDrop(q, 'heart', 1, 1, 1);
    q = pushDrop(q, 'heart', 1, 1, 2);
    q = pushDrop(q, 'fragments', 5, 1, 3);
    q = pushDrop(q, 'heart', 1, 1, 4);
    expect(q.length).toBe(2);
    expect(q[0].lines).toEqual([{ kind: 'heart', qty: 3 }]);
    expect(q[1].lines).toEqual([{ kind: 'fragments', qty: 5 }]);
  });

  it('itens diferentes entram em fila (um modal por vez) em 1× e 2×', () => {
    for (const speed of [1, 2]) {
      let q: DropGroup[] = [];
      q = pushDrop(q, 'heart', 1, speed, 1);
      q = pushDrop(q, 'glitchtama', 1, speed, 2);
      q = pushDrop(q, 'fragments', 10, speed, 3);
      expect(q.map(g => g.lines[0].kind)).toEqual(['heart', 'glitchtama', 'fragments']);
    }
  });

  it('em 3× TUDO vira UM modal só (coalescido), com um id novo para ele reaparecer atualizado', () => {
    let q: DropGroup[] = [];
    q = pushDrop(q, 'heart', 1, 3, 1);
    q = pushDrop(q, 'glitchtama', 1, 3, 2);
    q = pushDrop(q, 'fragments', 10, 3, 3);
    q = pushDrop(q, 'heart', 1, 3, 4);
    expect(q.length).toBe(1);
    expect(q[0].id).toBe(4);
    expect(q[0].lines).toEqual([{ kind: 'heart', qty: 2 }, { kind: 'glitchtama', qty: 1 }, { kind: 'fragments', qty: 10 }]);
  });

  it('quantidade inválida não entra e a fila não é mutada', () => {
    const q0: DropGroup[] = [{ id: 1, lines: [{ kind: 'heart', qty: 1 }] }];
    const copia = JSON.stringify(q0);
    for (const n of [0, -2, NaN, Infinity * 0]) expect(pushDrop(q0, 'heart', n, 1, 9)).toEqual(q0);
    pushDrop(q0, 'heart', 3, 1, 9);
    expect(JSON.stringify(q0)).toBe(copia);
  });

  it('fechar tira o da frente', () => {
    const q = pushDrop(pushDrop([], 'heart', 1, 1, 1), 'glitchtama', 1, 1, 2);
    expect(popDrop(q).map(g => g.id)).toEqual([2]);
    expect(popDrop([])).toEqual([]);
  });

  it('nomes PT/EN e a frase do título', () => {
    expect(dropName('heart', true)).toBe('Coraçãozinho');
    expect(dropName('heart', false)).toBe('Little heart');
    expect(dropName('glitchtama', true)).toBe('Glitchtama'); // o nome vem de SPECIAL_ITEMS (shop.ts)
    expect(dropName('fragments', true)).toBe('Fragmentos do Soulsmith');
    expect(dropName('fragments', false)).toBe('Soulsmith fragments');
    expect(dropTitle([{ kind: 'heart', qty: 1 }], true)).toBe('Você achou');
    expect(dropTitle([{ kind: 'heart', qty: 1 }, { kind: 'fragments', qty: 2 }], false)).toBe('You found a few things');
  });
});

describe('velocidade da masmorra', () => {
  it('só 1, 2 e 3; lixo vira 1×; o botão cicla', () => {
    expect([...DUNGEON_SPEEDS]).toEqual([1, 2, 3]);
    for (const lixo of [null, undefined, 0, 4, -1, 'x', NaN, {}, [], '2.5']) expect(sanitizeDungeonSpeed(lixo)).toBe(1);
    expect(sanitizeDungeonSpeed('2')).toBe(2);
    expect(sanitizeDungeonSpeed(3)).toBe(3);
    expect(nextDungeonSpeed(1)).toBe(2);
    expect(nextDungeonSpeed(2)).toBe(3);
    expect(nextDungeonSpeed(3)).toBe(1);
  });
});
