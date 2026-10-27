import { describe, it, expect } from 'vitest';
import { planejar, decidir } from '../../scripts/simulados-sprites-aplicar.mjs';

const T = 'e5857867b2921099ca8c94aa6ccab5af';
const URL_ = `/api/sprite-image?k=${T}`;
describe('aplicar sprites dos simulados (script manual)', () => {
  it('valida o mapeamento', () => {
    expect(planejar([{ id: 'sim_0020', token: T }])).toEqual([{ id: 'sim_0020', url: URL_ }]);
    expect(() => planejar([{ id: 'real', token: T }])).toThrow();
    expect(() => planejar([{ id: 'sim_0020', token: 'zz' }])).toThrow();
  });
  it('é idempotente: com tudo gravado não escreve nada', () => {
    const perfil = JSON.stringify({ simulated: true, spriteUrl: URL_ });
    expect(decidir({ url: URL_, spriteKey: URL_, perfilRaw: perfil })).toEqual({ putSprite: false, perfil: null });
  });
  it('reescreve só perfil de simulado defasado', () => {
    const d = decidir({ url: URL_, spriteKey: null, perfilRaw: JSON.stringify({ simulated: true, artLine: 'igni' }) });
    expect(d.putSprite).toBe(true);
    expect(d.perfil).toMatchObject({ spriteUrl: URL_, artLine: 'igni', simSig: '' });
    expect(decidir({ url: URL_, spriteKey: URL_, perfilRaw: JSON.stringify({ name: 'real' }) }).perfil).toBeNull();
  });
});
