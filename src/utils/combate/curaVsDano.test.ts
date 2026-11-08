/**
 * Pedido do dono (08/11/2026): "a cura está curando menos do que o dano do especial".
 * Regra travada: o especial de CURA vale pelo menos `CURA_MIN_DO_DANO` do especial de dano direto (mesmo orçamento E=3),
 * em todos os motores, e no espelho (PvP/régua) é exatamente igual. A cura NÃO pode voltar a ficar bem abaixo do dano.
 * O teto vem da janela de ±3pp de vitória (dungeon.v3 / efeitosPve.medicao): cura 1,0 na Masmorra sobe +7,8pp.
 */
import { describe, expect, it } from 'vitest';
import { PVE_FAMILY_POWER, SPECIAL_POWER } from './specials';

export const CURA_MIN_DO_DANO = 0.85;

describe('cura vs dano do especial', () => {
  it('espelho: cura = dano', () => {
    expect(SPECIAL_POWER.heal).toBe(SPECIAL_POWER.direct);
  });
  it.each(['arena', 'dungeon'] as const)('%s: cura >= %s do dano direto', (eng) => {
    expect(PVE_FAMILY_POWER[eng].heal / PVE_FAMILY_POWER[eng].direct).toBeGreaterThanOrEqual(CURA_MIN_DO_DANO);
  });
  it('Masmorra não passa de 0,92 do dano (senão estoura +3pp de vitória)', () => {
    expect(PVE_FAMILY_POWER.dungeon.heal / PVE_FAMILY_POWER.dungeon.direct).toBeLessThanOrEqual(0.92);
  });
});
