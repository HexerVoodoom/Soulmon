import { describe, it, expect } from 'vitest';
import { arenaLots, hallLots, laboratorioLots } from '../../utils/areaSheetCopy';
import { lotNpcVoice, areaNpcVoice } from '../../utils/areaNpcVoice';
import { lotNpcArt, PLACEHOLDER_NPC_ART, AREA_NPC_ART } from '../../assets/soulmon/npcs';

describe('lotes novos (29/09/2026)', () => {
  it('Arena tem Torneio, Duelo e Feira; Hall tem Biblioteca, Círculo de Amigos e Salão da Guilda', () => {
    expect(arenaLots('pt-BR').map(l => l.id)).toEqual(['torneio', 'duelo', 'feira']);
    expect(hallLots('pt-BR').map(l => l.id)).toEqual(['biblioteca', 'amigos', 'guilda']);
    expect(laboratorioLots('en-US').map(l => l.id)).toEqual(['evolucao', 'pet', 'stats']);
  });

  it('o rinoceronte é o NPC do Duelo, com voz própria nos dois idiomas', () => {
    expect(lotNpcArt('arena', 'duelo')).toBe(PLACEHOLDER_NPC_ART.rinoceronte);
    expect(lotNpcVoice('arena', 'duelo', 'pt-BR').name).toContain('Rhinoco');
    expect(lotNpcVoice('arena', 'duelo', 'en-US').name).toContain('Rhinoco');
  });

  it('lote sem voz própria cai na voz da área; o Torneio segue com o Vultrak', () => {
    expect(lotNpcVoice('arena', 'torneio', 'pt-BR')).toEqual(areaNpcVoice('arena', 'pt-BR'));
    expect(lotNpcArt('arena', 'torneio')).toBe(AREA_NPC_ART.arena);
  });
});
