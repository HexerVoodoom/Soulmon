/**
 * SAVE REAL DO DONO (10/11/2026, anonimizado): Soulmon de base Sombra, poção Fada em Harmonia (Ultimate), estágio Ultimate registrado
 * como Sabá. Os snapshots de `ultimate-power@original` e `ultimate-power@sabbat` guardavam `pocao: 'fada'` — a poção da forma de
 * ONDE ele veio, gravada por cima (comportamento antigo: forma sem foto herdava a poção e a fotografava ao sair). Resultado: trocar
 * para a original do Poder restaurava Fada e "nada mudava". A poção só pertence à forma cujo elemento é ela.
 */
import { describe, it, expect } from 'vitest';
import { capturarForma, sanitizeFormaSnapshots } from './formaSnapshot';
import { trocarFormaEstado, type EstadoDeForma } from './formaEquip';
import { petElementOf } from './starterElements';

const SABBAT = { id: 'sabbat', base: 'sombra' };
const snapshotsDoDono = {
  'champion-benevolence': { pocao: 'vileza' },
  'ultimate-harmony@fada': { pocao: 'fada', elemento: SABBAT },
  'ultimate-power@sabbat': { pocao: 'fada', elemento: SABBAT },
  'ultimate-power@original': { pocao: 'fada', elemento: SABBAT },
};
const salvoDoDono = (snaps: unknown): EstadoDeForma & { unlockedEvolutions: string[] } => ({
  evolutionStage: 'ultimate-harmony',
  unlockedEvolutions: ['rookie', 'champion-harmony', 'champion-power', 'ultimate-harmony', 'ultimate-power'],
  potionElement: 'fada',
  elementoJornada: { v: 1, u: 0.5, estagios: { ultimate: SABBAT } },
  soulmonMeta: { dominantElement: 'sombra' },
  formasAlt: { 'ultimate-power': ['original', 'sabbat'], 'ultimate-harmony': ['fada'] },
  formaAltEquipada: { 'ultimate-power': 'sabbat', 'ultimate-harmony': 'fada' },
  formaSnapshots: snaps as never,
} as never);

describe('save real: snapshots contaminados pela poção de outra forma', () => {
  it('mesmo com snapshots crus, a original do Poder é o elemento BASE (regra da original)', () => {
    const cru = salvoDoDono(snapshotsDoDono);
    const poder = trocarFormaEstado(cru, 'ultimate-power', 'original');
    expect(poder.formaAltEquipada?.['ultimate-power']).toBe('original');
    expect(petElementOf(poder as never)).toBe('sombra');
  });
  it('a migração (leitura tolerante) tira a poção que não é da forma', () => {
    const s = sanitizeFormaSnapshots(snapshotsDoDono)!;
    expect(s['ultimate-power@original'].pocao).toBeUndefined();
    expect(s['ultimate-power@sabbat'].pocao).toBeUndefined();
    expect(s['ultimate-harmony@fada'].pocao).toBe('fada'); // a poção é da Harmonia: fica
    expect(s['champion-benevolence'].pocao).toBe('vileza'); // chave sem elemento: não mexe
    expect(s['ultimate-power@original'].elemento).toBeUndefined(); // original = base: sem elemento combinado
  });
  it('com o save migrado: a original do Poder é Sombra, a Sabá é Sabá, e Harmonia segue Fada', () => {
    const migrado = salvoDoDono(sanitizeFormaSnapshots(snapshotsDoDono));
    const original = trocarFormaEstado(migrado, 'ultimate-power', 'original');
    expect(original.evolutionStage).toBe('ultimate-power');
    expect(original.formaAltEquipada?.['ultimate-power']).toBe('original');
    expect(petElementOf(original as never)).toBe('sombra');
    const sabba = trocarFormaEstado(migrado, 'ultimate-power', 'sabbat');
    expect(petElementOf(sabba as never)).toBe('sabbat');
    const volta = trocarFormaEstado(original, 'ultimate-harmony', 'fada');
    expect(petElementOf(volta as never)).toBe('fada');
  });
  it('captura nova: a poção só é fotografada na forma cujo elemento equipado é ela', () => {
    const naOriginal = capturarForma({ ...salvoDoDono(undefined), evolutionStage: 'ultimate-power' } as never) as never as { formaSnapshots: Record<string, { pocao?: string }> };
    expect(naOriginal.formaSnapshots['ultimate-power@sabbat'].pocao).toBeUndefined(); // equipada sabbat ≠ poção fada
    const naHarmonia = capturarForma(salvoDoDono(undefined) as never) as never as { formaSnapshots: Record<string, { pocao?: string }> };
    expect(naHarmonia.formaSnapshots['ultimate-harmony@fada'].pocao).toBe('fada');
  });
});
