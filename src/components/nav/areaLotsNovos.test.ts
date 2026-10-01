import { describe, it, expect } from 'vitest';
import { arenaLots, hallLots, laboratorioLots } from '../../utils/areaSheetCopy';
import { lotNpcVoice, areaNpcVoice } from '../../utils/areaNpcVoice';
import fs from 'node:fs';
import path from 'node:path';
import { lotNpcArt, AREA_NPC_ART, FUNCTION_NPC_ART } from '../../assets/soulmon/npcs';
import npcArenaDuelo from '../../assets/soulmon/npcs/npc-arena-duelo.png';
import { functionNpcVoice } from '../../utils/areaNpcVoice';

describe('lotes novos (29/09/2026)', () => {
  it('Arena tem Torneio, Duelo e Feira; Hall tem Biblioteca, Círculo de Amigos e Salão da Guilda', () => {
    expect(arenaLots('pt-BR').map(l => l.id)).toEqual(['torneio', 'duelo', 'feira']);
    expect(hallLots('pt-BR').map(l => l.id)).toEqual(['biblioteca', 'amigos', 'guilda']);
    expect(laboratorioLots('en-US').map(l => l.id)).toEqual(['evolucao', 'pet', 'stats']);
  });

  it('H15/H16/H17 (01/10/2026): Torneio e Duelo no mesmo tablado e a Feira no outro; Observatório bem maior; Hall maior', () => {
    const pct = (s?: string) => Number(String(s ?? '38%').replace('%', ''));
    const arena = Object.fromEntries(arenaLots('pt-BR').map(l => [l.id, l]));
    expect(pct(arena.torneio.left)).toBeLessThan(50);
    expect(pct(arena.duelo.left)).toBeLessThan(50);
    expect(pct(arena.feira.left)).toBeGreaterThan(60);
    const lab = Object.fromEntries(laboratorioLots('pt-BR').map(l => [l.id, l as { width?: string; top: string }]));
    expect(pct(lab.stats.width)).toBeGreaterThanOrEqual(pct(lab.evolucao.width) * 1.4);
    for (const id of ['evolucao', 'pet']) {
      expect(pct(lab[id].width)).toBeGreaterThan(38);
      expect(pct(lab[id].top)).toBeGreaterThan(54);
    }
    for (const l of hallLots('pt-BR')) expect(pct((l as { width?: string }).width)).toBeGreaterThan(38);
  });

  it('o rinoceronte é o NPC do Duelo, com voz própria nos dois idiomas', () => {
    expect(lotNpcArt('arena', 'duelo')).toBe(npcArenaDuelo);
    expect(lotNpcArt('arena', 'duelo')).not.toBe(AREA_NPC_ART.arena);
    expect(lotNpcVoice('arena', 'duelo', 'pt-BR').name).toContain('Rhinoco');
    expect(lotNpcVoice('arena', 'duelo', 'en-US').name).toContain('Rhinoco');
  });

  it('lote sem voz própria cai na voz da área; o Torneio segue com o Vultrak', () => {
    expect(lotNpcVoice('arena', 'torneio', 'pt-BR')).toEqual(areaNpcVoice('arena', 'pt-BR'));
    expect(lotNpcArt('arena', 'torneio')).toBe(AREA_NPC_ART.arena);
  });

  it('os 10 bustos de lote da leva npcs-flare (30/09/2026) são arte PRÓPRIA — nenhum placeholder no bundle', () => {
    const lotes: Array<[Parameters<typeof lotNpcArt>[0], string, string]> = [
      ['arena', 'duelo', 'Rhinoco'], ['arena', 'feira', 'Fanfare'], ['jogos', 'mente', 'Tessela'],
      ['jogos', 'refugio', 'Bobbi'], ['mercado', 'conquistas', 'Medra'], ['hall', 'amigos', 'Nino'],
      ['hall', 'guilda', 'Marla'], ['laboratorio', 'pet', 'Bento'], ['laboratorio', 'stats', 'Quill'],
      ['exploracao', 'passeio', 'Brume'],
    ];
    const artes = lotes.map(([a, l]) => lotNpcArt(a, l));
    expect(new Set(artes).size).toBe(lotes.length);
    for (const [a, l, nome] of lotes) {
      expect(lotNpcArt(a, l)).toMatch(new RegExp(`npc-${a}-${l}`));
      expect(Object.values(AREA_NPC_ART)).not.toContain(lotNpcArt(a, l));
      for (const lang of ['pt-BR', 'en-US'] as const) expect(lotNpcVoice(a, l, lang).name).toContain(nome);
    }
    const dir = path.resolve(__dirname, '../../assets/soulmon/npcs');
    expect(fs.readdirSync(dir).filter(f => f.includes('placeholder'))).toEqual([]);
    expect(fs.readFileSync(path.join(dir, 'index.ts'), 'utf8')).not.toMatch(/PLACEHOLDER_NPC_ART|poring/i);
  });

  it('o nome antigo do NPC do Meu Soulmon saiu: é Bento nos dois idiomas', () => {
    expect(lotNpcVoice('laboratorio', 'pet', 'pt-BR').name).toMatch(/^Bento/);
    expect(lotNpcVoice('laboratorio', 'pet', 'en-US').name).toMatch(/^Bento/);
  });

  it('os 6 NPCs de função têm arte própria e voz nos dois idiomas', () => {
    const nomes = { onboarding: 'Ambra', oraculo: 'Iris', conta: 'Faro', sono: 'Sona', cuidados: 'Nuri', config: 'Tobi' } as const;
    expect(new Set(Object.values(FUNCTION_NPC_ART)).size).toBe(6);
    for (const [id, nome] of Object.entries(nomes) as Array<[keyof typeof nomes, string]>) {
      expect(FUNCTION_NPC_ART[id]).toMatch(new RegExp(`npc-${id}`));
      for (const lang of ['pt-BR', 'en-US'] as const) {
        const v = functionNpcVoice(id, lang);
        expect(v.name).toBe(nome);
        expect(v.line.length).toBeGreaterThan(0);
        expect(v.line).not.toMatch(/\d/);
      }
    }
  });
});

describe('as bancas do Mercado têm nome próprio (01/10/2026)', () => {
  it('Itens é a Lamela e Decoração é a Lasca — não herdam mais o Grom', () => {
    for (const lang of ['pt-BR', 'en-US'] as const) {
      expect(lotNpcVoice('mercado', 'itens', lang).name).toMatch(/^Lamela/);
      expect(lotNpcVoice('mercado', 'decoracao', lang).name).toMatch(/^Lasca/);
      for (const l of ['itens', 'decoracao']) {
        const v = lotNpcVoice('mercado', l, lang);
        expect(v.name).not.toContain('Grom');
        expect(v.line).not.toMatch(/\d|Bits|!/);
      }
    }
  });
});
