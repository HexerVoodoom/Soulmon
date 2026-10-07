/**
 * PARIDADE do Ferreiro entre o app (`src/utils/forge.ts`) e o servidor (`_forge.js`), a validacao do campo `forge` no `save.js` e o canal
 * de bonus do duelo (07/10/2026). Mudou tabela ou formula de um lado, mude os dois.
 */
import { describe, it, expect } from 'vitest';
import * as srv from './_forge.js';
import * as srvEq from './_equipment.js';
import * as app from '../../src/utils/forge';
import { equipAttrBonus, EQUIP_CATALOG } from '../../src/utils/equipment';
import { COMBAT_BONUS_CAP } from '../../src/utils/combate/bonus';

describe('as tabelas do servidor e as do app sao as MESMAS', () => {
  it('constantes, pecas, predios e materiais', () => {
    expect(srv.FORGE_MAX_LEVEL).toBe(app.FORGE_MAX_LEVEL);
    expect(srv.LEVEL_PCT).toEqual([...app.LEVEL_PCT]);
    expect(srv.PIECE_MAX_PCT).toBe(app.PIECE_MAX_PCT);
    expect(srv.PRIMARY_ATTR).toEqual(app.PRIMARY_ATTR);
    expect(srv.ALT_ATTR).toEqual(app.ALT_ATTR);
    expect(srv.LEGACY_LEVEL).toEqual([...app.LEGACY_LEVEL]);
    expect(srv.LEVEL_MIN_BOND).toEqual([...app.LEVEL_MIN_BOND]);
    expect(srv.UPGRADE_COST).toEqual(app.UPGRADE_COST);
    expect(srv.REDO_BITS).toBe(app.REDO_BITS);
    expect(srv.REDO_FRAGMENTS).toBe(app.REDO_FRAGMENTS);
    expect(Object.keys(srv.FORGE_PIECES).sort()).toEqual(app.FORGE_PIECES.map((p) => p.id).sort());
    expect(Object.keys(srv.FORGE_PIECES).sort()).toEqual(EQUIP_CATALOG.map((i) => i.id).sort());
    for (const p of app.FORGE_PIECES) expect(srv.FORGE_PIECES[p.id]).toEqual({ slot: p.slot, tier: p.tier });
  });

  it('sanear e o bonus batem em vetores gerados (inclusive lixo)', () => {
    const ids = [...app.FORGE_PIECES.map((p) => p.id), 'eq-xxx', '__proto__', 7, null, 'constructor'];
    let s = 424242;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 2 ** 32;
    const pick = () => ids[Math.floor(rnd() * ids.length)];
    for (let i = 0; i < 3000; i++) {
      const levels = {}; const picks = {};
      for (let j = 0; j < 6; j++) {
        const id = pick();
        if (typeof id === 'string') {
          levels[id] = [1, 2, 3, 4, 5, 0, 9, -1, NaN, 'x', 2.7][Math.floor(rnd() * 11)];
          picks[id] = Array.from({ length: Math.floor(rnd() * 6) }, () => ['a', 'b', 'z', 3][Math.floor(rnd() * 4)]);
        }
      }
      const forge = rnd() < 0.1 ? [null, 3, 'x', []][Math.floor(rnd() * 4)] : { levels, picks };
      expect(srv.sanitizeForge(forge), JSON.stringify(forge)).toEqual(app.sanitizeForge(forge));
      const equipped = { nucleo: pick(), carapaca: pick(), rastro: pick() };
      const raw = { owned: Array.from({ length: 6 }, pick), equipped, fragments: 0 };
      const a = srvEq.equipAttrBonus(raw, forge), b = equipAttrBonus(raw, forge);
      for (const k of ['atk', 'def', 'spd']) expect(a[k], k).toBeCloseTo(b[k], 12);
      expect(a.atk + a.def + a.spd).toBeLessThanOrEqual(3 * app.PIECE_MAX_PCT + 1e-12);
    }
  });

  it('o servidor reconfere o teto: qualquer save forjado rende no maximo 4,5% de equipamento, e o canal unico corta em 5%', () => {
    const forge = { levels: Object.fromEntries(app.FORGE_PIECES.map((p) => [p.id, 99])), picks: {} };
    const raw = { owned: app.FORGE_PIECES.map((p) => p.id), equipped: { nucleo: 'eq-nucleo-t3', carapaca: 'eq-carapaca-t3', rastro: 'eq-rastro-t3' }, fragments: 0 };
    const b = srvEq.equipAttrBonus(raw, forge);
    expect(b.atk + b.def + b.spd).toBeLessThan(COMBAT_BONUS_CAP);
  });
});
