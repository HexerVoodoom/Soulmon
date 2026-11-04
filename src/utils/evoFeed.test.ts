import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EVO_MAX_AGE_MS, enqueueEvo, evoText, freshEvoEvents, isEvoStep, parseEvoStage, sanitizeEvoEvents } from './evoFeed';

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
  it('sanitizeEvoEvents tira bidi e controle também no cliente', () => {
    expect(sanitizeEvoEvents([{ ...ev, pet: 'So\u202Embra\u0007' }])[0].pet).toBe('Sombra');
  });
  it('freshEvoEvents: só o mais novo que o visto, com até 1 h, e nunca a própria conta', () => {
    const now = 10 * EVO_MAX_AGE_MS;
    const e = (name: string, at: number) => ({ ...ev, name, at });
    const r = freshEvoEvents([e('visto', now - 100), e('novo', now - 50), e('velho', now - EVO_MAX_AGE_MS - 1), e('Eu', now - 10)], now - 100, now, 'Eu');
    expect(r.map(x => x.name)).toEqual(['novo']);
    expect(freshEvoEvents([e('limite', now - EVO_MAX_AGE_MS)], 0, now).map(x => x.name)).toEqual(['limite']);
  });
  it('CSS: o corte de movimento reduzido vem DEPOIS das regras que ele precisa vencer', () => {
    const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
    const corteVit = css.indexOf('.sm2-vit-chakra[data-ready="true"] { animation: none; }');
    const corteEvo = css.indexOf('.sm2-evo-run { animation: none; padding-left: 0; }');
    expect(corteVit).toBeGreaterThan(-1);
    expect(corteEvo).toBeGreaterThan(-1);
    expect(css.indexOf('animation: sm2-vit-glow')).toBeLessThan(corteVit);
    expect(css.indexOf('animation: sm2-evo-run')).toBeLessThan(corteEvo);
  });
});
