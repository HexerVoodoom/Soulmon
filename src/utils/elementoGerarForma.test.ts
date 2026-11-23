/** QA 10/11/2026: a poção vale só para a FORMA dela (não para a irmã do mesmo nível); "Gerar personagem" com leitura nova usa o elemento NOVO. */
import { describe, it, expect } from 'vitest';
import { elementoParaGerar, formasDasPocoes, pocoesDoEstado, stagesComElemento } from './elementoCombinado';

const RAW = 'Generate this RPG creature, on a solid flat pure #00FF00 chroma-green background (uniform), the creature itself contains no green and no green fringe: wolf.';
const mk = (branch: string) => ({ stage: 'champion', branch, imagePrompt: RAW, imagePromptFallback: RAW });
const stages = [mk('poder'), mk('harmonia')] as never[];
type P = { imagePrompt: string };

describe('poção só na forma dela', () => {
  const s = { evolutionStage: 'champion-power', potionElement: 'fada' };
  it('a irmã do mesmo nível NÃO herda o tema da poção', () => {
    const out = stagesComElemento(stages, undefined, pocoesDoEstado(s), 'sombra', formasDasPocoes(s)) as unknown as P[];
    expect(out[0].imagePrompt).toContain('Elemental theme of this form');
    expect(out[0].imagePrompt).toContain('Fairy');
    expect(out[1].imagePrompt).not.toContain('Elemental theme of this form');
    expect(out[1].imagePrompt).toContain('curling black smoke'); // cai no base do Soulmon
  });
  it('poção pendente do cristal vale só para a forma-destino', () => {
    const c = { evolutionStage: 'rookie', evolutionPotion: 'fada', evolutionCrystal: { from: 'rookie', to: 'champion-harmony' } };
    const out = stagesComElemento(stages, undefined, pocoesDoEstado(c), 'sombra', formasDasPocoes(c)) as unknown as P[];
    expect(out[0].imagePrompt).not.toContain('Elemental theme of this form');
    expect(out[1].imagePrompt).toContain('Elemental theme of this form');
  });
});

describe('Gerar personagem com leitura nova', () => {
  it('usa o elemento recém-lido e ignora o registro da criatura antiga', () => {
    const jornadaVelha = { v: 1 as const, u: 0.5, estagios: { champion: { id: 'terra', base: 'terra' } } };
    const novo = elementoParaGerar('sombra', jornadaVelha, 'terra');
    const out = stagesComElemento([mk('poder')] as never[], novo.jornada, undefined, novo.base) as unknown as P[];
    expect(out[0].imagePrompt).toContain('curling black smoke');
    expect(out[0].imagePrompt).not.toContain('rough stone and clay');
  });
  it('sem leitura nova nada muda', () => {
    const j = { v: 1 as const, u: 0.5, estagios: {} };
    expect(elementoParaGerar(undefined, j, 'terra')).toEqual({ jornada: j, base: 'terra' });
  });
});
