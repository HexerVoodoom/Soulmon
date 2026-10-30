import { describe, it, expect } from 'vitest';
import { lotNpcArt, AREA_NPC_ART } from '../../assets/soulmon/npcs';
import { MERCADO_LOT_ART } from '../../assets/soulmon/areas';
import { lotNpcVoice } from '../../utils/areaNpcVoice';
import { mercadoLots } from '../../utils/areaSheetCopy';
import { BUILDING_GATES } from '../../utils/gates';
import { firstTimesFor } from '../../utils/dailyMissions';
import { MAP_TOUR_STEPS } from '../../utils/welcomeTour';

describe('Restaurante em obra (14/10/2026): só vitrine, sem ação', () => {
  it('é um lote do Mercado com arte e com o NPC próprio (Brickle), nos dois idiomas', () => {
    expect(mercadoLots('pt-BR').map(l => l.id)).toContain('restaurante');
    expect(MERCADO_LOT_ART.restaurante).toBeTruthy();
    expect(lotNpcArt('mercado', 'restaurante')).toMatch(/npc-mercado-restaurante/);
    expect(Object.values(AREA_NPC_ART)).not.toContain(lotNpcArt('mercado', 'restaurante'));
    expect(lotNpcVoice('mercado', 'restaurante', 'pt-BR').name).toContain('Brickle');
    expect(lotNpcVoice('mercado', 'restaurante', 'pt-BR').line).toMatch(/em obra/i);
    expect(lotNpcVoice('mercado', 'restaurante', 'en-US').line).toMatch(/under construction/i);
  });

  it('não é prédio de missão nem tem Vínculo mínimo: fora de BUILDING_GATES e das primeiras vezes', () => {
    expect(Object.keys(BUILDING_GATES)).not.toContain('mercado.restaurante');
    for (const bond of [1, 3, 6]) expect(firstTimesFor(bond).map(f => String(f.building))).not.toContain('mercado.restaurante');
  });

  it('o tutorial do mapa lista o Restaurante como "em obra"', () => {
    const rows = MAP_TOUR_STEPS.find(s => s.id === 'map-mercado')!.areas!;
    const r = rows.find(x => x.name.en === 'Restaurant')!;
    expect(r.line.pt).toMatch(/em obra/i);
    expect(r.line.en).toMatch(/construction/i);
  });

  it('Cambista (30/10/2026): lote do Mercado no canto de baixo à esquerda, fora dos portões, com NPC e fala nos dois idiomas', () => {
    const l = mercadoLots('pt-BR').find(x => x.id === 'cambista') as { left: string; top: string };
    expect(l).toBeTruthy();
    expect(l.left).toBe('26%');
    expect(MERCADO_LOT_ART.cambista).toBeTruthy();
    expect(lotNpcArt('mercado', 'cambista')).toBeTruthy();
    expect(lotNpcVoice('mercado', 'cambista', 'pt-BR').name).toContain('Farthing');
    expect(lotNpcVoice('mercado', 'cambista', 'en-US').line).toMatch(/Credits/);
    expect(Object.keys(BUILDING_GATES)).not.toContain('mercado.cambista');
  });
});
