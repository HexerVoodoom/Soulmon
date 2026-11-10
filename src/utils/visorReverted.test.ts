/**
 * SAVE REAL DO DONO (10/11/2026): sprites `ultimate-power` (original) e `ultimate-power@sabbat` DISTINTAS, `reverted: ['ultimate-power']`
 * (a original foi revertida uma vez, sem `previousSprites`). Equipar a original mostrava a arte do Sabá: a forma "revertida" ficava sem
 * arte no mapa e o app usava a alternativa no lugar. Agora: original → chave `ultimate-power`; Sabá → `ultimate-power@sabbat`.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { mapaDeSpritesProprios, spriteVisorOf } from './formasAlternativas';
import { getSpriteForStage, setOwnSprites } from './sprites';

afterEach(() => setOwnSprites({}));
const e = (url: string) => ({ url, formId: 'x', provider: 'higgsfield', at: 1 }) as any;
const lib = (reverted: string[]): any => ({
  sprites: { rookie: e('ROOKIE'), 'ultimate-power': e('PODER-ORIGINAL'), 'ultimate-power@sabbat': e('PODER-SABBAT'), 'ultimate-harmony': e('HARM'), 'ultimate-harmony@sabbat': e('HARM-SABBAT') },
  failures: {}, pendingTune: null, reverted,
});
const formas = { 'ultimate-power': ['original', 'sabbat'], 'ultimate-harmony': ['fada'] };
const arte = (l: any, equip: any, stage = 'ultimate-power') => {
  setOwnSprites(mapaDeSpritesProprios(spriteVisorOf(l, formas, equip)));
  return getSpriteForStage(stage);
};

describe('visor: original e Sabá mostram cada uma a SUA arte (mesmo com reverted)', () => {
  for (const reverted of [[], ['ultimate-power']]) {
    it(`reverted=${JSON.stringify(reverted)}`, () => {
      expect(arte(lib(reverted), { 'ultimate-power': 'original', 'ultimate-harmony': 'fada' })).toBe('PODER-ORIGINAL');
      expect(arte(lib(reverted), { 'ultimate-power': 'sabbat', 'ultimate-harmony': 'fada' })).toBe('PODER-SABBAT');
    });
  }
  it('a Harmonia (fada = 1ª da lista) mostra a própria arte, não a do Sabá', () => {
    expect(arte(lib(['ultimate-power']), { 'ultimate-power': 'sabbat', 'ultimate-harmony': 'fada' }, 'ultimate-harmony')).toBe('HARM');
  });
  it('forma sem arte própria e com alternativa usa a alternativa (nunca a Rookie)', () => {
    const l = lib([]); delete l.sprites['ultimate-power'];
    expect(arte(l, { 'ultimate-power': 'original' })).toBe('PODER-SABBAT');
  });
});
