import { describe, expect, it } from 'vitest';
import { ELEMENTOS_DA_MASMORRA } from './dungeonElementos';
import { startLayerFor } from './dungeonIdle';
import { RIFT_SET_COUNT } from './riftSets';
import {
  RIFT_MAP_HEIGHT, consumeResume, firstFloorOfSet, riftCurrentLayer, riftMapNode, riftMapWindow, riftNodeX, riftRewindRefusal, riftSegmentPath,
  riftSegmentReached, riftStartLayer, riftVisibleRange, rewindToSet, sanitizeResumeLayer, type RiftMapSave,
} from './riftMap';

describe('riftMap — dados', () => {
  it('tem 269 nós, na ordem da masmorra (base → pares → trios → quádruplos), 2 andares cada', () => {
    expect(RIFT_SET_COUNT).toBe(269);
    const nodes = riftMapWindow({}, 0, 999);
    expect(nodes).toHaveLength(269);
    nodes.forEach((n, i) => {
      expect(n.index).toBe(i);
      expect(n.element).toBe(ELEMENTOS_DA_MASMORRA[i]);
      expect(n.floors).toEqual([2 * i + 1, 2 * i + 2]);
      expect(n.label).toBe(`${2 * i + 1}-${2 * i + 2}`);
    });
    expect(nodes.slice(0, 20).every(n => n.count === 1)).toBe(true);
    expect(nodes[20].count).toBe(2);
    expect(nodes[268].count).toBe(4);
  });

  it('visitado = 1º andar ≤ recorde; o atual é o ponto de largada; o resto bloqueado', () => {
    const s: RiftMapSave = { dungeonDepthRecord: 9 }; // start = 9 → nó 4 (andares 9-10)
    expect(riftCurrentLayer(s)).toBe(9);
    const st = (i: number) => riftMapNode(i, s).state;
    expect([0, 1, 2, 3].map(st)).toEqual(['visited', 'visited', 'visited', 'visited']);
    expect(st(4)).toBe('current');
    expect(st(5)).toBe('locked');
    expect(riftMapNode(0, {}).state).toBe('current'); // save novo: o 1º nó
  });

  it('a descida em andamento manda no nó atual; depois do 538 a lista dá a volta', () => {
    expect(riftMapNode(3, { dungeonDepthRecord: 20, dungeonAway: { layer: 7 } }).state).toBe('current');
    expect(riftMapNode(0, { dungeonDepthRecord: 539, dungeonAway: { layer: 539 } }).state).toBe('current');
  });

  it('o caminho é determinístico, dentro da faixa segura, e o trecho tem curva', () => {
    for (let i = 0; i < 269; i++) { const x = riftNodeX(i); expect(x).toBeGreaterThan(0.2); expect(x).toBeLessThan(0.8); expect(riftNodeX(i)).toBe(x); }
    expect(new Set([0, 1, 2, 3, 4, 5].map(riftNodeX)).size).toBe(6);
    expect(riftSegmentPath(3, 360)).toBe(riftSegmentPath(3, 360));
    expect(riftSegmentPath(3, 360)).toMatch(/^M [\d.]+ [\d.]+ C /);
    expect(riftSegmentPath(268, 360)).toBeUndefined();
    expect(riftMapNode(268, {}).y).toBeLessThan(RIFT_MAP_HEIGHT);
  });

  it('o trecho é "percorrido" quando o nó de chegada não é bloqueado', () => {
    const s: RiftMapSave = { dungeonDepthRecord: 5 }; // start 5 → atual nó 2
    expect(riftSegmentReached(0, s)).toBe(true);
    expect(riftSegmentReached(1, s)).toBe(true);
    expect(riftSegmentReached(2, s)).toBe(false);
  });

  it('a janela virtualizada cobre só o que cruza a tela (+ folga)', () => {
    const r = riftVisibleRange(0, 640);
    expect(r.from).toBe(0);
    expect(r.to - r.from).toBeLessThan(15);
    const far = riftVisibleRange(20000, 640);
    expect(far.from).toBeGreaterThan(100);
    expect(riftVisibleRange(1e9, 640).to).toBe(268);
  });
});

