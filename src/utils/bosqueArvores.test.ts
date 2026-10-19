import { describe, it, expect } from 'vitest';
import {
  cicloDoDia, estacaoDoMes, nivelDoPlantio, registrarPlantio, nivelDaArvore, sanitizeBosqueArvores, aperfeicoadaDisponivel, type BosqueArvores,
} from './bosqueArvores';

const v = (season: 'outono' | 'inverno' | 'primavera' | 'verao', stage: number, mature = false, planted = true) => ({ season, stage, mature, planted });

describe('calendário do hemisfério sul', () => {
  it('mar–mai outono, jun–ago inverno, set–nov primavera, dez–fev verão', () => {
    const m = Array.from({ length: 12 }, (_, i) => estacaoDoMes(i + 1));
    expect(m).toEqual(['verao', 'verao', 'outono', 'outono', 'outono', 'inverno', 'inverno', 'inverno', 'primavera', 'primavera', 'primavera', 'verao']);
  });
  it('jan/fev pertencem ao verão que começou em dezembro', () => {
    expect(cicloDoDia('2027-01-15')).toEqual({ estacao: 'verao', ano: 2026 });
    expect(cicloDoDia('2026-12-01')).toEqual({ estacao: 'verao', ano: 2026 });
    expect(cicloDoDia('2027-04-01')).toEqual({ estacao: 'outono', ano: 2027 });
  });
});

describe('nível a partir do plantio', () => {
  it('sem planta 0; estágios 0..3 -> 1,2,3,3; madura -> 4', () => {
    expect(nivelDoPlantio(v('outono', 0, false, false))).toBe(0);
    expect([0, 1, 2, 3].map(s => nivelDoPlantio(v('outono', s)))).toEqual([1, 2, 3, 3]);
    expect(nivelDoPlantio(v('outono', 4, true))).toBe(4);
  });
});

describe('árvore aperfeiçoada (2º ano)', () => {
  it('lugar vazio sem registro; broto -> completa no 1º ano, nunca 5', () => {
    let s: BosqueArvores = {};
    expect(nivelDaArvore(s, 'outono')).toBe(0);
    s = registrarPlantio(s, v('outono', 0), '2026-03-10');
    expect(nivelDaArvore(s, 'outono')).toBe(1);
    s = registrarPlantio(s, v('outono', 2), '2026-04-10');
    expect(nivelDaArvore(s, 'outono')).toBe(3);
    s = registrarPlantio(s, v('outono', 4, true), '2026-05-20');
    expect(nivelDaArvore(s, 'outono')).toBe(4);
    s = registrarPlantio(s, v('outono', 4, true), '2026-05-25');
    expect(s.outono).toEqual({ nivel: 4, ciclo: 2026, completaEm: 2026 });
  });
  it('não recua o pico no mesmo ciclo', () => {
    let s = registrarPlantio({}, v('inverno', 2), '2026-07-01');
    s = registrarPlantio(s, v('inverno', 0), '2026-07-02');
    expect(nivelDaArvore(s, 'inverno')).toBe(3);
  });
  it('completa 2026 mantém 4 em 2027 até amadurecer de novo; aí vira 5 e fica', () => {
    let s = registrarPlantio({}, v('outono', 4, true), '2026-05-01');
    expect(aperfeicoadaDisponivel(s, 'outono', '2026-05-02')).toBe(false);
    expect(aperfeicoadaDisponivel(s, 'outono', '2027-03-02')).toBe(true);
    s = registrarPlantio(s, v('outono', 1), '2027-03-20');
    expect(nivelDaArvore(s, 'outono')).toBe(4);
    s = registrarPlantio(s, v('outono', 4, true), '2027-05-10');
    expect(nivelDaArvore(s, 'outono')).toBe(5);
    expect(s.outono?.perfeitaEm).toBe(2027);
    expect(registrarPlantio(s, v('outono', 4, true), '2027-05-11')).toBe(s);
    expect(nivelDaArvore(registrarPlantio(s, v('outono', 0), '2028-03-05'), 'outono')).toBe(5);
  });
  it('outra estação não adianta: completar o inverno não perfeiçoa o outono', () => {
    let s = registrarPlantio({}, v('outono', 4, true), '2026-05-01');
    s = registrarPlantio(s, v('inverno', 4, true), '2026-08-01');
    s = registrarPlantio(s, v('inverno', 4, true), '2027-08-01');
    expect(nivelDaArvore(s, 'outono')).toBe(4);
    expect(nivelDaArvore(s, 'inverno')).toBe(5);
  });
  it('verão de dez/2026..fev/2027 é UM ciclo: amadurecer em jan/2027 não perfeiçoa', () => {
    let s = registrarPlantio({}, v('verao', 4, true), '2026-12-20');
    s = registrarPlantio(s, v('verao', 4, true), '2027-01-20');
    expect(nivelDaArvore(s, 'verao')).toBe(4);
  });
  it('relógio atrasado ou vista de outra estação não mexe no save', () => {
    const s = registrarPlantio({}, v('outono', 4, true), '2027-05-01');
    expect(registrarPlantio(s, v('outono', 0), '2026-04-01')).toBe(s);
    expect(registrarPlantio(s, v('inverno', 2), '2027-05-02')).toBe(s);
  });
  it('dia fora do formato ISO (toDateString) nunca grava lixo', () => {
    const s = {};
    expect(registrarPlantio(s, v('outono', 4, true), 'Sun Oct 18 2026')).toBe(s);
  });
  it('sanitize: lixo vira vazio; perfeita sem completa anterior é descartada', () => {
    expect(sanitizeBosqueArvores(null)).toEqual({});
    expect(sanitizeBosqueArvores({ outono: { nivel: 9, ciclo: 2026, perfeitaEm: 2027 } })).toEqual({ outono: { nivel: 4, ciclo: 2026 } });
    const ok = { inverno: { nivel: 4, ciclo: 2027, completaEm: 2026, perfeitaEm: 2027 } };
    expect(sanitizeBosqueArvores(ok)).toEqual(ok);
    expect(sanitizeBosqueArvores(sanitizeBosqueArvores(ok))).toEqual(ok);
  });
});
