import { describe, it, expect } from 'vitest';
import { questMarks, strongestMark, questMarkLabel } from './questMarks';
import { MISSIONS } from './missions';

const zero = Object.fromEntries(MISSIONS.map(m => [m.id, 0]));
const cheio = Object.fromEntries(MISSIONS.map(m => [m.id, m.target]));
const base = { passeio: null, weekly: [], missionProgress: cheio, ownedBackgrounds: MISSIONS.map(m => m.bgReward) } as const;

describe('questMarks', () => {
  it('sem nada pendente, nenhuma marca', () => {
    expect(questMarks(base)).toEqual({ corner: null, passeio: null, daily: null, torneio: null, conquistas: null, cornerTone: 'gold', buildings: {}, firstDay: null });
  });
  it('permanente incompleta NÃO acende "!"; cumprida e cenário não comprado = "?"', () => {
    expect(questMarks({ ...base, missionProgress: zero, ownedBackgrounds: [] }).conquistas).toBeNull();
    expect(questMarks({ ...base, ownedBackgrounds: [] }).conquistas).toBe('ready');
  });
  it('semanal: andando "!", cumprida e não paga "?", paga some', () => {
    expect(questMarks({ ...base, weekly: [{ done: false, claimed: false }] }).torneio).toBe('available');
    expect(questMarks({ ...base, weekly: [{ done: true, claimed: false }] }).torneio).toBe('ready');
    expect(questMarks({ ...base, weekly: [{ done: true, claimed: true }] }).torneio).toBeNull();
  });
  it('passeio: missão do dia por fazer ou em andamento é "!"', () => {
    expect(questMarks({ ...base, passeio: 'available' }).passeio).toBe('available');
    expect(questMarks({ ...base, passeio: 'progress' }).passeio).toBe('available');
  });
  it('com as duas, o canto mostra "?"', () => {
    const r = questMarks({ ...base, passeio: 'available', weekly: [{ done: true, claimed: false }] });
    expect(r.corner).toBe('ready');
    expect(r.passeio).toBe('available');
  });
  it('tom: semanal é azul, o resto amarelo; o canto herda o da marca vencedora', () => {
    expect(questMarks({ ...base, weekly: [{ done: false, claimed: false }] }).cornerTone).toBe('blue');
    expect(questMarks({ ...base, passeio: 'available' }).cornerTone).toBe('gold');
    // "?" amarelo (conquista pronta) vence o "!" azul da semana.
    const r = questMarks({ ...base, ownedBackgrounds: [], weekly: [{ done: false, claimed: false }] });
    expect(r.corner).toBe('ready');
    expect(r.cornerTone).toBe('gold');
    // "?" azul (semanal pronta) vence o "!" amarelo do Passeio.
    const b = questMarks({ ...base, passeio: 'available', weekly: [{ done: true, claimed: false }] });
    expect(b.cornerTone).toBe('blue');
  });
  it('strongestMark e rótulos EN+PT', () => {
    expect(strongestMark([null, 'available', 'ready'])).toBe('ready');
    expect(questMarkLabel('ready', false)).toBe('Quest ready');
    expect(questMarkLabel('available', true)).toBe('Missão disponível');
    expect(questMarkLabel(null, true)).toBeNull();
  });
});

describe('o primeiro dia é missão (07/10/2026)', () => {
  it('"!" no ícone e na seção enquanto o cartão está de pé; nada quando não está', () => {
    const on = questMarks({ ...base, firstDay: true });
    expect(on.firstDay).toBe('available');
    expect(on.corner).toBe('available');
    expect(on.cornerTone).toBe('gold');
    expect(questMarks({ ...base, firstDay: false }).corner).toBeNull();
  });
});
