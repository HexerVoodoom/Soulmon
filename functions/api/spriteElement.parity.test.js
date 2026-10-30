// Paridade servidor × cliente do ELEMENTO DO SPRITE (dono, 30/10/2026): o fx publicado do oponente usa o elemento do sprite dele
// (inicial ou dominante do oráculo) no golpe básico E no especial; a ficha do save não decide o elemento.
import { describe, it, expect } from 'vitest';
import { duelSide, petElementDeSave, STARTER_ELEMENT as SERVER_STARTER } from './_duel.js';
import { STARTER_ELEMENT } from '../../src/utils/starterElements';
import { saveDoSimulado } from './_simulados.js';
import { SIMULADOS } from './_simulados.data.js';

const fichaDeOutroElemento = { rookie: { basica: { elementoId: 'vileza', escolaId: 'combate_fisico' }, especial: { elementoId: 'morte', escolaId: 'combate_fisico' }, elementoDominante: { id: 'morte' } } };

describe('elemento do sprite no servidor', () => {
  it('STARTER_ELEMENT é o mesmo do cliente', () => {
    expect({ ...SERVER_STARTER }).toEqual({ ...STARTER_ELEMENT });
  });
  it.each(['agua', 'fogo', 'terra', 'ar', 'sombra', 'luz', 'planta', 'industrial'])('oráculo %s: básico = especial = elemento', (el) => {
    const fx = duelSide({ evolutionStage: 'rookie', soulmonMeta: { dominantElement: el }, soulmonSkills: fichaDeOutroElemento }).fx;
    expect([fx.elBasica, fx.elEspecial]).toEqual([el, el]);
  });
  it('inicial manda sobre o oráculo; corvo é neutro (sem elemento publicado)', () => {
    const a = duelSide({ evolutionStage: 'rookie', demoCharacterId: 'meteoro', soulmonMeta: { dominantElement: 'agua' } }).fx;
    expect([a.elBasica, a.elEspecial]).toEqual(['fogo', 'fogo']);
    expect(petElementDeSave({ soulmonMeta: { creature: 'corvo', dominantElement: 'fogo' } })).toEqual({ el: null, neutro: true });
  });
  it('sem elemento no save, a ficha decide como antes', () => {
    const fx = duelSide({ evolutionStage: 'rookie', soulmonSkills: fichaDeOutroElemento }).fx;
    expect(fx.elBasica).toBe('morte');
  });
  it('simulados: o fx do duelo = o elemento do sprite (p.element) nos 50', () => {
    for (const p of SIMULADOS) {
      const fx = duelSide(saveDoSimulado(p, '2026-10-25')).fx;
      expect([p.id, fx.elBasica, fx.elEspecial]).toEqual([p.id, p.element, p.element]);
    }
  });
});