describe('riftMap — voltar ao nó', () => {
  const base: RiftMapSave & { dungeonDepthRecord: number } = { dungeonDepthRecord: 21 }; // atual = 21 (nó 10)

  it('grava o ponto de largada; o recorde NÃO diminui; a descida largaria dali', () => {
    const n = rewindToSet(base, 2);
    expect(n.dungeonResumeLayer).toBe(5);
    expect(n.dungeonDepthRecord).toBe(21);
    expect(riftStartLayer(n)).toBe(5);
    expect(riftCurrentLayer(n)).toBe(5);
    expect(riftMapNode(2, n).state).toBe('current');
    expect(riftMapNode(10, n).state).toBe('visited'); // o ponto mais fundo segue visitado
  });

  it('é idempotente (mesmo nó = mesma referência) e recusa nó bloqueado, inválido ou com descida em andamento', () => {
    const n = rewindToSet(base, 2);
    expect(rewindToSet(n, 2)).toBe(n);
    expect(rewindToSet(base, 10)).toBe(base); // já é o ponto de largada
    expect(riftRewindRefusal(base, 11)).toBe('locked');
    expect(rewindToSet(base, 11)).toBe(base);
    expect(riftRewindRefusal(base, -1)).toBe('invalid');
    expect(riftRewindRefusal(base, 999)).toBe('invalid');
    const busy = { ...base, dungeonAway: { layer: 21 } };
    expect(riftRewindRefusal(busy, 2)).toBe('busy');
    expect(rewindToSet(busy, 2)).toBe(busy);
  });

  it('permite voltar a um nó visitado POSTERIOR ao atual (reposicionar)', () => {
    const n = rewindToSet(base, 2);
    const m = rewindToSet(n, 8); // 17 ≤ recorde 21, e é depois do atual (5)
    expect(m.dungeonResumeLayer).toBe(17);
    expect(m.dungeonDepthRecord).toBe(21);
  });

  it('consumir o ponto de largada devolve o recorde a mandar; sem campo, mesma referência', () => {
    const n = rewindToSet(base, 2);
    const c = consumeResume(n);
    expect(riftStartLayer(c)).toBe(startLayerFor(21));
    expect(consumeResume(base)).toBe(base);
  });

  it('o ponto de largada ruim (par, fora da faixa, não número) é ignorado; nunca passa do ponto de retorno', () => {
    expect(sanitizeResumeLayer(6)).toBeUndefined();
    expect(sanitizeResumeLayer(0)).toBeUndefined();
    expect(sanitizeResumeLayer(1000)).toBeUndefined();
    expect(sanitizeResumeLayer('5')).toBeUndefined();
    expect(sanitizeResumeLayer(5)).toBe(5);
    expect(riftStartLayer({ dungeonDepthRecord: 3, dungeonResumeLayer: 99 })).toBe(startLayerFor(3));
    expect(firstFloorOfSet(0)).toBe(1);
  });
});

describe('riftMap — dupla de andares (reforço do dono, 16/11/2026)', () => {
  it('1 nó por dupla: floors = [a, a+1] com a ímpar; nunca um nó por andar', () => {
    const nodes = riftMapWindow({}, 0, 999);
    expect(nodes.every(n => n.floors[0] % 2 === 1 && n.floors[1] === n.floors[0] + 1)).toBe(true);
    expect(new Set(nodes.map(n => n.floors[0])).size).toBe(269);
  });
  it('voltar a QUALQUER nó visitado sempre larga do 1º andar da dupla', () => {
    const s: RiftMapSave & { dungeonDepthRecord: number } = { dungeonDepthRecord: 60 };
    for (let i = 0; i < 29; i++) {
      const r = rewindToSet(s, i);
      expect(r.dungeonResumeLayer === undefined ? riftStartLayer(r) : r.dungeonResumeLayer).toBe(2 * i + 1);
      expect(riftStartLayer(r)).toBe(2 * i + 1);
    }
  });
  it('recorde no 2º andar da dupla: o nó conta como visitado e voltar = 1º andar', () => {
    const s: RiftMapSave & { dungeonDepthRecord: number } = { dungeonDepthRecord: 10 }; // nó 4 = andares 9-10
    expect(riftMapNode(4, s).state).toBe('visited');
    const r = rewindToSet(s, 4);
    expect(r.dungeonResumeLayer).toBe(9);
    expect(riftCurrentLayer(r)).toBe(9);
    expect(r.dungeonDepthRecord).toBe(10);
  });
});
