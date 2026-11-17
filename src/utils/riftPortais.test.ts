import { describe, expect, it } from 'vitest';
import { RIFT_SET_COUNT } from './riftSets';
import {
  RIFT_PORTAL_COUNT, markPortalsSeen, parkAtPortal, riftPortalHere, riftPortalLayer, riftPortalNodeIndex, riftPortalOfLayer, riftPortalOfNode,
  riftPortalRedirect, riftPortalsUnlocked, riftTeleportRefusal, sanitizePortalsSeen, teleportToPortal, firstFloorOfSet, rewindToSet, type RiftMapSave,
} from './riftMap';

describe('portais do Rift (REGISTRO §471)', () => {
  it('um portal a cada 50 camadas: 10 portais, cada um no 2º andar do nó que contém a camada', () => {
    expect(RIFT_PORTAL_COUNT).toBe(10);
    expect(RIFT_SET_COUNT * 2).toBe(538);
    for (let k = 1; k <= 10; k++) {
      expect(riftPortalLayer(k)).toBe(50 * k);
      expect(riftPortalNodeIndex(k)).toBe(25 * k - 1);
      expect(firstFloorOfSet(riftPortalNodeIndex(k)) + 1).toBe(50 * k); // 50 é sempre o 2º andar do nó (49-50)
      expect(riftPortalOfNode(riftPortalNodeIndex(k))).toBe(k);
      expect(riftPortalOfLayer(50 * k)).toBe(k);
    }
    expect(riftPortalOfLayer(49)).toBeUndefined();
    expect(riftPortalOfLayer(550)).toBeUndefined();
    expect(riftPortalOfNode(0)).toBeUndefined();
  });
  it('desbloqueio sai do recorde, é um prefixo e é idempotente; save antigo (sem campo) funciona', () => {
    expect(riftPortalsUnlocked({})).toBe(0);
    expect(riftPortalsUnlocked({ dungeonDepthRecord: 49 })).toBe(0);
    expect(riftPortalsUnlocked({ dungeonDepthRecord: 50 })).toBe(1);
    expect(riftPortalsUnlocked({ dungeonDepthRecord: 999 })).toBe(10);
    const a = markPortalsSeen<RiftMapSave>({ dungeonDepthRecord: 120 });
    expect(a.riftPortalsSeen).toBe(2);
    expect(markPortalsSeen(a)).toBe(a);
    expect(sanitizePortalsSeen('x')).toBe(0);
    expect(sanitizePortalsSeen(99)).toBe(10);
    expect(sanitizePortalsSeen(-3)).toBe(0);
  });
  it('teleporte só de portal para portal liberado, sem descida em andamento', () => {
    const s = { dungeonDepthRecord: 150, dungeonResumeLayer: 49 }; // no nó do portal 50, com 50/100/150 liberados
    expect(riftPortalHere(s)).toBe(1);
    expect(riftTeleportRefusal(s, 3)).toBeUndefined();
    expect(riftTeleportRefusal(s, 4)).toBe('locked');
    expect(riftTeleportRefusal(s, 1)).toBe('same');
    expect(riftTeleportRefusal(s, 11)).toBe('invalid');
    expect(riftTeleportRefusal({ ...s, dungeonAway: { layer: 50 } }, 3)).toBe('busy');
    expect(riftTeleportRefusal({ dungeonDepthRecord: 150, dungeonResumeLayer: 51 }, 3)).toBe('not-at-portal');
    const t = teleportToPortal(s, 3);
    expect(t.dungeonResumeLayer).toBe(149); // 1º andar do nó do portal 150 (149-150)
    expect(t.dungeonDepthRecord).toBe(150); // recorde intacto
    expect(teleportToPortal(s, 4)).toBe(s);
    expect(teleportToPortal(s, 1)).toBe(s);
  });
  it('a descida para no portal só se há outro mais fundo liberado; parkAtPortal deixa o jogador no nó do portal', () => {
    expect(riftPortalRedirect({ dungeonDepthRecord: 50 }, 50)).toBeUndefined(); // o mais fundo: segue a descida
    expect(riftPortalRedirect({ dungeonDepthRecord: 100 }, 50)).toBe(1);
    expect(riftPortalRedirect({ dungeonDepthRecord: 100 }, 49)).toBeUndefined();
    const p = parkAtPortal<RiftMapSave>({ dungeonDepthRecord: 150 }, 2);
    expect(p.dungeonResumeLayer).toBe(99);
    expect(riftPortalHere(p)).toBe(2);
    expect(parkAtPortal(p, 2)).toBe(p);
  });
  it('"descer" sem o portal: o nó logo abaixo do portal vira o ponto de largada', () => {
    const s = { dungeonDepthRecord: 150, dungeonResumeLayer: 49 };
    const d = rewindToSet(s, riftPortalNodeIndex(1) + 1);
    expect(d.dungeonResumeLayer).toBe(51);
    expect(riftPortalHere(d)).toBeUndefined();
  });
});
