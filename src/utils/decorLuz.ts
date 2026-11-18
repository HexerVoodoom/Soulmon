// Decoração que EMITE luz (REGISTRO §480). Fonte única: quem acende, onde fica o halo na caixa da peça e a cor.
// 'luz'  = acende de dia/acordado e APAGA quando o pet dorme (lâmpada, lanterna, fogueira, brasa).
// 'noite' = o contrário: discreto de dia, acende quando o pet dorme (bioluminescência; sem menção em texto nenhum).
export type DecorLuzModo = 'luz' | 'noite';
export type DecorLuzTom = 'fogo' | 'turquesa' | 'petala' | 'cogumelo';
export interface DecorLuz {
  modo: DecorLuzModo;
  tom: DecorLuzTom;
  /** Centro do halo na caixa da peça, em % (x,y), e diâmetro em % da menor lateral. */
  x: number; y: number; d: number;
}

export const DECOR_LUZ: Readonly<Record<string, DecorLuz>> = Object.freeze({
  'furn-lamp': { modo: 'luz', tom: 'turquesa', x: 50, y: 22, d: 110 },
  'furn-lantern': { modo: 'luz', tom: 'turquesa', x: 50, y: 55, d: 110 },
  'furn-campfire': { modo: 'luz', tom: 'turquesa', x: 50, y: 55, d: 130 },
  'furn-cerejeira-lanterna-de-petalas': { modo: 'luz', tom: 'petala', x: 50, y: 55, d: 110 },
  'furn-lava-altar-de-magma': { modo: 'luz', tom: 'fogo', x: 50, y: 40, d: 110 },
  'furn-lava-flor-de-brasa': { modo: 'luz', tom: 'fogo', x: 50, y: 40, d: 90 },
  'furn-mushrooms': { modo: 'noite', tom: 'cogumelo', x: 50, y: 55, d: 120 },
});

export function decorLuzAcesa(l: DecorLuz, dormindo: boolean): boolean {
  return l.modo === 'luz' ? !dormindo : dormindo;
}
