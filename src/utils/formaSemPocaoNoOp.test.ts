/**
 * REGRA DO DONO (10/11/2026): nada muda para contas que nunca usaram poção. As migrações/regras de poção e da forma original só agem
 * com a assinatura do problema (poção ativa ou foto com poção); conta sem poção passa byte a byte idêntica e é no-op.
 */
import { describe, it, expect } from 'vitest';
import { sanitizeFormaSnapshots, capturarForma } from './formaSnapshot';
import { curarPocaoOrfa } from './elementPotion';
import { trocarFormaEstado, equiparFormaAltEstado, type EstadoDeForma } from './formaEquip';

const SNAPS_SEM_POCAO = {
  'ultimate-power@original': { elemento: { id: 'terra', base: 'terra' }, skills: { basico: { nome: 'a' }, especial: { nome: 'b' } } },
  'ultimate-power@terra': { elemento: { id: 'terra', base: 'terra' } },
  'champion-power': {},
};
const contaSemPocao = (): EstadoDeForma & { unlockedEvolutions: string[] } => ({
  evolutionStage: 'ultimate-harmony',
  unlockedEvolutions: ['rookie', 'champion-power', 'ultimate-harmony', 'ultimate-power'],
  elementoJornada: { v: 1, u: 0.5, estagios: { ultimate: { id: 'terra', base: 'terra' } } },
  soulmonMeta: { dominantElement: 'terra' },
  formasAlt: { 'ultimate-power': ['original', 'terra'] },
  formaAltEquipada: { 'ultimate-power': 'terra', 'ultimate-harmony': 'terra' },
  formaSnapshots: SNAPS_SEM_POCAO as never,
} as never);

describe('conta que nunca usou poção: migração e regras são no-op', () => {
  it('as fotos passam pela leitura byte a byte idênticas', () => {
    const lido = sanitizeFormaSnapshots(JSON.parse(JSON.stringify(SNAPS_SEM_POCAO)));
    expect(JSON.stringify(lido)).toBe(JSON.stringify(SNAPS_SEM_POCAO));
  });
  it('idempotente: ler duas vezes dá o mesmo', () => {
    const a = sanitizeFormaSnapshots(SNAPS_SEM_POCAO);
    expect(JSON.stringify(sanitizeFormaSnapshots(a))).toBe(JSON.stringify(a));
  });
  it('sem poção: nada a curar', () => {
    expect(curarPocaoOrfa(undefined, 'ultimate-power', { 'ultimate-power': 'terra' })).toBeUndefined();
  });
  it('equipar/trocar para a original sem poção NÃO muda o elemento nem as fotos de outras formas', () => {
    const s = contaSemPocao();
    const volta = trocarFormaEstado(s, 'ultimate-power', 'original');
    expect(volta.potionElement).toBeUndefined();
    expect(volta.elementoJornada).toEqual(s.elementoJornada);
    expect(volta.formaSnapshots?.['ultimate-power@original']).toEqual(SNAPS_SEM_POCAO['ultimate-power@original']);
    expect(equiparFormaAltEstado({ ...volta, evolutionStage: 'ultimate-power' }, 'ultimate-power', 'terra').potionElement).toBeUndefined();
  });
  it('capturar a forma original sem poção mantém o elemento na foto (como sempre)', () => {
    const s = { ...contaSemPocao(), evolutionStage: 'ultimate-power', formaAltEquipada: { 'ultimate-power': 'original' } };
    expect((capturarForma(s as never) as { formaSnapshots?: Record<string, { elemento?: unknown }> }).formaSnapshots?.['ultimate-power@original']?.elemento).toEqual({ id: 'terra', base: 'terra' });
  });
});
