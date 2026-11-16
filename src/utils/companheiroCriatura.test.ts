// A tabela pequena de afinidades tem de ser o recorte fiel do snapshot do class-system; senão a criatura do simulado/NPC deriva.
import { describe, expect, it } from 'vitest';
import { AFINIDADES_CRIATURA, comCriaturaDoOponente, criaturaPorId } from './companheiroCriatura';
import { CRIATURAS_COMPANHEIRO, aplicarEvocacao } from './companheiroInvocado';
import { CLASS_DATA } from './soulProfile/ficha/buildSheet';
import type { DuelSide } from './combate/duel';
import { specialOf } from './combate/specials';
import { soulCombatant } from './soulXP';

describe('companheiroCriatura: recorte do class-system', () => {
  it('tem exatamente as 32 criaturas e as afinidades do snapshot', () => {
    expect(Object.keys(AFINIDADES_CRIATURA).sort()).toEqual([...CRIATURAS_COMPANHEIRO].sort());
    for (const [id, afins] of Object.entries(AFINIDADES_CRIATURA)) {
      expect([...afins]).toEqual([...CLASS_DATA.criaturas[id].afinidades]);
    }
  });
  it('é determinística, cai numa criatura de afinidade e usa as 32 se o elemento não tem nenhuma', () => {
    for (const el of ['fogo', 'agua', 'terra', 'luz', 'morte']) {
      const c = criaturaPorId('sim_0042', el);
      expect(criaturaPorId('sim_0042', el)).toBe(c);
      expect(AFINIDADES_CRIATURA[c]).toContain(el);
    }
    expect(CRIATURAS_COMPANHEIRO).toContain(criaturaPorId('x', 'elemento-inexistente'));
    expect(CRIATURAS_COMPANHEIRO).toContain(criaturaPorId('x'));
  });
});

describe('aplicarEvocacao: sem regravar à toa', () => {
  const derivado = { rookie: { evocador: true, arquetipoId: 'bokor' } };
  it('devolve a MESMA referência quando nada muda (save antigo sem o campo, derivado vazio ou já preenchido)', () => {
    const antigo: { soulmonEvocacao?: undefined; soulmonCompanheiro?: undefined; nome: string } = { nome: 'x' };
    expect(aplicarEvocacao(antigo, undefined, undefined)).toBe(antigo);
    const cheio = { soulmonEvocacao: { rookie: { evocador: false } }, soulmonCompanheiro: { id: 'lobo' } };
    expect(aplicarEvocacao(cheio, derivado, { id: 'urso' })).toBe(cheio); // primeiro valor vence
  });
  it('preenche o que falta, é idempotente e não muta a entrada', () => {
    const antigo: { soulmonEvocacao?: Record<string, unknown>; soulmonCompanheiro?: unknown } = {};
    const a = aplicarEvocacao(antigo, derivado, { id: 'lobo' });
    expect(a).toEqual({ soulmonEvocacao: derivado, soulmonCompanheiro: { id: 'lobo' } });
    expect(antigo).toEqual({});
    expect(aplicarEvocacao(a, derivado, { id: 'lobo' })).toBe(a);
  });
});

describe('comCriaturaDoOponente: o lado do servidor sem criatura (simulado)', () => {
  const base: DuelSide = { combatant: soulCombatant({ evolutionStage: 'rookie' }), special: specialOf('direct') };
  it('preenche a criatura de quem invoca e veio sem ela; o resto passa intacto', () => {
    const sim = { ...base, invoca: true };
    const r = comCriaturaDoOponente(sim, 'sim_0007', 'fogo');
    expect(r.companheiro).toBe(criaturaPorId('sim_0007', 'fogo'));
    expect(r.invoca).toBe(true);
    expect(comCriaturaDoOponente(base, 'sim_0007', 'fogo')).toBe(base);
    const real = { ...base, invoca: true, companheiro: 'urso' };
    expect(comCriaturaDoOponente(real, 'abc12345', 'fogo')).toBe(real);
  });
  it('não quebra sem id nem elemento', () => {
    const r = comCriaturaDoOponente({ ...base, invoca: true }, undefined, undefined);
    expect(CRIATURAS_COMPANHEIRO).toContain(r.companheiro);
  });
});
