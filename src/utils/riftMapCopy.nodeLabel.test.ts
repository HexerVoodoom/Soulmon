import { describe, expect, it } from 'vitest';
import { nodeLabel } from './riftMapCopy';

describe('nodeLabel', () => {
  it('EN: andares + elemento', () => {
    expect(nodeLabel('7-8', 'Fire', false)).toEqual({ floors: 'Layers 7-8', element: 'Fire' });
  });
  it('PT: Camadas + elemento', () => {
    expect(nodeLabel('7-8', 'Fogo', true)).toEqual({ floors: 'Camadas 7-8', element: 'Fogo' });
  });
  it('andar único fica no singular', () => {
    expect(nodeLabel('7', 'Fogo', true).floors).toBe('Camada 7');
  });
});
