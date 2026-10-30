import { describe, it, expect } from 'vitest';
import { petElementOf } from './starterElements';
import { fighterIdentity } from './fighterIdentity';

// O corvinho do administrador é NEUTRO (dono, 20/10/2026): a ficha e o elemento dominante que sobraram do oráculo
// no save dele não mandam na aura, no perfil nem nas lutas.
const fichaDeFogo = {
  basica: { elementoId: 'fogo', escolaId: 'combate_fisico', tipo: 'basica' },
  especial: { elementoId: 'agua', escolaId: 'combate_fisico', tipo: 'especial' },
  elementoDominante: { id: 'fogo' },
} as never;

describe('corvinho neutro', () => {
  it('petElementOf: corvo → neutro, mesmo com dominante do oráculo no save', () => {
    expect(petElementOf({ soulmonMeta: { creature: 'corvo', dominantElement: 'fogo' } })).toBe('neutro');
  });
  it('petElementOf: quem não é corvo segue com o dominante do oráculo', () => {
    expect(petElementOf({ soulmonMeta: { dominantElement: 'fogo' } })).toBe('fogo');
    expect(petElementOf({ soulmonMeta: null })).toBeUndefined();
  });
  it('fighterIdentity: com o neutro do corvo, a ficha de fogo/água não decide', () => {
    const id = fighterIdentity(fichaDeFogo, petElementOf({ soulmonMeta: { creature: 'corvo' } }));
    expect(id.basico.elemento).toBe('neutro');
    expect(id.especial.elemento).toBe('neutro');
  });
  it('fighterIdentity: pet comum — o elemento do sprite manda nos golpes (30/10/2026); a ficha decide só a forma', () => {
    const id = fighterIdentity(fichaDeFogo, 'terra');
    expect(id.basico.elemento).toBe('terra');
    expect(id.especial.elemento).toBe('terra');
  });
});
