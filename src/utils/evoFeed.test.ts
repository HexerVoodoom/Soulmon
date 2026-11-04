import { describe, it, expect } from 'vitest';
import { enqueueEvo, evoText, isEvoStep, parseEvoStage, sanitizeEvoEvents } from './evoFeed';

describe('evoFeed (cliente)', () => {
  const ev = { name: 'Mateus', pet: 'Sombra', tier: 'champion', branch: 'harmony', at: 1 };
  it('a frase em PT e EN, com o gênero certo do alinhamento', () => {
    expect(evoText(ev, true)).toBe('Mateus acabou de evoluir Sombra para o nível Champion através da Harmonia');
    expect(evoText({ ...ev, branch: 'power' }, true)).toMatch(/através do Poder$/);
    expect(evoText({ ...ev, branch: 'benevolence' }, true)).toMatch(/através da Benevolência$/);
    expect(evoText(ev, false)).toBe('Mateus just evolved Sombra to the Champion level through Harmony');
    expect(evoText({ ...ev, tier: 'ultra', branch: null }, true)).toBe('Mateus acabou de evoluir Sombra para o nível Ultra');
  });
  it('isEvoStep: só sobe de tier a partir do Champion', () => {
    expect(isEvoStep('rookie', 'champion-power')).toBe(true);
    expect(isEvoStep('champion-power', 'champion-harmony')).toBe(false);
    expect(isEvoStep('mega-power', 'champion-power')).toBe(false);
    expect(isEvoStep('bb', 'rookie')).toBe(false);
    expect(parseEvoStage('champion-x')).toBeNull();
  });
  it('sanitizeEvoEvents descarta lixo, tira < > e nunca aceita tier/alinhamento fora da lista', () => {
    const r = sanitizeEvoEvents([ev, { ...ev, name: '<b>Eva</b>' }, { ...ev, tier: 'dragon' }, { ...ev, branch: 'x' }, null, 'x', { ...ev, at: 'nao' }, { ...ev, tier: 'rookie' }]);
    expect(r.map(e => e.name)).toEqual(['Mateus', 'bEva/b', 'Mateus']);
    expect(r[2].branch).toBeNull();
    expect(sanitizeEvoEvents('oi')).toEqual([]);
  });
  it('enqueueEvo: ordem de chegada, sem repetir o já visto, teto de 10', () => {
    let q = enqueueEvo([], new Set(), [ev]);
    q = enqueueEvo(q.queue, q.seen, [ev, { ...ev, name: 'Bia', at: 2 }]);
    expect(q.queue.map(e => e.name)).toEqual(['Mateus', 'Bia']);
    const muitos = Array.from({ length: 30 }, (_, i) => ({ ...ev, name: `P${i}`, at: i }));
    expect(enqueueEvo([], new Set(), muitos).queue).toHaveLength(10);
  });
});
