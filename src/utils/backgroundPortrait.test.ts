import { describe, it, expect } from 'vitest';
import { sceneCss, portraitUrl } from './backgroundPortrait';
import { PET_BACKGROUNDS } from './backgrounds';

describe('sceneCss', () => {
  const ids = ['bg-campina', 'bg-cavernas', 'bg-guild-clareira', 'bg-guild-ramagem', 'bg-guild-copa', 'bg-guild-mata', 'bg-guild-bosque-antigo', 'bg-arena-spotlight'];
  it('caixa vertical usa o retrato; horizontal ou sem medida usa a paisagem', () => {
    for (const id of ids) {
      expect(portraitUrl(id), id).toBeTruthy();
      expect(sceneCss(id, 100, 200)).toContain('portrait');
      expect(sceneCss(id, 200, 100)).toBe(PET_BACKGROUNDS[id].css);
      expect(sceneCss(id)).toBe(PET_BACKGROUNDS[id].css);
    }
  });
  it('sem retrato cai na paisagem', () => {
    expect(portraitUrl('bg-forest')).toBeUndefined();
    expect(sceneCss('bg-forest', 100, 200)).toBe(PET_BACKGROUNDS['bg-forest'].css);
  });
});
